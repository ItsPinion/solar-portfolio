import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Frame-rate independent damping factor for useFrame lerps. */
export function damp(lambda: number, dt: number) {
  return 1 - Math.exp(-lambda * dt);
}

/** Convert a hex colour to `rgba()` with the given alpha. */
export function hexToRgba(hex: string, alpha = 1) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Slightly lighten (amount > 0) or darken (amount < 0) a hex colour. */
export function shadeColor(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = parseInt(full, 16);
  const clampChannel = (v: number) => Math.round(clamp(v, 0, 255));
  const r = clampChannel(((int >> 16) & 255) + 255 * amount);
  const g = clampChannel(((int >> 8) & 255) + 255 * amount);
  const b = clampChannel((int & 255) + 255 * amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Deterministic pseudo-random generator (mulberry32).
 * Used for procedural planet textures and starfields so results are stable
 * between server render, client render and screenshots.
 */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a string to a stable 32-bit integer seed. */
export function hashString(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Format a duration in seconds as `m:ss`. */
export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Small helper for aria-live announcements. */
export function announce(message: string) {
  if (typeof document === "undefined") return;
  const region = document.getElementById("solar-live-region");
  if (region) region.textContent = message;
}

/** True when the user's OS requests reduced motion. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Rough device-capability probe used to pick a default quality tier
 * (Phase 9 step 7). Returns 'low' for constrained devices.
 */
export function detectDeviceQuality(): "low" | "medium" | "high" {
  if (typeof window === "undefined") return "medium";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const isSmall = window.innerWidth < 768;

  let score = 0;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  if (memory >= 8) score += 1;
  if (isMobile) score -= 1;
  if (isSmall) score -= 1;

  if (score <= 0) return "low";
  if (score <= 2) return "medium";
  return "high";
}

/** Feature detect WebGL2 with a fallback to WebGL1 (Phase 11 progressive enhancement). */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/** Pluralise a word without pulling in a dependency. */
export function pluralise(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : plural ?? `${singular}s`;
}
