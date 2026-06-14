"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import {
  ChevronRight,
  ChevronDown,
  Flame,
  UploadCloud,
  FileText,
  AlertTriangle,
  Trash2,
  Archive,
  RefreshCw,
  Save,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type CertStatus  = "valid" | "expiring_soon" | "expired" | "missing" | "renewal_scheduled" | "not_required" | "superseded"
type RiskLevel   = "critical" | "high" | "watch" | "low" | "n/a"

interface EditState {
  certType:         string
  referenceNumber:  string
  notes:            string
  property:         string
  unit:             string
  tenancy:          string
  supplier:         string
  issuerContact:    string
  issueDate:        string
  expiryDate:       string
  status:           CertStatus
  riskLevel:        RiskLevel
  notRequired:      boolean
  notRequiredNote:  string
}

// ─── Mock Pre-fill ────────────────────────────────────────────────────────────

const INITIAL_STATE: EditState = {
  certType:        "gas_safety",
  referenceNumber: "GAS-2025-001",
  notes:           "",
  property:        "14 Westbourne Gardens",
  unit:            "Whole property",
  tenancy:         "",
  supplier:        "",
  issuerContact:   "Elite Gas Services",
  issueDate:       "2025-06-04",
  expiryDate:      "2026-07-04",
  status:          "expiring_soon",
  riskLevel:       "watch",
  notRequired:     false,
  notRequiredNote: "",
}

const CERT_TYPE_OPTIONS = [
  { value: "gas_safety",          label: "Gas Safety Certificate" },
  { value: "eicr",                label: "EICR" },
  { value: "epc",                 label: "EPC" },
  { value: "fire_risk",           label: "Fire Risk Assessment" },
  { value: "hmo_licence",         label: "HMO Licence" },
  { value: "building_insurance",  label: "Buildings Insurance" },
  { value: "pat_test",            label: "PAT Test" },
  { value: "landlord_insurance",  label: "Landlord Insurance" },
  { value: "other",               label: "Other" },
]

const STATUS_OPTIONS: { value: CertStatus; label: string }[] = [
  { value: "valid",              label: "Valid" },
  { value: "expiring_soon",      label: "Expiring Soon" },
  { value: "expired",            label: "Expired" },
  { value: "missing",            label: "Missing" },
  { value: "renewal_scheduled",  label: "Renewal Scheduled" },
  { value: "not_required",       label: "Not Required" },
  { value: "superseded",         label: "Superseded" },
]

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high",     label: "High" },
  { value: "watch",    label: "Watch" },
  { value: "low",      label: "Low" },
  { value: "n/a",      label: "N/A" },
]

const MOCK_PROPERTIES = [
  "14 Westbourne Gardens",
  "Brunswick Road HMO",
  "Maple Street HMO",
  "Oak Lane BTL",
  "Victoria Terrace",
]

const MOCK_CONTACTS = [
  "Elite Gas Services",
  "SafeWire Services",
  "EPC Direct",
  "FireSafe Assessors",
  "Council Licensing",
  "ProLet Insure",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcDuration(issue: string, expiry: string): string {
  if (!issue || !expiry) return "—"
  const months = Math.round(
    (new Date(expiry).getTime() - new Date(issue).getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  return `${months} months`
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 mb-4">
      <h3 className="text-base font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100">{title}</h3>
      {children}
    </div>
  )
}

// ─── Field Components ─────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] bg-white"
    />
  )
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] bg-white"
    >
      {children}
    </select>
  )
}

// ─── Dangerous Actions Accordion ──────────────────────────────────────────────

function DangerousActions({ referenceNumber }: { referenceNumber: string }) {
  const [open, setOpen]                     = useState(false)
  const [showSupersede, setShowSupersede]   = useState(false)
  const [showArchive, setShowArchive]       = useState(false)
  const [showDelete, setShowDelete]         = useState(false)
  const [deleteInput, setDeleteInput]       = useState("")
  const deleteMatch                         = deleteInput === referenceNumber

  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-red-600">Dangerous Actions</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {/* Mark as Superseded */}
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-700">Mark as Superseded</p>
                <p className="text-xs text-slate-500 mt-0.5">This certificate has been replaced by a newer one. It will remain in records as historical.</p>
              </div>
              <Button
                variant="warning"
                size="sm"
                onClick={() => setShowSupersede(!showSupersede)}
              >
                Mark Superseded
              </Button>
            </div>
            {showSupersede && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 flex-1">Are you sure? This will mark the certificate as superseded.</p>
                <Button variant="warning" size="sm">Confirm</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSupersede(false)}>Cancel</Button>
              </div>
            )}
          </div>

          {/* Archive */}
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-700">Archive Certificate</p>
                <p className="text-xs text-slate-500 mt-0.5">This will hide the certificate from active views. It can be restored from the archive.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-200 hover:bg-amber-50"
                onClick={() => setShowArchive(!showArchive)}
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </Button>
            </div>
            {showArchive && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Archive className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 flex-1">Archive this certificate? It will be hidden from active compliance views.</p>
                <Button variant="warning" size="sm">Confirm Archive</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowArchive(false)}>Cancel</Button>
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="px-6 py-4 bg-red-50/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-700">Delete Certificate</p>
                <p className="text-xs text-slate-500 mt-0.5">Permanently delete this certificate and all associated data. This action cannot be undone.</p>
              </div>
              <Button
                variant="destructive-soft"
                size="sm"
                onClick={() => setShowDelete(!showDelete)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
            {showDelete && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-sm font-bold text-red-700">Confirm Permanent Deletion</p>
                </div>
                <p className="text-xs text-red-600 mb-3">
                  Type <span className="font-mono font-bold bg-red-100 px-1 rounded">{referenceNumber}</span> to confirm deletion.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={`Type "${referenceNumber}" to confirm`}
                    className="flex-1 h-9 rounded-lg border border-red-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 bg-white"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!deleteMatch}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Forever
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowDelete(false); setDeleteInput("") }}
                  >
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
  const id = params.id as string

  const [state, setState] = useState<EditState>(INITIAL_STATE)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const update = (partial: Partial<EditState>) =>
    setState((prev) => ({ ...prev, ...partial }))

  const duration = calcDuration(state.issueDate, state.expiryDate)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); setSaved(true) }, 1000)
  }

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/app/compliance" className="text-slate-400 hover:text-slate-600">Compliance</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/app/compliance/certificates" className="text-slate-400 hover:text-slate-600">Certificates</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href={`/app/compliance/certificates/${id}`} className="text-slate-400 hover:text-slate-600">Gas Safety — 14 Westbourne Gardens</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-medium">Edit</span>
        </nav>
      </div>

      {/* Page Title */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <div style={{ color: "#f97316" }}><Flame className="w-5 h-5" /></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Edit Certificate</h1>
            <p className="text-sm text-slate-500">Gas Safety — 14 Westbourne Gardens</p>
          </div>
        </div>
        {saved && (
          <Badge variant="success" size="md" dot>Changes saved</Badge>
        )}
      </div>

      {/* Form */}
      <div className="px-6 pb-24">
        {/* Section 1: Certificate Details */}
        <SectionCard title="Certificate Details">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Label required>Certificate Type</Label>
              <SelectInput value={state.certType} onChange={(v) => update({ certType: v })}>
                {CERT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectInput>
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input
                value={state.referenceNumber}
                onChange={(v) => update({ referenceNumber: v })}
                placeholder="e.g. GAS-2025-001"
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <textarea
                value={state.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Any additional notes about this certificate..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] bg-white resize-none"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Linked Records */}
        <SectionCard title="Linked Records">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label required>Property</Label>
              <SelectInput value={state.property} onChange={(v) => update({ property: v })}>
                <option value="">Select property...</option>
                {MOCK_PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label>Unit <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
              <Input value={state.unit} onChange={(v) => update({ unit: v })} placeholder="e.g. Flat 2" />
            </div>
            <div>
              <Label>Tenancy <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
              <Input value={state.tenancy} onChange={(v) => update({ tenancy: v })} placeholder="Search tenancy..." />
            </div>
            <div>
              <Label>Supplier <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
              <Input value={state.supplier} onChange={(v) => update({ supplier: v })} placeholder="Search supplier..." />
            </div>
            <div className="col-span-2">
              <Label>Issuer / Certifier Contact</Label>
              <SelectInput value={state.issuerContact} onChange={(v) => update({ issuerContact: v })}>
                <option value="">Select contact...</option>
                {MOCK_CONTACTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </SelectInput>
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Dates */}
        <SectionCard title="Dates">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label required>Issue Date</Label>
              <Input type="date" value={state.issueDate} onChange={(v) => update({ issueDate: v })} />
            </div>
            <div>
              <Label required>Expiry Date</Label>
              <Input type="date" value={state.expiryDate} onChange={(v) => update({ expiryDate: v })} />
            </div>
          </div>
          {state.issueDate && state.expiryDate && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-[#EFF6FF] rounded-lg border border-[#BFDBFE]">
              <RefreshCw className="w-4 h-4 text-[#2563EB]" />
              <span className="text-sm font-medium text-[#2563EB]">Certificate valid for: <strong>{duration}</strong></span>
            </div>
          )}
        </SectionCard>

        {/* Section 4: Document */}
        <SectionCard title="Document">
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">GasSafety_14Westbourne_2025.pdf</p>
              <p className="text-xs text-slate-400 mt-0.5">1.2 MB — Uploaded 4 Jun 2025 — Version 1</p>
            </div>
            <Button variant="outline" size="sm">
              <FileText className="w-3.5 h-3.5" />
              View
            </Button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Replace Document</p>
            <p className="text-xs text-slate-400 mt-1">Drop PDF or image here, or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">Uploading a new file will create version 2</p>
          </div>
        </SectionCard>

        {/* Section 5: Status & Risk */}
        <SectionCard title="Status & Risk">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label required>Status</Label>
              <SelectInput value={state.status} onChange={(v) => update({ status: v as CertStatus })}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectInput>
            </div>
            <div>
              <Label required>Risk Level</Label>
              <SelectInput value={state.riskLevel} onChange={(v) => update({ riskLevel: v as RiskLevel })}>
                {RISK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectInput>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between py-3 border-t border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Mark as Not Required</p>
              <p className="text-xs text-slate-500 mt-0.5">Flag this certificate type as not applicable to this property</p>
            </div>
            <button onClick={() => update({ notRequired: !state.notRequired })}>
              {state.notRequired
                ? <div style={{ color: "#2563EB" }}><ToggleRight className="w-8 h-8" /></div>
                : <ToggleLeft className="w-8 h-8 text-slate-300" />
              }
            </button>
          </div>

          {state.notRequired && (
            <div className="mt-3">
              <Label>Reason <span className="text-slate-400 font-normal text-xs">(required)</span></Label>
              <textarea
                value={state.notRequiredNote}
                onChange={(e) => update({ notRequiredNote: e.target.value })}
                placeholder="Explain why this certificate is not required for this property..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] bg-white resize-none"
              />
            </div>
          )}
        </SectionCard>

        {/* Dangerous Actions */}
        <DangerousActions referenceNumber={state.referenceNumber || "GAS-2025-001"} />
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-lg">
        <p className="text-sm text-slate-500">
          Editing: <span className="font-semibold text-slate-700">Gas Safety — 14 Westbourne Gardens</span>
          {saved && <span className="ml-3 text-emerald-600 font-medium">✓ Saved</span>}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="md" asChild>
            <Link href={`/app/compliance/certificates/${id}`}>Cancel</Link>
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
