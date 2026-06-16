import { redirect } from "next/navigation"
import { Workflow } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getAdminOverview,
  listRecentRuns,
  listRecentErrors,
  abuseSignals,
  listNodeRegistry,
  listPlanLimits,
} from "@/lib/automation/admin"
import AdminAutomationsClient from "@/components/admin-automations/AdminAutomationsClient"

export const dynamic = "force-dynamic"

/**
 * Platform-admin Automation Engine console.
 *
 * Cross-tenant BY DESIGN — a platform admin oversees automation across every
 * workspace. Gated by the (admin) layout AND re-checked here (fail-closed): a
 * non-admin is redirected before any data loads. The only write surface is the
 * node-registry kill-switch (a global safety control) — every toggle is audited.
 */
export default async function AdminAutomationsPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const supabase = createAdminClient()
  const [overview, runs, errors, abuse, registry, limits] = await Promise.all([
    getAdminOverview(supabase),
    listRecentRuns(supabase, 60),
    listRecentErrors(supabase, 60),
    abuseSignals(supabase, 20),
    listNodeRegistry(supabase),
    listPlanLimits(supabase),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white"><Workflow className="h-5 w-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Automation engine</h1>
          <p className="text-xs text-slate-500">Cross-workspace runs, errors, abuse signals, node registry, plan limits, and kill-switches.</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          All figures are <span className="font-semibold text-slate-700">real recorded engine state</span> across every workspace. The
          node kill-switch is a global safety control: disabling a node type blocks it from every workspace&apos;s canvas compiler.
          Payment and legal nodes can never auto-run regardless — they always require an approval.
        </p>
      </div>

      <AdminAutomationsClient
        overview={overview}
        runs={runs}
        errors={errors}
        abuse={abuse}
        registry={registry as never}
        limits={limits as never}
      />
    </div>
  )
}
