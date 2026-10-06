"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { QUALITY_PRESETS } from "@/lib/constants";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * ── POST-PROCESSING ───────────────────────────────────────────
 * Bloom is what makes the star (and later, planet rims and satellites) glow
 * instead of merely being bright, so it matters to the look — but it is the
 * first thing that should go on weak hardware.
 *
 * Gated on the quality tier: `low` skips the composer entirely (zero cost),
 * `medium`/`high` trade a few fullscreen passes for the glow. `multisampling`
 * is off because MSAA on a post-processing chain is expensive for little gain
 * once bloom is softening edges anyway.
 */
export function SceneEffects() {
  const quality = useSettingsStore((s) => s.quality);

  if (!QUALITY_PRESETS[quality].postProcessing) return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={quality === "high" ? 1.05 : 0.8}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.28}
        mipmapBlur
        radius={0.72}
      />
    </EffectComposer>
  );
}

export default SceneEffects;
