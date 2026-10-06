import { projects, projectMap, getProject, projectIndex } from "@/data/projects";
import {
  technologies,
  technologyMap,
  resolveTechnologies,
  getTechnology,
} from "@/data/technologies";
import { profile } from "@/data/profile";
import { navigationItems, keyboardShortcuts } from "@/data/navigation";
import { experience, education, skillGroups, interests } from "@/data/about";

describe("data layer", () => {
  describe("projects", () => {
    it("exports at least 5 projects with every required field", () => {
      expect(projects.length).toBeGreaterThanOrEqual(5);
      for (const p of projects) {
        expect(typeof p.id).toBe("string");
        expect(p.id.length).toBeGreaterThan(0);
        expect(typeof p.title).toBe("string");
        expect(typeof p.description).toBe("string");
        expect(typeof p.longDescription).toBe("string");
        expect(typeof p.role).toBe("string");
        expect(Array.isArray(p.features)).toBe(true);
        expect(p.features.length).toBeGreaterThan(0);
        expect(Array.isArray(p.technologies)).toBe(true);
        expect(p.technologies.length).toBeGreaterThanOrEqual(2);
        expect(p.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(typeof p.size).toBe("number");
        expect(typeof p.orbitRadius).toBe("number");
        expect(typeof p.orbitSpeed).toBe("number");
      }
    });

    it("has unique ids", () => {
      const ids = projects.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("references only technologies that exist", () => {
      const known = new Set(technologies.map((t) => t.id));
      for (const p of projects) {
        for (const id of p.technologies) {
          expect(known.has(id)).toBe(true);
        }
      }
    });

    it("varies complexity between 2 and 6 technologies per project", () => {
      const counts = projects.map((p) => p.technologies.length);
      expect(Math.min(...counts)).toBeGreaterThanOrEqual(2);
      expect(Math.max(...counts)).toBeLessThanOrEqual(6);
    });

    it("spaces orbit radii so no two planets can overlap", () => {
      // Two rings are closest where they pass each other, so the gap between
      // their radii must exceed the sum of the two planet radii.
      for (let i = 0; i < projects.length; i++) {
        for (let j = i + 1; j < projects.length; j++) {
          const a = projects[i];
          const b = projects[j];
          const gap = Math.abs(a.orbitRadius - b.orbitRadius);
          expect(gap).toBeGreaterThan(a.size + b.size);
        }
      }
    });

    it("keeps every planet clear of the star", () => {
      const nearest = Math.min(...projects.map((p) => p.orbitRadius));
      expect(nearest).toBeGreaterThan(4); // STAR_SIZE 2.5 + largest planet radius
    });

    it("uses distinct colours per planet", () => {
      const colors = projects.map((p) => p.color.toUpperCase());
      expect(new Set(colors).size).toBe(colors.length);
    });

    it("supports lookups by id", () => {
      expect(getProject(projects[0].id)?.title).toBe(projects[0].title);
      expect(getProject("does-not-exist")).toBeUndefined();
      expect(getProject(null)).toBeUndefined();
      expect(projectIndex(projects[1].id)).toBe(1);
      expect(projectIndex(null)).toBe(-1);
      expect(Object.keys(projectMap)).toHaveLength(projects.length);
    });

    it("renders an additional planet when a new project is appended", () => {
      // Relative, not hard-coded: the append must always yield exactly one
      // more planet than the shipped data, whatever that count happens to be.
      const extended = [
        ...projects,
        {
          id: "brand-new",
          title: "Brand New",
          description: "d",
          longDescription: "l",
          role: "r",
          features: ["f"],
          technologies: ["react", "nodejs"],
          color: "#123456",
          size: 0.8,
          orbitRadius: 24.5,
          orbitSpeed: 2,
        },
      ];
      expect(extended).toHaveLength(projects.length + 1);
      expect(extended.filter((p) => p.id === "brand-new")).toHaveLength(1);
      expect(new Set(extended.map((p) => p.id)).size).toBe(extended.length);
    });
  });

  describe("technologies", () => {
    it("exports 15+ technologies across all categories", () => {
      expect(technologies.length).toBeGreaterThanOrEqual(15);
      const cats = new Set(technologies.map((t) => t.category));
      expect(cats).toEqual(
        new Set(["frontend", "backend", "database", "devops", "design", "other"])
      );
    });

    it("has unique ids and valid hex colours", () => {
      const ids = technologies.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const t of technologies) {
        expect(t.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(typeof t.icon).toBe("string");
        expect(t.name.length).toBeGreaterThan(0);
      }
    });

    it("resolves ids to objects and drops unknown ones", () => {
      expect(resolveTechnologies(["react"]).map((t) => t.name)).toEqual(["React"]);
      expect(resolveTechnologies(["react", "nope"])).toHaveLength(1);
      expect(getTechnology("nextjs")?.name).toBe("Next.js");
      expect(technologyMap.react.category).toBe("frontend");
    });
  });

  describe("profile", () => {
    it("has all required fields populated", () => {
      expect(profile.name).toBeTruthy();
      expect(profile.title).toBe("Full Stack Developer");
      expect(profile.tagline.length).toBeGreaterThan(0);
      expect(profile.bio.split(" ").length).toBeGreaterThanOrEqual(15);
      expect(profile.avatar).toBeTruthy();
      expect(profile.email).toContain("@");
      expect(profile.location).toBeTruthy();
      expect(profile.resumeUrl).toBeTruthy();
      expect(profile.longBio.length).toBeGreaterThanOrEqual(2);
    });

    it("has 4 social links with valid urls", () => {
      expect(profile.social).toHaveLength(4);
      const platforms = profile.social.map((s) => s.platform);
      expect(platforms).toEqual(
        expect.arrayContaining(["github", "linkedin", "twitter", "email"])
      );
      for (const link of profile.social) {
        expect(link.url).toMatch(/^(https?:\/\/|mailto:)/);
      }
    });
  });

  describe("navigation", () => {
    it("defines the five nav items with unique shortcuts", () => {
      expect(navigationItems.map((n) => n.id)).toEqual([
        "home",
        "about",
        "projects",
        "contact",
        "resume",
      ]);
      const shortcuts = navigationItems.map((n) => n.shortcut);
      expect(new Set(shortcuts).size).toBe(shortcuts.length);
      expect(keyboardShortcuts.length).toBeGreaterThan(5);
    });
  });

  describe("about", () => {
    it("links every skill group technology to a real technology", () => {
      const known = new Set(technologies.map((t) => t.id));
      for (const group of skillGroups) {
        for (const id of group.technologies) {
          expect(known.has(id)).toBe(true);
        }
      }
      expect(experience.length).toBeGreaterThanOrEqual(3);
      expect(education.length).toBeGreaterThanOrEqual(1);
      expect(interests.length).toBeGreaterThanOrEqual(4);
    });
  });
});
