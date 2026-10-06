import { readFileSync } from "node:fs";
import path from "node:path";
import { generateStars, starfieldVertexCount } from "@/lib/starfield";
import {
  CAMERA_DEFAULT_POSITION,
  CAMERA_FOV,
  CAMERA_MAX_DISTANCE,
  CAMERA_MIN_DISTANCE,
  NEBULA_CLOUDS,
  QUALITY_PRESETS,
  STARFIELD_BAND_RATIO,
  STARFIELD_INNER_RATIO,
  STARFIELD_RADIUS,
} from "@/lib/constants";

const shader = (name: string) =>
  readFileSync(path.join(process.cwd(), "src/lib/shaders", name), "utf8");

describe("starfield generator (Phase 2)", () => {
  const stars = generateStars({ count: 1200, seed: "unit-test" });

  it("returns exactly the requested number of stars", () => {
    expect(stars.count).toBe(1200);
    expect(starfieldVertexCount(stars)).toBe(1200);
    expect(stars.positions).toHaveLength(1200 * 3);
    expect(stars.colors).toHaveLength(1200 * 3);
    expect(stars.sizes).toHaveLength(1200);
    expect(stars.phases).toHaveLength(1200);
  });

  it("is deterministic — the same seed paints the same sky", () => {
    const again = generateStars({ count: 1200, seed: "unit-test" });
    expect(Array.from(again.positions)).toEqual(Array.from(stars.positions));
    expect(Array.from(again.colors)).toEqual(Array.from(stars.colors));
  });

  it("differs when the seed changes", () => {
    const other = generateStars({ count: 1200, seed: "other-seed" });
    expect(Array.from(other.positions)).not.toEqual(Array.from(stars.positions));
  });

  it("accepts numeric seeds too", () => {
    const a = generateStars({ count: 64, seed: 42 });
    const b = generateStars({ count: 64, seed: 42 });
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
  });

  it("places every star inside the shell and clear of the camera's reach", () => {
    const min = STARFIELD_RADIUS * STARFIELD_INNER_RATIO;
    for (let i = 0; i < stars.count; i++) {
      const r = Math.hypot(
        stars.positions[i * 3],
        stars.positions[i * 3 + 1],
        stars.positions[i * 3 + 2]
      );
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(min - 1e-3);
      expect(r).toBeLessThanOrEqual(STARFIELD_RADIUS + 1e-3);
      // Nothing may sit closer than the camera's maximum zoom-out, or stars
      // would fly past the viewer.
      expect(r).toBeGreaterThan(CAMERA_MAX_DISTANCE);
    }
  });

  it("keeps colours and sizes in valid ranges", () => {
    for (let i = 0; i < stars.count; i++) {
      for (let c = 0; c < 3; c++) {
        const channel = stars.colors[i * 3 + c];
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
      expect(stars.sizes[i]).toBeGreaterThan(0);
      expect(stars.sizes[i]).toBeLessThanOrEqual(2.41);
      expect(stars.phases[i]).toBeGreaterThanOrEqual(0);
      expect(stars.phases[i]).toBeLessThan(1);
    }
  });

  it("biases brightness — most stars are small, a few are giants", () => {
    // The distribution is `0.7 + random()³ · 1.7`, so the bulk sits near the
    // floor and only the top ~10% of the random range produces giants.
    const small = Array.from(stars.sizes).filter((s) => s < 1.2).length;
    const giants = Array.from(stars.sizes).filter((s) => s > 2).length;
    expect(small / stars.count).toBeGreaterThan(0.55);
    expect(giants).toBeGreaterThan(0);
    expect(giants / stars.count).toBeLessThan(0.15);
  });

  it("gathers a band of stars toward a plane (Milky Way illusion)", () => {
    // Compare the spread of |y| for band stars vs the rest. Band stars are
    // generated first, so the split index is count * bandRatio.
    const bandCount = Math.floor(stars.count * STARFIELD_BAND_RATIO);
    const meanAbsY = (from: number, to: number) => {
      let sum = 0;
      for (let i = from; i < to; i++) sum += Math.abs(stars.positions[i * 3 + 1]);
      return sum / (to - from);
    };
    expect(meanAbsY(0, bandCount)).toBeLessThan(meanAbsY(bandCount, stars.count));
  });

  it("honours a custom radius and band ratio", () => {
    const custom = generateStars({ count: 200, radius: 50, bandRatio: 0 });
    for (let i = 0; i < custom.count; i++) {
      const r = Math.hypot(
        custom.positions[i * 3],
        custom.positions[i * 3 + 1],
        custom.positions[i * 3 + 2]
      );
      expect(r).toBeLessThanOrEqual(50 + 1e-3);
    }
  });

  it("handles zero stars without producing NaN geometry", () => {
    const empty = generateStars({ count: 0 });
    expect(empty.count).toBe(0);
    expect(empty.positions).toHaveLength(0);
  });
});

describe("starfield shaders (Phase 2)", () => {
  const vert = shader("starfield.vert");
  const frag = shader("starfield.frag");

  it("declares the attributes the generator uploads", () => {
    for (const attribute of ["aSize", "aPhase", "aColor"]) {
      expect(vert).toMatch(new RegExp(`attribute\\s+(float|vec3)\\s+${attribute}\\s*;`));
    }
  });

  it("declares every uniform the material writes each frame", () => {
    expect(vert).toContain("uniform float uTime");
    expect(vert).toContain("uniform float uScale");
    expect(vert).toContain("uniform float uTwinkle");
    expect(frag).toContain("uniform float uOpacity");
  });

  it("passes colour and brightness through to the fragment stage", () => {
    expect(vert).toContain("varying vec3 vColor");
    expect(frag).toContain("varying vec3 vColor");
    expect(vert).toContain("varying float vBrightness");
    expect(frag).toContain("varying float vBrightness");
  });

  it("writes gl_Position and a point size", () => {
    expect(vert).toContain("gl_Position");
    expect(vert).toContain("gl_PointSize");
    expect(frag).toContain("gl_FragColor");
  });

  it("discards outside the round sprite so points are not squares", () => {
    expect(frag).toContain("discard");
    expect(frag).toContain("gl_PointCoord");
  });

  it("stays in GLSL ES 1.0 — no modern-only syntax", () => {
    for (const source of [vert, frag]) {
      expect(source).not.toContain("#version 300");
      expect(source).not.toMatch(/\bin\s+vec[234]\s+\w+\s*;/);
      expect(source).not.toMatch(/\bout\s+vec4\s+\w+\s*;/);
      expect(source).not.toMatch(/\btexture\s*\(/);
    }
  });

  it("has balanced braces", () => {
    for (const source of [vert, frag]) {
      const open = (source.match(/{/g) ?? []).length;
      const close = (source.match(/}/g) ?? []).length;
      expect(open).toBe(close);
      expect(open).toBeGreaterThan(0);
    }
  });
});

describe("scene constants (Phase 2)", () => {
  it("keeps the quality tiers ordered by cost", () => {
    expect(QUALITY_PRESETS.low.stars).toBeLessThan(QUALITY_PRESETS.medium.stars);
    expect(QUALITY_PRESETS.medium.stars).toBeLessThan(QUALITY_PRESETS.high.stars);
    expect(QUALITY_PRESETS.low.postProcessing).toBe(false);
    expect(QUALITY_PRESETS.medium.postProcessing).toBe(true);
  });

  it("clamps DPR per tier so low-end devices are not over-rendered", () => {
    expect(QUALITY_PRESETS.low.pixelRatio[1]).toBeLessThanOrEqual(1.25);
    expect(QUALITY_PRESETS.high.pixelRatio[1]).toBeLessThanOrEqual(2);
  });

  it("ships a camera the user cannot lose the scene with", () => {
    expect(CAMERA_MIN_DISTANCE).toBeLessThan(CAMERA_MAX_DISTANCE);
    // Default framing sits inside the allowed zoom range…
    const restingDistance = Math.hypot(...CAMERA_DEFAULT_POSITION);
    expect(restingDistance).toBeGreaterThan(CAMERA_MIN_DISTANCE);
    expect(restingDistance).toBeLessThan(CAMERA_MAX_DISTANCE);
    // …and the starfield is far outside it, so stars never reach the camera.
    expect(STARFIELD_RADIUS).toBeGreaterThan(CAMERA_MAX_DISTANCE * 3);
    expect(CAMERA_FOV).toBeGreaterThan(30);
    expect(CAMERA_FOV).toBeLessThan(90);
  });

  it("positions every nebula cloud behind the planets", () => {
    expect(NEBULA_CLOUDS.length).toBeGreaterThanOrEqual(3);
    for (const cloud of NEBULA_CLOUDS) {
      const distance = Math.hypot(...cloud.position);
      expect(distance).toBeGreaterThan(CAMERA_MAX_DISTANCE * 2);
      expect(distance).toBeLessThan(STARFIELD_RADIUS * 1.2);
      expect(cloud.opacity).toBeGreaterThan(0);
      expect(cloud.opacity).toBeLessThan(0.35);
      expect(cloud.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("has unique nebula ids so React keys stay stable", () => {
    const ids = NEBULA_CLOUDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
