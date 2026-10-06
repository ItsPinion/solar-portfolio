/**
 * Deterministic starfield generation.
 *
 * Kept free of three.js / DOM so it can be unit-tested directly and so the
 * server render, client render and every screenshot agree on star positions.
 * `Starfield.tsx` uploads the result as buffer attributes.
 */
import {
  STARFIELD_RADIUS,
  STARFIELD_INNER_RATIO,
  STARFIELD_BAND_RATIO,
  STARFIELD_BAND_THICKNESS,
  STARFIELD_BAND_TILT,
} from "@/lib/constants";
import { seededRandom, hashString } from "@/lib/utils";

/** Weighted star palette taken from the Appendix B design tokens. */
const STAR_PALETTE: ReadonlyArray<readonly [hex: string, weight: number]> = [
  ["#FFF5E0", 0.54], // star-white  — warm white, the majority
  ["#FFFFFF", 0.18], // pure white — distant pinpoints
  ["#AFC8FF", 0.11], // blue-white — hot young stars
  ["#FDB813", 0.11], // star-gold  — the accent colour
  ["#C9A6FF", 0.06], // violet — nebula-embedded stragglers
];

export interface StarfieldOptions {
  /** How many stars to generate (quality tier budget). */
  count: number;
  /** Any string or number; identical seeds produce identical skies. */
  seed?: string | number;
  radius?: number;
  /** 0–1 share of stars pulled into the galactic band. */
  bandRatio?: number;
  /** Band tilt in degrees. */
  bandTilt?: number;
}

export interface StarfieldData {
  count: number;
  /** xyz triples in world units. */
  positions: Float32Array;
  /** rgb triples, 0–1. */
  colors: Float32Array;
  /** Per-star base size in world units (converted to px in the shader). */
  sizes: Float32Array;
  /** Per-star twinkle phase, 0–1. */
  phases: Float32Array;
}

/** Resolve a colour token and push its channels into `out` at `offset`. */
function writeColor(out: Float32Array, offset: number, hex: string) {
  const int = parseInt(hex.replace("#", ""), 16);
  out[offset] = ((int >> 16) & 255) / 255;
  out[offset + 1] = ((int >> 8) & 255) / 255;
  out[offset + 2] = (int & 255) / 255;
}

function pickColor(random: () => number) {
  let roll = random();
  for (const [hex, weight] of STAR_PALETTE) {
    roll -= weight;
    if (roll <= 0) return hex;
  }
  return STAR_PALETTE[0][0];
}

/**
 * Build a star shell.
 *
 * Stars are distributed on a thick shell (never a perfect sphere — that reads
 * as a flat band) and a fraction of them are squeezed toward a tilted plane to
 * fake a Milky Way. Sizes follow a cubic falloff so a few stars dominate.
 */
export function generateStars(options: StarfieldOptions): StarfieldData {
  const {
    count,
    seed = "solar-portfolio",
    radius = STARFIELD_RADIUS,
    bandRatio = STARFIELD_BAND_RATIO,
    bandTilt = STARFIELD_BAND_TILT,
  } = options;

  const random = seededRandom(
    typeof seed === "number" ? seed : hashString(seed)
  );

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const tilt = (bandTilt * Math.PI) / 180;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);
  const bandCount = Math.floor(count * bandRatio);

  for (let i = 0; i < count; i++) {
    const inBand = i < bandCount;

    // Uniform direction on a sphere.
    const theta = random() * Math.PI * 2;
    const cosPhi = random() * 2 - 1;
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));

    let x = sinPhi * Math.cos(theta);
    let y = cosPhi;
    let z = sinPhi * Math.sin(theta);

    if (inBand) {
      // Flatten toward the band plane, then tilt the whole plane.
      const squeeze = STARFIELD_BAND_THICKNESS * (random() + random() - 1);
      y = squeeze;
      const len = Math.hypot(x, y, z) || 1;
      x /= len;
      y /= len;
      z /= len;
      const ty = y * cosTilt - z * sinTilt;
      const tz = y * sinTilt + z * cosTilt;
      y = ty;
      z = tz;
    }

    // Shell thickness — biased outward so the "sky" feels layered.
    const shell = STARFIELD_INNER_RATIO + (1 - STARFIELD_INNER_RATIO) * Math.sqrt(random());
    const r = radius * shell;

    positions[i * 3] = x * r;
    positions[i * 3 + 1] = y * r;
    positions[i * 3 + 2] = z * r;

    writeColor(colors, i * 3, pickColor(random));

    // Cubic falloff: most stars cluster near the floor, rare giants reach ~2.4.
    // The floor keeps the field legible on high-DPI screens where a 1px point
    // would otherwise vanish between device pixels.
    sizes[i] = 0.7 + Math.pow(random(), 3) * 1.7;
    phases[i] = random();
  }

  return { count, positions, colors, sizes, phases };
}

/** Total number of vertices a dataset will upload — handy for assertions. */
export function starfieldVertexCount(data: StarfieldData) {
  return data.positions.length / 3;
}
