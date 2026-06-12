"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ComplianceTabNav } from "@/components/compliance/ComplianceTabNav"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import {
  ChevronRight,
  ChevronDown,
  Save,
  AlertTriangle,
  Trash2,
  RefreshCw,
  XCircle,
  Plus,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type InspectionStatus =
  | "scheduled"
  | "due"
  | "overdue"
  | "completed"
  | "passed"
  | "failed"
  | "cancelled"
  | "actions_required"

type InspectionOutcome =
  | "pass"
  | "fail"
  | "pass_with_actions"
  | "inconclusive"
  | "cancelled"
  | ""

type ChecklistSeverity = "ok" | "minor" | "major" | "na"

interface ChecklistItem {
  id: string
  label: string
  severity: ChecklistSeverity
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PROPERTIES = [
  { id: "p1", name: "8 Clarence Rd", units: ["Flat 1", "Flat 2", "Flat 3"] },
  { id: "p2", name: "12 Brunswick Ave", units: ["Flat A", "Flat B"] },
  { id: "p3", name: "47 Victoria Terrace", units: [] },
  { id: "p4", name: "5 Maple Street", units: ["Unit 1", "Unit 2", "Unit 3"] },
  { id: "p5", name: "22 Oak Lane", units: [] },
]

const MOCK_CONTACTS = [
  { id: "c1", name: "Sarah Chen", role: "Property Manager" },
  { id: "c2", name: "James Patel", role: "Inspector" },
  { id: "c3", name: "Alex Morgan", role: "Contractor" },
  { id: "c4", name: "Fire Inspector Ltd", role: "Specialist" },
]

const MOCK_TENANCIES = [
  { id: "t1", propertyId: "p1", tenant: "M. Davies", unit: "Flat 1" },
  { id: "t2", propertyId: "p1", tenant: "J. Smith", unit: "Flat 2" },
  { id: "t3", propertyId: "p2", tenant: "A. Brown", unit: "Flat A" },
]

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: "cl-1", label: "General condition", severity: "ok" },
  { id: "cl-2", label: "Electrics & sockets", severity: "ok" },
  { id: "cl-3", label: "Plumbing & water pressure", severity: "ok" },
  { id: "cl-4", label: "Heating system", severity: "ok" },
  { id: "cl-5", label: "Windows & doors", severity: "ok" },
  { id: "cl-6", label: "Garden / external areas", severity: "ok" },
  { id: "cl-7", label: "Smoke & CO alarms", severity: "ok" },
  { id: "cl-8", label: "Damp & mould check", severity: "ok" },
]

const STATUS_OPTIONS: { value: InspectionStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "due", label: "Due" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "actions_required", label: "Actions Required" },
]

const OUTCOME_OPTIONS: { value: InspectionOutcome; label: string }[] = [
  { value: "", label: "No outcome yet" },
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
  { value: "pass_with_actions", label: "Pass with Actions" },
  { value: "inconclusive", label: "Inconclusive" },
  { value: "cancelled", label: "Cancelled" },
]

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("", className)}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </Card>
  )
}

// ── Dangerous actions accordion ───────────────────────────────────────────────

function DangerousActions({ propertyName }: { propertyName: string }) {
  const [open, setOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  return (
    <div className="border border-red-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-red-50 hover:bg-red-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div style={{ color: "#DC2626" }}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-red-800">Dangerous Actions</p>
            <p className="text-xs text-red-600">Reschedule, cancel, or permanently delete this inspection</p>
          </div>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-red-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="bg-white p-5 space-y-4">
          {/* Reschedule */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-800">Reschedule Inspection</p>
                <p className="text-xs text-amber-700 mt-0.5">Pick a new date for this inspection</p>
              </div>
              <Button
                variant="warning"
                size="sm"
                onClick={() => setRescheduleOpen((v) => !v)}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule
              </Button>
            </div>
            {rescheduleOpen && (
              <div className="mt-3 flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="New Date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>
                <Button
                  variant="warning"
                  size="md"
                  disabled={!rescheduleDate}
                  onClick={() => { setRescheduleOpen(false); setRescheduleDate("") }}
                >
                  Confirm
                </Button>
              </div>
            )}
          </div>

          {/* Cancel */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-800">Cancel Inspection</p>
                <p className="text-xs text-amber-700 mt-0.5">Mark this inspection as cancelled</p>
              </div>
              <Button
                variant="warning"
                size="sm"
                onClick={() => setCancelConfirm(true)}
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Inspection
              </Button>
            </div>
            {cancelConfirm && (
              <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-amber-100 border border-amber-300 rounded-xl">
                <p className="text-sm text-amber-800 flex-1 font-medium">
                  Are you sure? This will mark the inspection as cancelled.
                </p>
                <Button variant="warning" size="sm" onClick={() => setCancelConfirm(false)}>
                  Confirm Cancel
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCancelConfirm(false)}>
                  Keep
                </Button>
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-800">Delete Inspection Record</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Permanently delete all data for this inspection. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive-soft"
                size="sm"
                onClick={() => setDeleteOpen((v) => !v)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
            {deleteOpen && (
              <div className="mt-3 space-y-3">
                <div className="px-4 py-3 bg-red-100 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800 font-medium">
                    Type <span className="font-bold">{propertyName}</span> to confirm deletion:
                  </p>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder={`Type "${propertyName}" to confirm…`}
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="md"
                    disabled={deleteConfirmText !== propertyName}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main edit page ────────────────────────────────────────────────────────────

export default function EditInspectionPage() {
  const params = useParams()
  const _id = params.id as string

  // Section 1: Details
  const [inspType, setInspType] = useState("routine")
  const [notes, setNotes] = useState("")

  // Section 2: Linked Records
  const [propertyId, setPropertyId] = useState("p1")
  const [unit, setUnit] = useState("")
  const [tenancyId, setTenancyId] = useState("t1")
  const [inspectorId, setInspectorId] = useState("c1")
  const [supplierId, setSupplierId] = useState("")

  // Section 3: Schedule
  const [scheduledDate, setScheduledDate] = useState("2026-05-21")
  const [scheduledTime, setScheduledTime] = useState("10:00")
  const [duration, setDuration] = useState("1hr")
  const [inspectorNotes, setInspectorNotes] = useState("")

  // Section 4: Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST)
  const [newItemLabel, setNewItemLabel] = useState("")

  // Section 5: Status & Outcome
  const [status, setStatus] = useState<InspectionStatus>("overdue")
  const [outcome, setOutcome] = useState<InspectionOutcome>("")
  const [followUpDate, setFollowUpDate] = useState("")

  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")

  const selectedProperty = MOCK_PROPERTIES.find((p) => p.id === propertyId)
  const propertyTenancies = MOCK_TENANCIES.filter((t) => t.propertyId === propertyId)

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

  function updateChecklistLabel(id: string, label: string) {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, label } : i)))
  }

  function updateSeverity(id: string, severity: ChecklistSeverity) {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, severity } : i)))
  }

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSavedMsg("Changes saved successfully")
    setTimeout(() => setSavedMsg(""), 3000)
  }

  return (
    <div className="space-y-0">
      <ComplianceTabNav />

      {/* Breadcrumb */}
      <div className="px-6 pt-4 pb-2">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/app/compliance" className="hover:text-[#2563EB] transition-colors">Compliance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/app/compliance/inspections" className="hover:text-[#2563EB] transition-colors">Inspections</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={`/app/compliance/inspections/${_id}`}
            className="hover:text-[#2563EB] transition-colors"
          >
            Routine Inspection — 8 Clarence Rd
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-medium">Edit</span>
        </nav>
      </div>

      <div className="p-6 space-y-5">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Edit Inspection</h1>
          <p className="text-sm text-slate-500 mt-1">Routine Property Inspection — 8 Clarence Rd</p>
        </div>

        {/* Section 1: Inspection Details */}
        <SectionCard
          title="Inspection Details"
          description="Modify the inspection type and general notes."
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Inspection Type</label>
              <select
                value={inspType}
                onChange={(e) => setInspType(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              >
                <option value="routine">Routine Property Inspection</option>
                <option value="move_in">Move-in Inspection</option>
                <option value="move_out">Move-out Inspection</option>
                <option value="inventory">Inventory Check</option>
                <option value="safety">Safety Inspection</option>
                <option value="maintenance">Maintenance Inspection</option>
                <option value="hmo_room">HMO Room Inspection</option>
                <option value="fire_safety">Fire Safety Inspection</option>
                <option value="supplier">Supplier Site Visit</option>
                <option value="pre_tenancy">Pre-tenancy Inspection</option>
                <option value="post_tenancy">Post-tenancy Inspection</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any notes about this inspection…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] resize-none"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Linked Records */}
        <SectionCard
          title="Linked Records"
          description="Property, unit, tenancy, inspector, and supplier linkages."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Property</label>
              <select
                value={propertyId}
                onChange={(e) => { setPropertyId(e.target.value); setUnit(""); setTenancyId("") }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              >
                <option value="">Select property…</option>
                {MOCK_PROPERTIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={!selectedProperty || selectedProperty.units.length === 0}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Whole property</option>
                {selectedProperty?.units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tenancy</label>
              <select
                value={tenancyId}
                onChange={(e) => setTenancyId(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              >
                <option value="">No tenancy linked</option>
                {propertyTenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenant}{t.unit ? ` — ${t.unit}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Inspector / Contact</label>
              <select
                value={inspectorId}
                onChange={(e) => setInspectorId(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              >
                <option value="">Select inspector…</option>
                {MOCK_CONTACTS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
                ))}
              </select>
            </div>

            {inspType === "supplier" && (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                >
                  <option value="">Select supplier…</option>
                  <option value="s1">Propcare Services Ltd</option>
                  <option value="s2">Fire Safety Pro</option>
                  <option value="s3">BuildRight Contractors</option>
                </select>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Section 3: Schedule */}
        <SectionCard
          title="Schedule"
          description="Update the scheduled date, time, and duration."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Scheduled Date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Scheduled Time</label>
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
          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Inspector Notes</label>
            <textarea
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              rows={3}
              placeholder="Any notes for the inspector…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] resize-none"
            />
          </div>
        </SectionCard>

        {/* Section 4: Checklist */}
        <SectionCard
          title="Checklist"
          description="Edit, add, or remove checklist items for this inspection."
        >
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100"
              >
                <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateChecklistLabel(item.id, e.target.value)}
                  className="flex-1 text-sm text-slate-800 bg-transparent border-none outline-none focus:ring-0"
                />
                <select
                  value={item.severity}
                  onChange={(e) => updateSeverity(item.id, e.target.value as ChecklistSeverity)}
                  className="h-7 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none"
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
        </SectionCard>

        {/* Section 5: Status & Outcome */}
        <SectionCard
          title="Status & Outcome"
          description="Override the inspection status, record outcome, and set a follow-up date."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InspectionStatus)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as InspectionOutcome)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              >
                {OUTCOME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Follow-up Date"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
        </SectionCard>

        {/* Dangerous actions */}
        <DangerousActions propertyName="8 Clarence Rd" />

        {/* Spacer for sticky save bar */}
        <div className="h-20" />
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {savedMsg && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#059669" strokeWidth="1.5" />
                  <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {savedMsg}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" asChild>
              <Link href={`/app/compliance/inspections/${_id}`}>Discard Changes</Link>
            </Button>
            <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
