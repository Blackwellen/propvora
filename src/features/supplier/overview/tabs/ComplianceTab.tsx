"use client"

import Link from "next/link"
import {
  ShieldCheck, FileCheck2, Clock, Ban, Eye, AlertTriangle, Upload, Power,
  Wallet, CheckCircle2, Circle, MinusCircle, Wrench,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import {
  KpiRow, Panel, ScoreRing, CheckRow, Pill, OverviewLink, useToast,
  OverviewSkeleton, OverviewError,
  type OverviewKpi, type Accent,
} from "../ui/primitives"
import { shortDate } from "../ui/util"
import { useComplianceData } from "../data/hooks"
import type { DocState } from "../data/types"

const DOC_STATE: Record<DocState, { accent: Accent; icon: React.ElementType }> = {
  verified: { accent: "emerald", icon: CheckCircle2 },
  expiring: { accent: "amber", icon: Clock },
  missing: { accent: "red", icon: AlertTriangle },
  not_required: { accent: "slate", icon: MinusCircle },
}

const IMPACT_ACCENT: Record<string, Accent> = { active: "emerald", at_risk: "amber", blocked: "red" }

export function ComplianceTab() {
  const { data, loading, error, reload } = useComplianceData()
  const { toast } = useToast()

  if (loading) return <OverviewSkeleton />
  if (error && !data) return <OverviewError onRetry={reload} />
  if (!data) return null

  const k = data.kpis
  const cur = data.payout.currency
  const docsPct = k.documentsTotal > 0 ? Math.round((k.documentsVerified / k.documentsTotal) * 100) : 0
  const kpis: OverviewKpi[] = [
    { id: "trust", label: "Trust score", value: k.trustScorePct > 0 ? `${k.trustScorePct}%` : "—", icon: ShieldCheck, accent: "violet" },
    { id: "docs", label: "Documents verified", value: `${k.documentsVerified} / ${k.documentsTotal}`, sub: k.documentsTotal > 0 ? `${docsPct}% complete` : undefined, icon: FileCheck2, accent: "blue" },
    { id: "exp", label: "Expiring soon", value: k.expiringSoon, icon: Clock, accent: "amber" },
    { id: "blocked", label: "Services blocked", value: k.servicesBlocked, icon: Ban, accent: "red" },
    { id: "vis", label: "Profile visible", value: k.profileVisible ? "Public" : "Hidden", sub: k.profileVisible ? "Visible to property managers" : "Not visible", subAccent: k.profileVisible ? "emerald" : "red", icon: Eye, accent: "emerald" },
  ]

  return (
    <div className="space-y-5">
      <KpiRow kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          {/* Compliance alerts */}
          <Panel title="Compliance alerts" icon={AlertTriangle}>
            {data.alerts.length === 0 && (
              <p className="text-[12px] text-slate-400">No compliance alerts. Upload your documents to get verified.</p>
            )}
            <ul className="space-y-2.5">
              {data.alerts.map((a) => (
                <li key={a.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.status === "missing" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}>
                    {a.status === "missing" ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5"><p className="text-sm font-semibold text-slate-800">{a.document}</p><Pill accent={a.status === "missing" ? "red" : "amber"}>{a.status}</Pill></div>
                    <p className="text-[12px] text-slate-500">{a.detail}{a.expiresAt ? ` · ${shortDate(a.expiresAt)}` : ""}</p>
                  </div>
                  <button onClick={() => toast(`${a.ctaLabel} — uploader coming soon`, "info")} className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold hover:bg-[#1d4ed8] shrink-0 self-center">
                    <Upload className="w-3.5 h-3.5" /> {a.ctaLabel}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Required document checklist */}
          <Panel title="Required documents" icon={FileCheck2} action={<OverviewLink href="/supplier/verification" label="Manage" />}>
            {data.requiredDocs.length === 0 && (
              <p className="text-[12px] text-slate-400 py-1">No documents on file yet. <Link href="/supplier/compliance" className="font-semibold text-blue-600">Upload your first document</Link>.</p>
            )}
            <ul className="divide-y divide-slate-100">
              {data.requiredDocs.map((d) => {
                const meta = DOC_STATE[d.state]
                const Icon = meta.icon
                return (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d.state === "verified" ? "bg-emerald-50 text-emerald-600" : d.state === "expiring" ? "bg-amber-50 text-amber-600" : d.state === "missing" ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{d.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{d.detail}</p>
                    </div>
                    <Pill accent={meta.accent}>{d.state.replace("_", " ")}</Pill>
                    {d.state !== "not_required" && (
                      <Link href={d.href} className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 shrink-0">{d.ctaLabel}</Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </Panel>

          {/* Expiry timeline */}
          <Panel title="Expiry timeline" icon={Clock} action={<span className="text-[11px] text-slate-400">Next 90 days</span>}>
            {data.expiryTimeline.length === 0 && (
              <p className="text-[12px] text-slate-400">No upcoming document expiries.</p>
            )}
            <ul className="space-y-3">
              {data.expiryTimeline.map((x) => {
                const pct = Math.max(4, Math.min(100, (1 - x.daysLeft / 365) * 100))
                const accent = x.daysLeft <= 30 ? "bg-red-500" : x.daysLeft <= 90 ? "bg-amber-500" : "bg-emerald-500"
                return (
                  <li key={x.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{x.document}</span>
                      <span className={`text-[12px] font-semibold ${x.daysLeft <= 30 ? "text-red-600" : "text-slate-500"}`}>{x.daysLeft}d · {shortDate(x.expiresAt)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${accent}`} style={{ width: `${pct}%` }} /></div>
                  </li>
                )
              })}
            </ul>
          </Panel>

          {/* Service impact matrix */}
          <Panel title="Service impact" icon={Wrench}>
            {data.serviceImpact.length === 0 && (
              <p className="text-[12px] text-slate-400">Add services to see how your compliance affects what you can offer.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.serviceImpact.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-800 truncate">{s.service}</p><Pill accent={IMPACT_ACCENT[s.state]}>{s.state.replace("_", " ")}</Pill></div>
                  <p className="text-[12px] text-slate-500 mt-1">{s.reason}</p>
                  <button onClick={() => toast(`${s.ctaLabel} — coming soon`, "info")} className="mt-2 text-[12px] font-semibold text-blue-600 hover:text-blue-700">{s.ctaLabel} →</button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          <Panel title="Availability" icon={Power}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-800">{data.availability.available ? "Available" : "Unavailable"}</p><p className="text-[12px] text-slate-500">{data.availability.hours}</p></div>
              <span className={`w-2.5 h-2.5 rounded-full ${data.availability.available ? "bg-emerald-500" : "bg-slate-300"}`} />
            </div>
            <Link href="/supplier/availability" className="mt-3 inline-block text-[12px] font-semibold text-blue-600 hover:text-blue-700">Manage hours →</Link>
          </Panel>

          <Panel title="Payout snapshot" icon={Wallet} action={<OverviewLink href="/supplier?tab=earnings" label="View" />}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between"><span className="text-sm text-slate-600">This week</span><span className="text-sm font-semibold text-slate-900">{formatPence(data.payout.thisWeekPence, cur)}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Next payout</span><span className="text-sm font-semibold text-emerald-600">{formatPence(data.payout.nextPayoutPence, cur)}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Expected</span><span className="text-sm font-semibold text-slate-900">{shortDate(data.payout.nextPayoutDate)}</span></div>
            </div>
          </Panel>

          <Panel title="Compliance alerts" icon={ShieldCheck}>
            {data.alerts.length === 0 && (
              <p className="text-[12px] text-slate-400">All clear.</p>
            )}
            <ul className="space-y-2">
              {data.alerts.map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <Circle className={`w-2 h-2 shrink-0 ${a.status === "missing" ? "text-red-500 fill-red-500" : "text-amber-500 fill-amber-500"}`} />
                  <span className="text-sm text-slate-600 truncate">{a.document}</span>
                  <Pill accent={a.status === "missing" ? "red" : "amber"}>{a.status}</Pill>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Trust badge preview">
            <div className="flex flex-col items-center">
              {data.trust.scorePct > 0 ? (
                <>
                  <ScoreRing pct={data.trust.scorePct} accent={data.trust.scorePct >= 85 ? "emerald" : "blue"} sub="Public score" />
                  <div className="mt-4 w-full space-y-2">
                    <CheckRow label="On-time" value={`${data.trust.breakdown.onTimePct}%`} done={data.trust.breakdown.onTimePct >= 80} />
                    <CheckRow label="Response" value={`${data.trust.breakdown.responsePct}%`} done={data.trust.breakdown.responsePct >= 80} />
                    <CheckRow label="Quality" value={`${data.trust.breakdown.qualityPct}%`} done={data.trust.breakdown.qualityPct >= 80} />
                    <CheckRow label="Communication" value={`${data.trust.breakdown.communicationPct}%`} done={data.trust.breakdown.communicationPct >= 80} />
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-slate-400 py-4 text-center">Your public trust score appears here once you complete jobs and earn reviews.</p>
              )}
              <Link href="/supplier/profile" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700"><Eye className="w-3.5 h-3.5" /> Preview public profile</Link>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
