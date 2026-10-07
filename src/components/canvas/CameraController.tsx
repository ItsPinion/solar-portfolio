"use client";

import { useCallback, useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  AUTO_ROTATE_RESUME_MS,
  AUTO_ROTATE_SPEED,
  CAMERA_MAX_DISTANCE,
  CAMERA_MIN_DISTANCE,
  CAMERA_TRANSITION_LAMBDA,
} from "@/lib/constants";
import { isCameraFrozen } from "@/lib/scene-telemetry";
import { clamp, damp } from "@/lib/utils";
import { usePortfolioStore } from "@/stores/usePortfolioStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

/** Keep the camera off the poles so the view can never flip upside down. */
const MIN_POLAR_ANGLE = Math.PI * 0.12;
const MAX_POLAR_ANGLE = Math.PI * 0.88;

/** Arrival thresholds for a store-driven transition. */
const DISTANCE_EPSILON = 0.12;
const TARGET_EPSILON = 0.15;

const ORIGIN = new THREE.Vector3(0, 0, 0);

/**
 * ── CAMERA CONTROLLER ─────────────────────────────────────────
 * Wraps drei's `OrbitControls` and layers the app's camera *intent* on top:
 *
 *  • drag to orbit, wheel/pinch to zoom, hard-clamped between 10 and 60 units
 *  • damping (inertia) at 0.05, no panning so the composition stays intact
 *  • slow idle auto-rotation that stops the moment the user touches anything
 *    and resumes after a quiet spell
 *  • smooth transitions whenever the portfolio store changes `cameraFocus`,
 *    `cameraFocusDistance`, `cameraZoom` or the selected planet
 *
 * The transition is written directly onto the camera/target inside `useFrame`
 * and then handed back to `controls.update()`, so inertia keeps working while
 * a transition is in flight. The moment the user interacts, the transition is
 * released — nothing fights the user for control.
 *
 * When a planet is selected `cameraFocus` is `null`, which means "track the
 * live position" — the planet object is looked up in the scene graph by name
 * (`planet-<id>`, created in Phase 4) so the camera follows the orbit instead
 * of a frozen coordinate.
 */
export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, scene } = useThree();

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  /** True while a store-driven dolly transition has not reached its distance. */
  const dollyingRef = useRef(false);
  /** Cached focus point so the camera doesn't chase a moving target forever. */
  const focusRef = useRef(new THREE.Vector3(0, 0, 0));
  const idleTimerRef = useRef<number | null>(null);
  const interactingRef = useRef(false);
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  /** Desired orbit distance for the current store intent. */
  const desiredDistance = useCallback(() => {
    const { cameraFocusDistance, cameraZoom } = usePortfolioStore.getState();
    const zoom = clamp(cameraZoom || 1, 0.35, 3);
    return clamp(cameraFocusDistance / zoom, CAMERA_MIN_DISTANCE, CAMERA_MAX_DISTANCE);
  }, []);

  /* ── start/stop the auto-rotation around user interaction ──── */
  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleAutoRotate = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(() => {
      const controls = controlsRef.current;
      if (!controls || reducedMotionRef.current || interactingRef.current) return;
      controls.autoRotate = true;
      controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
    }, AUTO_ROTATE_RESUME_MS);
  }, [clearIdleTimer]);

  const handleInteraction = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // The user takes over: stop the auto-rotation …
    controls.autoRotate = false;
    // … and release any in-flight transition so nothing fights the gesture.
    if (dollyingRef.current) {
      dollyingRef.current = false;
      usePortfolioStore.getState().setIsTransitioning(false);
    }
    scheduleAutoRotate();
  }, [scheduleAutoRotate]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const element = controls.domElement;
    if (!element) return;

    const onPointerDown = () => {
      interactingRef.current = true;
      handleInteraction();
    };
    const onPointerUp = () => {
      interactingRef.current = false;
      scheduleAutoRotate();
    };
    const onWheel = () => handleInteraction();
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "+", "-"].includes(event.key)) {
        handleInteraction();
      }
    };

    element.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    element.addEventListener("wheel", onWheel, { passive: true });
    element.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKey);
      clearIdleTimer();
    };
  }, [handleInteraction, scheduleAutoRotate, clearIdleTimer]);

  /* ── reduced motion: no idle drift, no dolly animation ─────── */
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (reducedMotion) {
      controls.autoRotate = false;
      clearIdleTimer();
    } else {
      scheduleAutoRotate();
    }
  }, [reducedMotion, scheduleAutoRotate, clearIdleTimer]);

  /**
   * Store intent → camera. Subscribing imperatively keeps store writes from
   * re-rendering the canvas; only a change of *intent* starts a transition.
   */
  useEffect(() => {
    const unsubscribeFocus = usePortfolioStore.subscribe((state, previous) => {
      const focusChanged =
        state.cameraFocus !== previous.cameraFocus ||
        state.cameraFocusDistance !== previous.cameraFocusDistance ||
        state.cameraZoom !== previous.cameraZoom ||
        state.selectedPlanet !== previous.selectedPlanet;
      if (!focusChanged) return;

      dollyingRef.current = true;
      if (state.selectedPlanet !== previous.selectedPlanet) {
        // A new subject: keep auto-rotation but slow it right down.
        const controls = controlsRef.current;
        if (controls) controls.autoRotateSpeed = AUTO_ROTATE_SPEED * 0.5;
      }
    });

    return () => unsubscribeFocus();
  }, []);

  /** Resolve the point the camera should orbit around right now. */
  const resolveFocus = useCallback(
    (selectedPlanet: string | null, storeFocus: [number, number, number] | null) => {
      if (selectedPlanet) {
        // Live planet position (created in Phase 4); falls back to the store.
        const planet = scene.getObjectByName(`planet-${selectedPlanet}`);
        if (planet) {
          planet.getWorldPosition(focusRef.current);
          return focusRef.current;
        }
      }
      if (storeFocus) {
        focusRef.current.set(storeFocus[0], storeFocus[1], storeFocus[2]);
      } else if (!selectedPlanet) {
        focusRef.current.copy(ORIGIN);
      }
      return focusRef.current;
    },
    [scene]
  );

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Deterministic capture / E2E: hold the camera perfectly still so frame
    // comparisons only see the things under test (twinkle, bloom, …).
    if (isCameraFrozen()) {
      controls.autoRotate = false;
      return;
    }

    const dt = Math.min(delta, 0.05);
    const { selectedPlanet, cameraFocus } = usePortfolioStore.getState();
    const focusPoint = resolveFocus(selectedPlanet, cameraFocus);

    // Frame-rate independent smoothing (higher lambda = snappier).
    const follow = damp(CAMERA_TRANSITION_LAMBDA, dt);

    const offset = camera.position.clone().sub(controls.target);
    if (offset.lengthSq() < 1e-6) offset.set(0, 0, 1);

    if (dollyingRef.current) {
      const target = desiredDistance();
      const next = offset.length() + (target - offset.length()) * follow;
      offset.setLength(clamp(next, CAMERA_MIN_DISTANCE, CAMERA_MAX_DISTANCE));
    }

    controls.target.lerp(focusPoint, follow);
    camera.position.copy(controls.target).add(offset);

    // NOTE: deliberately *not* `controls.update()` here — drei's OrbitControls
    // already runs it once per frame at useFrame priority -1 (before this
    // callback), so a second call would double-apply damping and the idle
    // auto-rotation. `lookAt` is absolute, so re-aiming is safe.
    camera.lookAt(controls.target);

    // Retire the transition once the dolly has settled.
    if (dollyingRef.current) {
      const settled =
        Math.abs(offset.length() - desiredDistance()) < DISTANCE_EPSILON &&
        camera.position.distanceTo(controls.target) > 0;
      if (settled) {
        dollyingRef.current = false;
        usePortfolioStore.getState().setIsTransitioning(false);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.6}
      // drei/three-stdlib apply one dolly step per wheel event, scaled by
      // `0.95 ** zoomSpeed`. At the default 1.0 that is ~5% per click, which
      // needs 35 clicks to cross the 10–60 range — far too slow. ~10% per
      // click crosses it in 15 and still feels smooth on a trackpad.
      zoomSpeed={1.8}
      minDistance={CAMERA_MIN_DISTANCE}
      maxDistance={CAMERA_MAX_DISTANCE}
      minPolarAngle={MIN_POLAR_ANGLE}
      maxPolarAngle={MAX_POLAR_ANGLE}
      autoRotate
      autoRotateSpeed={AUTO_ROTATE_SPEED}
    />
  );
}

export default CameraController;
