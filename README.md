# 🌌 Solar System Portfolio

An interactive 3D developer portfolio: projects orbit a central star, and each
project's technologies circle it as satellites. Built with **Next.js 14 (App
Router)**, **React Three Fiber**, **Three.js**, **Zustand** and **Framer Motion**.

The whole site is **data-driven** — no component edits are needed to add content:

| File | Drives |
|---|---|
| `src/data/profile.ts` | Star, Profile card, About overlay, JSON-LD |
| `src/data/projects.ts` | One planet per entry (+ its orbit ring and panel) |
| `src/data/technologies.ts` | One satellite per entry |
| `src/data/about.ts` | Experience timeline, education, skill constellations |
| `src/data/navigation.ts` | HUD navigation + keyboard shortcut map |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

The first load shows a loading screen, then fades into the starfield. Drag to
orbit, scroll to zoom (clamped between 10 and 60 units). Press `` ` `` in
development for a live FPS / draw-call overlay.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build (stop the dev server first!)
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Jest unit tests
npm run verify         # typecheck + lint + tests + data-driven verification
npm run verify:phase2  # Phase 2 acceptance criteria (needs `npm run dev`)
npm run verify:stores  # live browser check of Zustand stores + persistence
npm run verify:data    # append a 7th planet/technology, assert, restore
npm run test:e2e       # Playwright end-to-end specs
npm run shots          # visual verification → screenshots/
npm run analyse:shot screenshots/phase2-starfield.png   # pixel metrics
```

### Browsers for Playwright

`shots`, `test:e2e` and `verify:stores` first run `scripts/ensure-browser.mjs`,
which resolves a Chromium via (in order): `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, the
cache in `node_modules/.chromium-runtime.json`, a system Chrome, Playwright's
own download, then the npm-packaged `@sparticuz/chromium` binary (including the
`libnspr4`/`libnss3` libraries it links against). On a normal machine the
Playwright download wins and nothing changes; in restricted environments this is
what lets the visual tests run at all.

SwiftShader software rendering is expected to be slow (single-digit FPS), so
interactive assertions wait on *rendered frames* rather than wall-clock time.

## Project structure

```
src/
├── app/                      # routes, fonts, global styles (App Router)
├── components/
│   ├── canvas/               # Scene, Starfield, CameraController, PostProcessing
│   ├── shared/               # cross-cutting helpers (hydration, dev overlay)
│   └── ui/                   # 2D overlays (LoadingScreen, …)
├── data/                     # all content — no JSX in here
├── hooks/                    # useOrbitalMotion, useResponsive, useReducedMotion, …
├── lib/                      # constants, utils, shaders, scene telemetry
├── stores/                   # Zustand: portfolio (transient) + settings (persisted)
└── types/                    # shared TypeScript contracts
```

## Design tokens

Colour palette, typography, spacing, easing curves and durations are defined once
in `src/app/globals.css` (`:root`) and mirrored in `tailwind.config.ts`, so
`bg-cosmic-black`, `text-star-gold`, `font-display`, `duration-glacial` and
friends all resolve to the same values CSS uses.

## Notes

- Never run `npm run build` while `next dev` is running — they share `.next`
  (documented in `next.config.mjs`).
- `next.config.mjs` deliberately leaves `allowedDevOrigins` unset: Next 14.2
  warns on cross-origin dev requests when undefined but blocks with 403 when
  defined, which would break the proxied live preview.
- Progress against `plan.md` is tracked in [PROGRESS.md](./PROGRESS.md).
