"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  ArrowRight,
  Building2,
  Users,
  FileText,
  Wrench,
  ShieldCheck,
  Eye,
  MapPin,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningConversionChecklist } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: React.ReactNode
  chip?: React.ReactNode
  sub?: string
  loading?: boolean
}

function KpiCard({ label, value, chip, sub, loading }: KpiProps) {
  if (loading) return <Skeleton className="h-24 w-full" />
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[17px] font-bold text-slate-900 leading-tight">{value}</span>
        {chip}
      </div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  )
}

// ── Conversion Pipeline steps ─────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { label: "Plan Validation", status: "complete", date: "12 May 2025" },
  { label: "Compliance Check", status: "complete", date: "13 May 2025" },
  { label: "Data Preparation", status: "complete", date: "14 May 2025" },
  { label: "System Readiness", status: "warning", progress: 60 },
  { label: "Pre-Conversion Review", status: "pending" },
  { label: "Convert to Live", status: "pending" },
  { label: "Post-Conversion Validation", status: "pending" },
]

// ── Blockers ──────────────────────────────────────────────────────────────────

const BLOCKERS = [
  { label: "Gas Safety Certificate", reason: "Missing document" },
  { label: "EPC Certificate", reason: "Expired, renewal required" },
  { label: "Electrical Installation Report", reason: "Document unreadable" },
]

// ── Next Actions ──────────────────────────────────────────────────────────────

const NEXT_ACTIONS = [
  { label: "Upload valid Gas Safety Certificate", assign: "Facilities Lead" },
  { label: "Renew EPC + upload certificate", assign: "Asset Manager" },
  { label: "Upload clear EICR report", assign: "Compliance Officer" },
]

// ── Objects to be created ─────────────────────────────────────────────────────

const OBJECTS = [
  { icon: Building2, label: "Property (Building)", count: 1 },
  { icon: Building2, label: "Units (Rooms)", count: 12 },
  { icon: Users, label: "Tenancies", count: 12 },
  { icon: Users, label: "Tenants", count: 12 },
  { icon: FileText, label: "Rental Agreements", count: 12 },
  { icon: Wrench, label: "Work Orders", count: 4 },
  { icon: ShieldCheck, label: "Compliance Records", count: 8 },
  { icon: Eye, label: "Inspections", count: 6 },
]

// ── Linked Tasks ──────────────────────────────────────────────────────────────

const LINKED_TASKS = [
  { label: "Post-Conversion Rent Review", date: "30 May 2025", status: "Planned" },
  { label: "HMO License Renewal", date: "19 Jun 2025", status: "Planned" },
  { label: "EPC Renewal", date: "14 Jul 2025", status: "Planned" },
]

// ── Audit trail ───────────────────────────────────────────────────────────────

const AUDIT = [
  { time: "14 May 2025 09:41", type: "System", msg: "Data Preparation step marked complete." },
  { time: "13 May 2025 14:30", type: "System", msg: "Compliance Check passed automatically." },
  { time: "13 May 2025 11:22", type: "User", msg: "James Taylor uploaded HMO License document." },
  { time: "12 May 2025 10:00", type: "System", msg: "Plan Validation completed." },
]

// ── Readiness Gauge ───────────────────────────────────────────────────────────

function ReadinessGauge({ pct }: { pct: number }) {
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (pct / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52"
            fill="none" stroke="#10B981" strokeWidth="10"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{pct}%</span>
          <span className="text-[10px] font-semibold text-emerald-600">Good</span>
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

  const [checklist, setChecklist] = useState<PlanningConversionChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAuditFilter, setActiveAuditFilter] = useState<"All" | "System" | "User" | "Data">("All")
  const [simulateOpen, setSimulateOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from("planning_conversion_checklists")
          .select("*")
          .eq("planning_set_id", id)
          .order("created_at")
        if (err) throw err
        setChecklist((data ?? []) as PlanningConversionChecklist[])
      } catch {
        setError("Failed to load conversion data.")
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
      </div>
    )
  }

  const filteredAudit = activeAuditFilter === "All" ? AUDIT : AUDIT.filter((a) => a.type === activeAuditFilter)

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard loading={loading} label="Conversion Readiness" value="86%"
          chip={<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Ready for conversion</span>}
          sub="14% to go"
        />
        <KpiCard loading={loading} label="Documents Uploaded" value="42"
          sub="of 58 required"
        />
        <KpiCard loading={loading} label="Critical Missing Docs" value="3"
          chip={<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Require attention</span>}
        />
        <KpiCard loading={loading} label="Last Sync / Update" value="2h ago"
          sub="by James Taylor"
        />
      </div>

      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-slate-900">9A Conversion</h2>
        <p className="text-xs text-slate-500 mt-0.5">Operational pipeline from plan to live portfolio record.</p>
      </div>

      {/* ── 2-column layout ─────────────────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* LEFT / CENTER */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Conversion Pipeline Stepper */}
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Conversion Pipeline</h3>
              <div className="flex flex-col gap-0">
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={step.label} className="flex gap-3 items-start">
                    {/* Icon + line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === "complete" ? "bg-emerald-500" :
                        step.status === "warning" ? "bg-amber-400" : "bg-slate-200"
                      }`}>
                        {step.status === "complete" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : step.status === "warning" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div className={`w-0.5 h-6 ${step.status === "complete" ? "bg-emerald-300" : "bg-slate-200"}`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          step.status === "complete" ? "text-slate-700" :
                          step.status === "warning" ? "text-amber-700" : "text-slate-400"
                        }`}>{step.label}</span>
                        {step.date && <span className="text-[10px] text-slate-400">{step.date}</span>}
                      </div>
                      {step.status === "warning" && step.progress != null && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${step.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-amber-600 font-semibold">{step.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Readiness Score + Blockers in a row */}
          {loading ? <Skeleton className="h-44 w-full" /> : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center gap-3">
                <ReadinessGauge pct={86} />
              </div>
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-red-700">Blockers</h3>
                </div>
                {BLOCKERS.map((b) => (
                  <div key={b.label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-800">{b.label}</span>
                    <span className="text-[10px] text-red-500">{b.reason}</span>
                  </div>
                ))}
                <button className="mt-1 text-[11px] font-semibold text-red-600 hover:underline flex items-center gap-1">
                  View all blockers <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* What's holding us back + Next Actions */}
          {loading ? <Skeleton className="h-36 w-full" /> : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">What&apos;s holding us back?</h3>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600">3</span>
                    <span className="text-xs text-slate-700">Critical blockers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600">!</span>
                    <span className="text-xs text-slate-700">Warnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">5</span>
                    <span className="text-xs text-slate-700">Recommendations</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-emerald-800 mb-2">Next Actions</h3>
                <div className="flex flex-col gap-1.5">
                  {NEXT_ACTIONS.map((a) => (
                    <div key={a.label} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-slate-700 font-medium">{a.label}</p>
                        <p className="text-[10px] text-slate-400">Assign to {a.assign}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-2 text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                  View all actions <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Objects That Will Be Created */}
          {loading ? <Skeleton className="h-36 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Objects That Will Be Created</h3>
                <button className="text-[11px] font-semibold text-[#7C3AED] hover:underline flex items-center gap-1">
                  Preview all objects <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {OBJECTS.map(({ icon: Icon, label, count }) => (
                  <div key={label} className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-2">
                    <div style={{ color: "#7C3AED" }}><Icon className="w-4 h-4" /></div>
                    <span className="text-sm font-bold text-slate-900">{count}</span>
                    <span className="text-[9px] text-slate-500 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Property Setup Preview */}
          {loading ? <Skeleton className="h-36 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Linked Property Setup Preview</h3>
                <button className="text-[11px] font-semibold text-[#7C3AED] hover:underline flex items-center gap-1">
                  View full preview <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-20 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">12-Room HMO — Nottingham</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Ready</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    Nottingham, NG1
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                    {[
                      { label: "Property Type", value: "HMO" },
                      { label: "Use Class", value: "C4" },
                      { label: "Floors", value: "3" },
                      { label: "Total Area", value: "285.4m²" },
                      { label: "Rooms", value: "12" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-[9px] text-slate-400 font-medium">{label}</div>
                        <div className="text-[11px] font-semibold text-slate-700">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Linked Tasks Preview */}
          {loading ? <Skeleton className="h-28 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Linked Tasks (Preview)</h3>
                <button className="text-[11px] font-semibold text-[#7C3AED] hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {LINKED_TASKS.map((t) => (
                  <div key={t.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-700">{t.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{t.date}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversion Audit Trail */}
          {loading ? <Skeleton className="h-44 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Conversion Audit Trail</h3>
                <div className="flex items-center gap-1">
                  {(["All", "System", "User", "Data"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveAuditFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                        activeAuditFilter === f ? "bg-[#7C3AED] text-white" : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {filteredAudit.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-2.5">
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap mt-0.5">{a.time}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
                      a.type === "System" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>{a.type}</span>
                    <span className="text-xs text-slate-700">{a.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">

          {/* Conversion Summary */}
          {loading ? <Skeleton className="h-72 w-full" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Conversion Summary</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Plan Reference", value: "12-Room HMO — Nottingham" },
                  { label: "Conversion Type", value: "New Portfolio Record" },
                  { label: "Target Go-Live", value: "27 May 2025" },
                  { label: "Assigned To", value: "James Taylor" },
                  { label: "Readiness", value: "86% Good" },
                  { label: "Overall Risk", value: "Medium" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500">{label}</span>
                    <span className={`text-[11px] font-semibold ${
                      value === "Medium" ? "text-amber-600" : value.includes("Good") ? "text-emerald-600" : "text-slate-800"
                    }`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Steps Completed</span>
                  <span className="text-[10px] font-semibold text-slate-700">4 of 7</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "57%" }} />
                </div>
              </div>
            </div>
          )}

          {/* Convert to Live */}
          {loading ? <Skeleton className="h-32 w-full" /> : (
            <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-4 flex flex-col gap-3">
              <button
                onClick={() => setSimulateOpen(true)}
                className="w-full h-10 rounded-xl bg-[#7C3AED] hover:bg-violet-700 text-white text-sm font-bold transition-colors"
              >
                Convert to Live (Simulate)
              </button>
              <p className="text-[11px] text-slate-500 text-center">Simulate conversion impact before going live.</p>
            </div>
          )}

          {simulateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-900">Simulate Conversion?</h3>
                <p className="text-xs text-slate-500">This will run a simulation of the conversion process. No live data will be modified.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSimulateOpen(false)}
                    className="flex-1 h-9 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setSimulateOpen(false)}
                    className="flex-1 h-9 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
                  >
                    Run Simulation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
