import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "../styles/animations.css";
import { StoreHydration } from "@/components/shared/StoreHydration";

/**
 * Fonts are self-hosted (see src/app/fonts) so builds never depend on the
 * Google Fonts network at build time. Variable woff2 files cover the full
 * weight ranges used across the design system.
 */
const spaceGrotesk = localFont({
  src: [
    { path: "./fonts/SpaceGrotesk-latin.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/SpaceGrotesk-latin-ext.woff2", weight: "300 700", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const inter = localFont({
  src: [
    { path: "./fonts/Inter-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/Inter-latin-ext.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const jetbrainsMono = localFont({
  src: [
    { path: "./fonts/JetBrainsMono-latin.woff2", weight: "100 800", style: "normal" },
    { path: "./fonts/JetBrainsMono-latin-ext.woff2", weight: "100 800", style: "normal" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

const SITE_URL = "https://solar-portfolio.vercel.app";
const SITE_TITLE = "Solar System Portfolio — Interactive 3D Developer Showcase";
const SITE_DESCRIPTION =
  "An interactive solar system portfolio: projects orbit a central star, technologies circle each planet as satellites. Built with Next.js, React Three Fiber and Framer Motion.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Solar System Portfolio",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Solar System Portfolio",
  keywords: [
    "portfolio",
    "3D portfolio",
    "solar system",
    "react three fiber",
    "three.js",
    "webgl",
    "interactive",
    "developer portfolio",
  ],
  authors: [{ name: "Alex Nova" }],
  creator: "Alex Nova",
  manifest: "/site.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Solar System Portfolio",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "A glowing star surrounded by orbiting project planets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#050510",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} bg-cosmic-black text-star-white font-body antialiased`}
      >
        {/* Rehydrates persisted settings + applies system preferences. */}
        <StoreHydration />
        {children}
      </body>
    </html>
  );
}
