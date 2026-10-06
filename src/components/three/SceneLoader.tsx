"use client";

import { motion } from "framer-motion";
import { usePortfolioStore } from "@/stores/usePortfolioStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { projects } from "@/data/projects";

/**
 * ── SCENE LOADER ──────────────────────────────────────────────
 * Covers the canvas until the first frame has actually rendered — not merely
 * until the JavaScript evaluated. Under software rasterisation that gap is
 * real, and a blank screen would read as a broken page.
 *
 * The element stays mounted (aria-hidden, non-interactive) after loading so
 * tests can assert the transition rather than racing its removal.
 */
export function SceneLoader() {
  const isLoaded = usePortfolioStore((s) => s.isLoaded);
  const loadingProgress = usePortfolioStore((s) => s.loadingProgress);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const percent = Math.round(Math.min(Math.max(loadingProgress, 0), 1) * 100);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-6"
      initial={false}
      animate={{ opacity: isLoaded ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.55, ease: "easeOut" }}
      aria-hidden={isLoaded}
      data-testid="scene-loader"
      data-visible={!isLoaded}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* The star */}
        <span className="absolute inset-0 rounded-full bg-star-gradient blur-md" />
        <span
          className={
            "relative h-5 w-5 rounded-full bg-star-gold shadow-glow" +
            (reducedMotion ? "" : " anim-pulse-glow")
          }
        />
        {/* A single orbiting body — a preview of what is coming */}
        <span
          className={
            "absolute inset-0 rounded-full border border-white/10" +
            (reducedMotion ? "" : " anim-orbit-spin")
          }
        >
          <span className="absolute -top-[3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-planet-blue shadow-glow" />
        </span>
      </div>

      <div className="glass flex flex-col items-center gap-2 rounded-xl px-6 py-4 shadow-glass">
        <p className="font-mono text-fluid-xs uppercase tracking-[0.28em] text-star-gold/90">
          Building the solar system
        </p>
        <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-star-gradient transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(percent, 8)}%` }}
          />
        </div>
        <p className="font-mono text-[10px] text-white/50">
          {projects.length} planets orbiting · {percent}%
        </p>
      </div>
    </motion.div>
  );
}

export default SceneLoader;
