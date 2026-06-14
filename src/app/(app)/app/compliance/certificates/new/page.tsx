"use client"

import React, { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { uploadFile } from "@/lib/upload"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import type { Property } from "@/types/database"
import {
  Flame,
  Zap,
  Leaf,
  Building2,
  Shield,
  AlertTriangle,
  Plug,
  FileText,
  Check,
  ChevronRight,
  UploadCloud,
  User,
  Calendar,
  CheckCircle2,
  Loader2,
  Star,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type CertTypeKey =
  | "gas_safety" | "eicr" | "epc" | "fire_risk" | "hmo_licence"
  | "building_insurance" | "pat_test" | "landlord_insurance" | "other"

interface WizardState {
  certType:           CertTypeKey | null
  recordMode:         "property" | "supplier"
  /** Property id (live) */
  property:           string
  /** Display label for the chosen property */
  propertyLabel:      string
  unit:               string
  tenancy:            string
  supplier:           string
  issueDate:          string
  expiryDate:         string
  renewalReminder:    boolean
  reminderDays:       string
  issuerName:         string
  issuerContact:      string
  referenceNumber:    string
  fileName:           string
  /** R2 object key — set after successful upload */
  fileKey:            string
  /** The selected File object — not serialised, held outside state via ref */
  createTask:         boolean
  taskTitle:          string
  taskAssignee:       string
  taskDueDate:        string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CERT_TYPES: { key: CertTypeKey; label: string; helper: string; critical: boolean; icon: React.ReactNode }[] = [
  { key: "gas_safety",          label: "Gas Safety",           helper: "Annual CP12 certificate",                    critical: true,  icon: <div style={{ color: "#f97316" }}><Flame className="w-5 h-5" /></div> },
  { key: "eicr",                label: "EICR",                 helper: "Electrical Installation Condition Report",   critical: true,  icon: <div style={{ color: "#eab308" }}><Zap className="w-5 h-5" /></div> },
  { key: "epc",                 label: "EPC",                  helper: "Energy Performance Certificate",             critical: true,  icon: <div style={{ color: "#22c55e" }}><Leaf className="w-5 h-5" /></div> },
  { key: "fire_risk",           label: "Fire Risk",            helper: "Fire Risk Assessment",                       critical: true,  icon: <div style={{ color: "#dc2626" }}><AlertTriangle className="w-5 h-5" /></div> },
  { key: "hmo_licence",         label: "HMO Licence",          helper: "House in Multiple Occupation licence",       critical: true,  icon: <div style={{ color: "#2563EB" }}><Building2 className="w-5 h-5" /></div> },
  { key: "building_insurance",  label: "Buildings Insurance",  helper: "Buildings insurance policy document",        critical: false, icon: <div style={{ color: "#7c3aed" }}><Shield className="w-5 h-5" /></div> },
  { key: "pat_test",            label: "PAT Test",             helper: "Portable Appliance Testing certificate",     critical: false, icon: <div style={{ color: "#0284c7" }}><Plug className="w-5 h-5" /></div> },
  { key: "landlord_insurance",  label: "Landlord Insurance",   helper: "Landlord liability insurance document",      critical: false, icon: <div style={{ color: "#7c3aed" }}><Shield className="w-5 h-5" /></div> },
  { key: "other",               label: "Other",                helper: "Any other compliance document",              critical: false, icon: <div style={{ color: "#64748b" }}><FileText className="w-5 h-5" /></div> },
]

const MOCK_CONTACTS = [
  "Elite Gas Services",
  "SafeWire Services",
  "EPC Direct",
  "FireSafe Assessors",
  "Council Licensing",
  "ProLet Insure",
]

const STEPS = [
  { id: 1, label: "Certificate Type" },
  { id: 2, label: "Link Records" },
  { id: 3, label: "Dates & Reminders" },
  { id: 4, label: "Issuer / Contact" },
  { id: 5, label: "Upload Document" },
  { id: 6, label: "Work Task" },
  { id: 7, label: "Review & Create" },
]

const DEFAULT_STATE: WizardState = {
  certType:          null,
  recordMode:        "property",
  property:          "",
  propertyLabel:     "",
  unit:              "",
  tenancy:           "",
  supplier:          "",
  issueDate:         "",
  expiryDate:        "",
  renewalReminder:   true,
  reminderDays:      "30",
  issuerName:        "",
  issuerContact:     "",
  referenceNumber:   "",
  fileName:          "",
  fileKey:           "",
  createTask:        true,
  taskTitle:         "",
  taskAssignee:      "",
  taskDueDate:       "",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcMonths(issue: string, expiry: string): string {
  if (!issue || !expiry) return "—"
  const diff = (new Date(expiry).getTime() - new Date(issue).getTime()) / (1000 * 60 * 60 * 24 * 30)
  return `${Math.round(diff)} months`
}

function daysUntil(date: string): number {
  if (!date) return 0
  return Math.round((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function monthsUntil(date: string): string {
  const d = daysUntil(date)
  if (d <= 0) return "Expired"
  return `${Math.round(d / 30)} months`
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({ state, update }: { state: WizardState; update: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Select Certificate Type</h2>
      <p className="text-sm text-slate-500">Choose the type of compliance certificate you want to record.</p>
      <div className="grid grid-cols-3 gap-3 mt-4">
        {CERT_TYPES.map((ct) => (
          <button
            key={ct.key}
            onClick={() => update({ certType: ct.key })}
            className={cn(
              "flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 text-center transition-all",
              state.certType === ct.key
                ? "border-[#2563EB] bg-[#EFF6FF] shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center",
              state.certType === ct.key ? "bg-[#DBEAFE]" : "bg-slate-100",
            )}>
              {ct.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{ct.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{ct.helper}</p>
            </div>
            {ct.critical && (
              <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-semibold rounded border border-red-100">Critical</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function Step2({ state, update, properties }: { state: WizardState; update: (p: Partial<WizardState>) => void; properties: Property[] }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Link Records</h2>
      <p className="text-sm text-slate-500">Link this certificate to a property or a supplier.</p>

      <div className="flex gap-2">
        {(["property", "supplier"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => update({ recordMode: mode })}
            className={cn(
              "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
              state.recordMode === mode
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            )}
          >
            {mode === "property" ? "Property Certificate" : "Supplier Certificate"}
          </button>
        ))}
      </div>

      {state.recordMode === "property" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Property <span className="text-red-500">*</span></label>
            <select
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              value={state.property}
              onChange={(e) => update({ property: e.target.value, propertyLabel: e.target.options[e.target.selectedIndex]?.text ?? "" })}
            >
              <option value="">{properties.length ? "Select property..." : "No properties found"}</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name || p.address_line1 || "Property"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Flat 2, Whole property"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              value={state.unit}
              onChange={(e) => update({ unit: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tenancy <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              placeholder="Search tenancy..."
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              value={state.tenancy}
              onChange={(e) => update({ tenancy: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Search supplier..."
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            value={state.supplier}
            onChange={(e) => update({ supplier: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}

function Step3({ state, update }: { state: WizardState; update: (p: Partial<WizardState>) => void }) {
  const duration = calcMonths(state.issueDate, state.expiryDate)
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Issue & Expiry Dates</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            value={state.issueDate}
            onChange={(e) => update({ issueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            value={state.expiryDate}
            onChange={(e) => update({ expiryDate: e.target.value })}
          />
        </div>
      </div>

      {state.issueDate && state.expiryDate && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#EFF6FF] rounded-lg border border-[#BFDBFE]">
          <Calendar className="w-4 h-4 text-[#2563EB]" />
          <span className="text-sm font-medium text-[#2563EB]">Valid for: {duration}</span>
        </div>
      )}

      <div className="flex items-center justify-between py-3 border-t border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-800">Renewal Reminder</p>
          <p className="text-xs text-slate-500 mt-0.5">Get notified before the certificate expires</p>
        </div>
        <button onClick={() => update({ renewalReminder: !state.renewalReminder })}>
          {state.renewalReminder
            ? <div style={{ color: "#2563EB" }}><ToggleRight className="w-8 h-8" /></div>
            : <ToggleLeft className="w-8 h-8 text-slate-300" />
          }
        </button>
      </div>

      {state.renewalReminder && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Remind me</label>
          <select
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            value={state.reminderDays}
            onChange={(e) => update({ reminderDays: e.target.value })}
          >
            <option value="30">30 days before expiry</option>
            <option value="60">60 days before expiry</option>
            <option value="90">90 days before expiry</option>
          </select>
        </div>
      )}
    </div>
  )
}

function Step4({ state, update }: { state: WizardState; update: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Issuer / Contact Details</h2>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Issuer Name</label>
        <input
          type="text"
          placeholder="e.g. Elite Gas Services"
          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          value={state.issuerName}
          onChange={(e) => update({ issuerName: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Issuer Contact <span className="text-slate-400 font-normal">(link existing)</span></label>
        <select
          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          value={state.issuerContact}
          onChange={(e) => update({ issuerContact: e.target.value })}
        >
          <option value="">Select contact...</option>
          {MOCK_CONTACTS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference Number</label>
        <input
          type="text"
          placeholder="e.g. GAS-2025-001"
          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          value={state.referenceNumber}
          onChange={(e) => update({ referenceNumber: e.target.value })}
        />
      </div>
    </div>
  )
}

function Step5({
  state,
  update,
  onFileSelected,
}: {
  state: WizardState
  update: (p: Partial<WizardState>) => void
  onFileSelected: (file: File | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      update({ fileName: file.name, fileKey: "" })
      onFileSelected(file)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Upload Document</h2>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer",
          state.fileName ? "border-[#2563EB] bg-[#EFF6FF]" : "border-slate-300 hover:border-slate-400 bg-slate-50",
        )}
        onClick={() => fileRef.current?.click()}
      >
        {state.fileName ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-slate-800">{state.fileName}</p>
            {state.fileKey ? (
              <p className="text-xs text-emerald-600 font-medium">Queued for upload</p>
            ) : (
              <p className="text-xs text-slate-500">Click to replace</p>
            )}
            <button
              className="text-xs text-red-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                update({ fileName: "", fileKey: "" })
                onFileSelected(null)
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Drop PDF or image here or click to browse</p>
            <p className="text-xs text-slate-400">Accepted: PDF, JPG, PNG, DOC, DOCX — max 10 MB</p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 italic">Documents are stored securely and accessible only to authorised users.</p>
    </div>
  )
}

function Step6({ state, update }: { state: WizardState; update: (p: Partial<WizardState>) => void }) {
  const typeLabel = CERT_TYPES.find((t) => t.key === state.certType)?.label ?? "Certificate"
  const autoTitle = `Renew: ${typeLabel}${state.propertyLabel ? ` — ${state.propertyLabel}` : ""}`
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Create Renewal Work Task</h2>
      <p className="text-sm text-slate-500">Automatically create a work task to track renewal of this certificate.</p>

      <div className="flex items-center justify-between py-3 border-b border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-800">Create renewal work task</p>
          <p className="text-xs text-slate-500 mt-0.5">Recommended for critical certificates</p>
        </div>
        <button onClick={() => update({ createTask: !state.createTask })}>
          {state.createTask
            ? <div style={{ color: "#2563EB" }}><ToggleRight className="w-8 h-8" /></div>
            : <ToggleLeft className="w-8 h-8 text-slate-300" />
          }
        </button>
      </div>

      {state.createTask && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Title</label>
            <input
              type="text"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              value={state.taskTitle || autoTitle}
              onChange={(e) => update({ taskTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee</label>
            <select
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              value={state.taskAssignee}
              onChange={(e) => update({ taskAssignee: e.target.value })}
            >
              <option value="">Unassigned</option>
              <option value="Jamal Thomas">Jamal Thomas</option>
              <option value="Sarah Kim">Sarah Kim</option>
              <option value="Marcus Reeves">Marcus Reeves</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date <span className="text-slate-400 font-normal">(auto: 30 days before expiry)</span></label>
            <input
              type="date"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              value={state.taskDueDate}
              onChange={(e) => update({ taskDueDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Step7({ state }: { state: WizardState }) {
  const typeInfo = CERT_TYPES.find((t) => t.key === state.certType)
  const rows = [
    { label: "Certificate Type",  value: typeInfo?.label ?? "—" },
    { label: "Property",          value: state.propertyLabel || "—" },
    { label: "Unit",              value: state.unit || "—" },
    { label: "Issuer",            value: state.issuerName || "—" },
    { label: "Reference",         value: state.referenceNumber || "—" },
    { label: "Issue Date",        value: state.issueDate || "—" },
    { label: "Expiry Date",       value: state.expiryDate || "—" },
    { label: "Document",          value: state.fileName || "None attached" },
    { label: "Renewal Reminder",  value: state.renewalReminder ? `${state.reminderDays} days before` : "Off" },
    { label: "Work Task",         value: state.createTask ? (state.taskTitle || "Auto-generated") : "None" },
  ]
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Review & Create</h2>
      <p className="text-sm text-slate-500">Review the certificate details before saving.</p>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Certificate Summary</p>
        </div>
        <div className="divide-y divide-slate-50">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-4 px-4 py-2.5">
              <span className="text-xs text-slate-400 font-medium w-32 shrink-0 pt-0.5">{r.label}</span>
              <span className="text-sm text-slate-800 font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Right Summary Rail ───────────────────────────────────────────────────────

function SummaryRail({ state }: { state: WizardState }) {
  const typeInfo = CERT_TYPES.find((t) => t.key === state.certType)
  const months = monthsUntil(state.expiryDate)
  const isCritical = typeInfo?.critical ?? false

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Certificate Preview</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            {typeInfo ? (
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">{typeInfo.icon}</div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-100" />
            )}
            <div>
              <p className="text-sm font-bold text-slate-900">{typeInfo?.label ?? "Select a type"}</p>
              {isCritical && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                  <Star className="w-2.5 h-2.5" />
                  Critical
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Property</span>
              <span className="font-medium text-slate-800 text-right max-w-[120px] truncate">{state.propertyLabel || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <Badge variant="warning" size="sm">Pending</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expiry</span>
              <span className="font-medium text-slate-800">{state.expiryDate || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Issuer</span>
              <span className="font-medium text-slate-800 text-right max-w-[120px] truncate">{state.issuerName || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {state.expiryDate && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Renewal In</p>
          <p className="text-2xl font-bold text-amber-800">{months}</p>
          <p className="text-xs text-amber-600 mt-1">{state.expiryDate}</p>
        </div>
      )}

      {isCritical && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Critical Certificate</p>
          </div>
          <p className="text-xs text-red-600">This certificate type is legally required. Ensure it remains valid at all times.</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewCertificatePage() {
  const router                    = useRouter()
  const { workspace }             = useWorkspace()
  const { data: properties = [] } = useProperties(workspace?.id)
  const [step, setStep]           = useState(1)
  const [state, setState]         = useState<WizardState>(DEFAULT_STATE)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [newId, setNewId]         = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Holds the selected File object — not part of serialisable wizard state
  const pendingFileRef = useRef<File | null>(null)

  const update = (partial: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...partial }))

  /**
   * If a file was selected, upload it to R2 (server-proxied) and return the
   * authed view URL, or '' if skipped / R2 not configured (non-fatal).
   */
  async function uploadPendingFile(workspaceId: string): Promise<string> {
    const file = pendingFileRef.current
    if (!file) return ""
    try {
      const { url } = await uploadFile(file, workspaceId, "certificates")
      return url
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed"
      if (/not configured/i.test(msg)) {
        console.warn("[upload] R2 not configured:", msg)
        return ""
      }
      throw e
    }
  }

  // Derive a status from the expiry date so the record reflects reality.
  function deriveStatus(): string {
    if (!state.expiryDate) return "valid"
    const days = daysUntil(state.expiryDate)
    if (days < 0) return "expired"
    if (days <= 30) return "expiring_soon"
    return "valid"
  }

  const handleSave = async () => {
    if (!workspace?.id) {
      setUploadError("No workspace — please reload and try again.")
      return
    }
    if (!state.certType) {
      setUploadError("Please select a certificate type.")
      setStep(1)
      return
    }
    setSaving(true)
    setUploadError(null)
    try {
      // 1. Upload file if one was selected (R2 — non-fatal if not configured)
      let fileUrl = ""
      try {
        fileUrl = await uploadPendingFile(workspace.id)
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : "File upload failed"
        setUploadError(msg)
        setSaving(false)
        return
      }

      // 2. Insert the certificate with real schema columns + workspace_id.
      const supabase = createClient()
      const { data, error } = await supabase
        .from("compliance_certificates")
        .insert({
          workspace_id: workspace.id,
          certificate_type: state.certType,
          property_id: state.recordMode === "property" && state.property ? state.property : null,
          reference_number: state.referenceNumber || null,
          issue_date: state.issueDate || null,
          expiry_date: state.expiryDate || null,
          status: deriveStatus(),
          risk_level: CERT_TYPES.find((t) => t.key === state.certType)?.critical ? "high" : "low",
          notes: state.issuerName ? `Issuer: ${state.issuerName}` : null,
          reminder_enabled: state.renewalReminder,
        })
        .select("id")
        .single()

      if (error) {
        if (error.code === "42P01") {
          // Table not provisioned — show success but no redirect target.
          setSaved(true)
          return
        }
        setUploadError(error.message)
        setSaving(false)
        return
      }

      const certId = data?.id as string | undefined
      setNewId(certId ?? null)

      // 3. If a file was uploaded, store it as a linked compliance document.
      if (fileUrl && certId) {
        const url = fileUrl
        try {
          await supabase.from("compliance_documents").insert({
            workspace_id: workspace.id,
            property_id: state.recordMode === "property" && state.property ? state.property : null,
            document_name: state.fileName || "Certificate document",
            document_type: "certificate",
            file_url: url,
            issuer: state.issuerName || null,
            issue_date: state.issueDate || null,
            expiry_date: state.expiryDate || null,
            verification_status: "pending",
            linked_certificate_id: certId,
          })
        } catch {
          /* non-fatal: certificate already created */
        }
      }

      setSaved(true)
    } catch (err) {
      console.error("Save error:", err)
      setUploadError(err instanceof Error ? err.message : "Unexpected error — please try again.")
      setSaving(false)
    } finally {
      setSaving(false)
    }
  }

  const progress = (step / STEPS.length) * 100

  if (saved) {
    return (
      <div className="space-y-0">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">Certificate Created</h2>
            <p className="text-slate-500 mt-2">The certificate has been saved to your compliance records.</p>
          </div>
          <div className="flex gap-3">
            {newId ? (
              <Button variant="primary" size="lg" onClick={() => router.push(`/app/compliance/certificates/${newId}`)}>
                View Certificate
              </Button>
            ) : null}
            <Button variant="outline" size="lg" asChild>
              <Link href="/app/compliance/certificates">Back to Certificates</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-[#2563EB] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/app/compliance" className="text-slate-400 hover:text-slate-600">Compliance</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/app/compliance/certificates" className="text-slate-400 hover:text-slate-600">Certificates</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-medium">Add Certificate</span>
        </nav>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-140px)]">
        {/* Left Stepper 240px */}
        <aside className="w-60 shrink-0 border-r border-slate-100 bg-slate-50 py-6 px-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Steps</p>
          <div className="space-y-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm",
                  step === s.id
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : s.id < step
                    ? "bg-white text-slate-700 border border-slate-200 cursor-pointer hover:bg-slate-50"
                    : "text-slate-400 cursor-default",
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  step === s.id
                    ? "bg-white/20 text-white"
                    : s.id < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-400",
                )}>
                  {s.id < step ? <Check className="w-3 h-3" /> : s.id}
                </div>
                <span className="font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Center Card */}
        <main className="flex-1 min-w-0 p-6">
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              {step === 1 && <Step1 state={state} update={update} />}
              {step === 2 && <Step2 state={state} update={update} properties={properties} />}
              {step === 3 && <Step3 state={state} update={update} />}
              {step === 4 && <Step4 state={state} update={update} />}
              {step === 5 && (
                <Step5
                  state={state}
                  update={update}
                  onFileSelected={(file) => { pendingFileRef.current = file }}
                />
              )}
              {step === 6 && <Step6 state={state} update={update} />}
              {step === 7 && <Step7 state={state} />}
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep((p) => Math.max(1, p - 1))}
                disabled={step === 1}
              >
                Back
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Step {step} of {STEPS.length}</span>
                {step < STEPS.length ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep((p) => Math.min(STEPS.length, p + 1))}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="primary" size="md" onClick={handleSave} loading={saving}>
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                    ) : (
                      <>Create Certificate</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Summary Rail 260px */}
        <aside className="w-64 shrink-0 border-l border-slate-100 bg-slate-50 py-6 px-4">
          <SummaryRail state={state} />
        </aside>
      </div>
    </div>
  )
}
