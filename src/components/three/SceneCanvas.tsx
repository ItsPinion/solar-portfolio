"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, Color } from "three";
import { CameraRig } from "./CameraRig";
import { NebulaBackdrop } from "./NebulaBackdrop";
import { SceneEffects } from "./SceneEffects";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { SceneFallback } from "./SceneFallback";
import { SceneLoader } from "./SceneLoader";
import { SceneTelemetry } from "./SceneTelemetry";
import { Starfield } from "./Starfield";
import {
  CAMERA_DEFAULT_POSITION,
  CAMERA_FOV,
  COLORS,
  QUALITY_PRESETS,
  STARFIELD_RADIUS,
} from "@/lib/constants";
import { hasWebGL } from "@/lib/utils";
import { usePortfolioStore } from "@/stores/usePortfolioStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * ── SCENE CANVAS ──────────────────────────────────────────────
 * The WebGL surface and its quality-driven configuration:
 *
 *   quality  stars  segments  post-fx  dpr cap
 *   low       3000        20        no   1.25
 *   medium    5000        32       yes    1.5
 *   high      8000        64       yes      2
 *
 * Progressive enhancement is layered deliberately:
 *   1. `hasWebGL()` runs before the canvas mounts — no WebGL, no attempt.
 *   2. `SceneErrorBoundary` catches anything thrown while initialising.
 *   3. A lost context downgrades to the 2D fallback instead of freezing.
 *
 * The wrapper exposes `data-scene-ready` / `data-quality` / `data-star-count`
 * so automated checks can assert what was actually rendered.
 */
export interface SceneCanvasProps {
  className?: string;
}

export function SceneCanvas({ className }: SceneCanvasProps) {
  const quality = useSettingsStore((s) => s.quality);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const setLoaded = usePortfolioStore((s) => s.setLoaded);
  const setLoadingProgress = usePortfolioStore((s) => s.setLoadingProgress);

  const preset = QUALITY_PRESETS[quality];
  const [ready, setReady] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Probe once on the client — never during SSR (there is no GPU to ask).
  useEffect(() => {
    setWebglAvailable(hasWebGL());
  }, []);

  // Reset the frame counter so telemetry reflects *this* mount.
  useEffect(() => {
    window.__solarFrames = 0;
    return () => {
      window.__solarFrames = 0;
      window.__solarPerf = undefined;
    };
  }, []);

  const handleFirstFrame = useCallback(() => {
    setReady(true);
    setLoaded(true);
    setLoadingProgress(1);
  }, [setLoaded, setLoadingProgress]);

  // Asked to stay 2D, or physically unable to render 3D.
  const render3D = viewMode === "3d" && webglAvailable !== false && !contextLost;

  // When there is no 3D scene, nothing will ever report the first frame — so the
  // loading state has to be resolved here, or anything waiting on `isLoaded`
  // would wait forever.
  useEffect(() => {
    if (render3D) return;
    setLoaded(true);
    setLoadingProgress(1);
  }, [render3D, setLoaded, setLoadingProgress]);

  if (!render3D) {
    return <SceneFallback />;
  }

  return (
    <div
      className={className ?? "absolute inset-0"}
      data-scene-ready={ready}
      data-quality={quality}
      data-star-count={preset.stars}
      data-postprocessing={preset.postProcessing}
      data-testid="scene-canvas"
    >
      <SceneErrorBoundary fallback={<SceneFallback />}>
        <Canvas
          // Clamp DPR per tier: the single biggest lever on fill-rate cost.
          dpr={preset.pixelRatio as unknown as [number, number]}
          frameloop="always"
          camera={{
            position: CAMERA_DEFAULT_POSITION,
            fov: CAMERA_FOV,
            near: 0.1,
            // Must comfortably clear the starfield shell from any camera position.
            far: STARFIELD_RADIUS * 4,
          }}
          gl={{
            antialias: quality !== "low",
            alpha: false,
            stencil: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(new Color(COLORS.background), 1);
            // Let SceneTelemetry own the counters: with autoReset on, each
            // post-processing pass would wipe them and the reported draw count
            // would describe only the final fullscreen quad.
            gl.info.autoReset = false;
            // ACES keeps bright additive glows from clipping to flat white.
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;

            gl.domElement.addEventListener(
              "webglcontextlost",
              (event) => {
                // Preventing default is what allows a later restore attempt;
                // meanwhile the user gets the readable 2D view.
                event.preventDefault();
                console.warn("[solar] WebGL context lost — switching to 2D view");
                setContextLost(true);
              },
              { once: true }
            );
          }}
        >
          <SceneTelemetry onFirstFrame={handleFirstFrame} />

          {/* Atmosphere first, then the sky, then the bodies (Phase 3+). */}
          <NebulaBackdrop clouds={quality !== "low"} />
          <Starfield
            count={preset.stars}
            sizeBoost={quality === "low" ? 1.15 : 1}
          />

          <CameraRig />
          <SceneEffects />
        </Canvas>

        {/* Covers the canvas until the first real frame lands. */}
        <SceneLoader />
      </SceneErrorBoundary>
    </div>
  );
}

export default SceneCanvas;
