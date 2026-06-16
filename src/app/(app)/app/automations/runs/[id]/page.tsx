import { Activity } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import RunTimeline from "@/components/automations-ops/RunTimeline"
import RunNodeTimeline from "@/components/automations-engine/RunNodeTimeline"

export const metadata = {
  title: "Run detail - Automations - Propvora",
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
        backHref="/property-manager/automations/runs"
        backLabel="Run history"
      />
      <RunTimeline runId={id} />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <RunNodeTimeline runId={id} />
      </div>
    </div>
  )
}
