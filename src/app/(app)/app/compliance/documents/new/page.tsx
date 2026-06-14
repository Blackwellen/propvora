"use client"

import { useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { uploadFile } from "@/lib/upload"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useContacts } from "@/hooks/useContacts"
import {
  Upload, FileText, Link2, Tag, Calendar, CheckCircle,
  ChevronRight, ChevronLeft, X, Home, User, Truck,
  Camera, Shield, FileCheck, ClipboardList, Scroll,
  AlertCircle, ToggleLeft, ToggleRight
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type DocType =
  | "certificate"
  | "inspection_evidence"
  | "insurance"
  | "licence"
  | "agreement"
  | "tenant_doc"
  | "supplier_doc"
  | "photo_evidence"
  | "compliance_note"
  | "other"

interface WizardState {
  // Step 1
  fileName: string
  fileSize: string
  // Step 2
  docType: DocType | null
  // Step 3
  property: string
  propertyLabel: string
  unit: string
  tenancyContact: string
  supplier: string
  // Step 4
  referenceNumber: string
  issuer: string
  description: string
  tags: string
  // Step 5
  issueDate: string
  expiryDate: string
  noExpiry: boolean
  reviewDate: string
  renewalReminder: boolean
  /** R2 object key — populated after upload */
  fileKey: string
}

const INITIAL_STATE: WizardState = {
  fileName: "",
  fileSize: "",
  docType: null,
  property: "",
  propertyLabel: "",
  unit: "",
  tenancyContact: "",
  supplier: "",
  referenceNumber: "",
  issuer: "",
  description: "",
  tags: "",
  issueDate: "",
  expiryDate: "",
  noExpiry: false,
  reviewDate: "",
  renewalReminder: true,
  fileKey: "",
}

// ─── Step Config ──────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Select File",       icon: Upload },
  { number: 2, label: "Document Type",     icon: FileText },
  { number: 3, label: "Link Records",      icon: Link2 },
  { number: 4, label: "Add Metadata",      icon: Tag },
  { number: 5, label: "Expiry & Review",   icon: Calendar },
  { number: 6, label: "Review & Upload",   icon: CheckCircle },
]

// ─── Doc Type Cards ───────────────────────────────────────────────────────────

interface DocTypeOption {
  key: DocType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}

const DOC_TYPE_OPTIONS: DocTypeOption[] = [
  { key: "certificate",       label: "Certificate",       description: "Gas, EICR, EPC, Fire", icon: Shield,      color: "text-blue-600",    bg: "bg-blue-50" },
  { key: "inspection_evidence",label: "Inspection Evidence",description: "Property inspections", icon: ClipboardList, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "insurance",         label: "Insurance",         description: "Buildings, liability",  icon: Scroll,      color: "text-amber-600",   bg: "bg-amber-50" },
  { key: "licence",           label: "Licence",           description: "HMO, operating licences", icon: FileCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "agreement",         label: "Agreement",         description: "Tenancy agreements",    icon: FileText,    color: "text-cyan-600",    bg: "bg-cyan-50" },
  { key: "tenant_doc",        label: "Tenant Document",   description: "Right to Rent, ID",     icon: User,        color: "text-pink-600",    bg: "bg-pink-50" },
  { key: "supplier_doc",      label: "Supplier Document", description: "Insurance, accreditations", icon: Truck,  color: "text-orange-600",  bg: "bg-orange-50" },
  { key: "photo_evidence",    label: "Photo Evidence",    description: "Move-in/out photos",    icon: Camera,      color: "text-indigo-600",  bg: "bg-indigo-50" },
  { key: "compliance_note",   label: "Compliance Note",   description: "Notes & memos",         icon: ClipboardList, color: "text-slate-600", bg: "bg-slate-100" },
  { key: "other",             label: "Other",             description: "Any other document",    icon: FileText,    color: "text-slate-500",   bg: "bg-slate-100" },
]

// ─── Step 1: Select File ──────────────────────────────────────────────────────

function Step1({
  state,
  setState,
  onFileSelected,
}: {
  state: WizardState
  setState: (s: WizardState) => void
  onFileSelected: (file: File | null) => void
}) {
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setState({ ...state, fileName: file.name, fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`, fileKey: "" })
      onFileSelected(file)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setState({ ...state, fileName: file.name, fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`, fileKey: "" })
      onFileSelected(file)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Select File</h2>
        <p className="text-sm text-slate-500 mt-1">Upload a PDF, image, or document. Max 20MB.</p>
      </div>

      {state.fileName ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">{state.fileName}</p>
            <p className="text-xs text-emerald-600">{state.fileSize}</p>
          </div>
          <button
            onClick={() => {
              setState({ ...state, fileName: "", fileSize: "", fileKey: "" })
              onFileSelected(null)
            }}
            className="text-emerald-400 hover:text-emerald-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragging ? "border-[#2563EB] bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={handleChange} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
              <Upload className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Drop PDF or image here, or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">Accepted: PDF, JPG, PNG, DOCX · Max 20MB</p>
            </div>
          </div>
        </label>
      )}
    </div>
  )
}

// ─── Step 2: Document Type ────────────────────────────────────────────────────

function Step2({ state, setState }: { state: WizardState; setState: (s: WizardState) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Document Type</h2>
        <p className="text-sm text-slate-500 mt-1">Select the type that best describes this document.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {DOC_TYPE_OPTIONS.map(opt => {
          const Icon = opt.icon
          const selected = state.docType === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => setState({ ...state, docType: opt.key })}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                selected
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? "bg-[#2563EB]" : opt.bg}`}>
                <div style={{ color: selected ? "#fff" : undefined }}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-500">{opt.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 3: Link Records ─────────────────────────────────────────────────────

function Step3({ state, setState, properties, contacts }: { state: WizardState; setState: (s: WizardState) => void; properties: { id: string; name: string }[]; contacts: { id: string; name: string }[] }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Link Records</h2>
        <p className="text-sm text-slate-500 mt-1">Associate this document with relevant records in your portfolio.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Home className="w-4 h-4 text-slate-400" />
            Property
          </label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.property}
            onChange={e => setState({ ...state, property: e.target.value, propertyLabel: e.target.options[e.target.selectedIndex]?.text ?? "" })}
          >
            <option value="">{properties.length ? "Select property..." : "No properties found"}</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Home className="w-4 h-4 text-slate-400" />
            Unit <span className="text-xs text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Flat 2"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.unit}
            onChange={e => setState({ ...state, unit: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Tenancy / Contact <span className="text-xs text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.tenancyContact}
            onChange={e => setState({ ...state, tenancyContact: e.target.value })}
          >
            <option value="">{contacts.length ? "Select tenant/contact..." : "No contacts found"}</option>
            {contacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-400" />
            Supplier <span className="text-xs text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.supplier}
            onChange={e => setState({ ...state, supplier: e.target.value })}
          >
            <option value="">{contacts.length ? "Select supplier..." : "No contacts found"}</option>
            {contacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Add Metadata ─────────────────────────────────────────────────────

function Step4({ state, setState }: { state: WizardState; setState: (s: WizardState) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Add Metadata</h2>
        <p className="text-sm text-slate-500 mt-1">Add details to help identify and search this document.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Reference Number</label>
          <input
            type="text"
            placeholder="e.g. GAS-2025-001"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.referenceNumber}
            onChange={e => setState({ ...state, referenceNumber: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Issuer / Source</label>
          <input
            type="text"
            placeholder="e.g. Elite Gas Services"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.issuer}
            onChange={e => setState({ ...state, issuer: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            rows={3}
            placeholder="Add notes about this document..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
            value={state.description}
            onChange={e => setState({ ...state, description: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Tags</label>
          <input
            type="text"
            placeholder="e.g. gas, annual, westbourne"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.tags}
            onChange={e => setState({ ...state, tags: e.target.value })}
          />
          <p className="text-xs text-slate-400">Separate tags with commas</p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Set Expiry & Review ──────────────────────────────────────────────

function Step5({ state, setState }: { state: WizardState; setState: (s: WizardState) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Set Expiry & Review</h2>
        <p className="text-sm text-slate-500 mt-1">Set dates to track compliance and trigger reminders.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Issue Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.issueDate}
            onChange={e => setState({ ...state, issueDate: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Expiry Date</label>
            <button
              onClick={() => setState({ ...state, noExpiry: !state.noExpiry })}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              {state.noExpiry
                ? <ToggleRight className="w-4 h-4 text-[#2563EB]" />
                : <ToggleLeft className="w-4 h-4" />}
              No expiry
            </button>
          </div>
          {!state.noExpiry && (
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              value={state.expiryDate}
              onChange={e => setState({ ...state, expiryDate: e.target.value })}
            />
          )}
          {state.noExpiry && (
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-400">
              No expiry date set
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Review Date <span className="text-xs text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={state.reviewDate}
            onChange={e => setState({ ...state, reviewDate: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div>
            <p className="text-sm font-medium text-amber-800">Renewal Reminder</p>
            <p className="text-xs text-amber-600">Get notified 60 days before expiry</p>
          </div>
          <button
            onClick={() => setState({ ...state, renewalReminder: !state.renewalReminder })}
            className="flex items-center"
          >
            {state.renewalReminder
              ? <ToggleRight className="w-6 h-6 text-amber-600" />
              : <ToggleLeft className="w-6 h-6 text-amber-400" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 6: Review & Upload ──────────────────────────────────────────────────

function Step6({
  state,
  onUpload,
  uploading,
  uploadError,
}: {
  state: WizardState
  onUpload: () => void
  uploading: boolean
  uploadError: string | null
}) {
  const typeLabel = DOC_TYPE_OPTIONS.find(o => o.key === state.docType)?.label ?? "—"

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Review & Upload</h2>
        <p className="text-sm text-slate-500 mt-1">Confirm all details before uploading.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {[
          { label: "File",        value: state.fileName || "—" },
          { label: "Type",        value: typeLabel },
          { label: "Property",    value: state.propertyLabel || "—" },
          { label: "Reference",   value: state.referenceNumber || "—" },
          { label: "Issuer",      value: state.issuer || "—" },
          { label: "Issue Date",  value: state.issueDate || "—" },
          { label: "Expiry",      value: state.noExpiry ? "No expiry" : (state.expiryDate || "—") },
          { label: "Reminder",    value: state.renewalReminder ? "Enabled (60 days before expiry)" : "Disabled" },
        ].map(row => (
          <div key={row.label} className="flex items-start px-5 py-3 text-sm">
            <span className="w-32 text-slate-500 shrink-0">{row.label}</span>
            <span className="font-medium text-slate-800">{row.value}</span>
          </div>
        ))}
      </div>

      {(!state.fileName || !state.docType) && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Please complete required steps: {!state.fileName && "File, "}{!state.docType && "Document Type"}
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {uploadError}
        </div>
      )}

      <button
        onClick={onUpload}
        disabled={!state.fileName || !state.docType || uploading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Uploading…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload Document
          </>
        )}
      </button>
    </div>
  )
}

// ─── Right Summary Rail ───────────────────────────────────────────────────────

function SummaryRail({ state }: { state: WizardState }) {
  const typeLabel = DOC_TYPE_OPTIONS.find(o => o.key === state.docType)?.label
  return (
    <aside className="hidden xl:block w-64 shrink-0 space-y-4 sticky top-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Upload Summary</h3>

        {state.fileName ? (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">{state.fileName}</p>
              <p className="text-xs text-slate-400">{state.fileSize}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No file selected</p>
        )}

        {typeLabel && (
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
            {typeLabel}
          </div>
        )}

        {state.propertyLabel && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Home className="w-3 h-3 text-slate-400" />
            {state.propertyLabel}
          </div>
        )}

        {state.expiryDate && !state.noExpiry && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-3 h-3 text-slate-400" />
            Expires {state.expiryDate}
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UploadDocumentPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: liveProperties = [] } = useProperties(workspace?.id)
  const { data: liveContacts = [] } = useContacts(workspace?.id)
  const properties = useMemo(
    () => liveProperties.map((p) => ({ id: p.id, name: p.name || p.address_line1 || "Property" })),
    [liveProperties]
  )
  const contacts = useMemo(
    () => liveContacts.map((c) => ({ id: c.id, name: c.full_name || c.company_name || "Contact" })),
    [liveContacts]
  )
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [uploaded, setUploaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Holds the File object chosen in Step 1 — not part of serialisable state
  const pendingFileRef = useRef<File | null>(null)

  async function handleUpload() {
    if (!workspace?.id) {
      setUploadError("No workspace — please reload and try again.")
      return
    }
    setUploadError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const file = pendingFileRef.current
      let fileUrl = ""

      if (file) {
        // 1. Server-proxied upload to R2 (non-fatal if R2 not configured)
        try {
          const { url } = await uploadFile(file, workspace.id, "compliance-documents")
          fileUrl = url
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upload failed"
          if (/not configured/i.test(msg)) {
            console.warn("[upload] R2 not configured:", msg)
          } else {
            setUploadError(msg)
            setUploading(false)
            return
          }
        }
      }

      // 2. Save the document record into the live `documents` table.
      const { data: { user } } = await supabase.auth.getUser()
      const tags = state.tags ? state.tags.split(",").map((t) => t.trim()).filter(Boolean) : null
      const { data, error: dbError } = await supabase
        .from("documents")
        .insert({
          workspace_id: workspace.id,
          property_id: state.property || null,
          name: state.fileName || state.referenceNumber || "Compliance document",
          type: state.docType ?? "other",
          category: "compliance_certificate",
          mime_type: file?.type ?? null,
          size_bytes: file?.size ?? null,
          url: fileUrl || null,
          r2_key: fileUrl || `compliance-documents/${Date.now()}`,
          r2_bucket: "propvora",
          status: "active",
          expires_at: state.noExpiry ? null : (state.expiryDate || null),
          tags,
          metadata: {
            issuer: state.issuer || null,
            reference: state.referenceNumber || null,
            description: state.description || null,
            verification_status: "pending",
            issue_date: state.issueDate || null,
          },
          created_by: user?.id ?? null,
        })
        .select("id")
        .single()

      if (dbError) {
        setUploadError(dbError.message)
        setUploading(false)
        return
      }

      setNewId((data?.id as string) ?? null)
      setUploaded(true)
    } catch (err) {
      console.error("[documents/new] upload error:", err)
      setUploadError(err instanceof Error ? err.message : "Unexpected error — please try again")
    } finally {
      setUploading(false)
    }
  }

  if (uploaded) {
    return (
      <div className="space-y-0">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <div style={{ color: "#059669" }}><CheckCircle className="w-8 h-8" /></div>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Document Uploaded</h2>
          <p className="text-sm text-slate-500">
            {state.fileName} has been successfully uploaded and queued for verification.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setUploaded(false)
                setState(INITIAL_STATE)
                setStep(1)
                setUploadError(null)
                setNewId(null)
                pendingFileRef.current = null
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Upload Another
            </button>
            <button
              onClick={() => router.push(newId ? `/app/compliance/documents/${newId}` : "/app/compliance/documents")}
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {newId ? "View Document" : "View Documents"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Upload Document</h1>
          <p className="text-sm text-slate-500 mt-1">Add a new compliance document to your portfolio</p>
        </div>

        <div className="flex gap-6 items-start">
          {/* Left Stepper */}
          <div className="hidden lg:block w-52 shrink-0">
            <nav className="space-y-1">
              {STEPS.map(s => {
                const Icon = s.icon
                const isComplete = step > s.number
                const isCurrent = step === s.number
                return (
                  <button
                    key={s.number}
                    onClick={() => s.number < step && setStep(s.number)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      isCurrent
                        ? "bg-[#2563EB] text-white"
                        : isComplete
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "text-slate-400"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent ? "bg-white text-[#2563EB]"
                      : isComplete ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                    }`}>
                      {isComplete ? <CheckCircle className="w-3.5 h-3.5" /> : s.number}
                    </div>
                    <span className="font-medium">{s.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Center Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[480px] flex flex-col">
              <div className="flex-1">
                {step === 1 && (
                  <Step1
                    state={state}
                    setState={setState}
                    onFileSelected={(file) => { pendingFileRef.current = file }}
                  />
                )}
                {step === 2 && <Step2 state={state} setState={setState} />}
                {step === 3 && <Step3 state={state} setState={setState} properties={properties} contacts={contacts} />}
                {step === 4 && <Step4 state={state} setState={setState} />}
                {step === 5 && <Step5 state={state} setState={setState} />}
                {step === 6 && (
                  <Step6
                    state={state}
                    onUpload={handleUpload}
                    uploading={uploading}
                    uploadError={uploadError}
                  />
                )}
              </div>

              {/* Nav Buttons */}
              {step < 6 && (
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                  <button
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setStep(s => Math.min(6, s + 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Summary */}
          <SummaryRail state={state} />
        </div>
      </div>
    </div>
  )
}
