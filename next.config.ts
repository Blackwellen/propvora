import type { NextConfig } from "next";
import { createRequire } from "node:module";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy — scoped to exactly what Propvora loads:
 *  • Stripe (checkout/js)          • CartoDB + OSM map tiles (Leaflet)
 *  • Nominatim geocoding           • Supabase (REST + realtime websockets)
 *  • Cloudflare R2 image hosts     • PWA service worker (blob/worker)
 *
 * 'unsafe-inline' is kept for styles (Tailwind/inline) and scripts (Next inline
 * bootstrap); 'unsafe-eval' is dev-only (HMR) so production stays strict.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://*.stripe.com https://www.googletagmanager.com`,
  `style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://unpkg.com https://*.supabase.co https://*.supabase.in https://*.r2.cloudflarestorage.com https://*.r2.dev https://*.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`,
  `connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://nominatim.openstreetmap.org https://api.stripe.com https://*.stripe.com https://*.basemaps.cartocdn.com https://www.google-analytics.com`,
  `frame-src 'self' https://js.stripe.com https://*.stripe.com https://hooks.stripe.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `manifest-src 'self'`,
  // Prod-only: forces any stray http asset to https. Disabled in dev so it never
  // rewrites http://localhost requests to https:// (which would surface as
  // net::ERR_SSL_PROTOCOL_ERROR against the non-TLS dev server). Harmless in prod (TLS).
  ...(isDev ? [] : [`upgrade-insecure-requests`]),
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      // Cloudflare R2 (private S3-compatible endpoint)
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Cloudflare R2 public buckets / custom domains
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()",
        },
        // HSTS — only meaningful over HTTPS; browsers ignore it on http.
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
  redirects: async () => [
    {
      source: "/app",
      destination: "/property-manager",
      permanent: false,
    },
    {
      source: "/app/:path*",
      destination: "/property-manager/:path*",
      permanent: false,
    },
    {
      source: "/customer",
      destination: "/user",
      permanent: false,
    },
    {
      source: "/customer/:path*",
      destination: "/user/:path*",
      permanent: false,
    },
  ],
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/property-manager",
        destination: "/app",
      },
      {
        source: "/property-manager/:path*",
        destination: "/app/:path*",
      },
      {
        source: "/user",
        destination: "/customer",
      },
      {
        source: "/user/:path*",
        destination: "/customer/:path*",
      },
    ],
  }),
};

/**
 * Bundle analyzer — opt-in via `ANALYZE=true npm run build`.
 *
 * `@next/bundle-analyzer` is intentionally NOT a hard dependency. When it isn't
 * installed (or ANALYZE isn't set) this is a complete no-op and the plain
 * config is exported unchanged. To use it:
 *
 *   1. npm i -D @next/bundle-analyzer
 *   2. ANALYZE=true npm run build      (cross-env on Windows, or set in shell)
 *
 * The require is wrapped so a missing package never breaks a normal build.
 */
function withAnalyzer(config: NextConfig): NextConfig {
  if (process.env.ANALYZE !== "true") return config;
  try {
    const require = createRequire(import.meta.url);
    const bundleAnalyzer = require("@next/bundle-analyzer") as (
      opts: { enabled: boolean }
    ) => (cfg: NextConfig) => NextConfig;
    return bundleAnalyzer({ enabled: true })(config);
  } catch {
    // Package not installed — analysis silently skipped, build proceeds normally.
    console.warn(
      "[next.config] ANALYZE=true but @next/bundle-analyzer is not installed; skipping. Run: npm i -D @next/bundle-analyzer"
    );
    return config;
  }
}

export default withAnalyzer(nextConfig);
