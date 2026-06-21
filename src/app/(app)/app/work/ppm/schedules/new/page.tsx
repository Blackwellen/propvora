"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  Flame,
  MapPin,
  CalendarDays,
  Bell,
  Shield,
  Sparkles,
  Save,
  X,
  Plus,
  Info,
  RefreshCw,
  Wrench,
  User,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { PpmTabNav } from "@/components/work/PpmTabNav"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useProperties } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useCreatePpmPlan } from "@/hooks/usePpm"

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Service Details", sub: "What needs to be done?", key: "service" },
  { num: 2, label: "Property & Asset", sub: "Where is it located?", key: "property" },
  { num: 3, label: "Schedule Rules", sub: "When and how often?", key: "schedule" },
  { num: 4, label: "Supplier & Cost", sub: "Who and how much?", key: "supplier" },
  { num: 5, label: "Review", sub: "Confirm and create", key: "review" },
]

const CATEGORY_OPTIONS = ["Gas", "Electrical", "Fire", "Water", "Plumbing", "Mechanical", "Building", "General"]
const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "bi_annual", label: "Bi-Annual" },
  { value: "annual", label: "Annual" },
  { value: "biennial", label: "Every 2 Years" },
]

// ─── Reminder pill ────────────────────────────────────────────────────────────

function ReminderPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-medium text-slate-700">
      {label}
      <button onClick={onRemove} className="text-slate-400 hover:text-slate-600 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
}: {
  icon: React.ElementType
  title: string
  iconBg?: string
  iconColor?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("w-3.5 h-3.5", iconColor)} />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, children, hint, error }: { label: string; required?: boolean; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && (
          <span className="ml-1 inline-flex items-center cursor-pointer text-slate-400 hover:text-slate-600">
            <Info className="w-3 h-3" />
          </span>
        )}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50 bg-white"
const selectCls = cn(inputCls, "cursor-pointer")

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  category: string
  priority: string
  description: string
  property_id: string
  unit_id: string
  frequency: string
  start_date: string
  next_due_date: string
  supplier_name: string
  estimated_cost: string
  auto_generate_job: boolean
}

const INITIAL: FormState = {
  name: "",
  category: "Gas",
  priority: "Medium",
  description: "",
  property_id: "",
  unit_id: "",
  frequency: "annual",
  start_date: "",
  next_due_date: "",
  supplier_name: "",
  estimated_cost: "",
  auto_generate_job: true,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPpmSchedulePage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { data: properties } = useProperties(workspaceId)
  const createPlan = useCreatePpmPlan()

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [reminders, setReminders] = useState(["30 days before", "7 days before", "1 day before"])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: units } = useUnits(workspaceId, form.property_id || undefined)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key as string]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }

  function removeReminder(idx: number) {
    setReminders((prev) => prev.filter((_, i) => i !== idx))
  }
  function addReminder() {
    setReminders((prev) => [...prev, "14 days before"])
  }

  // Validate the fields relevant to a given step
  function validateStep(step: number): boolean {
    const e: Record<string, string> = {}
    if (step >= 1) {
      if (!form.name.trim()) e.name = "Plan name is required"
      if (!form.category) e.category = "Category is required"
    }
    if (step >= 3) {
      if (!form.frequency) e.frequency = "Frequency is required"
      if (!form.next_due_date) e.next_due_date = "Next due date is required"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function goNext() {
    // Validate everything up to and including the current step before advancing
    if (!validateStep(currentStep)) {
      // Jump to first invalid step
      if (errors.name || errors.category) setCurrentStep(1)
      else if (errors.frequency || errors.next_due_date) setCurrentStep(3)
      return
    }
    setCurrentStep((p) => Math.min(p + 1, 5))
  }

  function goBack() {
    setCurrentStep((p) => Math.max(p - 1, 1))
  }

  async function handleCreate() {
    setSubmitError(null)
    // Final full validation
    if (!validateStep(5)) {
      if (errors.name || errors.category) setCurrentStep(1)
      else if (errors.frequency || errors.next_due_date) setCurrentStep(3)
      return
    }
    if (!workspaceId) {
      setSubmitError("No workspace found. Please refresh and try again.")
      return
    }
    try {
      const plan = await createPlan.mutateAsync({
        workspace_id: workspaceId,
        name: form.name.trim(),
        status: "scheduled",
        is_demo: false,
        category: form.category || null,
        priority: form.priority.toLowerCase() || null,
        description: form.description || null,
        property_id: form.property_id || null,
        unit_id: form.unit_id || null,
        frequency: form.frequency || null,
        start_date: form.start_date || null,
        next_due_date: form.next_due_date || null,
        supplier_name: form.supplier_name || null,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
        auto_generate_job: form.auto_generate_job,
      })
      router.push(`/property-manager/work/ppm/${plan.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create PPM schedule"
      setSubmitError(msg)
    }
  }

  const freqLabel = useMemo(
    () => FREQUENCY_OPTIONS.find((f) => f.value === form.frequency)?.label ?? form.frequency,
    [form.frequency]
  )
  const propertyLabel = useMemo(
    () => properties?.find((p) => p.id === form.property_id)?.name ?? (form.property_id ? "Selected property" : "No property"),
    [properties, form.property_id]
  )

  const isLast = currentStep === 5

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/property-manager/work/ppm/overview" className="hover:text-[#2563EB] transition-colors">PPM</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/property-manager/work/ppm/schedules" className="hover:text-[#2563EB] transition-colors">Schedules</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold">New PPM Schedule</span>
      </div>

      {/* Tab navs */}
      <WorkTabNav />
      <PpmTabNav />

      {/* Wizard stepper */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm px-6 py-5">
        <div className="flex items-start justify-between gap-2 overflow-x-auto">
          {STEPS.map((step, i) => {
            const isCompleted = currentStep > step.num
            const isActive = currentStep === step.num
            return (
              <React.Fragment key={step.key}>
                <button
                  onClick={() => setCurrentStep(step.num)}
                  className="flex flex-col items-center gap-1.5 min-w-[100px] group"
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                    isCompleted || isActive ? "bg-[#2563EB] border-[#2563EB] text-white" : "bg-white border-slate-200 text-slate-400"
                  )}>
                    {isCompleted ? "✓" : step.num}
                  </div>
                  <div className="text-center">
                    <p className={cn("text-[12px] font-semibold leading-tight", isActive || isCompleted ? "text-[#2563EB]" : "text-slate-500")}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{step.sub}</p>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mt-5 rounded-full", currentStep > step.num ? "bg-[#2563EB]" : "bg-slate-200")} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* LEFT FORM */}
        <div className="space-y-6">
          {/* STEP 1 — Service Information */}
          {currentStep === 1 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
              <SectionHeader icon={Flame} title="Service Information" iconBg="bg-orange-50" iconColor="text-orange-600" />
              <div className="space-y-4">
                <Field label="Plan / Service Name" required error={errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Boiler Annual Service"
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Compliance Category" required error={errors.category}>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select value={form.category} onChange={(e) => set("category", e.target.value)} className={cn(selectCls, "pl-9")}>
                        {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </Field>
                  <Field label="Priority">
                    <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={selectCls}>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Low</option>
                      <option>Critical</option>
                    </select>
                  </Field>
                </div>
                <Field label="Description">
                  <textarea
                    className={cn(inputCls, "resize-none")}
                    rows={3}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe the maintenance work to be carried out…"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-right">{form.description.length}/500</p>
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2 — Location */}
          {currentStep === 2 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
              <SectionHeader icon={MapPin} title="Property & Asset" iconBg="bg-slate-100" iconColor="text-slate-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Property">
                  <select value={form.property_id} onChange={(e) => { set("property_id", e.target.value); set("unit_id", "") }} className={selectCls}>
                    <option value="">Select property…</option>
                    {(properties ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Asset / Unit">
                  <select value={form.unit_id} onChange={(e) => set("unit_id", e.target.value)} className={selectCls} disabled={!form.property_id}>
                    <option value="">{form.property_id ? "Select unit…" : "Select a property first"}</option>
                    {(units ?? []).map((u) => (
                      <option key={u.id} value={u.id}>{u.unit_name}</option>
                    ))}
                  </select>
                </Field>
              </div>
              {(!properties || properties.length === 0) && (
                <p className="text-[11px] text-slate-400 mt-3">No properties found yet. You can still create the plan and link a property later.</p>
              )}
            </div>
          )}

          {/* STEP 3 — Schedule Rules */}
          {currentStep === 3 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
              <SectionHeader icon={CalendarDays} title="Schedule Rules" iconBg="bg-blue-50" iconColor="text-blue-600" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Frequency" required error={errors.frequency}>
                    <div className="relative">
                      <RefreshCw className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select value={form.frequency} onChange={(e) => set("frequency", e.target.value)} className={cn(selectCls, "pl-9")}>
                        {FREQUENCY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  </Field>
                  <Field label="Start Date">
                    <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <Field label="Next Due Date" required error={errors.next_due_date}>
                  <input type="date" value={form.next_due_date} onChange={(e) => set("next_due_date", e.target.value)} className={inputCls} />
                </Field>

                {/* Reminder Rules */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                    <Bell className="w-3.5 h-3.5" />
                    Reminder Rules
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {reminders.map((r, i) => (
                      <ReminderPill key={i} label={r} onRemove={() => removeReminder(i)} />
                    ))}
                    <button
                      onClick={addReminder}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-[12px] font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Supplier & Cost */}
          {currentStep === 4 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
              <SectionHeader icon={User} title="Supplier & Cost" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Supplier" hint="Optional">
                  <div className="relative">
                    <Wrench className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={form.supplier_name}
                      onChange={(e) => set("supplier_name", e.target.value)}
                      placeholder="e.g. HeatPro Ltd"
                      className={cn(inputCls, "pl-9")}
                    />
                  </div>
                </Field>
                <Field label="Estimated Cost (£)">
                  <input
                    type="number"
                    min="0"
                    value={form.estimated_cost}
                    onChange={(e) => set("estimated_cost", e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </Field>
              </div>
              <label className="flex items-center justify-between mt-4 p-3 rounded-lg border border-slate-200">
                <span className="flex items-center gap-2 text-sm text-slate-700">
                  <Wrench className="w-4 h-4 text-[#2563EB]" /> Auto-generate a job when this plan is due
                </span>
                <button
                  type="button"
                  onClick={() => set("auto_generate_job", !form.auto_generate_job)}
                  className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0", form.auto_generate_job ? "bg-[#2563EB]" : "bg-slate-200")}
                >
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", form.auto_generate_job ? "left-[22px]" : "left-0.5")} />
                </button>
              </label>
            </div>
          )}

          {/* STEP 5 — Review */}
          {currentStep === 5 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
              <SectionHeader icon={CheckCircle2} title="Review & Confirm" iconBg="bg-blue-50" iconColor="text-blue-600" />
              <div className="divide-y divide-slate-100">
                {[
                  { label: "Plan Name", value: form.name || "—" },
                  { label: "Category", value: form.category },
                  { label: "Priority", value: form.priority },
                  { label: "Property", value: propertyLabel },
                  { label: "Unit", value: units?.find((u) => u.id === form.unit_id)?.unit_name ?? "—" },
                  { label: "Frequency", value: freqLabel },
                  { label: "Start Date", value: form.start_date || "—" },
                  { label: "Next Due Date", value: form.next_due_date || "—" },
                  { label: "Supplier", value: form.supplier_name || "—" },
                  { label: "Estimated Cost", value: form.estimated_cost ? `£${Number(form.estimated_cost).toLocaleString()}` : "—" },
                  { label: "Auto-generate Job", value: form.auto_generate_job ? "Enabled" : "Off" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2.5">
                    <span className="text-[12px] text-slate-500">{row.label}</span>
                    <span className="text-[13px] font-semibold text-slate-800 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
              {(errors.name || errors.category || errors.frequency || errors.next_due_date) && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-600">Some required fields are missing. Please review steps 1 and 3.</p>
                </div>
              )}
              {submitError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-600">{submitError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT RAIL — Live Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 sticky top-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-semibold text-slate-900">Schedule Summary</h3>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Service</p>
                  <p className="text-[12.5px] font-semibold text-slate-800 mt-0.5">{form.name || "Untitled plan"}</p>
                  {form.description && <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{form.description}</p>}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Category</span>
                <span className="text-[12.5px] font-semibold text-slate-800">{form.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Frequency</span>
                <span className="text-[12.5px] font-semibold text-slate-800">{freqLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Est. Cost</span>
                <span className="text-[12.5px] font-semibold text-slate-800">{form.estimated_cost ? `£${Number(form.estimated_cost).toLocaleString()}` : "—"}</span>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12.5px] font-semibold text-slate-800">{propertyLabel}</p>
                  {form.supplier_name && <p className="text-[11px] text-slate-500">{form.supplier_name}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Next Due</span>
                <span className="text-[12.5px] font-semibold text-slate-800">{form.next_due_date || "—"}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 leading-snug">
                {form.auto_generate_job
                  ? "A job will be auto-generated when this plan becomes due."
                  : "Auto job generation is off — generate jobs manually from the plan."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer bar */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-between shadow-md -mx-6">
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/property-manager/work/ppm/schedules"
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          {isLast ? (
            <button
              onClick={handleCreate}
              disabled={createPlan.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
            >
              {createPlan.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {createPlan.isPending ? "Creating…" : "Create PPM Schedule"}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors"
            >
              Save &amp; Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
