import type { EducationItem, ExperienceItem, SkillGroup } from "@/types";

/**
 * ── ABOUT DATA ────────────────────────────────────────────────
 * Powers the About overlay: experience timeline, education and skill
 * constellations. `SkillGroup.technologies` references ids from
 * `src/data/technologies.ts`.
 */

export const experience: ExperienceItem[] = [
  {
    company: "Lumen Labs",
    role: "Lead Full Stack Engineer",
    period: "2023 — Present",
    location: "Remote · Mumbai",
    highlights: [
      "Lead a team of six engineers across the analytics and platform squads.",
      "Rebuilt the ingestion pipeline to 2M+ events/day with p99 latency under 200ms.",
      "Introduced the design system now used by four product teams.",
    ],
  },
  {
    company: "Orbit Commerce",
    role: "Front-End Architect",
    period: "2021 — 2023",
    location: "Bengaluru, India",
    highlights: [
      "Owned front-end architecture for a multi-tenant headless storefront platform.",
      "Cut TTFB to under 120ms and lifted checkout conversion by 18%.",
      "Established the Playwright E2E practice across three product lines.",
    ],
  },
  {
    company: "Northstar Studio",
    role: "Senior Creative Developer",
    period: "2019 — 2021",
    location: "Pune, India",
    highlights: [
      "Built award-nominated WebGL experiences for global brand campaigns.",
      "Shipped GPU-instanced renderers handling thousands of bodies at 60fps.",
      "Mentored junior developers in shader authoring and motion design.",
    ],
  },
  {
    company: "Freelance",
    role: "Full Stack Developer",
    period: "2017 — 2019",
    location: "Mumbai, India",
    highlights: [
      "Delivered 20+ client projects spanning commerce, fintech and media.",
      "Specialised in React front-ends backed by Node and PostgreSQL.",
    ],
  },
];

export const education: EducationItem[] = [
  {
    institution: "Indian Institute of Technology, Bombay",
    degree: "B.Tech, Computer Science & Engineering",
    period: "2013 — 2017",
    detail: "Graduated with honours. Thesis on real-time rendering techniques for the web.",
  },
  {
    institution: "Interaction Design Foundation",
    degree: "Certificate, UX & Interaction Design",
    period: "2018",
    detail: "Focus on accessibility, motion design and information architecture.",
  },
];

export const skillGroups: SkillGroup[] = [
  {
    label: "Frontend",
    icon: "🖥️",
    technologies: ["react", "nextjs", "typescript", "threejs", "r3f", "framer-motion", "tailwind"],
  },
  {
    label: "Backend",
    icon: "⚙️",
    technologies: ["nodejs", "python", "graphql", "trpc", "websockets"],
  },
  {
    label: "Data",
    icon: "🗄️",
    technologies: ["postgres", "mongodb", "redis", "prisma", "supabase"],
  },
  {
    label: "Platform",
    icon: "🚀",
    technologies: ["docker", "aws", "vercel", "github-actions", "kubernetes"],
  },
  {
    label: "Craft",
    icon: "🎨",
    technologies: ["figma", "storybook", "framer", "blender"],
  },
];

export const interests = [
  { icon: "🔭", label: "Amateur astronomy" },
  { icon: "🎧", label: "Modular synths" },
  { icon: "📚", label: "Sci-fi & design writing" },
  { icon: "🏃", label: "Half-marathon running" },
  { icon: "♟️", label: "Competitive chess" },
  { icon: "✈️", label: "Slow travel" },
];

const about = { experience, education, skillGroups, interests };

export default about;
