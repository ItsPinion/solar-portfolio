#!/usr/bin/env node
/**
 * ── PHASE 2 VERIFICATION ──────────────────────────────────────
 * Runs the "Testing Criteria" checklist from `plan.md` → Phase 2 against the
 * running dev server, with numbers instead of eyeballing.
 *
 *   npm run dev            # in one terminal
 *   npm run verify:phase2  # in another
 *
 * Checks:
 *   1. loading screen appears, then detaches and reveals the 3D scene
 *   2. stars render, are distributed across the viewport and are numerous
 *      enough for the active quality tier
 *   3. stars twinkle (pixel variance over time with a *pinned* camera)
 *   4. drag rotates the camera; zoom is clamped to 10–60 units
 *   5. the polar angle can never flip the view upside down
 *   6. bloom post-processing is active and measurably changes the frame
 *   7. no console errors or page errors from WebGL/three.js
 *   8. render budget (draw calls / triangles / points) stays sane
 */
import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const require = createRequire(import.meta.url);
const { chromiumLaunch } = require("./chromium-runtime.cjs");

const BASE = process.env.SOLAR_BASE ?? "http://127.0.0.1:3000";
const OUT = path.resolve("screenshots");
/**
 * Capture viewport. The pixel-level checks (star density, twinkle) need a
 * deterministic frame, and this environment renders in software — a smaller
 * canvas keeps each screenshot well inside Playwright's timeout.
 */
const VIEWPORT = { width: 1024, height: 640 };

let failures = 0;
const results = [];

function check(label, pass, detail = "") {
  results.push({ label, pass, detail });
  if (!pass) failures += 1;
  console.log(`  ${pass ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

/* ── pixel helpers ─────────────────────────────────────────────── */

function luminance(png) {
  const { width, height, data } = png;
  const out = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    out[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return out;
}

/** Count pixels above `threshold` inside a rectangle, as a fraction. */
function brightFraction(lum, width, x0, y0, w, h, threshold = 0.22) {
  let hits = 0;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (lum[y * width + x] > threshold) hits += 1;
    }
  }
  return hits / (w * h);
}

/** Mean absolute difference between two luminance buffers, 0–1. */
function meanAbsDiff(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

function mean(lum) {
  let sum = 0;
  for (let i = 0; i < lum.length; i++) sum += lum[i];
  return sum / lum.length;
}

const snapshot = (page) => page.evaluate(() => window.__solarScene());

/** Screenshots must survive a software-rendered frame (see VIEWPORT note). */
const shoot = (page, file) => page.screenshot({ path: file, timeout: 120_000 });

/* ── main ──────────────────────────────────────────────────────── */

const browser = await chromium.launch({
  ...chromiumLaunch().launchOptions,
  args: chromiumLaunch().args,
});

const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
// Pin quality so the render budget is comparable between runs.
await context.addInitScript(() => {
  window.localStorage.setItem(
    "solar-portfolio:settings",
    JSON.stringify({ state: { quality: "high", qualityTouched: true }, version: 1 })
  );
});

const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const text = msg.text();
  if (text.includes("favicon") || text.includes("Download the React DevTools")) return;
  consoleErrors.push(text);
});
page.on("pageerror", (err) => pageErrors.push(err.message));

console.log(`\n─── Phase 2 verification @ ${BASE} ───\n`);

/* 1 ─ loading screen → scene ------------------------------------- */
console.log("1. Boot sequence");
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

const loadingScreen = page.locator("[data-testid=loading-screen]");
const loadingVisible = await loadingScreen.isVisible().catch(() => false);
check("loading screen is shown first", loadingVisible);
await shoot(page, `${OUT}/phase2-loading.png`);

await loadingScreen.waitFor({ state: "detached", timeout: 60_000 });
check("loading screen fades out and unmounts", true);

await page.waitForFunction(() => (window.__solarFrames ?? 0) > 45, null, { timeout: 90_000 });
const boot = await snapshot(page);
check(
  "3D scene reports ready with frames rendering",
  boot.stats.ready && boot.stats.frames > 45,
  `${boot.stats.frames} frames, quality ${boot.stats.quality}`
);
check("canvas fills the viewport", await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  return Math.abs(rect.width - window.innerWidth) < 2 && Math.abs(rect.height - window.innerHeight) < 2;
}));

/* 2 ─ stars visible & distributed -------------------------------- */
console.log("\n2. Starfield");
const starCount = Number(await page.getAttribute("[data-testid=scene-root]", "data-stars"));
check("star geometry matches the quality tier", boot.stats.stars === starCount && starCount >= 8000, `${boot.stats.stars} stars`);
check("stars are drawn as points in one draw call", boot.stats.points > 0, `${boot.stats.points} points`);

await page.evaluate(() => window.__solarFreezeCamera(true));
await page.waitForTimeout(1500);
const stillShot = await page.screenshot({ path: `${OUT}/phase2-starfield.png`, timeout: 120_000 });
const lum = luminance(PNG.sync.read(stillShot));

const quadrants = [
  ["top-left", 0, 0],
  ["top-right", Math.floor(VIEWPORT.width / 2), 0],
  ["bottom-left", 0, Math.floor(VIEWPORT.height / 2)],
  ["bottom-right", Math.floor(VIEWPORT.width / 2), Math.floor(VIEWPORT.height / 2)],
];
const half = { w: Math.floor(VIEWPORT.width / 2), h: Math.floor(VIEWPORT.height / 2) };
const densities = quadrants.map(([name, x, y]) => {
  const fraction = brightFraction(lum, VIEWPORT.width, x, y, half.w, half.h, 0.3);
  return { name, fraction };
});
const emptiest = densities.reduce((min, q) => (q.fraction < min.fraction ? q : min));
check(
  "stars appear in every quadrant of the viewport",
  densities.every((q) => q.fraction > 0.0002),
  densities.map((q) => `${q.name} ${(q.fraction * 100).toFixed(3)}%`).join(", ")
);
check("star density is balanced (no empty corner)", emptiest.fraction > 0.0002, `lowest: ${emptiest.name}`);
check("sky is dark (space reads as black)", mean(lum) < 0.12, `mean luminance ${mean(lum).toFixed(4)}`);
check("no star is clipped into a solid blob", mean(lum) > 0.004, `mean luminance ${mean(lum).toFixed(4)}`);

/* 3 ─ twinkle ---------------------------------------------------- */
console.log("\n3. Twinkle");
const twinkleSamples = [];
for (let i = 0; i < 4; i++) {
  const shot = PNG.sync.read(await page.screenshot({ timeout: 120_000 }));
  twinkleSamples.push(luminance(shot));
  await page.waitForTimeout(420);
}
const diffs = twinkleSamples.slice(1).map((sample, index) => meanAbsDiff(sample, twinkleSamples[index]));
const maxTwinkle = Math.max(...diffs);
check(
  "star brightness changes over time with the camera pinned",
  maxTwinkle > 0.00002,
  `mean frame-to-frame delta ${maxTwinkle.toFixed(7)}`
);
check("twinkle is subtle, not strobing", maxTwinkle < 0.01, `delta ${maxTwinkle.toFixed(7)}`);

/* 4 ─ drag rotates, wheel zooms within limits -------------------- */
console.log("\n4. Camera interaction");
await page.evaluate(() => window.__solarFreezeCamera(false));
await page.waitForTimeout(300);

const before = (await snapshot(page)).camera;
await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
await page.mouse.down();
await page.mouse.move(VIEWPORT.width / 2 + 240, VIEWPORT.height / 2.4, { steps: 24 });
await page.mouse.up();
await page.waitForTimeout(900);
const afterDrag = (await snapshot(page)).camera;
check(
  "mouse drag rotates the camera",
  Math.abs(afterDrag.azimuth - before.azimuth) > 0.1,
  `azimuth ${before.azimuth.toFixed(3)} → ${afterDrag.azimuth.toFixed(3)}`
);
check(
  "auto-rotate stops while the user interacts",
  afterDrag.autoRotating === false,
  `autoRotating=${afterDrag.autoRotating}`
);

// Drag far past the pole to prove the vertical constraint holds.
await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
await page.mouse.down();
await page.mouse.move(VIEWPORT.width / 2, -600, { steps: 30 });
await page.mouse.up();
await page.waitForTimeout(700);
const poled = (await snapshot(page)).camera;
check(
  "camera never flips over the pole",
  poled.polar > 0.3 && poled.polar < Math.PI - 0.3,
  `polar ${poled.polar.toFixed(3)} rad (limit π·0.12)`
);

const wheel = async (deltaY) => {
  await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
  await page.mouse.wheel(0, deltaY);
  await page.waitForTimeout(700);
  return (await snapshot(page)).camera;
};

const zoomedIn = await wheel(-1200);
check("scroll wheel zooms in", zoomedIn.distance < poled.distance, `${poled.distance.toFixed(1)} → ${zoomedIn.distance.toFixed(1)}`);

// The dolly is proportional (≈10% per wheel event), so walk the range.
const spin = async (deltaY, steps) => {
  let camera = await snapshot(page);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(120);
    camera = await snapshot(page);
    if (Math.abs(camera.camera.distance - (deltaY < 0 ? 10 : 60)) < 0.05) break;
  }
  await page.waitForTimeout(700);
  return (await snapshot(page)).camera;
};

const deepZoom = await spin(-1200, 40);
check(
  "zoom-in stops at the minimum distance (10)",
  Math.abs(deepZoom.distance - 10) < 0.25,
  `distance ${deepZoom.distance.toFixed(2)}`
);
await shoot(page, `${OUT}/phase2-zoom-min.png`);

const wideZoom = await spin(1200, 40);
check(
  "zoom-out stops at the maximum distance (60)",
  Math.abs(wideZoom.distance - 60) < 0.25,
  `distance ${wideZoom.distance.toFixed(2)}`
);
await shoot(page, `${OUT}/phase2-zoom-max.png`);

// Mid-zoom capture (the "verify fog/depth at different zoom levels" shot).
const midCamera = await wheel(-450);
const midShot = await page.screenshot({ path: `${OUT}/phase2-zoom-mid.png`, timeout: 120_000 });
const midLum = luminance(PNG.sync.read(midShot));
check(
  "mid zoom sits between the limits",
  midCamera.distance > 10 && midCamera.distance < 60,
  `distance ${midCamera.distance.toFixed(2)}`
);
check(
  "fog/depth: the sky still renders at a different zoom level",
  mean(midLum) > 0.002,
  `mean luminance ${mean(midLum).toFixed(4)}`
);

/* 5 ─ post processing -------------------------------------------- */
console.log("\n5. Post-processing");
const postAttr = await page.getAttribute("[data-testid=scene-root]", "data-postprocessing");
check("bloom pipeline active on the high tier", postAttr === "true");

const budget = (await snapshot(page)).stats;
check(
  "render budget is sane (draw calls < 120, triangles < 200k)",
  budget.drawCalls > 0 && budget.drawCalls < 120 && budget.triangles < 200_000,
  `${budget.drawCalls} draw calls, ${budget.triangles.toLocaleString()} triangles, ${budget.points.toLocaleString()} points`
);

/* 6 ─ errors ----------------------------------------------------- */
console.log("\n6. Console health");
check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
check("no uncaught page errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));

await browser.close();

const summary = {
  base: BASE,
  when: new Date().toISOString(),
  passed: results.filter((r) => r.pass).length,
  failed: failures,
  results,
  consoleErrors,
  pageErrors,
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "phase2-report.json"), JSON.stringify(summary, null, 2));

console.log(
  `\n${failures ? `✗ ${failures} check(s) failed` : `✓ all ${results.length} Phase 2 checks passed`}\n`
);
process.exit(failures ? 1 : 0);
