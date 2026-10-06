import type { Config } from "tailwindcss";

/**
 * Tailwind theme extension for the Solar System Portfolio.
 * Design tokens mirror Appendix B of the development plan.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Core space palette (Appendix B) ----
        "cosmic-black": "#050510",
        "deep-space": "#0a0a1a",
        "nebula-purple": "#1a0533",
        "nebula-blue": "#0a1628",
        "star-gold": "#FDB813",
        "star-white": "#FFF5E0",
        "planet-blue": "#4F9CF9",
        "orbit-gray": "rgba(255, 255, 255, 0.08)",

        // Semantic aliases used across the app
        background: "var(--background)",
        foreground: "var(--foreground)",
        glass: {
          bg: "rgba(10, 10, 30, 0.60)",
          border: "rgba(255, 255, 255, 0.10)",
          highlight: "rgba(255, 255, 255, 0.06)",
        },
        orbit: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          highlight: "rgba(255, 255, 255, 0.25)",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      fontSize: {
        // Fluid typography (Phase 9) — clamp() based
        "fluid-xs": "clamp(0.6875rem, 0.65rem + 0.2vw, 0.75rem)",
        "fluid-sm": "clamp(0.8125rem, 0.78rem + 0.25vw, 0.875rem)",
        "fluid-base": "clamp(0.9375rem, 0.9rem + 0.3vw, 1rem)",
        "fluid-lg": "clamp(1.0625rem, 1rem + 0.4vw, 1.25rem)",
        "fluid-xl": "clamp(1.25rem, 1.1rem + 0.8vw, 1.6rem)",
        "fluid-2xl": "clamp(1.5rem, 1.25rem + 1.4vw, 2.25rem)",
        "fluid-3xl": "clamp(1.875rem, 1.5rem + 2vw, 3rem)",
        "fluid-4xl": "clamp(2.25rem, 1.75rem + 3vw, 4rem)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(253, 184, 19, 0.30)",
        "glow-sm": "0 0 10px rgba(253, 184, 19, 0.25)",
        "glow-lg": "0 0 40px rgba(253, 184, 19, 0.35)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.55)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "300ms",
        slow: "600ms",
        glacial: "1200ms",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            filter: "drop-shadow(0 0 6px currentColor)",
          },
          "50%": {
            opacity: "0.85",
            filter: "drop-shadow(0 0 18px currentColor)",
          },
        },
        "orbit-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "orbit-spin": "orbit-spin 20s linear infinite",
        "fade-in": "fade-in 600ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "fade-up": "fade-up 600ms cubic-bezier(0.4, 0, 0.2, 1) both",
        shimmer: "shimmer 2.5s linear infinite",
        "scan-line": "scan-line 2s linear infinite",
      },
      backgroundImage: {
        "nebula-gradient":
          "radial-gradient(ellipse at top, #1a0533 0%, #0a1628 45%, #050510 100%)",
        "star-gradient":
          "radial-gradient(circle, #FFF5E0 0%, #FDB813 45%, rgba(253,184,19,0) 70%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
      },
      screens: {
        xs: "375px",
      },
      zIndex: {
        canvas: "0",
        hud: "20",
        nav: "30",
        panel: "40",
        overlay: "50",
        modal: "60",
        cursor: "70",
      },
    },
  },
  plugins: [],
};

export default config;
