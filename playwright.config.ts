import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration (Phases 9, 11 & 12).
 *
 * WebGL is exercised through Chromium's SwiftShader software renderer, so the
 * Three.js scene genuinely renders during tests and screenshots.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/report" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    // Software WebGL needs a moment; keep animations running for visual tests.
    launchOptions: {
      args: [
        "--no-sandbox",
        "--enable-unsafe-swiftshader",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--ignore-gpu-blocklist",
      ],
    },
  },

  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "tablet-chromium",
      use: {
        ...devices["iPad Mini"],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        isMobile: false,
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
