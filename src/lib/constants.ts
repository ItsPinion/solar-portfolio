import type { Quality } from "@/types";

/* ============================================================
   Orbital mechanics & scene constants (Phase 1 / Phase 4)
   ============================================================ */

/** Base angular speed (radians per second at 60fps normalised time). */
export const ORBIT_SPEED_BASE = 0.001;

/** Satellite orbital radius around its parent planet (in planet radii). */
export const SATELLITE_ORBIT_RADIUS = 0.8;

/** Satellite mesh size. Planets are 5–15× larger, keeping them distinct. */
export const SATELLITE_SIZE = 0.15;

/** Sun radius in world units. */
export const STAR_SIZE = 2.5;

/** Where the camera sits on first load (overview). */
export const CAMERA_DEFAULT_POSITION: [number, number, number] = [0, 25, 35];

/** Camera offset used when focusing a planet. */
export const CAMERA_PLANET_ZOOM: [number, number, number] = [0, 5, 8];

/** Camera offset used when focusing the star (profile hub). */
export const CAMERA_STAR_ZOOM: [number, number, number] = [0, 3, 9];

export const CAMERA_MIN_DISTANCE = 10;
export const CAMERA_MAX_DISTANCE = 60;

export const COLORS = {
  starGlow: "#FDB813",
  starCore: "#FFF5E0",
  starCorona: "#FF8A00",
  orbitPath: "rgba(255, 255, 255, 0.08)",
  orbitHighlight: "rgba(255, 255, 255, 0.25)",
  background: "#050510",
  nebulaPurple: "#1a0533",
  nebulaBlue: "#0a1628",
} as const;

/* ============================================================
   Quality tiers — drive segment counts, particle budgets and
   whether post-processing runs at all (Phase 9 / Phase 11).
   ============================================================ */
export const QUALITY_PRESETS = {
  low: {
    stars: 3000,
    sphereSegments: 20,
    satelliteSegments: 8,
    postProcessing: false,
    shadows: false,
    pixelRatio: [1, 1.25] as [number, number],
    flares: 0,
  },
  medium: {
    stars: 5000,
    sphereSegments: 32,
    satelliteSegments: 12,
    postProcessing: true,
    shadows: false,
    pixelRatio: [1, 1.5] as [number, number],
    flares: 120,
  },
  high: {
    stars: 8000,
    sphereSegments: 64,
    satelliteSegments: 16,
    postProcessing: true,
    shadows: true,
    pixelRatio: [1, 2] as [number, number],
    flares: 300,
  },
} as const satisfies Record<Quality, Record<string, unknown>>;

/** Starfield shell radius — stars are distributed on this sphere. */
export const STARFIELD_RADIUS = 200;

/* ============================================================
   Motion / interaction
   ============================================================ */
export const HOVER_SCALE = 1.15;
export const CAMERA_TRANSITION_DURATION = 1.2; // seconds
export const AUTO_ROTATE_SPEED = 0.1;

/** Number of projects beyond which orbit radii are auto-distributed. */
export const ORBIT_RADIUS_MIN = 4;
export const ORBIT_RADIUS_MAX = 19;

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** Below this width the 3D scene is replaced by the touch-optimised layout. */
export const MOBILE_3D_MIN_WIDTH = 768;

export const STORAGE_KEYS = {
  settings: "solar-portfolio:settings",
  visited: "solar-portfolio:visited",
} as const;
