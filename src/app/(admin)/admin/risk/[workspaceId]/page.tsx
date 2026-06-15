import React from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, ShieldAlert, ScrollText, ListChecks } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getWorkspaceRiskScore,
  getWorkspaceRiskEvents,
  syncWorkspaceSignals,
} from "@/lib/risk/signals"
import { loadRiskRules } from "@/lib/risk/engine"
import { ScoreGauge } from "@/components/admin-risk/ScoreGauge"
import { BandBadge } from "@/components/admin-risk/badges"
import { SignalList } from "@/components/admin-risk/SignalList"
import { FlagActions } from "@/components/admin-risk/FlagActions"
import { shortId, fmtDateTime, eventTypeLabel } from "@/components/admin-risk/helpers"

export const dynamic = "force-dynamic"

/**
 * Platform-admin risk detail for a single workspace.
 *
 * Cross-tenant BY DESIGN — gated by the (admin) layout AND re-checked here
 * server-side (fail-closed). On load we sync the workspace's existing platform
 * signals (sanctions / KYC / disputes / marketplace) into risk_events so the
 * picture is current, then render the score, contributing signals, and the
 * audited Flag / Clear actions.
 *
 * HONESTY: the score is an advisory aggregation of signals for human review,
 * never automated enforcement or an accusation.
 */
export default async function AdminRiskDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const { workspaceId } = await params
  const supabase = createAdminClient()

  // Refresh ingested signals so the detail reflects current state (idempotent).
  await syncWorkspaceSignals(supabase, workspaceId).catch(() => undefined)

  const [scoreRes, eventsRes, rules] = await Promise.all([
    getWorkspaceRiskScore(supabase, workspaceId),
    getWorkspaceRiskEvents(supabase, workspaceId, 200),
    loadRiskRules(supabase),
  ])

  // Workspace display info.
  let workspaceName: string | null = null
  let country: string | null = null
  try {
    const { data } = await supabase
      .from("workspaces")
      .select("name, business_country_code")
      .eq("id", workspaceId)
      .maybeSingle()
    if (data) {
      workspaceName = (data.name as string) ?? null
      country = (data.business_country_code as string) ?? null
    }
  } catch {
    /* ignore */
  }

  const score = scoreRes.data
  const events = eventsRes.data
  const band = score?.band ?? "low"
  const scoreVal = score?.score ?? 0

  // Per-type contribution counts for the explainability panel.
  const contributions = new Map<string, number>()
  for (const e of events) {
    if (e.eventType === "manual_clear") continue
    contributions.set(e.eventType, (contributions.get(e.eventType) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/risk"
          className="inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to risk dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">
            {workspaceName ?? "Workspace"}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 className="w-3.5 h-3.5" />
            <span className="font-mono">{shortId(workspaceId)}</span>
            {country && (
              <>
                <span>·</span>
                <span>{country}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Honesty banner */}
      <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-2.5">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          This score aggregates observed signals to assist review. It is{" "}
          <span className="font-semibold text-slate-700">not</span> an automated determination of
          wrongdoing. Any flag or clear is an explicit, recorded admin action.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Score + actions */}
        <div className="space-y-5">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 flex flex-col items-center gap-3">
            <ScoreGauge score={scoreVal} band={band} />
            <BandBadge band={band} />
            <p className="text-[11px] text-slate-400">
              Last signal: {fmtDateTime(score?.lastEventAt ?? null)}
            </p>
          </div>

          <FlagActions
            workspaceId={workspaceId}
            flagged={score?.flagged ?? false}
            flaggedReason={score?.flaggedReason ?? null}
          />

          {/* Contributing signal types */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 mb-2.5">
              <ListChecks className="w-4 h-4 text-slate-400" /> Contributing signals
            </h3>
            {contributions.size === 0 ? (
              <p className="text-[12px] text-slate-400">No contributing signals.</p>
            ) : (
              <ul className="space-y-1.5">
                {[...contributions.entries()].map(([type, count]) => (
                  <li
                    key={type}
                    className="flex items-center justify-between text-[12px] text-slate-600"
                  >
                    <span>{eventTypeLabel(type)}</span>
                    <span className="tabular-nums text-slate-400">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Signal timeline */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
            <ScrollText className="w-4 h-4 text-slate-400" /> Signal history
          </h2>
          {!scoreRes.available ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">Risk engine not provisioned</p>
            </div>
          ) : (
            <SignalList events={events} />
          )}
        </div>
      </div>
    </div>
  )
}
