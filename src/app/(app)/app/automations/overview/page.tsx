import { createClient } from "@/lib/supabase/server"
import { resolveFlags } from "@/lib/flags"
import HomePage from "@/features/automations/pages/HomePage"

export const metadata = {
  title: "Automations Overview - Propvora",
  description: "Review-first portfolio automation that proposes safe, reversible next steps.",
}

export const dynamic = "force-dynamic"

export default async function AutomationsOverviewRoute() {
  // Resolve automation feature flags server-side so the Canvas shortcut + tab
  // strip hide Canvas/Webhooks/Integrations when those flags are OFF. The tab
  // strip itself is also gated centrally by the Automations layout (which
  // provides the same hiddenTabs via context); these props are the fallback
  // path used when this page is mounted OUTSIDE the PM automations layout
  // (e.g. the Supplier workspace re-exports this route).
  const supabase = await createClient()
  let workspaceId: string | null = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_workspace_id")
        .eq("id", user.id)
        .maybeSingle()
      workspaceId = (profile?.current_workspace_id as string | undefined) ?? null
    }
  } catch {
    // tolerant — defaults below
  }

  let canvasLite = false
  let automationsFull = false
  try {
    const flags = await resolveFlags(["canvasLite", "automationsFull"], {
      supabase,
      workspaceId: workspaceId ?? undefined,
    })
    canvasLite = Boolean(flags.canvasLite)
    automationsFull = Boolean(flags.automationsFull)
  } catch {
    // fail-closed: hidden
  }

  const hiddenTabs: string[] = []
  if (!canvasLite) hiddenTabs.push("Canvas Builder")
  if (!automationsFull) {
    hiddenTabs.push("Webhooks")
    hiddenTabs.push("Integrations")
  }

  return <HomePage hiddenTabs={hiddenTabs} canvasEnabled={canvasLite} />
}
