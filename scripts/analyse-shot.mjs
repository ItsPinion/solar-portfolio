#!/usr/bin/env node
/**
 * ── SCREENSHOT ANALYSER ───────────────────────────────────────
 * Objective, repeatable checks on a rendered capture. Eyeballing a dark space
 * scene is unreliable — brightness, star density and bloom halos are measured
 * here instead of guessed at.
 *
 * Usage:
 *   node scripts/analyse-shot.mjs screenshots/phase2-starfield.png
 *   node scripts/analyse-shot.mjs shot.png --json
 *
 * Reports per channel: mean/median luminance, the fraction of near-black
 * pixels, the count of "star cores" (bright local maxima) and the average halo
 * size around them (a proxy for bloom strength).
 */
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const file = process.argv[2];
const asJson = process.argv.includes("--json");

if (!file) {
  console.error("usage: node scripts/analyse-shot.mjs <screenshot.png> [--json]");
  process.exit(1);
}

const png = PNG.sync.read(fs.readFileSync(path.resolve(file)));
const { width, height, data } = png;

const lum = new Float32Array(width * height);
let sum = 0;
let nearBlack = 0;
let bright = 0;

for (let i = 0; i < width * height; i++) {
  const r = data[i * 4] / 255;
  const g = data[i * 4 + 1] / 255;
  const b = data[i * 4 + 2] / 255;
  // Rec. 709 relative luminance keeps the measure perceptually meaningful.
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  lum[i] = y;
  sum += y;
  if (y < 0.02) nearBlack += 1;
  if (y > 0.25) bright += 1;
}

const mean = sum / lum.length;
const sorted = Float32Array.from(lum).sort();
const median = sorted[Math.floor(sorted.length / 2)];
const p99 = sorted[Math.floor(sorted.length * 0.99)];
const p999 = sorted[Math.floor(sorted.length * 0.999)];
const max = sorted[sorted.length - 1];

/**
 * Star cores: pixels that are local maxima above a threshold and whose
 * neighbours are clearly dimmer. Halo strength is the ratio of mid-bright
 * pixels to cores — bloom inflates it.
 */
let cores = 0;
let halos = 0;
const CORE_THRESHOLD = 0.28;
const HALO_MIN = 0.045;
const HALO_MAX = 0.24;

for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    const v = lum[i];
    if (v < HALO_MIN) continue;
    if (v >= HALO_MIN && v <= HALO_MAX) {
      halos += 1;
      continue;
    }
    if (v < CORE_THRESHOLD) continue;
    if (
      v >= lum[i - 1] &&
      v >= lum[i + 1] &&
      v >= lum[i - width] &&
      v >= lum[i + width]
    ) {
      cores += 1;
    }
  }
}

const report = {
  file: path.relative(process.cwd(), path.resolve(file)),
  size: `${width}×${height}`,
  meanLuminance: Number(mean.toFixed(5)),
  medianLuminance: Number(median.toFixed(5)),
  p99Luminance: Number(p99.toFixed(5)),
  p999Luminance: Number(p999.toFixed(5)),
  maxLuminance: Number(max.toFixed(5)),
  nearBlackFraction: Number((nearBlack / lum.length).toFixed(4)),
  brightFraction: Number((bright / lum.length).toFixed(6)),
  starCores: cores,
  coresPerMegapixel: Number(((cores / (width * height)) * 1e6).toFixed(1)),
  haloFraction: Number((halos / lum.length).toFixed(5)),
  haloToCoreRatio: cores ? Number((halos / cores).toFixed(1)) : 0,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const [key, value] of Object.entries(report)) {
    console.log(`${key.padEnd(20)} ${value}`);
  }
}
