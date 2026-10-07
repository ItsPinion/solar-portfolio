"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CameraController } from "./CameraController";
import { PostProcessing } from "./PostProcessing";
import { Starfield } from "./Starfield";
import {
  CAMERA_DEFAULT_POSITION,
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  COLORS,
  FOG_DENSITY,
  QUALITY_PRESETS,
} from "@/lib/constants";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { usePortfolioStore } from "@/stores/usePortfolioStore";
import {
  installSceneBridge,
  readStats,
  reportFrame,
  reportQuality,
  reportReady,
  reportRendererInfo,
} from "@/lib/scene-telemetry";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

/* ================================================================
   Lighting
   ================================================================ */

/**
 * The scene is lit almost entirely by the central star (added in Phase 3):
 * a very dim blue ambient so planet night-sides are not pure black, a warm
 * point light at the origin, and an even fainter directional fill for shape.
 * The starfield is unlit (custom shader), so these only shape future bodies.
 */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.05} color={COLORS.nebulaBlue} />
      <pointLight position={[0, 0, 0]} intensity={2} distance={0} decay={2} color={COLORS.starCore} />
      <directionalLight position={[12, 8, 6]} intensity={0.12} color="#9fc4ff" />
    </>
  );
}

/* ================================================================
   Telemetry
   ================================================================ */

/**
 * Publishes frame counters + renderer stats to the debug bridge (see
 * `src/lib/scene-telemetry.ts`) so the screenshot harness and E2E specs can
 * measure the scene without React re-renders. Renders nothing.
 */
function SceneTelemetry() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;

  useEffect(() => {
    installSceneBridge(() => {
      const target = controls?.target ?? new THREE.Vector3();
      const offset = new THREE.Vector3().subVectors(camera.position, target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      return {
        camera: {
          position: [camera.position.x, camera.position.y, camera.position.z] as [
            number,
            number,
            number,
          ],
          target: [target.x, target.y, target.z] as [number, number, number],
          distance: spherical.radius,
          azimuth: spherical.theta,
          polar: spherical.phi,
          autoRotating: Boolean(controls?.autoRotate),
        },
        stats: readStats(),
      };
    });
  }, [camera, controls]);

  /**
   * `gl.info.autoReset` is switched off so the counters accumulate across every
   * pass of a frame (scene + post-processing) instead of only the last one —
   * otherwise the reported draw-call count is that of the final fullscreen
   * quad. Resetting at the top of this callback (priority 0, i.e. before the
   * composer's priority-1 render) yields the previous frame's totals.
   */
  useEffect(() => {
    const previous = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = previous;
    };
  }, [gl]);

  useFrame((_, delta) => {
    reportFrame(delta);
    reportRendererInfo(gl.info.render);
    gl.info.reset();
  });

  return null;
}

/* ================================================================
   WebGL fallback
   ================================================================ */

function WebGLFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-cosmic-black p-8 text-center">
      <div className="glass max-w-md rounded-2xl p-6 shadow-glass">
        <h2 className="font-display text-fluid-xl text-star-gold">3D view unavailable</h2>
        <p className="mt-3 font-body text-fluid-sm text-star-white/70">
          This browser or device does not expose WebGL, which the solar system needs.
          The accessible 2D view carries all of the same content.
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   Scene
   ================================================================ */

export interface SceneProps {
  className?: string;
}

/**
 * ── SCENE ─────────────────────────────────────────────────────
 * The single `<Canvas>` for the whole experience. Responsibilities:
 *
 *  • perspective camera placed at `CAMERA_DEFAULT_POSITION`
 *  • ACES Filmic tone mapping, sRGB output, antialiasing
 *  • pixel ratio from the quality tier, capped at 2 (retina-friendly, but a
 *    software renderer / low tier can dial it back to 1)
 *  • subtle exponential fog for depth
 *  • a Suspense boundary so future heavy bodies stream in without blocking
 *  • `data-scene-ready` + telemetry for the screenshot harness
 */
export function Scene({ className }: SceneProps) {
  const quality = useSettingsStore((s) => s.quality);
  const setLoaded = usePortfolioStore((s) => s.setLoaded);
  const setLoadingProgress = usePortfolioStore((s) => s.setLoadingProgress);
  const [ready, setReady] = useState(false);

  const preset = QUALITY_PRESETS[quality];

  // Quality tiers expose `[min, max]`; R3F accepts that tuple directly. It is
  // read through a stable reference because the object comes from a module
  // constant rather than per-render state.
  const dprRange = preset.pixelRatio as unknown as [number, number];

  useEffect(() => {
    reportQuality(quality);
  }, [quality]);

  // Stable across renders so R3F only calls it on the real `created` event.
  const handleCreated = useCallback(() => {
    setReady(true);
    reportReady(true);
    setLoaded(true);
    setLoadingProgress(1);
  }, [setLoaded, setLoadingProgress]);

  return (
    <div
      className={className}
      data-scene-ready={ready ? "true" : "false"}
      data-quality={quality}
      data-postprocessing={QUALITY_PRESETS[quality].postProcessing ? "true" : "false"}
      data-stars={QUALITY_PRESETS[quality].stars}
      data-testid="scene-root"
    >
      <Canvas
        dpr={dprRange}
        camera={{
          position: CAMERA_DEFAULT_POSITION,
          fov: CAMERA_FOV,
          near: CAMERA_NEAR,
          far: CAMERA_FAR,
        }}
        gl={{
          antialias: true,
          alpha: false,
          stencil: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={handleCreated}
        fallback={<WebGLFallback />}
      >
        {/* Depth cue: far objects drift towards the background colour. */}
        <fogExp2 attach="fog" args={[COLORS.background, FOG_DENSITY]} />
        <Lighting />

        <Suspense fallback={null}>
          <Starfield />
        </Suspense>

        <CameraController />
        <PostProcessing />
        <SceneTelemetry />
      </Canvas>
    </div>
  );
}

export default Scene;
