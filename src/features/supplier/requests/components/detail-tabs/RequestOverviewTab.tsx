"use client"

import { AlertTriangle, Building2, User, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react"
import { PoundSterling, CalendarClock, Sparkles } from "lucide-react"
import {
  SupplierCard, SupplierStatusBadge,
} from "@/components/supplier-workspace/ui"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof PoundSterling; label: string; value: string; tone?: "emerald" | "red" }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <p className={`text-lg font-bold mt-1 ${tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </p>
    </SupplierCard>
  )
}

function budgetLabel(r: PipelineRequest): string {
  if (r.budgetMinPence == null && r.budgetMaxPence == null) return "Open"
  if (r.budgetMinPence != null && r.budgetMaxPence != null)
    return `${moneyPence(r.budgetMinPence)}–${moneyPence(r.budgetMaxPence)}`
  return moneyPence(r.budgetMaxPence ?? r.budgetMinPence)
}

function riskFlags(r: PipelineRequest): { tone: "red" | "amber"; label: string }[] {
  const flags: { tone: "red" | "amber"; label: string }[] = []
  if (!r.withinCoverage) flags.push({ tone: "red", label: "Outside your usual coverage area" })
  if (r.urgency === "emergency") flags.push({ tone: "red", label: "Emergency — fast response expected" })
  if (r.docsRequired > r.files.length) flags.push({ tone: "amber", label: `${r.docsRequired - r.files.length} document(s) still required` })
  if (r.dueAt && new Date(r.dueAt).getTime() - Date.now() < 24 * 3_600_000)
    flags.push({ tone: "amber", label: "Quote deadline within 24 hours" })
  return flags
}

export interface RequestOverviewTabProps {
  request: PipelineRequest
  isTeam: boolean
}

export function RequestOverviewTab({ request: r, isTeam }: RequestOverviewTabProps) {
  const flags = riskFlags(r)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={PoundSterling} label="Budget" value={budgetLabel(r)} />
        <Kpi icon={CalendarClock} label="Deadline" value={r.dueAt ? shortDate(r.dueAt) : "Flexible"} />
        <Kpi
          icon={Sparkles}
          label="Win probability"
          value={r.recommendation.winProbabilityPct != null ? `${r.recommendation.winProbabilityPct}%` : "—"}
        />
        <Kpi icon={ShieldCheck} label="Coverage" value={r.withinCoverage ? "In area" : "Outside"} tone={r.withinCoverage ? "emerald" : "red"} />
      </div>

      {flags.length > 0 && (
        <div className="space-y-2">
          {flags.map((f, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                f.tone === "red"
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />{f.label}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SupplierCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Requester</p>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                {r.requesterCompany}
                {r.requesterVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
              </p>
              {r.customerName && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {r.customerName}{r.customerReturning ? " · returning" : ""}
                </p>
              )}
            </div>
          </div>
        </SupplierCard>
        <SupplierCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Property</p>
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {r.property.address ?? "Address shared on acceptance"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {[r.property.type, r.property.bedrooms ? `${r.property.bedrooms} bed` : null, r.property.heating]
              .filter(Boolean)
              .join(" · ") || "Details to follow"}
          </p>
        </SupplierCard>
      </div>

      {isTeam && (
        <SupplierCard className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Assignment &amp; approval</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div><p className="text-[11px] text-slate-400">Estimator</p><p className="text-sm font-semibold text-slate-800">—</p></div>
            <div><p className="text-[11px] text-slate-400">Owner</p><p className="text-sm font-semibold text-slate-800">—</p></div>
            <div><p className="text-[11px] text-slate-400">Approval</p><p className="text-sm font-semibold text-amber-600">Required</p></div>
            <div>
              <p className="text-[11px] text-slate-400">Quote deadline</p>
              <p className="text-sm font-semibold text-slate-800">{r.dueAt ? shortDate(r.dueAt) : "Flexible"}</p>
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Decision checklist</p>
          <ul className="space-y-1.5">
            {(
              [
                ["Coverage & trade fit confirmed", true],
                ["Estimator assigned", true],
                ["Margin target met", false],
                ["Commercial approval", false],
              ] as [string, boolean][]
            ).map(([l, ok]) => (
              <li key={l} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className={`w-4 h-4 ${ok ? "text-emerald-500" : "text-slate-300"}`} />
                <span className={ok ? "text-slate-600" : "text-slate-800 font-medium"}>{l}</span>
              </li>
            ))}
          </ul>
        </SupplierCard>
      )}

      <SupplierCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Request summary</h2>
        </div>
        <p className="text-sm text-slate-600">{r.scopeSummary || "Details of this quote request appear here."}</p>
      </SupplierCard>
    </div>
  )
}
