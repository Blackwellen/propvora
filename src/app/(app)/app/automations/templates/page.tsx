import { LayoutTemplate } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import TemplateGallery from "@/components/automations-ops/TemplateGallery"

export const metadata = {
  title: "Template gallery · Automations · Propvora",
  description: "Ready-made automations you can install as a draft in one click.",
}

export default function AutomationTemplatesPage() {
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={LayoutTemplate}
        title="Template gallery"
        subtitle="Ready-made, review-first automations. Use one to create a disabled draft you can review, then enable."
      />
      <TemplateGallery />
    </div>
  )
}
