"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  AUTO_ROTATE_SPEED,
  CAMERA_DEFAULT_POSITION,
  CAMERA_MAX_DISTANCE,
  CAMERA_MIN_DISTANCE,
} from "@/lib/constants";
import { clamp, damp } from "@/lib/utils";
import { portfolioApi } from "@/stores/usePortfolioStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

/** Resolve a focus target to a world position, falling back to the star. */
function resolveFocus(focus: [number, number, number] | null): [number, number, number] {
  return focus ?? [0, 0, 0];
}

/**
 * ── CAMERA RIG ────────────────────────────────────────────────
 * Owns the camera's *intent*, not its position:
 *
 *  - `cameraFocus` from the store is eased into the OrbitControls target, so
 *    selecting a planet later glides the view instead of cutting.
 *  - `cameraFocusDistance` is enforced only while `isTransitioning`, which is
 *    what produces the dolly-in on selection without fighting the user's own
 *    zoom afterwards.
 *  - `isTransitioning` is cleared once the camera settles, so the store never
 *    sits in a permanent "moving" state.
 *
 * Store reads happen inside `useFrame` via the imperative `portfolioApi` so
 * camera maths never re-renders React.
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  // Park the camera on first mount so the opening frame is never off-target.
  useEffect(() => {
    camera.position.set(...CAMERA_DEFAULT_POSITION);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Scratch vectors — allocated once, reused every frame (no per-frame garbage).
  const offset = useRef(new Vector3());
  const desiredPosition = useRef(new Vector3());
  const settled = useRef(false);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const state = portfolioApi.get();
    const target = resolveFocus(state.cameraFocus);
    const targetDistance = clamp(
      state.cameraFocusDistance || CAMERA_DEFAULT_POSITION[2],
      CAMERA_MIN_DISTANCE,
      CAMERA_MAX_DISTANCE
    );

    // Ease the look-at point. Reduced motion keeps a short, direct move rather
    // than a long glide (still non-instant, so it never feels like a cut).
    const positionLambda = reducedMotion ? 14 : 3.4;
    const k = damp(positionLambda, delta);
    controls.target.x += (target[0] - controls.target.x) * k;
    controls.target.y += (target[1] - controls.target.y) * k;
    controls.target.z += (target[2] - controls.target.z) * k;

    if (state.isTransitioning && !settled.current) {
      // Hold the requested framing distance while a transition is running:
      // keep the current viewing direction, change only the radius.
      const offsetVector = offset.current.copy(camera.position).sub(controls.target);
      const currentDistance = offsetVector.length() || targetDistance;
      offsetVector.multiplyScalar(targetDistance / currentDistance);
      desiredPosition.current
        .copy(controls.target)
        .add(offsetVector);
      camera.position.lerp(desiredPosition.current, damp(reducedMotion ? 12 : 2.6, delta));

      const targetSettled =
        Math.abs(controls.target.x - target[0]) < 0.02 &&
        Math.abs(controls.target.y - target[1]) < 0.02 &&
        Math.abs(controls.target.z - target[2]) < 0.02 &&
        Math.abs(camera.position.distanceTo(controls.target) - targetDistance) < 0.05;

      if (targetSettled) {
        settled.current = true;
        state.setIsTransitioning(false);
      }
    } else if (!state.isTransitioning && settled.current) {
      settled.current = false;
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      // Idle drift keeps the scene alive; disabled for reduced motion.
      autoRotate={!reducedMotion}
      autoRotateSpeed={AUTO_ROTATE_SPEED}
      enableDamping
      dampingFactor={reducedMotion ? 0.2 : 0.06}
      enablePan={false}
      // Never dive through the star or fly out past the starfield shell.
      minDistance={CAMERA_MIN_DISTANCE}
      maxDistance={CAMERA_MAX_DISTANCE}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI * 0.86}
      makeDefault
    />
  );
}

export default CameraRig;
