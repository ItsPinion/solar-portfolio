"use client";

import { useEffect, useMemo, type ReactElement } from "react";
import { useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { QUALITY_PRESETS } from "@/lib/constants";
import { useSettingsStore } from "@/stores/useSettingsStore";

/** Bloom tuning from the plan (Phase 2, step 4). */
export const BLOOM_SETTINGS = {
  /** Only the bright things bloom — stars, the star, planet sunrises. */
  threshold: 0.6,
  intensity: 0.8,
  radius: 0.6,
} as const;

/** Chromatic aberration stays at the very edge of perception. */
export const ABERRATION_OFFSET = 0.001;

/** MSAA inside the composer's render targets, per quality tier. */
const COMPOSER_SAMPLES: Record<keyof typeof QUALITY_PRESETS, number> = {
  low: 0,
  medium: 2,
  high: 4,
};

/**
 * ── POST PROCESSING ───────────────────────────────────────────
 * Bloom makes the bright elements glow, a subtle vignette frames the
 * composition and an almost invisible chromatic aberration softens the edges
 * of the frame.
 *
 * Two subtleties keep the scene looking identical whether or not the effect
 * stack is running:
 *
 *  1. Mounting the composer forces `gl.toneMapping` to `NoToneMapping`, so ACES
 *     Filmic is re-applied as the final effect on the composer path and
 *     restored on the renderer for the direct path (see the effect below).
 *  2. Effects are added/removed rather than switched off, so the `low` tier
 *     really does skip the render-target chain instead of paying for a
 *     pass-through copy of the frame.
 *
 * On the `low` tier the composer is disabled entirely and the scene renders
 * straight to the canvas — the cheapest possible path for weak GPUs.
 */
export function PostProcessing() {
  const gl = useThree((s) => s.gl);
  const quality = useSettingsStore((s) => s.quality);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const supported = QUALITY_PRESETS[quality].postProcessing;
  const samples = COMPOSER_SAMPLES[quality];
  // Aberration is the only effect that shifts with the camera, so it is also
  // gated by the motion preference.
  const aberrationEnabled = supported && quality === "high" && !reducedMotion;

  const aberrationOffset = useMemo(
    () => new THREE.Vector2(ABERRATION_OFFSET, ABERRATION_OFFSET),
    []
  );

  /**
   * Tone mapping ownership. The composer renders into a linear HDR buffer and
   * applies tone mapping itself (via the effect below); without the composer
   * the renderer must do it.
   */
  useEffect(() => {
    gl.toneMapping = supported ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    return () => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
    };
  }, [gl, supported]);

  const effects: ReactElement[] = [];

  if (supported) {
    effects.push(
      <Bloom
        key="bloom"
        mipmapBlur
        luminanceThreshold={BLOOM_SETTINGS.threshold}
        luminanceSmoothing={0.22}
        intensity={BLOOM_SETTINGS.intensity}
        radius={BLOOM_SETTINGS.radius}
        levels={8}
      />
    );
    effects.push(
      <Vignette
        key="vignette"
        offset={0.16}
        darkness={0.62}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    );
    if (aberrationEnabled) {
      effects.push(
        <ChromaticAberration
          key="aberration"
          offset={aberrationOffset}
          radialModulation
          modulationOffset={0.55}
          blendFunction={BlendFunction.NORMAL}
        />
      );
    }
    effects.push(
      <ToneMapping
        key="tonemapping"
        mode={ToneMappingMode.ACES_FILMIC}
        resolution={256}
        blendFunction={BlendFunction.NORMAL}
      />
    );
  }

  return (
    <EffectComposer
      enabled={supported}
      multisampling={samples}
      enableNormalPass={false}
      frameBufferType={THREE.HalfFloatType}
      renderPriority={1}
    >
      {effects}
    </EffectComposer>
  );
}

export default PostProcessing;
