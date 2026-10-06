"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * ── SCENE TELEMETRY ───────────────────────────────────────────
 * Publishes frame count and renderer statistics onto `window` so automated
 * verification can assert that the scene is genuinely rendering, and later
 * measure the frame budget by draw calls / vertex counts rather than FPS
 * (sandbox rendering is software, so FPS there is meaningless).
 *
 * Two details make these numbers trustworthy:
 *
 *  1. `gl.info.autoReset` is turned **off** (in SceneCanvas). Left on, three.js
 *     resets the counters at the start of every `renderer.render()` call — and
 *     with an EffectComposer each post-processing pass is its own call, so the
 *     figures would describe only the final fullscreen quad instead of the
 *     whole frame.
 *  2. Because `useFrame` subscribers run *before* R3F issues the draw, the
 *     values read here belong to the frame that just completed. They are
 *     published, then reset so the next frame starts from zero.
 *
 * Renders nothing.
 */
export interface SceneTelemetryProps {
  /** Fired once, after the very first rendered frame. */
  onFirstFrame?: () => void;
  /** How often to publish `window.__solarPerf` (every N frames). */
  sampleEvery?: number;
}

export function SceneTelemetry({ onFirstFrame, sampleEvery = 30 }: SceneTelemetryProps) {
  const firstFrameSent = useRef(false);

  useFrame(({ gl, camera }) => {
    const frames = (window.__solarFrames ?? 0) + 1;
    window.__solarFrames = frames;

    if (!firstFrameSent.current) {
      firstFrameSent.current = true;
      onFirstFrame?.();
    }

    const info = gl.info;

    if (frames % sampleEvery === 0) {
      window.__solarPerf = {
        frames,
        calls: info.render.calls,
        triangles: info.render.triangles,
        // Points are counted separately by three.js — for a starfield this is
        // the number that proves the geometry is being submitted.
        points: info.render.points,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length ?? 0,
        dpr: gl.getPixelRatio(),
        // Camera diagnostics — lets automated checks assert the rig's framing
        // and zoom clamps without reaching into React internals.
        camera: [camera.position.x, camera.position.y, camera.position.z],
        distance: camera.position.length(),
        azimuth: Math.atan2(camera.position.z, camera.position.x),
      };
    }

    // Hand the next frame a clean slate (autoReset is disabled for this reason).
    info.reset();
  });

  return null;
}

export default SceneTelemetry;
