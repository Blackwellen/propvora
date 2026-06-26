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
import { AdminPageHeader, AdminBanner } from "@/components/admin/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Automations — Propvora admin" }

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
  if (!identity) redirect("/bw-console-x9f3")

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
    <div className="space-y-5">
      <AdminPageHeader
        icon={Workflow}
        title="Automation engine"
        subtitle="Cross-workspace runs, errors, abuse signals, node registry, plan limits, and kill-switches."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Operations" }, { label: "Automations" }]}
      />

      <AdminBanner tone="slate" icon={Workflow} title="Real recorded engine state.">
        All figures are <span className="font-semibold text-slate-700">real recorded engine state</span> across every workspace. The
        node kill-switch is a global safety control: disabling a node type blocks it from every workspace&apos;s canvas compiler.
        Payment and legal nodes can never auto-run regardless — they always require an approval.
      </AdminBanner>

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
