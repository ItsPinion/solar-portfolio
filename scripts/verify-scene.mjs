#!/usr/bin/env node
/**
 * Phase 2 verification — 3D scene foundation & starfield.
 *
 * Drives the real WebGL scene in Chromium (SwiftShader in this sandbox) and
 * asserts the things a unit test cannot: that frames are genuinely produced,
 * that quality tiers change what is rendered, that the camera rig respects its
 * clamps, and that both fallback paths degrade gracefully.
 *
 *   node scripts/verify-scene.mjs
 *
 * Set CHROME_PATH when Playwright's browser download is unavailable.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SCENE_BASE ?? "http://127.0.0.1:3000";
const OUT = path.resolve("screenshots");
const CHROME = process.env.CHROME_PATH || undefined;

const results = [];
let fails = 0;

function assert(label, pass, detail = "") {
  results.push({ label, pass, detail });
  if (!pass) fails++;
  console.log(`  ${pass ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function launch(extraArgs = []) {
  return chromium.launch({
    executablePath: CHROME,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
      ...extraArgs,
    ],
  });
}

/** Force a quality tier / view mode before the app boots. */
const preloadSettings = (state) => ({
  addInitScript: `
    localStorage.setItem('solar-portfolio:settings', ${JSON.stringify(
      JSON.stringify({ state, version: 1 })
    )});
  `,
});

/** Wait until the render loop has produced `n` frames. */
async function waitForFrames(page, n = 30, timeout = 60000) {
  await page
    .waitForFunction((count) => (window.__solarFrames ?? 0) >= count, n, { timeout })
    .catch(() => {});
}

async function waitForPerf(page, timeout = 60000) {
  await page.waitForFunction(() => Boolean(window.__solarPerf), null, { timeout }).catch(() => {});
  return page.evaluate(() => window.__solarPerf ?? null);
}

/**
 * Wait for a perf sample taken *after* this call.
 *
 * `__solarPerf` only refreshes every 30 frames. Under software rasterisation
 * that can be seconds, so reading it immediately after an action would report
 * pre-action values — which silently turns real assertions into no-ops.
 */
async function freshPerf(page, timeout = 40000) {
  const seen = await page.evaluate(() => window.__solarPerf?.frames ?? 0);
  await page
    .waitForFunction((n) => (window.__solarPerf?.frames ?? 0) > n, seen, { timeout })
    .catch(() => {});
  return page.evaluate(() => window.__solarPerf ?? null);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await launch();
  const consoleErrors = [];
  const pageErrors = [];

  const newPage = async (initScript) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (text.includes("favicon") || text.includes("React DevTools")) return;
      consoleErrors.push(text);
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));
    if (initScript) await page.addInitScript(initScript);
    return page;
  };

  /* ── 1. canvas mounts and renders ─────────────────────────── */
  console.log("── 1. scene mounts & render loop runs (default/high tier) ──");
  const page = await newPage();
  let highPerf = null;
  let highAttrs = null;
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });

  const canvas = page.locator("canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 60000 }).catch(() => {});
  assert("canvas element is present and visible", await canvas.isVisible().catch(() => false));

  const framesA = await page.evaluate(() => window.__solarFrames ?? 0);
  await waitForFrames(page, 30);
  const framesB = await page.evaluate(() => window.__solarFrames ?? 0);

  // Measure only after the renderer has been alive for a while: R3F's resize
  // observer sets the drawing-buffer size on mount, so an immediate bounding
  // box can still report the browser's default 300x150 canvas.
  const box = await canvas.boundingBox().catch(() => null);
  assert(
    "canvas fills the viewport",
    Boolean(box && box.width >= 1400 && box.height >= 880),
    box ? `${Math.round(box.width)}×${Math.round(box.height)}` : "no box"
  );

  assert("frame counter advances (WebGL loop is live)", framesB > framesA, `${framesA} → ${framesB}`);

  const ready = await page.getAttribute("[data-testid='scene-canvas']", "data-scene-ready");
  assert("data-scene-ready flips to true", ready === "true", `got "${ready}"`);

  const loaderVisible = await page.getAttribute("[data-testid='scene-loader']", "data-visible");
  assert("loading overlay hands over", loaderVisible === "false", `data-visible=${loaderVisible}`);

  /* ── 2. quality tiers change what is rendered ─────────────── */
  console.log("\n── 2. quality tiers ──");
  const autoTier = await page.getAttribute("[data-testid='scene-canvas']", "data-quality");
  assert(
    "auto-detected quality is a valid tier",
    ["low", "medium", "high"].includes(autoTier ?? ""),
    `got "${autoTier}" (device probe, not a fixed default)`
  );

  const tierExpectations = [
    { tier: "low", stars: 3000, post: false },
    { tier: "medium", stars: 5000, post: true },
    { tier: "high", stars: 8000, post: true },
  ];

  for (const expectation of tierExpectations) {
    const tierPage = await newPage(
      preloadSettings({ quality: expectation.tier, qualityTouched: true }).addInitScript
    );
    await tierPage.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await waitForFrames(tierPage, 30);
    const perf = await waitForPerf(tierPage);
    const attrs = await tierPage.evaluate(() => {
      const el = document.querySelector("[data-testid='scene-canvas']");
      return {
        quality: el?.getAttribute("data-quality"),
        stars: Number(el?.getAttribute("data-star-count")),
        post: el?.getAttribute("data-postprocessing"),
      };
    });

    assert(
      `${expectation.tier} tier renders ${expectation.stars} stars`,
      attrs.stars === expectation.stars,
      `got ${attrs.stars}`
    );
    assert(
      `${expectation.tier} tier post-processing = ${expectation.post}`,
      attrs.post === String(expectation.post),
      `got ${attrs.post}`
    );
    assert(
      `${expectation.tier} tier submits the starfield geometry`,
      (perf?.points ?? 0) === expectation.stars,
      `${perf?.points} points drawn (expected ${expectation.stars})`
    );
    assert(
      `${expectation.tier} tier frame budget is sane`,
      (perf?.calls ?? 0) >= (expectation.post ? 3 : 1) &&
        (perf?.calls ?? 0) <= (expectation.post ? 24 : 12),
      `${perf?.calls} calls, ${perf?.triangles} tris, ${perf?.points} points, dpr ${perf?.dpr}`
    );
    assert(
      `${expectation.tier} tier reports post-processing ${expectation.post ? "passes" : "off"}`,
      expectation.post ? (perf?.calls ?? 0) > 2 : (perf?.calls ?? 0) <= 6,
      `${perf?.calls} calls`
    );
    assert(
      `${expectation.tier} tier is reflected in the DOM`,
      attrs.quality === expectation.tier,
      `got "${attrs.quality}"`
    );

    if (expectation.tier === "high") {
      highPerf = perf;
      highAttrs = attrs;
    }
    await tierPage.context().close();
  }

  /* ── 3. camera rig ────────────────────────────────────────── */
  console.log("\n── 3. camera rig & zoom clamps ──");
  const defaultDistance = Math.hypot(0, 25, 35);
  assert(
    "camera opens at the configured overview distance",
    Math.abs((highPerf?.distance ?? 0) - defaultDistance) < 3,
    `${highPerf?.distance?.toFixed(2)} vs ${defaultDistance.toFixed(2)}`
  );
  assert(
    "camera starts above the orbital plane",
    (highPerf?.camera?.[1] ?? 0) > 5,
    `y=${highPerf?.camera?.[1]?.toFixed(2)}`
  );

  // Wheel-zoom in hard: the rig must stop at CAMERA_MIN_DISTANCE (10).
  await page.mouse.move(720, 450);
  for (let i = 0; i < 60; i++) {
    await page.mouse.wheel(0, -240);
    await page.waitForTimeout(35);
  }
  const zoomedIn = await freshPerf(page);
  assert(
    "zoom-in stops at the minimum distance (never through the star)",
    (zoomedIn?.distance ?? 0) >= 9.5 && (zoomedIn?.distance ?? 0) <= 12,
    `distance ${zoomedIn?.distance?.toFixed(2)} (min 10)`
  );
  assert("camera stays inside the starfield when zoomed in", (zoomedIn?.distance ?? 999) < 200);

  // Wheel-zoom out past the limit.
  for (let i = 0; i < 90; i++) {
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(35);
  }
  const zoomedOut = await freshPerf(page);
  assert(
    "zoom-out stops at the maximum distance",
    (zoomedOut?.distance ?? 0) <= 60.5 && (zoomedOut?.distance ?? 0) >= 55,
    `distance ${zoomedOut?.distance?.toFixed(2)} (max 60)`
  );

  // Idle auto-rotation — compare two *fresh* samples.
  const before = await freshPerf(page);
  await page.waitForTimeout(2200);
  const after = await freshPerf(page);
  assert(
    "idle drift rotates the camera (auto-rotate on)",
    Math.abs((after?.azimuth ?? 0) - (before?.azimuth ?? 0)) > 0.005,
    `Δazimuth ${Math.abs((after?.azimuth ?? 0) - (before?.azimuth ?? 0)).toFixed(4)} rad`
  );

  // A drag must move the camera without breaking the rig.
  const preDrag = await freshPerf(page);
  await page.mouse.move(720, 450);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(720 + i * 22, 450 - i * 5);
    await page.waitForTimeout(60);
  }
  await page.mouse.up();
  await page.waitForTimeout(900);
  const dragged = await freshPerf(page);
  assert(
    "dragging orbits the camera",
    Math.abs((dragged?.azimuth ?? 0) - (preDrag?.azimuth ?? 0)) > 0.02,
    `Δazimuth ${Math.abs((dragged?.azimuth ?? 0) - (preDrag?.azimuth ?? 0)).toFixed(4)} rad`
  );
  assert("camera stays in front of the starfield after a drag", (dragged?.distance ?? 999) <= 60.5);

  await page.screenshot({ path: `${OUT}/phase2-scene-foundation.png` });
  await page.context().close();

  /* ── 4. reduced motion ────────────────────────────────────── */
  console.log("\n── 4. reduced motion ──");
  const rmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const rmPage = await rmContext.newPage();
  rmPage.on("pageerror", (err) => pageErrors.push(err.message));
  await rmPage.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await waitForFrames(rmPage, 30);
  const rmAttrs = await rmPage.evaluate(() => ({
    reduced: document.documentElement.dataset.reducedMotion,
  }));
  assert("OS motion preference is honoured", rmAttrs.reduced === "true", `data-reduced-motion=${rmAttrs.reduced}`);

  const rmA = await freshPerf(rmPage);
  await rmPage.waitForTimeout(2200);
  const rmB = await freshPerf(rmPage);
  assert(
    "auto-rotation is disabled under reduced motion",
    Math.abs((rmB?.azimuth ?? 0) - (rmA?.azimuth ?? 0)) < 0.004,
    `Δazimuth ${Math.abs((rmB?.azimuth ?? 0) - (rmA?.azimuth ?? 0)).toFixed(5)} rad`
  );
  assert("scene still renders with motion off", (rmB?.frames ?? 0) > (rmA?.frames ?? 0));
  await rmPage.screenshot({ path: `${OUT}/phase2-reduced-motion.png` });
  await rmContext.close();

  /* ── 5. progressive enhancement / fallbacks ───────────────── */
  console.log("\n── 5. fallbacks ──");

  // (a) explicit 2D view mode
  const twoDPage = await newPage(preloadSettings({ viewMode: "2d" }).addInitScript);
  await twoDPage.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await twoDPage.waitForSelector("[data-testid='scene-fallback']", { timeout: 15000 }).catch(() => {});
  assert(
    "view mode 2d renders the fallback instead of the canvas",
    await twoDPage.locator("[data-testid='scene-fallback']").isVisible().catch(() => false)
  );
  assert(
    "no canvas is mounted in 2D mode",
    (await twoDPage.locator("canvas").count()) === 0
  );
  assert(
    "2D fallback still shows the profile headline",
    ((await twoDPage.locator("h1").first().textContent()) ?? "").length > 3
  );
  await twoDPage.screenshot({ path: `${OUT}/phase2-fallback-2d.png` });
  await twoDPage.context().close();

  // (b) WebGL genuinely unavailable
  const noGlContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const noGlPage = await noGlContext.newPage();
  const noGlErrors = [];
  noGlPage.on("pageerror", (err) => noGlErrors.push(err.message));
  await noGlPage.addInitScript(() => {
    // `hasWebGL()` probes canvas.getContext("webgl2" | "webgl" | ...), so that
    // call — not the property names — is what has to start failing.
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (typeof type === "string" && type.toLowerCase().includes("webgl")) return null;
      return original.call(this, type, ...rest);
    };
  });
  await noGlPage.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await noGlPage
    .waitForSelector("[data-testid='scene-fallback']", { timeout: 20000 })
    .catch(() => {});
  assert(
    "no WebGL → automatic 2D fallback",
    await noGlPage.locator("[data-testid='scene-fallback']").isVisible().catch(() => false)
  );
  assert("no WebGL → page throws nothing", noGlErrors.length === 0, noGlErrors[0] ?? "");
  await noGlPage.screenshot({ path: `${OUT}/phase2-fallback-nowebgl.png` });
  await noGlContext.close();

  /* ── 6. responsive framing ───────────────────────────────── */
  console.log("\n── 6. responsive canvas sizing ──");
  const sizePage = await newPage();
  for (const [name, width, height] of [
    ["tablet", 768, 1024],
    ["mobile", 375, 812],
  ]) {
    await sizePage.setViewportSize({ width, height });
    await sizePage.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await waitForFrames(sizePage, 20);
    const cbox = await sizePage.locator("canvas").first().boundingBox().catch(() => null);
    assert(
      `canvas resizes to the ${name} viewport (${width}×${height})`,
      Boolean(cbox && Math.abs(cbox.width - width) < 3 && Math.abs(cbox.height - height) < 3),
      cbox ? `${Math.round(cbox.width)}×${Math.round(cbox.height)}` : "no canvas"
    );
    await sizePage.screenshot({ path: `${OUT}/phase2-${name}.png` });
  }
  await sizePage.context().close();

  await browser.close();

  /* ── report ───────────────────────────────────────────────── */
  assert("no uncaught page errors during the whole run", pageErrors.length === 0, pageErrors[0] ?? "");
  assert("no console errors during the whole run", consoleErrors.length === 0, consoleErrors[0] ?? "");

  const report = {
    base: BASE,
    passed: results.filter((r) => r.pass).length,
    failed: fails,
    checks: results,
    consoleErrors,
    pageErrors,
    renderer: "ANGLE / SwiftShader (software)",
  };
  await writeFile(`${OUT}/phase2-report.json`, JSON.stringify(report, null, 2));

  console.log(
    `\n${fails === 0 ? "✓" : "✗"} ${results.length - fails}/${results.length} scene checks passed`
  );
  if (fails) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
