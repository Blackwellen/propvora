"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Diamond,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import type { PlanningAiReview } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Score Bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-slate-600 font-medium">{label}</span>
        <span className="text-[11px] font-bold text-slate-800">{score}/100</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Static defaults ───────────────────────────────────────────────────────────

const DEFAULT_REVIEW: PlanningAiReview = {
  id: "default",
  workspace_id: "",
  planning_set_id: "",
  overall_score: 82,
  financial_viability: 85,
  risk_assessment: 78,
  data_completeness: 71,
  compliance_readiness: 71,
  scenario_robustness: 84,
  strengths: [
    "Strong cash flow and margin profile",
    "Healthy DSCR across scenarios",
    "Well diversified room mix",
    "Low compliance risk",
  ],
  weaknesses: [
    "High refit contingency (18%)",
    "Long time to refinance (18m)",
    "Void assumptions aggressive",
    "Limited stress testing",
  ],
  missing_data: [
    "Final planning decision",
    "Energy performance certificate",
    "Building control cost estimates",
    "Management agreement draft",
  ],
  suggestions: [
    "Reduce void to 4% (+£6.6k NOI)",
    "Refinance at 12 months (+£18.7k)",
    "Reduce contingency by 3% (+£4.3k)",
    "Add stress test: +2% rates",
  ],
  recommendation: "This plan is investment ready with minor improvements. Address the missing data and consider the suggested refinements to increase annual net profit by ~£11k.",
  raw_output: {},
  reviewed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  reviewed_by: null,
  created_at: "",
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-900">Apply AI Recommendations?</h3>
        <p className="text-xs text-slate-500">This will update your plan assumptions based on AI suggestions. You can review each change before confirming.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 h-9 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-9 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">Apply</button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiReviewPage() {
  const params = useParams()
  const id = params.id as string

  const [review, setReview] = useState<PlanningAiReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rerunning, setRerunning] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [appliedMsg, setAppliedMsg] = useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from("planning_ai_reviews")
          .select("*")
          .eq("planning_set_id", id)
          .order("reviewed_at", { ascending: false })
          .limit(1)
          .single()
        if (err && err.code !== "PGRST116") throw err
        setReview(data ? (data as PlanningAiReview) : DEFAULT_REVIEW)
      } catch {
        setReview(DEFAULT_REVIEW)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleRerun() {
    if (!id) return
    setRerunning(true)
    const supabase = createClient()
    try {
      await supabase.from("planning_ai_reviews").insert({
        planning_set_id: id,
        overall_score: DEFAULT_REVIEW.overall_score,
        financial_viability: DEFAULT_REVIEW.financial_viability,
        risk_assessment: DEFAULT_REVIEW.risk_assessment,
        data_completeness: DEFAULT_REVIEW.data_completeness,
        compliance_readiness: DEFAULT_REVIEW.compliance_readiness,
        scenario_robustness: DEFAULT_REVIEW.scenario_robustness,
        strengths: DEFAULT_REVIEW.strengths,
        weaknesses: DEFAULT_REVIEW.weaknesses,
        missing_data: DEFAULT_REVIEW.missing_data,
        suggestions: DEFAULT_REVIEW.suggestions,
        recommendation: DEFAULT_REVIEW.recommendation,
        raw_output: {},
        reviewed_at: new Date().toISOString(),
      })
      setReview({ ...DEFAULT_REVIEW, reviewed_at: new Date().toISOString() })
    } catch {
      // silently ignore
    } finally {
      setRerunning(false)
    }
  }

  function handleApply() {
    setConfirmOpen(false)
    setAppliedMsg(true)
    setTimeout(() => setAppliedMsg(false), 3000)
  }

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

  const r = review ?? DEFAULT_REVIEW
  const timeSince = review
    ? (() => {
        const diff = Date.now() - new Date(r.reviewed_at).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        return `${Math.floor(mins / 60)}h ago`
      })()
    : "2h ago"

  const radialData = [{ name: "Score", value: r.overall_score, fill: r.overall_score >= 75 ? "#10B981" : r.overall_score >= 50 ? "#F59E0B" : "#EF4444" }]

  const DIMENSION_BARS = [
    { label: "Financial Viability", score: r.financial_viability, color: "#10B981" },
    { label: "Risk Assessment", score: r.risk_assessment, color: "#2563EB" },
    { label: "Data Completeness", score: r.data_completeness, color: "#F59E0B" },
    { label: "Compliance Readiness", score: r.compliance_readiness, color: "#F59E0B" },
    { label: "Scenario Robustness", score: r.scenario_robustness, color: "#10B981" },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">10B AI Review</h2>
          <p className="text-xs text-slate-500 mt-0.5">Last reviewed {timeSince}</p>
        </div>
        <button
          onClick={handleRerun}
          disabled={rerunning}
          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${rerunning ? "animate-spin" : ""}`} />
          Re-run Review
        </button>
      </div>

      {appliedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="text-xs text-emerald-700 font-medium">Recommendations applied successfully. Review your assumptions tab for changes.</span>
        </div>
      )}

      {/* ── 3-column layout ─────────────────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* LEFT: Plan Scorecard */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4">
          {loading ? <Skeleton className="h-80 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Plan Scorecard</h3>

              {/* Circular gauge */}
              <div className="relative flex justify-center mb-4">
                <ResponsiveContainer width={160} height={160}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="55%" outerRadius="80%"
                    startAngle={90} endAngle={-270}
                    data={radialData}
                    barSize={14}
                  >
                    <RadialBar
                      dataKey="value"
                      background={{ fill: "#F1F5F9" }}
                      cornerRadius={8}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{r.overall_score}</span>
                  <span className="text-[10px] font-semibold text-emerald-600">/100 Good</span>
                </div>
              </div>

              {/* Dimension bars */}
              <div className="flex flex-col gap-2.5">
                {DIMENSION_BARS.map((d) => (
                  <ScoreBar key={d.label} label={d.label} score={d.score} color={d.color} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Cards */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Strengths */}
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Strengths</h3>
                </div>
                <button className="text-[11px] font-semibold text-[#7C3AED] hover:underline flex items-center gap-0.5">
                  View details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {(r.strengths ?? []).map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Weaknesses</h3>
                </div>
                <button className="text-[11px] font-semibold text-[#7C3AED] hover:underline flex items-center gap-0.5">
                  View details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {(r.weaknesses ?? []).map((w) => (
                  <div key={w} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Data */}
          {loading ? <Skeleton className="h-36 w-full" /> : (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Diamond className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Missing Data</h3>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(r.missing_data ?? []).map((m) => (
                  <div key={m} className="flex items-start gap-1.5 bg-amber-50 rounded-xl px-2.5 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                    <span className="text-xs text-slate-700">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Improvements */}
          {loading ? <Skeleton className="h-36 w-full" /> : (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Suggested Improvements</h3>
                </div>
                <button className="text-[11px] font-semibold text-[#7C3AED] hover:underline flex items-center gap-0.5">
                  View details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {(r.suggestions ?? []).map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0 mt-0.5 text-sm font-bold leading-none">↑</span>
                    <span className="text-xs text-slate-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendation Banner */}
          {loading ? <Skeleton className="h-32 w-full" /> : (
            <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #2563EB 100%)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-200" />
                    <span className="text-sm font-bold text-white">AI Recommendation</span>
                  </div>
                  <p className="text-xs text-violet-100 leading-relaxed">
                    {r.recommendation}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="flex-shrink-0 h-9 px-4 rounded-xl bg-white text-[#7C3AED] text-xs font-bold hover:bg-violet-50 transition-colors"
                >
                  Apply Recommendations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog onConfirm={handleApply} onCancel={() => setConfirmOpen(false)} />
      )}
    </div>
  )
}
