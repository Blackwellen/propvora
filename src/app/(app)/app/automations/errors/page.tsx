import { AlertTriangle } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import ErrorsClient from "@/components/automations-engine/ErrorsClient"
import { NodeGroupPanel } from "@/components/automations/AutomationRegistryPanels"

export const metadata = {
  title: "Automation errors - Propvora",
  description: "Recorded automation run failures, retry policies, and pause thresholds.",
}
export const dynamic = "force-dynamic"

export default function AutomationErrorsPage() {
  return (
    <div className="space-y-6">
      <OpsHeader icon={AlertTriangle} title="Errors" subtitle="Recorded run failures plus the error-handling node policies." />
      <ErrorsClient />
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Error-handling nodes</h3>
        <NodeGroupPanel groups={["Error"]} />
      </div>
    </div>
  )
}
