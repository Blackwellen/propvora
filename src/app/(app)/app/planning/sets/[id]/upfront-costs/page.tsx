"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Edit2,
  Plus,
  ArrowRight,
  AlertTriangle,
  Wallet,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { createClient } from "@/lib/supabase/client"

// ── Live schema row (planning_upfront_costs is profile-scoped) ─────────────────

interface UpfrontCostRow {
  id: string
  label: string
  amount: number
  notes: string | null
  sort_order: number | null
}

const COST_COLORS = ["#2563EB", "#7C3AED", "#F59E0B", "#10B981", "#06B6D4", "#EF4444", "#84CC16", "#F97316", "#8B5CF6", "#94A3B8"]

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

  const [dbCosts, setDbCosts] = useState<UpfrontCostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      // Validate the set exists (workspace-scoped). Upfront costs are profile-scoped
      // (no planning_set_id column) so that query is made resilient → empty.
      const { data: s, error: sErr } = await supabase
        .from("planning_sets")
        .select("id")
        .eq("id", id)
        .single()
      if (sErr || !s) {
        setError("Planning set not found.")
        setLoading(false)
        return
      }
      const { data: c, error: cErr } = await supabase
        .from("planning_upfront_costs")
        .select("*")
        .eq("planning_set_id", id)
        .order("sort_order")
      setDbCosts(cErr ? [] : ((c ?? []) as unknown as UpfrontCostRow[]))
      setLoading(false)
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
        <Link href="/property-manager/planning/sets" className="text-sm text-[#7C3AED] hover:underline">Back to planning sets</Link>
      </div>
    )
  }

  const totalUpfrontCash = dbCosts.reduce((s, c) => s + (c.amount ?? 0), 0)
  const stackData = dbCosts.map((c, i) => ({ name: c.label, value: c.amount ?? 0, color: COST_COLORS[i % COST_COLORS.length] }))
  const hasCosts = dbCosts.length > 0

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5 min-w-0">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total Upfront Cash</div>
              <div className="text-xl font-bold text-slate-900">{fmtFull(totalUpfrontCash)}</div>
              <div className="text-[11px] text-slate-400">{dbCosts.length} cost item{dbCosts.length !== 1 ? "s" : ""}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5 min-w-0">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Cost Items</div>
              <div className="text-xl font-bold text-slate-900">{dbCosts.length}</div>
              <div className="text-[11px] text-slate-400">Recorded for this set</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5 min-w-0">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Largest Item</div>
              <div className="text-xl font-bold text-slate-900">
                {hasCosts ? fmtFull(Math.max(...dbCosts.map((c) => c.amount ?? 0))) : "—"}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {hasCosts ? [...dbCosts].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0].label : "No items yet"}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5 min-w-0">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Average Item</div>
              <div className="text-xl font-bold text-slate-900">
                {hasCosts ? fmtFull(totalUpfrontCash / dbCosts.length) : "—"}
              </div>
              <div className="text-[11px] text-slate-400">Per cost line</div>
            </div>
          </>
        )}
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">

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
            ) : !hasCosts ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No upfront cost items yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Add purchase, legal, refurb and other one-off costs to build the upfront cash requirement.</p>
                <button className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#7C3AED] hover:underline font-medium">
                  <Plus className="w-3.5 h-3.5" />
                  Add Cost Item
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cost Item</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Estimate (£)</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">% of Total</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Notes</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbCosts.map((row, i) => (
                      <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COST_COLORS[i % COST_COLORS.length] }} />
                            {row.label}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 tabular-nums">{fmtFull(row.amount ?? 0)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">
                          {totalUpfrontCash > 0 ? fmtPct(((row.amount ?? 0) / totalUpfrontCash) * 100) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 truncate max-w-[160px]">{row.notes ?? "—"}</td>
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

          {/* Capital Stack Summary (driven from real cost lines) */}
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Upfront Cost Breakdown</h3>
              {!hasCosts ? (
                <div className="h-[160px] flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">Add cost items to see the breakdown</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative flex-shrink-0">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={stackData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={72}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {stackData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-semibold text-slate-500">Total</span>
                      <span className="text-sm font-bold text-slate-900">{fmtFull(totalUpfrontCash)}</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full flex flex-col gap-2">
                    {stackData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          <span className="text-xs text-slate-600 truncate">{d.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800 tabular-nums flex-shrink-0">{fmtFull(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="w-full xl:w-[280px] flex-shrink-0 flex flex-col gap-4">

          {/* Cost concentration */}
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Top Cost Items</h3>
              {!hasCosts ? (
                <p className="text-xs text-slate-400">No cost items recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {[...dbCosts]
                    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
                    .slice(0, 6)
                    .map((c) => {
                      const pct = totalUpfrontCash > 0 ? ((c.amount ?? 0) / totalUpfrontCash) * 100 : 0
                      return (
                        <div key={c.id}>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] text-slate-600 truncate max-w-[150px]">{c.label}</span>
                            <span className="text-[10px] font-semibold text-slate-700">{fmtFull(c.amount ?? 0)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
              <button className="mt-4 w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                View full breakdown <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
