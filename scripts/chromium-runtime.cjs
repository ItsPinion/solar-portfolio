/**
 * ── CHROMIUM RUNTIME (sync) ───────────────────────────────────
 * Reads the executable + `LD_LIBRARY_PATH` that `scripts/ensure-browser.mjs`
 * resolved, applies the library path to `process.env` (child processes inherit
 * it) and returns Playwright launch options.
 *
 * Kept as CommonJS so both `playwright.config.ts` (TS, config loader) and
 * `scripts/shots.mjs` (ESM) can consume it without interop gymnastics.
 */
const fs = require("node:fs");
const path = require("node:path");

const RUNTIME_FILE = path.join(__dirname, "..", "node_modules", ".chromium-runtime.json");

/** Flags that make software WebGL (SwiftShader) usable in containers. */
const BASE_ARGS = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--enable-unsafe-swiftshader",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--ignore-gpu-blocklist",
];

function readRuntime() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    return { executable: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, ldLibraryPath: null };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8"));
    return parsed && parsed.executable ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @returns {{ args: string[], launchOptions: Record<string, unknown> }}
 *   `launchOptions` is empty when Playwright's own downloaded browser should be
 *   used (the normal case on a developer machine).
 */
function chromiumLaunch() {
  const runtime = readRuntime();
  if (!runtime) return { args: BASE_ARGS, launchOptions: {} };

  if (runtime.ldLibraryPath) {
    process.env.LD_LIBRARY_PATH = [runtime.ldLibraryPath, process.env.LD_LIBRARY_PATH]
      .filter(Boolean)
      .join(":");
  }

  return { args: BASE_ARGS, launchOptions: { executablePath: runtime.executable } };
}

module.exports = { chromiumLaunch, BASE_ARGS };
