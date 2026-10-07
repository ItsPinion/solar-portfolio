# Solar System Portfolio — Build Progress

Tracks implementation against `plan.md`. A phase is only marked complete once
every testing criterion has been executed and verified.

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 0 | Project Scaffolding & Configuration | ✅ **Complete** | `npm run build` clean · `tsc` clean · `lint` 0 warnings · `screenshots/phase0-scaffold.png` |
| 1 | Data Layer & State Management | ✅ **Complete** | 47 unit tests pass · `verify:data` ✓ · `verify:stores` ✓ · `screenshots/phase1-data-layer.png` |
| 2 | 3D Scene Foundation & Starfield (2.1–2.3) | 🟡 **Core done** — 2.4–2.8 pending | 24/24 `verify:phase2` checks · 60 unit tests · 5 E2E specs · `screenshots/phase2-*.png` |
| 3 | Central Star (Profile Hub) | ⬜ Not started | — |
| 4 | Planets (Projects) with Orbital Motion | ⬜ Not started | — |
| 5 | Satellites (Technologies) | ⬜ Not started | — |
| 6 | Project Detail Panel | ⬜ Not started | — |
| 7 | Navigation & HUD | ⬜ Not started | — |
| 8 | Contact Section & Additional Overlays | ⬜ Not started | — |
| 9 | Responsive Design & Mobile Experience | ⬜ Not started | — |
| 10 | Animations, Polish & Micro-interactions | ⬜ Not started | — |
| 11 | Accessibility & Performance | ⬜ Not started | — |
| 12 | Final Testing, Bug Fixes & Deployment | ⬜ Not started | — |

---

## Phase 0 — Scaffolding & Configuration ✅

| Criterion | Result |
|---|---|
| `npm run dev` starts without errors | ✅ Ready in ~1.1s, `/` → HTTP 200 |
| Navigating to localhost:3000 shows the page | ✅ `screenshots/phase0-scaffold.png` |
| `npm run build` passes | ✅ 6/6 static pages, 87.4 kB First Load JS |
| No peer-dependency warnings that break the build | ✅ `npm ls` clean (only optional expo/react-native stubs) |
| Folder structure exists as specified | ✅ all 22 planned paths verified |
| Tailwind classes render correctly | ✅ full palette + fonts + glass + gradient confirmed in screenshot |

## Phase 1 — Data Layer & State Management ✅

| Criterion | Result |
|---|---|
| All data files import & export correct shapes | ✅ 47 Jest tests across `data.test.ts` |
| Temporary page renders all data as plain text | ✅ `/dev/data-check` |
| Stores initialise with correct defaults | ✅ unit + live browser check |
| Store actions update state correctly | ✅ unit tests + live click-through |
| `useReducedMotion` returns boolean | ✅ unit test (true + false paths) |
| `useResponsive` returns current breakpoint | ✅ xs/sm/md/lg/xl/2xl verified live |
| Adding a project compiles without errors | ✅ `npm run verify:data` |
| TypeScript shows no type errors | ✅ `tsc --noEmit` clean |

### Content shipped
- **6 projects** (planets) — `nebula-analytics`, `orbit-commerce`,
  `exoplanet-explorer`, `pulse-collab`, `sagan-ai`, `helio-design-system`
  · orbit radii 6.5 → 21.5 (gap 3.0, largest planet diameter 2.5 → no overlap)
- **35 technologies** (satellites) spanning frontend/backend/database/devops/design/other
- Profile, about (4 roles, 2 qualifications, 5 skill groups), navigation, keyboard map

## Phase 2 — 3D Scene Foundation & Starfield 🟡

Scope delivered in this pass: **2.1 Scene**, **2.2 Starfield**, **2.3
CameraController** — plus the loading screen (2.6) because the page flow is not
testable without it. Post-processing (2.4) exists and is wired, but its tuning
is part of the remaining 2.4–2.8 pass.

| Criterion | Result |
|---|---|
| Loading screen, then fades to the 3D scene | ✅ overlay appears, fades, and **unmounts** (see bug 6) |
| Stars visible and distributed across the viewport | ✅ ≥0.096% bright pixels in all four quadrants |
| Stars twinkle / vary | ✅ frame-to-frame delta with a pinned camera |
| Mouse drag rotates the camera | ✅ azimuth −0.008 → −0.948 rad |
| Scroll wheel zooms within constraints | ✅ clamps exactly at 10.0 and 60.0 units |
| Bloom post-processing creates visible glow | ✅ composer active on high/medium (`data-postprocessing`) |
| No console errors related to WebGL or Three.js | ✅ 0 console + 0 page errors |
| Performance maintains 60fps on mid-range hardware | ⚠️ unmeasurable here (SwiftShader); **draw-call/triangle budget** verified instead: 26 calls, 8 000 points, 1 starfield draw call |
| Screenshot: dark background, visible stars, no artefacts | ✅ `phase2-starfield.png`, `phase2-loading.png` |
| Screenshots at different zoom levels (fog/depth) | ✅ `phase2-zoom-min.png` (10 u), `phase2-zoom-mid.png`, `phase2-zoom-max.png` (60 u) |

### Shipped in this pass
- `Scene.tsx` — ACES Filmic, AA, sRGB, pixel ratio capped per quality tier,
  exponential fog, `Suspense`, ambient/point/directional lighting, WebGL
  fallback, `data-scene-ready`
- `Starfield.tsx` — 3 000–8 000 stars in **one** points draw call, size/tint/
  phase/twinkle-speed as vertex attributes, tilted galactic band, 2–3 nebula
  billboards with procedural canvas textures, fade-in on first paint
- `CameraController.tsx` — OrbitControls with damping 0.05, zoom 10–60, polar
  clamp, idle auto-rotate that yields to the user, store-driven focus/zoom
  transitions (incl. live planet tracking hooks for Phase 4)
- `LoadingScreen.tsx` — store-driven progress, flavour lines, Framer Motion
  fade-out, 12 s escape hatch, `pointer-events-none`
- `scene-telemetry.ts` + `SceneDevOverlay.tsx` — frame/fps/draw-call stats for
  tests and a dev HUD on the backquote key
- Tooling: `scripts/verify-phase2.mjs`, `scripts/analyse-shot.mjs`,
  `scripts/ensure-browser.mjs` (Chromium resolver)

---

## Bugs found and fixed during verification

1. **Persisted settings never rehydrated (real bug).**
   `StoreHydration` was written in Phase 1 but never mounted in the layout, so
   `persist.rehydrate()` was never called and the default state overwrote
   localStorage on every load. Fixed by mounting it in `src/app/layout.tsx` and
   ordering hydration strictly: rehydrate → system motion pref → device quality
   probe → WebGL fallback.

2. **Device quality probe fought explicit user choices.**
   Auto-detection would have overwritten a user's manually chosen quality tier.
   Added a `qualityTouched` flag; `setQuality(q, { system: true })` marks
   automatic changes so the device probe cannot freeze or clobber the setting.

3. **Running `next build` while `next dev` was live corrupted `.next`.**
   Both share the same output directory, producing
   `Cannot find module './NNN.js'` 500s. Documented in `next.config.mjs`;
   workflow is now stop dev → build → restart dev.

4. **Over-strict test assertions (test bugs, not app bugs).**
   A hard-coded `toHaveLength(7)` broke *legitimately* when the data-driven
   verifier appended a planet — rewritten to assert `projects.length + 1`.
   The orbit-overlap assertion now checks every radius pair
   (`|r₁−r₂| > size₁+size₂`), which is the actual non-overlap condition.

5. **Loading overlay swallowed every pointer event (found by the E2E drag
   test).** The overlay is `fixed inset-0` and only left the DOM 420 ms + 900 ms
   after the scene was ready — but it stayed hit-testable the whole time, so the
   first drag or wheel gesture went to the overlay instead of OrbitControls.
   `pointer-events-none` fixed it; the drag delta went from 0.005 rad to 1.31 rad.

6. **Star radiance model was calibrated in the wrong space (found by pixel
   analysis, not by eye).** Feeding star *alphas* into additive blending in
   sRGB space produced a sky that was simultaneously too dim and too washed
   out. Rewritten: radiance is pre-multiplied into RGB in HDR, the starfield
   shader includes three's `tonemapping_fragment`/`colorspace_fragment` chunks,
   and ACES is applied on both render paths — so the `low` tier (direct render)
   and `high` tier (composer) agree. Bright stars are now also the *large* ones
   (correlated radiance + power-law size), which is what makes the sky read as
   a real night sky.

7. **Zoom was unusably slow.** three-stdlib dollies `0.95 ** zoomSpeed` per
   wheel event: 5% per click meant ~35 clicks to cross the 10–60 range.
   `zoomSpeed={1.8}` gives ~10% per click.

8. **`gl.info.render` reported one draw call.** With `postprocessing` installed
   the composer owns the loop, and three's counters reset for every pass, so
   the telemetry only ever saw the final fullscreen quad. `gl.info.autoReset` is
   now disabled and reset from the telemetry frame callback (priority 0) — the
   reported 5/24/26 draw calls are real budgets now.

9. **`next.config.mjs` `allowedDevOrigins` deliberately left unset.**
   Next 14.2 *warns* on cross-origin dev requests when unset but *blocks with
   403* as soon as it is defined. The preview is proxied through a domain we
   don't control, so warn-only is the safe choice. Verified with a Host-header
   matrix (localhost / 127.0.0.1 / `*.e2b.app` / arbitrary proxy domain).

---

## Environment notes

- Node 20.20.2, npm 10.8.2, Next.js 14.2.35 (App Router, `src/`, TypeScript).
- Playwright Chromium + system deps installed. WebGL 2.0 works via
  **ANGLE/SwiftShader software rendering**, so the Three.js scene really renders
  in tests and screenshots. Software rasterisation is far slower than a GPU —
  sandbox FPS is not representative; frame budget will be verified by measuring
  draw calls / triangle counts instead.
- Fonts (Space Grotesk, Inter, JetBrains Mono) are self-hosted in
  `src/app/fonts`, so builds never depend on the Google Fonts network.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build (stop dev first!)
npm run verify         # typecheck + lint + unit tests + data-driven check
npm test               # Jest unit tests
npm run verify:data    # append a 7th planet/technology, assert, restore
npm run verify:stores  # live browser check of stores + persistence
npm run verify:phase2  # Phase 2 criteria against the running dev server
npm run test:e2e       # Playwright E2E (also resolves Chromium, see below)
npm run shots          # visual verification → screenshots/
npm run analyse:shot screenshots/phase2-starfield.png   # pixel metrics
npm run browser:ensure # resolve/locate a Chromium for Playwright
```

### Browser resolution (restricted networks)

`npm run shots`, `test:e2e` and `verify:stores` all run
`scripts/ensure-browser.mjs` first, which finds a Chromium to drive:

1. `PLAYWRIGHT_CHROMIUM_EXECUTABLE`
2. the cached choice in `node_modules/.chromium-runtime.json`
3. a system Chrome/Chromium
4. Playwright's own download
5. the binary inside `@sparticuz/chromium` (npm) — including extracting the
   `libnspr4`/`libnss3` libraries it is linked against and exporting
   `LD_LIBRARY_PATH`

On a normal developer machine step 4 wins and nothing changes. In this sandbox
Playwright's CDN is unreachable, so step 5 is what makes screenshots possible —
with real WebGL 2.0 through ANGLE/SwiftShader.

> SwiftShader renders at single-digit FPS, so interactivity assertions in tests
> wait on rendered *frames*, not wall-clock time — a drag plus a 600 ms sleep
> gives OrbitControls only one or two update ticks.

## Replacing placeholder content

All content lives in `src/data/` — no component edits required:

| File | Drives |
|---|---|
| `profile.ts` | Star, Profile card, About overlay, JSON-LD |
| `projects.ts` | One planet per entry (+ its orbit ring and panel) |
| `technologies.ts` | One satellite per entry |
| `about.ts` | Experience timeline, education, skill constellations |
| `navigation.ts` | HUD navigation + keyboard shortcut map |
