import { Webhook } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import WebhookManager from "@/components/automations-ops/WebhookManager"

export const metadata = {
  title: "Inbound webhooks · Automations · Propvora",
  description: "Secure inbound webhook endpoints that let external systems trigger your automations.",
}

export default function AutomationWebhooksPage() {
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={Webhook}
        title="Inbound webhooks"
        subtitle="Give external systems a secure URL to trigger an automation. Each endpoint has an unguessable token and an optional signing secret."
      />
      <WebhookManager />
    </div>
  )
}
