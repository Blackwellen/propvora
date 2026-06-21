import { createClient } from "@/lib/supabase/server"
import { gateAutomation, gateCanvasLite } from "@/lib/billing/gates"
import { resolveFlags } from "@/lib/flags"
import { UpgradePrompt } from "@/components/automations-builder/shared"
import AutomationsTabs from "@/features/automations/components/AutomationsTabs"
import CanvasClient from "./CanvasClient"

export const metadata = {
  title: "Automation canvas - Propvora",
  description: "Build an automation as a visual trigger → conditions → action flow.",
}

export const dynamic = "force-dynamic"

export default async function AutomationCanvasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let workspaceId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()
    workspaceId = (profile?.current_workspace_id as string | undefined) ?? null
  }

  // SERVER gate: base automation must be on the plan first.
  if (workspaceId) {
    const baseGate = await gateAutomation(supabase, workspaceId)
    if (!baseGate.allowed) {
      return <UpgradePrompt title="Automations aren't on your plan" reason={baseGate.reason} />
    }
    // SERVER gate: Canvas Lite is a higher entitlement.
    const canvasGate = await gateCanvasLite(supabase, workspaceId)
    if (!canvasGate.allowed) {
      return (
        <UpgradePrompt
          title="Canvas Lite isn't on your plan"
          reason={canvasGate.reason ?? "The visual builder is available on Scale and above."}
        />
      )
    }
  }

  // When canvas is accessible, also check automationsFull for Webhooks/Integrations tabs.
  let automationsFull = false
  try {
    const flags = await resolveFlags(["automationsFull"], { supabase, workspaceId: workspaceId ?? undefined })
    automationsFull = Boolean(flags.automationsFull)
  } catch {
    // fail-closed
  }
  const hiddenTabs: string[] = []
  if (!automationsFull) {
    hiddenTabs.push("Webhooks")
    hiddenTabs.push("Integrations")
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-6 pb-12">
      <AutomationsTabs hiddenTabs={hiddenTabs} />
      <CanvasClient workspaceId={workspaceId ?? undefined} />
    </div>
  )
}
