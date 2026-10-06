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
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

  const browser = await chromium.launch({
    // `CHROME_PATH` lets the harness run where Playwright's own browser
    // download is unavailable (restricted CI/sandbox networks). When unset,
    // Playwright's bundled Chromium is used as usual.
    executablePath: process.env.CHROME_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });

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
