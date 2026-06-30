import type { Metadata } from "next"
import { headers } from "next/headers"
import AuthShell from "@/components/shells/AuthShell"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  // Use the SAME canonical (square, transparent) favicon set as the root layout
  // so auth/onboarding pages don't show the older /icon-192.png mark on a white
  // tab background. Keep robots noindex — only the favicon set is shared.
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
