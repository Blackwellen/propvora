import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join as a supplier | Propvora",
  description: "Set up your Propvora supplier profile and start receiving job requests from property managers.",
  robots: { index: false, follow: false },
  // Canonical favicon set (matches root layout) — includes favicon.ico so the
  // tab never falls back to the browser's blank white default icon.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function SupplierOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
