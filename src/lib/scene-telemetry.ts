/**
 * ── SCENE TELEMETRY / DEBUG BRIDGE ────────────────────────────
 * A deliberately tiny bridge between the WebGL scene and the outside world
 * (screenshot harness, Playwright specs, dev console).
 *
 * The 3D layer never re-renders React to report status: components push plain
 * numbers into a module-level object on every frame, which the harness reads
 * with `page.evaluate`. That keeps the render loop allocation-free.
 *
 * `window.__solarFrames` / `window.__solarScene` are only published outside
 * production builds, so the shipped page carries no debug surface.
 */

export interface SceneStats {
  /** Frames rendered since load — used by the screenshot harness. */
  frames: number;
  /** Smoothed frames per second (instantaneous values are far too noisy). */
  fps: number;
  drawCalls: number;
  triangles: number;
  points: number;
  /** Star points currently in the starfield geometry. */
  stars: number;
  /** Quality tier the scene is rendering with. */
  quality: string;
  /** True once the starfield + scene objects have mounted. */
  ready: boolean;
}

export interface CameraSnapshot {
  position: [number, number, number];
  target: [number, number, number];
  /** Distance from the camera to the orbit target. */
  distance: number;
  /** Spherical angles of the camera around its target, in radians. */
  azimuth: number;
  polar: number;
  /** Whether idle auto-rotation is currently running. */
  autoRotating: boolean;
}

export interface SceneSnapshot {
  camera: CameraSnapshot;
  stats: SceneStats;
}

declare global {
  interface Window {
    /** Frame counter — `scripts/shots.mjs` waits for this to reach `frames`. */
    __solarFrames?: number;
    /** Live snapshot getter used by the E2E specs. */
    __solarScene?: () => SceneSnapshot;
    /**
     * Pin the camera in place (dev/E2E only). Deterministic screenshots and
     * pixel-level comparisons of the starfield need a camera that is not
     * drifting with the idle auto-rotation.
     */
    __solarFreezeCamera?: (freeze?: boolean) => void;
  }
}

const DEBUG_ENABLED =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production";

let stats: SceneStats = {
  frames: 0,
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  points: 0,
  stars: 0,
  quality: "high",
  ready: false,
};

/** Increment the frame counter, refresh the FPS average and publish it. */
export function reportFrame(delta: number) {
  stats.frames += 1;
  const instant = delta > 0 ? 1 / delta : 0;
  // Exponential moving average keeps the number readable in tests.
  stats.fps = stats.fps ? stats.fps * 0.9 + instant * 0.1 : instant;
  if (DEBUG_ENABLED && typeof window !== "undefined") {
    window.__solarFrames = stats.frames;
  }
}

/** Publish renderer counters (`gl.info.render`) for the current frame. */
export function reportRendererInfo(info: {
  calls: number;
  triangles: number;
  points: number;
}) {
  stats.drawCalls = info.calls;
  stats.triangles = info.triangles;
  stats.points = info.points;
}

export function reportStars(count: number) {
  stats.stars = count;
}

export function reportQuality(quality: string) {
  stats.quality = quality;
}

export function reportReady(ready = true) {
  stats.ready = ready;
}

export function readStats(): SceneStats {
  return { ...stats };
}

/** Install the `window.__solarScene` accessor (non-production only). */
export function installSceneBridge(getSnapshot: () => SceneSnapshot) {
  if (!DEBUG_ENABLED || typeof window === "undefined") return;
  window.__solarScene = getSnapshot;
  window.__solarFreezeCamera = (freeze = true) => {
    cameraFrozen = freeze;
  };
}

/**
 * True while the camera is pinned for a deterministic capture. Read inside the
 * render loop, so it must stay allocation-free and synchronous.
 */
let cameraFrozen = false;

export function isCameraFrozen() {
  return cameraFrozen;
}
