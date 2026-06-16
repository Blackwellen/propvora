import { Cable } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import IntegrationsClient from "@/components/automations-engine/IntegrationsClient"

export const metadata = {
  title: "Automation integrations - Propvora",
  description: "Connect payments, booking channels, supplier workflows, and APIs to your automations.",
}
export const dynamic = "force-dynamic"

export default function AutomationIntegrationsPage() {
  return (
    <div className="space-y-6">
      <OpsHeader icon={Cable} title="Integrations" subtitle="Connect approved external systems. Secrets stay server-side; high-risk providers run under approval gates." />
      <IntegrationsClient />
    </div>
  )
}
