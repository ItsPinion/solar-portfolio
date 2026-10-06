#!/usr/bin/env node
/**
 * Data-driven architecture verification (Appendix A).
 *
 * Temporarily appends a project to `src/data/projects.ts` (and optionally a
 * technology), asserts the new objects flow through the data layer, then
 * restores the original file. Run after any change to the data layer:
 *
 *   node scripts/verify-data-driven.mjs
 */
import { readFile, writeFile, copyFile, unlink } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROJECTS = path.join(ROOT, "src/data/projects.ts");
const TECHNOLOGIES = path.join(ROOT, "src/data/technologies.ts");
const BACKUP = "/tmp/solar-verify-backup";

const SEVENTH_PROJECT = `
  {
    id: "verification-planet-7",
    title: "Verification Planet VII",
    description: "Temporary planet appended by scripts/verify-data-driven.mjs.",
    longDescription: "Verification entry.",
    role: "Verifier",
    features: ["Proves data-driven planet creation", "Compiles with zero code changes"],
    technologies: ["react", "nodejs", "docker", "verification-tech"],
    color: "#7CE8FF",
    size: 0.85,
    orbitRadius: 24.5,
    orbitSpeed: 2.1,
    orbitInclination: 8,
    orbitPhase: 0.9,
    period: "2026",
  },`;

const EXTRA_TECH = `
  { id: "verification-tech", name: "Verification Tech", icon: "🧪", category: "other", color: "#7CE8FF", proficiency: 100 },`;

function appendBeforeArrayClose(source, marker, entry) {
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`marker not found: ${marker}`);
  const end = source.indexOf("\n];", start);
  if (end === -1) throw new Error(`array close not found after ${marker}`);
  return source.slice(0, end) + entry + source.slice(end);
}

/** Parse the data files with a lightweight regex — sufficient for these shapes. */
function inspectProjectSource(source) {
  const ids = [...source.matchAll(/^\s{4}id: "([^"]+)"/gm)].map((m) => m[1]);
  const radii = [...source.matchAll(/^\s{4}orbitRadius: ([\d.]+)/gm)].map((m) => Number(m[1]));
  const sizes = [...source.matchAll(/^\s{4}size: ([\d.]+)/gm)].map((m) => Number(m[1]));
  return { ids, radii, sizes };
}

/**
 * No two orbits may intersect. Two rings are closest where they pass each
 * other, so the gap between their radii must exceed the sum of the planet
 * radii — this is the real "no planet overlaps another" criterion.
 */
function worstOrbitPair(radii, sizes) {
  let worst = { gap: Infinity, needed: 0, pair: [null, null] };
  for (let i = 0; i < radii.length; i++) {
    for (let j = i + 1; j < radii.length; j++) {
      const gap = Math.abs(radii[i] - radii[j]);
      const needed = (sizes[i] ?? 0) + (sizes[j] ?? 0);
      // Report the pair closest to intersecting (smallest slack).
      if (gap - needed < worst.gap - worst.needed) {
        worst = { gap, needed, pair: [i, j] };
      }
    }
  }
  return worst;
}

const results = [];
const check = (label, pass, detail = "") => {
  results.push({ label, pass, detail });
  console.log(`${pass ? "  ✓" : "  ✗"} ${label}${detail ? ` — ${detail}` : ""}`);
};

async function main() {
  await copyFile(PROJECTS, `${BACKUP}-projects.ts`);
  await copyFile(TECHNOLOGIES, `${BACKUP}-technologies.ts`);

  try {
    const projectsSrc = await readFile(PROJECTS, "utf8");
    const techSrc = await readFile(TECHNOLOGIES, "utf8");

    const withProject = appendBeforeArrayClose(
      projectsSrc,
      "export const projects: Project[] = [",
      SEVENTH_PROJECT
    );
    const withTech = appendBeforeArrayClose(
      techSrc,
      "export const technologies: Technology[] = [",
      EXTRA_TECH
    );

    await writeFile(PROJECTS, withProject);
    await writeFile(TECHNOLOGIES, withTech, "utf8");

    console.log("appended 1 project + 1 technology — inspecting data layer");

    const { ids, radii, sizes } = inspectProjectSource(withProject);
    check("7 projects present in source", ids.length === 7, ids.length.toString());
    check(
      "new project id is unique",
      new Set(ids).size === ids.length,
      ids.filter((id, i) => ids.indexOf(id) !== i).join(",") || "none"
    );

    const worst = worstOrbitPair(radii, sizes);
    check(
      "no two orbits intersect",
      worst.gap > worst.needed,
      `tightest pair: gap ${worst.gap} vs required ${worst.needed}`
    );

    const starClear = Math.min(...radii) - (sizes[radii.indexOf(Math.min(...radii))] ?? 0);
    check("innermost planet clears the star", starClear > 2.5, `clearance ${starClear}`);

    // Attribute-order check: the appended project carries the new technology id
    // and no other project gained it.
    const newTechUses = (withProject.match(/"verification-tech"/g) ?? []).length;
    check("new technology referenced exactly once", newTechUses === 1, `${newTechUses} refs`);

    // The real proof: the data modules must compile and resolve at runtime.
    const gradable = process.env.SKIP_TSC !== "1";
    if (gradable) {
      const { execSync } = await import("node:child_process");
      try {
        execSync("npx tsc --noEmit", { cwd: ROOT, stdio: "pipe" });
        check("TypeScript compiles with the extra entries", true);
      } catch (err) {
        check(
          "TypeScript compiles with the extra entries",
          false,
          String(err.stdout || err.stderr || err).slice(0, 600)
        );
      }
      try {
        execSync("npx jest tests/unit/data.test.ts --silent", { cwd: ROOT, stdio: "pipe" });
        check("data unit tests pass against extended data", true);
      } catch (err) {
        check(
          "data unit tests pass against extended data",
          false,
          String(err.stdout || err.stderr || err).slice(0, 600)
        );
      }
    }
  } finally {
    await copyFile(`${BACKUP}-projects.ts`, PROJECTS);
    await copyFile(`${BACKUP}-technologies.ts`, TECHNOLOGIES);
    await unlink(`${BACKUP}-projects.ts`).catch(() => {});
    await unlink(`${BACKUP}-technologies.ts`).catch(() => {});
    const restored = inspectProjectSource(await readFile(PROJECTS, "utf8"));
    console.log(`restored: ${restored.ids.length} projects`);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    failed.length ? `\n✗ ${failed.length} check(s) failed` : "\n✓ data-driven architecture verified"
  );
  process.exitCode = failed.length ? 1 : 0;
}

main();
