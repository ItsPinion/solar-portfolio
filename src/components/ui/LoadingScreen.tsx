"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePortfolioStore } from "@/stores/usePortfolioStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

/** Status lines shown while the scene boots — pure flavour, cycling. */
const BOOT_LINES = [
  "Initialising starfield",
  "Calibrating orbital paths",
  "Charging stellar core",
  "Aligning navigation",
] as const;

/** How long the "ready" state is held before the overlay fades away (ms). */
const READY_HOLD_MS = 420;
/** Hard stop: never leave the user staring at a loading screen (ms). */
const ESCAPE_HATCH_MS = 12_000;
/** The synthetic ramp never pretends to be finished — the scene does that. */
const RAMP_CEILING = 0.86;

/**
 * ── LOADING SCREEN ────────────────────────────────────────────
 * Full-screen overlay shown until the WebGL scene reports it is running.
 *
 * Progress is the *maximum* of the real `loadingProgress` published by the
 * canvas and a slow synthetic ramp, so the bar keeps moving while the scene
 * chunk downloads and then snaps to the real value. The overlay unmounts
 * completely once faded out — a fixed, full-viewport element left in the DOM
 * would swallow every pointer event aimed at the canvas.
 */
export function LoadingScreen() {
  const isLoaded = usePortfolioStore((s) => s.isLoaded);
  const loadingProgress = usePortfolioStore((s) => s.loadingProgress);
  const setHasEntered = usePortfolioStore((s) => s.setHasEntered);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  /* ── progress: real value from the canvas, or a synthetic ramp ── */
  const rampRef = useRef(0);
  useEffect(() => {
    if (isLoaded) {
      setProgress(1);
      return;
    }

    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      // Asymptotic approach — fast at first, then easing into the ceiling.
      rampRef.current += (RAMP_CEILING - rampRef.current) * dt * 0.9;
      setProgress((current) => Math.max(current, rampRef.current, loadingProgress));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isLoaded, loadingProgress]);

  /* ── cycle the flavour text (static when motion is reduced) ── */
  useEffect(() => {
    if (isLoaded || reducedMotion) return;
    const id = window.setInterval(
      () => setLineIndex((index) => (index + 1) % BOOT_LINES.length),
      1800
    );
    return () => window.clearInterval(id);
  }, [isLoaded, reducedMotion]);

  /* ── hide, then unmount ── */
  useEffect(() => {
    if (!isLoaded) return;
    const id = window.setTimeout(() => setVisible(false), READY_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [isLoaded]);

  /* ── escape hatch: never block the page if the canvas never reports ── */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (usePortfolioStore.getState().isLoaded) return;
      setTimedOut(true);
      setVisible(false);
      usePortfolioStore.getState().setLoaded(true);
      // eslint-disable-next-line no-console
      console.warn("[solar] scene did not report ready within 12s — hiding loader");
    }, ESCAPE_HATCH_MS);
    return () => window.clearTimeout(id);
  }, []);

  const percent = Math.round(Math.min(progress, 1) * 100);

  return (
    <AnimatePresence onExitComplete={() => setHasEntered(true)}>
      {visible ? (
        <motion.div
          key="loading-screen"
          data-testid="loading-screen"
          data-loaded={isLoaded ? "true" : "false"}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.2 : 0.9, ease: [0.4, 0, 0.2, 1] }}
          // `pointer-events-none` matters: the overlay covers the whole viewport
          // while it fades out, and without this every drag/scroll aimed at the
          // canvas is swallowed for the length of the fade.
          className="pointer-events-none fixed inset-0 z-overlay flex select-none flex-col items-center justify-center gap-8 bg-cosmic-black px-6"
          role="status"
          aria-live="polite"
          aria-busy={!isLoaded}
        >
          {/* Deep-space backdrop: two nebula washes over the cosmic black. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 40% at 25% 20%, rgba(74,29,122,0.35) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 78% 70%, rgba(18,58,99,0.4) 0%, transparent 72%)",
            }}
          />

          <div className="relative flex flex-col items-center gap-6">
            {/* Pulsing star mark */}
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-star-gradient blur-lg anim-[sp-star-pulse_4s_ease-in-out_infinite]"
              />
              <span className="relative h-10 w-10 rounded-full bg-star-gold shadow-glow-lg" />
            </div>

            <div className="text-center">
              <h1 className="font-display text-fluid-2xl font-semibold tracking-tight text-star-white">
                Solar System Portfolio
              </h1>
              <p className="mt-2 font-mono text-fluid-xs tracking-[0.35em] text-star-gold/70 uppercase">
                {isLoaded ? "Ready" : BOOT_LINES[lineIndex]}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-[min(22rem,80vw)]">
              <div
                className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label="Scene loading progress"
              >
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-star-gold/70 via-star-gold to-star-white"
                  initial={false}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: reducedMotion ? 0.1 : 0.4, ease: "easeOut" }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[11px] tracking-widest text-white/45">
                <span>{percent.toString().padStart(3, "0")}%</span>
                <span>{timedOut ? "degraded mode" : "webgl"}</span>
              </div>
            </div>
          </div>

          <p className="absolute bottom-8 font-mono text-[11px] tracking-[0.25em] text-white/30 uppercase">
            Drag to orbit · Scroll to zoom
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default LoadingScreen;
