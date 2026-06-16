import { Bot } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import DefinitionsListFull from "@/components/automations-engine/DefinitionsListFull"

export const metadata = {
  title: "My automations - Propvora",
  description: "Workspace automation definitions — list, enable/disable, and view run history.",
}
export const dynamic = "force-dynamic"

export default function MyAutomationsPage() {
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={Bot}
        title="My automations"
        subtitle="All automation definitions for this workspace. Toggle on/off, edit on the canvas, and drill into run history."
      />
      <DefinitionsListFull />
    </div>
  )
}
