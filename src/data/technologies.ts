import type { Technology, TechnologyCategory } from "@/types";

/**
 * ── TECHNOLOGY DATA (SATELLITES) ──────────────────────────────
 * Every technology referenced from `projects.ts` must exist here by `id`.
 * Each entry becomes a satellite orbiting the planets that use it.
 * The `category` also determines the satellite's 3D geometry shape,
 * and `color` drives both the satellite material and the badges in the
 * project panel.
 */
export const technologies: Technology[] = [
  /* ── Frontend ───────────────────────────────────────────── */
  { id: "react", name: "React", icon: "⚛️", category: "frontend", color: "#61DAFB", proficiency: 96, docsUrl: "https://react.dev" },
  { id: "nextjs", name: "Next.js", icon: "▲", category: "frontend", color: "#FFFFFF", proficiency: 94, docsUrl: "https://nextjs.org/docs" },
  { id: "typescript", name: "TypeScript", icon: "🔷", category: "frontend", color: "#3178C6", proficiency: 95, docsUrl: "https://www.typescriptlang.org/docs" },
  { id: "threejs", name: "Three.js", icon: "🔺", category: "frontend", color: "#8AB4F8", proficiency: 88, docsUrl: "https://threejs.org/docs" },
  { id: "r3f", name: "React Three Fiber", icon: "🧊", category: "frontend", color: "#D4A5FF", proficiency: 90, docsUrl: "https://docs.pmnd.rs/react-three-fiber" },
  { id: "framer-motion", name: "Framer Motion", icon: "🎞️", category: "frontend", color: "#FF6FD8", proficiency: 92, docsUrl: "https://www.framer.com/motion" },
  { id: "tailwind", name: "Tailwind CSS", icon: "🎨", category: "frontend", color: "#38BDF8", proficiency: 95, docsUrl: "https://tailwindcss.com/docs" },
  { id: "vue", name: "Vue 3", icon: "💚", category: "frontend", color: "#42B883", proficiency: 82, docsUrl: "https://vuejs.org" },
  { id: "gsap", name: "GSAP", icon: "🌀", category: "frontend", color: "#88CE02", proficiency: 86, docsUrl: "https://gsap.com/docs" },
  { id: "vite", name: "Vite", icon: "⚡", category: "frontend", color: "#A78BFA", proficiency: 90, docsUrl: "https://vitejs.dev" },

  /* ── Backend ────────────────────────────────────────────── */
  { id: "nodejs", name: "Node.js", icon: "🟢", category: "backend", color: "#3C873A", proficiency: 93, docsUrl: "https://nodejs.org/docs" },
  { id: "python", name: "Python", icon: "🐍", category: "backend", color: "#3776AB", proficiency: 85, docsUrl: "https://docs.python.org/3" },
  { id: "graphql", name: "GraphQL", icon: "◈", category: "backend", color: "#E10098", proficiency: 87, docsUrl: "https://graphql.org/learn" },
  { id: "trpc", name: "tRPC", icon: "🔗", category: "backend", color: "#2596BE", proficiency: 84, docsUrl: "https://trpc.io/docs" },
  { id: "websockets", name: "WebSockets", icon: "📡", category: "backend", color: "#F6C445", proficiency: 88, docsUrl: "https://developer.mozilla.org/docs/Web/API/WebSockets_API" },
  { id: "go", name: "Go", icon: "🐹", category: "backend", color: "#00ADD8", proficiency: 74, docsUrl: "https://go.dev/doc" },

  /* ── Database ───────────────────────────────────────────── */
  { id: "postgres", name: "PostgreSQL", icon: "🐘", category: "database", color: "#4169E1", proficiency: 89, docsUrl: "https://www.postgresql.org/docs" },
  { id: "mongodb", name: "MongoDB", icon: "🍃", category: "database", color: "#47A248", proficiency: 86, docsUrl: "https://www.mongodb.com/docs" },
  { id: "redis", name: "Redis", icon: "🧱", category: "database", color: "#DC382D", proficiency: 82, docsUrl: "https://redis.io/docs" },
  { id: "prisma", name: "Prisma", icon: "◮", category: "database", color: "#5A67D8", proficiency: 88, docsUrl: "https://www.prisma.io/docs" },
  { id: "supabase", name: "Supabase", icon: "⚡", category: "database", color: "#3ECF8E", proficiency: 83, docsUrl: "https://supabase.com/docs" },

  /* ── DevOps ─────────────────────────────────────────────── */
  { id: "docker", name: "Docker", icon: "🐳", category: "devops", color: "#2496ED", proficiency: 87, docsUrl: "https://docs.docker.com" },
  { id: "aws", name: "AWS", icon: "☁️", category: "devops", color: "#FF9900", proficiency: 80, docsUrl: "https://docs.aws.amazon.com" },
  { id: "vercel", name: "Vercel", icon: "▲", category: "devops", color: "#B4B4B4", proficiency: 92, docsUrl: "https://vercel.com/docs" },
  { id: "github-actions", name: "GitHub Actions", icon: "🔁", category: "devops", color: "#2EA043", proficiency: 86, docsUrl: "https://docs.github.com/actions" },
  { id: "kubernetes", name: "Kubernetes", icon: "⎈", category: "devops", color: "#326CE5", proficiency: 72, docsUrl: "https://kubernetes.io/docs" },

  /* ── Design ─────────────────────────────────────────────── */
  { id: "figma", name: "Figma", icon: "🎛️", category: "design", color: "#F24E1E", proficiency: 88, docsUrl: "https://help.figma.com" },
  { id: "storybook", name: "Storybook", icon: "📖", category: "design", color: "#FF4785", proficiency: 85, docsUrl: "https://storybook.js.org/docs" },
  { id: "blender", name: "Blender", icon: "🧿", category: "design", color: "#EA7600", proficiency: 70, docsUrl: "https://docs.blender.org" },
  { id: "framer", name: "Framer", icon: "🖼️", category: "design", color: "#0099FF", proficiency: 78, docsUrl: "https://www.framer.com/learn" },

  /* ── Other ──────────────────────────────────────────────── */
  { id: "playwright", name: "Playwright", icon: "🎭", category: "other", color: "#45BA4B", proficiency: 89, docsUrl: "https://playwright.dev/docs" },
  { id: "jest", name: "Jest", icon: "🃏", category: "other", color: "#C21325", proficiency: 88, docsUrl: "https://jestjs.io/docs" },
  { id: "openai", name: "OpenAI API", icon: "🧠", category: "other", color: "#74AA9C", proficiency: 84, docsUrl: "https://platform.openai.com/docs" },
  { id: "stripe", name: "Stripe", icon: "💳", category: "other", color: "#635BFF", proficiency: 85, docsUrl: "https://stripe.com/docs" },
  { id: "howler", name: "Howler.js", icon: "🔊", category: "other", color: "#FFA000", proficiency: 76, docsUrl: "https://howlerjs.com" },
];

/** Fast id → Technology lookup used by planets, satellites and badges. */
export const technologyMap: Record<string, Technology> = Object.fromEntries(
  technologies.map((t) => [t.id, t])
);

/** Look up a technology, returning `undefined` for unknown ids. */
export function getTechnology(id: string): Technology | undefined {
  return technologyMap[id];
}

/** Resolve a list of technology ids into full objects (unknown ids dropped). */
export function resolveTechnologies(ids: string[]): Technology[] {
  return ids.map((id) => technologyMap[id]).filter(Boolean) as Technology[];
}

export const categories: Record<TechnologyCategory, { label: string; icon: string }> = {
  frontend: { label: "Frontend", icon: "🖥️" },
  backend: { label: "Backend", icon: "⚙️" },
  database: { label: "Database", icon: "🗄️" },
  devops: { label: "DevOps", icon: "🚀" },
  design: { label: "Design", icon: "🎨" },
  other: { label: "Other", icon: "✨" },
};

export default technologies;
