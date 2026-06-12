"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  X,
  Check,
  Settings,
  Layers,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import type { PlanningAssumption, PlanningSet } from "@/lib/planning/types"

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, unit?: string | null): string {
  if (n == null) return "—"
  const u = unit ?? ""
  if (u === "£" || u === "GBP") return `£${n.toLocaleString("en-GB")}`
  if (u === "%" || u === "percent") return `${n.toFixed(1)}%`
  return `${n.toLocaleString("en-GB")}${u ? ` ${u}` : ""}`
}

function relDate(iso: string): string {
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 30) return `${diffDays}d ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "complete" | "review" | "incomplete" | string }) {
  const map: Record<string, string> = {
    complete: "bg-emerald-100 text-emerald-700",
    review: "bg-amber-100 text-amber-700",
    incomplete: "bg-red-100 text-red-700",
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
        map[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {status === "complete" && <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />}
      {status === "review" && <Clock className="w-2.5 h-2.5 mr-0.5" />}
      {status === "incomplete" && <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />}
      {status}
    </span>
  )
}

// ── Confidence dots ───────────────────────────────────────────────────────────

function ConfidenceDots({ level }: { level: "low" | "medium" | "high" | null }) {
  const filled = level === "high" ? 4 : level === "medium" ? 3 : level === "low" ? 1 : 0
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= filled ? "bg-[#7C3AED]" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  )
}

// ── Variance indicator ────────────────────────────────────────────────────────

function VarianceCell({ variance, pct }: { variance: number; pct: number }) {
  const positive = variance >= 0
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}{variance.toLocaleString("en-GB")} ({positive ? "+" : ""}{pct.toFixed(1)}%)
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  assumption: PlanningAssumption
  onClose: () => void
  onSave: (id: string, value: number) => Promise<void>
}

function EditModal({ assumption, onClose, onSave }: EditModalProps) {
  const [val, setVal] = useState(String(assumption.value ?? ""))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const parsed = parseFloat(val)
    if (isNaN(parsed)) return
    setSaving(true)
    await onSave(assumption.id, parsed)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Edit Assumption</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-600 block mb-1.5">{assumption.label}</label>
          <div className="relative">
            {assumption.unit === "£" || assumption.unit === "GBP" ? (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            ) : null}
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                assumption.unit === "£" || assumption.unit === "GBP" ? "pl-7" : ""
              }`}
              autoFocus
            />
            {assumption.unit && assumption.unit !== "£" && assumption.unit !== "GBP" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{assumption.unit}</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Type: {assumption.assumption_type} · Source: {assumption.source ?? "Manual entry"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AI Suggestion Confirm Modal ───────────────────────────────────────────────

interface AiConfirmModalProps {
  suggestion: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

function AiConfirmModal({ suggestion, onConfirm, onClose }: AiConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Apply AI Suggestion?</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-5">{suggestion}</p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Applying…" : "Apply suggestion"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Assumption group definition ───────────────────────────────────────────────

interface AssumptionGroup {
  key: string
  label: string
  icon: React.ReactNode
  iconBg: string
  status: "complete" | "review" | "incomplete"
  assumptions: PlanningAssumption[]
}

function groupAssumptions(all: PlanningAssumption[]): AssumptionGroup[] {
  const groups: { key: string; label: string; icon: React.ReactNode; iconBg: string }[] = [
    { key: "acquisition", label: "Acquisition Assumptions", icon: <Home className="w-3.5 h-3.5" />, iconBg: "bg-blue-50" },
    { key: "financing", label: "Financing Assumptions", icon: <DollarSign className="w-3.5 h-3.5" />, iconBg: "bg-violet-50" },
    { key: "revenue", label: "Revenue Assumptions", icon: <TrendingUp className="w-3.5 h-3.5" />, iconBg: "bg-emerald-50" },
    { key: "rent", label: "Rent Assumptions", icon: <Layers className="w-3.5 h-3.5" />, iconBg: "bg-teal-50" },
    { key: "occupancy", label: "Occupancy Assumptions", icon: <Target className="w-3.5 h-3.5" />, iconBg: "bg-amber-50" },
    { key: "management", label: "Management Assumptions", icon: <Settings className="w-3.5 h-3.5" />, iconBg: "bg-orange-50" },
    { key: "refinance", label: "Refinance Assumptions", icon: <RefreshCw className="w-3.5 h-3.5" />, iconBg: "bg-indigo-50" },
    { key: "growth", label: "Growth Assumptions", icon: <TrendingUp className="w-3.5 h-3.5" />, iconBg: "bg-green-50" },
    { key: "contingency", label: "Contingency Assumptions", icon: <AlertTriangle className="w-3.5 h-3.5" />, iconBg: "bg-red-50" },
    { key: "sensitivity", label: "Sensitivity Guardrails", icon: <ShieldIcon className="w-3.5 h-3.5" />, iconBg: "bg-slate-100" },
  ]

  return groups.map((g) => {
    const items = all.filter((a) => a.assumption_type === g.key)
    const highConf = items.filter((a) => a.confidence === "high").length
    const total = items.length
    const status: "complete" | "review" | "incomplete" =
      total === 0
        ? "incomplete"
        : highConf === total
        ? "complete"
        : highConf > 0
        ? "review"
        : "incomplete"
    return { ...g, assumptions: items, status }
  })
}

// icon components used in groupAssumptions (inline)
function Home({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function DollarSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}
function Target({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  loading?: boolean
  wide?: boolean
}

function KpiCard({ label, value, sub, loading, wide }: KpiCardProps) {
  if (loading) {
    return <Skeleton className={`h-20 rounded-2xl ${wide ? "col-span-2" : ""}`} />
  }
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-[17px] font-bold text-slate-900 leading-tight">{value}</div>
      {sub && <div>{sub}</div>}
    </div>
  )
}

function BenchmarkChip({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {label}
    </span>
  )
}

// ── Assumptions Comparison row ────────────────────────────────────────────────

interface CompRow {
  metric: string
  current: string
  benchmark: string
  variance: number
  pct: number
  favourable: boolean | null
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface PageData {
  set: PlanningSet
  assumptions: PlanningAssumption[]
}

type EditingState = {
  assumption: PlanningAssumption
} | null

type AiConfirmState = {
  suggestion: string
  index: number
} | null

export default function PlanningSetAssumptionsPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingState, setEditingState] = useState<EditingState>(null)
  const [aiConfirmState, setAiConfirmState] = useState<AiConfirmState>(null)

  const supabase = createClient()

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [
        { data: set, error: setErr },
        { data: assumptions },
      ] = await Promise.all([
        supabase.from("planning_sets").select("*").eq("id", id).single(),
        supabase.from("planning_assumptions").select("*").eq("planning_set_id", id).order("assumption_type"),
      ])
      if (setErr || !set) {
        setError("Planning set not found.")
        return
      }
      setData({
        set: set as PlanningSet,
        assumptions: (assumptions ?? []) as PlanningAssumption[],
      })
    } catch {
      setError("Failed to load assumptions.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function saveAssumption(assumptionId: string, value: number) {
    const { error: err } = await supabase
      .from("planning_assumptions")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", assumptionId)
    if (!err) {
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          assumptions: prev.assumptions.map((a) =>
            a.id === assumptionId ? { ...a, value } : a
          ),
        }
      })
    }
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

  // ── Derived values ───────────────────────────────────────────────────────────

  const assumptions = data?.assumptions ?? []
  const groups = groupAssumptions(assumptions)

  const getVal = (types: string[], labelFrags: string[]): number | null => {
    const a = assumptions.find(
      (x) =>
        types.includes(x.assumption_type) ||
        labelFrags.some((f) => x.label.toLowerCase().includes(f))
    )
    return a?.value ?? null
  }

  const avgRent = getVal(["revenue", "rent"], ["rent", "pcm", "room"])
  const occupancy = getVal(["occupancy"], ["occupancy"])
  const rentGrowth = getVal(["growth", "rent"], ["rent growth", "growth"])
  const mgmtFee = getVal(["management"], ["management", "mgmt"])
  const interestRate = getVal(["financing"], ["interest rate", "interest"])
  const purchasePrice = getVal(["acquisition"], ["purchase price", "purchase"])
  const loanAmount = getVal(["financing"], ["loan", "mortgage"])

  // DSCR: (NOI / Annual Debt Service)
  const annualNOI = (data?.set.net_monthly ?? 0) * 12
  const annualDebt = (interestRate != null && loanAmount != null)
    ? loanAmount * (interestRate / 100)
    : 0
  const dscr = annualDebt > 0 ? annualNOI / annualDebt : 0

  // Total dev cost (upfront_cash from set)
  const totalDevCost = data?.set.upfront_cash ?? 0

  // IRR 5yr (simplified: annual cashflow * 5 / upfront cash)
  const irr5yr = totalDevCost > 0
    ? (annualNOI * 5 - totalDevCost) / totalDevCost * 100
    : 0

  // Stabilised NOI
  const stabNOI = data?.set.net_monthly ?? 0

  // Status breakdown for donut
  const completeCount = groups.filter((g) => g.status === "complete").length
  const reviewCount = groups.filter((g) => g.status === "review").length
  const incompleteCount = groups.filter((g) => g.status === "incomplete").length
  const statusPieData = [
    { name: "Complete", value: completeCount, color: "#10B981" },
    { name: "Review", value: reviewCount, color: "#F59E0B" },
    { name: "Incomplete", value: incompleteCount, color: "#EF4444" },
  ].filter((d) => d.value > 0)

  // Comparison table rows (benchmark = market average proxies)
  const compRows: CompRow[] = [
    {
      metric: "Average Rent / Room",
      current: avgRent != null ? `£${avgRent.toLocaleString("en-GB")} PCM` : "—",
      benchmark: "£650 PCM",
      variance: avgRent != null ? avgRent - 650 : 0,
      pct: avgRent != null && avgRent > 0 ? ((avgRent - 650) / 650) * 100 : 0,
      favourable: avgRent != null ? avgRent >= 650 : null,
    },
    {
      metric: "Stabilised Occupancy",
      current: occupancy != null ? `${occupancy}%` : "—",
      benchmark: "92%",
      variance: occupancy != null ? occupancy - 92 : 0,
      pct: occupancy != null ? occupancy - 92 : 0,
      favourable: occupancy != null ? occupancy >= 92 : null,
    },
    {
      metric: "Rent Growth p.a.",
      current: rentGrowth != null ? `${rentGrowth}%` : "—",
      benchmark: "3.5%",
      variance: rentGrowth != null ? rentGrowth - 3.5 : 0,
      pct: rentGrowth != null ? rentGrowth - 3.5 : 0,
      favourable: rentGrowth != null ? rentGrowth >= 3.5 : null,
    },
    {
      metric: "Management Fee",
      current: mgmtFee != null ? `${mgmtFee}%` : "—",
      benchmark: "10%",
      variance: mgmtFee != null ? -(mgmtFee - 10) : 0,
      pct: mgmtFee != null ? -(mgmtFee - 10) : 0,
      favourable: mgmtFee != null ? mgmtFee <= 10 : null,
    },
    {
      metric: "Interest Rate",
      current: interestRate != null ? `${interestRate}%` : "—",
      benchmark: "5.5%",
      variance: interestRate != null ? -(interestRate - 5.5) : 0,
      pct: interestRate != null ? -(interestRate - 5.5) : 0,
      favourable: interestRate != null ? interestRate <= 5.5 : null,
    },
  ]

  // AI suggestions
  const aiSuggestions = [
    "Consider increasing the rent growth assumption from 3% to 3.8% based on recent Nottingham market data.",
    "Your management fee (12%) exceeds market benchmark (10%) — renegotiating could add £240/month to net cashflow.",
    "Occupancy assumption of 88% may be conservative; comparable HMOs in NG1 average 93% stabilised occupancy.",
  ]

  // Validation warnings
  const warnings = [
    { label: "Interest rate not set", severity: "high", group: "Financing" },
    { label: "Management fee marked Review — confirm with agent", severity: "medium", group: "Management" },
    { label: "No exit cap rate assumption provided", severity: "medium", group: "Refinance" },
  ]

  // Sources
  const sources = [
    { label: "Rightmove Market Report Q2 2026", type: "report" },
    { label: "Agent HMO comparables - NG1", type: "document" },
    { label: "Broker rate sheet June 2026", type: "document" },
  ]

  // Versions (static mock — would come from planning_assumption_versions table)
  const versions = [
    { num: 8, name: "Post-survey revision", updatedBy: "You", updated: "2026-06-09", status: "active", changes: 4 },
    { num: 7, name: "Pre-survey baseline", updatedBy: "You", updated: "2026-05-30", status: "archived", changes: 2 },
    { num: 6, name: "Broker rates update", updatedBy: "You", updated: "2026-05-12", status: "archived", changes: 1 },
    { num: 5, name: "Initial assumptions", updatedBy: "You", updated: "2026-04-28", status: "archived", changes: 11 },
  ]

  return (
    <>
      {/* ── Edit Modal ── */}
      {editingState && (
        <EditModal
          assumption={editingState.assumption}
          onClose={() => setEditingState(null)}
          onSave={saveAssumption}
        />
      )}

      {/* ── AI Confirm Modal ── */}
      {aiConfirmState && (
        <AiConfirmModal
          suggestion={aiConfirmState.suggestion}
          onConfirm={async () => {
            /* In production: apply suggestion to relevant assumption */
          }}
          onClose={() => setAiConfirmState(null)}
        />
      )}

      <div className="flex flex-col gap-6">

        {/* ── A. KPI Strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">

          <KpiCard
            loading={loading}
            label="Stabilised NOI (Annual)"
            value={loading ? <Skeleton className="h-6 w-20" /> : `£${(stabNOI * 12).toLocaleString("en-GB")}`}
            sub={<BenchmarkChip label="vs benchmark" positive={stabNOI * 12 > 30000} />}
          />
          <KpiCard
            loading={loading}
            label="Avg Rent / Room (PCM)"
            value={loading ? <Skeleton className="h-6 w-20" /> : fmt(avgRent, "£")}
            sub={<BenchmarkChip label="vs £650 benchmark" positive={(avgRent ?? 0) >= 650} />}
          />
          <KpiCard
            loading={loading}
            label="Stabilised Occupancy"
            value={loading ? <Skeleton className="h-6 w-20" /> : fmt(occupancy, "%")}
            sub={<BenchmarkChip label="vs 92% benchmark" positive={(occupancy ?? 0) >= 92} />}
          />
          <KpiCard
            loading={loading}
            label="DSCR (Stabilised)"
            value={loading ? <Skeleton className="h-6 w-20" /> : dscr > 0 ? `${dscr.toFixed(2)}x` : "—"}
            sub={
              <span className={`text-[10px] font-semibold ${dscr >= 1.25 ? "text-emerald-600" : dscr > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {dscr >= 1.25 ? "Healthy coverage" : dscr > 0 ? "Below threshold" : "No data"}
              </span>
            }
          />
          <KpiCard
            loading={loading}
            label="Total Development Cost"
            value={loading ? <Skeleton className="h-6 w-20" /> : `£${totalDevCost.toLocaleString("en-GB")}`}
          />
          <KpiCard
            loading={loading}
            label="IRR (5-Year)"
            value={loading ? <Skeleton className="h-6 w-20" /> : irr5yr > 0 ? `${irr5yr.toFixed(1)}%` : "—"}
            sub={<BenchmarkChip label="+vs 15% hurdle" positive={irr5yr >= 15} />}
          />

          {/* Benchmark selector */}
          <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-4 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Benchmark</div>
            <div className="text-xs font-bold text-slate-900 leading-tight mt-1">Nottingham HMO (Premium)</div>
            <button className="mt-2 text-[10px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5 self-start">
              Change benchmark
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* ── B. Main layout ────────────────────────────────────────────────── */}
        <div className="flex gap-4 items-start">

          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Assumptions Overview</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage and validate all assumptions that drive your financial model.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </button>
                <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                  Bulk Edit
                </button>
                <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Version 8 (Current)
                </div>
                <button onClick={load} className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Assumptions by Category */}
            {loading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_100px_120px_80px_40px] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Assumption Group</span>
                  <span>Status</span>
                  <span>Key Value</span>
                  <span>Confidence</span>
                  <span />
                </div>

                {groups.map((group) => {
                  const isOpen = expandedGroups.has(group.key)
                  const primaryVal = group.assumptions[0]

                  return (
                    <div key={group.key} className="border-b border-slate-100 last:border-0">
                      {/* Group row */}
                      <div
                        className="grid grid-cols-[1fr_100px_120px_80px_40px] gap-3 px-4 py-3 items-center hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => toggleGroup(group.key)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${group.iconBg}`}>
                            <div style={{ color: "#64748B" }}>{group.icon}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{group.label}</div>
                            <div className="text-[10px] text-slate-400">{group.assumptions.length} assumption{group.assumptions.length !== 1 ? "s" : ""}</div>
                          </div>
                        </div>
                        <div><StatusBadge status={group.status} /></div>
                        <div className="text-xs text-slate-600 truncate">
                          {primaryVal ? (
                            <span className="font-semibold">{fmt(primaryVal.value, primaryVal.unit)}</span>
                          ) : (
                            <span className="text-slate-400">No data</span>
                          )}
                        </div>
                        <div>
                          <ConfidenceDots level={primaryVal?.confidence ?? null} />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (primaryVal) setEditingState({ assumption: primaryVal })
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                          </button>
                          <div className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                      </div>

                      {/* Expanded rows */}
                      {isOpen && (
                        <div className="bg-slate-50/60 border-t border-slate-100">
                          {group.assumptions.length > 0 ? (
                            group.assumptions.map((a) => (
                              <div
                                key={a.id}
                                className="grid grid-cols-[1fr_100px_120px_80px_40px] gap-3 px-4 py-2.5 items-center border-b border-slate-100 last:border-0 hover:bg-white/60 transition-colors group/row"
                              >
                                <div className="pl-9 min-w-0">
                                  <div className="text-xs text-slate-700 font-medium truncate">{a.label}</div>
                                  {a.source && (
                                    <div className="text-[10px] text-slate-400 truncate">Source: {a.source}</div>
                                  )}
                                </div>
                                <div>
                                  <StatusBadge
                                    status={
                                      a.confidence === "high"
                                        ? "complete"
                                        : a.confidence === "medium"
                                        ? "review"
                                        : "incomplete"
                                    }
                                  />
                                </div>
                                <div className="text-xs font-semibold text-slate-800 tabular-nums">
                                  {fmt(a.value, a.unit)}
                                </div>
                                <div><ConfidenceDots level={a.confidence} /></div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setEditingState({ assumption: a })}
                                    className="p-1 rounded-lg hover:bg-slate-200 transition-colors opacity-0 group-hover/row:opacity-100"
                                  >
                                    <Edit2 className="w-3 h-3 text-slate-500" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="pl-12 py-2.5 text-xs text-slate-400">No assumptions in this group yet.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add group button */}
                <div className="px-4 py-3 border-t border-slate-100">
                  <button className="inline-flex items-center gap-1.5 text-xs text-[#7C3AED] hover:underline font-medium">
                    <Plus className="w-3.5 h-3.5" />
                    Add Assumption Group
                  </button>
                </div>
              </div>
            )}

            {/* Assumptions Versions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Assumption Versions</h3>
                <button className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5">
                  View all versions
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5 text-left">Version</th>
                      <th className="px-4 py-2.5 text-left">Name / Note</th>
                      <th className="px-4 py-2.5 text-left">Updated By</th>
                      <th className="px-4 py-2.5 text-left">Updated</th>
                      <th className="px-4 py-2.5 text-left">Status</th>
                      <th className="px-4 py-2.5 text-left">Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.num} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-800">V{v.num}</td>
                        <td className="px-4 py-2.5 text-slate-600">{v.name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{v.updatedBy}</td>
                        <td className="px-4 py-2.5 text-slate-500">{v.updated}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              v.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{v.changes} fields</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assumptions Comparison Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Benchmark Comparison</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Current assumptions vs Nottingham HMO (Premium) benchmark</p>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { color: "bg-emerald-400", label: "Favourable" },
                    { color: "bg-red-400", label: "Unfavourable" },
                    { color: "bg-slate-300", label: "Neutral" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${l.color}`} />
                      <span className="text-[10px] text-slate-500">{l.label}</span>
                    </div>
                  ))}
                  <button className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5">
                    View full comparison
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5 text-left">Key Metric</th>
                      <th className="px-4 py-2.5 text-left">Current (V8)</th>
                      <th className="px-4 py-2.5 text-left">Benchmark</th>
                      <th className="px-4 py-2.5 text-left">Variance</th>
                      <th className="px-4 py-2.5 text-left">vs Benchmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compRows.map((row) => (
                      <tr key={row.metric} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{row.metric}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{row.current}</td>
                        <td className="px-4 py-2.5 text-slate-500">{row.benchmark}</td>
                        <td className="px-4 py-2.5">
                          {row.favourable !== null ? (
                            <VarianceCell variance={row.variance} pct={row.pct} />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.favourable !== null ? (
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.favourable
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {row.favourable ? "Favourable" : "Unfavourable"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Neutral</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
          <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">

            {/* Assumptions Status Donut */}
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Assumptions Status</h3>
                  <button className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5">
                    View details
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <ResponsiveContainer width={80} height={80}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={25} outerRadius={38} dataKey="value" paddingAngle={2}>
                        {statusPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => `${v} groups`}
                        contentStyle={{ borderRadius: 10, fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 flex-1">
                    {[
                      { label: "Complete", count: completeCount, color: "#10B981" },
                      { label: "Review", count: reviewCount, color: "#F59E0B" },
                      { label: "Incomplete", count: incompleteCount, color: "#EF4444" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-[11px] text-slate-600">{s.label}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800">{s.count}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      {groups.length} total groups
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Validation Warnings</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-xl px-3 py-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                          w.severity === "high" ? "bg-red-500" : "bg-amber-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-700 font-medium leading-tight">{w.label}</p>
                        <p className="text-[10px] text-slate-400">{w.group}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-2 text-[11px] text-amber-700 hover:underline font-medium flex items-center gap-0.5">
                  View all warnings
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* AI Suggestions */}
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
                style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-violet-900">AI Suggestions</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className="bg-white/70 rounded-xl px-3 py-2.5 border border-violet-100">
                      <p className="text-[11px] text-violet-900 leading-relaxed mb-1.5 line-clamp-3">{s}</p>
                      <button
                        onClick={() => setAiConfirmState({ suggestion: s, index: i })}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 hover:text-violet-900 transition-colors"
                      >
                        <Check className="w-2.5 h-2.5" />
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assumptions Sources */}
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Assumptions Sources</h3>
                  <button className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5">
                    Manage
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {sources.map((src, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-[11px] text-slate-600 truncate">{src.label}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-3 w-full py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add source
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
