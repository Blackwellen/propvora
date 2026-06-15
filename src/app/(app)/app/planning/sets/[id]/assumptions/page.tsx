"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Edit2,
  AlertTriangle,
  RefreshCw,
  Settings,
  Sliders,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { InlineEditCell } from "@/components/editing"

// ── Live schema row (planning_assumptions, FK planning_set_id) ─────────────────

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

// ── Field definitions (only live columns) ─────────────────────────────────────

type FieldKind = "money" | "pct" | "months" | "number"

interface FieldDef {
  key: keyof PlanningAssumptionRow
  label: string
  kind: FieldKind
  group: string
}

const FIELD_GROUPS: { key: string; label: string }[] = [
  { key: "acquisition", label: "Acquisition" },
  { key: "financing", label: "Financing" },
  { key: "tenancy", label: "Tenancy & Terms" },
  { key: "operating", label: "Operating Assumptions" },
]

const FIELDS: FieldDef[] = [
  { key: "property_purchase_price", label: "Property Purchase Price", kind: "money", group: "acquisition" },
  { key: "property_value", label: "Property Value", kind: "money", group: "acquisition" },
  { key: "monthly_mortgage", label: "Monthly Mortgage", kind: "money", group: "financing" },
  { key: "landlord_monthly_rent", label: "Landlord Monthly Rent", kind: "money", group: "financing" },
  { key: "contract_length_months", label: "Contract Length", kind: "months", group: "tenancy" },
  { key: "break_clause_months", label: "Break Clause", kind: "months", group: "tenancy" },
  { key: "rent_review_months", label: "Rent Review Interval", kind: "months", group: "tenancy" },
  { key: "void_allowance_pct", label: "Void Allowance", kind: "pct", group: "operating" },
  { key: "management_fee_pct", label: "Management Fee", kind: "pct", group: "operating" },
  { key: "occupancy_rate_pct", label: "Occupancy Rate", kind: "pct", group: "operating" },
  { key: "average_daily_rate", label: "Average Daily Rate", kind: "money", group: "operating" },
]

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtValue(value: number | null, kind: FieldKind): string {
  if (value == null) return "—"
  switch (kind) {
    case "money": return `£${value.toLocaleString("en-GB")}`
    case "pct": return `${value}%`
    case "months": return `${value} mo`
    default: return value.toLocaleString("en-GB")
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: React.ReactNode
  loading?: boolean
}

function KpiCard({ label, value, loading }: KpiCardProps) {
  if (loading) return <Skeleton className="h-20 rounded-2xl" />
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1 min-w-0">
      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-[17px] font-bold text-slate-900 leading-tight">{value}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlanningSetAssumptionsPage() {
  const params = useParams()
  const id = params.id as string

  const [row, setRow] = useState<PlanningAssumptionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    // planning_assumptions FK is planning_set_id (correct). Resilient: error → null.
    const { data, error: err } = await supabase
      .from("planning_assumptions")
      .select("*")
      .eq("planning_set_id", id)
      .maybeSingle()
    if (err) {
      setRow(null)
    } else {
      setRow((data ?? null) as unknown as PlanningAssumptionRow | null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  // Persist a single assumption. Scoped by planning_set_id (the FK that ties the
  // row to this set + workspace via RLS). Raw string in → numeric/null out.
  const saveField = useCallback(
    async (key: keyof PlanningAssumptionRow, raw: string) => {
      if (!id) return
      const next = raw.trim() === "" ? null : Number(raw)
      if (next != null && Number.isNaN(next)) throw new Error("Enter a valid number")
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from("planning_assumptions")
        .update({ [key]: next })
        .eq("planning_set_id", id)
        .select()
        .maybeSingle()
      if (err) throw new Error(err.message)
      // Reflect the saved value locally without a full refetch.
      setRow((prev) =>
        prev
          ? { ...prev, [key]: next }
          : (data as unknown as PlanningAssumptionRow | null)
      )
    },
    [id]
  )

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

  const setCount = FIELDS.filter((f) => row?.[f.key] != null).length
  const totalCount = FIELDS.length

  return (
    <div className="flex flex-col gap-6">

      {/* ── A. KPI Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          loading={loading}
          label="Property Value"
          value={fmtValue(row?.property_value ?? null, "money")}
        />
        <KpiCard
          loading={loading}
          label="Monthly Mortgage"
          value={fmtValue(row?.monthly_mortgage ?? null, "money")}
        />
        <KpiCard
          loading={loading}
          label="Occupancy Rate"
          value={fmtValue(row?.occupancy_rate_pct ?? null, "pct")}
        />
        <KpiCard
          loading={loading}
          label="Assumptions Set"
          value={`${setCount} / ${totalCount}`}
        />
      </div>

      {/* ── B. Main layout ────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-4 items-start">

        {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Section header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Assumptions Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage the assumptions that drive your financial model.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
                Bulk Edit
              </button>
              <button onClick={load} className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Assumptions by Category */}
          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : !row ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center justify-center text-center py-14 px-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Sliders className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No assumptions yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Set purchase, financing, tenancy and operating assumptions to drive this plan&apos;s forecast.</p>
                <button className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#7C3AED] hover:underline font-medium">
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit assumptions
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {FIELD_GROUPS.map((g) => {
                const fields = FIELDS.filter((f) => f.group === g.key)
                return (
                  <div key={g.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">{g.label}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-100">
                          {fields.map((f) => {
                            const current = row[f.key] as number | null
                            const prefix = f.kind === "money" ? "£" : undefined
                            const suffix =
                              f.kind === "pct" ? "%" : f.kind === "months" ? " mo" : ""
                            return (
                              <tr key={f.key as string} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-5 py-3 text-slate-700 font-medium">{f.label}</td>
                                <td className="px-5 py-2 text-right tabular-nums whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-1">
                                    <InlineEditCell
                                      value={current != null ? String(current) : ""}
                                      type="number"
                                      label={f.label}
                                      prefix={prefix}
                                      placeholder="Not set"
                                      validate={(v) =>
                                        v !== "" && Number.isNaN(Number(v))
                                          ? "Enter a valid number"
                                          : null
                                      }
                                      displayClassName="font-semibold text-slate-900 text-[12.5px]"
                                      onSave={(v) => saveField(f.key, v)}
                                    />
                                    {suffix && current != null && (
                                      <span className="text-[12.5px] font-semibold text-slate-500">{suffix.trim()}</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
        <div className="w-full xl:w-[280px] flex-shrink-0 flex flex-col gap-4">

          {/* Completeness */}
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Completeness</h3>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-600">Assumptions provided</span>
                <span className="text-[11px] font-bold text-slate-800">{setCount} / {totalCount}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#7C3AED] transition-all"
                  style={{ width: `${totalCount ? (setCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {setCount === totalCount
                  ? "All assumptions provided."
                  : `${totalCount - setCount} assumption${totalCount - setCount !== 1 ? "s" : ""} still unset.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
