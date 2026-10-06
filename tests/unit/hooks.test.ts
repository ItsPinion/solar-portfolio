import { renderHook, act } from "@testing-library/react";
import { orbitalPositionAt } from "@/hooks/useOrbitalMotion";
import { useResponsive } from "@/hooks/useResponsive";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSettingsStore } from "@/stores/useSettingsStore";

describe("orbitalPositionAt", () => {
  it("places a body on a circle of the given radius", () => {
    const pos = orbitalPositionAt(0, { radius: 10, speed: 1, phase: 0 });
    expect(pos.x).toBeCloseTo(10, 5);
    expect(pos.z).toBeCloseTo(0, 5);
    const r = Math.hypot(pos.x, pos.z);
    expect(r).toBeCloseTo(10, 5);
  });

  it("rotates over time and stays on the same radius", () => {
    const a = orbitalPositionAt(0, { radius: 8, speed: 1 });
    const b = orbitalPositionAt(30, { radius: 8, speed: 1 });
    expect(a.angle).not.toBeCloseTo(b.angle, 3);
    expect(Math.hypot(b.x, b.z)).toBeCloseTo(8, 4);
  });

  it("applies inclination to the vertical axis only", () => {
    const flat = orbitalPositionAt(5, { radius: 6, speed: 1, inclination: 0 });
    const tilted = orbitalPositionAt(5, { radius: 6, speed: 1, inclination: 30 });
    expect(flat.y).toBe(0);
    expect(Math.abs(tilted.y)).toBeGreaterThan(0);
    expect(Math.hypot(tilted.x, tilted.z)).toBeCloseTo(6, 4);
  });

  it("is periodic: a full period returns to the start", () => {
    const speed = 1;
    // omega = ORBIT_SPEED_BASE * 60 / speed = 0.06 rad/s → period ≈ 104.72s
    const period = (Math.PI * 2) / 0.06;
    const a = orbitalPositionAt(0, { radius: 5, speed, phase: 0.3 });
    const b = orbitalPositionAt(period, { radius: 5, speed, phase: 0.3 });
    expect(b.x).toBeCloseTo(a.x, 3);
    expect(b.z).toBeCloseTo(a.z, 3);
  });

  it("moves faster when the speed multiplier is smaller", () => {
    const fast = orbitalPositionAt(20, { radius: 5, speed: 0.5 });
    const slow = orbitalPositionAt(20, { radius: 5, speed: 2 });
    expect(fast.angle).toBeGreaterThan(slow.angle);
  });
});

describe("useResponsive", () => {
  const setViewport = (width: number, height = 900) => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
    window.dispatchEvent(new Event("resize"));
  };

  it("returns a numeric viewport, a breakpoint and capability flags", () => {
    setViewport(1440);
    const { result } = renderHook(() => useResponsive());
    expect(typeof result.current.width).toBe("number");
    expect(typeof result.current.breakpoint).toBe("string");
    expect(typeof result.current.isMobile).toBe("boolean");
    expect(typeof result.current.isTablet).toBe("boolean");
    expect(typeof result.current.isDesktop).toBe("boolean");
    expect(["portrait", "landscape"]).toContain(result.current.orientation);
  });

  it("reports the correct breakpoint for each width", () => {
    const cases: [number, string][] = [
      [375, "xs"],
      [700, "sm"],
      [800, "md"],
      [1100, "lg"],
      [1300, "xl"],
      [1600, "2xl"],
    ];
    for (const [width, expected] of cases) {
      setViewport(width);
      const { result, unmount } = renderHook(() => useResponsive());
      expect(result.current.breakpoint).toBe(expected);
      unmount();
    }
  });

  it("flags mobile below 768px and asks for the lightweight layout", () => {
    setViewport(375, 812);
    const { result } = renderHook(() => useResponsive());
    act(() => window.dispatchEvent(new Event("resize")));
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.prefer2D).toBe(true);
  });

  it("classifies tablet widths between 768 and 1024", () => {
    setViewport(900, 1024);
    const { result } = renderHook(() => useResponsive());
    act(() => window.dispatchEvent(new Event("resize")));
    expect(result.current.isTablet).toBe(true);
    expect(result.current.prefer2D).toBe(false);
  });
});

describe("useReducedMotion", () => {
  beforeEach(() => useSettingsStore.getState().resetSettings());

  it("returns a boolean", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(typeof result.current).toBe("boolean");
  });

  it("reflects the in-app setting", () => {
    const { result } = renderHook(() => useReducedMotion());
    act(() => useSettingsStore.getState().setReducedMotion(true));
    expect(result.current).toBe(true);
    act(() => useSettingsStore.getState().setReducedMotion(false));
    expect(result.current).toBe(false);
  });

  it("honours the OS media query on first read", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    expect(useSettingsStore.getState().reducedMotion).toBe(true);

    window.matchMedia = original;
  });
});
