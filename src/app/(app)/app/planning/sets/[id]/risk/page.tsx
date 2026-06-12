"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  Edit2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import type { PlanningRisk } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Risk score trend (static) ──────────────────────────────────────────────────

const TREND_DATA = [
  { date: "May 1", score: 52 },
  { date: "May 15", score: 49 },
  { date: "Jun 1", score: 45 },
  { date: "Jun 15", score: 43 },
  { date: "Jul 1", score: 41 },
  { date: "Jul 15", score: 39 },
  { date: "Aug 1", score: 38 },
  { date: "Aug 15", score: 38 },
]

// ── Sensitivity Alerts ────────────────────────────────────────────────────────

const SENSITIVITY = [
  { label: "Occupancy rate (avg.)", level: "High", impact: "-£1,460/mo", levelColor: "bg-red-100 text-red-700" },
  { label: "Rental income per room", level: "High", impact: "-£1,210/mo", levelColor: "bg-red-100 text-red-700" },
  { label: "Interest rate (5-yr fix)", level: "Medium", impact: "-£520/mo", levelColor: "bg-amber-100 text-amber-700" },
  { label: "Void period (days)", level: "Medium", impact: "-£410/mo", levelColor: "bg-amber-100 text-amber-700" },
  { label: "Maintenance costs", level: "Low", impact: "-£180/mo", levelColor: "bg-emerald-100 text-emerald-700" },
]

// ── AI Mitigations ────────────────────────────────────────────────────────────

const AI_MITIGATIONS = [
  "Secure rental guarantees for 2+ rooms to reduce vacancy risk.",
  "Consider a 5-year fixed rate mortgage to protect against rate rises.",
  "Implement dynamic pricing strategy to optimise room rates.",
]

// ── Static risk register ──────────────────────────────────────────────────────

const STATIC_RISKS = [
  { id: "R-001", label: "Lower than expected occupancy", category: "Market", score: 72, likelihood: "High", impact: "High", status: "In Progress", statusColor: "bg-blue-100 text-blue-700", dueDate: "20 May 2025", trend: "worsening" },
  { id: "R-002", label: "Interest rate increases", category: "Financial", score: 64, likelihood: "Medium", impact: "High", status: "In Progress", statusColor: "bg-blue-100 text-blue-700", dueDate: "15 Jun 2025", trend: "stable" },
  { id: "R-003", label: "Construction cost overrun", category: "Construction", score: 48, likelihood: "Low", impact: "Medium", status: "Planned", statusColor: "bg-slate-100 text-slate-600", dueDate: "30 Jun 2025", trend: "improving" },
  { id: "R-004", label: "Regulatory changes (HMO licensing)", category: "Regulatory", score: 36, likelihood: "Low", impact: "Medium", status: "Planned", statusColor: "bg-slate-100 text-slate-600", dueDate: "30 Jun 2025", trend: "stable" },
  { id: "R-005", label: "Room rental price compression", category: "Market", score: 32, likelihood: "Low", impact: "Medium", status: "Monitoring", statusColor: "bg-blue-100 text-blue-700", dueDate: "30 Sep 2025", trend: "improving" },
  { id: "R-006", label: "Key contractor performance", category: "Operational", score: 28, likelihood: "Low", impact: "Medium", status: "Monitoring", statusColor: "bg-blue-100 text-blue-700", dueDate: "31 Aug 2025", trend: "stable" },
  { id: "R-007", label: "Tenant default risk", category: "Financial", score: 28, likelihood: "Low", impact: "Medium", status: "Monitoring", statusColor: "bg-blue-100 text-blue-700", dueDate: "31 Aug 2025", trend: "stable" },
  { id: "R-008", label: "Utilities cost escalation", category: "Operational", score: 20, likelihood: "Low", impact: "Low", status: "Monitoring", statusColor: "bg-blue-100 text-blue-700", dueDate: "Ongoing", trend: "stable" },
]

// ── Heatmap ───────────────────────────────────────────────────────────────────

const LIKELIHOOD_LABELS = ["Very High", "High", "Medium", "Low", "Very Low"]
const IMPACT_LABELS = ["Very Low", "Low", "Medium", "High", "Very High"]

function cellColor(row: number, col: number): string {
  const score = (4 - row) + col
  if (score <= 1) return "bg-emerald-100"
  if (score <= 3) return "bg-emerald-200"
  if (score <= 5) return "bg-amber-200"
  if (score <= 6) return "bg-orange-300"
  return "bg-red-400"
}

// Risk dots positioned on heatmap [likelihood row 0-4, impact col 0-4]
const RISK_DOTS: { id: string; row: number; col: number; color: string }[] = [
  { id: "R-001", row: 1, col: 3, color: "#EF4444" },
  { id: "R-002", row: 2, col: 3, color: "#EF4444" },
  { id: "R-003", row: 3, col: 2, color: "#F59E0B" },
  { id: "R-004", row: 3, col: 2, color: "#F59E0B" },
  { id: "R-005", row: 3, col: 2, color: "#F59E0B" },
  { id: "R-006", row: 3, col: 2, color: "#F59E0B" },
  { id: "R-007", row: 3, col: 2, color: "#F59E0B" },
  { id: "R-008", row: 3, col: 1, color: "#10B981" },
]

// Build grid cell contents
function buildGrid() {
  const grid: { [key: string]: string[] } = {}
  RISK_DOTS.forEach((d) => {
    const key = `${d.row}-${d.col}`
    if (!grid[key]) grid[key] = []
    grid[key].push(d.id)
  })
  return grid
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <div style={{ color: "#10B981" }}><TrendingDown className="w-3.5 h-3.5" /></div>
  if (trend === "worsening") return <div style={{ color: "#EF4444" }}><TrendingUp className="w-3.5 h-3.5" /></div>
  return <div style={{ color: "#94A3B8" }}><Minus className="w-3.5 h-3.5" /></div>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RiskPage() {
  const params = useParams()
  const id = params.id as string

  const [risks, setRisks] = useState<PlanningRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from("planning_risks")
          .select("*")
          .eq("planning_set_id", id)
          .order("risk_score", { ascending: false })
        if (err) throw err
        setRisks((data ?? []) as PlanningRisk[])
      } catch {
        setError("Failed to load risks.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-slate-700 font-semibold">{error}</div>
      </div>
    )
  }

  const grid = buildGrid()

  // Merge live risk scores into static rows where possible
  const displayRisks = STATIC_RISKS.map((r) => {
    const live = risks.find((x) => x.risk_code === r.id || x.label.toLowerCase().includes(r.label.toLowerCase().slice(0, 10)))
    return live
      ? { ...r, score: live.risk_score, likelihood: live.likelihood.replace("_", " "), impact: live.impact.replace("_", " "), trend: live.risk_trend }
      : r
  })

  return (
    <div className="flex flex-col gap-5">

      {/* ── Section Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
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

      {/* ── 3-column layout ─────────────────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* LEFT: Heatmap + Trend */}
        <div className="w-[400px] flex-shrink-0 flex flex-col gap-4">

          {/* Heatmap */}
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Risk Heatmap</h3>
              <div className="flex gap-2">
                {/* Y-axis label */}
                <div className="flex flex-col justify-between py-1">
                  {LIKELIHOOD_LABELS.map((l) => (
                    <span key={l} className="text-[9px] text-slate-400 font-medium text-right leading-none" style={{ width: 52 }}>{l}</span>
                  ))}
                </div>
                {/* Grid */}
                <div className="flex flex-col gap-0.5 flex-1">
                  {LIKELIHOOD_LABELS.map((_, row) => (
                    <div key={row} className="flex gap-0.5">
                      {IMPACT_LABELS.map((_, col) => {
                        const cellKey = `${row}-${col}`
                        const dots = grid[cellKey] ?? []
                        return (
                          <div
                            key={col}
                            className={`flex-1 h-9 rounded flex items-center justify-center ${cellColor(row, col)}`}
                          >
                            {dots.length > 0 && (
                              <div className="flex flex-wrap gap-0.5 justify-center">
                                {dots.slice(0, 2).map((d) => (
                                  <span key={d} className="w-4 h-4 rounded-full bg-white/80 text-[7px] font-bold text-slate-700 flex items-center justify-center border border-slate-300">
                                    {d.replace("R-", "")}
                                  </span>
                                ))}
                                {dots.length > 2 && (
                                  <span className="text-[7px] font-bold text-slate-600">+{dots.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                  {/* X-axis labels */}
                  <div className="flex gap-0.5 mt-1">
                    {IMPACT_LABELS.map((l) => (
                      <span key={l} className="flex-1 text-[8px] text-slate-400 font-medium text-center leading-none truncate">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] text-slate-500">Likelihood →</span>
                <span className="text-[10px] text-slate-400">Impact (X-axis)</span>
              </div>
            </div>
          )}

          {/* Risk Score Trend */}
          {loading ? <Skeleton className="h-52 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Risk Score Trend</h3>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Current: 38</span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={TREND_DATA} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#94A3B8" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                  <ReferenceLine y={38} stroke="#F59E0B" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3, fill: "#7C3AED" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CENTER: Sensitivity + AI Mitigations */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Top Sensitivity Alerts */}
          {loading ? <Skeleton className="h-44 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Top Sensitivity Alerts</h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Alert</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Level</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {SENSITIVITY.map((s) => (
                    <tr key={s.label} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-700 font-medium">{s.label}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.levelColor}`}>
                          {s.level}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-red-600 font-semibold">{s.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* AI Mitigation Recommendations */}
          {loading ? <Skeleton className="h-52 w-full" /> : (
            <div className="rounded-2xl border border-violet-200 shadow-sm p-4 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 70%, #EFF6FF 100%)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-violet-900">AI Mitigation Recommendations</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {AI_MITIGATIONS.map((m) => (
                  <div key={m} className="flex items-start gap-2.5 bg-white/60 rounded-xl px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-violet-900">{m}</p>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 flex-shrink-0">High Impact</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 hover:underline">
                View all recommendations
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Risk Register Table (full width) ──────────────────────────────── */}
      {loading ? <Skeleton className="h-64 w-full" /> : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Risk Register</h3>
            <span className="text-[11px] text-slate-400">Showing 1 to 8 of 8 risks</span>
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
                {displayRisks.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 font-mono text-[10px] font-semibold text-slate-500">{r.id}</td>
                    <td className="px-3 py-3 text-slate-800 font-medium max-w-[200px]">
                      <span className="truncate block">{r.label}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{r.category}</td>
                    <td className="px-3 py-3">
                      <span className={`font-bold ${r.score >= 60 ? "text-red-600" : r.score >= 40 ? "text-amber-600" : "text-emerald-600"}`}>
                        {r.score}
                      </span>
                    </td>
                    <td className="px-3 py-3 capitalize text-slate-600">{r.likelihood}</td>
                    <td className="px-3 py-3 capitalize text-slate-600">{r.impact}</td>
                    <td className="px-3 py-3">
                      <TrendIcon trend={r.trend} />
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.statusColor}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{r.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Showing 1 to 8 of 8 risks</span>
            <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:underline">
              View full risk register
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
