"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Edit2,
  ShieldCheck,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningRisk } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <div style={{ color: "#10B981" }}><TrendingDown className="w-3.5 h-3.5" /></div>
  if (trend === "worsening") return <div style={{ color: "#EF4444" }}><TrendingUp className="w-3.5 h-3.5" /></div>
  return <div style={{ color: "#94A3B8" }}><Minus className="w-3.5 h-3.5" /></div>
}

function startCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RiskPage() {
  const params = useParams()
  const id = params.id as string

  const [risks, setRisks] = useState<PlanningRisk[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      // planning_risks is not yet provisioned (42P01) — swallow error to empty.
      const { data, error } = await supabase
        .from("planning_risks")
        .select("*")
        .eq("planning_set_id", id)
        .order("risk_score", { ascending: false })
      setRisks(error ? [] : ((data ?? []) as PlanningRisk[]))
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div className="flex flex-col gap-5">

      {/* ── Section Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">8B Risk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify, assess and manage risks that could impact your project outcomes.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : risks.length === 0 ? (
        /* ── Honest empty state ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-slate-700">No risks yet</div>
          <p className="text-xs text-slate-400 max-w-sm">
            Add risks to this planning set to build a risk register, heatmap and sensitivity analysis.
          </p>
          <button className="mt-1 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add risk
          </button>
        </div>
      ) : (
        /* ── Risk Register Table (full width) ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Risk Register</h3>
            <span className="text-[11px] text-slate-400">{risks.length} risk{risks.length === 1 ? "" : "s"}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["ID", "Risk", "Category", "Risk Score", "Likelihood", "Impact", "Trend", "Status", "Due Date"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 font-mono text-[10px] font-semibold text-slate-500">{r.risk_code ?? "—"}</td>
                    <td className="px-3 py-3 text-slate-800 font-medium max-w-[200px]">
                      <span className="truncate block">{r.label}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-500 capitalize">{r.category}</td>
                    <td className="px-3 py-3">
                      <span className={`font-bold ${r.risk_score >= 60 ? "text-red-600" : r.risk_score >= 40 ? "text-amber-600" : "text-emerald-600"}`}>
                        {r.risk_score}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{startCase(r.likelihood)}</td>
                    <td className="px-3 py-3 text-slate-600">{startCase(r.impact)}</td>
                    <td className="px-3 py-3">
                      <TrendIcon trend={r.risk_trend} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                      {r.due_date ? new Date(r.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
