import type { MetadataRoute } from "next"

// Single source of truth for /robots.txt. (The previous static public/robots.txt
// was stale — it referenced legacy /app + non-existent portal paths — and a
// static file in public/ would shadow this route, so it was removed.)
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://propvora.com"

  // Private/app surfaces that must never be indexed.
  const disallow = [
    "/property-manager/",
    "/app/",
    "/admin/",
    "/supplier/",
    "/supplier-portal/",
    "/user/",
    "/customer/",
    "/affiliate/",
    "/portal/",
    "/p/",
    "/onboarding",
    "/invite/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-2fa",
    "/auth/",
    "/api/",
  ]

  return {
    rules: [
      // Standard search crawlers — index the public marketing/marketplace pages.
      { userAgent: "*", allow: "/", disallow },
      // AI / LLM crawlers — explicitly welcomed on public content so Propvora is
      // discoverable in AI search. The machine-readable summary lives in
      // /llms.txt (and the per-product brand .txt files it references).
      {
        userAgent: [
          "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web",
          "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot",
          "Applebot-Extended", "Bytespider",
        ],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
