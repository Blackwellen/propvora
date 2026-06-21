import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join as a supplier | Propvora",
  description: "Set up your Propvora supplier profile and start receiving job requests from property managers.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-32.png",
  },
}

export default function SupplierOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
