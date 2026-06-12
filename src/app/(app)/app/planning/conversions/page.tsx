"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
  Sparkles,
  Eye,
  ArrowRightLeft,
  FileText,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard, ProfileTag } from "@/components/planning/shared"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets, useUpdatePlanningSet } from "@/hooks/usePlanningsets"
import { useCreateProperty } from "@/hooks/useProperties"
import type { PlanningSet } from "@/types/database"
import { cn } from "@/lib/utils"

function money(n: number): string {
  return `£${Math.round(n).toLocaleString()}`
}

// Readiness heuristic from live fields
function readiness(set: PlanningSet): { pct: number; blockers: string[] } {
  const checks: { ok: boolean; label: string }[] = [
    { ok: set.gross_monthly_income > 0, label: "Add income model" },
    { ok: set.total_monthly_expenses > 0, label: "Add expenses" },
    { ok: set.upfront_cash_required > 0, label: "Add upfront costs" },
    { ok: set.net_monthly_income > 0, label: "Positive net cashflow" },
    { ok: set.risk_score < 60, label: "Resolve high risk" },
  ]
  const passed = checks.filter((c) => c.ok).length
  return { pct: Math.round((passed / checks.length) * 100), blockers: checks.filter((c) => !c.ok).map((c) => c.label) }
}

export default function ConversionsPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: sets = [], isLoading } = usePlanningSets(workspace?.id)
  const createProperty = useCreateProperty()
  const updateSet = useUpdatePlanningSet()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  // Convertible = not already converted
  const convertible = useMemo(
    () => sets.filter((s) => s.status !== "converted"),
    [sets]
  )
  const converted = sets.filter((s) => s.status === "converted")

  const selected = useMemo(
    () => convertible.find((s) => s.id === selectedId) ?? convertible[0] ?? null,
    [convertible, selectedId]
  )

  const readyCount = convertible.filter((s) => readiness(s).pct >= 80).length
  const blockedCount = convertible.filter((s) => readiness(s).pct < 60).length
  const potentialNet = convertible.reduce((a, s) => a + Math.max(s.net_monthly_income, 0), 0)
  const convRate = sets.length > 0 ? Math.round((converted.length / sets.length) * 100) : 0

  async function convertSet(set: PlanningSet) {
    if (!workspace?.id) return
    if (set.status === "converted") { showToast("Already converted"); return }
    setConverting(true)
    try {
      const created = await createProperty.mutateAsync({
        workspace_id: workspace.id,
        name: set.title,
        status: "active",
        is_demo: false,
        operation_profile: set.operation_profile,
        address_line1: set.address ?? null,
        postcode: set.postcode ?? null,
        target_rent: set.gross_monthly_income || null,
        notes: `Converted from planning set ${set.id}`,
      })
      // Link back: mark set converted + store property link
      await updateSet.mutateAsync({
        id: set.id,
        workspaceId: workspace.id,
        payload: {
          status: "converted",
          property_id: created.id,
          notes: `${set.notes ?? ""}\nConverted to property ${created.id}`.trim(),
        },
      })
      router.push(`/app/portfolio/properties/${created.id}`)
    } catch {
      showToast("Could not convert planning set")
      setConverting(false)
    }
  }

  return (
    <PlanningPageShell
      title="Conversion Pipeline"
      subtitle="Convert planning records into live Portfolio properties."
      actions={
        <Link
          href="/app/planning/sets"
          className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View all sets
        </Link>
      }
    >
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Cards — live */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Ready to Convert" value={isLoading ? "—" : String(readyCount)} subtitle={`${money(potentialNet)}/mo potential`} icon={CheckCircle2} iconColour="#10B981" />
        <KpiCard label="Converted" value={isLoading ? "—" : String(converted.length)} icon={Zap} iconColour="#7C3AED" />
        <KpiCard label="Conversion Rate" value={isLoading ? "—" : `${convRate}%`} subtitle={`${converted.length} of ${sets.length} sets`} icon={TrendingUp} iconColour="#2563EB" />
        <KpiCard label="Blocked" value={isLoading ? "—" : String(blockedCount)} subtitle="under 60% ready" icon={AlertTriangle} iconColour="#EF4444" />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-[13px] text-slate-400">Loading planning sets…</div>
      ) : convertible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-violet-50 flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-[14px] font-semibold text-slate-700">
            {sets.length === 0 ? "No planning sets to convert" : "All sets converted"}
          </p>
          <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm mx-auto">
            {sets.length === 0
              ? "Create and model a planning set first, then convert it into a live property."
              : "Every planning set has been converted into a property."}
          </p>
          {sets.length === 0 && (
            <Link href="/app/planning/wizard" className="inline-flex items-center gap-2 mt-4 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">
              New Planning Set
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: Queue */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-slate-900">Convertible Sets</h3>
              <span className="text-[12.5px] font-semibold text-slate-500">{convertible.length} set{convertible.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-3">
              {convertible.map((set) => {
                const r = readiness(set)
                return (
                  <div
                    key={set.id}
                    onClick={() => setSelectedId(set.id)}
                    className={cn(
                      "bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md",
                      selected?.id === set.id ? "border-[#7C3AED] shadow-sm" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-slate-900 mb-1">{set.title}</p>
                        <ProfileTag profileKey={set.operation_profile} size="sm" />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-bold text-slate-900">{set.net_monthly_income > 0 ? `${money(set.net_monthly_income)}/mo` : "—"}</p>
                        <p className="text-[11.5px] font-semibold text-slate-400">Risk {set.risk_score}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] text-slate-500">Readiness</span>
                        <span className="text-[12px] font-bold text-slate-700">{r.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: r.pct >= 80 ? "#10B981" : r.pct >= 60 ? "#7C3AED" : "#F59E0B" }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {r.blockers.slice(0, 3).map((b) => (
                        <span key={b} className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />{b}
                        </span>
                      ))}
                      <div className="ml-auto flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => router.push(`/app/planning/sets/${set.id}/overview`)} className="h-8 px-3 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] text-[12.5px] font-semibold hover:bg-[#7C3AED]/20 transition-colors">
                          Open Set
                        </button>
                        <ConfirmDialog
                          title="Convert to property?"
                          description={`This creates a live property "${set.title}" in your portfolio and marks the set converted.`}
                          confirmLabel="Convert"
                          confirmVariant="primary"
                          onConfirm={() => convertSet(set)}
                        >
                          {(open) => (
                            <ActionMenu
                              items={[
                                { label: "Open Planning Set", icon: Eye, onClick: () => router.push(`/app/planning/sets/${set.id}/overview`) },
                                { label: "Convert to Property", icon: ArrowRightLeft, onClick: open },
                              ]}
                            />
                          )}
                        </ConfirmDialog>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {blockedCount > 0 && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[12.5px] text-amber-800 flex-1">
                  {blockedCount} set{blockedCount !== 1 ? "s are" : " is"} below 60% readiness. Add missing income, expenses or upfront costs before converting.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Conversion Preview */}
          <div className="space-y-4">
            {selected && (
              <>
                <div className="bg-white rounded-2xl border-2 border-[#7C3AED]/30 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-slate-100">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-900">Conversion Preview</h3>
                      <p className="text-[11.5px] text-slate-500 truncate max-w-[180px]">{selected.title}</p>
                    </div>
                    {readiness(selected).pct >= 80 && (
                      <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Ready</span>
                    )}
                  </div>

                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[13px] font-semibold text-slate-700">Net / mo</p>
                      <p className="text-[18px] font-bold text-slate-900">{selected.net_monthly_income > 0 ? money(selected.net_monthly_income) : "—"}</p>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">What gets created</p>
                    <div className="space-y-2.5">
                      {[
                        { label: "Property record", detail: selected.address ?? selected.title },
                        { label: "Operation profile", detail: selected.operation_profile.replace(/_/g, " ") },
                        { label: "Target rent", detail: selected.gross_monthly_income > 0 ? `${money(selected.gross_monthly_income)}/mo` : "—" },
                      ].map((record) => (
                        <div key={record.label} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-slate-800">{record.label}</p>
                          </div>
                          <p className="text-[11.5px] text-slate-400 text-right max-w-[110px] truncate capitalize">{record.detail}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <ConfirmDialog
                        title="Convert to property?"
                        description={`This creates a live property "${selected.title}" in your portfolio and marks the set converted.`}
                        confirmLabel="Convert"
                        confirmVariant="primary"
                        onConfirm={() => convertSet(selected)}
                      >
                        {(open) => (
                          <button
                            onClick={open}
                            disabled={converting}
                            className="w-full h-10 rounded-xl bg-[#7C3AED] text-white text-[13.5px] font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                          >
                            <Sparkles className="w-4 h-4" />
                            {converting ? "Converting…" : "Convert to Property"}
                          </button>
                        )}
                      </ConfirmDialog>
                    </div>
                  </div>
                </div>

                {/* Readiness checklist */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-[14px] font-bold text-slate-900 mb-3">Readiness Checklist</h3>
                  {[
                    { ok: selected.gross_monthly_income > 0, label: "Income modelled" },
                    { ok: selected.total_monthly_expenses > 0, label: "Expenses added" },
                    { ok: selected.upfront_cash_required > 0, label: "Upfront costs set" },
                    { ok: selected.net_monthly_income > 0, label: "Positive net cashflow" },
                    { ok: selected.risk_score < 60, label: "Risk acceptable" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                      {c.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <p className="text-[12.5px] text-slate-700 flex-1">{c.label}</p>
                      <span className={cn("text-[11px] font-semibold", c.ok ? "text-emerald-600" : "text-amber-600")}>{c.ok ? "Done" : "Pending"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {converted.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-[14px] font-bold text-slate-900 mb-3">Recently Converted</h3>
                {converted.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => s.property_id ? router.push(`/app/portfolio/properties/${s.property_id}`) : router.push(`/app/planning/sets/${s.id}/overview`)}
                    className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 w-full text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate flex-1">{s.title}</p>
                    <span className="text-[11px] text-[#2563EB] shrink-0">View →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PlanningPageShell>
  )
}
