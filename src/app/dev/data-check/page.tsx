"use client";

/**
 * Phase 1 verification page (temporary).
 * Renders every data file as plain text and exercises every store action so
 * the data layer can be eyeballed in a browser. Reachable at /dev/data-check.
 */
import { useState } from "react";
import { projects } from "@/data/projects";
import { technologies, categories, resolveTechnologies } from "@/data/technologies";
import { profile } from "@/data/profile";
import { navigationItems } from "@/data/navigation";
import { experience, education, skillGroups, interests } from "@/data/about";
import { usePortfolioStore } from "@/stores/usePortfolioStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { orbitalPositionAt } from "@/hooks/useOrbitalMotion";
import { useResponsive } from "@/hooks/useResponsive";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CAMERA_DEFAULT_POSITION, QUALITY_PRESETS } from "@/lib/constants";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass scroll-area rounded-xl p-5">
      <h2 className="mb-3 font-display text-fluid-lg text-star-gold">{title}</h2>
      <div className="space-y-2 font-mono text-[12px] leading-relaxed text-white/75">
        {children}
      </div>
    </section>
  );
}

export default function DataCheckPage() {
  const responsive = useResponsive();
  const reducedMotion = useReducedMotion();
  const [orbitSample] = useState(() =>
    orbitalPositionAt(12.3, { radius: 9.5, speed: 0.55, inclination: 9, phase: 2.4 })
  );

  const portfolio = usePortfolioStore();
  const settings = useSettingsStore();

  const orbitPositions = projects.map((p, i) =>
    orbitalPositionAt(0, {
      radius: p.orbitRadius,
      speed: p.orbitSpeed,
      inclination: p.orbitInclination ?? 0,
      phase: p.orbitPhase ?? (i / projects.length) * Math.PI * 2,
    })
  );

  // Orbit spacing sanity check — no two radii closer than the largest planet.
  const sortedRadii = [...projects.map((p) => p.orbitRadius)].sort((a, b) => a - b);
  const minGap = Math.min(
    ...sortedRadii.slice(1).map((r, i) => r - sortedRadii[i])
  );
  const maxSize = Math.max(...projects.map((p) => p.size));
  const hasOverlap = minGap <= maxSize * 1.6;

  return (
    <main className="min-h-screen space-y-4 bg-nebula-gradient p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-fluid-2xl">Phase 1 · Data Layer Check</h1>
        <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] text-white/60">
          {projects.length} projects · {technologies.length} technologies ·{" "}
          {profile.social.length} social links
        </span>
      </header>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Section title="Profile">
          <pre className="whitespace-pre-wrap">
            {`name: ${profile.name}
title: ${profile.title}
tagline: ${profile.tagline}
email: ${profile.email}
location: ${profile.location}
avatar: ${profile.avatar}
resume: ${profile.resumeUrl}
social: ${profile.social.map((s) => s.platform).join(", ")}
bio words: ${profile.bio.split(" ").length}
longBio paragraphs: ${profile.longBio.length}`}
          </pre>
        </Section>

        <Section title="Projects (planets)">
          <ul className="space-y-1">
            {projects.map((p, i) => (
              <li key={p.id}>
                <span style={{ color: p.color }}>●</span> {p.title} — size {p.size} · r{" "}
                {p.orbitRadius} · v {p.orbitSpeed} · inc {p.orbitInclination ?? 0}° ·{" "}
                {p.technologies.length} techs · {p.features.length} features
                <div className="pl-4 text-white/45">
                  pos@t0 ≈ ({orbitPositions[i].x.toFixed(1)}, {orbitPositions[i].y.toFixed(1)},{" "}
                  {orbitPositions[i].z.toFixed(1)})
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Technologies (satellites)">
          <div className="flex flex-wrap gap-1">
            {technologies.map((t) => (
              <span
                key={t.id}
                className="rounded border border-white/10 px-1.5 py-0.5"
                style={{ color: t.color }}
              >
                {t.icon} {t.name}
              </span>
            ))}
          </div>
          <div className="pt-2 text-white/50">
            categories:{" "}
            {Object.entries(categories)
              .map(([k, v]) => `${v.label}:${technologies.filter((t) => t.category === k).length}`)
              .join("  ")}
          </div>
        </Section>

        <Section title="Orbit integrity">
          <pre className="whitespace-pre-wrap">
            {`radii sorted: [${sortedRadii.join(", ")}]
min gap between orbits: ${minGap}
largest planet diameter: ${(maxSize * 2).toFixed(2)}
overlap risk: ${hasOverlap ? "⚠ YES" : "✓ none"}
unknown tech ids: ${projects
              .flatMap((p) => p.technologies)
              .filter((id) => !technologies.some((t) => t.id === id)).length}`}
          </pre>
          <div className="text-white/50">
            resolved sample: {resolveTechnologies(projects[0].technologies).map((t) => t.name).join(" · ")}
          </div>
        </Section>

        <Section title="Zustand · portfolio store">
          <pre className="whitespace-pre-wrap">
            {`selectedPlanet: ${portfolio.selectedPlanet}
hoveredPlanet: ${portfolio.hoveredPlanet}
activeSection: ${portfolio.activeSection}
openPanel: ${portfolio.openPanel}
cameraFocus: ${portfolio.cameraFocus ? `[${portfolio.cameraFocus.join(", ")}]` : "null (track live)"}
cameraFocusDistance: ${portfolio.cameraFocusDistance}
default camera: [${CAMERA_DEFAULT_POSITION.join(", ")}]
isLoaded: ${portfolio.isLoaded} · progress: ${portfolio.loadingProgress}
standardized test: ${JSON.stringify(orbitSample)}`}
          </pre>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              className="glass rounded px-2 py-1 hover:border-star-gold/60"
              onClick={() => portfolio.selectPlanet(projects[0].id)}
            >
              select planet 0
            </button>
            <button
              className="glass rounded px-2 py-1 hover:border-star-gold/60"
              onClick={() => portfolio.stepPlanet(1)}
            >
              step +
            </button>
            <button
              className="glass rounded px-2 py-1 hover:border-star-gold/60"
              onClick={() => portfolio.jumpToPlanetIndex(2)}
            >
              jump #3
            </button>
            <button
              className="glass rounded px-2 py-1 hover:border-star-gold/60"
              onClick={() => portfolio.toggleProfile()}
            >
              toggle profile
            </button>
            <button
              className="glass rounded px-2 py-1 hover:border-star-gold/60"
              onClick={() => portfolio.resetView()}
            >
              reset view
            </button>
          </div>
        </Section>

        <Section title="Zustand · settings store">
          <pre className="whitespace-pre-wrap">
            {`reducedMotion: ${settings.reducedMotion} (hook: ${reducedMotion})
soundEnabled: ${settings.soundEnabled}
showOrbits: ${settings.showOrbits}
showLabels: ${settings.showLabels}
quality: ${settings.quality}
viewMode: ${settings.viewMode}
highContrast: ${settings.highContrast} · textScale: ${settings.textScale}`}
          </pre>
          <div className="flex flex-wrap gap-2 pt-2">
            <button className="glass rounded px-2 py-1" onClick={settings.toggleReducedMotion}>
              toggle reduced motion
            </button>
            <button className="glass rounded px-2 py-1" onClick={settings.toggleOrbits}>
              toggle orbits
            </button>
            <button className="glass rounded px-2 py-1" onClick={settings.toggleLabels}>
              toggle labels
            </button>
            <button className="glass rounded px-2 py-1" onClick={() => settings.setQuality("low")}>
              quality low
            </button>
            <button className="glass rounded px-2 py-1" onClick={() => settings.setQuality("high")}>
              quality high
            </button>
          </div>
        </Section>

        <Section title="Hooks">
          <pre className="whitespace-pre-wrap">
            {`useResponsive → ${responsive.width}×${responsive.height}
  breakpoint: ${responsive.breakpoint}
  isMobile: ${responsive.isMobile} · isTablet: ${responsive.isTablet} · isDesktop: ${responsive.isDesktop}
  orientation: ${responsive.orientation} · hasTouch: ${responsive.hasTouch}
  prefer2D: ${responsive.prefer2D} · isPending: ${responsive.isPending}
useReducedMotion → ${typeof reducedMotion} (${reducedMotion})
quality presets: ${Object.entries(QUALITY_PRESETS)
              .map(([k, v]) => `${k}:${v.stars}stars/${v.sphereSegments}seg`)
              .join("  ")}`}
          </pre>
        </Section>

        <Section title="Navigation">
          <ul>
            {navigationItems.map((n) => (
              <li key={n.id}>
                [{n.shortcut}] {n.icon} {n.label} → #{n.id}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="About data">
          <pre className="whitespace-pre-wrap">
            {`experience: ${experience.length} roles
  ${experience.map((e) => `${e.role} @ ${e.company}`).join("\n  ")}
education: ${education.length} entries
skill groups: ${skillGroups.length} (${skillGroups.map((g) => g.technologies.length).join("+")} techs)
interests: ${interests.length}`}
          </pre>
        </Section>
      </div>
    </main>
  );
}
