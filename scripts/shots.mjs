#!/usr/bin/env node
/**
 * Visual verification harness.
 *
 * Usage:
 *   node scripts/shots.mjs                 # run every scene
 *   node scripts/shots.mjs phase0 phase2   # run selected scenes
 *   SHOT_BASE=http://127.0.0.1:3000 node scripts/shots.mjs
 *
 * Scenes are plain async functions that drive a Playwright page and write
 * screenshots into ./screenshots. Console errors are collected and printed so
 * visual bugs and runtime errors surface in the same run.
 */
import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromiumLaunch } = require("./chromium-runtime.cjs");

const BASE = process.env.SHOT_BASE ?? "http://127.0.0.1:3000";
const OUT = path.resolve("screenshots");

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 768, height: 1024 };
const MOBILE = { width: 375, height: 812 };

const consoleErrors = [];
const pageErrors = [];

/** Wait for the 3D scene to have rendered at least `frames` frames. */
async function waitForCanvas(page, { frames = 50, timeout = 45000 } = {}) {
  await page.waitForSelector("canvas", { state: "attached", timeout });
  await page.waitForFunction(
    () => (window.__solarFrames ?? 0) >= 1 || document.querySelector("[data-scene-ready='true']"),
    null,
    { timeout }
  ).catch(() => {});
  // Give SwiftShader time to accumulate real frames.
  await page.waitForTimeout(frames * 40);
}

async function goto(page, url = "/", opts = {}) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await waitForCanvas(page, opts);
}

/**
 * localStorage is only reachable once the page is on the app's origin, so the
 * helpers below navigate first when needed (a brand-new Playwright page starts
 * on `about:blank`, where touching storage throws a SecurityError).
 */
async function ensureOnApp(page) {
  if (!page.url().startsWith(BASE)) {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  }
}

/** Pin settings before a document loads, then reload so they take effect. */
async function fixture(page, state) {
  await ensureOnApp(page);
  await page.evaluate((payload) => {
    window.localStorage.setItem("solar-portfolio:settings", JSON.stringify({ state: payload, version: 1 }));
  }, state);
  // Software-rendered reloads can take a while; the default 30s is tight.
  await page.reload({ waitUntil: "domcontentloaded", timeout: 90_000 });
}

/** Live scene snapshot from the debug bridge (see src/lib/scene-telemetry.ts). */
const snapshot = (page) => page.evaluate(() => window.__solarScene?.());
const cameraDistance = async (page) => (await snapshot(page))?.camera.distance ?? 0;

/** Event-based dolly: keeps scrolling until the camera reaches `target`. */
async function dollyTo(page, target, direction, { steps = 40, timeout = 90_000 } = {}) {
  const deadline = Date.now() + timeout;
  for (let i = 0; i < steps; i++) {
    const distance = await cameraDistance(page);
    if (Math.abs(distance - target) < 0.4) return distance;
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, direction * 1200);
    await page.waitForTimeout(220);
    if (Date.now() > deadline) break;
  }
  return cameraDistance(page);
}

/** Scene registry — keyed by name so phases can be run individually. */
const scenes = {
  // ---------------------------------------------------------------- Phase 0
  async phase0(page) {
    await page.setViewportSize(DESKTOP);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/phase0-scaffold.png` });
  },

  // ---------------------------------------------------------------- Phase 1
  async phase1(page) {
    await page.setViewportSize({ width: 1440, height: 2200 });
    await page.goto(BASE + "/dev/data-check", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/phase1-data-layer.png`, fullPage: true });
  },

  // ---------------------------------------------------------------- Phase 2
  /** Loading screen (fresh storage so the overlay is guaranteed to appear). */
  async phase2Loading(page) {
    await page.setViewportSize(DESKTOP);
    await ensureOnApp(page);
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-testid=loading-screen]", { state: "visible", timeout: 20_000 });
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/phase2-loading.png` });
    await page.waitForSelector("[data-testid=loading-screen]", { state: "detached", timeout: 90_000 });
  },

  /** Default overview: starfield + nebulae at the default camera distance. */
  async phase2(page) {
    await page.setViewportSize(DESKTOP);
    await fixture(page, { quality: "high", qualityTouched: true });
    await waitForCanvas(page, { frames: 30 });
    await page.waitForSelector("[data-testid=loading-screen]", { state: "detached", timeout: 90_000 });
    // Freeze the camera: the idle auto-rotation would otherwise make the
    // capture non-deterministic.
    await page.evaluate(() => window.__solarFreezeCamera?.(true));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/phase2-starfield.png`, timeout: 120_000 });
    await page.evaluate(() => window.__solarFreezeCamera?.(false));
  },

  /** Same sky from the closest zoom (depth / fog check). */
  async phase2ZoomMin(page) {
    await page.setViewportSize(DESKTOP);
    await fixture(page, { quality: "high", qualityTouched: true });
    await waitForCanvas(page, { frames: 20 });
    await page.evaluate(() => window.__solarFreezeCamera?.(true));
    const distance = await dollyTo(page, 10, -1);
    await page.screenshot({ path: `${OUT}/phase2-zoom-min.png`, timeout: 120_000 });
    console.log(`(zoom-in distance ${distance.toFixed(1)}) `);
    await page.evaluate(() => window.__solarFreezeCamera?.(false));
  },

  /** Same sky from the widest zoom (depth / fog check). */
  async phase2ZoomMax(page) {
    await page.setViewportSize(DESKTOP);
    await fixture(page, { quality: "high", qualityTouched: true });
    await waitForCanvas(page, { frames: 20 });
    await page.evaluate(() => window.__solarFreezeCamera?.(true));
    const distance = await dollyTo(page, 60, 1);
    await page.screenshot({ path: `${OUT}/phase2-zoom-max.png`, timeout: 120_000 });
    console.log(`(zoom-out distance ${distance.toFixed(1)}) `);
    await page.evaluate(() => window.__solarFreezeCamera?.(false));
  },

  // generic full-page captures, useful for every UI phase
  async desktop(page) {
    await page.setViewportSize(DESKTOP);
    await goto(page);
    await page.screenshot({ path: `${OUT}/desktop.png` });
  },
  async tablet(page) {
    await page.setViewportSize(TABLET);
    await goto(page);
    await page.screenshot({ path: `${OUT}/tablet.png` });
  },
  async mobile(page) {
    await page.setViewportSize(MOBILE);
    await goto(page);
    await page.screenshot({ path: `${OUT}/mobile.png` });
  },
};

async function main() {
  const requested = process.argv.slice(2);
  const names = requested.length ? requested : Object.keys(scenes);

  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ ...chromiumLaunch().launchOptions, args: chromiumLaunch().args });

  const context = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (text.includes("favicon") || text.includes("Download the React DevTools")) return;
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  for (const name of names) {
    const scene = scenes[name];
    if (!scene) {
      console.log(`⚠  unknown scene "${name}" (available: ${Object.keys(scenes).join(", ")})`);
      continue;
    }
    process.stdout.write(`▶ ${name} … `);
    try {
      await scene(page);
      console.log("ok");
    } catch (err) {
      console.log("FAILED");
      console.error(`   ${err.message.split("\n")[0]}`);
    }
  }

  await browser.close();

  const report = {
    base: BASE,
    scenes: names,
    consoleErrors: [...new Set(consoleErrors)],
    pageErrors: [...new Set(pageErrors)],
  };
  await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));

  if (report.consoleErrors.length || report.pageErrors.length) {
    console.log("\n─── browser errors ───");
    report.consoleErrors.forEach((e) => console.log("console:", e.slice(0, 300)));
    report.pageErrors.forEach((e) => console.log("page:", e.slice(0, 300)));
    process.exitCode = 1;
  } else {
    console.log("\n✓ no console or page errors");
  }
}

main();
