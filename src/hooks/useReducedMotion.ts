"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * Returns `true` when motion should be reduced — either because the OS
 * reports `prefers-reduced-motion: reduce`, or because the user toggled the
 * in-app setting. The first system read also seeds the settings store so the
 * 3D layer (which reads the store, not the hook) stays in sync.
 */
export function useReducedMotion(): boolean {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const syncFromSystem = useSettingsStore((s) => s.syncFromSystem);
  const [systemPrefers, setSystemPrefers] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemPrefers(query.matches);
    syncFromSystem(query.matches);

    const handler = (event: MediaQueryListEvent) => {
      setSystemPrefers(event.matches);
      syncFromSystem(event.matches);
    };

    query.addEventListener?.("change", handler);
    return () => query.removeEventListener?.("change", handler);
  }, [syncFromSystem]);

  return reducedMotion || systemPrefers;
}

export default useReducedMotion;
