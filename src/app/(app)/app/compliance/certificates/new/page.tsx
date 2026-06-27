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
import { useContacts } from "@/hooks/useContacts"
import { useCreateTask } from "@/hooks/useTasks"
import { type ComplianceIconKey, type ComplianceRequirementDef } from "@/lib/compliance/requirements"
import { useComplianceRequirements } from "@/lib/compliance/useComplianceRequirements"
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
  Droplet,
  Wind,
  Home,
  Globe,
  Check,
  ChevronRight,
  UploadCloud,
  Calendar,
  CheckCircle2,
  Loader2,
  Star,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

/** A certificate-type option resolved from the jurisdiction catalogue. */
interface CertType extends ComplianceRequirementDef {
  iconNode: React.ReactNode
}

interface WizardState {
  /** Catalogue requirement key for the chosen jurisdiction (e.g. "gas_safety", "ber"). */
  certType:           string | null
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

// Resolve a catalogue icon key + colour to a rendered lucide node.
const ICON_MAP: Record<ComplianceIconKey, { Icon: React.ComponentType<{ className?: string }>; color: string }> = {
  flame:    { Icon: Flame,         color: "#f97316" },
  zap:      { Icon: Zap,           color: "#eab308" },
  leaf:     { Icon: Leaf,          color: "#22c55e" },
  fire:     { Icon: AlertTriangle, color: "#dc2626" },
  building: { Icon: Building2,     color: "#2563EB" },
  shield:   { Icon: Shield,        color: "#7c3aed" },
  plug:     { Icon: Plug,          color: "#0284c7" },
  droplet:  { Icon: Droplet,       color: "#0ea5e9" },
  wind:     { Icon: Wind,          color: "#0d9488" },
  home:     { Icon: Home,          color: "#2563EB" },
  file:     { Icon: FileText,      color: "#64748b" },
}

function iconNodeFor(key: ComplianceIconKey): React.ReactNode {
  const { Icon, color } = ICON_MAP[key] ?? ICON_MAP.file
  return <div style={{ color }}><Icon className="w-5 h-5" /></div>
}

/** Map merged requirement defs to wizard cert-type options (with rendered icon). */
function toCertTypes(reqs: ComplianceRequirementDef[]): CertType[] {
  return reqs.map((r) => ({ ...r, iconNode: iconNodeFor(r.icon) }))
}

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

function Step1({ state, update, certTypes, regionName }: { state: WizardState; update: (p: Partial<WizardState>) => void; certTypes: CertType[]; regionName: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Select Certificate Type</h2>
      <p className="text-sm text-slate-500">Choose the type of compliance certificate you want to record.</p>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Globe className="w-3 h-3" /> Requirements shown for <span className="font-medium text-slate-500">{regionName}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {certTypes.map((ct) => (
          <button
            key={ct.key}
            onClick={() => update({ certType: ct.key })}
            className={cn(
              "flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 text-center transition-all",
              state.certType === ct.key
                ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center",
              state.certType === ct.key ? "bg-[#DBEAFE]" : "bg-slate-100",
            )}>
              {ct.iconNode}
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
                ? "bg-[var(--brand)] text-white border-[var(--brand)]"
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
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
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
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
              value={state.unit}
              onChange={(e) => update({ unit: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tenancy <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              placeholder="Search tenancy..."
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
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
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
            value={state.issueDate}
            onChange={(e) => update({ issueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
            value={state.expiryDate}
            onChange={(e) => update({ expiryDate: e.target.value })}
          />
        </div>
      </div>

      {state.issueDate && state.expiryDate && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-soft)] rounded-lg border border-[#BFDBFE]">
          <Calendar className="w-4 h-4 text-[var(--brand)]" />
          <span className="text-sm font-medium text-[var(--brand)]">Valid for: {duration}</span>
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
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
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

function Step4({ state, update, contacts }: { state: WizardState; update: (p: Partial<WizardState>) => void; contacts: { id: string; name: string }[] }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Issuer / Contact Details</h2>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Issuer Name</label>
        <input
          type="text"
          placeholder="e.g. Elite Gas Services"
          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
          value={state.issuerName}
          onChange={(e) => update({ issuerName: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Issuer Contact <span className="text-slate-400 font-normal">(link existing)</span></label>
        <select
          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
          value={state.issuerContact}
          onChange={(e) => update({ issuerContact: e.target.value })}
        >
          <option value="">{contacts.length ? "Select contact..." : "No contacts found"}</option>
          {contacts.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference Number</label>
        <input
          type="text"
          placeholder="e.g. GAS-2025-001"
          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
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
          state.fileName ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-slate-300 hover:border-slate-400 bg-slate-50",
        )}
        onClick={() => fileRef.current?.click()}
      >
        {state.fileName ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
              <FileText className="w-6 h-6 text-[var(--brand)]" />
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

function Step6({ state, update, certTypes }: { state: WizardState; update: (p: Partial<WizardState>) => void; certTypes: CertType[] }) {
  const typeLabel = certTypes.find((t) => t.key === state.certType)?.label ?? "Certificate"
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
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
              value={state.taskTitle || autoTitle}
              onChange={(e) => update({ taskTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee</label>
            <input
              type="text"
              placeholder="Assignee name (optional)"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
              value={state.taskAssignee}
              onChange={(e) => update({ taskAssignee: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date <span className="text-slate-400 font-normal">(auto: 30 days before expiry)</span></label>
            <input
              type="date"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
              value={state.taskDueDate}
              onChange={(e) => update({ taskDueDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Step7({ state, certTypes }: { state: WizardState; certTypes: CertType[] }) {
  const typeInfo = certTypes.find((t) => t.key === state.certType)
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

function SummaryRail({ state, certTypes }: { state: WizardState; certTypes: CertType[] }) {
  const typeInfo = certTypes.find((t) => t.key === state.certType)
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
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">{typeInfo.iconNode}</div>
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
  const { requirements, note }    = useComplianceRequirements()
  const certTypes                 = React.useMemo(() => toCertTypes(requirements), [requirements])
  const { data: properties = [] } = useProperties(workspace?.id)
  const { data: liveContacts = [] } = useContacts(workspace?.id)
  const createTask = useCreateTask()
  const contacts = React.useMemo(
    () => liveContacts.map((c) => ({ id: c.id, name: c.full_name || c.company_name || "Contact" })),
    [liveContacts]
  )
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

  // Per-step validation — block "Continue" until the step's required fields are
  // satisfied so invalid data can never reach later steps or the final insert.
  function stepError(s: number): string | null {
    if (s === 1 && !state.certType) return "Select a certificate type to continue."
    if (s === 2) {
      if (state.recordMode === "property" && !state.property) return "Select a property to continue."
      if (state.recordMode === "supplier" && !state.supplier.trim()) return "Enter a supplier to continue."
    }
    if (s === 3) {
      if (!state.issueDate || !state.expiryDate) return "Both issue and expiry dates are required."
      if (new Date(state.expiryDate) <= new Date(state.issueDate)) return "Expiry date must be after the issue date."
    }
    return null
  }
  const currentStepError = stepError(step)

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

  // Derive a live compliance_status enum value from the expiry date.
  function deriveStatus(): string {
    if (!state.expiryDate) return "ok"
    const days = daysUntil(state.expiryDate)
    if (days < 0) return "overdue"
    if (days <= 30) return "due_soon"
    return "ok"
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

      // 2. Insert the certificate into the live `compliance_items` table.
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const certDef = certTypes.find((t) => t.key === state.certType)
      const typeLabel = certDef?.label ?? "Certificate"
      const { data, error } = await supabase
        .from("compliance_items")
        .insert({
          workspace_id: workspace.id,
          kind: certDef?.kind ?? "other",
          title: typeLabel,
          property_id: state.recordMode === "property" && state.property ? state.property : null,
          reference_no: state.referenceNumber || null,
          last_completed_at: state.issueDate || null,
          due_date: state.expiryDate || null,
          status: deriveStatus(),
          notes: state.issuerName ? `Issuer: ${state.issuerName}` : null,
          // Persist every captured field — nothing the user entered is discarded.
          metadata: {
            reminder_enabled: state.renewalReminder,
            reminder_days: state.renewalReminder ? Number(state.reminderDays) : null,
            record_mode: state.recordMode,
            unit: state.unit || null,
            tenancy: state.tenancy || null,
            supplier: state.recordMode === "supplier" ? state.supplier || null : null,
            issuer_contact: state.issuerContact || null,
            issuer_name: state.issuerName || null,
          },
          created_by: user?.id ?? null,
        })
        .select("id")
        .single()

      if (error) {
        setUploadError(error.message)
        setSaving(false)
        return
      }

      const certId = data?.id as string | undefined
      setNewId(certId ?? null)

      // 2a. Schedule a renewal reminder (best-effort; 42P01-safe if the
      //     Level-2 reminders table isn't provisioned in this environment).
      if (certId && state.renewalReminder && state.expiryDate) {
        try {
          const remindAt = new Date(state.expiryDate)
          remindAt.setDate(remindAt.getDate() - Number(state.reminderDays || "30"))
          await supabase.from("compliance_renewal_reminders").insert({
            workspace_id: workspace.id,
            linked_record_type: "compliance_item",
            linked_record_id: certId,
            reminder_type: "in_app",
            remind_at: remindAt.toISOString(),
            status: "pending",
          })
        } catch {
          /* non-fatal: reminder preference is also stored on the item metadata */
        }
      }

      // 2b. Create the renewal Work task when requested — previously this toggle
      //     (default ON) collected a title/assignee/due date but discarded them.
      if (certId && state.createTask) {
        try {
          const dueDate =
            state.taskDueDate ||
            (state.expiryDate
              ? (() => {
                  const d = new Date(state.expiryDate)
                  d.setDate(d.getDate() - Number(state.reminderDays || "30"))
                  return d.toISOString().slice(0, 10)
                })()
              : null)
          await createTask.mutateAsync({
            workspace_id: workspace.id,
            title: state.taskTitle || `Renew: ${typeLabel}${state.propertyLabel ? ` — ${state.propertyLabel}` : ""}`,
            description: `Auto-created from compliance certificate (${typeLabel}).`,
            category: "compliance",
            priority: certDef?.critical ? "high" : "medium",
            status: "todo",
            property_id: state.recordMode === "property" && state.property ? state.property : null,
            due_date: dueDate,
            ...(state.taskAssignee ? { metadata: { assignee_name: state.taskAssignee, source: "compliance_certificate", certificate_id: certId } } : { metadata: { source: "compliance_certificate", certificate_id: certId } }),
            created_by: user?.id ?? null,
            is_demo: false,
          })
        } catch {
          /* non-fatal: certificate is already created; task is a convenience */
        }
      }

      // 2c. Audit trail (best-effort).
      try {
        await supabase.from("audit_logs").insert({
          workspace_id: workspace.id,
          user_id: user?.id ?? null,
          action: "compliance.certificate_created",
          resource_type: "compliance_item",
          resource_id: certId ?? null,
        })
      } catch {
        /* non-fatal */
      }

      // 3. If a file was uploaded, store it as a linked compliance document.
      if (fileUrl && certId) {
        const url = fileUrl
        try {
          await supabase.from("documents").insert({
            workspace_id: workspace.id,
            property_id: state.recordMode === "property" && state.property ? state.property : null,
            name: state.fileName || `${typeLabel} document`,
            type: "certificate",
            category: "compliance_certificate",
            url,
            r2_key: url,
            r2_bucket: "propvora",
            status: "active",
            expires_at: state.expiryDate || null,
            metadata: {
              issuer: state.issuerName || null,
              verification_status: "pending",
              linked_certificate_id: certId,
            },
            created_by: user?.id ?? null,
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
              <Button variant="primary" size="lg" onClick={() => router.push(`/property-manager/compliance/certificates/${newId}`)}>
                View Certificate
              </Button>
            ) : null}
            <Button variant="outline" size="lg" asChild>
              <Link href="/property-manager/compliance/certificates">Back to Certificates</Link>
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
          className="h-full bg-[var(--brand)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/property-manager/compliance" className="text-slate-400 hover:text-slate-600">Compliance</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/property-manager/compliance/certificates" className="text-slate-400 hover:text-slate-600">Certificates</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-medium">Add Certificate</span>
        </nav>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-140px)]">
        {/* Left Stepper 240px */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-slate-100 bg-slate-50 py-6 px-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Steps</p>
          <div className="space-y-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm",
                  step === s.id
                    ? "bg-[var(--brand)] text-white shadow-sm"
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
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
              {step === 1 && <Step1 state={state} update={update} certTypes={certTypes} regionName={note.regionName} />}
              {step === 2 && <Step2 state={state} update={update} properties={properties} />}
              {step === 3 && <Step3 state={state} update={update} />}
              {step === 4 && <Step4 state={state} update={update} contacts={contacts} />}
              {step === 5 && (
                <Step5
                  state={state}
                  update={update}
                  onFileSelected={(file) => { pendingFileRef.current = file }}
                />
              )}
              {step === 6 && <Step6 state={state} update={update} certTypes={certTypes} />}
              {step === 7 && <Step7 state={state} certTypes={certTypes} />}
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            )}

            {step < STEPS.length && currentStepError && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700">{currentStepError}</p>
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
                    disabled={!!currentStepError}
                    onClick={() => { if (!currentStepError) setStep((p) => Math.min(STEPS.length, p + 1)) }}
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
        <aside className="hidden xl:block w-64 shrink-0 border-l border-slate-100 bg-slate-50 py-6 px-4">
          <SummaryRail state={state} certTypes={certTypes} />
        </aside>
      </div>
    </div>
  )
}
