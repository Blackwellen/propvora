import { Bot, LayoutTemplate } from "lucide-react"
import AutomationsClient from "../AutomationsClient"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import DefinitionsCanvasList from "@/components/automations-engine/DefinitionsCanvasList"

export const metadata = {
  title: "My automations - Propvora",
  description: "Workspace automation definitions, drafts, review items, and activity.",
}
export const dynamic = "force-dynamic"

export default function MyAutomationsPage() {
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={Bot}
        title="My automations"
        subtitle="Workspace automation definitions, pending approvals, templates, and recent run activity."
      />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-900">Node-graph automations</h2>
        </div>
        <DefinitionsCanvasList />
      </section>

      <AutomationsClient />
    </div>
  )
}
