"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  Calendar,
  CheckCircle2,
  Building2,
  Truck,
  Hash,
  Copy,
  PoundSterling,
  RefreshCw,
  Trash2,
  Wrench,
  Activity,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { PpmTabNav } from "@/components/work/PpmTabNav"
import { MobileTopBar, MobileTabs } from "@/components/mobile"
import { PpmScheduleStatusBadge } from "@/features/work/ppm/components/PpmScheduleStatusBadge"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import {
  usePpmPlan,
  useUpdatePpmPlan,
  useDeletePpmPlan,
  useGenerateJobFromPpm,
  type PpmPlan,
  type UpdatePpmPlan,
} from "@/hooks/usePpm"
import { useWorkspaceId } from "@/hooks/useWorkspace"

// ---------------------------------------------------------------------------
// Seeded fallback plan — used when the table is missing or the row isn't found
// so the detail page still demos a premium layout.
// ---------------------------------------------------------------------------
function seededPlan(id: string): PpmPlan {
  return {
    id,
    workspace_id: "",
    name: "Boiler Annual Service",
    description:
      "Annual service and safety inspection of gas boiler including combustion analysis, safety controls check, and issue certification.",
    category: "Gas",
    status: "scheduled",
    priority: "high",
    property_id: null,
    unit_id: null,
    supplier_contact_id: null,
    supplier_name: "HeatPro Ltd",
    frequency: "annual",
    start_date: "2025-06-10",
    next_due_date: "2026-06-12",
    last_completed_date: "2025-06-12",
    estimated_cost: 850,
    auto_generate_job: true,
    reference: "PPM-0021",
    notes:
      "Ensure tenant access is arranged. Issue Gas Safety Certificate upon completion and upload to compliance records.",
    is_demo: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "bi_annual", label: "Bi-Annual" },
  { value: "annual", label: "Annual" },
  { value: "biennial", label: "Every 2 Years" },
]

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "due_soon", label: "Due Soon" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
]

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const CATEGORY_OPTIONS = [
  { value: "Gas", label: "Gas" },
  { value: "Electrical", label: "Electrical" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "Fire Safety", label: "Fire Safety" },
  { value: "HVAC", label: "HVAC" },
  { value: "Lift", label: "Lift" },
  { value: "Water Hygiene", label: "Water Hygiene" },
  { value: "Grounds", label: "Grounds" },
  { value: "General", label: "General" },
]

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function badgeStatus(s: string): "scheduled" | "due-soon" | "overdue" | "completed" {
  if (s === "due_soon") return "due-soon"
  if (s === "overdue") return "overdue"
  if (s === "completed") return "completed"
  return "scheduled"
}

const PPM_TABS = ["Overview", "Schedule", "Generated Jobs", "Supplier", "Activity"]

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function PpmDetailSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-5 w-40 bg-slate-100 rounded" />
      <div className="h-8 w-64 bg-slate-100 rounded" />
      <div className="bg-white border border-slate-200 rounded-2xl p-5 h-28" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl h-20" />
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl h-64" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// KPI strip
// ---------------------------------------------------------------------------
function PpmKpiStrip({ plan }: { plan: PpmPlan }) {
  const cost = plan.estimated_cost ?? 0
  const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === plan.frequency)?.label ?? (plan.frequency ?? "—")
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">Frequency</p>
        </div>
        <p className="text-base font-bold text-slate-900">{freqLabel}</p>
        <p className="text-[11px] text-slate-400">Recurrence</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">Next Due</p>
        </div>
        <p className="text-base font-bold text-slate-900">{fmtDate(plan.next_due_date)}</p>
        <p className="text-[11px] text-slate-400">Scheduled date</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">Last Completed</p>
        </div>
        <p className="text-base font-bold text-slate-900">{fmtDate(plan.last_completed_date)}</p>
        <p className="text-[11px] text-slate-400">Most recent</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <PoundSterling className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <p className="text-[11px] text-slate-500">Est. Cost</p>
        </div>
        <p className="text-xl font-bold text-slate-900">{cost > 0 ? `£${cost.toLocaleString()}` : "—"}</p>
        <p className="text-[11px] text-slate-400">Per occurrence</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">Auto-Generate</p>
        </div>
        <p className="text-base font-bold text-slate-900">{plan.auto_generate_job ? "Enabled" : "Off"}</p>
        <p className="text-[11px] text-slate-400">Job on due date</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PpmDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const workspaceId = useWorkspaceId()
  const { data: planData, isLoading } = usePpmPlan(workspaceId, id)
  const updatePlan = useUpdatePpmPlan()
  const deletePlan = useDeletePpmPlan()
  const generateJob = useGenerateJobFromPpm()
  const [activeTab, setActiveTab] = useState("Overview")
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  if (isLoading) return <PpmDetailSkeleton />

  // When no live row exists (table missing or not found) we fall back to seed
  const isLive = !!planData
  const plan = planData ?? seededPlan(id)

  async function save(field: keyof UpdatePpmPlan, value: string | number | boolean | null) {
    if (!isLive || !workspaceId || !planData) return
    await updatePlan.mutateAsync({
      id: planData.id,
      workspaceId,
      payload: { [field]: value } as UpdatePpmPlan,
    })
  }

  async function handleDelete() {
    if (!isLive || !workspaceId || !planData) {
      router.push("/app/work/ppm/overview")
      return
    }
    await deletePlan.mutateAsync({ id: planData.id, workspaceId })
    router.push("/app/work/ppm/overview")
  }

  async function handleGenerateJob() {
    if (generating) return
    setGenerating(true)
    try {
      const res = await generateJob.mutateAsync({ plan })
      if (res.ok && res.jobId) {
        router.push(`/app/work/jobs/${res.jobId}`)
      }
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(plan.reference ?? plan.id).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const editable = isLive

  return (
    <div className="space-y-5">
      {/* Mobile top bar */}
      <MobileTopBar
        title={plan.name}
        subtitle="PPM Plan"
        showBack
        backHref="/app/work/ppm/overview"
        primaryAction={{ label: "Generate job", icon: Wrench, onClick: () => { if (!generating) handleGenerateJob() } }}
        overflowActions={[
          { label: "New plan", icon: Plus, href: "/app/work/ppm/schedules/new" },
          { label: "Delete", icon: Trash2, destructive: true, onClick: handleDelete },
        ]}
      />

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
        <Link href="/app/work/ppm/overview" className="hover:text-[#2563EB] transition-colors">PPM</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/app/work/ppm/schedules" className="hover:text-[#2563EB] transition-colors">Schedules</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold truncate max-w-[200px]">{plan.name}</span>
      </div>

      {/* Back button */}
      <Link
        href="/app/work/ppm/overview"
        className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="w-4 h-4" /> Back to PPM
      </Link>

      {/* Tab navs */}
      <div className="hidden md:block">
        <WorkTabNav />
        <PpmTabNav />
      </div>

      {/* Header actions */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PPM Plan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Planned preventive maintenance schedule</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateJob}
            disabled={generating}
            className="h-8 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <Wrench className="w-3.5 h-3.5" /> {generating ? "Generating…" : "Generate Job"}
          </button>
          <Link
            href="/app/work/ppm/schedules/new"
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5" /> New Plan
          </Link>
          <ConfirmDialog
            title="Delete this PPM plan?"
            description="This action cannot be undone. The plan and its schedule will be permanently removed."
            confirmLabel="Delete"
            onConfirm={handleDelete}
          >
            {(open) => (
              <button
                onClick={open}
                className="h-8 px-3 rounded-lg border border-red-200 bg-white text-[12.5px] text-red-600 flex items-center gap-1.5 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </ConfirmDialog>
          <ActionMenu
            items={[
              { label: "Generate Job", icon: Wrench, onClick: handleGenerateJob },
              { label: "View Schedules", icon: CalendarClock, onClick: () => router.push("/app/work/ppm/schedules") },
              {
                label: "Delete",
                icon: Trash2,
                variant: "danger",
                onClick: handleDelete,
              },
            ]}
          />
        </div>
      </div>

      {/* Hero strip — name & status inline-editable when live */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
            <CalendarClock className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {editable ? (
                <InlineEditField
                  value={plan.name}
                  type="text"
                  onSave={(val) => save("name", val)}
                  displayClassName="text-xl font-bold text-slate-900"
                  className="flex-1"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
              )}
              <PpmScheduleStatusBadge status={badgeStatus(plan.status)} />
            </div>
            <div className="mt-2 flex items-center gap-4 flex-wrap text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {plan.reference ?? plan.id.slice(0, 8).toUpperCase()}
                <button onClick={handleCopy} className="text-slate-300 hover:text-slate-500">
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {plan.property_id ? (
                  <Link href="/app/portfolio" className="text-[#2563EB] hover:underline">View Property</Link>
                ) : (
                  <span>No property linked</span>
                )}
              </span>
              {plan.supplier_name && (
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />{plan.supplier_name}
                </span>
              )}
              {plan.next_due_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Next: {fmtDate(plan.next_due_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <PpmKpiStrip plan={plan} />

      {/* Seed banner */}
      {!isLive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Showing sample data. This plan isn&apos;t in your live PPM records yet — create one from the
            <Link href="/app/work/ppm/schedules/new" className="font-semibold underline ml-1">New PPM Schedule</Link> wizard to enable editing.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="md:hidden p-3 border-b border-slate-100">
          <MobileTabs
            tabs={PPM_TABS.map((t) => ({ id: t, label: t }))}
            value={activeTab}
            onChange={setActiveTab}
            aria-label="PPM sections"
          />
        </div>
        <div className="hidden md:flex items-center overflow-x-auto border-b border-slate-100">
          {PPM_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
                activeTab === tab
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="flex flex-col xl:flex-row gap-5 items-start">
              <div className="flex-1 min-w-0 space-y-4 w-full">
                {/* Description + fields */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Plan Details</h3>
                  {editable ? (
                    <InlineEditField
                      value={plan.description ?? ""}
                      type="textarea"
                      placeholder="No description provided."
                      onSave={(val) => save("description", val || null)}
                      displayClassName="text-sm text-slate-600 whitespace-pre-wrap"
                    />
                  ) : (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{plan.description ?? "No description provided."}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Category</p>
                      {editable ? (
                        <InlineEditField value={plan.category ?? ""} type="text" placeholder="General" onSave={(v) => save("category", v || null)} />
                      ) : (
                        <p className="text-[13px] text-slate-700">{plan.category ?? "—"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Priority</p>
                      {editable ? (
                        <InlineEditField value={plan.priority ?? ""} type="select" options={PRIORITY_OPTIONS} placeholder="Medium" onSave={(v) => save("priority", v || null)} />
                      ) : (
                        <p className="text-[13px] text-slate-700 capitalize">{plan.priority ?? "—"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Frequency</p>
                      {editable ? (
                        <InlineEditField
                          value={plan.frequency ?? ""}
                          type="select"
                          options={FREQUENCY_OPTIONS}
                          placeholder="Annual"
                          onSave={(v) => save("frequency", v || null)}
                        />
                      ) : (
                        <p className="text-[13px] text-slate-700">{FREQUENCY_OPTIONS.find((f) => f.value === plan.frequency)?.label ?? plan.frequency ?? "—"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
                      {editable ? (
                        <InlineEditField
                          value={plan.status}
                          type="select"
                          options={STATUS_OPTIONS}
                          onSave={(v) => save("status", v)}
                        />
                      ) : (
                        <p className="text-[13px] text-slate-700">{STATUS_OPTIONS.find((s) => s.value === plan.status)?.label ?? plan.status}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Estimated Cost (£)</p>
                      {editable ? (
                        <InlineEditField
                          value={plan.estimated_cost ?? ""}
                          type="number"
                          prefix="£"
                          placeholder="Not set"
                          onSave={(v) => save("estimated_cost", v ? parseFloat(v) : null)}
                        />
                      ) : (
                        <p className="text-[13px] text-slate-700">{plan.estimated_cost ? `£${plan.estimated_cost.toLocaleString()}` : "—"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Reference</p>
                      {editable ? (
                        <InlineEditField value={plan.reference ?? ""} type="text" placeholder="—" onSave={(v) => save("reference", v || null)} />
                      ) : (
                        <p className="text-[13px] text-slate-700">{plan.reference ?? "—"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Notes</h3>
                  {editable ? (
                    <InlineEditField
                      value={plan.notes ?? ""}
                      type="textarea"
                      placeholder="Add internal notes for this plan…"
                      onSave={(v) => save("notes", v || null)}
                      displayClassName="text-sm text-slate-600 whitespace-pre-wrap"
                    />
                  ) : (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{plan.notes ?? "No notes."}</p>
                  )}
                </div>
              </div>

              {/* Right mini-column */}
              <div className="w-full xl:w-64 shrink-0 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Compliance</h3>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs text-slate-600">Certification tracked on completion</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-700 leading-snug">
                    Generate a job from this plan to dispatch a work order to your supplier.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE */}
          {activeTab === "Schedule" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Schedule Rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Frequency</p>
                    {editable ? (
                      <InlineEditField value={plan.frequency ?? ""} type="select" options={FREQUENCY_OPTIONS} onSave={(v) => save("frequency", v || null)} />
                    ) : (
                      <p className="text-[13px] text-slate-700">{FREQUENCY_OPTIONS.find((f) => f.value === plan.frequency)?.label ?? plan.frequency ?? "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Start Date</p>
                    {editable ? (
                      <InlineEditField value={plan.start_date ? plan.start_date.split("T")[0] : ""} type="date" placeholder="Not set" onSave={(v) => save("start_date", v || null)} />
                    ) : (
                      <p className="text-[13px] text-slate-700">{fmtDate(plan.start_date)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Next Due Date</p>
                    {editable ? (
                      <InlineEditField value={plan.next_due_date ? plan.next_due_date.split("T")[0] : ""} type="date" placeholder="Not set" onSave={(v) => save("next_due_date", v || null)} />
                    ) : (
                      <p className="text-[13px] text-slate-700">{fmtDate(plan.next_due_date)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Last Completed</p>
                    {editable ? (
                      <InlineEditField value={plan.last_completed_date ? plan.last_completed_date.split("T")[0] : ""} type="date" placeholder="Never" onSave={(v) => save("last_completed_date", v || null)} />
                    ) : (
                      <p className="text-[13px] text-slate-700">{fmtDate(plan.last_completed_date)}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Auto-generate job on due date</p>
                  <p className="text-xs text-slate-500 mt-0.5">Automatically create a work order when this plan is due.</p>
                </div>
                {editable ? (
                  <button
                    onClick={() => save("auto_generate_job", !plan.auto_generate_job)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors shrink-0",
                      plan.auto_generate_job ? "bg-[#2563EB]" : "bg-slate-200"
                    )}
                  >
                    <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", plan.auto_generate_job ? "left-[22px]" : "left-0.5")} />
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">{plan.auto_generate_job ? "Enabled" : "Off"}</span>
                )}
              </div>
            </div>
          )}

          {/* GENERATED JOBS */}
          {activeTab === "Generated Jobs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Work orders created from this plan</p>
                <button
                  onClick={handleGenerateJob}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  <Wrench className="w-3.5 h-3.5" /> {generating ? "Generating…" : "Generate Job"}
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No jobs generated yet</p>
                <p className="text-xs text-slate-400 mt-1">Generate a job to dispatch a work order from this plan.</p>
              </div>
            </div>
          )}

          {/* SUPPLIER */}
          {activeTab === "Supplier" && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 max-w-xl">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Supplier</h3>
              <div className="mb-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Supplier Name</p>
                {editable ? (
                  <InlineEditField value={plan.supplier_name ?? ""} type="text" placeholder="No supplier assigned" onSave={(v) => save("supplier_name", v || null)} />
                ) : (
                  <p className="text-[13px] text-slate-700">{plan.supplier_name ?? "—"}</p>
                )}
              </div>
              {plan.supplier_name ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {plan.supplier_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{plan.supplier_name}</p>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Assigned</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No supplier assigned to this plan.</p>
              )}
              <Link href="/app/work/suppliers" className="mt-3 block text-[12px] text-[#2563EB] hover:underline">Browse Suppliers →</Link>
            </div>
          )}

          {/* ACTIVITY */}
          {activeTab === "Activity" && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity</h3>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">SY</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-700">System</p>
                    <p className="text-[10px] text-slate-400">{fmtDate(plan.created_at)}</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">PPM plan created</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
                <button className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold">Post</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
