import type { Metadata } from "next"
import PortalGuidedHelp from "@/guided-help/PortalGuidedHelp"

// Minimal external-portal layout. Deliberately renders NO app shell, NO
// SideNavigation, NO workspace switcher, and NO links into /app or /admin.
// External magic-link users live entirely inside /portal.
export const metadata: Metadata = {
  title: "Portal | Propvora",
  robots: { index: false, follow: false },
}

export default function PortalRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F6FAFF] text-slate-900">
      <PortalGuidedHelp>{children}</PortalGuidedHelp>
    </div>
  )
}
