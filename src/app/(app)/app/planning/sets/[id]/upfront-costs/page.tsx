"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Edit2,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import type { PlanningSet, PlanningUpfrontCost } from "@/lib/planning/types"

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtFull(n: number): string {
  return `£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number, dec = 1): string {
  return `${n.toFixed(dec)}%`
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Status chip ───────────────────────────────────────────────────────────────

type ChipVariant = "emerald" | "blue" | "amber" | "slate" | "red"

const CHIP_CLASSES: Record<ChipVariant, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-100 text-red-700",
}

function StatusChip({ label, variant }: { label: string; variant: ChipVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${CHIP_CLASSES[variant]}`}>
      {label}
    </span>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, color = "#10B981" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, value)}%`, background: color }}
        />
      </div>
      <span className="text-[10px] text-slate-500 tabular-nums w-8 text-right">{value}%</span>
    </div>
  )
}

// ── Semi-circular gauge ───────────────────────────────────────────────────────

function SemiGauge({ value }: { value: number }) {
  const capped = Math.max(0, Math.min(100, value))
  const color = capped >= 80 ? "#10B981" : capped >= 60 ? "#F59E0B" : "#EF4444"
  const label = capped >= 80 ? "Ready" : capped >= 60 ? "Partially Ready" : "Not Ready"
  // Semi-circle: 180 degrees, circumference of half-circle
  const r = 54
  const circ = Math.PI * r
  const dash = (capped / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path
            d="M 10,60 A 50,50 0 0 1 110,60"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10,60 A 50,50 0 0 1 110,60"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(capped / 100) * 157} 157`}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-xl font-bold text-slate-900">{capped}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Static cost rows ──────────────────────────────────────────────────────────

interface CostRow {
  label: string
  amount: number
  pct: number
  status: string
  statusVariant: ChipVariant
  completeness: number
}

const STATIC_COST_ROWS: CostRow[] = [
  { label: "Purchase Price", amount: 495000, pct: 64.3, status: "Confirmed", statusVariant: "emerald", completeness: 100 },
  { label: "Stamp Duty (2% surcharge)", amount: 24300, pct: 3.4, status: "Estimated", statusVariant: "blue", completeness: 100 },
  { label: "Legal Fees (Purchase)", amount: 2250, pct: 0.3, status: "Estimated", statusVariant: "blue", completeness: 80 },
  { label: "Broker Fees", amount: 3720, pct: 0.5, status: "Estimated", statusVariant: "blue", completeness: 75 },
  { label: "Refurb / Setup Costs", amount: 42000, pct: 5.8, status: "In Progress", statusVariant: "amber", completeness: 70 },
  { label: "Furnishing & Appliances", amount: 18000, pct: 2.5, status: "In Progress", statusVariant: "amber", completeness: 60 },
  { label: "Deposits, Utilities, Council Tax", amount: 2400, pct: 0.3, status: "Estimated", statusVariant: "blue", completeness: 90 },
  { label: "Contingency (5%)", amount: 25000, pct: 3.5, status: "Confirmed", statusVariant: "emerald", completeness: 100 },
  { label: "Sourcing Fees", amount: 3000, pct: 0.4, status: "Estimated", statusVariant: "blue", completeness: 60 },
  { label: "Mortgage Fees (Arrangement)", amount: 1810, pct: 0.3, status: "Estimated", statusVariant: "blue", completeness: 75 },
]

const CAPITAL_STACK = [
  { name: "Mortgage", value: 420000, color: "#2563EB" },
  { name: "Investor Cash", value: 162480, color: "#7C3AED" },
  { name: "Refurb Facility", value: 60000, color: "#F59E0B" },
  { name: "Other Costs", value: 52520, color: "#94A3B8" },
]

// ── Tooltip for pie ───────────────────────────────────────────────────────────

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-slate-700">{payload[0].name}</div>
      <div className="font-bold text-slate-900">{fmtFull(payload[0].value)}</div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UpfrontCostsPage() {
  const params = useParams()
  const id = params.id as string

  const [set, setSet] = useState<PlanningSet | null>(null)
  const [dbCosts, setDbCosts] = useState<PlanningUpfrontCost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [{ data: s, error: sErr }, { data: c }] = await Promise.all([
          supabase.from("planning_sets").select("*").eq("id", id).single(),
          supabase.from("planning_upfront_costs").select("*").eq("planning_set_id", id).order("created_at"),
        ])
        if (sErr || !s) { setError("Planning set not found."); return }
        setSet(s as PlanningSet)
        setDbCosts((c ?? []) as PlanningUpfrontCost[])
      } catch {
        setError("Failed to load data.")
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
        <Link href="/app/planning/sets" className="text-sm text-[#7C3AED] hover:underline">Back to planning sets</Link>
      </div>
    )
  }

  // Merge DB costs into display rows (DB takes priority if found, else show static)
  const totalUpfrontCash = dbCosts.length > 0
    ? dbCosts.reduce((s, c) => s + c.amount, 0)
    : 162480
  const complianceScore = set?.forecast_readiness_percent ?? 72
  const contingencyTarget = 25000
  const contingencyActual = dbCosts.find(c => c.label?.toLowerCase().includes("contingency"))?.amount ?? 25000

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            {/* 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total Upfront Cash</div>
              <div className="text-xl font-bold text-slate-900">{fmtFull(totalUpfrontCash)}</div>
              <Link
                href={`/app/planning/sets/${id}/upfront-costs`}
                className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5 mt-0.5"
              >
                View breakdown <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {/* 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Compliance Score</div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-slate-900">{complianceScore}%</div>
                <StatusChip label="Good" variant="emerald" />
              </div>
              <div className="text-[10px] text-slate-400">Based on {STATIC_COST_ROWS.length} cost items</div>
            </div>
            {/* 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Critical Compliance Items</div>
              <div className="text-xl font-bold text-slate-900">3</div>
              <div className="text-[11px] text-amber-600 font-medium">Require attention</div>
            </div>
            {/* 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Contingency Coverage</div>
              <div className="text-xl font-bold text-slate-900">{fmtPct((contingencyActual / totalUpfrontCash) * 100)}</div>
              <div className="text-[10px] text-slate-400">{fmtFull(contingencyActual)} of {fmtFull(contingencyTarget)} target</div>
            </div>
          </>
        )}
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="flex gap-5 items-start">

        {/* ── Left / centre ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Section 6A header + table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">6A</span>
                <h2 className="text-sm font-bold text-slate-900">Upfront Costs</h2>
              </div>
              <button className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 font-medium transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
                Edit all
              </button>
            </div>

            {loading ? (
              <div className="p-5"><Skeleton className="h-56 w-full" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cost Item</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Estimate (£)</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">% of Total</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide w-36">Completeness</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATIC_COST_ROWS.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{row.label}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 tabular-nums">{fmtFull(row.amount)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">{fmtPct(row.pct)}</td>
                        <td className="px-4 py-2.5">
                          <StatusChip label={row.status} variant={row.statusVariant} />
                        </td>
                        <td className="px-4 py-2.5 w-36">
                          <ProgressBar
                            value={row.completeness}
                            color={row.completeness === 100 ? "#10B981" : row.completeness >= 75 ? "#2563EB" : "#F59E0B"}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-lg">
                            <Edit2 className="w-3 h-3 text-slate-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* TOTAL row */}
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td className="px-4 py-3 font-bold text-slate-900 text-xs uppercase tracking-wide">Total Upfront Cash</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">{fmtFull(totalUpfrontCash)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-600">100%</td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3">
                        <ProgressBar value={88} color="#7C3AED" />
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tbody>
                </table>

                <div className="px-5 py-3">
                  <button className="inline-flex items-center gap-1.5 text-[11px] text-[#7C3AED] hover:underline font-medium">
                    <Plus className="w-3.5 h-3.5" />
                    Add Cost Item
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4 summary cards */}
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Completeness */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col items-center gap-2">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#7C3AED" strokeWidth="4"
                      strokeDasharray={`${(89 / 100) * 87.96} 87.96`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-800">89%</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-700 text-center">Upfront cost detail complete</div>
                <div className="text-[10px] text-slate-400">Target 100%</div>
              </div>
              {/* Blockers */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center">
                  <div style={{ color: "#EF4444" }}><AlertTriangle className="w-3.5 h-3.5" /></div>
                </div>
                <div className="text-xs font-bold text-slate-900">Blockers</div>
                <button className="text-[11px] text-[#7C3AED] hover:underline font-medium text-left">
                  2 items blocking full sign-off
                </button>
              </div>
              {/* Action Needed */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
                  <div style={{ color: "#F59E0B" }}><CheckCircle2 className="w-3.5 h-3.5" /></div>
                </div>
                <div className="text-xs font-bold text-slate-900">Action Needed</div>
                <button className="text-[11px] text-[#7C3AED] hover:underline font-medium text-left">
                  4 items require your attention
                </button>
              </div>
              {/* Documents */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
                  <div style={{ color: "#2563EB" }}><FileText className="w-3.5 h-3.5" /></div>
                </div>
                <div className="text-xs font-bold text-slate-900">Documents</div>
                <div className="flex flex-wrap gap-1">
                  {["Purchase Contract", "Cost Plan", "Mortgage DIP"].map((d) => (
                    <span key={d} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Capital Stack Summary */}
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Capital Stack Summary</h3>
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={CAPITAL_STACK}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {CAPITAL_STACK.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-semibold text-slate-500">Total Capital</span>
                    <span className="text-sm font-bold text-slate-900">£695,000</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  {CAPITAL_STACK.map((d) => (
                    <div key={d.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-xs text-slate-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800 tabular-nums">{fmtFull(d.value)}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-1 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      { label: "Total Property Cost", value: "£695,000" },
                      { label: "Total Upfront Cash", value: fmtFull(totalUpfrontCash) },
                      { label: "Leverage", value: "62.6%" },
                      { label: "Loan to Value", value: "2.6%" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400">{label}</span>
                        <span className="text-xs font-bold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">

          {/* Readiness to Launch */}
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Readiness to Launch</h3>
              <SemiGauge value={72} />
              <p className="text-[11px] text-slate-500 leading-relaxed mt-3 mb-4">
                You&apos;re on track, but a few critical items need attention before launch.
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Financial readiness", value: 85, color: "#10B981" },
                  { label: "Compliance readiness", value: 72, color: "#F59E0B" },
                  { label: "Documentation", value: 65, color: "#F59E0B" },
                  { label: "Overall readiness", value: 72, color: "#F59E0B" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] text-slate-600">{label}</span>
                      <span className="text-[10px] font-semibold text-slate-700">{value}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 rounded-xl border border-[#7C3AED] text-[#7C3AED] text-xs font-semibold hover:bg-violet-50 transition-colors flex items-center justify-center gap-1.5">
                View readiness plan <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Estimated Compliance Burden */}
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
                  <div style={{ color: "#F59E0B" }}><Sparkles className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Compliance Burden</h3>
              </div>
              <div className="text-2xl font-bold text-slate-900 my-2">38 Hours total</div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Licensing", hrs: 12, color: "#7C3AED" },
                  { label: "Fire Safety", hrs: 10, color: "#EF4444" },
                  { label: "Electrical & Gas", hrs: 8, color: "#F59E0B" },
                  { label: "HMO Obligations", hrs: 6, color: "#2563EB" },
                  { label: "Other", hrs: 2, color: "#94A3B8" },
                ].map(({ label, hrs, color }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-[11px] text-slate-600">{label}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{hrs} hrs</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                View workload breakdown <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
