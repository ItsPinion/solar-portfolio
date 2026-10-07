import { chromium } from "@playwright/test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromiumLaunch } = require("./chromium-runtime.cjs");

const BASE = process.env.SOLAR_BASE ?? "http://127.0.0.1:3000";
const launch = chromiumLaunch();
const browser = await chromium.launch({ ...launch.launchOptions, args: launch.args });
const page = await (await browser.newContext()).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const section = (title) => page.locator("section", { has: page.getByRole("heading", { name: title }) });
const read = async (title) => (await section(title).innerText()).replace(/\s+/g, " ");
const ok = (v) => (v ? "✓" : "✗");
let fails = 0;
const assert = (label, pass, detail = "") => { if (!pass) fails++; console.log(`  ${ok(pass)} ${label}${detail ? ` — ${detail}` : ""}`); };

await page.goto(BASE + "/dev/data-check", { waitUntil: "networkidle" });
await page.waitForTimeout(900);

console.log("─── initial state (fresh localStorage) ───");
let s = await read("Zustand · settings store");
let p = await read("Zustand · portfolio store");
assert("showOrbits defaults true", /showOrbits: true/.test(s));
assert("reducedMotion defaults false", /reducedMotion: false/.test(s));
assert("selectedPlanet defaults null", /selectedPlanet: null/.test(p));
assert("activeSection defaults home", /activeSection: home/.test(p));
assert("camera default position [0, 25, 35]", /default camera: \[0, 25, 35\]/.test(p));

const detected = (await page.evaluate(() => navigator.hardwareConcurrency));
const q = /quality: (\w+)/.exec(s)?.[1];
assert(`quality auto-detected for ${detected}-core device (got "${q}")`, ["low", "medium", "high"].includes(q ?? ""));

console.log("\n─── store actions ───");
await page.getByRole("button", { name: "select planet 0" }).click();
await page.waitForTimeout(150);
assert("selectPlanet(id[0])", /selectedPlanet: nebula-analytics/.test(await read("Zustand · portfolio store")));
await page.getByRole("button", { name: "step +" }).click();
await page.waitForTimeout(150);
assert("stepPlanet(+1) advances", /selectedPlanet: orbit-commerce/.test(await read("Zustand · portfolio store")));
await page.getByRole("button", { name: "jump #3" }).click();
await page.waitForTimeout(150);
assert("jumpToPlanetIndex(2)", /selectedPlanet: exoplanet-explorer/.test(await read("Zustand · portfolio store")));
await page.getByRole("button", { name: "toggle profile" }).click();
await page.waitForTimeout(150);
assert("toggleProfile opens panel", /openPanel: profile/.test(await read("Zustand · portfolio store")));
await page.getByRole("button", { name: "reset view" }).click();
await page.waitForTimeout(150);
p = await read("Zustand · portfolio store");
assert("resetView clears selection + panel", /selectedPlanet: null/.test(p) && /openPanel: null/.test(p) && /activeSection: home/.test(p));

console.log("\n─── persistence across reload ───");
await page.getByRole("button", { name: "toggle orbits" }).click();
await page.getByRole("button", { name: "toggle reduced motion" }).click();
await page.getByRole("button", { name: "quality high" }).click();
await page.getByRole("button", { name: "toggle labels" }).click();
await page.waitForTimeout(400);

const persisted = JSON.parse((await page.evaluate(() => localStorage.getItem("solar-portfolio:settings"))) ?? "{}").state ?? {};
assert("localStorage written", Object.keys(persisted).length > 0, JSON.stringify(persisted));
assert("persisted writes mark explicit choices", persisted.qualityTouched === true && persisted.userTouchedMotion === true);

await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
s = await read("Zustand · settings store");
assert("showOrbits: false survives reload", /showOrbits: false/.test(s));
assert("reducedMotion: true survives reload", /reducedMotion: true/.test(s));
assert("showLabels: false survives reload", /showLabels: false/.test(s));
assert("explicit quality: high survives auto-detect", /quality: high/.test(s));

console.log("\n─── hooks track the viewport live ───");
const bp = async () => /breakpoint: (\w+)/.exec(await read("Hooks"))?.[1];
await page.setViewportSize({ width: 500, height: 900 });
await page.waitForTimeout(400);
assert("useResponsive @500px → xs", (await bp()) === "xs", await bp());
await page.setViewportSize({ width: 900, height: 900 });
await page.waitForTimeout(400);
assert("useResponsive @900px → md", (await bp()) === "md", await bp());
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);
assert("useResponsive @1440px → xl", (await bp()) === "xl", await bp());

console.log("\n  page errors:", errors.length ? errors.join("; ") : "none");
console.log(fails ? `\n✗ ${fails} check(s) failed` : "\n✓ all store/hook checks passed");
await browser.close();
process.exitCode = fails ? 1 : 0;
