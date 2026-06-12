import type { Metadata } from "next"
import { headers } from "next/headers"
import AuthShell from "@/components/shells/AuthShell"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
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
