/**
 * Test-observable globals.
 *
 * The 3D scene cannot be asserted on through the DOM, so the renderer publishes
 * a tiny, read-only surface that Playwright and the screenshot harnesses can
 * poll (see scripts/shots.mjs). Nothing here is used by app logic.
 */
declare global {
  interface Window {
    /** Frames rendered since mount. `>= 1` proves the WebGL loop is live. */
    __solarFrames?: number;
    /** Latest renderer statistics, refreshed every ~30 frames. */
    __solarPerf?: SolarPerfSample;
  }

  interface SolarPerfSample {
    frames: number;
    /** Draw calls in the last frame — the honest perf budget metric. */
    calls: number;
    triangles: number;
    /** Vertices drawn in POINTS mode — the starfield's real vertex count. */
    points: number;
    geometries: number;
    textures: number;
    programs: number;
    dpr: number;
    /** Camera position in world units. */
    camera: [number, number, number];
    /** Camera distance from the origin (the star). */
    distance: number;
    /** Camera angle around Y, radians — used to detect idle auto-rotation. */
    azimuth: number;
  }
}

export {};
