import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import { resolveFlags } from "@/lib/flags"
import { AutomationsFlagsProvider } from "@/features/automations/components/AutomationsFlagsContext"

// The Automations module chrome (header + route-aware tab strip + safety banner)
// is provided per-page by AutomationsModuleShell. This layout resolves the
// feature flags ONCE and provides the resulting hidden-tab set to every page via
// context, so the tab strip is identical and correctly gated across the whole
// section. Without this, sub-pages that didn't re-resolve flags rendered the
// flag-gated Canvas Builder / Integrations tabs, which then bounced the user.
// NOTE: Webhooks is now a sub-tab inside Integrations — hiding "Integrations"
// covers webhooks too; there is no separate "Webhooks" main tab to gate.
export const dynamic = "force-dynamic"

export default async function AutomationsLayout({ children }: { children: ReactNode }) {
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
    // tolerant — fail closed below
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
    // fail-closed: gated tabs stay hidden
  }

  // Webhooks is a sub-tab of Integrations (not a separate main tab), so gating
  // "Integrations" hides both when automationsFull is OFF.
  const hiddenTabs: string[] = []
  if (!canvasLite) hiddenTabs.push("Canvas Builder")
  if (!automationsFull) hiddenTabs.push("Integrations")

  return (
    <AutomationsFlagsProvider value={{ hiddenTabs, canvasEnabled: canvasLite }}>
      {children}
    </AutomationsFlagsProvider>
  )
}
