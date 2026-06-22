import React from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, AlertTriangle, Flag, Activity, ChevronRight } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { listWorkspaceRiskRows, recentHighSeverityEvents } from "@/lib/risk/signals"
import RiskTable from "@/components/admin-risk/RiskTable"
import { SeverityBadge } from "@/components/admin-risk/badges"
import { eventTypeLabel, fmtDateTime, shortId } from "@/components/admin-risk/helpers"

export const dynamic = "force-dynamic"

/**
 * Platform-admin Risk & Fraud dashboard.
 *
 * Cross-tenant BY DESIGN — a platform admin reviews risk signals across every
 * workspace. Gated by the (admin) layout AND re-checked here server-side
 * (fail-closed): a non-admin is redirected before any data loads.
 *
 * HONESTY: every score / band / signal shown is a computed SIGNAL to assist
 * human review. None of it is automated enforcement or an accusation.
 */
export default async function AdminRiskPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const supabase = createAdminClient()
  const [rowsRes, eventsRes] = await Promise.all([
    listWorkspaceRiskRows(supabase, { limit: 300 }),
    recentHighSeverityEvents(supabase, 12),
  ])

  const available = rowsRes.available
  const rows = rowsRes.data
  const events = eventsRes.data

  const flaggedCount = rows.filter((r) => r.flagged).length
  const criticalCount = rows.filter((r) => r.band === "critical").length
  const highCount = rows.filter((r) => r.band === "high").length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Risk &amp; fraud</h1>
          <p className="text-xs text-slate-500">
            Workspaces ranked by aggregate risk signals across the platform
          </p>
        </div>
        {available && rows.length > 0 && (
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-rose-600">
                <ShieldAlert className="w-3.5 h-3.5" />
                {criticalCount} critical
              </span>
            )}
            {highCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-orange-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                {highCount} high
              </span>
            )}
            {flaggedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-rose-600">
                <Flag className="w-3.5 h-3.5" />
                {flaggedCount} flagged
              </span>
            )}
          </div>
        )}
      </div>

      {/* Honesty banner */}
      <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-2.5">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          Risk scores are <span className="font-semibold text-slate-700">computed signals to
          assist review</span>, not automated enforcement or accusations. They aggregate observed
          events (sanctions screenings, KYC checks, disputes, transaction patterns) to help a human
          admin triage. Any flag or clear is an explicit, recorded admin action.
        </p>
      </div>

      {!available ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Risk engine not provisioned</p>
          <p className="text-xs text-slate-400 mt-1">
            The risk_scores table is not present in this database yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Ranked table */}
          <div className="xl:col-span-2">
            <RiskTable rows={rows} />
          </div>

          {/* Recent high-severity signals */}
          <aside className="space-y-2">
            <h2 className="text-[13px] font-semibold text-slate-700">Recent high-severity signals</h2>
            {events.length === 0 ? (
              <div className="rounded-xl border border-[#E2E8F0] bg-white py-10 text-center">
                <Activity className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">No recent signals</p>
                <p className="text-xs text-slate-400 mt-1">No high or critical events recorded.</p>
              </div>
            ) : (
              <ul className="space-y-2" role="list">
                {events.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/admin/risk/${e.workspaceId}`}
                      className="flex items-start gap-2.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 hover:bg-slate-50/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12.5px] font-medium text-slate-800">
                            {eventTypeLabel(e.eventType)}
                          </span>
                          <SeverityBadge severity={e.severity} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                          {e.workspaceName ?? shortId(e.workspaceId)} · {fmtDateTime(e.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
