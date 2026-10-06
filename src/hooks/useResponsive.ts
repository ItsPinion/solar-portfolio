"use client";

import { useEffect, useState } from "react";
import { BREAKPOINTS, MOBILE_3D_MIN_WIDTH } from "@/lib/constants";
import type { Breakpoint } from "@/types";

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Portrait / landscape — used to adapt HUD layout on orientation change. */
  orientation: "portrait" | "landscape";
  hasTouch: boolean;
  /** True when the 3D scene should be swapped for the lightweight layout. */
  prefer2D: boolean;
  /** True until the first client measurement lands (avoids hydration mismatch). */
  isPending: boolean;
}

function resolveBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

/**
 * Breakpoint + capability detection driven by `window.matchMedia` listeners
 * rather than resize polling, so it stays cheap during camera drags.
 */
export function useResponsive(): ResponsiveInfo {
  const [state, setState] = useState<ResponsiveInfo>(() => ({
    width: 1440,
    height: 900,
    breakpoint: "lg",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: "landscape",
    hasTouch: false,
    prefer2D: false,
    isPending: true,
  }));

  useEffect(() => {
    const queries = [
      `(min-width: ${BREAKPOINTS.sm}px)`,
      `(min-width: ${BREAKPOINTS.md}px)`,
      `(min-width: ${BREAKPOINTS.lg}px)`,
      `(min-width: ${BREAKPOINTS.xl}px)`,
      `(min-width: ${BREAKPOINTS["2xl"]}px)`,
      "(orientation: portrait)",
      "(pointer: coarse)",
    ];

    const mqls = queries.map((q) => window.matchMedia(q));

    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = resolveBreakpoint(width);
      const hasTouch =
        mqls[6].matches ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;

      setState({
        width,
        height,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop: width >= BREAKPOINTS.lg,
        orientation: mqls[5].matches ? "portrait" : "landscape",
        hasTouch,
        // Small *and* touch-first devices get the lightweight layout by default.
        prefer2D: width < MOBILE_3D_MIN_WIDTH,
        isPending: false,
      });
    };

    update();
    mqls.forEach((m) => m.addEventListener?.("change", update));
    // `resize` is still needed for width changes that don't cross a breakpoint
    // (e.g. HUD layout between 1200px and 1280px).
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      mqls.forEach((m) => m.removeEventListener?.("change", update));
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return state;
}

export default useResponsive;
