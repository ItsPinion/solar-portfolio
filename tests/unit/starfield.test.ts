/**
 * Phase 2 unit tests — starfield generation and the constants that shape it.
 *
 * `generateStars` is pure (seeded PRNG), so the whole sky can be asserted
 * deterministically without a GPU or a browser.
 */
import {
  FOG_DENSITY,
  QUALITY_PRESETS,
  STAR_RADIANCE_MAX,
  STAR_RADIANCE_MIN,
  STAR_SIZE_RANGE,
  STAR_SIZE_SCALE,
  STARFIELD_BAND_FRACTION,
  STARFIELD_BAND_TILT_DEG,
  STARFIELD_INNER_FRACTION,
  STARFIELD_RADIUS,
} from "@/lib/constants";

// The component imports GLSL + three, which jest can't transform; the
// generator itself is what we test. It is re-implemented here through a
// dynamic import of the module's exported helper by mocking the shader files.
jest.mock("@/lib/shaders/starfield.vert.glsl", () => "void main() {}");
jest.mock("@/lib/shaders/starfield.frag.glsl", () => "void main() {}");

import { generateStars } from "@/components/canvas/Starfield";

const COUNT = 2000;

describe("starfield constants", () => {
  it("keeps the star size range ordered and sane", () => {
    expect(STAR_SIZE_RANGE[0]).toBeLessThan(STAR_SIZE_RANGE[1]);
    expect(STAR_SIZE_RANGE[0]).toBe(0.01);
    expect(STAR_SIZE_RANGE[1]).toBe(0.05);
    expect(STAR_SIZE_SCALE).toBeGreaterThan(0);
  });

  it("keeps the radiance range ordered (HDR values)", () => {
    expect(STAR_RADIANCE_MIN).toBeGreaterThan(0);
    expect(STAR_RADIANCE_MAX).toBeGreaterThan(STAR_RADIANCE_MIN);
  });

  it("every quality tier sits inside the plan's 3000–8000 star budget", () => {
    for (const preset of Object.values(QUALITY_PRESETS)) {
      expect(preset.stars).toBeGreaterThanOrEqual(3000);
      expect(preset.stars).toBeLessThanOrEqual(8000);
    }
  });

  it("the starfield shell is well outside the camera's maximum distance", () => {
    expect(STARFIELD_RADIUS).toBeGreaterThan(60 * 3);
    expect(STARFIELD_INNER_FRACTION).toBeGreaterThan(0);
    expect(STARFIELD_INNER_FRACTION).toBeLessThan(1);
    expect(FOG_DENSITY).toBeGreaterThan(0);
    expect(FOG_DENSITY).toBeLessThan(0.01);
  });
});

describe("generateStars", () => {
  const stars = generateStars(COUNT);

  it("produces one entry per requested star", () => {
    expect(stars.positions).toHaveLength(COUNT * 3);
    expect(stars.colors).toHaveLength(COUNT * 3);
    expect(stars.sizes).toHaveLength(COUNT);
    expect(stars.phases).toHaveLength(COUNT);
    expect(stars.speeds).toHaveLength(COUNT);
  });

  it("is deterministic for a given seed", () => {
    const again = generateStars(COUNT);
    expect(Array.from(again.positions)).toEqual(Array.from(stars.positions));
    expect(Array.from(again.colors)).toEqual(Array.from(stars.colors));
  });

  it("changes with a different seed", () => {
    const other = generateStars(COUNT, 0xc0ffee);
    expect(Array.from(other.positions)).not.toEqual(Array.from(stars.positions));
  });

  it("places every star on the shell between the inner and outer radius", () => {
    const inner = STARFIELD_RADIUS * STARFIELD_INNER_FRACTION;
    let min = Infinity;
    let max = 0;
    for (let i = 0; i < COUNT; i++) {
      const x = stars.positions[i * 3];
      const y = stars.positions[i * 3 + 1];
      const z = stars.positions[i * 3 + 2];
      const radius = Math.hypot(x, y, z);
      min = Math.min(min, radius);
      max = Math.max(max, radius);
    }
    expect(min).toBeGreaterThanOrEqual(inner - 1e-3);
    expect(max).toBeLessThanOrEqual(STARFIELD_RADIUS + 1e-3);
    // The shell is thick, not a hollow ring.
    expect(max - min).toBeGreaterThan(STARFIELD_RADIUS * 0.2);
  });

  it("uses sizes inside the documented range (plus the per-tint boost)", () => {
    const maxBoost = 1.6; // red giants
    for (let i = 0; i < COUNT; i++) {
      expect(stars.sizes[i]).toBeGreaterThanOrEqual(STAR_SIZE_RANGE[0]);
      expect(stars.sizes[i]).toBeLessThanOrEqual(STAR_SIZE_RANGE[1] * maxBoost + 1e-6);
    }
  });

  it("keeps most stars faint so the bright ones stand out", () => {
    let dim = 0;
    const threshold = STAR_RADIANCE_MIN + (STAR_RADIANCE_MAX - STAR_RADIANCE_MIN) * 0.25;
    for (let i = 0; i < COUNT; i++) {
      const r = stars.colors[i * 3];
      const g = stars.colors[i * 3 + 1];
      const b = stars.colors[i * 3 + 2];
      if (Math.max(r, g, b) < threshold) dim += 1;
    }
    // The power law should leave well over half the sky faint.
    expect(dim / COUNT).toBeGreaterThan(0.55);
  });

  it("never emits negative or NaN radiance (HDR stays non-negative)", () => {
    for (let i = 0; i < COUNT * 3; i++) {
      const value = stars.colors[i];
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it("concentrates a third of the sky into the tilted galactic band", () => {
    const tilt = (STARFIELD_BAND_TILT_DEG * Math.PI) / 180;
    let inBand = 0;
    for (let i = 0; i < COUNT; i++) {
      const x = stars.positions[i * 3];
      const y = stars.positions[i * 3 + 1];
      const z = stars.positions[i * 3 + 2];
      const length = Math.hypot(x, y, z);
      // Rotate back out of the tilt, then measure latitude.
      const ny = (y * Math.cos(tilt) + z * Math.sin(tilt)) / length;
      if (Math.abs(Math.asin(Math.max(-1, Math.min(1, ny)))) < 0.25) inBand += 1;
    }
    const fraction = inBand / COUNT;
    expect(fraction).toBeGreaterThan(STARFIELD_BAND_FRACTION * 0.7);
    expect(fraction).toBeLessThan(0.75);
  });

  it("gives every star a twinkle phase and speed", () => {
    for (let i = 0; i < COUNT; i++) {
      expect(stars.phases[i]).toBeGreaterThanOrEqual(0);
      expect(stars.phases[i]).toBeLessThanOrEqual(Math.PI * 2 + 1e-6);
      expect(stars.speeds[i]).toBeGreaterThan(0);
    }
  });
});
