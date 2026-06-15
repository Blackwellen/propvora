import { Activity } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import RunTimeline from "@/components/automations-ops/RunTimeline"

export const metadata = {
  title: "Run detail · Automations · Propvora",
  description: "Step-by-step timeline of a single automation run.",
}

export default async function AutomationRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={Activity}
        title="Run detail"
        subtitle="The step-by-step timeline for this run — input, output and any error per step, exactly as recorded."
        backHref="/app/automations/runs"
        backLabel="Run history"
      />
      <RunTimeline runId={id} />
    </div>
  )
}
