import type { Metadata } from "next"
import { Clock } from "lucide-react"
import StatePage from "@/components/states/StatePage"

export const metadata: Metadata = {
  title: "Portal link expired | Propvora",
  robots: { index: false, follow: false },
}

export default function PortalExpiredPage() {
  return (
    <StatePage
      icon={Clock}
      tone="amber"
      title="This portal link has expired"
      description="The link you used is no longer valid or has timed out. Sign in again to continue, or ask the person who shared it to send a fresh link."
      actions={[
        { label: "Go to portal sign in", href: "/portal/login" },
        { label: "Back to home", href: "/" },
      ]}
    />
  )
}
