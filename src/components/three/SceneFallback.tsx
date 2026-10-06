"use client";

import { profile } from "@/data/profile";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * ── SCENE FALLBACK (2D) ───────────────────────────────────────
 * Shown when WebGL is unavailable, when the user selects the 2D view mode, or
 * when the canvas throws. It must never look like an error page — the profile
 * essentials stay readable and the visitor can try 3D again.
 *
 * Phase 9 replaces this with the full touch-optimised 2D layout.
 */
export function SceneFallback() {
  const setViewMode = useSettingsStore((s) => s.setViewMode);

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 overflow-hidden bg-nebula-gradient px-6 py-16 text-center"
      data-testid="scene-fallback"
      data-view-mode="2d"
    >
      {/* Decorative star, sized and offset so it never sits behind the text. */}
      <div
        className="relative flex h-20 w-20 shrink-0 items-center justify-center"
        aria-hidden="true"
      >
        <span className="absolute inset-0 rounded-full bg-star-gradient blur-xl" />
        <span className="anim-pulse-glow relative h-9 w-9 rounded-full bg-star-gold shadow-glow" />
      </div>

      <div className="max-w-xl space-y-3">
        <h1 className="font-display text-fluid-2xl font-semibold text-star-white">
          {profile.name}
        </h1>
        <p className="font-mono text-fluid-sm text-star-gold">{profile.title}</p>
        <p className="text-fluid-sm leading-relaxed text-white/70">{profile.tagline}</p>
      </div>

      <div className="glass flex max-w-md flex-col items-center gap-2 rounded-xl px-6 py-4 shadow-glass">
        <p className="font-mono text-fluid-xs uppercase tracking-[0.2em] text-white/50">
          Simplified view
        </p>
        <p className="text-fluid-xs leading-relaxed text-white/70">
          This device can&apos;t display the interactive 3D scene, so you&apos;re seeing the
          lightweight version. Every project and technology is listed in{" "}
          <span className="text-star-gold/90">{profile.availability}</span> — the full 2D
          experience ships in the next phase.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setViewMode("3d")}
        className="rounded-full border border-white/15 px-5 py-2.5 font-mono text-fluid-xs text-white/70 transition hover:border-star-gold/40 hover:text-star-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-star-gold/60"
      >
        Try the 3D view again
      </button>
    </div>
  );
}

export default SceneFallback;
