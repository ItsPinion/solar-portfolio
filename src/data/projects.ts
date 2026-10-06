import type { Project } from "@/types";

/**
 * ── PROJECT DATA (PLANETS) ────────────────────────────────────
 * One entry per planet. Add an object to this array and a new planet — with
 * its own orbit ring, satellites and detail panel — appears automatically
 * (see Appendix A).
 *
 * Field notes:
 *  - `size`        relative planet radius (0.4 small → 1.4 large)
 *  - `orbitRadius` distance from the star; the values below are spaced so
 *                  orbits never intersect
 *  - `orbitSpeed`  orbital period multiplier — larger = slower orbit
 *  - `technologies` ids from `src/data/technologies.ts`
 */
export const projects: Project[] = [
  {
    id: "nebula-analytics",
    title: "Nebula Analytics",
    description: "Real-time analytics dashboard streaming 2M+ events per day.",
    longDescription:
      "Nebula Analytics ingests and visualises high-volume product telemetry in real time. Event streams land in a columnar warehouse, get aggregated by a streaming pipeline, and are rendered in a dashboard that stays interactive at 60fps even with millions of data points on screen.\n\nThe hardest part was the rendering layer: virtualised charts, request coalescing and an incremental WebSocket protocol keep the UI responsive while the data underneath changes every second. I owned the architecture end to end, from the ingestion schema to the charting primitives.",
    role: "Lead Full Stack Engineer",
    features: [
      "Streaming event pipeline handling 2M+ daily events",
      "60fps virtualised charting with 100k+ visible data points",
      "Incremental WebSocket protocol with automatic reconnection",
      "Custom query builder with saved segments and sharing",
      "Role-based access control with audit logging",
    ],
    technologies: ["nextjs", "typescript", "websockets", "postgres", "redis", "docker"],
    liveUrl: "https://example.com/nebula-analytics",
    sourceUrl: "https://github.com/alexnova/nebula-analytics",
    color: "#4F9CF9",
    size: 1.15,
    orbitRadius: 6.5,
    orbitSpeed: 0.35,
    orbitInclination: 4,
    orbitPhase: 0.6,
    period: "2024 — Present",
  },
  {
    id: "orbit-commerce",
    title: "Orbit Commerce",
    description: "Headless storefront platform with 99.98% uptime at 400k MAU.",
    longDescription:
      "Orbit Commerce is a headless storefront platform powering mid-market retail brands. It pairs a Next.js storefront with a composable backend so merchandising teams can launch new campaigns without engineering involvement.\n\nI designed the front-end architecture: incremental static regeneration for catalogue pages, edge-cached personalisation, and a component library shared across five brand themes. Checkout conversion improved 18% after the rewrite.",
    role: "Front-End Architect",
    features: [
      "Multi-tenant theming system driving 5 brand storefronts",
      "ISR + edge caching cutting TTFB to under 120ms",
      "Stripe-powered checkout with 3DS and wallet support",
      "Headless CMS integration for merchandising teams",
      "Playwright suite with 240 E2E checkout scenarios",
    ],
    technologies: ["nextjs", "react", "tailwind", "stripe", "prisma", "vercel"],
    liveUrl: "https://example.com/orbit-commerce",
    sourceUrl: "https://github.com/alexnova/orbit-commerce",
    color: "#F6A23C",
    size: 1.0,
    orbitRadius: 9.5,
    orbitSpeed: 0.55,
    orbitInclination: 9,
    orbitPhase: 2.4,
    period: "2023 — 2024",
  },
  {
    id: "exoplanet-explorer",
    title: "Exoplanet Explorer",
    description: "WebGL explorer for 5,000+ confirmed exoplanets, built on custom shaders.",
    longDescription:
      "Exoplanet Explorer turns the NASA exoplanet archive into a navigable 3D universe. Each system is rendered with procedurally generated planets using parameters derived from real astronomical data — radius, equilibrium temperature, orbital period and stellar class.\n\nThe renderer runs entirely on the GPU with instanced meshes and custom GLSL shaders, so it comfortably handles thousands of bodies on mid-range laptops. This was my deep dive into WebGL performance and shader authoring, and much of the technique later fed into this portfolio.",
    role: "Creative Developer",
    features: [
      "5,000+ procedurally generated planets from live archive data",
      "GPU-instanced rendering with custom GLSL shaders",
      "Physically-inspired atmosphere and ring scattering",
      "Guided tours with cinematic camera choreography",
      "Zero-dependency build under 300 kB gzipped",
    ],
    technologies: ["threejs", "r3f", "typescript", "gsap", "vite"],
    liveUrl: "https://example.com/exoplanet-explorer",
    sourceUrl: "https://github.com/alexnova/exoplanet-explorer",
    color: "#9B6BFF",
    size: 1.25,
    orbitRadius: 12.5,
    orbitSpeed: 0.8,
    orbitInclination: -6,
    orbitPhase: 4.1,
    period: "2023",
  },
  {
    id: "pulse-collab",
    title: "Pulse Collab",
    description: "Multiplayer collaborative whiteboard with CRDT sync and presence.",
    longDescription:
      "Pulse Collab is a real-time whiteboard for distributed product teams. Documents are modelled as CRDTs so concurrent edits merge without conflicts, and presence indicators make remote workshops feel genuinely co-located.\n\nI built the sync engine and the interaction layer: conflict-free selection, offline-first queuing with replay on reconnect, and a canvas renderer that keeps 5k objects smooth across a 6-person session.",
    role: "Senior Full Stack Developer",
    features: [
      "CRDT-based conflict-free sync across concurrent editors",
      "Offline-first queue with deterministic replay on reconnect",
      "Live cursors and presence for up to 24 collaborators",
      "Canvas renderer sustaining 5k objects at 60fps",
      "Version history with branchable timeline scrubbing",
    ],
    technologies: ["react", "nodejs", "websockets", "redis", "docker", "kubernetes"],
    liveUrl: "https://example.com/pulse-collab",
    sourceUrl: "https://github.com/alexnova/pulse-collab",
    color: "#38D9A9",
    size: 0.9,
    orbitRadius: 15.5,
    orbitSpeed: 1.1,
    orbitInclination: 12,
    orbitPhase: 5.5,
    period: "2022 — 2023",
  },
  {
    id: "sagan-ai",
    title: "Sagan AI",
    description: "Retrieval-augmented knowledge assistant over 80k technical documents.",
    longDescription:
      "Sagan AI is an internal knowledge assistant that answers engineering questions with citations back to source documentation. Documents are chunked, embedded and stored in a vector index; answers are grounded through a retrieval pipeline with reranking before generation.\n\nI built the retrieval evaluation harness and the streaming answer interface. Grounded answer accuracy reached 91% on our internal benchmark, and it cut median time-to-answer for support tickets from 14 minutes to 40 seconds.",
    role: "Full Stack Developer",
    features: [
      "Hybrid vector + keyword retrieval with reranking",
      "Streaming answers with inline source citations",
      "Evaluation harness scoring 91% grounded accuracy",
      "Incremental indexer for 80k documents with change detection",
      "Cost guardrails with per-team token budgets",
    ],
    technologies: ["python", "openai", "postgres", "nextjs", "typescript", "aws"],
    liveUrl: "https://example.com/sagan-ai",
    sourceUrl: "https://github.com/alexnova/sagan-ai",
    color: "#FF6B9D",
    size: 0.8,
    orbitRadius: 18.5,
    orbitSpeed: 1.45,
    orbitInclination: -11,
    orbitPhase: 1.2,
    period: "2024",
  },
  {
    id: "helio-design-system",
    title: "Helio Design System",
    description: "Cross-platform component library adopted by 40+ engineers.",
    longDescription:
      "Helio is the design system behind four products and roughly 40 engineers. It ships 60+ accessible React components, a token pipeline that generates CSS variables and Figma styles from a single source, and codemods that migrate consumers automatically between majors.\n\nThe token pipeline was the leverage point: designers and engineers edit one JSON file and both the Figma library and the production CSS update from it. Adoption reached 92% across the org within two quarters.",
    role: "Design Systems Lead",
    features: [
      "60+ WCAG AA accessible React components",
      "Single-source design tokens generating CSS + Figma styles",
      "Automated codemods for zero-friction major upgrades",
      "Storybook documentation with live a11y audits",
      "92% adoption across four product teams",
    ],
    technologies: ["react", "typescript", "storybook", "figma", "tailwind", "jest"],
    liveUrl: "https://example.com/helio-design-system",
    sourceUrl: "https://github.com/alexnova/helio-design-system",
    color: "#FFD43B",
    size: 0.7,
    orbitRadius: 21.5,
    orbitSpeed: 1.85,
    orbitInclination: 6,
    orbitPhase: 3.3,
    period: "2022",
  },
];

/** Fast id → Project lookup. */
export const projectMap: Record<string, Project> = Object.fromEntries(
  projects.map((p) => [p.id, p])
);

export function getProject(id: string | null | undefined): Project | undefined {
  if (!id) return undefined;
  return projectMap[id];
}

/** Index of a project in the canonical ordering (used for keyboard nav). */
export function projectIndex(id: string | null | undefined) {
  if (!id) return -1;
  return projects.findIndex((p) => p.id === id);
}

export default projects;
