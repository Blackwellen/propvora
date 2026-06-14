"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import {
  Home,
  LogIn,
  LogOut,
  Package,
  ShieldAlert,
  Wrench,
  Truck,
  Flame,
  ClipboardList,
  FileSearch,
  Key,
  RotateCcw,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  Bell,
  AlertTriangle,
  Briefcase,
  User,
  Building2,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type InspectionTypeKey =
  | "routine"
  | "move_in"
  | "move_out"
  | "inventory"
  | "safety"
  | "maintenance"
  | "hmo_room"
  | "fire_safety"
  | "supplier"
  | "compliance_review"
  | "pre_tenancy"
  | "post_tenancy"
  | "other"

type ChecklistSeverity = "ok" | "minor" | "major" | "na"

interface ChecklistItem {
  id: string
  label: string
  severity: ChecklistSeverity
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INSPECTION_TYPES: {
  key: InspectionTypeKey
  label: string
  description: string
  icon: React.ElementType
  colour: string
}[] = [
  { key: "routine", label: "Routine Property Inspection", description: "Regular periodic check", icon: Home, colour: "#2563EB" },
  { key: "move_in", label: "Move-in Inspection", description: "Condition at tenancy start", icon: LogIn, colour: "#059669" },
  { key: "move_out", label: "Move-out Inspection", description: "Condition at tenancy end", icon: LogOut, colour: "#D97706" },
  { key: "inventory", label: "Inventory Check", description: "Full inventory review", icon: Package, colour: "#7C3AED" },
  { key: "safety", label: "Safety Inspection", description: "General safety assessment", icon: ShieldAlert, colour: "#DC2626" },
  { key: "maintenance", label: "Maintenance Inspection", description: "Maintenance condition check", icon: Wrench, colour: "#64748B" },
  { key: "hmo_room", label: "HMO Room Inspection", description: "Individual HMO room check", icon: Key, colour: "#0891B2" },
  { key: "fire_safety", label: "Fire Safety Inspection", description: "Fire safety compliance", icon: Flame, colour: "#EA580C" },
  { key: "supplier", label: "Supplier Site Visit", description: "Supplier/contractor visit", icon: Truck, colour: "#7C3AED" },
  { key: "compliance_review", label: "Compliance Evidence Review", description: "Evidence & docs review", icon: FileSearch, colour: "#2563EB" },
  { key: "pre_tenancy", label: "Pre-tenancy Inspection", description: "Before tenancy begins", icon: ClipboardList, colour: "#059669" },
  { key: "post_tenancy", label: "Post-tenancy Inspection", description: "After tenancy ends", icon: RotateCcw, colour: "#D97706" },
  { key: "other", label: "Other", description: "Custom inspection type", icon: HelpCircle, colour: "#64748B" },
]

const MOCK_INSPECTORS = [
  { id: "c1", name: "Sarah Chen", role: "Property Manager" },
  { id: "c2", name: "James Patel", role: "Inspector" },
  { id: "c3", name: "Alex Morgan", role: "Contractor" },
  { id: "c4", name: "Fire Inspector Ltd", role: "Specialist" },
]

const ROUTINE_CHECKLIST: ChecklistItem[] = [
  { id: "cl-1", label: "General condition", severity: "ok" },
  { id: "cl-2", label: "Electrics & sockets", severity: "ok" },
  { id: "cl-3", label: "Plumbing & water pressure", severity: "ok" },
  { id: "cl-4", label: "Heating system", severity: "ok" },
  { id: "cl-5", label: "Windows & doors", severity: "ok" },
  { id: "cl-6", label: "Garden / external areas", severity: "ok" },
  { id: "cl-7", label: "Smoke & CO alarms", severity: "ok" },
  { id: "cl-8", label: "Damp & mould check", severity: "ok" },
]

const STEPS = [
  { id: 1, label: "Inspection Type" },
  { id: 2, label: "Link Records" },
  { id: 3, label: "Schedule" },
  { id: 4, label: "Checklist" },
  { id: 5, label: "Reminders" },
  { id: 6, label: "Work Task" },
  { id: 7, label: "Review" },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StepSidebar({ current }: { current: number }) {
  return (
    <aside className="w-60 shrink-0 sticky top-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Progress</p>
        <ol className="space-y-1">
          {STEPS.map((step) => {
            const done = step.id < current
            const active = step.id === current
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  active && "bg-[#EFF6FF] text-[#2563EB]",
                  done && "text-emerald-600",
                  !active && !done && "text-slate-400"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    active && "bg-[#2563EB] text-white",
                    done && "bg-emerald-100 text-emerald-600",
                    !active && !done && "bg-slate-100 text-slate-400"
                  )}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : step.id}
                </span>
                {step.label}
              </li>
            )
          })}
        </ol>
      </div>
    </aside>
  )
}

function SummaryRail({
  inspectionType,
  property,
  scheduledDate,
  checklistCount,
}: {
  inspectionType: InspectionTypeKey | null
  property: string
  scheduledDate: string
  checklistCount: number
}) {
  const typeCfg = inspectionType ? INSPECTION_TYPES.find((t) => t.key === inspectionType) : null
  return (
    <aside className="w-64 shrink-0 sticky top-6">
      <Card className="p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Inspection Preview</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-400">Type</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {typeCfg?.label ?? <span className="text-slate-300 italic">Not selected</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Property</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {property || <span className="text-slate-300 italic">Not selected</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Scheduled Date</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {scheduledDate || <span className="text-slate-300 italic">Not set</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Checklist Items</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{checklistCount} items</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <Badge variant="primary" size="sm" dot>Scheduled</Badge>
          </div>
        </div>
      </Card>
    </aside>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function NewInspectionPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Step 1
  const [inspType, setInspType] = useState<InspectionTypeKey | null>(null)

  // Step 2
  const [propertyId, setPropertyId] = useState("")
  const [unit, setUnit] = useState("")
  const [inspectorId, setInspectorId] = useState("")
  const [supplierId, setSupplierId] = useState("")

  // Live properties + units for the selected property.
  const { data: liveProperties = [] } = useProperties(workspace?.id)
  const { data: liveUnits = [] } = useUnits(workspace?.id, propertyId || undefined)
  const properties = useMemo(
    () => liveProperties.map((p) => ({ id: p.id, name: p.name || p.address_line1 || "Property", units: [] as string[] })),
    [liveProperties]
  )

  // Step 3
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("10:00")
  const [duration, setDuration] = useState("1hr")
  const [inspectorNotes, setInspectorNotes] = useState("")

  // Step 4
  const [checklist, setChecklist] = useState<ChecklistItem[]>(ROUTINE_CHECKLIST)
  const [newItemLabel, setNewItemLabel] = useState("")

  // Step 5
  const [userReminder, setUserReminder] = useState("1day")
  const [inspectorReminderEnabled, setInspectorReminderEnabled] = useState(true)
  const [inspectorReminderTiming, setInspectorReminderTiming] = useState("1day")

  // Step 6
  const [createWorkJob, setCreateWorkJob] = useState(false)
  const [workJobTitle, setWorkJobTitle] = useState("")
  const [workJobAssignee, setWorkJobAssignee] = useState("")
  const [workJobDue, setWorkJobDue] = useState("")

  const selectedProperty = properties.find((p) => p.id === propertyId)
  const propertyUnits = liveUnits.map((u) => u.unit_name).filter(Boolean)
  const typeCfg = inspType ? INSPECTION_TYPES.find((t) => t.key === inspType) : null

  function addChecklistItem() {
    if (!newItemLabel.trim()) return
    setChecklist((prev) => [
      ...prev,
      { id: `cl-custom-${Date.now()}`, label: newItemLabel.trim(), severity: "ok" },
    ])
    setNewItemLabel("")
  }

  function removeChecklistItem(id: string) {
    setChecklist((prev) => prev.filter((i) => i.id !== id))
  }

  function updateSeverity(id: string, severity: ChecklistSeverity) {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, severity } : i)))
  }

  async function handleSchedule() {
    if (!workspace?.id) {
      setSaveError("No workspace — please reload and try again.")
      return
    }
    if (!inspType) {
      setSaveError("Please select an inspection type.")
      setStep(1)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      // Combine date + time into a timestamp for scheduled_date.
      const scheduledAt = scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || "10:00"}:00`).toISOString() : null
      const inspectorName = MOCK_INSPECTORS.find((c) => c.id === inspectorId)?.name ?? null
      const notesParts = [inspectorNotes || null, checklist.length ? `Checklist: ${checklist.map((c) => c.label).join(", ")}` : null].filter(Boolean)

      const { data, error } = await supabase
        .from("compliance_inspections")
        .insert({
          workspace_id: workspace.id,
          inspection_type: inspType,
          property_id: propertyId || null,
          scheduled_date: scheduledAt,
          inspector_name: inspectorName,
          status: "upcoming",
          findings_count: 0,
          evidence_count: 0,
          notes: notesParts.length ? notesParts.join("\n") : null,
        })
        .select("id")
        .single()

      if (error) {
        if (error.code === "42P01") {
          setSaved(true)
          return
        }
        setSaveError(error.message)
        setSaving(false)
        return
      }
      setNewId((data?.id as string) ?? null)
      setSaved(true)
    } catch (err) {
      console.error("Save error:", err)
      setSaveError(err instanceof Error ? err.message : "Unexpected error — please try again.")
      setSaving(false)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="space-y-0">
        <div className="min-h-[70vh] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Inspection Scheduled</h2>
            <p className="text-slate-500 mb-6">
              Your inspection has been created and reminders have been set.
            </p>
            <div className="flex gap-3 justify-center">
              {newId ? (
                <Button variant="primary" onClick={() => router.push(`/app/compliance/inspections/${newId}`)}>
                  View Inspection
                </Button>
              ) : (
                <Button variant="primary" asChild>
                  <Link href="/app/compliance/inspections">View Inspections</Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => { setSaved(false); setNewId(null); setStep(1) }}>
                Schedule Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="px-6 pt-4">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/app/compliance" className="hover:text-[#2563EB] transition-colors">Compliance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/app/compliance/inspections" className="hover:text-[#2563EB] transition-colors">Inspections</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-medium">Schedule Inspection</span>
        </nav>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Schedule Inspection</h1>
          <p className="text-sm text-slate-500 mt-1">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
        </div>

        <div className="flex gap-6 items-start">
          <StepSidebar current={step} />

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Step 1: Type */}
            {step === 1 && (
              <Card>
                <h2 className="text-base font-semibold text-slate-900 mb-1">Select Inspection Type</h2>
                <p className="text-sm text-slate-500 mb-4">Choose the type that best matches this inspection.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {INSPECTION_TYPES.map((t) => {
                    const Icon = t.icon
                    const selected = inspType === t.key
                    return (
                      <button
                        key={t.key}
                        onClick={() => setInspType(t.key)}
                        className={cn(
                          "text-left p-3 rounded-xl border-2 transition-all hover:shadow-sm",
                          selected
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${t.colour}18` }}
                        >
                          <div style={{ color: t.colour }}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>
                        <p className={cn("text-xs font-semibold", selected ? "text-[#2563EB]" : "text-slate-800")}>
                          {t.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                      </button>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Step 2: Link Records */}
            {step === 2 && (
              <Card>
                <h2 className="text-base font-semibold text-slate-900 mb-1">Link Records</h2>
                <p className="text-sm text-slate-500 mb-4">
                  {inspType === "supplier"
                    ? "Link a supplier and assign an inspector."
                    : "Link a property, unit, tenancy, and inspector."}
                </p>
                <div className="space-y-4">
                  {inspType !== "supplier" ? (
                    <>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Property <span className="text-red-500">*</span></label>
                        <select
                          value={propertyId}
                          onChange={(e) => { setPropertyId(e.target.value); setUnit("") }}
                          className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                        >
                          <option value="">Select a property…</option>
                          {properties.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {propertyId && propertyUnits.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-1.5">Unit</label>
                          <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                          >
                            <option value="">Whole property</option>
                            {propertyUnits.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">Supplier</label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                      >
                        <option value="">Select a supplier…</option>
                        <option value="s1">Propcare Services Ltd</option>
                        <option value="s2">Fire Safety Pro</option>
                        <option value="s3">BuildRight Contractors</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Inspector / Contact</label>
                    <select
                      value={inspectorId}
                      onChange={(e) => setInspectorId(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                    >
                      <option value="">Select an inspector…</option>
                      {MOCK_INSPECTORS.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
              <Card>
                <h2 className="text-base font-semibold text-slate-900 mb-1">Schedule Date & Time</h2>
                <p className="text-sm text-slate-500 mb-4">Set when the inspection will take place.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Scheduled Date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Time</label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                    >
                      {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                    >
                      <option value="30min">30 minutes</option>
                      <option value="1hr">1 hour</option>
                      <option value="2hr">2 hours</option>
                      <option value="halfday">Half day</option>
                      <option value="fullday">Full day</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Inspector Notes</label>
                  <textarea
                    value={inspectorNotes}
                    onChange={(e) => setInspectorNotes(e.target.value)}
                    rows={3}
                    placeholder="Any notes for the inspector…"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] resize-none"
                  />
                </div>
              </Card>
            )}

            {/* Step 4: Checklist */}
            {step === 4 && (
              <Card>
                <h2 className="text-base font-semibold text-slate-900 mb-1">Inspection Checklist</h2>
                <p className="text-sm text-slate-500 mb-4">
                  Pre-built checklist for {typeCfg?.label ?? "this inspection type"}. Add or remove items as needed.
                </p>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="flex-1 text-sm text-slate-800">{item.label}</span>
                      <select
                        value={item.severity}
                        onChange={(e) => updateSeverity(item.id, e.target.value as ChecklistSeverity)}
                        className="h-7 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/30"
                      >
                        <option value="ok">OK</option>
                        <option value="minor">Minor Issue</option>
                        <option value="major">Major Issue</option>
                        <option value="na">N/A</option>
                      </select>
                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                    placeholder="Add a checklist item…"
                    className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  />
                  <Button variant="outline" size="md" onClick={addChecklistItem}>
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 5: Reminders */}
            {step === 5 && (
              <Card>
                <h2 className="text-base font-semibold text-slate-900 mb-1">Reminder Settings</h2>
                <p className="text-sm text-slate-500 mb-4">Configure when reminders are sent for this inspection.</p>

                {/* Amber info */}
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                  <div className="mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Email not fully configured</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Go to Settings → Notifications to configure email reminders.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">
                      Remind me (user)
                    </label>
                    <select
                      value={userReminder}
                      onChange={(e) => setUserReminder(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                    >
                      <option value="attime">At time of inspection</option>
                      <option value="1hr">1 hour before</option>
                      <option value="1day">1 day before</option>
                      <option value="2days">2 days before</option>
                      <option value="1week">1 week before</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">Remind inspector / contact</p>
                      <p className="text-xs text-slate-500 mt-0.5">Send a reminder to the assigned inspector</p>
                    </div>
                    <button
                      onClick={() => setInspectorReminderEnabled((v) => !v)}
                      className={cn(
                        "relative w-10 h-6 rounded-full transition-colors",
                        inspectorReminderEnabled ? "bg-[#2563EB]" : "bg-slate-300"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                          inspectorReminderEnabled ? "translate-x-5" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {inspectorReminderEnabled && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">Inspector reminder timing</label>
                      <select
                        value={inspectorReminderTiming}
                        onChange={(e) => setInspectorReminderTiming(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                      >
                        <option value="attime">At time of inspection</option>
                        <option value="1hr">1 hour before</option>
                        <option value="1day">1 day before</option>
                        <option value="2days">2 days before</option>
                      </select>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Step 6: Work Task */}
            {step === 6 && (
              <Card>
                <h2 className="text-base font-semibold text-slate-900 mb-1">Linked Work Task</h2>
                <p className="text-sm text-slate-500 mb-4">Optionally create a linked work job for follow-up actions.</p>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">Create a linked Work job?</p>
                    <p className="text-xs text-slate-500 mt-0.5">Recommended for safety inspections</p>
                  </div>
                  <button
                    onClick={() => setCreateWorkJob((v) => !v)}
                    className={cn(
                      "relative w-10 h-6 rounded-full transition-colors",
                      createWorkJob ? "bg-[#2563EB]" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                        createWorkJob ? "translate-x-5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {createWorkJob && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Input
                      label="Job Title"
                      value={workJobTitle}
                      onChange={(e) => setWorkJobTitle(e.target.value)}
                      placeholder="e.g. Follow up on routine inspection findings"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Assignee</label>
                      <select
                        value={workJobAssignee}
                        onChange={(e) => setWorkJobAssignee(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                      >
                        <option value="">Select assignee…</option>
                        {MOCK_INSPECTORS.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Due Date"
                      type="date"
                      value={workJobDue}
                      onChange={(e) => setWorkJobDue(e.target.value)}
                    />
                  </div>
                )}
              </Card>
            )}

            {/* Step 7: Review */}
            {step === 7 && (
              <Card>
                <h2 className="text-base font-semibold text-slate-900 mb-1">Review & Schedule</h2>
                <p className="text-sm text-slate-500 mb-4">Review the details below before scheduling the inspection.</p>

                <div className="space-y-3 mb-6">
                  {[
                    {
                      label: "Type",
                      value: typeCfg?.label ?? "Not selected",
                      icon: <ClipboardList className="w-4 h-4 text-slate-400" />,
                    },
                    {
                      label: "Property",
                      value: selectedProperty?.name ?? "Not selected",
                      icon: <Building2 className="w-4 h-4 text-slate-400" />,
                    },
                    {
                      label: "Unit",
                      value: unit || "Whole property",
                      icon: <Home className="w-4 h-4 text-slate-400" />,
                    },
                    {
                      label: "Date & Time",
                      value: scheduledDate ? `${scheduledDate} at ${scheduledTime}` : "Not set",
                      icon: <Calendar className="w-4 h-4 text-slate-400" />,
                    },
                    {
                      label: "Duration",
                      value: duration,
                      icon: <Clock className="w-4 h-4 text-slate-400" />,
                    },
                    {
                      label: "Inspector",
                      value: MOCK_INSPECTORS.find((c) => c.id === inspectorId)?.name ?? "Not selected",
                      icon: <User className="w-4 h-4 text-slate-400" />,
                    },
                    {
                      label: "Checklist Items",
                      value: `${checklist.length} items`,
                      icon: <CheckCircle2 className="w-4 h-4 text-slate-400" />,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      {row.icon}
                      <span className="text-sm text-slate-500 w-32 shrink-0">{row.label}</span>
                      <span className="text-sm font-medium text-slate-900">{row.value}</span>
                    </div>
                  ))}
                </div>

                {saveError && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <p className="text-sm text-red-700">{saveError}</p>
                  </div>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={saving}
                  disabled={!inspType || !scheduledDate}
                  onClick={handleSchedule}
                >
                  {saving ? "Scheduling…" : "Schedule Inspection"}
                </Button>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="md"
                disabled={step === 1}
                onClick={() => setStep((s) => s - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="md" asChild>
                  <Link href="/app/compliance/inspections">Cancel</Link>
                </Button>
                {step < 7 && (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={step === 1 && !inspType}
                    onClick={() => setStep((s) => s + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right summary rail */}
          <SummaryRail
            inspectionType={inspType}
            property={selectedProperty?.name ?? ""}
            scheduledDate={scheduledDate}
            checklistCount={checklist.length}
          />
        </div>
      </div>
    </div>
  )
}
