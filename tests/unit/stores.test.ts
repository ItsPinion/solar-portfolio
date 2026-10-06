import { usePortfolioStore } from "@/stores/usePortfolioStore";
import { useSettingsStore, DEFAULT_SETTINGS } from "@/stores/useSettingsStore";
import { projects } from "@/data/projects";

const p = () => usePortfolioStore.getState();
const s = () => useSettingsStore.getState();

/** Hard reset to the documented initial state for each test. */
beforeEach(() => {
  usePortfolioStore.setState({
    selectedPlanet: null,
    hoveredPlanet: null,
    activeSection: "home",
    highlightedTechnology: null,
    cameraFocus: [0, 0, 0],
    cameraFocusDistance: 45,
    isTransitioning: false,
    openPanel: null,
    isLoaded: false,
    loadingProgress: 0,
    hasEntered: false,
    helpOpen: false,
  });
  s().resetSettings();
});

describe("usePortfolioStore", () => {
  it("initialises with the documented defaults", () => {
    const state = p();
    expect(state.selectedPlanet).toBeNull();
    expect(state.hoveredPlanet).toBeNull();
    expect(state.activeSection).toBe("home");
    expect(state.openPanel).toBeNull();
    expect(state.isLoaded).toBe(false);
    expect(state.loadingProgress).toBe(0);
    expect(state.isTransitioning).toBe(false);
    expect(state.highlightedTechnology).toBeNull();
    expect(state.cameraFocus).toEqual([0, 0, 0]);
  });

  it("selects and clears a planet", () => {
    p().selectPlanet(projects[0].id);
    expect(p().selectedPlanet).toBe(projects[0].id);
    expect(p().activeSection).toBe("projects");
    expect(p().isTransitioning).toBe(true);

    p().selectPlanet(null);
    expect(p().selectedPlanet).toBeNull();
    expect(p().activeSection).toBe("home");
  });

  it("tracks hover independently of selection", () => {
    p().hoverPlanet(projects[2].id);
    expect(p().hoveredPlanet).toBe(projects[2].id);
    expect(p().selectedPlanet).toBeNull();
    p().hoverPlanet(null);
    expect(p().hoveredPlanet).toBeNull();
  });

  it("opens and closes panels, keeping planet and overlay exclusive", () => {
    p().selectPlanet(projects[1].id);
    p().openPanelById("contact");
    expect(p().openPanel).toBe("contact");
    // Opening an overlay clears the planet selection so camera intents don't fight.
    expect(p().selectedPlanet).toBeNull();

    p().closePanelById();
    expect(p().openPanel).toBeNull();
  });

  it("toggles the profile card", () => {
    p().toggleProfile();
    expect(p().openPanel).toBe("profile");
    p().toggleProfile();
    expect(p().openPanel).toBeNull();
  });

  it("clamps loading progress to [0, 1] and never goes backwards", () => {
    p().setLoadingProgress(0.5);
    expect(p().loadingProgress).toBe(0.5);
    p().setLoadingProgress(0.2);
    expect(p().loadingProgress).toBe(0.5);
    p().setLoadingProgress(1.8);
    expect(p().loadingProgress).toBe(1);
  });

  it("cycles planets with stepPlanet and wraps around", () => {
    p().stepPlanet(1);
    expect(p().selectedPlanet).toBe(projects[0].id);
    p().stepPlanet(1);
    expect(p().selectedPlanet).toBe(projects[1].id);
    p().stepPlanet(-1);
    expect(p().selectedPlanet).toBe(projects[0].id);
    p().stepPlanet(-1);
    expect(p().selectedPlanet).toBe(projects[projects.length - 1].id);
  });

  it("jumps to a planet by index and ignores out-of-range indexes", () => {
    p().jumpToPlanetIndex(3);
    expect(p().selectedPlanet).toBe(projects[3].id);
    p().jumpToPlanetIndex(99);
    expect(p().selectedPlanet).toBe(projects[3].id);
    p().jumpToPlanetIndex(-1);
    expect(p().selectedPlanet).toBe(projects[3].id);
  });

  it("moves the camera focus and stores the distance", () => {
    p().focusCamera([4, 2, 6], 9);
    expect(p().cameraFocus).toEqual([4, 2, 6]);
    expect(p().cameraFocusDistance).toBe(9);
    p().focusCamera(null);
    expect(p().cameraFocus).toEqual([0, 0, 0]);
    expect(p().cameraFocusDistance).toBe(45);
  });

  it("exposes highlighted technology for 2D → 3D links", () => {
    p().setHighlightedTechnology("react");
    expect(p().highlightedTechnology).toBe("react");
    p().setHighlightedTechnology(null);
    expect(p().highlightedTechnology).toBeNull();
  });

  it("resetView restores the overview", () => {
    p().selectPlanet(projects[0].id);
    p().hoverPlanet(projects[0].id);
    p().openPanelById("about");
    p().setHighlightedTechnology("react");
    p().resetView();
    expect(p().selectedPlanet).toBeNull();
    expect(p().hoveredPlanet).toBeNull();
    expect(p().openPanel).toBeNull();
    expect(p().activeSection).toBe("home");
    expect(p().highlightedTechnology).toBeNull();
    expect(p().cameraFocus).toEqual([0, 0, 0]);
  });
});

describe("useSettingsStore", () => {
  it("initialises with the documented defaults", () => {
    expect(s().reducedMotion).toBe(DEFAULT_SETTINGS.reducedMotion);
    expect(s().soundEnabled).toBe(false);
    expect(s().showOrbits).toBe(true);
    expect(s().showLabels).toBe(true);
    expect(s().quality).toBe("high");
    expect(s().viewMode).toBe("3d");
    expect(s().textScale).toBe(1);
  });

  it("toggles every boolean setting", () => {
    s().toggleReducedMotion();
    expect(s().reducedMotion).toBe(true);
    expect(s().userTouchedMotion).toBe(true);

    s().toggleSound();
    expect(s().soundEnabled).toBe(true);

    s().toggleOrbits();
    expect(s().showOrbits).toBe(false);

    s().toggleLabels();
    expect(s().showLabels).toBe(false);
  });

  it("sets quality and view mode", () => {
    s().setQuality("low");
    expect(s().quality).toBe("low");
    s().setViewMode("2d");
    expect(s().viewMode).toBe("2d");
  });

  it("distinguishes an explicit quality choice from an automatic one", () => {
    // Explicit choice: locks the tier against auto-detection.
    s().setQuality("low");
    expect(s().qualityTouched).toBe(true);

    s().resetSettings();
    expect(s().qualityTouched).toBe(false);

    // System/adaptive change: must NOT count as a user preference, otherwise
    // the device probe would freeze the tier forever.
    s().setQuality("low", { system: true });
    expect(s().quality).toBe("low");
    expect(s().qualityTouched).toBe(false);
  });

  it("keeps the persisted shape stable for localStorage round-trips", () => {
    s().setQuality("medium");
    s().setReducedMotion(true);
    s().setHighContrast(true);
    s().setTextScale(1.2);
    const persisted = {
      reducedMotion: s().reducedMotion,
      showOrbits: s().showOrbits,
      showLabels: s().showLabels,
      quality: s().quality,
      highContrast: s().highContrast,
      textScale: s().textScale,
      userTouchedMotion: s().userTouchedMotion,
      qualityTouched: s().qualityTouched,
    };
    expect(JSON.parse(JSON.stringify(persisted))).toEqual({
      reducedMotion: true,
      showOrbits: true,
      showLabels: true,
      quality: "medium",
      highContrast: true,
      textScale: 1.2,
      userTouchedMotion: true,
      qualityTouched: true,
    });
  });

  it("clamps the accessibility text scale", () => {
    s().setTextScale(3);
    expect(s().textScale).toBe(1.4);
    s().setTextScale(0.1);
    expect(s().textScale).toBe(0.85);
    s().setTextScale(1.2);
    expect(s().textScale).toBe(1.2);
  });

  it("syncs from the system only until the user takes control", () => {
    s().syncFromSystem(true);
    expect(s().reducedMotion).toBe(true);

    s().setReducedMotion(false); // explicit user choice
    s().syncFromSystem(true);
    expect(s().reducedMotion).toBe(false);
  });

  it("resetSettings restores every default", () => {
    s().setQuality("low");
    s().toggleSound();
    s().setHighContrast(true);
    s().resetSettings();
    expect(s().quality).toBe("high");
    expect(s().soundEnabled).toBe(false);
    expect(s().highContrast).toBe(false);
  });
});
