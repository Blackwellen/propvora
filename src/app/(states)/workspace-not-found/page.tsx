import type { Metadata } from "next"
import { Building2 } from "lucide-react"
import StatePage from "@/components/states/StatePage"

export const metadata: Metadata = {
  title: "Workspace not found | Propvora",
  robots: { index: false, follow: false },
}

export default function WorkspaceNotFoundPage() {
  return (
    <StatePage
      icon={Building2}
      tone="slate"
      title="Workspace not found"
      description="We couldn't find this workspace, or you no longer have access to it. It may have been removed, or your membership may have changed."
      actions={[
        { label: "Back to dashboard", href: "/property-manager" },
        { label: "Back to home", href: "/" },
      ]}
    />
  )
}
