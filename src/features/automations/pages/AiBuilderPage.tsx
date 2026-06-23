"use client"

import { Bot } from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AiBuilderClient from "@/components/automations-engine/AiBuilderClient"

/**
 * AI Builder page.
 *
 * Previously this rendered a static mock (a hardcoded "Lease expiry" preview and
 * a Generate button that only toggled a flag + toast — the typed prompt was never
 * sent anywhere). The real, working builder lives in AiBuilderClient: it POSTs the
 * prompt to /api/automations/ai-builder (buildFromPrompt via the AI gateway →
 * constrained node graph from the real catalogue), then saves a review-first draft
 * definition and opens it on the canvas. We render that inside the section shell so
 * the prompt actually does something.
 */
export default function AiBuilderPage() {
  return (
    <AutomationsModuleShell
      title="AI Builder"
      subtitle="Describe what you want to automate and let AI draft a review-first node graph from the real catalogue. Nothing runs until you review and deploy."
      icon={Bot}
    >
      <AiBuilderClient />
    </AutomationsModuleShell>
  )
}
