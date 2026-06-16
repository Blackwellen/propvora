import { redirect } from "next/navigation"
import { Wand2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { gateAutomation, gateAiCopilot } from "@/lib/billing/gates"
import { UpgradePrompt } from "@/components/automations-builder/shared"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import AiBuilderClient from "@/components/automations-engine/AiBuilderClient"

export const metadata = {
  title: "AI automation builder - Propvora",
  description: "Describe what you want to automate; the AI drafts a node graph for you to review.",
}
export const dynamic = "force-dynamic"

export default async function AiBuilderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
  const workspaceId = (profile?.current_workspace_id as string | undefined) ?? null

  if (workspaceId) {
    const baseGate = await gateAutomation(supabase, workspaceId)
    if (!baseGate.allowed) return <UpgradePrompt title="Automations aren't on your plan" reason={baseGate.reason} />
    const aiGate = await gateAiCopilot(supabase, workspaceId)
    if (!aiGate.allowed) return <UpgradePrompt title="AI builder isn't on your plan" reason={aiGate.reason ?? "The AI automation builder is available on Scale and above."} />
  }

  return (
    <div className="space-y-6">
      <OpsHeader icon={Wand2} title="AI builder" subtitle="Describe an automation in plain English — the AI drafts a node graph you review and confirm." />
      <AiBuilderClient />
    </div>
  )
}
