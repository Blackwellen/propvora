import type { MetadataRoute } from "next"

// Public, indexable pages only (private app/portal/auth surfaces are excluded by
// robots.ts). Keep in sync with the public marketing + marketplace routes.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://propvora.com"
  const now = new Date()
  type Entry = { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }

  const entries: Entry[] = [
    { path: "", priority: 1.0, freq: "weekly" },
    // Product / marketing
    { path: "/features", priority: 0.9, freq: "monthly" },
    { path: "/pricing", priority: 0.9, freq: "monthly" },
    { path: "/walkthrough", priority: 0.7, freq: "monthly" },
    { path: "/about", priority: 0.6, freq: "monthly" },
    { path: "/roadmap", priority: 0.5, freq: "monthly" },
    { path: "/changelog", priority: 0.5, freq: "weekly" },
    { path: "/contact", priority: 0.5, freq: "yearly" },
    // Marketplace (public)
    { path: "/stays", priority: 0.8, freq: "daily" },
    { path: "/suppliers", priority: 0.8, freq: "daily" },
    { path: "/services", priority: 0.7, freq: "weekly" },
    { path: "/providers", priority: 0.7, freq: "weekly" },
    // Programmes
    { path: "/affiliate-programme", priority: 0.6, freq: "monthly" },
    // Support
    { path: "/help", priority: 0.6, freq: "weekly" },
    { path: "/faq", priority: 0.6, freq: "monthly" },
    // Legal
    { path: "/legal", priority: 0.3, freq: "yearly" },
    { path: "/legal/privacy", priority: 0.3, freq: "yearly" },
    { path: "/legal/terms", priority: 0.3, freq: "yearly" },
    { path: "/legal/acceptable-use", priority: 0.2, freq: "yearly" },
    { path: "/legal/cookies", priority: 0.2, freq: "yearly" },
  ]

  return entries.map((e) => ({
    url: `${base}${e.path}`,
    lastModified: now,
    changeFrequency: e.freq,
    priority: e.priority,
  }))
}
