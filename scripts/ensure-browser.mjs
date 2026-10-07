#!/usr/bin/env node
/**
 * ── CHROMIUM RESOLVER ─────────────────────────────────────────
 * Makes `npm run shots` / `npm run test:e2e` work in environments where
 * Playwright's own browser download is unavailable (restricted networks,
 * CI images without the Playwright CDN).
 *
 * Resolution order:
 *   1. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` env var (explicit override)
 *   2. a previously resolved path cached in `node_modules/.chromium-executable`
 *   3. a system Chrome/Chromium (`google-chrome`, `chromium`, …)
 *   4. Playwright's own download (~/.cache/ms-playwright/chromium-*)
 *   5. the Chromium binary shipped inside the `@sparticuz/chromium` npm
 *      tarball, extracted to a scratch directory
 *
 * Writes the chosen path to `node_modules/.chromium-executable` so
 * `playwright.config.ts` and `scripts/shots.mjs` can pick it up synchronously.
 *
 * Usage:  node scripts/ensure-browser.mjs [--print]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE_FILE = path.join(ROOT, "node_modules", ".chromium-runtime.json");
const TOOLS_DIR =
  process.env.SOLAR_BROWSER_TOOLS ?? path.join(os.homedir(), ".solar-browser");

/**
 * Shared libraries the bundled Chromium links against but that this image does
 * not ship (nspr/nss). They travel inside the package's `al2023.tar.br`.
 */
const AL2023_LIB_DIR = path.join(os.tmpdir(), "al2023", "lib");

/** Version pinned to the Chrome major that Playwright 1.63 expects (153). */
const SPARTICUZ_VERSION = process.env.SOLAR_CHROMIUM_NPM_VERSION ?? "153.0.0";

const SYSTEM_CANDIDATES = [
  "google-chrome-stable",
  "google-chrome",
  "chromium",
  "chromium-browser",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
];

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function which(bin) {
  try {
    return execFileSync("which", [bin], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/** Playwright keeps its downloads in a versioned cache directory. */
function playwrightCacheChromium() {
  const bases = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), ".cache", "ms-playwright"),
    "/ms-playwright",
    path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright"),
  ].filter(Boolean);

  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    const entries = fs
      .readdirSync(base)
      .filter((name) => name.startsWith("chromium"))
      .sort()
      .reverse();
    for (const entry of entries) {
      for (const rel of [
        "chrome-linux/chrome",
        "chrome-linux64/chrome",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
        "chrome-win/chrome.exe",
      ]) {
        const candidate = path.join(base, entry, rel);
        if (exists(candidate)) return candidate;
      }
    }
  }
  return null;
}

/** Extract the Chromium bundled in the `@sparticuz/chromium` npm tarball. */
async function sparticuzChromium() {
  const pkgDir = path.join(TOOLS_DIR, "node_modules", "@sparticuz", "chromium");
  const entry = path.join(pkgDir, "build", "index.js");

  if (!fs.existsSync(entry)) {
    console.log(`• installing @sparticuz/chromium@${SPARTICUZ_VERSION} into ${TOOLS_DIR}`);
    fs.mkdirSync(TOOLS_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(TOOLS_DIR, "package.json"),
      JSON.stringify({ name: "solar-browser-tools", private: true, version: "1.0.0" }, null, 2)
    );
    execFileSync(
      "npm",
      ["install", `@sparticuz/chromium@${SPARTICUZ_VERSION}`, "--no-audit", "--no-fund", "--loglevel=error"],
      { cwd: TOOLS_DIR, stdio: "inherit" }
    );
  }

  const mod = await import(`file://${entry}`);
  const chromium = mod.default ?? mod;

  // Keep real GPU/ANGLE behaviour (SwiftShader still works without this).
  if (chromium.setGraphicsMode !== undefined) chromium.setGraphicsMode = false;

  const exe = await chromium.executablePath();

  // nss/nspr aren't present on every image — extract them and expose the dir
  // through LD_LIBRARY_PATH so the browser can actually start.
  if (!fs.existsSync(path.join(AL2023_LIB_DIR, "libnspr4.so"))) {
    const { inflate } = await import(`file://${path.join(pkgDir, "build", "lambdafs.js")}`);
    await inflate(path.join(pkgDir, "bin", "al2023.tar.br"));
  }

  return exists(exe) ? exe : null;
}

async function resolveChromiumPath() {
  const fromEnv = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fromEnv && exists(fromEnv)) return fromEnv;

  if (fs.existsSync(CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    if (cached.executable && exists(cached.executable)) return cached.executable;
  }

  for (const candidate of SYSTEM_CANDIDATES) {
    const resolved = candidate.startsWith("/") ? candidate : which(candidate);
    if (resolved && exists(resolved)) return resolved;
  }

  const fromPlaywright = playwrightCacheChromium();
  if (fromPlaywright) return fromPlaywright;

  return sparticuzChromium();
}

const executable = await resolveChromiumPath();

if (!executable) {
  console.error("✗ no Chromium executable found — set PLAYWRIGHT_CHROMIUM_EXECUTABLE");
  process.exit(1);
}

/* Playwright appends this to the browser's environment; the bundled Chromium
   needs it whenever it links against the extracted nss/nspr libraries. */
const extraLibs = [AL2023_LIB_DIR, path.dirname(executable)].filter((dir) => fs.existsSync(dir));

fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
fs.writeFileSync(
  CACHE_FILE,
  JSON.stringify(
    { executable, ldLibraryPath: extraLibs.length ? extraLibs.join(":") : null },
    null,
    2
  )
);

if (process.argv.includes("--print")) {
  console.log(executable);
} else {
  console.log(`✓ chromium → ${executable}`);
  if (extraLibs.length) console.log(`  libs     → ${extraLibs.join(":")}`);
}

export { resolveChromiumPath };
