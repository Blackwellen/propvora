import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceTier } from "@/lib/billing/gates"
import { PLAN_DISPLAY } from "@/lib/billing/plans"
import { isFeatureEnabled } from "@/lib/flags"

/**
 * Planning Engine layout — gates behind the planningEnabled feature flag
 * AND an Operator+ plan tier.
 *
 * Starter-tier workspaces → redirect to billing.
 * Flag OFF → redirect to home. Gate fails open on a DB error.
 */
export const dynamic = "force-dynamic"

export default async function PlanningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true") return <>{children}</>

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
    return <>{children}</>
  }

  if (!workspaceId) return <>{children}</>

  // Feature flag gate — planningEnabled defaults ON (V1 kill-switch).
  const planningOn = await isFeatureEnabled("planningEnabled", { supabase })
  if (!planningOn) redirect("/property-manager")

  const tier = await getWorkspaceTier(supabase, workspaceId)
  const plan = PLAN_DISPLAY[tier]

  // Starter tier → billing upgrade prompt.
  if (tier === "starter") {
    redirect(
      `/property-manager/workspace/billing?upgrade=planning&from=${plan.name}`
    )
  }

  return <>{children}</>
}
