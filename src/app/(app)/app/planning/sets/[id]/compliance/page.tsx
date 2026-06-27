"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Edit2,
  AlertTriangle,
  Plus,
  ShieldCheck,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningComplianceItem, ComplianceStatus } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Status chip ───────────────────────────────────────────────────────────────

type ChipVariant = "emerald" | "blue" | "amber" | "slate" | "red"

const CHIP_CLASSES: Record<ChipVariant, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-[var(--color-brand-100)] text-[var(--brand)]",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-100 text-red-700",
}

const STATUS_VARIANT: Record<ComplianceStatus, ChipVariant> = {
  pending: "slate",
  estimated: "amber",
  quoted: "blue",
  confirmed: "blue",
  complete: "emerald",
  overdue: "red",
}

function StatusChip({ label, variant }: { label: string; variant: ChipVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${CHIP_CLASSES[variant]}`}>
      {label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const params = useParams()
  const id = params.id as string

  const [items, setItems] = useState<PlanningComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      // Validate set exists; planning_compliance_items is not yet provisioned (42P01) — swallow to empty.
      const [{ data: s, error: sErr }, { data: c, error: cErr }] = await Promise.all([
        supabase.from("planning_sets").select("id").eq("id", id).single(),
        supabase.from("planning_compliance_items").select("*").eq("planning_set_id", id).order("created_at"),
      ])
      if (sErr || !s) {
        setError("Planning set not found.")
        setLoading(false)
        return
      }
      setItems(cErr ? [] : ((c ?? []) as PlanningComplianceItem[]))
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

  const total = items.length
  const complete = items.filter((i) => i.status === "complete" || i.status === "confirmed").length
  const overdue = items.filter((i) => i.status === "overdue").length
  const overallScore = total > 0 ? Math.round((complete / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Compliance Score</div>
              <div className="text-xl font-bold text-slate-900">{overallScore}%</div>
              <div className="text-[10px] text-slate-400">Across {total} item{total === 1 ? "" : "s"}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Overdue Items</div>
              <div className="text-xl font-bold text-red-600">{overdue}</div>
              <div className="text-[11px] text-slate-400 font-medium">Require attention</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Complete</div>
              <div className="text-xl font-bold text-emerald-600">{complete}</div>
              <div className="text-[11px] text-slate-400 font-medium">of {total} items</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Outstanding</div>
              <div className="text-xl font-bold text-amber-600">{total - complete}</div>
              <div className="text-[11px] text-slate-400 font-medium">Items remaining</div>
            </div>
          </>
        )}
      </div>

      {/* ── Compliance table / empty state ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">6B</span>
            <h2 className="text-sm font-bold text-slate-900">Compliance</h2>
          </div>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add item
          </button>
        </div>

        {loading ? (
          <div className="p-5"><Skeleton className="h-80 w-full" /></div>
        ) : items.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-700">No compliance items yet</div>
            <p className="text-xs text-slate-400 max-w-sm">
              Track licensing, fire safety, EPC, gas and electrical requirements for this planning set.
            </p>
            <button className="mt-1 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add compliance item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Requirement</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Est. Cost</th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-2.5 font-semibold text-slate-800 max-w-[240px] truncate">{row.label}</td>
                    <td className="px-4 py-2.5 text-slate-500 capitalize">{row.requirement_type ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <StatusChip label={row.status} variant={STATUS_VARIANT[row.status] ?? "slate"} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                      {row.due_date ? new Date(row.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {row.estimated_cost != null ? `£${row.estimated_cost.toLocaleString("en-GB")}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-lg">
                        <Edit2 className="w-3 h-3 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
