import type { Metadata } from "next"
import { headers } from "next/headers"
import AuthShell from "@/components/shells/AuthShell"

export const metadata: Metadata = {
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

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? ""

  const isFullPage =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/invite") ||
    pathname === "/login" ||
    pathname === "/register"

  return <AuthShell fullPage={isFullPage}>{children}</AuthShell>
}
