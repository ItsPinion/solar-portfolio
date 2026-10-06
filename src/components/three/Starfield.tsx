"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ShaderMaterial,
} from "three";
import starfieldVert from "@/lib/shaders/starfield.vert";
import starfieldFrag from "@/lib/shaders/starfield.frag";
import { generateStars } from "@/lib/starfield";
import { STARFIELD_RADIUS, COLORS } from "@/lib/constants";
import { useSettingsStore } from "@/stores/useSettingsStore";

export interface StarfieldProps {
  /** Star budget — comes from the active quality tier. */
  count: number;
  seed?: string;
  radius?: number;
  /** Multiplies every star's pixel size (quality-tier tuning). */
  sizeBoost?: number;
}

/**
 * ── STARFIELD ─────────────────────────────────────────────────
 * One `THREE.Points` draw call for the entire sky. Positions, colours, sizes
 * and twinkle phases come from the pure generator in `src/lib/starfield.ts`;
 * `starfield.vert|frag` turn them into soft round sprites.
 *
 * Performance notes: the geometry is built once per `count`/`seed` and never
 * re-uploaded; the only per-frame work is two uniform writes.
 */
export function Starfield({
  count,
  seed = "solar-portfolio",
  radius = STARFIELD_RADIUS,
  sizeBoost = 1,
}: StarfieldProps) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const gl = useThree((s) => s.gl);

  const geometry = useMemo(() => {
    const data = generateStars({ count, seed, radius });
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(data.positions, 3));
    geo.setAttribute("aColor", new BufferAttribute(data.colors, 3));
    geo.setAttribute("aSize", new BufferAttribute(data.sizes, 1));
    geo.setAttribute("aPhase", new BufferAttribute(data.phases, 1));
    // The point cloud never gets frustum-culled: the camera is always inside it.
    geo.boundingSphere = null;
    geo.computeBoundingSphere();
    return geo;
  }, [count, seed, radius]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: starfieldVert,
        fragmentShader: starfieldFrag,
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: 450 },
          uTwinkle: { value: 1 },
          uSizeBoost: { value: sizeBoost },
          uOpacity: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [sizeBoost]
  );

  // Dispose GPU resources if the star count / seed changes or on unmount.
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    material.uniforms.uSizeBoost.value = sizeBoost;
  }, [material, sizeBoost]);

  useEffect(() => {
    // Static sky when the user asked for less motion.
    material.uniforms.uTwinkle.value = reducedMotion ? 0 : 1;
  }, [material, reducedMotion]);

  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!reducedMotion) elapsed.current += Math.min(delta, 0.05);
    material.uniforms.uTime.value = elapsed.current;
    // `domElement.height` is the drawing buffer height in device pixels, which
    // is exactly the scale gl_PointSize needs at any DPR.
    material.uniforms.uScale.value = gl.domElement.height * 0.5;
  });

  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-1}
      dispose={null}
      name="starfield"
    />
  );
}

/** Convenience export for the sky colour used behind the starfield. */
export const SKY_CLEAR_COLOR = COLORS.background;

export default Starfield;
