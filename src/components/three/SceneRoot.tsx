"use client";

import dynamic from "next/dynamic";

/**
 * ── SCENE ROOT ────────────────────────────────────────────────
 * Client boundary for the 3D layer.
 *
 * The canvas is pulled in with `ssr: false` because three.js has no meaningful
 * server render — this keeps the WebGL bundle out of the server pass and out of
 * the initial HTML, and avoids the hydration mismatch that comes from
 * measuring a canvas that does not exist yet. App Router forbids `ssr: false`
 * inside a Server Component, which is exactly why this thin wrapper exists.
 */
const SceneCanvas = dynamic(
  () => import("./SceneCanvas").then((m) => m.SceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-nebula-gradient" aria-hidden="true" />
    ),
  }
);

export function SceneRoot() {
  return (
    <div className="fixed inset-0 overflow-hidden" data-testid="scene-root">
      <SceneCanvas />
    </div>
  );
}

export default SceneRoot;
