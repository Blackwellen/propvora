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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiReviewPage() {
  const params = useParams()
  const id = params.id as string

  const [review, setReview] = useState<PlanningAiReview | null>(null)
  const [timeSince, setTimeSince] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      // planning_ai_reviews is not yet provisioned (42P01) — swallow to null (no review).
      const { data, error } = await supabase
        .from("planning_ai_reviews")
        .select("*")
        .eq("planning_set_id", id)
        .order("reviewed_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      const row = error ? null : (data as PlanningAiReview | null)
      setReview(row)
      if (row) {
        const diff = Date.now() - new Date(row.reviewed_at).getTime()
        const mins = Math.floor(diff / 60000)
        setTimeSince(mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`)
      } else {
        setTimeSince(null)
      }
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">10B AI Review</h2>
          <p className="text-xs text-slate-500 mt-0.5">{timeSince ? `Last reviewed ${timeSince}` : "No review run yet"}</p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Run Review
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-80 w-full" />
      ) : !review ? (
        /* ── Honest empty state ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-violet-500" />
          </div>
          <div className="text-sm font-semibold text-slate-700">No AI review yet</div>
          <p className="text-xs text-slate-400 max-w-sm">
            Complete your assumptions and run an AI review to score this plan&apos;s financial viability, risk and data completeness.
          </p>
        </div>
      ) : (
        <AiReviewContent review={review} />
      )}
    </div>
  )
}

// ── Review content (only rendered when a real review exists) ───────────────────

function AiReviewContent({ review: r }: { review: PlanningAiReview }) {
  const radialData = [{ name: "Score", value: r.overall_score, fill: r.overall_score >= 75 ? "#10B981" : r.overall_score >= 50 ? "#F59E0B" : "#EF4444" }]
  const scoreLabel = r.overall_score >= 75 ? "Good" : r.overall_score >= 50 ? "Watch" : "At Risk"

  const DIMENSION_BARS = [
    { label: "Financial Viability", score: r.financial_viability, color: "#10B981" },
    { label: "Risk Assessment", score: r.risk_assessment, color: "#2563EB" },
    { label: "Data Completeness", score: r.data_completeness, color: "#F59E0B" },
    { label: "Compliance Readiness", score: r.compliance_readiness, color: "#F59E0B" },
    { label: "Scenario Robustness", score: r.scenario_robustness, color: "#10B981" },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">

      {/* LEFT: Plan Scorecard */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Plan Scorecard</h3>
          <div className="relative flex justify-center mb-4">
            <ResponsiveContainer width={160} height={160}>
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="55%" outerRadius="80%"
                startAngle={90} endAngle={-270}
                data={radialData}
                barSize={14}
              >
                <RadialBar dataKey="value" background={{ fill: "#F1F5F9" }} cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{r.overall_score}</span>
              <span className="text-[10px] font-semibold text-slate-500">/100 {scoreLabel}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {DIMENSION_BARS.map((d) => (
              <ScoreBar key={d.label} label={d.label} score={d.score} color={d.color} />
            ))}
          </div>
        </div>
      </div>

      {/* CENTER: Cards */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">

        {(r.strengths ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Strengths</h3>
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

        {(r.weaknesses ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Weaknesses</h3>
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

        {(r.missing_data ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                <Diamond className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Missing Data</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {(r.missing_data ?? []).map((m) => (
                <div key={m} className="flex items-start gap-1.5 bg-amber-50 rounded-xl px-2.5 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                  <span className="text-xs text-slate-700">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(r.suggestions ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Suggested Improvements</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {(r.suggestions ?? []).map((s) => (
                <div key={s} className="flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.recommendation && (
          <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #2563EB 100%)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-200" />
              <span className="text-sm font-bold text-white">AI Recommendation</span>
            </div>
            <p className="text-xs text-violet-100 leading-relaxed">{r.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
