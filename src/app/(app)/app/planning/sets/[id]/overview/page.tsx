"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  TrendingUp,
  DollarSign,
  BarChart2,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Home,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { InlineEditField, InlineEditSelect } from "@/components/editing"
import { PLANNING_PROFILES } from "@/lib/planning/profiles"
import type {
  PlanningActivity,
  PlanningTask,
  PlanningNote,
  PlanningAiReview,
} from "@/lib/planning/types"

const PROFILE_OPTIONS = PLANNING_PROFILES.map((p) => ({ value: p.key, label: p.label }))

const PLAN_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "converted", label: "Converted" },
  { value: "archived", label: "Archived" },
]

// ── Live planning_sets row shape (per verified live schema) ────────────────────

interface PlanningSetRow {
  id: string
  workspace_id: string
  title: string
  operation_profile: string | null
  status: string
  address: string | null
  postcode: string | null
  gross_monthly_income: number | null
  gross_annual_income: number | null
  total_monthly_expenses: number | null
  net_monthly_income: number | null
  net_annual_income: number | null
  gross_yield: number | null
  net_yield: number | null
  roi: number | null
  upfront_cash_required: number | null
  breakeven_month: number | null
  risk_score: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ── Live planning_assumptions row shape ────────────────────────────────────────

interface PlanningAssumptionRow {
  id: string
  planning_set_id: string
  property_purchase_price: number | null
  property_value: number | null
  monthly_mortgage: number | null
  landlord_monthly_rent: number | null
  contract_length_months: number | null
  break_clause_months: number | null
  rent_review_months: number | null
  void_allowance_pct: number | null
  management_fee_pct: number | null
  occupancy_rate_pct: number | null
  average_daily_rate: number | null
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`
  if (Math.abs(n) >= 1_000) return `£${(n / 1_000).toFixed(0)}k`
  return `£${n.toFixed(0)}`
}

function fmtFull(n: number): string {
  return `£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}

function relDate(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function dueDateLabel(iso: string | null): { label: string; cls: string } {
  if (!iso) return { label: "No due date", cls: "text-slate-400 bg-slate-100" }
  const d = new Date(iso)
  const diffDays = Math.floor((d.getTime() - Date.now()) / 86400000)
  if (diffDays < 0) return { label: "Overdue", cls: "text-red-700 bg-red-100" }
  if (diffDays === 0) return { label: "Due today", cls: "text-amber-700 bg-amber-100" }
  if (diffDays <= 3) return { label: `${diffDays}d`, cls: "text-amber-700 bg-amber-100" }
  return {
    label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    cls: "text-slate-600 bg-slate-100",
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Health gauge ──────────────────────────────────────────────────────────────

function HealthGauge({ score }: { score: number }) {
  const capped = Math.max(0, Math.min(100, score))
  const color = capped >= 75 ? "#10B981" : capped >= 50 ? "#F59E0B" : "#EF4444"
  const label = capped >= 80 ? "Strong" : capped >= 60 ? "Healthy" : capped >= 40 ? "Watch" : "At Risk"
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
          <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(capped / 100) * 87.96} 87.96`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">{capped}</span>
      </div>
      <div>
        <div className="text-[15px] font-bold text-slate-900">{capped}/100</div>
        <div className="text-[10px] font-semibold" style={{ color }}>{label}</div>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  loading?: boolean
}

function KpiCard({ icon, iconBg, label, value, sub, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 min-w-0">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2 min-w-0">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="text-[17px] font-bold text-slate-900 leading-tight truncate">{value}</div>
      {sub && <div className="mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Profitability donut tooltip ───────────────────────────────────────────────

function ProfitTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-slate-700">{payload[0].name}</div>
      <div className="text-slate-900 font-bold">{fmtFull(payload[0].value)}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface PageData {
  set: PlanningSetRow
  activity: PlanningActivity[]
  tasks: PlanningTask[]
  notes: PlanningNote[]
  aiReview: PlanningAiReview | null
  assumptions: PlanningAssumptionRow[]
}

export default function PlanningSetOverviewPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    async function load() {
      setLoading(true)
      setError(null)

      // Real tables: planning_sets, planning_assumptions.
      // Phantom tables (activity/tasks/notes/ai_reviews) 42P01 — swallow each to empty.
      const [
        { data: set, error: setErr },
        { data: assumptions, error: assumptionsErr },
        { data: activity, error: activityErr },
        { data: tasks, error: tasksErr },
        { data: notes, error: notesErr },
        { data: aiReviews, error: aiErr },
      ] = await Promise.all([
        supabase.from("planning_sets").select("*").eq("id", id).single(),
        supabase.from("planning_assumptions").select("*").eq("planning_set_id", id),
        supabase.from("planning_activity").select("*").eq("planning_set_id", id).order("created_at", { ascending: false }).limit(3),
        supabase.from("planning_tasks").select("*").eq("planning_set_id", id).order("due_date", { ascending: true, nullsFirst: false }).limit(3),
        supabase.from("planning_notes").select("*").eq("planning_set_id", id).order("created_at", { ascending: false }).limit(3),
        supabase.from("planning_ai_reviews").select("*").eq("planning_set_id", id).order("reviewed_at", { ascending: false }).limit(1),
      ])

      if (setErr || !set) {
        setError("Planning set not found.")
        setLoading(false)
        return
      }

      setData({
        set: set as PlanningSetRow,
        assumptions: assumptionsErr ? [] : ((assumptions ?? []) as PlanningAssumptionRow[]),
        activity: activityErr ? [] : ((activity ?? []) as PlanningActivity[]),
        tasks: tasksErr ? [] : ((tasks ?? []) as PlanningTask[]),
        notes: notesErr ? [] : ((notes ?? []) as PlanningNote[]),
        aiReview: aiErr || !aiReviews?.length ? null : (aiReviews[0] as PlanningAiReview),
      })
      setLoading(false)
    }

    load()
  }, [id])

  // Persist a single editable plan field (source data only — never the
  // calculated yield/ROI/forecast outputs, which stay read-only). Scoped by the
  // planning_sets id (RLS handles the workspace check).
  async function savePlanField(key: keyof PlanningSetRow, value: string) {
    if (!id) return
    const supabase = createClient()
    const { error: err } = await supabase
      .from("planning_sets")
      .update({ [key]: value === "" ? null : value })
      .eq("id", id)
    if (err) throw new Error(err.message)
    setData((prev) => (prev ? { ...prev, set: { ...prev.set, [key]: value || null } } : prev))
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-slate-700 font-semibold">{error}</div>
        <Link href="/property-manager/planning/sets" className="text-sm text-[#7C3AED] hover:underline">Back to planning sets</Link>
      </div>
    )
  }

  const set = data?.set
  const assumptions = data?.assumptions ?? []
  const aiReview = data?.aiReview

  // ── Derived KPIs from the real planning_sets row ─────────────────────────────
  const netMonthly = set?.net_monthly_income ?? 0
  const grossMonthly = set?.gross_monthly_income ?? 0
  const totalMonthlyExpenses = set?.total_monthly_expenses ?? 0
  const projectedAnnualProfit = set?.net_annual_income ?? netMonthly * 12
  const grossYield = set?.gross_yield ?? 0
  const roi = set?.roi ?? 0
  const totalProjectCost = set?.upfront_cash_required ?? 0
  const riskScore = set?.risk_score ?? 0

  // Health score from AI review if present, else derived from risk_score
  const healthScore = aiReview?.overall_score ?? Math.max(0, 100 - riskScore)

  // Profitability donut from real monthly figures
  const noi = Math.max(0, netMonthly)
  const expenses = Math.max(0, totalMonthlyExpenses)
  const noiMarginPct = grossMonthly > 0 ? (netMonthly / grossMonthly) * 100 : 0
  const profitPieData = [
    { name: "Net Monthly Income", value: noi, color: "#10B981" },
    { name: "Monthly Expenses", value: expenses, color: "#F59E0B" },
  ]
  const hasProfitBreakdown = noi + expenses > 0

  // Key assumptions snapshot from real planning_assumptions row
  const a = assumptions[0]
  const keyAssumptions: { label: string; value: string }[] = a
    ? [
        { label: "Purchase Price", value: a.property_purchase_price != null ? fmtFull(a.property_purchase_price) : "—" },
        { label: "Property Value", value: a.property_value != null ? fmtFull(a.property_value) : "—" },
        { label: "Monthly Mortgage", value: a.monthly_mortgage != null ? fmtFull(a.monthly_mortgage) : "—" },
        { label: "Landlord Rent (PCM)", value: a.landlord_monthly_rent != null ? fmtFull(a.landlord_monthly_rent) : "—" },
        { label: "Occupancy Rate", value: a.occupancy_rate_pct != null ? `${a.occupancy_rate_pct}%` : "—" },
        { label: "Management Fee", value: a.management_fee_pct != null ? `${a.management_fee_pct}%` : "—" },
      ]
    : []

  return (
    <div className="flex flex-col gap-6">

      {/* ── A. KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#7C3AED" }}><Activity className="w-4 h-4" /></div>}
          iconBg="bg-violet-50"
          label="Net Monthly Income"
          value={`${netMonthly < 0 ? "-" : ""}${fmtFull(netMonthly)} /mo`}
        />
        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#10B981" }}><TrendingUp className="w-4 h-4" /></div>}
          iconBg="bg-emerald-50"
          label="Projected Annual Profit"
          value={fmt(projectedAnnualProfit)}
        />
        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#2563EB" }}><BarChart2 className="w-4 h-4" /></div>}
          iconBg="bg-blue-50"
          label="Gross Yield"
          value={fmtPct(grossYield)}
        />
        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#F59E0B" }}><DollarSign className="w-4 h-4" /></div>}
          iconBg="bg-amber-50"
          label="ROI"
          value={fmtPct(roi)}
        />
        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#EF4444" }}><Target className="w-4 h-4" /></div>}
          iconBg="bg-red-50"
          label="Upfront Cash Required"
          value={fmt(totalProjectCost)}
          sub={
            <Link
              href={`/property-manager/planning/sets/${id}/upfront-costs`}
              className="text-[10px] font-medium text-[#7C3AED] hover:underline flex items-center gap-0.5"
            >
              View cost breakdown
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          }
        />
        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#10B981" }}><ShieldCheck className="w-4 h-4" /></div>}
          iconBg="bg-emerald-50"
          label="Plan Health Score"
          value={loading ? <Skeleton className="h-6 w-20" /> : <HealthGauge score={healthScore} />}
        />
      </div>

      {/* ── B. Main grid ── */}
      <div className="flex flex-col xl:flex-row gap-4 items-start">

        {/* ── LEFT COLUMN ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">

          {/* Plan Summary */}
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : set ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <div style={{ color: "#2563EB" }}><Home className="w-4 h-4" /></div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Plan Summary</h3>
                </div>
                <Link
                  href={`/property-manager/planning/sets/${id}/assumptions`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                >
                  View full assumptions
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {/* Editable source fields */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Plan Name</span>
                  <InlineEditField
                    value={set.title}
                    label="Plan name"
                    placeholder="Add a plan name"
                    displayClassName="text-xs text-slate-800 font-semibold"
                    onSave={(v) => savePlanField("title", v)}
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Address</span>
                  <InlineEditField
                    value={set.address ?? ""}
                    label="Address"
                    placeholder="Add an address"
                    displayClassName="text-xs text-slate-800 font-semibold"
                    onSave={(v) => savePlanField("address", v)}
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Operation Profile</span>
                  <InlineEditSelect
                    value={set.operation_profile ?? ""}
                    label="Operation profile"
                    options={PROFILE_OPTIONS}
                    placeholder="Select a profile"
                    displayClassName="text-xs text-slate-800 font-semibold"
                    onSave={(v) => savePlanField("operation_profile", v)}
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Status</span>
                  <InlineEditSelect
                    value={set.status}
                    label="Status"
                    options={PLAN_STATUS_OPTIONS}
                    displayClassName="text-xs text-slate-800 font-semibold"
                    onSave={(v) => savePlanField("status", v)}
                  />
                </div>
                {/* Calculated outputs — read-only (never edited directly) */}
                {[
                  { label: "Net Yield", value: set.net_yield != null ? fmtPct(set.net_yield) : "—" },
                  { label: "Breakeven Month", value: set.breakeven_month != null ? `Month ${set.breakeven_month}` : "—" },
                  { label: "Gross Monthly", value: fmtFull(grossMonthly) },
                  { label: "Net Monthly", value: fmtFull(netMonthly) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                    <span className="text-xs text-slate-800 font-semibold truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Profitability Snapshot */}
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <div style={{ color: "#10B981" }}><TrendingUp className="w-4 h-4" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Profitability Snapshot</h3>
              </div>
              {hasProfitBreakdown ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={profitPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                        {profitPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ProfitTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 flex-1 w-full">
                    {profitPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          <span className="text-[10px] text-slate-600 truncate">{d.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-800 tabular-nums">{fmt(d.value)}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-slate-100 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">Net Annual Profit</span>
                        <span className="text-xs font-bold text-emerald-600">{fmt(projectedAnnualProfit)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-[10px] text-slate-500">Margin</span>
                        <span className="text-[10px] font-semibold text-slate-700">{fmtPct(noiMarginPct)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-sm text-slate-400">
                  No income or expense figures yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="w-full xl:w-[300px] flex-shrink-0 flex flex-col gap-4">

          {/* AI Insight Card */}
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 60%, #EFF6FF 100%)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-violet-900">AI Insight</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full">BETA</span>
              </div>

              {aiReview ? (
                <>
                  {aiReview.recommendation && (
                    <p className="text-xs text-violet-800 leading-relaxed mb-3">{aiReview.recommendation}</p>
                  )}
                  {(aiReview.strengths ?? []).slice(0, 2).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-violet-900">{s}</span>
                    </div>
                  ))}
                  <p className="text-[10px] font-semibold text-violet-700 mt-2 bg-violet-100 rounded-lg px-2 py-1">
                    Overall Score: {aiReview.overall_score}/100
                  </p>
                </>
              ) : (
                <p className="text-xs text-violet-700 leading-relaxed">
                  No AI review yet. Complete your assumptions and run an AI review to unlock insights.
                </p>
              )}

              <Link
                href={`/property-manager/planning/sets/${id}/ai-review`}
                className="mt-3 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors flex items-center justify-center"
              >
                {aiReview ? "View AI review" : "Run AI review"}
              </Link>
            </div>
          )}

          {/* Key Assumptions Snapshot */}
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Key Assumptions</h3>
                <Link
                  href={`/property-manager/planning/sets/${id}/assumptions`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                >
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {keyAssumptions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {keyAssumptions.map((ka) => (
                    <div key={ka.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{ka.label}</span>
                      <span className="text-[11px] font-semibold text-slate-800">{ka.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No assumptions set yet.</p>
              )}
            </div>
          )}

          {/* Pinned Notes */}
          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Pinned Notes</h3>
                <Link
                  href={`/property-manager/planning/sets/${id}/activity`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                >
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {(data?.notes ?? []).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {(data?.notes ?? []).map((note) => (
                    <div key={note.id} className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-2">{note.body}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{relDate(note.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No pinned notes yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── C. Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity */}
        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center">
                  <div style={{ color: "#64748B" }}><Clock className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              </div>
              <Link
                href={`/property-manager/planning/sets/${id}/activity`}
                className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(data?.activity ?? []).length > 0 ? (
              <div className="flex flex-col gap-3">
                {(data?.activity ?? []).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{act.title}</p>
                      {act.description && <p className="text-[11px] text-slate-500 truncate">{act.description}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">{relDate(act.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No activity yet.</p>
            )}
          </div>
        )}

        {/* Upcoming Tasks */}
        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
                  <div style={{ color: "#2563EB" }}><CheckCircle2 className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Upcoming Tasks</h3>
              </div>
              <Link
                href={`/property-manager/planning/sets/${id}/tasks`}
                className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                View all
              </Link>
            </div>
            {(data?.tasks ?? []).length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {(data?.tasks ?? []).map((task) => {
                  const dd = dueDateLabel(task.due_date)
                  return (
                    <div key={task.id} className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded border-2 border-slate-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{task.title}</p>
                        {task.owner_name && <p className="text-[10px] text-slate-400">{task.owner_name}</p>}
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${dd.cls}`}>{dd.label}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No upcoming tasks yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
