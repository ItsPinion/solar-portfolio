"use client";

import { useEffect } from "react";
import { usePortfolioStore } from "@/stores/usePortfolioStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { projects as projectData } from "@/data/projects";
import { navigationItems } from "@/data/navigation";
import { profile } from "@/data/profile";

/** True when the event originated from a text field or rich widget. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox" ||
    target.getAttribute("role") === "switch" ||
    target.getAttribute("role") === "slider"
  );
}

/**
 * ── KEYBOARD NAVIGATION (Phase 7) ─────────────────────────────
 *  H / Home ...... reset to overview
 *  ← → ........... cycle planets
 *  Enter ......... open the current (selected or hovered) planet
 *  1–9 ........... jump straight to a planet
 *  P ............. toggle profile card
 *  A / C / R ..... about / contact / resume
 *  M ............. toggle ambient sound
 *  ? ............. shortcuts modal
 *  Esc ........... close panel → deselect planet → overview
 */
export function useKeyboardNav() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      const store = usePortfolioStore.getState();
      const settings = useSettingsStore.getState();
      const key = event.key;

      // Never hijack browser/OS combinations.
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (key) {
        case "Escape": {
          event.preventDefault();
          if (store.helpOpen) return store.setHelpOpen(false);
          if (store.openPanel) return store.closePanelById();
          if (store.selectedPlanet) return store.selectPlanet(null);
          return store.resetView();
        }

        case "ArrowRight": {
          event.preventDefault();
          store.stepPlanet(1);
          return;
        }

        case "ArrowLeft": {
          event.preventDefault();
          store.stepPlanet(-1);
          return;
        }

        case "ArrowUp":
        case "ArrowDown": {
          // Arrow keys keep their native scrolling behaviour elsewhere; on the
          // canvas they act like the horizontal cycle for accessibility parity.
          if (store.selectedPlanet || store.hoveredPlanet) {
            event.preventDefault();
            store.stepPlanet(key === "ArrowDown" ? 1 : -1);
          }
          return;
        }

        case "Enter": {
          const id = store.hoveredPlanet ?? store.selectedPlanet;
          if (!id) return;
          event.preventDefault();
          if (store.selectedPlanet === id && store.openPanel === null) {
            // Enter on an already-selected planet closes it (toggle).
            store.selectPlanet(null);
          } else {
            store.selectPlanet(id);
          }
          return;
        }

        case "?": {
          event.preventDefault();
          store.setHelpOpen(!store.helpOpen);
          return;
        }

        case "/": {
          // Convenience alias for the shortcuts modal.
          event.preventDefault();
          store.setHelpOpen(true);
          return;
        }

        default:
          break;
      }

      // ── number keys: jump to planet by index ────────────────
      if (/^[1-9]$/.test(key)) {
        const index = Number(key) - 1;
        if (index < projectData.length) {
          event.preventDefault();
          store.jumpToPlanetIndex(index);
        }
        return;
      }

      // ── single-letter shortcuts ─────────────────────────────
      const letter = key.toUpperCase();

      if (letter === "H") {
        event.preventDefault();
        store.resetView();
        return;
      }

      if (letter === "M") {
        event.preventDefault();
        settings.toggleSound();
        return;
      }

      const navItem = navigationItems.find((item) => item.shortcut === letter);
      if (!navItem) return;

      event.preventDefault();
      switch (navItem.id) {
        case "home":
          store.resetView();
          break;
        case "about":
          store.openPanelById(store.openPanel === "about" ? null : "about");
          break;
        case "projects":
          store.openPanelById(null);
          store.setActiveSection("projects");
          store.focusCamera(null, 45);
          break;
        case "contact":
          store.openPanelById(store.openPanel === "contact" ? null : "contact");
          break;
        case "resume":
          // Resolved from data so the shortcut never hard-codes a URL.
          window.open(profile.resumeUrl, "_blank", "noopener,noreferrer");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export default useKeyboardNav;
