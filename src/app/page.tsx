"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { SceneDevOverlay } from "@/components/shared/SceneDevOverlay";

/**
 * The 3D scene is browser-only: it touches WebGL, `window` and
 * `devicePixelRatio` while constructing the renderer, so it is imported with
 * SSR disabled and streamed in as its own chunk (Appendix C).
 *
 * The `loading` placeholder is deliberately near-empty — the real loading
 * experience is `<LoadingScreen>`, which sits above the canvas and fades out
 * once the scene reports that it is running.
 */
const Scene = dynamic(() => import("@/components/canvas/Scene").then((mod) => mod.Scene), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-cosmic-black">
      {/* Full-viewport canvas (100vw × 100vh) */}
      <Scene className="h-full w-full" />

      <LoadingScreen />
      <SceneDevOverlay />
    </main>
  );
}
