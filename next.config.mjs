/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Three.js ships ESM that benefits from transpilation in the R3F ecosystem.
  transpilePackages: ["three"],

  webpack(config) {
    // Import GLSL shaders (src/lib/shaders/*.frag|.vert) as plain source strings.
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: "asset/source",
    });
    return config;
  },

  experimental: {
    // Keeps the initial JS payload small (Phase 11 bundle target).
    optimizePackageImports: ["framer-motion", "lucide-react", "@react-three/drei"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  eslint: {
    // Lint is run explicitly via `npm run lint`; don't fail production builds on style.
    ignoreDuringBuilds: true,
  },

  /**
   * NOTE — `allowedDevOrigins` is intentionally left unset.
   *
   * Next 14.2 runs cross-origin dev requests in "warn" mode when the option is
   * undefined and switches to "block" (403) as soon as it is defined. The live
   * preview for this workspace is served through an external proxy whose domain
   * we don't control, so defining the option risks hard-blocking `/_next/*`
   * assets in the preview. Warn-only is the safe default here.
   *
   * IMPORTANT: never run `npm run build` while `next dev` is running — they
   * share the `.next` directory and the dev server will start throwing
   * `Cannot find module './NNN.js'`. Stop dev → build → restart dev.
   */

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
