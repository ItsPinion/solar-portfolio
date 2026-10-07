"use client";

import { useEffect, useState } from "react";
import { readStats } from "@/lib/scene-telemetry";

const isDev = process.env.NODE_ENV !== "production";

/**
 * ── SCENE DEV OVERLAY ─────────────────────────────────────────
 * Development-only readout of the numbers that matter while tuning the scene:
 * frame rate, draw calls, triangles, star count and the active quality tier.
 * Polls the telemetry bridge instead of subscribing to the render loop, so it
 * never re-renders the canvas.
 *
 * Toggle with the backquote (`) key. Hidden by default and stripped from
 * production builds.
 */
export function SceneDevOverlay() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(readStats());

  useEffect(() => {
    if (!isDev) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "`" || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      setOpen((value) => !value);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setStats(readStats()), 500);
    return () => window.clearInterval(id);
  }, [open]);

  if (!isDev || !open) return null;

  const rows: Array<[string, string]> = [
    ["fps", stats.fps.toFixed(0)],
    ["draws", String(stats.drawCalls)],
    ["tris", stats.triangles.toLocaleString()],
    ["points", stats.points.toLocaleString()],
    ["stars", stats.stars.toLocaleString()],
    ["quality", stats.quality],
    ["ready", String(stats.ready)],
  ];

  return (
    <div
      data-testid="scene-dev-overlay"
      className="glass pointer-events-none fixed bottom-4 left-4 z-hud rounded-lg px-3 py-2 font-mono text-[11px] leading-relaxed text-star-white/80 shadow-glass"
    >
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-3">
          <span className="w-14 text-white/45">{label}</span>
          <span>{value}</span>
        </div>
      ))}
      <div className="mt-1 border-t border-white/10 pt-1 text-white/35">` to hide</div>
    </div>
  );
}

export default SceneDevOverlay;
