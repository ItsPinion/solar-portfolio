# Solar System Portfolio — Build Plan

> **Provenance.** The original `plan.md` was not present in the repository,
> in its git history, or on the remote when this phase was implemented. The
> phase list and the Phase 0/1 criteria below are taken **verbatim from
> `PROGRESS.md`** (which survived); the remaining detail is reconstructed from
> the repository's own conventions — `src/types/index.ts`, `src/lib/constants.ts`,
> `src/data/*`, the `scripts/verify-*.mjs` harnesses and the phase references
> scattered through code comments. Sections marked _provisional_ are inferred and
> should be replaced if the original document turns up.

An interactive 3D portfolio where **projects orbit a central star** as planets
and **technologies circle each planet** as satellites. Next.js (App Router) +
React Three Fiber + Framer Motion + Zustand + Tailwind.

---

## Phase status

| Phase | Title | Status |
|-------|-------|--------|
| 0 | Project Scaffolding & Configuration | ✅ Complete |
| 1 | Data Layer & State Management | ✅ Complete |
| 2 | 3D Scene Foundation & Starfield | ✅ Complete |
| 3 | Central Star (Profile Hub) | ⬜ Not started — awaiting go-ahead |
| 4 | Planets (Projects) with Orbital Motion | ⬜ Not started |
| 5 | Satellites (Technologies) | ⬜ Not started |
| 6 | Project Detail Panel | ⬜ Not started |
| 7 | Navigation & HUD | ⬜ Not started |
| 8 | Contact Section & Additional Overlays | ⬜ Not started |
| 9 | Responsive Design & Mobile Experience | ⬜ Not started |
| 10 | Animations, Polish & Micro-interactions | ⬜ Not started |
| 11 | Accessibility & Performance | ⬜ Not started |
| 12 | Final Testing, Bug Fixes & Deployment | ⬜ Not started |

---

## Phase 0 — Project Scaffolding & Configuration ✅

| Criterion | Result |
|---|---|
| `npm run dev` starts without errors | ✅ |
| Navigating to localhost:3000 shows the page | ✅ |
| `npm run build` passes | ✅ 6/6 static pages |
| No peer-dependency warnings that break the build | ✅ |
| Folder structure exists as specified | ✅ |
| Tailwind classes render correctly | ✅ |

## Phase 1 — Data Layer & State Management ✅

| Criterion | Result |
|---|---|
| All data files import & export correct shapes | ✅ |
| Temporary page renders all data as plain text | ✅ `/dev/data-check` |
| Stores initialise with correct defaults | ✅ |
| Store actions update state correctly | ✅ |
| `useReducedMotion` returns boolean | ✅ |
| `useResponsive` returns current breakpoint | ✅ |
| Adding a project compiles without errors | ✅ `npm run verify:data` |
| TypeScript shows no type errors | ✅ |

## Phase 2 — 3D Scene Foundation & Starfield ✅

Goal: replace the scaffolding page with a full-viewport WebGL scene that later
phases populate. No planets or star yet — this phase is the *stage*.

| # | Criterion | Result |
|---|---|---|
| 1 | `<Canvas>` mounts and fills the viewport | ✅ 1440×900 |
| 2 | Render loop genuinely runs | ✅ `window.__solarFrames` 0 → 31 |
| 3 | Deterministic starfield, scaled by quality tier | ✅ 3000 / 5000 / 8000 stars |
| 4 | Stars are round, soft, colour-varied and twinkle | ✅ GLSL point sprites |
| 5 | Nebula sky reads as a deep-space backdrop | ✅ procedural gradient + 4 wisps |
| 6 | Camera opens on the overview framing | ✅ distance 43.01 = \|(0,25,35)\| |
| 7 | Orbit drag + wheel zoom work, with clamps | ✅ clamped at 10.00 / 60.00 |
| 8 | Idle drift keeps the scene alive | ✅ Δazimuth 0.0105 rad / 2.2 s |
| 9 | Bloom glows on medium/high, off on low | ✅ 23 vs 2 draw calls |
| 10 | Reduced motion freezes animation | ✅ Δazimuth 0.00000 rad |
| 11 | No WebGL → readable 2D fallback, no crash | ✅ automatic |
| 12 | Canvas resizes with the viewport | ✅ tablet + mobile |
| 13 | three.js stays out of the initial payload | ✅ lazy chunk, 88.8 kB First Load JS |
| 14 | Unit tests + typecheck + lint clean | ✅ 69 tests, 22 new |

**Deliverables:** `src/components/three/*`, `src/lib/starfield.ts`,
`src/lib/textures.ts`, `src/lib/shaders/starfield.{vert,frag}`,
`src/types/global.d.ts`, `scripts/verify-scene.mjs`, `tests/unit/scene.test.ts`.

**Out of scope until later phases:** the star/sun mesh (3), planets (4),
satellites (5), panels (6), HUD (7), contact (8), mobile 2D layout (9),
micro-interactions (10), a11y/perf passes (11).

---

## Phases 3–12 — provisional scope

> Inferred from data model, constants and code comments. Verify against the
> original plan before implementing.

### Phase 3 — Central Star (Profile Hub)
Glowing star at the origin (`STAR_SIZE = 2.5`) with corona, animated surface
shader and light source. Click → profile panel; camera uses
`CAMERA_STAR_ZOOM` / `focusCamera([0,0,0], 45)`. Profile content from
`src/data/profile.ts`.

### Phase 4 — Planets (Projects) with Orbital Motion
One planet per entry in `src/data/projects.ts`, at `orbitRadius`, sized by
`size`, tinted by `color`, with an orbit ring (visibility from `showOrbits`).
Motion via `useOrbitalMotion` driven by `ORBIT_SPEED_BASE` and per-project
`orbitSpeed` / `orbitInclination` / `orbitPhase`; `orbitPhase` auto-distributes
when omitted. Reduced motion parks bodies at their starting angle. Hover →
`hoverPlanet`, click → `selectPlanet` + `focusCamera`.

### Phase 5 — Satellites (Technologies)
Each project's `technologies[]` becomes satellites on a ring of
`SATELLITE_ORBIT_RADIUS` at `SATELLITE_SIZE`. Hover shows the tech label
(`showLabels`); click opens `docsUrl`. 2D panel hover drives
`highlightedTechnology` for link-up with the 3D layer.

### Phase 6 — Project Detail Panel
Side panel for `selectedPlanet`: title, role, period, features, resolved
technology chips (`resolveTechnologies`), live/source links. Opens via
`openPanelById("projects")`. Keyboard + focus trap; Escape closes.

### Phase 7 — Navigation & HUD
HUD built from `src/data/navigation.ts` (Home, About, Projects, Contact,
Resume) with `keyboardShortcuts` map, settings panel (quality, orbits, labels,
sound, motion, contrast, text scale) persisted via `useSettingsStore`
(`STORAGE_KEYS.settings`), visited-project tracking (`STORAGE_KEYS.visited`),
and the "press any key to enter" intro gated by `hasEntered`.

### Phase 8 — Contact Section & Additional Overlays
Contact overlay with email + social links from `profile.social`, resume link,
and the About overlay (experience timeline, education, skill constellations,
interests) from `src/data/about.ts`.

### Phase 9 — Responsive Design & Mobile Experience
Touch-optimised 2D layout below `MOBILE_3D_MIN_WIDTH` (768px) replacing the
Phase 2 placeholder fallback; device quality probe (`detectDeviceQuality`),
quality tiers, `prefer2D` handling, orientation changes.

### Phase 10 — Animations, Polish & Micro-interactions
Entrance/exit transitions, hover affordances, stagger, sound
(`soundEnabled` + howler), loading choreography, cursor states.

### Phase 11 — Accessibility & Performance
Focus management, ARIA live region (`announce`), keyboard-only traversal,
`highContrast`, `textScale`, reduced-motion audit, draw-call/triangle budgets,
bundle analysis (`npm run analyze`).

### Phase 12 — Final Testing, Bug Fixes & Deployment
Playwright E2E across projects, cross-viewport visual checks, Lighthouse,
metadata/OG image, deploy.

---

## Appendix A — Data architecture

The site is **fully data-driven**: content lives in `src/data/*`, shapes in
`src/types/index.ts`, and components render whatever they find. Adding a project
to `src/data/projects.ts` makes a planet appear — with its orbit ring, panel and
satellites — with no component edits.

| File | Drives |
|---|---|
| `profile.ts` | Star, profile card, About overlay, JSON-LD |
| `projects.ts` | One planet per entry (+ orbit ring and panel) |
| `technologies.ts` | One satellite per entry |
| `about.ts` | Experience timeline, education, skill constellations |
| `navigation.ts` | HUD navigation + keyboard shortcut map |

`CelestialObject` is the extensibility seam: add a `type`, a canvas component,
an overlay and a data file.

## Appendix B — Design tokens

Core palette (`tailwind.config.ts` + `src/lib/constants.ts`):

| Token | Value | Use |
|---|---|---|
| `cosmic-black` | `#050510` | Page + scene background |
| `deep-space` | `#0a0a1a` | Elevated surfaces |
| `nebula-purple` | `#1a0533` | Sky gradient apex |
| `nebula-blue` | `#0a1628` | Sky gradient middle |
| `star-gold` | `#FDB813` | Accent, star, focus ring |
| `star-white` | `#FFF5E0` | Primary text |
| `planet-blue` | `#4F9CF9` | Secondary accent |

Fonts (self-hosted, `src/app/fonts`): Space Grotesk (`font-display`), Inter
(`font-body`), JetBrains Mono (`font-mono`). Utilities: `glass`,
`shadow-glass`, `bg-nebula-gradient`, `bg-star-gradient`, `text-fluid-*`.

## Appendix C — File structure

```
src/
  app/            layout, page, globals.css, fonts/, dev/
  components/
    shared/       StoreHydration
    three/        SceneRoot, SceneCanvas, CameraRig, Starfield,
                  NebulaBackdrop, SceneEffects, SceneLoader,
                  SceneFallback, SceneErrorBoundary, SceneTelemetry
  data/           profile, projects, technologies, about, navigation
  hooks/          useOrbitalMotion, useResponsive, useReducedMotion, useKeyboardNav
  lib/            constants, utils, starfield, textures, shaders/
  stores/         usePortfolioStore, useSettingsStore
  styles/         animations.css
  types/          index.ts, global.d.ts, glsl.d.ts
scripts/          shots.mjs, verify-scene.mjs, verify-data-driven.mjs, persist-check.mjs
tests/            unit/, e2e/
```

## Appendix D — Verification

```bash
npm run dev            # dev server
npm run build          # production build (stop dev first — shared .next dir)
npm run verify         # typecheck + lint + unit tests + data-driven check
npm run verify:scene   # live WebGL scene checks (needs a running server)
npm run verify:stores  # live store + persistence checks (needs a running server)
npm run shots          # visual verification → screenshots/
```

`verify:scene`, `verify:stores`, `shots` and Playwright honour an optional
`CHROME_PATH` so they can run where Playwright's browser download is blocked.
