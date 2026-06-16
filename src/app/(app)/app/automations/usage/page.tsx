import { Gauge } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import UsageClient from "@/components/automations-engine/UsageClient"
import { HardCapsPanel } from "@/components/automations/AutomationRegistryPanels"

export const metadata = {
  title: "Automation usage and limits - Propvora",
  description: "Your real automation usage against per-plan governance limits and hard caps.",
}
export const dynamic = "force-dynamic"

export default function AutomationUsagePage() {
  return (
    <div className="space-y-6">
      <OpsHeader icon={Gauge} title="Usage & Limits" subtitle="Your live usage against the per-plan governance limits enforced by the engine." />
      <UsageClient />
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Hard caps (always enforced)</h3>
        <HardCapsPanel />
      </div>
    </div>
  )
}
