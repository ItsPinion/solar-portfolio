/**
 * Procedurally generated textures.
 *
 * Everything the scene paints is drawn at runtime on a <canvas> rather than
 * downloaded, which keeps the page dependency-free, offline-safe and identical
 * between runs (all randomness comes from `seededRandom`).
 *
 * Browser-only: call from effects, never during SSR.
 */
import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { seededRandom, hashString, hexToRgba } from "@/lib/utils";

function createCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return { canvas, ctx };
}

/**
 * Vertical space gradient used as the scene background.
 * Matches the `bg-nebula-gradient` token so the 3D and 2D views agree.
 *
 * The gradient spans a very narrow luminance range at the dark end, so an
 * undithered 8-bit render shows visible contour bands (measured at 3/255 steps
 * across a 1440px row). A ±1-level noise dither breaks those plateaus up into
 * imperceptible grain — the same trick CSS gradient authors use, done at the
 * pixel level here. Noise is generated per *texture* pixel at 1024², which is
 * close enough to screen resolution to stay effective after stretching.
 */
export function createSkyGradientTexture(size = 1024): Texture | null {
  const made = createCanvas(size);
  if (!made) return null;
  const { canvas, ctx } = made;

  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, "#180630");
  base.addColorStop(0.42, "#0a1628");
  base.addColorStop(1, "#050510");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Radial glows give the flat gradient some depth.
  const glows: Array<[number, number, number, string]> = [
    [size * 0.28, size * 0.16, size * 0.62, "rgba(106, 43, 181, 0.42)"],
    [size * 0.82, size * 0.34, size * 0.5, "rgba(30, 95, 168, 0.3)"],
    [size * 0.55, size * 0.86, size * 0.55, "rgba(10, 22, 40, 0.55)"],
  ];
  for (const [x, y, r, color] of glows) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(5, 5, 16, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  // Final vignette keeps the corners black so orbits stay legible.
  const vignette = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.2,
    size / 2,
    size / 2,
    size * 0.72
  );
  vignette.addColorStop(0, "rgba(5, 5, 16, 0)");
  vignette.addColorStop(1, "rgba(5, 5, 16, 0.92)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  applyDither(ctx, size, size, 1.35);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Add fine zero-mean noise to break up 8-bit gradient banding.
 *
 * Amplitude is in 0–255 levels and deliberately sub-visible (±1–2) — enough to
 * dissolve contour edges, not enough to read as grain. Alpha is never touched,
 * so masking that happened earlier is preserved.
 */
function applyDither(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amplitude = 1.35
) {
  const image = ctx.getImageData(0, 0, width, height);
  const { data } = image;
  const random = seededRandom(0x5eed);

  for (let i = 0; i < data.length; i += 4) {
    const noise = (random() - 0.5) * 2 * amplitude;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }

  ctx.putImageData(image, 0, 0);
}

export interface NebulaTextureOptions {
  color: string;
  /** Secondary hue mixed in for depth. */
  secondaryColor?: string;
  seed?: string | number;
  size?: number;
  /** Number of soft blobs composited into the wisp. */
  blobs?: number;
}

/**
 * A soft, cloudy wisp: many blurred-looking radial blobs, then a radial mask
 * so the sprite fades to nothing at its edges (no visible square billboard).
 */
export function createNebulaTexture({
  color,
  secondaryColor,
  seed = color,
  size = 512,
  blobs = 54,
}: NebulaTextureOptions): Texture | null {
  const made = createCanvas(size);
  if (!made) return null;
  const { canvas, ctx } = made;

  const random = seededRandom(
    typeof seed === "number" ? seed : hashString(seed)
  );

  // Faint base wash so gaps between blobs are not pure black.
  const wash = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size * 0.5
  );
  wash.addColorStop(0, hexToRgba(color, 0.16));
  wash.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < blobs; i++) {
    const cx = size * (0.5 + (random() - 0.5) * 0.86);
    const cy = size * (0.5 + (random() - 0.5) * 0.86);
    const r = size * (0.05 + random() * 0.2);
    const alpha = 0.06 + random() * 0.16;
    const tint =
      secondaryColor && random() > 0.7 ? secondaryColor : color;

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, hexToRgba(tint, alpha));
    g.addColorStop(0.55, hexToRgba(tint, alpha * 0.4));
    g.addColorStop(1, hexToRgba(tint, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edge mask — soft circular falloff.
  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size * 0.5
  );
  mask.addColorStop(0, "rgba(0, 0, 0, 1)");
  mask.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
  mask.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Radial glow sprite — reused for the star's corona (Phase 3) and any
 * halo accents. `innerStop` controls how tight the core is.
 */
export function createGlowTexture(
  color = "#FDB813",
  { size = 256, innerStop = 0.18 }: { size?: number; innerStop?: number } = {}
): Texture | null {
  const made = createCanvas(size);
  if (!made) return null;
  const { canvas, ctx } = made;

  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  g.addColorStop(innerStop, hexToRgba(color, 0.75));
  g.addColorStop(0.45, hexToRgba(color, 0.22));
  g.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Release GPU memory for a texture created by this module. */
export function disposeTexture(texture: Texture | null | undefined) {
  texture?.dispose();
}
