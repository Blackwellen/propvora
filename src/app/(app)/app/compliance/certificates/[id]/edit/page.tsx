"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useContacts } from "@/hooks/useContacts"
import {
  ChevronRight,
  ChevronDown,
  Flame,
  AlertTriangle,
  Trash2,
  Archive,
  RefreshCw,
  Save,
  X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type CertStatus = "valid" | "expiring_soon" | "expired" | "missing" | "exempt"

interface EditState {
  certType: string
  referenceNumber: string
  notes: string
  property: string
  unit: string
  issuerContact: string
  issueDate: string
  expiryDate: string
  status: CertStatus
}

const EMPTY_STATE: EditState = {
  certType: "gas_safety",
  referenceNumber: "",
  notes: "",
  property: "",
  unit: "",
  issuerContact: "",
  issueDate: "",
  expiryDate: "",
  status: "valid",
}

// Live compliance_kind enum values.
const CERT_TYPE_OPTIONS = [
  { value: "gas_safety", label: "Gas Safety Certificate" },
  { value: "eicr", label: "EICR" },
  { value: "epc", label: "EPC" },
  { value: "pat", label: "PAT Test" },
  { value: "fire_alarm", label: "Fire Alarm" },
  { value: "emergency_lighting", label: "Emergency Lighting" },
  { value: "legionella", label: "Legionella" },
  { value: "hmo_licence", label: "HMO Licence" },
  { value: "selective_licence", label: "Selective Licence" },
  { value: "insurance", label: "Insurance" },
  { value: "deposit_protection", label: "Deposit Protection" },
  { value: "right_to_rent", label: "Right to Rent" },
  { value: "smoke_co_alarm", label: "Smoke / CO Alarm" },
  { value: "fire_door", label: "Fire Door" },
  { value: "other", label: "Other" },
]

// View-model status ↔ live compliance_status enum.
const STATUS_OPTIONS: { value: CertStatus; label: string }[] = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "missing", label: "Missing" },
  { value: "exempt", label: "Exempt / Not Required" },
]

function toItemStatus(s: CertStatus): string {
  switch (s) {
    case "valid": return "ok"
    case "expiring_soon": return "due_soon"
    case "expired": return "overdue"
    case "missing": return "missing"
    case "exempt": return "exempt"
    default: return "ok"
  }
}

function fromItemStatus(s: string): CertStatus {
  switch (s) {
    case "ok": return "valid"
    case "due_soon": return "expiring_soon"
    case "overdue": return "expired"
    case "missing": return "missing"
    case "exempt": return "exempt"
    default: return "valid"
  }
}

function calcDuration(issue: string, expiry: string): string {
  if (!issue || !expiry) return "—"
  const months = Math.round((new Date(expiry).getTime() - new Date(issue).getTime()) / (1000 * 60 * 60 * 24 * 30))
  return `${months} months`
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 mb-4">
      <h3 className="text-base font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100">{title}</h3>
      {children}
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] bg-white"
    />
  )
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] bg-white max-h-60 overflow-y-auto"
    >
      {children}
    </select>
  )
}

// ─── Dangerous Actions ─────────────────────────────────────────────────────────

function DangerousActions({ referenceNumber, onArchive, onDelete }: { referenceNumber: string; onArchive: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const confirmWord = referenceNumber || "DELETE"
  const deleteMatch = deleteInput === confirmWord

  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-4 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-red-600">Dangerous Actions</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-amber-700">Archive Certificate</p>
                <p className="text-xs text-slate-500 mt-0.5">Hide from active views. Can be restored from the archive.</p>
              </div>
              <Button variant="outline" size="sm" className="text-amber-700 border-amber-200 hover:bg-amber-50" onClick={() => setShowArchive(!showArchive)}>
                <Archive className="w-3.5 h-3.5" />
                Archive
              </Button>
            </div>
            {showArchive && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 flex-wrap">
                <Archive className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 flex-1">Archive this certificate?</p>
                <Button variant="warning" size="sm" onClick={onArchive}>Confirm Archive</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowArchive(false)}>Cancel</Button>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 py-4 bg-red-50/50">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-red-700">Delete Certificate</p>
                <p className="text-xs text-slate-500 mt-0.5">Permanently remove this certificate. This cannot be undone.</p>
              </div>
              <Button variant="destructive-soft" size="sm" onClick={() => setShowDelete(!showDelete)}>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
            {showDelete && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-600 mb-3">
                  Type <span className="font-mono font-bold bg-red-100 px-1 rounded">{confirmWord}</span> to confirm deletion.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={`Type "${confirmWord}"`}
                    className="flex-1 min-w-[180px] h-9 rounded-lg border border-red-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 bg-white"
                  />
                  <Button variant="destructive" size="sm" disabled={!deleteMatch} onClick={onDelete}>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Forever
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowDelete(false); setDeleteInput("") }}>
                    <X className="w-3.5 h-3.5" />
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EditCertificatePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  const { workspace } = useWorkspace()
  const { data: properties = [] } = useProperties(workspace?.id)
  const { data: liveContacts = [] } = useContacts(workspace?.id)

  const [state, setState] = useState<EditState>(EMPTY_STATE)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (partial: Partial<EditState>) => setState((prev) => ({ ...prev, ...partial }))

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error: err } = await supabase
        .from("compliance_items")
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
      const meta = (r.metadata ?? {}) as { issuer?: string }
      setState({
        certType: (r.kind as string) ?? "gas_safety",
        referenceNumber: (r.reference_no as string) ?? "",
        notes: (r.notes as string) ?? "",
        property: (r.property_id as string) ?? "",
        unit: "",
        issuerContact: meta.issuer ?? "",
        issueDate: (r.last_completed_at as string) ?? "",
        expiryDate: (r.due_date as string) ?? "",
        status: fromItemStatus((r.status as string) ?? "ok"),
      })
      setLoading(false)
    })()
    return () => { active = false }
  }, [id, supabase])

  const duration = calcDuration(state.issueDate, state.expiryDate)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from("compliance_items")
      .update({
        kind: state.certType,
        reference_no: state.referenceNumber || null,
        notes: state.notes || (state.issuerContact ? `Issuer: ${state.issuerContact}` : null),
        property_id: state.property || null,
        last_completed_at: state.issueDate || null,
        due_date: state.expiryDate || null,
        status: toItemStatus(state.status),
        metadata: { issuer: state.issuerContact || null },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleArchive() {
    await supabase.from("compliance_items").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    router.push("/property-manager/compliance/certificates")
  }

  async function handleDelete() {
    await supabase.from("compliance_items").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    router.push("/property-manager/compliance/certificates")
  }

  if (loading) {
    return <div className="p-10 text-center text-sm text-slate-400">Loading certificate…</div>
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Certificate not found</h2>
        <p className="text-sm text-slate-500 mb-5">This compliance record may have been removed.</p>
        <Button variant="primary" size="sm" asChild>
          <Link href="/property-manager/compliance/certificates">Back to Certificates</Link>
        </Button>
      </div>
    )
  }

  const typeLabel = CERT_TYPE_OPTIONS.find((o) => o.value === state.certType)?.label ?? "Certificate"

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-white">
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/property-manager/compliance" className="text-slate-400 hover:text-slate-600">Compliance</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/property-manager/compliance/certificates" className="text-slate-400 hover:text-slate-600">Certificates</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href={`/property-manager/compliance/certificates/${id}`} className="text-slate-400 hover:text-slate-600">{typeLabel}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-medium">Edit</span>
        </nav>
      </div>

      {/* Title */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <div style={{ color: "#f97316" }}><Flame className="w-5 h-5" /></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Edit Certificate</h1>
            <p className="text-sm text-slate-500">{typeLabel}</p>
          </div>
        </div>
        {saved && <Badge variant="success" size="md" dot>Changes saved</Badge>}
      </div>

      <div className="px-4 sm:px-6 pb-32 lg:pb-28">
        <SectionCard title="Certificate Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Label required>Certificate Type</Label>
              <SelectInput value={state.certType} onChange={(v) => update({ certType: v })}>
                {CERT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input value={state.referenceNumber} onChange={(v) => update({ referenceNumber: v })} placeholder="e.g. GAS-2025-001" />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <textarea
                value={state.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Any additional notes about this certificate..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] bg-white resize-none"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Linked Records">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Property</Label>
              <SelectInput value={state.property} onChange={(v) => update({ property: v })}>
                <option value="">{properties.length ? "Select property..." : "No properties found"}</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name || p.address_line1 || "Property"}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label>Unit <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
              <Input value={state.unit} onChange={(v) => update({ unit: v })} placeholder="e.g. Flat 2" />
            </div>
            <div className="sm:col-span-2">
              <Label>Issuer / Certifier Contact</Label>
              <SelectInput value={state.issuerContact} onChange={(v) => update({ issuerContact: v })}>
                <option value="">{liveContacts.length ? "Select contact..." : "No contacts found"}</option>
                {liveContacts.map((c) => <option key={c.id} value={c.full_name || c.company_name || "Contact"}>{c.full_name || c.company_name || "Contact"}</option>)}
              </SelectInput>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Dates">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Issue Date</Label>
              <Input type="date" value={state.issueDate} onChange={(v) => update({ issueDate: v })} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={state.expiryDate} onChange={(v) => update({ expiryDate: v })} />
            </div>
          </div>
          {state.issueDate && state.expiryDate && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-soft)] rounded-lg border border-[#BFDBFE]">
              <RefreshCw className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-sm font-medium text-[var(--brand)]">Certificate valid for: <strong>{duration}</strong></span>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Status">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label required>Status</Label>
              <SelectInput value={state.status} onChange={(v) => update({ status: v as CertStatus })}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </SelectInput>
            </div>
          </div>
        </SectionCard>

        <DangerousActions referenceNumber={state.referenceNumber} onArchive={handleArchive} onDelete={handleDelete} />

        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Sticky Save Bar */}
      <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-lg flex-wrap">
        <p className="text-sm text-slate-500 truncate">
          Editing: <span className="font-semibold text-slate-700">{typeLabel}</span>
          {saved && <span className="ml-3 text-emerald-600 font-medium">✓ Saved</span>}
        </p>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" size="md" asChild>
            <Link href={`/property-manager/compliance/certificates/${id}`}>Cancel</Link>
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
