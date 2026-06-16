import { History } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import RunsList from "@/components/automations-ops/RunsList"

export const metadata = {
  title: "Run history - Automations - Propvora",
  description: "Observability for your automations — every recorded run and its outcome.",
}

export default function AutomationRunsPage() {
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={History}
        title="Run history"
        subtitle="Every automation run, with its real recorded outcome. Read-only and honest — nothing is fabricated."
      />
      <RunsList />
    </div>
  )
}
