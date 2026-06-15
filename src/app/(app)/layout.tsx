import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AppShell from "@/components/shell/AppShell"
import { createClient } from "@/lib/supabase/server"
import { canAccess } from "@/lib/subscription"
import type { WorkspacePlan } from "@/types/database"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch the workspace plan server-side so feature gates are enforced here,
  // never on the client. Default to 'trial' if not resolvable.
  let aiCopilotEnabled = false

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated → sign in.
  if (!user) {
    redirect("/login?redirectTo=/property-manager")
  }

  // Resolve the user's active workspace; route to onboarding if they have none.
  let workspaceId: string | null = null
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()

    workspaceId = profile?.current_workspace_id ?? null

    if (!workspaceId) {
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
      workspaceId = membership?.workspace_id ?? null
    }
  } catch {
    // Non-fatal — treat as no workspace below.
  }

  if (!workspaceId) {
    redirect("/onboarding")
  }

  try {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", workspaceId)
      .maybeSingle()

    if (workspace?.plan) {
      aiCopilotEnabled = canAccess(workspace.plan as WorkspacePlan, "aiCopilot")
    }
  } catch {
    // Non-fatal — default to restricted access.
  }

  return <AppShell aiCopilotEnabled={aiCopilotEnabled}>{children}</AppShell>
}
