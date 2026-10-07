"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/lib/shaders/starfield.vert.glsl";
import fragmentShader from "@/lib/shaders/starfield.frag.glsl";
import {
  COLORS,
  FOG_DENSITY,
  NEBULA_COLOR_GAIN,
  NEBULA_RADIUS,
  NEBULA_SIZE,
  QUALITY_PRESETS,
  STARFIELD_BAND_FRACTION,
  STARFIELD_BAND_TILT_DEG,
  STARFIELD_INNER_FRACTION,
  STARFIELD_RADIUS,
  STAR_MAX_PIXEL_SIZE,
  STAR_MIN_PIXEL_SIZE,
  STAR_SIZE_RANGE,
  STAR_SIZE_SCALE,
  STAR_RADIANCE_EXPONENT,
  STAR_RADIANCE_MAX,
  STAR_RADIANCE_MIN,
  STAR_SIZE_EXPONENT,
  STAR_TWINKLE_AMOUNT,
  STAR_TWINKLE_SPEED,
} from "@/lib/constants";
import { hexToRgba, seededRandom } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { reportStars } from "@/lib/scene-telemetry";

/* ================================================================
   Star generation
   ================================================================ */

/** Stellar tint weights — a mostly cool sky with a few warm/red giants. */
const STAR_PALETTE: Array<{ color: string; weight: number; sizeBoost: number }> = [
  { color: "#dce9ff", weight: 42, sizeBoost: 1 }, // blue-white
  { color: "#ffffff", weight: 26, sizeBoost: 1.15 }, // white
  { color: "#fff5e0", weight: 18, sizeBoost: 1 }, // warm white
  { color: "#fdb813", weight: 7, sizeBoost: 1.3 }, // gold
  { color: "#c9a7ff", weight: 5, sizeBoost: 1.2 }, // violet
  { color: "#ff9b6b", weight: 2, sizeBoost: 1.6 }, // red giant
];

const PALETTE_TOTAL = STAR_PALETTE.reduce((sum, entry) => sum + entry.weight, 0);

/** A built nebula cloud: its spec, its procedural texture and its world spot. */
interface NebulaCloud {
  spec: NebulaSpec;
  texture: THREE.Texture;
  position: THREE.Vector3;
}

interface StarBuffers {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  phases: Float32Array;
  speeds: Float32Array;
}

/**
 * Deterministic star distribution on a thick shell around the scene.
 *
 * ~1/3 of the stars are pulled into a tilted band to read as a milky-way
 * streak; the rest are spread evenly over the sphere so the sky never looks
 * empty in any direction. Sizes follow a power law (many faint, few bright).
 */
export function generateStars(count: number, seed = 0x5eed11): StarBuffers {
  const rand = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);

  const [minSize, maxSize] = STAR_SIZE_RANGE;
  const innerRadius = STARFIELD_RADIUS * STARFIELD_INNER_FRACTION;
  const bandRadians = (STARFIELD_BAND_TILT_DEG * Math.PI) / 180;

  // Pre-resolve the palette into a cumulative lookup so tinting is O(1).
  const cumulative: number[] = [];
  let running = 0;
  for (const entry of STAR_PALETTE) {
    running += entry.weight;
    cumulative.push(running / PALETTE_TOTAL);
  }
  const tintCache = STAR_PALETTE.map((entry) => new THREE.Color(entry.color));

  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const inBand = rand() < STARFIELD_BAND_FRACTION;

    // Direction on the unit sphere.
    let nx: number;
    let ny: number;
    let nz: number;

    if (inBand) {
      // Concentrate near the galactic plane using a triangular distribution.
      const theta = rand() * Math.PI * 2;
      const latitude = (rand() + rand() - 1) * 0.32;
      nx = Math.cos(theta) * Math.cos(latitude);
      ny = Math.sin(latitude);
      nz = Math.sin(theta) * Math.cos(latitude);
      // Tilt the band.
      const cos = Math.cos(bandRadians);
      const sin = Math.sin(bandRadians);
      const tiltedY = ny * cos - nz * sin;
      const tiltedZ = ny * sin + nz * cos;
      ny = tiltedY;
      nz = tiltedZ;
    } else {
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      nx = r * Math.cos(theta);
      ny = u;
      nz = r * Math.sin(theta);
    }

    const radius = innerRadius + (STARFIELD_RADIUS - innerRadius) * rand();
    positions[i3] = nx * radius;
    positions[i3 + 1] = ny * radius;
    positions[i3 + 2] = nz * radius;

    // Tint (weighted pick) — the same draw also decides how much of a
    // larger-than-life boost the star gets.
    const pick = rand();
    let paletteIndex = cumulative.findIndex((threshold) => pick <= threshold);
    if (paletteIndex < 0) paletteIndex = 0;
    const entry = STAR_PALETTE[paletteIndex];

    // Power law → mostly small stars, a handful of standouts.
    const sizeT = Math.pow(rand(), STAR_SIZE_EXPONENT);
    sizes[i] = (minSize + (maxSize - minSize) * sizeT) * entry.sizeBoost;

    // Radiance is stored in HDR and correlated with size (bright stars are also
    // the big ones, exactly like a real sky). The steep exponent keeps the
    // majority of stars faint so the few standouts actually stand out, and the
    // range is tuned for the ACES tone mapping curve applied later.
    const radiance =
      STAR_RADIANCE_MIN +
      Math.pow(sizeT, STAR_RADIANCE_EXPONENT) * STAR_RADIANCE_MAX * entry.sizeBoost;
    color.copy(tintCache[paletteIndex]).multiplyScalar(radiance);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    phases[i] = rand() * Math.PI * 2;
    speeds[i] =
      STAR_TWINKLE_SPEED[0] + rand() * (STAR_TWINKLE_SPEED[1] - STAR_TWINKLE_SPEED[0]);
  }

  return { positions, colors, sizes, phases, speeds };
}

/* ================================================================
   Nebula billboards
   ================================================================ */

interface NebulaSpec {
  position: [number, number, number];
  size: number;
  colorA: string;
  colorB: string;
  opacity: number;
}

const NEBULA_SPECS: NebulaSpec[] = [
  {
    position: [-0.55, 0.35, -1],
    size: 1.05,
    colorA: "#4a1d7a",
    colorB: "#0a1628",
    opacity: 0.7,
  },
  {
    position: [0.8, -0.15, -0.6],
    size: 0.85,
    colorA: "#123a63",
    colorB: "#1a0533",
    opacity: 0.62,
  },
  {
    position: [0.15, 0.55, 0.95],
    size: 0.95,
    colorA: "#5a1f4d",
    colorB: "#0a1628",
    opacity: 0.55,
  },
];

/** Procedural, offline nebula texture — canvas gradients + seeded blobs. */
function createNebulaTexture(size: number, spec: NebulaSpec, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rand = seededRandom(seed);
  const half = size / 2;

  // Soft elliptical base so the plane never shows a hard edge.
  const base = ctx.createRadialGradient(half, half, 0, half, half, half);
  base.addColorStop(0, hexToRgba(spec.colorA, 0.62));
  base.addColorStop(0.45, hexToRgba(spec.colorB, 0.4));
  base.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Cloud structure: overlapping soft blobs, thickening towards the centre.
  for (let i = 0; i < 34; i++) {
    const angle = rand() * Math.PI * 2;
    const distance = Math.pow(rand(), 0.7) * half * 0.82;
    const x = half + Math.cos(angle) * distance;
    const y = half + Math.sin(angle) * distance * 0.65;
    const blobRadius = size * (0.05 + rand() * 0.18);
    const blob = ctx.createRadialGradient(x, y, 0, x, y, blobRadius);
    const tint = i % 2 === 0 ? spec.colorA : spec.colorB;
    blob.addColorStop(0, hexToRgba(tint, 0.1 + rand() * 0.18));
    blob.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, size, size);
  }

  // Feather the edges: `destination-in` multiplies what has been painted so far
  // by a radial mask, so the billboard fades out instead of ending on a visible
  // square. Without this the plane's corners are plainly visible over black.
  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createRadialGradient(half, half, 0, half, half, half);
  mask.addColorStop(0, "rgba(255,255,255,1)");
  mask.addColorStop(0.55, "rgba(255,255,255,0.85)");
  mask.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Distant nebula clouds. They are billboards (they copy the camera's rotation
 * each frame) so the sky keeps its shape from any viewing angle, and they use
 * additive blending without depth writes so they never occlude stars.
 */
function Nebulae({ count, textureSize }: { count: number; textureSize: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const clouds = useMemo<NebulaCloud[]>(() => {
    const built: NebulaCloud[] = [];
    const enabled = NEBULA_SPECS.slice(0, Math.max(0, count));
    for (let index = 0; index < enabled.length; index += 1) {
      const spec = enabled[index];
      const texture = createNebulaTexture(textureSize, spec, 0xbeef + index * 977);
      if (!texture) continue;
      built.push({
        spec,
        texture,
        position: new THREE.Vector3(...spec.position)
          .normalize()
          .multiplyScalar(NEBULA_RADIUS),
      });
    }
    return built;
  }, [count, textureSize]);

  // Billboarding: cheaper and steadier than per-frame lookAt allocations.
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    for (const child of group.children) child.quaternion.copy(camera.quaternion);
  });

  useEffect(() => {
    return () => {
      for (const cloud of clouds) cloud.texture.dispose();
    };
  }, [clouds]);

  return (
    <group ref={groupRef} renderOrder={-1001}>
      {clouds.map((cloud, index) => (
        <mesh key={index} position={cloud.position} frustumCulled={false}>
          <planeGeometry args={[NEBULA_SIZE * cloud.spec.size, NEBULA_SIZE * cloud.spec.size]} />
          <meshBasicMaterial
            map={cloud.texture}
            // `color` multiplies the map, which lifts the clouds into HDR so
            // they survive the ACES curve instead of being crushed to black.
            color={NEBULA_COLOR_GAIN}
            transparent
            opacity={cloud.spec.opacity}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================
   Starfield
   ================================================================ */

/**
 * ── STARFIELD ─────────────────────────────────────────────────
 * Single `THREE.Points` draw call holding the entire sky (3000–8000 stars
 * depending on the quality tier). Per-star size, tint, phase and twinkle
 * speed are vertex attributes, so twinkling costs one uniform update per
 * frame instead of any geometry work.
 *
 * With reduced motion enabled the twinkle is switched off and the sky holds
 * still — the scene stays fully readable, it just stops moving.
 */
export function Starfield() {
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useSettingsStore((s) => s.quality);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const viewportDpr = useThree((s) => s.viewport.dpr);

  const preset = QUALITY_PRESETS[quality];
  const starCount = preset.stars;
  const nebulaCount = preset.nebulae;
  const nebulaTextureSize = preset.nebulaTextureSize;

  const buffers = useMemo(() => generateStars(starCount), [starCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(buffers.positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(buffers.colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(buffers.sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(buffers.phases, 1));
    geo.setAttribute("aTwinkleSpeed", new THREE.BufferAttribute(buffers.speeds, 1));
    geo.computeBoundingSphere();
    return geo;
  }, [buffers]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: viewportDpr },
          uSizeScale: { value: STAR_SIZE_SCALE },
          uMinPixelSize: { value: STAR_MIN_PIXEL_SIZE },
          uMaxPixelSize: { value: STAR_MAX_PIXEL_SIZE },
          uTwinkleAmount: { value: STAR_TWINKLE_AMOUNT },
          uFogColor: { value: new THREE.Color(COLORS.background) },
          uFogDensity: { value: FOG_DENSITY },
          uFade: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    // Rebuild only when the pixel ratio changes; uniforms are updated in place.
    [viewportDpr]
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useEffect(() => {
    reportStars(starCount);
  }, [starCount]);

  // Publish the uniform values that depend on user settings.
  useEffect(() => {
    material.uniforms.uTwinkleAmount.value = reducedMotion ? 0 : STAR_TWINKLE_AMOUNT;
  }, [material, reducedMotion]);

  const fadeRef = useRef(0);
  const rotationRef = useRef(0);

  useFrame((state, delta) => {
    // Clamp delta so a tab-switch pause doesn't jump the fade or the drift.
    const dt = Math.min(delta, 0.05);

    // Gentle fade-in on first paint (avoids a hard cut from the loading state).
    if (fadeRef.current < 1) {
      fadeRef.current = Math.min(1, fadeRef.current + dt / 1.4);
      material.uniforms.uFade.value = fadeRef.current;
    }

    if (!reducedMotion) {
      material.uniforms.uTime.value = state.clock.elapsedTime;

      // Near-imperceptible parallax: a full turn takes ~20 minutes.
      rotationRef.current += dt * 0.005;
      if (pointsRef.current) pointsRef.current.rotation.y = rotationRef.current;
    }
  });

  return (
    <group>
      <points
        ref={pointsRef}
        geometry={geometry}
        material={material}
        frustumCulled={false}
        renderOrder={-1000}
      />
      <Nebulae count={nebulaCount} textureSize={nebulaTextureSize} />
    </group>
  );
}

export default Starfield;
