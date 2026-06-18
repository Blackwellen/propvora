import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceTier } from "@/lib/billing/gates"
import { PLAN_DISPLAY } from "@/lib/billing/plans"

/**
 * Planning Engine layout — gates this section behind Operator+ plan.
 *
 * Starter-tier workspaces are redirected to billing with an upgrade hint.
 * Gate fails open on a DB error (never lock a paying user out on a transient
 * hiccup). Operator+ have full access; Scale+ also unlock AI planning features.
 */
export const dynamic = "force-dynamic"

export default async function PlanningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/property-manager/planning")

  // Workspace ID from the user's current workspace.
  let workspaceId: string | null = null
  try {
    const { data } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()
    workspaceId = data?.current_workspace_id ?? null
    if (!workspaceId) {
      const { data: mem } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
      workspaceId = mem?.workspace_id ?? null
    }
  } catch {
    // Fail open — let the page render (gate error must not lock paying users out).
    return <>{children}</>
  }

  if (!workspaceId) return <>{children}</>

  const tier = await getWorkspaceTier(supabase, workspaceId)
  const plan = PLAN_DISPLAY[tier]

  // Starter tier → soft redirect to billing with upgrade prompt.
  // All other tiers (operator, scale, pro_agency, enterprise) pass through.
  if (tier === "starter") {
    redirect(
      `/property-manager/workspace/billing?upgrade=planning&from=${plan.name}`
    )
  }

  return <>{children}</>
}
