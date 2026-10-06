"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Object3D } from "three";
import { ORBIT_SPEED_BASE } from "@/lib/constants";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { OrbitPosition } from "@/types";

export interface OrbitalMotionOptions {
  /** Distance from the body being orbited, in world units. */
  radius: number;
  /** Period multiplier — larger numbers orbit more slowly. */
  speed: number;
  /** Orbital plane tilt in degrees. */
  inclination?: number;
  /** Starting angle in radians. */
  phase?: number;
  /** Extra vertical wobble for satellites so their rings look distinct. */
  nodeOffset?: number;
  /** Force-enable motion even when reduced motion is on (not usually wanted). */
  force?: boolean;
}

/**
 * ── ORBITAL MOTION ────────────────────────────────────────────
 * Computes `x = r·cos(θ)`, `z = r·sin(θ)` with an inclination-derived `y`,
 * and writes the result straight onto a group's transform inside `useFrame`.
 *
 * Why not React state: this runs every frame for every planet and satellite.
 * Mutating the Object3D directly keeps React out of the animation loop, which
 * is what allows 6 planets + ~30 satellites to stay smooth.
 *
 * When `reducedMotion` is enabled the body is parked at its starting angle
 * (still visible and interactive, just stationary — Phase 4 criterion).
 */
export function useOrbitalMotion<T extends Object3D = Object3D>(
  options: OrbitalMotionOptions
) {
  const {
    radius,
    speed,
    inclination = 0,
    phase = 0,
    nodeOffset = 0,
    force = false,
  } = options;

  const groupRef = useRef<T>(null);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const config = useMemo(() => {
    const inc = (inclination * Math.PI) / 180;
    return {
      radius,
      // OrbitControls-style angular velocity: base speed scaled by the period
      // multiplier, expressed in radians per second at 60fps reference time.
      omega: (ORBIT_SPEED_BASE * 60) / Math.max(speed, 0.05),
      inc,
      phase,
      nodeOffset,
      yFactor: Math.sin(inc),
    };
  }, [radius, speed, inclination, phase, nodeOffset]);

  const elapsed = useRef(0);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (!reducedMotion || force) {
      // Clamp delta so a tab-switch stall can't teleport bodies across orbits.
      elapsed.current += Math.min(delta, 0.05);
    }

    const angle = config.phase + elapsed.current * config.omega;
    const x = Math.cos(angle) * config.radius;
    const z = Math.sin(angle) * config.radius;
    // Project the orbit onto a tilted plane for 3D depth.
    const y = Math.sin(angle) * config.yFactor * config.radius * 0.5 + config.nodeOffset;

    group.position.set(x, y, z);
  });

  return groupRef;
}

/** Pure helper — same maths, callable outside the render loop (tests, CPU map). */
export function orbitalPositionAt(
  time: number,
  options: Required<Pick<OrbitalMotionOptions, "radius" | "speed">> &
    Omit<OrbitalMotionOptions, "radius" | "speed">
): OrbitPosition {
  const { radius, speed, inclination = 0, phase = 0, nodeOffset = 0 } = options;
  const inc = (inclination * Math.PI) / 180;
  const omega = (ORBIT_SPEED_BASE * 60) / Math.max(speed, 0.05);
  const angle = phase + time * omega;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * Math.sin(inc) * radius * 0.5 + nodeOffset,
    z: Math.sin(angle) * radius,
    angle,
  };
}

export default useOrbitalMotion;
