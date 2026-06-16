import { ShieldCheck } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import ApprovalsClient from "@/components/automations-engine/ApprovalsClient"

export const metadata = {
  title: "Automation approvals - Propvora",
  description: "Human review gates for payment, legal, AI, and external-message automation steps.",
}
export const dynamic = "force-dynamic"

export default function AutomationApprovalsPage() {
  return (
    <div className="space-y-6">
      <OpsHeader icon={ShieldCheck} title="Approvals" subtitle="High-risk automation steps pause here for a human decision." />
      <ApprovalsClient />
    </div>
  )
}
