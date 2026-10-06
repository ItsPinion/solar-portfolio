"use client";

import { create } from "zustand";
import type { Project, Technology } from "@/types";
import { CAMERA_DEFAULT_POSITION } from "@/lib/constants";
import { projects as projectCollections, getProject } from "@/data/projects";

/** Canonical project list used for indexing / cycling. */
export const projectData = projectCollections;

export type PanelId = "profile" | "about" | "contact" | "settings" | "shortcuts" | null;
export type ViewLabel = string;

/**
 * ── MAIN APPLICATION STORE ────────────────────────────────────
 * Single source of truth for selection, camera intent and UI surfaces.
 * The 3D layer subscribes imperatively (via `getState()` inside useFrame)
 * so store updates never re-render the whole canvas.
 */
export interface PortfolioState {
  /* ── selection ─────────────────────────────────────────── */
  selectedPlanet: string | null;
  hoveredPlanet: string | null;
  activeSection: string;
  /** Technology highlighted from the 2D panel → 3D satellite link-up. */
  highlightedTechnology: string | null;

  /* ── camera intent ─────────────────────────────────────── */
  cameraTarget: [number, number, number];
  cameraZoom: number;
  /** Focus target in world space; `null` means "look at the star/origin". */
  cameraFocus: [number, number, number] | null;
  cameraFocusDistance: number;
  isTransitioning: boolean;

  /* ── UI surfaces ───────────────────────────────────────── */
  openPanel: PanelId;
  isLoaded: boolean;
  loadingProgress: number;
  /** Intro sequence only plays on the first visit of a session. */
  hasEntered: boolean;
  helpOpen: boolean;

  /* ── actions ───────────────────────────────────────────── */
  selectPlanet: (id: string | null) => void;
  hoverPlanet: (id: string | null) => void;
  setActiveSection: (section: string) => void;
  setHighlightedTechnology: (id: string | null) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraZoom: (zoom: number) => void;
  focusCamera: (target: [number, number, number] | null, distance?: number) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  openPanelById: (panel: PanelId) => void;
  closePanelById: () => void;
  toggleProfile: () => void;
  setLoaded: (loaded?: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setHasEntered: (entered: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  resetView: () => void;
  stepPlanet: (direction: 1 | -1) => void;
  jumpToPlanetIndex: (index: number) => void;
}

/** Evenly distribute starting angles when a project omits `orbitPhase`. */
function autoPhase(index: number, total: number) {
  return (index / Math.max(total, 1)) * Math.PI * 2;
}

export function projectPhase(project: Project, index: number) {
  return project.orbitPhase ?? autoPhase(index, projectData.length);
}

/** Convenience re-exports so components can import data + store together. */
export { getProject };

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  selectedPlanet: null,
  hoveredPlanet: null,
  activeSection: "home",
  highlightedTechnology: null,

  cameraTarget: [...CAMERA_DEFAULT_POSITION] as [number, number, number],
  cameraZoom: 1,
  cameraFocus: [0, 0, 0],
  cameraFocusDistance: 45,
  isTransitioning: false,

  openPanel: null,
  isLoaded: false,
  loadingProgress: 0,
  hasEntered: false,
  helpOpen: false,

  selectPlanet: (id) =>
    set((state) => {
      if (state.selectedPlanet === id) return {};
      return {
        selectedPlanet: id,
        activeSection: id ? "projects" : "home",
        // Selecting a planet supersedes any open overlay; closing parks the
        // camera back on the star.
        openPanel: id ? null : state.openPanel === "profile" ? null : state.openPanel,
        // `null` tells the camera rig to track the planet's *live* position
        // rather than a fixed point — orbits never stop moving in 3D mode.
        cameraFocus: null,
        isTransitioning: true,
      };
    }),

  hoverPlanet: (id) => set({ hoveredPlanet: id }),
  setActiveSection: (section) => set({ activeSection: section }),
  setHighlightedTechnology: (id) => set({ highlightedTechnology: id }),

  setCameraTarget: (target) => set({ cameraTarget: target }),
  setCameraZoom: (zoom) => set({ cameraZoom: zoom }),

  focusCamera: (target, distance) =>
    set({
      cameraFocus: target ?? [0, 0, 0],
      cameraFocusDistance: distance ?? (target ? 7 : 45),
      isTransitioning: true,
    }),

  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

  openPanelById: (panel) =>
    set((state) => {
      if (state.openPanel === panel) return {};
      return {
        openPanel: panel,
        activeSection: panel ?? "home",
        // Opening a content overlay deselects any planet so the two never fight.
        selectedPlanet: panel ? null : state.selectedPlanet,
      };
    }),

  closePanelById: () =>
    set((state) => {
      const wasProfile = state.openPanel === "profile";
      return {
        openPanel: null,
        activeSection: state.selectedPlanet ? "projects" : "home",
        ...(wasProfile ? { cameraFocus: null } : {}),
      };
    }),

  toggleProfile: () =>
    set((state) => {
      const next = state.openPanel === "profile" ? null : "profile";
      return { openPanel: next, activeSection: next ? "about" : "home" };
    }),

  setLoaded: (loaded = true) => set({ isLoaded: loaded }),
  setLoadingProgress: (progress) =>
    set((state) =>
      progress < state.loadingProgress ? {} : { loadingProgress: Math.min(progress, 1) }
    ),
  setHasEntered: (entered) => set({ hasEntered: entered }),
  setHelpOpen: (open) => set({ helpOpen: open }),

  resetView: () =>
    set({
      selectedPlanet: null,
      hoveredPlanet: null,
      activeSection: "home",
      openPanel: null,
      highlightedTechnology: null,
      cameraFocus: [0, 0, 0],
      cameraFocusDistance: 45,
      isTransitioning: true,
    }),

  stepPlanet: (direction) =>
    set((state) => {
      const total = projectData.length;
      if (!total) return {};
      const current = state.selectedPlanet
        ? projectData.findIndex((p) => p.id === state.selectedPlanet)
        : direction === 1
          ? -1
          : 0;
      const next = ((current + direction) % total + total) % total;
      return {
        selectedPlanet: projectData[next].id,
        activeSection: "projects",
        openPanel: null,
        isTransitioning: true,
      };
    }),

  jumpToPlanetIndex: (index) =>
    set(() => {
      if (index < 0 || index >= projectData.length) return {};
      return {
        selectedPlanet: projectData[index].id,
        activeSection: "projects",
        openPanel: null,
        isTransitioning: true,
      };
    }),
}));

/* ── Selector helpers (keep re-renders surgical) ─────────────── */
export const selectSelectedProject = (state: PortfolioState) =>
  getProject(state.selectedPlanet);

export const selectHighlightedTechnologyObject = (
  state: PortfolioState
): string | null => state.highlightedTechnology;

/** Non-reactive accessor for hot loops (useFrame, event handlers). */
export const portfolioApi = {
  get: () => usePortfolioStore.getState(),
};

export type { Project, Technology };
