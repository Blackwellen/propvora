import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { listFeeRules } from "@/lib/money/fee-rules"
import FeeRulesEditor from "./FeeRulesEditor"

export const dynamic = "force-dynamic"

/* Platform-admin fee-rules editor. Self-guards via getAdminIdentity (fail-closed)
   and renders a forbidden state to non-admins rather than 404ing — it lives in
   the money area but is admin-grade. */

export default async function FeeRulesPage() {
  const admin = await getAdminIdentity()
  if (!admin) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center max-w-md">
          <h1 className="text-lg font-semibold text-slate-900">Platform admin only</h1>
          <p className="mt-2 text-sm text-slate-500">
            The fee-rules editor manages the global commission matrix and is restricted to platform administrators.
          </p>
        </div>
      </div>
    )
  }

  const rules = await listFeeRules(createAdminClient())

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 px-6 py-6 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fee Rules</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform commission matrix — per country, transaction type, plan and category, with min/max and provider-fee
          pass-through. Every change is audited.
        </p>
      </div>
      <FeeRulesEditor initialRules={rules} />
    </div>
  )
}
