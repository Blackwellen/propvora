import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/login?source=pwa",
    name: "Propvora — Property Operations",
    short_name: "Propvora",
    description:
      "The property operations, compliance and profit-control platform for serious property operators. Manage portfolio, work, money, compliance, legal readiness, documents and portals.",
    start_url: "/login?source=pwa",
    scope: "/",
    lang: "en-GB",
    dir: "ltr",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#0f172a",
    theme_color: "#0D1B2A",
    categories: ["business", "productivity", "finance"],
    icons: [
      // Transparent brand mark (no background) — used for the favicon + PWA "any" icon.
      { src: "/propvora-favicon.png", sizes: "any", type: "image/png", purpose: "any" },
      // Maskable keeps a full-bleed background by design (Android adaptive icons need a safe zone).
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Dashboard", short_name: "Home", url: "/property-manager?source=pwa-shortcut", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Work & Jobs", short_name: "Work", url: "/property-manager/work?source=pwa-shortcut", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Money", short_name: "Money", url: "/property-manager/money?source=pwa-shortcut", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Compliance", short_name: "Compliance", url: "/property-manager/compliance?source=pwa-shortcut", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
