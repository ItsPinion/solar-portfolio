import type { NavItem } from "@/types";

/**
 * ── NAVIGATION ────────────────────────────────────────────────
 * Drives both the desktop side rail and the mobile bottom bar, plus the
 * keyboard shortcut map (`shortcut` is matched case-insensitively).
 */
export const navigationItems: NavItem[] = [
  { id: "home", label: "Home", icon: "home", shortcut: "H" },
  { id: "about", label: "About Me", icon: "user", shortcut: "A" },
  { id: "projects", label: "Projects", icon: "planet", shortcut: "P" },
  { id: "contact", label: "Contact", icon: "signal", shortcut: "C" },
  { id: "resume", label: "Resume", icon: "file", shortcut: "R" },
];

/** Keyboard shortcuts surfaced in the `?` shortcuts modal. */
export const keyboardShortcuts: {
  keys: string[];
  label: string;
  group: "navigation" | "interface";
}[] = [
  { keys: ["H"], label: "Go home — reset to overview", group: "navigation" },
  { keys: ["←", "→"], label: "Cycle between planets", group: "navigation" },
  { keys: ["Enter"], label: "Open the focused planet", group: "navigation" },
  { keys: ["1", "…", "9"], label: "Jump directly to a planet", group: "navigation" },
  { keys: ["P"], label: "Toggle the profile card", group: "interface" },
  { keys: ["Esc"], label: "Close panel / step back", group: "interface" },
  { keys: ["?"], label: "Show this shortcuts panel", group: "interface" },
  { keys: ["M"], label: "Toggle ambient sound", group: "interface" },
  { keys: ["Tab"], label: "Move focus through interactive elements", group: "interface" },
];

export default navigationItems;
