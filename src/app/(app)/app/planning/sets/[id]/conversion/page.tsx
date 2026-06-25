"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  AlertCircle,
  Workflow,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useCreateProperty } from "@/hooks/useProperties"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"

interface ConversionSet {
  operation_profile: string | null
  status: string | null
  gross_monthly_income: number | null
  net_monthly_income: number | null
  upfront_cash_required: number | null
  address: string | null
  title: string | null
  property_id: string | null
}

interface DerivedStep {
  id: string
  label: string
  status: "complete" | "pending" | "blocked"
  blocker?: boolean
  completed_at?: string | null
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: React.ReactNode
  sub?: string
  loading?: boolean
}

function KpiCard({ label, value, sub, loading }: KpiProps) {
  if (loading) return <Skeleton className="h-24 w-full" />
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <span className="text-[17px] font-bold text-slate-900 leading-tight">{value}</span>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  )
}

// ── Readiness Gauge ───────────────────────────────────────────────────────────

function ReadinessGauge({ pct }: { pct: number }) {
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444"
  const label = pct >= 80 ? "Good" : pct >= 50 ? "Watch" : "At Risk"
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52"
            fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{pct}%</span>
          <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
        </div>
      </div>
      <span className="text-xs text-slate-500 font-medium">Conversion Readiness</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConversionPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { workspace } = useWorkspace()
  const createProperty = useCreateProperty()

  const [set, setSet] = useState<ConversionSet | null>(null)
  const [hasAiReview, setHasAiReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      // Readiness is derived from the set's real state — no separate checklist table.
      const [{ data: s }, { count }] = await Promise.all([
        supabase
          .from("planning_sets")
          .select("operation_profile, status, gross_monthly_income, net_monthly_income, upfront_cash_required, address, title, property_id")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("planning_ai_reviews")
          .select("id", { count: "exact", head: true })
          .eq("planning_set_id", id),
      ])
      setSet((s ?? null) as ConversionSet | null)
      setHasAiReview((count ?? 0) > 0)
      setLoading(false)
    }
    load()
  }, [id])

  const alreadyConverted = set?.status === "converted" || !!set?.property_id

  // Derive the conversion checklist from real set signals.
  const checklist: DerivedStep[] = set
    ? [
        { id: "profile", label: "Operation profile selected", status: set.operation_profile ? "complete" : "pending", blocker: !set.operation_profile },
        { id: "assumptions", label: "Financial assumptions completed", status: Number(set.gross_monthly_income ?? 0) > 0 ? "complete" : "pending", blocker: !(Number(set.gross_monthly_income ?? 0) > 0) },
        { id: "viable", label: "Plan is cashflow positive", status: Number(set.net_monthly_income ?? 0) > 0 ? "complete" : "blocked", blocker: !(Number(set.net_monthly_income ?? 0) > 0) },
        { id: "aireview", label: "AI review run", status: hasAiReview ? "complete" : "pending" },
        { id: "address", label: "Property address captured", status: set.address ? "complete" : "pending", blocker: !set.address },
        { id: "converted", label: "Converted to live property", status: alreadyConverted ? "complete" : "pending", completed_at: alreadyConverted ? null : undefined },
      ]
    : []

  const total = checklist.length
  const complete = checklist.filter((c) => c.status === "complete").length
  const blockers = checklist.filter((c) => c.blocker && c.status !== "complete")
  const readiness = total > 0 ? Math.round((complete / total) * 100) : 0
  // Ready to convert once the hard prerequisites pass (profile, assumptions, address, viable).
  const canConvert = !!set && !alreadyConverted && !!set.operation_profile && !!set.address &&
    Number(set.gross_monthly_income ?? 0) > 0 && Number(set.net_monthly_income ?? 0) > 0

  async function convertToProperty() {
    if (!set || !workspace?.id || !canConvert) return
    setConverting(true)
    setConvertError(null)
    try {
      const created = await createProperty.mutateAsync({
        workspace_id: workspace.id,
        name: set.title || set.address || "Converted plan",
        status: "active",
        is_demo: false,
        address_line1: set.address ?? undefined,
        target_rent: Number(set.gross_monthly_income ?? 0) || undefined,
        notes: `Created from planning set ${id}`,
      })
      const supabase = createClient()
      await supabase.from("planning_sets")
        .update({ status: "converted", property_id: created.id })
        .eq("id", id).eq("workspace_id", workspace.id)
      router.push(`/property-manager/portfolio/properties/${created.id}`)
    } catch {
      setConvertError("Couldn't convert this plan to a property. Please try again.")
      setConverting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard loading={loading} label="Conversion Readiness" value={`${readiness}%`} sub={`${100 - readiness}% to go`} />
        <KpiCard loading={loading} label="Checklist Items" value={total} sub={`${complete} complete`} />
        <KpiCard loading={loading} label="Blockers" value={blockers.length} sub="Require attention" />
        <KpiCard loading={loading} label="Remaining" value={total - complete} sub="Items to complete" />
      </div>

      {/* ── Section header ── */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Conversion</h2>
        <p className="text-xs text-slate-500 mt-0.5">Operational pipeline from plan to live portfolio record.</p>
      </div>

      {/* ── 2-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* LEFT / CENTER */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : !set ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Workflow className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm font-semibold text-slate-700">Planning set not found</div>
              <p className="text-xs text-slate-400 max-w-sm">
                This planning set couldn&apos;t be loaded, so a conversion checklist can&apos;t be shown.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Conversion Checklist</h3>
              <div className="flex flex-col gap-0">
                {checklist.map((step, i) => (
                  <div key={step.id} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === "complete" ? "bg-emerald-500" :
                        step.status === "blocked" ? "bg-red-400" : "bg-slate-200"
                      }`}>
                        {step.status === "complete" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : step.status === "blocked" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      {i < checklist.length - 1 && (
                        <div className={`w-0.5 h-6 ${step.status === "complete" ? "bg-emerald-300" : "bg-slate-200"}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${
                          step.status === "complete" ? "text-slate-700" :
                          step.status === "blocked" ? "text-red-700" : "text-slate-500"
                        }`}>{step.label}</span>
                        {step.blocker && (
                          <span className="text-[9px] font-bold uppercase tracking-wide bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Blocker</span>
                        )}
                        {step.completed_at && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(step.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">

          {loading ? <Skeleton className="h-44 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center gap-3">
              <ReadinessGauge pct={readiness} />
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Steps Completed</span>
                  <span className="text-[10px] font-semibold text-slate-700">{complete} of {total}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${readiness}%` }} />
                </div>
              </div>
            </div>
          )}

          {!loading && blockers.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                </div>
                <h3 className="text-sm font-semibold text-red-700">Blockers</h3>
              </div>
              {blockers.map((b) => (
                <div key={b.id} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-slate-800">{b.label}</span>
                  <span className="text-[10px] text-red-500 capitalize">{b.status}</span>
                </div>
              ))}
            </div>
          )}

          {!loading && set && (
            <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-4 flex flex-col gap-3">
              {alreadyConverted ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Converted to a live property</span>
                  </div>
                  {set.property_id && (
                    <button
                      onClick={() => router.push(`/property-manager/portfolio/properties/${set.property_id}`)}
                      className="w-full h-9 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      View property
                    </button>
                  )}
                </>
              ) : (
                <ConfirmDialog
                  title="Convert plan to property?"
                  description={`This creates a live property "${set.title || set.address || "from this plan"}" in your portfolio and links it back to this planning set.`}
                  confirmLabel="Convert"
                  confirmVariant="primary"
                  onConfirm={convertToProperty}
                >
                  {(open) => (
                    <button
                      onClick={open}
                      disabled={!canConvert || converting}
                      className="w-full h-10 rounded-xl bg-[#7C3AED] hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {converting ? "Converting…" : "Convert to Property"}
                    </button>
                  )}
                </ConfirmDialog>
              )}
              {!alreadyConverted && (
                <p className="text-[11px] text-slate-500 text-center">
                  {canConvert ? "Creates a real portfolio property from this plan." : "Complete the blockers above before converting."}
                </p>
              )}
              {convertError && <p className="text-[11px] text-red-600 text-center">{convertError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
