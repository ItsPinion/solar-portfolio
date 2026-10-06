"use client";

import { useEffect } from "react";
import { useSettingsStore, type SettingsState } from "@/stores/useSettingsStore";
import { detectDeviceQuality, prefersReducedMotion, hasWebGL } from "@/lib/utils";

/**
 * Reflects store state onto <html> so CSS-only features (text scale, high
 * contrast) work without a React re-render.
 */
function applyAccessibilityToDom(state: SettingsState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--text-scale", String(state.textScale));
  root.classList.toggle("high-contrast", state.highContrast);
  root.dataset.reducedMotion = String(state.reducedMotion);
  root.dataset.quality = state.quality;
}

/**
 * ── SETTINGS HYDRATION ────────────────────────────────────────
 * The settings store uses `skipHydration: true` so the server render and the
 * first client render always agree (no hydration mismatch). This component
 * performs the rehydration after mount and layers system preferences on top.
 *
 * Ordering is strict — getting it wrong silently discards persisted values:
 *   1. await `rehydrate()` so localStorage wins over the default state
 *   2. fill in OS `prefers-reduced-motion` *only* if the user never chose
 *   3. probe device capability for an initial quality tier (unless chosen)
 *   4. drop to the 2D fallback when WebGL is unavailable
 */
export function StoreHydration() {
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // 1. restore persisted settings (no-op on first visit)
      await Promise.resolve(useSettingsStore.persist?.rehydrate());
      if (cancelled) return;

      const state = useSettingsStore.getState();

      // 2. OS motion preference — `syncFromSystem` is a no-op once the user
      //    has made an explicit choice (persisted as `userTouchedMotion`).
      state.syncFromSystem(prefersReducedMotion());

      // 3. device-appropriate default quality, only if never chosen
      if (!state.qualityTouched) {
        const detected = detectDeviceQuality();
        if (detected !== state.quality) state.setQuality(detected, { system: true });
      }

      // 4. progressive enhancement — fall back when WebGL is missing
      if (!hasWebGL()) state.setViewMode("2d");

      applyAccessibilityToDom(useSettingsStore.getState());
    };

    void init();

    // Keep the DOM in sync with every subsequent change.
    const unsubscribe = useSettingsStore.subscribe((state) => {
      applyAccessibilityToDom(state);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return null;
}

export default StoreHydration;
