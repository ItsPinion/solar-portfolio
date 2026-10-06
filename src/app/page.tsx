import { SceneRoot } from "@/components/three/SceneRoot";
import { profile } from "@/data/profile";

/**
 * The Solar System Portfolio.
 *
 * Phase 2 replaces the scaffolding smoke-test page with the real experience:
 * a full-viewport WebGL scene (starfield + nebula sky + camera rig) that later
 * phases populate with the star, project planets, satellites and HUD.
 *
 * The document heading is server-rendered and visually hidden so the page has
 * a real accessible name and structure from the very first byte, before the
 * canvas mounts.
 */
export default function Home() {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-cosmic-black">
      <h1 className="sr-only">
        {profile.name} — {profile.title}. {profile.tagline}
      </h1>

      <SceneRoot />
    </main>
  );
}
