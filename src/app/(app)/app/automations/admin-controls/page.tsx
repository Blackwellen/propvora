import { LockKeyhole } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import { HardCapsPanel, NodeGroupPanel } from "@/components/automations/AutomationRegistryPanels"

export const metadata = {
  title: "Automation admin controls - Propvora",
  description: "Kill switches, restricted nodes, global safety controls, and audit surfaces.",
}

export default function AutomationAdminControlsPage() {
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={LockKeyhole}
        title="Admin Controls"
        subtitle="Workspace and platform-level controls for restricted nodes, kill switches, abuse protection, and audit."
      />
      <NodeGroupPanel groups={["Legal", "Payment", "Integration"]} />
      <HardCapsPanel />
    </div>
  )
}
