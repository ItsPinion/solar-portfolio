# Solar System Portfolio — Build Progress

Tracks implementation against `plan.md`. A phase is only marked complete once
every testing criterion has been executed and verified.

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 0 | Project Scaffolding & Configuration | ✅ **Complete** | `npm run build` clean · `tsc` clean · `lint` 0 warnings · `screenshots/phase0-scaffold.png` |
| 1 | Data Layer & State Management | ✅ **Complete** | 47 unit tests pass · `verify:data` ✓ · `verify:stores` ✓ · `screenshots/phase1-data-layer.png` |
| 2 | 3D Scene Foundation & Starfield | ⬜ Not started (awaiting go-ahead) | — |
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

5. **`next.config.mjs` `allowedDevOrigins` deliberately left unset.**
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
npm run test:e2e       # Playwright E2E
npm run shots          # visual verification → screenshots/
```

## Replacing placeholder content

All content lives in `src/data/` — no component edits required:

| File | Drives |
|---|---|
| `profile.ts` | Star, Profile card, About overlay, JSON-LD |
| `projects.ts` | One planet per entry (+ its orbit ring and panel) |
| `technologies.ts` | One satellite per entry |
| `about.ts` | Experience timeline, education, skill constellations |
| `navigation.ts` | HUD navigation + keyboard shortcut map |
