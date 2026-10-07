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
    nebulae: 2,
    nebulaTextureSize: 128,
  },
  medium: {
    stars: 5000,
    sphereSegments: 32,
    satelliteSegments: 12,
    postProcessing: true,
    shadows: false,
    pixelRatio: [1, 1.5] as [number, number],
    flares: 120,
    nebulae: 3,
    nebulaTextureSize: 192,
  },
  high: {
    stars: 8000,
    sphereSegments: 64,
    satelliteSegments: 16,
    postProcessing: true,
    shadows: true,
    pixelRatio: [1, 2] as [number, number],
    flares: 300,
    nebulae: 3,
    nebulaTextureSize: 256,
  },
} as const satisfies Record<Quality, Record<string, unknown>>;

/** Starfield shell radius — stars are distributed on this sphere. */
export const STARFIELD_RADIUS = 200;

/* ============================================================
   Phase 2 — camera rig, starfield look & scene depth
   ============================================================ */

export const CAMERA_FOV = 55;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1200;

/** Very subtle exponential fog: shapes the depth read without hiding stars. */
export const FOG_DENSITY = 0.0018;

/** Stars occupy this fraction of `STARFIELD_RADIUS` (inner → outer shell). */
export const STARFIELD_INNER_FRACTION = 0.72;

/** Portion of stars gathered into the tilted galactic band (milky way). */
export const STARFIELD_BAND_FRACTION = 0.34;
export const STARFIELD_BAND_TILT_DEG = 26;

/** Star point size range (world units) and on-screen clamps (pixels). */
export const STAR_SIZE_RANGE: [number, number] = [0.01, 0.05];
export const STAR_MIN_PIXEL_SIZE = 1;
export const STAR_MAX_PIXEL_SIZE = 9;

/**
 * Converts the world-space size range above into a readable on-screen size.
 * At the starfield shell distance a 0.05-unit star would project to a fraction
 * of a pixel, so a single gain factor maps the range onto ~1–5 px — varied
 * enough to read as depth, small enough to still look like a night sky.
 */
export const STAR_SIZE_SCALE = 42;

/**
 * Star radiance model (HDR, before tone mapping).
 *
 * The scene is rendered in high dynamic range and tone mapped with ACES, so
 * these values are *linear light*, not display brightness: the faint majority
 * sit just above the noise floor while the brightest stars reach ~2.5 and read
 * as white-hot. `STAR_RADIANCE_EXPONENT` correlates brightness with size so the
 * big stars are also the bright ones, like a real sky.
 */
export const STAR_SIZE_EXPONENT = 2.4;
export const STAR_RADIANCE_MIN = 0.05;
export const STAR_RADIANCE_MAX = 6.2;
export const STAR_RADIANCE_EXPONENT = 3.0;

/** Additive gain applied to nebula clouds so they survive tone mapping. */
export const NEBULA_COLOR_GAIN = [3.0, 3.0, 3.0] as [number, number, number];

/** Twinkle: per-star speed range (radians/second) and modulation depth. */
export const STAR_TWINKLE_SPEED: [number, number] = [0.25, 1.5];
export const STAR_TWINKLE_AMOUNT = 0.45;

/** Where nebula billboards sit relative to the starfield shell. */
export const NEBULA_RADIUS = STARFIELD_RADIUS * 1.25;
export const NEBULA_SIZE = 620;

/** Idle time before the camera resumes its slow auto-rotation (ms). */
export const AUTO_ROTATE_RESUME_MS = 12_000;
/** Angular speed (radians/second) of the idle auto-rotation. */
export const AUTO_ROTATE_RADIANS = 0.018;
/** Damping used by the animated focus/zoom transitions (higher = snappier). */
export const CAMERA_TRANSITION_LAMBDA = 2.6;

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
