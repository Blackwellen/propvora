import type { ReactNode } from "react"
import AutomationSectionNav from "@/components/automations/AutomationSectionNav"

export default function AutomationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5">
      <AutomationSectionNav />
      {children}
    </div>
  )
}
