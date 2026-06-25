"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getProfileByKey, type ProfileConfig } from "@/lib/planning/profile-config"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

interface SetRow {
  operation_profile: string | null
  risk_score: number | null
}

const LEVEL_CLS: Record<string, string> = {
  Low: "text-emerald-600",
  Medium: "text-amber-600",
  Possible: "text-amber-600",
  Likely: "text-orange-600",
  High: "text-red-600",
  Severe: "text-red-700",
  Critical: "text-red-700",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RiskPage() {
  const params = useParams()
  const id = params.id as string

  const [set, setSet] = useState<SetRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      // Risk register is derived from the set's operation profile (same library that
      // powers Planning › Profiles › Risks), keyed to the set's stored risk score.
      const { data } = await supabase
        .from("planning_sets")
        .select("operation_profile, risk_score")
        .eq("id", id)
        .maybeSingle()
      setSet((data ?? null) as SetRow | null)
      setLoading(false)
    }
    load()
  }, [id])

  const profile: ProfileConfig | undefined = set?.operation_profile
    ? getProfileByKey(set.operation_profile)
    : undefined
  const risks = profile?.risks
  const score = set?.risk_score ?? null
  const scoreColor = score == null ? "#64748B" : score >= 60 ? "#EF4444" : score >= 40 ? "#F59E0B" : "#10B981"

  return (
    <div className="flex flex-col gap-5">

      {/* ── Section Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">Risk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Risk register and mitigations for this strategy. Derived from the {profile?.name ?? "operation"} risk model.
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : !risks ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-slate-700">Risk model unavailable</div>
          <p className="text-xs text-slate-400 max-w-sm">
            This planning set has no operation profile set, so a risk register can&apos;t be derived. Set the profile on the Overview tab.
          </p>
        </div>
      ) : (
        <>
          {/* ── KPI strip ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Plan Risk Score</span>
              <span className="text-[19px] font-bold" style={{ color: scoreColor }}>{score ?? "—"}<span className="text-xs text-slate-400">/100</span></span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Overall Rating</span>
              <span className="text-[19px] font-bold text-slate-900">{risks.overallRating}</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Identified Risks</span>
              <span className="text-[19px] font-bold text-slate-900">{risks.register.length}</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Est. Exposure</span>
              <span className="text-[15px] font-bold text-slate-900">{risks.totalExposureEstimate}</span>
            </div>
          </div>

          {/* ── Risk Register Table ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Risk Register</h3>
              <span className="text-[11px] text-slate-400">{risks.register.length} risks</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["#", "Risk", "Category", "Score", "Likelihood", "Impact", "Mitigation", "Owner"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {risks.register.map((r, i) => (
                    <tr key={r.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors align-top">
                      <td className="px-3 py-3 font-mono text-[10px] font-semibold text-slate-400">R-{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-3 py-3 text-slate-800 font-medium max-w-[180px]"><span className="block">{r.name}</span></td>
                      <td className="px-3 py-3 text-slate-500">{r.category}</td>
                      <td className="px-3 py-3">
                        <span className={`font-bold ${r.score >= 60 ? "text-red-600" : r.score >= 40 ? "text-amber-600" : "text-emerald-600"}`}>{r.score}</span>
                      </td>
                      <td className={`px-3 py-3 font-medium ${LEVEL_CLS[r.likelihood] ?? "text-slate-600"}`}>{r.likelihood}</td>
                      <td className={`px-3 py-3 font-medium ${LEVEL_CLS[r.impact] ?? "text-slate-600"}`}>{r.impact}</td>
                      <td className="px-3 py-3 text-slate-600 max-w-[260px]">{r.mitigation}</td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{r.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mitigation actions ── */}
          {risks.mitigationActions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900">Priority Mitigation Actions</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {risks.mitigationActions.map((a) => (
                  <li key={a} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-700">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
