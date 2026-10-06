/**
 * Core TypeScript contracts for the Solar System Portfolio.
 *
 * The whole site is data-driven: `src/data/*` holds content, these interfaces
 * describe it, and the 3D + 2D layers render whatever they find. Adding a
 * project to `src/data/projects.ts` makes a new planet appear — no other edits.
 */

/** A project — rendered in 3D as a planet orbiting the central star (profile). */
export interface Project {
  id: string;
  title: string;
  /** One-line summary used in list views / hover labels. */
  description: string;
  /** Multi-paragraph detail used in the ProjectPanel. */
  longDescription: string;
  role: string;
  features: string[];
  /** Technology ids — must match ids in `src/data/technologies.ts`. */
  technologies: string[];
  liveUrl?: string;
  sourceUrl?: string;
  image?: string;
  /** Planet colour theme (hex). Drives material, glow, badges, panel accent. */
  color: string;
  /** Relative planet size. 0.4 (small) → 1.4 (large). */
  size: number;
  /** Distance from the star in world units. */
  orbitRadius: number;
  /** Orbital period multiplier — higher means a slower orbit. */
  orbitSpeed: number;
  /** Orbital plane tilt in degrees. */
  orbitInclination?: number;
  /** Starting angle (radians). Auto-distributed when omitted. */
  orbitPhase?: number;
  /** Year / timeframe label shown in the panel. */
  period?: string;
}

export type TechnologyCategory =
  | "frontend"
  | "backend"
  | "database"
  | "devops"
  | "design"
  | "other";

/** A technology — rendered as a satellite orbiting a project planet. */
export interface Technology {
  id: string;
  name: string;
  icon: string;
  category: TechnologyCategory;
  color: string;
  /** Optional link to documentation, opened when a satellite is clicked. */
  docsUrl?: string;
  proficiency?: number; // 0-100, used by the About overlay skill bars
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  label: string;
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  /** Longer, multi-paragraph biography for the About overlay. */
  longBio: string[];
  avatar: string;
  email: string;
  location: string;
  social: SocialLink[];
  resumeUrl: string;
  availability: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  shortcut: string;
}

/** Discriminated union of everything renderable in the scene. */
export type CelestialObjectType =
  | "star"
  | "planet"
  | "satellite"
  | "asteroid"
  | "comet";

/**
 * Extensible base for future celestial objects (Appendix A).
 * Add a new `type`, a canvas component, an overlay and a data file.
 */
export interface CelestialObject {
  type: CelestialObjectType;
  id: string;
  /** Anything else the specific renderer needs. */
  [key: string]: unknown;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  period: string;
  detail: string;
}

export interface SkillGroup {
  label: string;
  icon: string;
  technologies: string[];
}

/** Quality tiers shared by the settings store and the renderer. */
export type Quality = "low" | "medium" | "high";
export type ViewMode = "3d" | "2d";
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface OrbitPosition {
  x: number;
  y: number;
  z: number;
  angle: number;
}
