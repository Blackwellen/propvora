import { createClient } from "@/lib/supabase/server"
import { gateAutomation, gateAiCopilot } from "@/lib/billing/gates"
import { UpgradePrompt } from "@/components/automations-builder/shared"
import BuilderClient from "./BuilderClient"

export const metadata = {
  title: "Automation builder · Propvora",
  description: "Describe an automation in plain English, review the draft, preview it, and save.",
}

export const dynamic = "force-dynamic"

export default async function AutomationBuilderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Resolve the active workspace server-side.
  let workspaceId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()
    workspaceId = (profile?.current_workspace_id as string | undefined) ?? null
  }

  // SERVER gate: base automation entitlement (NL builder is part of it).
  if (workspaceId) {
    const gate = await gateAutomation(supabase, workspaceId)
    if (!gate.allowed) {
      return (
        <UpgradePrompt
          title="Automations aren't on your plan"
          reason={gate.reason}
        />
      )
    }
  }

  // The NL drafting needs the AI entitlement; surface a soft notice (the form
  // still loads so the user can build manually). The route enforces it too.
  let aiEnabled = true
  if (workspaceId) {
    const aiGate = await gateAiCopilot(supabase, workspaceId)
    aiEnabled = aiGate.allowed
  }

  return <BuilderClient workspaceId={workspaceId ?? undefined} aiEnabled={aiEnabled} />
}
