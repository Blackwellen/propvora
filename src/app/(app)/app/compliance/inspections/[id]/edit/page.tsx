"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useContacts } from "@/hooks/useContacts"
import {
  ChevronRight,
  ChevronDown,
  Save,
  AlertTriangle,
  Trash2,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Live inspection_status enum values.
type InspectionStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "overdue"

const STATUS_OPTIONS: { value: InspectionStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
]

const INSPECTION_TYPES = [
  { value: "routine", label: "Routine Property Inspection" },
  { value: "move_in", label: "Move-in Inspection" },
  { value: "move_out", label: "Move-out Inspection" },
  { value: "inventory", label: "Inventory Check" },
  { value: "safety", label: "Safety Inspection" },
  { value: "maintenance", label: "Maintenance Inspection" },
  { value: "hmo_room", label: "HMO Room Inspection" },
  { value: "fire_safety", label: "Fire Safety Inspection" },
  { value: "supplier", label: "Supplier Site Visit" },
  { value: "pre_tenancy", label: "Pre-tenancy Inspection" },
  { value: "post_tenancy", label: "Post-tenancy Inspection" },
  { value: "other", label: "Other" },
]

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </Card>
  )
}

// ── Dangerous actions ─────────────────────────────────────────────────────────

function DangerousActions({ onCancel, onDelete }: { onCancel: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState("")

  return (
    <div className="border border-red-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 sm:px-5 py-4 bg-red-50 hover:bg-red-100 transition-colors">
        <div className="flex items-center gap-3">
          <div style={{ color: "#DC2626" }}><AlertTriangle className="w-5 h-5" /></div>
          <div className="text-left">
            <p className="text-sm font-semibold text-red-800">Dangerous Actions</p>
            <p className="text-xs text-red-600">Cancel or permanently delete this inspection</p>
          </div>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-red-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="bg-white p-4 sm:p-5 space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-amber-800">Cancel Inspection</p>
                <p className="text-xs text-amber-700 mt-0.5">Mark this inspection as cancelled</p>
              </div>
              <Button variant="warning" size="sm" onClick={() => setCancelConfirm(true)}>
                <XCircle className="w-3.5 h-3.5" />
                Cancel Inspection
              </Button>
            </div>
            {cancelConfirm && (
              <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-amber-100 border border-amber-300 rounded-xl flex-wrap">
                <p className="text-sm text-amber-800 flex-1 font-medium">Are you sure? This will mark the inspection as cancelled.</p>
                <Button variant="warning" size="sm" onClick={() => { setCancelConfirm(false); onCancel() }}>Confirm Cancel</Button>
                <Button variant="outline" size="sm" onClick={() => setCancelConfirm(false)}>Keep</Button>
              </div>
            )}
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-red-800">Delete Inspection Record</p>
                <p className="text-xs text-red-600 mt-0.5">Permanently delete this inspection. This cannot be undone.</p>
              </div>
              <Button variant="destructive-soft" size="sm" onClick={() => setDeleteOpen((v) => !v)}>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
            {deleteOpen && (
              <div className="mt-3 space-y-3">
                <div className="px-4 py-3 bg-red-100 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800 font-medium">Type <span className="font-bold">DELETE</span> to confirm deletion:</p>
                </div>
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[160px]">
                    <Input placeholder='Type "DELETE" to confirm…' value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
                  </div>
                  <Button variant="destructive" size="md" disabled={deleteText !== "DELETE"} onClick={onDelete}>
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
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  const { workspace } = useWorkspace()
  const { data: properties = [] } = useProperties(workspace?.id)
  const { data: liveContacts = [] } = useContacts(workspace?.id)

  const [inspType, setInspType] = useState("routine")
  const [notes, setNotes] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [inspectorId, setInspectorId] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("10:00")
  const [status, setStatus] = useState<InspectionStatus>("scheduled")

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error: err } = await supabase
        .from("property_inspections")
        .select("*")
        .eq("id", id)
        .single()
      if (!active) return
      if (err || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const r = data as Record<string, unknown>
      setInspType((r.kind as string) ?? "routine")
      setNotes((r.notes as string) ?? "")
      setPropertyId((r.property_id as string) ?? "")
      setInspectorId((r.inspector_id as string) ?? "")
      setSupplierId((r.supplier_id as string) ?? "")
      const sched = r.scheduled_for as string | null
      if (sched) {
        const d = new Date(sched)
        setScheduledDate(d.toISOString().slice(0, 10))
        setScheduledTime(d.toISOString().slice(11, 16))
      }
      setStatus(((r.status as string) ?? "scheduled") as InspectionStatus)
      setLoading(false)
    })()
    return () => { active = false }
  }, [id, supabase])

  async function handleSave() {
    setSaving(true)
    setError(null)
    const scheduledAt = scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || "10:00"}:00`).toISOString() : null
    const { error: err } = await supabase
      .from("property_inspections")
      .update({
        kind: inspType,
        property_id: propertyId || null,
        inspector_id: inspectorId || null,
        supplier_id: supplierId || null,
        scheduled_for: scheduledAt,
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setSavedMsg("Changes saved successfully")
    setTimeout(() => setSavedMsg(""), 3000)
  }

  async function handleCancelInspection() {
    await supabase.from("property_inspections").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id)
    router.push(`/property-manager/compliance/inspections/${id}`)
  }

  async function handleDelete() {
    await supabase.from("property_inspections").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    router.push("/property-manager/compliance/inspections")
  }

  if (loading) {
    return <div className="p-10 text-center text-sm text-slate-400">Loading inspection…</div>
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Inspection not found</h2>
        <p className="text-sm text-slate-500 mb-5">This inspection may have been removed.</p>
        <Button variant="primary" size="sm" asChild>
          <Link href="/property-manager/compliance/inspections">Back to Inspections</Link>
        </Button>
      </div>
    )
  }

  const typeLabel = INSPECTION_TYPES.find((t) => t.value === inspType)?.label ?? "Inspection"

  return (
    <div className="space-y-0 pb-[120px] lg:pb-0">
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <nav className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <Link href="/property-manager/compliance" className="hover:text-[var(--brand)] transition-colors">Compliance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/property-manager/compliance/inspections" className="hover:text-[var(--brand)] transition-colors">Inspections</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/property-manager/compliance/inspections/${id}`} className="hover:text-[var(--brand)] transition-colors">{typeLabel}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-medium">Edit</span>
        </nav>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Edit Inspection</h1>
          <p className="text-sm text-slate-500 mt-1">{typeLabel}</p>
        </div>

        <SectionCard title="Inspection Details" description="Modify the inspection type and general notes.">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Inspection Type</label>
              <select
                value={inspType}
                onChange={(e) => setInspType(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] max-h-60 overflow-y-auto"
              >
                {INSPECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any notes about this inspection…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] resize-none"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Linked Records" description="Property, inspector, and supplier linkages.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Property</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] max-h-60 overflow-y-auto"
              >
                <option value="">{properties.length ? "Select property…" : "No properties found"}</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name || p.address_line1 || "Property"}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Inspector / Contact</label>
              <select
                value={inspectorId}
                onChange={(e) => setInspectorId(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] max-h-60 overflow-y-auto"
              >
                <option value="">{liveContacts.length ? "Select inspector…" : "No contacts found"}</option>
                {liveContacts.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.company_name || "Contact"}</option>)}
              </select>
            </div>

            {inspType === "supplier" && (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] max-h-60 overflow-y-auto"
                >
                  <option value="">{liveContacts.length ? "Select supplier…" : "No contacts found"}</option>
                  {liveContacts.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.company_name || "Contact"}</option>)}
                </select>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Schedule" description="Update the scheduled date and time.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Scheduled Date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Scheduled Time</label>
              <select
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] max-h-60 overflow-y-auto"
              >
                {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Status" description="Override the inspection status.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InspectionStatus)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] max-h-60 overflow-y-auto"
              >
                {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </SectionCard>

        <DangerousActions onCancel={handleCancelInspection} onDelete={handleDelete} />

        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="h-20" />
      </div>

      <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 shadow-lg px-4 sm:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {savedMsg && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" />
                {savedMsg}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" asChild>
              <Link href={`/property-manager/compliance/inspections/${id}`}>Discard Changes</Link>
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
