# Solar System Portfolio — Build Progress

Tracks implementation against `plan.md`. A phase is only marked complete once
every testing criterion has been executed and verified.

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 0 | Project Scaffolding & Configuration | ✅ **Complete** | `npm run build` clean · `tsc` clean · `lint` 0 warnings · `screenshots/phase0-scaffold.png` |
| 1 | Data Layer & State Management | ✅ **Complete** | 47 unit tests pass · `verify:data` ✓ · `verify:stores` ✓ · `screenshots/phase1-data-layer.png` |
| 2 | 3D Scene Foundation & Starfield | ✅ **Complete** | 69 unit tests pass · `verify:scene` 44/44 (dev **and** prod) · `screenshots/phase2-*.png` |
| 3 | Central Star (Profile Hub) | ⏸ **Awaiting go-ahead** | Spec ready in `plan.md` |
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

---

### Phase 0 & 1 re-verified (2nd pass, full re-run from a clean `npm ci`)

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ clean |
| `next lint` | ✅ No ESLint warnings or errors |
| `jest` | ✅ 47/47 across 3 suites |
| `verify:data` | ✅ 7th planet + technology flow through; orbits non-overlapping (min gap 3 vs 2.25 required); restored to 6 |
| `verify:stores` | ✅ 17 live browser assertions — defaults, all actions, persistence across reload, `useResponsive` at xs/md/xl — *page errors: none* |
| `npm run build` | ✅ 6/6 static pages, 87.4 kB First Load JS |
| `npm run dev` | ✅ ready in 1.6 s, `/` → 200, `/dev/data-check` → 200, no runtime errors |
| Screenshots | ✅ `phase0-scaffold.png`, `phase1-data-layer.png` regenerated — **no console or page errors** |


## Phase 2 — 3D Scene Foundation & Starfield ✅

Full-viewport WebGL stage that later phases populate. Nothing orbits yet —
this is the sky, the camera and the quality/fallback machinery.

| Criterion | Result |
|---|---|
| `<Canvas>` mounts and fills the viewport | ✅ 1440×900 measured |
| Render loop genuinely runs | ✅ `window.__solarFrames` 0 → 31 |
| Deterministic starfield, scaled by quality tier | ✅ 3000/5000/8000 — identical geometry per seed |
| Stars are round, soft, colour-varied and twinkle | ✅ GLSL point sprites, additive, `discard` outside radius |
| Nebula sky reads as deep space | ✅ procedural gradient + 4 drifting wisps |
| Camera opens on the overview framing | ✅ distance 43.01 (= ‖(0,25,35)‖) |
| Orbit drag + wheel zoom work, with clamps | ✅ stop exactly at 10.00 / 60.00 |
| Idle drift keeps the scene alive | ✅ Δazimuth 0.0105 rad / 2.2 s |
| Bloom on medium/high, off on low | ✅ 23 vs 2 draw calls/frame |
| Reduced motion freezes animation | ✅ Δazimuth 0.00000 rad, scene still renders |
| No WebGL → readable 2D fallback, no crash | ✅ automatic, zero page errors |
| Canvas resizes with the viewport | ✅ tablet 768×1024 + mobile 375×812 |
| three.js stays out of the initial payload | ✅ lazy chunk · 88.8 kB First Load JS |
| Unit tests + typecheck + lint clean | ✅ 69 tests (22 new), 0 lint warnings |

### Stage composition (per frame at `high`)

| Layer | Draw calls | Notes |
|---|---|---|
| Scene background (sky gradient) | 1 | replaces the nebula sprite a distant camera cannot see |
| Starfield (`THREE.Points`) | 1 | 8000 stars, one draw call, zero per-frame re-upload |
| Nebula wisps (4 sprites) | 4 | additive, skipped on `low` + reduced motion |
| Bloom mip chain (EffectComposer) | 17 | `medium`/`high` only — this is the 23 vs 2 split |

Software-rendered FPS in this sandbox is meaningless, so the frame budget is
tracked as **draw calls + submitted vertices** instead.

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

5. **`<html>` had no background (flash-of-white risk).**
   Only `<body>` painted `--cosmic-black`, so rubber-band overscroll or any
   region outside the document box could expose the default white canvas.
   Fixed in `globals.css` by painting the background on `html` too. Verified by
   sampling real screenshot pixels (every edge sample is dark: `#070e1d`,
   `#050510`) — an apparent white edge strip in review was a *viewer* scaling
   artifact, not a page bug.

6. **Test harness couldn't get a browser (environment, not app).**
   `cdn.playwright.dev` is unreachable from this sandbox, so `npx playwright
   install` fails. Solved outside the repo (`/home/user/browser-tools`) with a
   Chromium 153 build from the npm registry plus bundled AL2023 libs and
   SwiftShader — giving real WebGL 2.0. `scripts/shots.mjs`,
   `scripts/persist-check.mjs` and `playwright.config.ts` now honour an optional
   `CHROME_PATH`, which is a no-op wherever Playwright's own browser exists.

7. **The loading overlay never cleared when the canvas never mounted (real bug).**
   `SceneLoader` sat at the `SceneRoot` level while `isLoaded` is only ever set
   from the first rendered frame. With no WebGL (or in 2D mode) there is no
   frame, so the overlay covered the fallback page *forever* and pinned it at
   0%. Moved the loader inside the branch that actually mounts a canvas, and
   made the no-3D path resolve the loading state itself. Caught by screenshotting
   the forced no-WebGL route.

8. **Visible 8-bit gradient banding in the sky (real bug).**
   1024² dithering was needed, not guesswork: sampling a real 1440px scanline
   showed flat plateaus (`12,18,39` for ~240 px) separated by 3/255 steps.
   Fixed with zero-mean ±1.35-level noise in `createSkyGradientTexture`; the
   texture is now 1024² so the grain survives stretching to the viewport.

9. **Telemetry under-reported the scene (measurement bug).**
   `gl.info.autoReset` is `true` by default, so three.js wiped the counters at
   the start of *every* `renderer.render()` — and with `EffectComposer` each
   bloom pass is its own call. Perf samples therefore described only the final
   fullscreen quad. Now `autoReset` is off and `SceneTelemetry` owns the reset.
   Also: three.js counts `POINTS` separately from `triangles`, so a starfield
   legitimately reports **0 triangles** — the sampler publishes `points` too.

10. **Two "passing" checks that proved nothing (test bugs).**
    The zoom test asserted `distance >= 9.5`, which also holds if the rig never
    reaches the clamp — and it never did, because the drag events were not being
    delivered. Rewritten to drive 60 wheel events and assert the band
    `9.5 ≤ d ≤ 12`, plus a second check after further zooming. The reduced-motion
    and drag checks read `window.__solarPerf` immediately after acting, which
    returns a sample taken *before* the action (it refreshes only every 30
    frames ≈ seconds under software rendering) — both silently passed on
    unchanged values. Added `freshPerf()`, which waits for a post-action sample.

11. **Starfield silently clipped if `sizes` exceeds the tier ceiling (guarded).**
    The size distribution was retuned to `0.7 + rand³ · 1.7`; ceiling raised
    accordingly and covered by unit tests asserting the ≤2.41 range and the
    small/giant ratio, so a future retune cannot drift past GL's point-size cap.

12. **`next.config.mjs` `allowedDevOrigins` deliberately left unset.**
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
npm run verify:scene   # live WebGL scene checks (44 assertions)
npm run test:e2e       # Playwright E2E
npm run shots          # visual verification → screenshots/
```

## Next up

**Phase 3 — Central Star (Profile Hub)** is specified in `plan.md` and ready to
start, but **blocked pending an explicit go-ahead** — the instruction for this
session was to complete Phase 2 and stop before Phase 3.

## Replacing placeholder content

All content lives in `src/data/` — no component edits required:

| File | Drives |
|---|---|
| `profile.ts` | Star, Profile card, About overlay, JSON-LD |
| `projects.ts` | One planet per entry (+ its orbit ring and panel) |
| `technologies.ts` | One satellite per entry |
| `about.ts` | Experience timeline, education, skill constellations |
| `navigation.ts` | HUD navigation + keyboard shortcut map |
