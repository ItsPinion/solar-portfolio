/**
 * Phase 0 scaffold verification page.
 * Replaced in Phase 2 by the full Solar System experience.
 */
export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-nebula-gradient p-8">
      <div className="anim-float flex items-center gap-3">
        <span className="relative flex h-10 w-10 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-star-gradient blur-md" />
          <span className="relative h-6 w-6 rounded-full bg-star-gold shadow-glow" />
        </span>
        <h1 className="font-display text-fluid-2xl font-semibold tracking-tight text-star-white">
          Solar Portfolio
        </h1>
      </div>

      <p className="font-mono text-fluid-sm text-star-gold/80">
        Loading<span className="anim-blink">…</span>
      </p>

      {/* Phase 0 Tailwind smoke test: colours, fonts, animation, glass */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {[
          ["cosmic-black", "bg-cosmic-black"],
          ["nebula-purple", "bg-nebula-purple"],
          ["nebula-blue", "bg-nebula-blue"],
          ["planet-blue", "bg-planet-blue"],
          ["star-gold", "bg-star-gold"],
          ["deep-space", "bg-deep-space"],
        ].map(([name, cls]) => (
          <div
            key={name}
            className={`${cls} flex h-16 w-24 items-center justify-center rounded-lg border border-white/10 font-mono text-[10px] text-white/70`}
          >
            {name}
          </div>
        ))}
      </div>

      <div className="glass mt-2 rounded-xl px-5 py-3 font-mono text-fluid-xs text-white/70 shadow-glass">
        Phase 0 · scaffold &amp; configuration verified
      </div>
    </main>
  );
}
