"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  SpriteMaterial,
  type Group,
  type Sprite,
  type Texture,
} from "three";
import {
  createNebulaTexture,
  createSkyGradientTexture,
  disposeTexture,
} from "@/lib/textures";
import { NEBULA_CLOUDS } from "@/lib/constants";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * ── NEBULA BACKDROP ───────────────────────────────────────────
 * Two layers of atmosphere, both procedurally painted (no downloads):
 *
 *  1. `scene.background` — a single sky gradient texture, free at render time.
 *  2. Four additive cloud sprites parked near the starfield shell, drifting at
 *     a few thousandths of a radian per second so the sky is never quite still.
 *
 * The sprites are the most expensive transparent overdraw in the scene, so they
 * are skipped entirely on the `low` quality tier and frozen under reduced motion.
 */
export interface NebulaBackdropProps {
  /** Render the cloud sprites (disabled on low-end devices). */
  clouds?: boolean;
  /** Drift multiplier; 0 freezes the clouds. */
  drift?: number;
}

export function NebulaBackdrop({ clouds = true, drift = 1 }: NebulaBackdropProps) {
  const scene = useThree((s) => s.scene);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const groupRef = useRef<Group>(null!);

  const skyTexture = useMemo(() => createSkyGradientTexture(512), []);

  const cloudTextures = useMemo<Texture[]>(() => {
    if (!clouds) return [];
    return NEBULA_CLOUDS.map((cloud) =>
      createNebulaTexture({
        color: cloud.color,
        secondaryColor: "#FFFFFF",
        seed: cloud.id,
      })
    ).filter((t): t is Texture => Boolean(t));
  }, [clouds]);

  const cloudMaterials = useMemo(
    () =>
      NEBULA_CLOUDS.map((cloud, i) => {
        const map = cloudTextures[i];
        if (!map) return null;
        return new SpriteMaterial({
          map,
          transparent: true,
          opacity: cloud.opacity,
          depthWrite: false,
          depthTest: false,
          blending: AdditiveBlending,
        });
      }),
    [cloudTextures]
  );

  // Sky gradient becomes the scene background; restored on unmount.
  useEffect(() => {
    if (!skyTexture) return;
    const previous = scene.background;
    scene.background = skyTexture;
    return () => {
      scene.background = previous;
      disposeTexture(skyTexture);
    };
  }, [scene, skyTexture]);

  useEffect(
    () => () => {
      cloudMaterials.forEach((m) => m?.dispose());
      cloudTextures.forEach(disposeTexture);
    },
    [cloudMaterials, cloudTextures]
  );

  const elapsed = useRef(0);
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (!reducedMotion && drift !== 0) {
      elapsed.current += Math.min(delta, 0.05);
    }
    const time = elapsed.current * drift;

    NEBULA_CLOUDS.forEach((cloud, i) => {
      const sprite = group.children[i] as Sprite | undefined;
      if (!sprite) return;
      // Slow rotation about the vertical axis, each wisp at its own rate.
      const angle = time * cloud.speed * 6;
      const radius = Math.hypot(cloud.position[0], cloud.position[2]);
      const base = Math.atan2(cloud.position[2], cloud.position[0]);
      sprite.position.set(
        Math.cos(base + angle) * radius,
        cloud.position[1],
        Math.sin(base + angle) * radius
      );
    });
  });

  return (
    <group ref={groupRef} name="nebula-backdrop" renderOrder={-2}>
      {clouds &&
        NEBULA_CLOUDS.map((cloud, i) => {
          const material = cloudMaterials[i];
          if (!material) return null;
          return (
            <sprite
              key={cloud.id}
              material={material}
              position={cloud.position as unknown as [number, number, number]}
              scale={[cloud.scale, cloud.scale, 1]}
              name={cloud.id}
            />
          );
        })}
    </group>
  );
}

export default NebulaBackdrop;
