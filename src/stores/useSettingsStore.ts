"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";
import type { Quality, ViewMode } from "@/types";

/**
 * ── SETTINGS STORE ────────────────────────────────────────────
 * Persisted to localStorage so preferences survive reloads
 * (Phase 7 testing criterion). Also mirrors `prefers-reduced-motion`
 * from the OS on first visit.
 */
export interface SettingsState {
  reducedMotion: boolean;
  soundEnabled: boolean;
  showOrbits: boolean;
  showLabels: boolean;
  quality: Quality;
  viewMode: ViewMode;
  highContrast: boolean;
  textScale: number;
  /** True when the user has explicitly set the motion preference (blocks OS sync). */
  userTouchedMotion: boolean;
  /** True when the user has explicitly picked a quality tier (blocks auto-detection). */
  qualityTouched: boolean;

  toggleReducedMotion: () => void;
  toggleSound: () => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  /**
   * Set the quality tier. Pass `{ system: true }` for automatic/adaptive
   * changes so they don't count as an explicit user preference.
   */
  setQuality: (q: Quality, opts?: { system?: boolean }) => void;
  setViewMode: (mode: ViewMode) => void;
  setReducedMotion: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setTextScale: (value: number) => void;
  resetSettings: () => void;
  /** Called once on hydration to honour the OS motion preference. */
  syncFromSystem: (prefersReduced: boolean) => void;
}

export const DEFAULT_SETTINGS = {
  reducedMotion: false,
  soundEnabled: false,
  showOrbits: true,
  showLabels: true,
  quality: "high" as Quality,
  viewMode: "3d" as ViewMode,
  highContrast: false,
  textScale: 1,
  userTouchedMotion: false,
  qualityTouched: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      toggleReducedMotion: () =>
        set({ reducedMotion: !get().reducedMotion, userTouchedMotion: true }),
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
      toggleOrbits: () => set({ showOrbits: !get().showOrbits }),
      toggleLabels: () => set({ showLabels: !get().showLabels }),
      setQuality: (q, opts) =>
        set(opts?.system ? { quality: q } : { quality: q, qualityTouched: true }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setReducedMotion: (value) =>
        set({ reducedMotion: value, userTouchedMotion: true }),
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setHighContrast: (value) => set({ highContrast: value }),
      setTextScale: (value) => set({ textScale: Math.min(1.4, Math.max(0.85, value)) }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),

      syncFromSystem: (prefersReduced) => {
        if (get().userTouchedMotion) return;
        set({ reducedMotion: prefersReduced });
      },
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // `viewMode` is transient so a stale "2d" value can't hide the 3D scene
      // on a capable device after a viewport change.
      partialize: (state) => ({
        reducedMotion: state.reducedMotion,
        soundEnabled: state.soundEnabled,
        showOrbits: state.showOrbits,
        showLabels: state.showLabels,
        quality: state.quality,
        highContrast: state.highContrast,
        textScale: state.textScale,
        userTouchedMotion: state.userTouchedMotion,
        qualityTouched: state.qualityTouched,
      }),
      skipHydration: true,
    }
  )
);

/* ── Selector helpers ────────────────────────────────────────── */
export const selectMotionOff = (s: SettingsState) => s.reducedMotion;
export const selectQuality = (s: SettingsState) => s.quality;
