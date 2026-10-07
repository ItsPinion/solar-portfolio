import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 2 E2E — 3D scene foundation & starfield.
 *
 * These specs drive the real WebGL scene (SwiftShader in CI) and assert the
 * behaviours the plan calls out for this phase. Pixel-level verification lives
 * in `scripts/verify-phase2.mjs`; here we cover structure and interaction.
 */

async function waitForScene(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (window as any).__solarFrames > 20, null, {
    timeout: 90_000,
  });
  // The loading overlay sits above the canvas until it has faded out and
  // unmounted — camera interaction is only meaningful once it is gone.
  await page.getByTestId("loading-screen").waitFor({ state: "detached", timeout: 60_000 });
}

const frames = (page: Page) => page.evaluate(() => (window as any).__solarFrames as number);

/**
 * Wait for real frames to elapse. OrbitControls applies rotation with damping,
 * so a gesture only settles once the render loop has run a few times — and in
 * this environment (software WebGL) frames are slow enough that wall-clock
 * waits are unreliable.
 */
async function advanceFrames(page: Page, count = 8) {
  const start = await frames(page);
  await page.waitForFunction(
    ([from, n]) => (window as any).__solarFrames > (from as number) + (n as number),
    [start, count] as [number, number],
    { timeout: 60_000 }
  );
}

const camera = (page: Page) =>
  page.evaluate(() => (window as any).__solarScene().camera as {
    position: [number, number, number];
    target: [number, number, number];
    distance: number;
    azimuth: number;
    polar: number;
    autoRotating: boolean;
  });

test.describe("Phase 2 · scene foundation", () => {
  test("shows the loading screen, then reveals the rendered scene", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const loader = page.getByTestId("loading-screen");
    await expect(loader).toBeVisible();

    await expect(loader).toBeHidden({ timeout: 60_000 });
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.getByTestId("scene-root")).toHaveAttribute("data-scene-ready", "true");
  });

  test("renders a starfield of points with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await waitForScene(page);

    const stats = await page.evaluate(() => (window as any).__solarScene().stats);
    expect(stats.stars).toBeGreaterThanOrEqual(3000);
    expect(stats.points).toBeGreaterThan(0);
    expect(stats.fps).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test("drag rotates the view and the camera stays upright", async ({ page }) => {
    await waitForScene(page);
    const box = (await page.locator("canvas").boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    const before = await camera(page);

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 380, cy - 180, { steps: 24 });
    await page.mouse.up();
    await advanceFrames(page, 10);

    const after = await camera(page);
    expect(Math.abs(after.azimuth - before.azimuth)).toBeGreaterThan(0.05);
    // Vertical constraint: never upside down.
    expect(after.polar).toBeGreaterThan(0.25);
    expect(after.polar).toBeLessThan(Math.PI - 0.25);
  });

  test("zoom is clamped between 10 and 60 units", async ({ page }) => {
    await waitForScene(page);
    const box = (await page.locator("canvas").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    for (let i = 0; i < 45; i++) {
      await page.mouse.wheel(0, -1200);
      await advanceFrames(page, 1);
      if ((await camera(page)).distance <= 10.05) break;
    }
    await advanceFrames(page, 4);
    expect((await camera(page)).distance).toBeGreaterThanOrEqual(9.9);
    expect((await camera(page)).distance).toBeLessThan(10.5);
  });

  test("respects reduced motion: no idle camera drift", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "solar-portfolio:settings",
        JSON.stringify({
          state: { reducedMotion: true, userTouchedMotion: true, quality: "medium", qualityTouched: true },
          version: 1,
        })
      );
    });
    await waitForScene(page);

    const first = await camera(page);
    await page.waitForTimeout(2500);
    const second = await camera(page);

    expect(second.autoRotating).toBe(false);
    expect(Math.abs(second.azimuth - first.azimuth)).toBeLessThan(0.01);
  });
});
