import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "Propvora — Property Operations",
    short_name: "Propvora",
    description:
      "The property operations, compliance and profit-control platform for serious property operators. Manage portfolio, work, money, compliance, legal readiness, documents and portals.",
    start_url: "/app?source=pwa",
    scope: "/",
    lang: "en-GB",
    dir: "ltr",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#F6FAFF",
    theme_color: "#0D1B2A",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "Dashboard", short_name: "Home", url: "/app?source=pwa-shortcut", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Work & Jobs", short_name: "Work", url: "/app/work?source=pwa-shortcut", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Money", short_name: "Money", url: "/app/money?source=pwa-shortcut", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Compliance", short_name: "Compliance", url: "/app/compliance?source=pwa-shortcut", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
