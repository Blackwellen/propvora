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
  `img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://api.maptiler.com https://unpkg.com https://*.supabase.co https://*.supabase.in https://*.r2.cloudflarestorage.com https://*.r2.dev https://*.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://images.unsplash.com`,
  `connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://nominatim.openstreetmap.org https://api.maptiler.com https://api.stripe.com https://*.stripe.com https://*.basemaps.cartocdn.com https://www.google-analytics.com`,
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
  // isomorphic-dompurify bundles jsdom which reads default-stylesheet.css from
  // disk. When webpack bundles jsdom for SSR the file path resolution breaks.
  // Marking these packages as server-external loads them natively at runtime
  // (they are pure Node.js) and avoids the ENOENT crash.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom", "dompurify", "@sentry/nextjs"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Static-generation worker count. Defaults to one-per-core (~27 on this
    // 28-core box), which OOMs a RAM-constrained machine on a 700+ route app.
    // Set BUILD_CPUS=2 (or 4) locally to cap peak memory; unset on CI/Vercel so
    // production builds run at full speed.
    ...(process.env.BUILD_CPUS ? { cpus: Number(process.env.BUILD_CPUS) } : {}),
  },
  images: {
    remotePatterns: [
      // Supabase storage
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      // Cloudflare R2 (private S3-compatible endpoint)
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Cloudflare R2 public buckets / custom domains
      { protocol: "https", hostname: "*.r2.dev" },
      // Unsplash CDN (demo/seed images)
      { protocol: "https", hostname: "images.unsplash.com" },
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
    // Long-term rental aliases
    { source: "/rent", destination: "/stays/long-term", permanent: false },
    { source: "/lettings", destination: "/stays/long-term", permanent: false },
    { source: "/stays/rent", destination: "/stays/long-term", permanent: false },
    { source: "/stays/long-term-rentals", destination: "/stays/long-term", permanent: false },
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
    // /marketplace does not exist — redirect to the canonical public routes
    { source: "/marketplace/stays", destination: "/stays", permanent: true },
    { source: "/marketplace/stays/:path*", destination: "/stays/:path*", permanent: true },
    { source: "/marketplace/suppliers", destination: "/suppliers", permanent: true },
    { source: "/marketplace/suppliers/:path*", destination: "/suppliers/:path*", permanent: true },
    { source: "/marketplace/services", destination: "/services", permanent: true },
    { source: "/marketplace/services/:path*", destination: "/services/:path*", permanent: true },
    // Any other /marketplace/* sub-path (emergency, book, checkout, request) → /services
    { source: "/marketplace", destination: "/services", permanent: true },
    { source: "/marketplace/:path*", destination: "/services", permanent: true },
    // Supplier/provider typo aliases
    { source: "/suppleirs", destination: "/suppliers", permanent: false },
    { source: "/suppleirs/:path*", destination: "/suppliers/:path*", permanent: false },
    { source: "/stays/property-map", destination: "/stays/map", permanent: false },
    { source: "/services/zone-map", destination: "/services/map", permanent: false },
    { source: "/providers/zone-map", destination: "/providers/map", permanent: false },
    // Platform Admin route standardisation (old → clean /admin structure)
    { source: "/admin/marketplace", destination: "/admin/marketplace/oversight", permanent: false },
    { source: "/admin/verification", destination: "/admin/id-verification", permanent: false },
    { source: "/admin/verification/:path*", destination: "/admin/id-verification/:path*", permanent: false },
    { source: "/admin/maintenance", destination: "/admin/maintenance-mode", permanent: false },
    { source: "/admin/cron", destination: "/admin/cron-management", permanent: false },
    { source: "/admin/automations/usage-caps", destination: "/admin/automation-usage", permanent: false },
    { source: "/admin/bugs", destination: "/admin/bug-reports", permanent: false },
    { source: "/admin/bugs/:path*", destination: "/admin/bug-reports/:path*", permanent: false },
    { source: "/admin/audit", destination: "/admin/audit-log", permanent: false },
    { source: "/admin/global/translations", destination: "/admin/global-translations", permanent: false },
    { source: "/admin/announcements/bar", destination: "/admin/announcement-bar", permanent: false },

    // Settings canonical — /property-manager/settings → workspace settings hub
    { source: "/property-manager/settings", destination: "/property-manager/workspace-settings", permanent: false },
    { source: "/property-manager/settings/:path*", destination: "/property-manager/workspace-settings/:path*", permanent: false },
    // Stale scattered settings routes → workspace-settings equivalents
    { source: "/property-manager/settings/calendar-notifications", destination: "/property-manager/workspace-settings/notifications", permanent: false },
    { source: "/property-manager/settings/compliance", destination: "/property-manager/workspace-settings/compliance", permanent: false },
    { source: "/property-manager/settings/payments-stripe", destination: "/property-manager/workspace-settings/integrations", permanent: false },

    // NOTE: Calendar routing is owned by the App Router pages, not next.config.
    //   /calendar                 → overview hub (CalendarOverviewPage)
    //   /calendar/views           → client-redirect to /calendar/views/week
    //   /calendar/views/{view}    → real month/week/day/agenda/gantt grids
    //   /calendar/{view}          → thin server redirect into /calendar/views/{view}
    //   /calendar/schedule        → real schedule list
    //   /calendar/timeline        → real timeline view
    // A previous "view collapse → /calendar?view=" redirect block lived here but
    // the overview page never read ?view, so it bounced every view/schedule/
    // timeline link back to the hub (3 of 6 tabs dead). Removed — do not re-add.
  ],
  rewrites: async () => ({
    beforeFiles: [
      // Authenticated checkout shares the full-screen public checkout shell
      // (no app sidebar). Must precede the generic /property-manager rewrite.
      {
        source: "/property-manager/checkout/:path*",
        destination: "/checkout/:path*",
      },
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
