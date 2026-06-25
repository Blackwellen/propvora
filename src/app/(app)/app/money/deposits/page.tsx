"use client"

import React, { useState, useMemo } from "react"
import {
  Shield,
  CheckCircle,
  Calendar,
  AlertCircle,
  Search,
  ChevronDown,
  Download,
  Plus,
  Eye,
  Trash2,
  X,
  ChevronRight,
  Upload,
  Info,
  ExternalLink,
  ArrowUpRight,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav, MoneyKpiCard, MoneyPageHeader } from "@/components/money"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobilePageHeader from "@/components/mobile/MobilePageHeader"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyDeposits, useMoneyDepositsSummary, useCreateMoneyDeposit, type MoneyDepositRow } from "@/hooks/useMoneyData"
import { createClient } from "@/lib/supabase/client"
import { uploadFile } from "@/lib/upload"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { DepositDetailDrawer } from "./DepositDetailDrawer"

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ─── Types ───────────────────────────────────────────────────────────── */
type DepositStatus = "protected" | "unprotected" | "return_due" | "disputed" | "expected" | "received" | "returned"
// Normalise a scheme picker label to the canonical short code stored in
// deposits.protection_scheme ("DPS" | "TDS" | "MyDeposits") so newly-protected
// deposits match the filter options and seed data.
function toSchemeCode(label: string): string {
  if (label.includes("DPS")) return "DPS"
  if (label.includes("MyDeposits")) return "MyDeposits"
  if (label.includes("TDS")) return "TDS"
  return label
}

interface DepositRow {
  id: string
  avatarInitials: string
  avatarColor: string
  tenantName: string
  tenantRef: string
  propertyAddress: string
  amount: number
  receivedDate: string
  // Canonical short code as stored in deposits.protection_scheme ("DPS" | "TDS" | "MyDeposits"); null when unprotected.
  scheme: string | null
  status: DepositStatus
  statusDetail: string
}

interface TrackDepositForm {
  tenantContact: string
  property: string
  unit: string
  amount: string
  received_date: string
  protection_scheme: string
  protection_reference: string
  prescribed_info_served_at: string
  notes: string
}

interface ReturnDepositForm {
  returned_amount: string
  deductions: string
  return_date: string
}

/* ─── Row mapper ──────────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-teal-500",
  "bg-violet-500", "bg-amber-500", "bg-rose-500",
  "bg-indigo-500", "bg-cyan-500",
]

function mapDepositRow(r: MoneyDepositRow): DepositRow {
  const initials = (r.tenant_name ?? r.tenant_id ?? r.id).slice(0, 2).toUpperCase()
  const colorIdx = r.id.charCodeAt(r.id.length - 1) % AVATAR_COLORS.length

  const receivedDate = r.created_at
    ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"

  let statusDetail = ""
  if (r.status === "protected" && r.protected_at) {
    statusDetail = `Protected on ${new Date(r.protected_at).toLocaleDateString("en-GB")}`
  } else if (r.status === "return_due" && r.return_due_date) {
    statusDetail = `Due on ${new Date(r.return_due_date).toLocaleDateString("en-GB")}`
  } else if (r.status === "disputed" && r.dispute_reason) {
    statusDetail = r.dispute_reason
  } else if (r.status === "expected") {
    statusDetail = "Awaiting receipt confirmation"
  } else if (r.status === "returned" && r.returned_at) {
    statusDetail = `Returned on ${new Date(r.returned_at).toLocaleDateString("en-GB")}`
  }

  return {
    id: r.id,
    avatarInitials: initials,
    avatarColor: AVATAR_COLORS[colorIdx],
    tenantName: r.tenant_name ?? "Unknown Tenant",
    tenantRef: r.id.slice(0, 10).toUpperCase(),
    propertyAddress: r.property_name ?? "Unknown Property",
    amount: r.amount,
    receivedDate,
    scheme: r.scheme,
    status: r.status as DepositStatus,
    statusDetail: r.scheme_reference
      ? `${statusDetail} · Ref: ${r.scheme_reference}`
      : statusDetail,
  }
}

interface DonutSeg { label: string; count: number; pct: number; color: string; dashoffset: number }

const DONUT_DEFS: { key: DepositStatus | "unprotected"; label: string; color: string }[] = [
  { key: "protected", label: "Protected", color: "#10B981" },
  { key: "expected", label: "Expected", color: "#F59E0B" },
  { key: "return_due", label: "Return Due", color: "#F97316" },
  { key: "returned", label: "Returned", color: "#94A3B8" },
  { key: "disputed", label: "Disputed", color: "#DC2626" },
]

function buildDonutSegments(rows: DepositRow[]): { segments: DonutSeg[]; total: number } {
  const total = rows.length
  let acc = 0
  const segments: DonutSeg[] = []
  for (const def of DONUT_DEFS) {
    const count = rows.filter((r) => r.status === def.key).length
    if (count === 0) continue
    const pct = total > 0 ? (count / total) * 100 : 0
    segments.push({ label: def.label, count, pct: Math.round(pct), color: def.color, dashoffset: acc })
    acc += pct
  }
  return { segments, total }
}

/* ─── Status config ───────────────────────────────────────────────────── */
function getStatusConfig(status: DepositStatus) {
  switch (status) {
    case "protected":
      return { label: "Protected", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: <CheckCircle className="w-3.5 h-3.5" /> }
    case "unprotected":
      return { label: "Unprotected", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", icon: <AlertCircle className="w-3.5 h-3.5" /> }
    case "return_due":
      return { label: "Return Due", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", icon: <Calendar className="w-3.5 h-3.5" /> }
    case "disputed":
      return { label: "Disputed", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600", icon: <AlertCircle className="w-3.5 h-3.5" /> }
    case "expected":
      return { label: "Expected", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", icon: <Calendar className="w-3.5 h-3.5" /> }
    case "received":
      return { label: "Received", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", icon: <CheckCircle className="w-3.5 h-3.5" /> }
    case "returned":
      return { label: "Returned", bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", icon: <CheckCircle className="w-3.5 h-3.5" /> }
    default:
      return { label: "Unknown", bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-300", icon: <Info className="w-3.5 h-3.5" /> }
  }
}

/* ─── SVG Donut ───────────────────────────────────────────────────────── */
function DepositDonut({ rows }: { rows: DepositRow[] }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const { segments, total } = buildDonutSegments(rows)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Deposit Status</h3>
      </div>
      {total === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No deposits to chart yet.</p>
      ) : (
        <>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="14" />
                {segments.map((seg) => (
                  <circle
                    key={seg.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={`${(seg.pct / 100) * circumference} ${circumference}`}
                    strokeDashoffset={-((seg.dashoffset / 100) * circumference)}
                    strokeLinecap="butt"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{total}</span>
                <span className="text-[10px] text-slate-500 font-medium">Total</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-slate-600">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">{seg.count}</span>
                  <span className="text-[10px] text-slate-500">({seg.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Track Deposit Modal ──────────────────────────────────────────────── */
function TrackDepositModal({ workspaceId, onClose, onSaved }: { workspaceId: string | undefined; onClose: () => void; onSaved: (msg: string) => void }) {
  const createDeposit = useCreateMoneyDeposit(workspaceId)
  const [form, setForm] = useState<TrackDepositForm>({
    tenantContact: "",
    property: "",
    unit: "",
    amount: "",
    received_date: "",
    protection_scheme: "",
    protection_reference: "",
    prescribed_info_served_at: "",
    notes: "",
  })
  const [formError, setFormError] = useState<string | null>(null)

  function handleChange(field: keyof TrackDepositForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    if (!form.tenantContact.trim()) { setFormError("Tenant / Contact is required"); return }
    if (!form.amount || isNaN(parseFloat(form.amount))) { setFormError("A valid amount is required"); return }
    if (!form.received_date) { setFormError("Received date is required"); return }
    if (!workspaceId) { setFormError("No workspace found — please refresh and try again"); return }
    setFormError(null)

    const propertyAddress = form.unit
      ? `${form.property}${form.property ? ", " : ""}${form.unit}`
      : form.property

    const combinedNotes = [
      form.notes.trim(),
      form.prescribed_info_served_at ? `Prescribed information served: ${form.prescribed_info_served_at}` : "",
    ].filter(Boolean).join(" · ") || null

    createDeposit.mutate(
      {
        workspace_id: workspaceId,
        tenant_name: form.tenantContact.trim(),
        property_address: propertyAddress.trim() || "—",
        amount: parseFloat(form.amount),
        received_date: form.received_date,
        status: form.protection_scheme ? "protected" : "received",
        scheme: form.protection_scheme || null,
        reference: form.protection_reference.trim() || null,
        notes: combinedNotes,
      },
      {
        onSuccess: () => {
          onSaved("Deposit tracked and saved successfully")
          onClose()
        },
        onError: (err) => {
          setFormError(err.message ?? "Failed to save deposit — please try again")
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Track Deposit</h3>
          <button aria-label="Close" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Tenant / Contact</label>
            <input
              value={form.tenantContact}
              onChange={(e) => handleChange("tenantContact", e.target.value)}
              placeholder="e.g. Sarah Mitchell"
              className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Property</label>
              <input
                value={form.property}
                onChange={(e) => handleChange("property", e.target.value)}
                placeholder="e.g. Maple Avenue"
                className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Unit</label>
              <input
                value={form.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="e.g. Unit 5"
                className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Amount (£)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="1250"
                className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Received Date</label>
              <input
                type="date"
                value={form.received_date}
                onChange={(e) => handleChange("received_date", e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Protection Scheme</label>
            <div className="relative">
              <select
                value={form.protection_scheme}
                onChange={(e) => handleChange("protection_scheme", e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-lg text-sm border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="">Not yet protected</option>
                <option value="dps">Deposit Protection Service (DPS)</option>
                <option value="tds">TDS (Custodial)</option>
                <option value="mydeposits">MyDeposits (Custodial)</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Protection Reference</label>
            <input
              value={form.protection_reference}
              onChange={(e) => handleChange("protection_reference", e.target.value)}
              placeholder="e.g. DPS20260001"
              className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Prescribed Info Served At</label>
            <input
              type="date"
              value={form.prescribed_info_served_at}
              onChange={(e) => handleChange("prescribed_info_served_at", e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Upload Proof</label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Browse or drag file here</span>
              <input type="file" className="hidden" />
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 space-y-2">
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={createDeposit.isPending}
              className="flex-1 h-9 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {createDeposit.isPending ? "Saving..." : "Save Deposit"}
            </button>
            <button aria-label="Close"
              onClick={onClose}
              disabled={createDeposit.isPending}
              className="h-9 px-4 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Return Deposit Modal ─────────────────────────────────────────────── */
function ReturnDepositModal({ deposit, onClose, onSaved }: { deposit: DepositRow; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState<ReturnDepositForm>({
    returned_amount: String(deposit.amount),
    deductions: "",
    return_date: "",
  })
  const [returnError, setReturnError] = useState<string | null>(null)

  function handleChange(field: keyof ReturnDepositForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleConfirm() {
    if (!form.returned_amount || isNaN(parseFloat(form.returned_amount))) { setReturnError("Valid returned amount required"); return }
    if (!form.return_date) { setReturnError("Return date is required"); return }
    setReturnError(null)
    onSaved(`Deposit return recorded for ${deposit.tenantName} — full write-back requires deposit management module`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Return Deposit</h3>
          <button aria-label="Close" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-1">Deposit</p>
            <p className="text-sm font-semibold text-slate-800">{deposit.tenantName}</p>
            <p className="text-xs text-slate-500">{deposit.propertyAddress}</p>
            <p className="text-lg font-bold text-blue-600 mt-1">£{deposit.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Returned Amount (£)</label>
            <input
              type="number"
              value={form.returned_amount}
              onChange={(e) => handleChange("returned_amount", e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Deductions</label>
            <textarea
              value={form.deductions}
              onChange={(e) => handleChange("deductions", e.target.value)}
              placeholder="Describe any deductions..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Return Date</label>
            <input
              type="date"
              value={form.return_date}
              onChange={(e) => handleChange("return_date", e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Upload Evidence</label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 cursor-pointer hover:bg-slate-50">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Browse or drag file</span>
              <input type="file" className="hidden" />
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 space-y-2">
          {returnError && <p className="text-xs text-red-600">{returnError}</p>}
          <div className="flex gap-2">
            <button onClick={handleConfirm} className="flex-1 h-9 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors">
              Confirm Return
            </button>
            <button aria-label="Close" onClick={onClose} className="h-9 px-4 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Add Protection Modal ─────────────────────────────────────────────── */
const PROTECTION_SCHEMES = [
  "Deposit Protection Service (DPS)",
  "MyDeposits (Custodial)",
  "TDS (Custodial)",
  "MyDeposits (Insured)",
  "TDS (Insured)",
]

const SCHEME_META: Record<string, { short: string; abbr: string; type: string; tint: string }> = {
  "Deposit Protection Service (DPS)": { short: "Deposit Protection Service", abbr: "DPS", type: "Custodial", tint: "bg-blue-600" },
  "MyDeposits (Custodial)":           { short: "MyDeposits",                 abbr: "MD",  type: "Custodial", tint: "bg-emerald-600" },
  "TDS (Custodial)":                  { short: "Tenancy Deposit Scheme",     abbr: "TDS", type: "Custodial", tint: "bg-violet-600" },
  "MyDeposits (Insured)":             { short: "MyDeposits",                 abbr: "MD",  type: "Insured",   tint: "bg-emerald-600" },
  "TDS (Insured)":                    { short: "Tenancy Deposit Scheme",     abbr: "TDS", type: "Insured",   tint: "bg-violet-600" },
}

function AddProtectionModal({
  deposit,
  workspaceId,
  onClose,
  onSaved,
}: {
  deposit: DepositRow
  workspaceId: string | undefined
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [scheme, setScheme] = useState(PROTECTION_SCHEMES[0])
  const [reference, setReference] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!workspaceId) { setError("No workspace found — please refresh and try again"); return }
    if (!reference.trim()) { setError("A scheme reference number is required"); return }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: updErr } = await supabase
      .from("deposits")
      .update({ status: "protected", protection_scheme: toSchemeCode(scheme), reference_number: reference.trim() })
      .eq("id", deposit.id)
      .eq("workspace_id", workspaceId)
    setSaving(false)
    if (updErr) {
      setError(updErr.code === "42P01" ? "Deposits table not provisioned yet" : (updErr.message ?? "Could not protect deposit"))
      return
    }
    onSaved(`Deposit protected in ${scheme}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Add Protection</h3>
              <p className="text-[11px] text-slate-500">Register this deposit with an approved scheme</p>
            </div>
          </div>
          <button aria-label="Close" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5 overflow-y-auto">
          {/* Deposit summary */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", deposit.avatarColor)}>
              {deposit.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{deposit.tenantName}</p>
              <p className="text-xs text-slate-500 truncate">{deposit.propertyAddress}</p>
            </div>
            <p className="text-base font-bold text-slate-900 tabular-nums shrink-0">£{deposit.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
          </div>

          {/* Scheme picker — selectable cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Protection scheme</label>
            <div className="grid grid-cols-1 gap-2">
              {PROTECTION_SCHEMES.map((s) => {
                const meta = SCHEME_META[s]
                const active = scheme === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setScheme(s); setError(null) }}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all",
                      active ? "border-emerald-500 bg-emerald-50/60" : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0", meta.tint)}>
                      {meta.abbr}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{meta.short}</p>
                      <p className="text-[11px] text-slate-500">{meta.type} scheme</p>
                    </div>
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      active ? "bg-emerald-500" : "border-2 border-slate-200"
                    )}>
                      {active && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Scheme reference number</label>
            <input
              value={reference}
              onChange={(e) => { setReference(e.target.value); setError(null) }}
              placeholder="e.g. DPS20260001"
              className="w-full h-10 px-3.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            />
            <p className="text-[11px] text-slate-500">The certificate or membership reference issued by the scheme when the deposit was lodged.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-2 shrink-0">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              <Shield className="w-4 h-4" />
              {saving ? "Protecting…" : "Mark Protected"}
            </button>
            <button aria-label="Close" onClick={onClose} disabled={saving} className="h-10 px-4 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-60">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Deposit Row ──────────────────────────────────────────────────────── */
function DepositRowItem({
  deposit,
  isLive,
  onReturn,
  onToast,
  onDelete,
  onMarkReturned,
  onProtect,
  onUploadDoc,
  onViewDetails,
  uploadingId,
}: {
  deposit: DepositRow
  isLive: boolean
  onReturn: (deposit: DepositRow) => void
  onToast: (msg: string) => void
  onDelete: (id: string) => Promise<void>
  onMarkReturned: (id: string) => void
  onProtect: (deposit: DepositRow) => void
  onUploadDoc: (deposit: DepositRow, file: File) => void
  onViewDetails: (deposit: DepositRow) => void
  uploadingId: string | null
}) {
  const sc = getStatusConfig(deposit.status)
  const docInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="bg-white border border-slate-100 rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-sm hover:border-slate-200 transition-all">
      {/* Tenant */}
      <div className="flex items-center gap-3 min-w-0 md:w-52 shrink-0">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", deposit.avatarColor)}>
          {deposit.avatarInitials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{deposit.tenantName}</p>
          <p className="text-[11px] text-slate-500">{deposit.tenantRef}</p>
        </div>
      </div>

      {/* Property */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-700 truncate">{deposit.propertyAddress}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
          £{deposit.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })} · Received {deposit.receivedDate}
        </p>
      </div>

      {/* Scheme */}
      <div className="shrink-0 w-44 hidden lg:block">
        <p className="text-[11px] text-slate-500 truncate">{deposit.scheme ?? "— Not protected"}</p>
      </div>

      {/* Status */}
      <div className="shrink-0 w-48">
        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", sc.bg, sc.text)}>
          {sc.icon}
          {sc.label}
        </div>
        <p className={cn("text-[10px] mt-0.5 font-medium truncate max-w-[11rem]", sc.text)}>{deposit.statusDetail}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {deposit.status === "return_due" && (
          <button
            onClick={() => onReturn(deposit)}
            className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            Return Deposit
          </button>
        )}
        {(deposit.status === "unprotected" || deposit.status === "received") && (
          <button
            onClick={() => isLive ? onProtect(deposit) : onToast("Sample deposit — actions persist once saved")}
            className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
          >
            Add Protection
          </button>
        )}
        {deposit.status === "expected" && (
          <>
            <input
              ref={docInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.csv,.xlsx,.txt"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadDoc(deposit, f); e.target.value = "" }}
            />
            <button
              onClick={() => isLive ? docInputRef.current?.click() : onToast("Sample deposit — actions persist once saved")}
              disabled={uploadingId === deposit.id}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              <Upload className="w-3 h-3" />{uploadingId === deposit.id ? "Uploading…" : "Upload Docs"}
            </button>
          </>
        )}
        {(deposit.status === "protected" || deposit.status === "disputed") && (
          <button
            onClick={() => isLive ? onViewDetails(deposit) : onToast("Sample deposit — details available once saved")}
            className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            View Details
          </button>
        )}
        <ConfirmDialog
          title="Delete deposit?"
          description="This permanently removes the deposit record. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => onDelete(deposit.id)}
        >
          {(open) => (
            <ActionMenu
              items={[
                { label: "View Details", icon: Eye, onClick: () => isLive ? onViewDetails(deposit) : onToast("Sample deposit — details available once saved") },
                { label: "Mark Returned", icon: CheckCircle, onClick: () => onMarkReturned(deposit.id) },
                { label: "Delete", icon: Trash2, onClick: open, variant: "danger" },
              ]}
            />
          )}
        </ConfirmDialog>
      </div>
    </div>
  )
}

/* ─── Loading skeleton ────────────────────────────────────────────────── */
function DepositListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-xl px-5 py-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-40" />
              <div className="h-2 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-6 bg-slate-100 rounded-full w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function DepositsPage() {
  const { workspace } = useWorkspace()
  const { data: liveDeposits, isLoading: depositsLoading } = useMoneyDeposits(workspace?.id)
  const { data: liveSummary } = useMoneyDepositsSummary(workspace?.id)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedScheme, setSelectedScheme] = useState("all")
  const [selectedProperty, setSelectedProperty] = useState("all")
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [returnDeposit, setReturnDeposit] = useState<DepositRow | null>(null)
  const [protectDeposit, setProtectDeposit] = useState<DepositRow | null>(null)
  const [detailDepositId, setDetailDepositId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  function isLiveDeposit(id: string) { return !!liveDeposits && liveDeposits.some((r) => r.id === id) }

  async function deleteDeposit(id: string) {
    if (isLiveDeposit(id)) {
      const supabase = createClient()
      try {
        const { error } = await supabase.from("deposits").delete().eq("id", id).eq("workspace_id", workspace?.id ?? "")
        if (error && error.code !== "42P01") throw error
      } catch { showToast("Could not delete deposit"); return }
    }
    setHiddenIds((p) => new Set(p).add(id))
    showToast("Deposit deleted")
  }

  async function markDepositReturned(id: string) {
    if (!isLiveDeposit(id)) { showToast("Sample deposit — actions persist once saved"); return }
    const supabase = createClient()
    try {
      // deposits has no returned_at column; the status enum carries 'returned'.
      const { error } = await supabase.from("deposits").update({ status: "returned" }).eq("id", id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      showToast(error?.code === "42P01" ? "Deposits table not provisioned yet" : "Marked as returned")
    } catch { showToast("Could not update deposit") }
  }

  async function uploadDepositDoc(deposit: DepositRow, file: File) {
    if (!workspace?.id) { showToast("No workspace found — please refresh and try again"); return }
    if (!isLiveDeposit(deposit.id)) { showToast("Sample deposit — actions persist once saved"); return }
    setUploadingId(deposit.id)
    try {
      const uploaded = await uploadFile(file, workspace.id, "deposits")
      const supabase = createClient()
      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .insert({
          workspace_id: workspace.id,
          name: file.name,
          category: "deposit",
          mime_type: uploaded.type || file.type || null,
          size_bytes: uploaded.size ?? file.size,
          r2_key: uploaded.key,
          r2_bucket: "propvora",
          url: uploaded.url,
          status: "uploaded",
          metadata: { deposit_id: deposit.id },
        })
        .select("id")
        .single()
      if (docErr) {
        showToast(docErr.code === "42P01" ? "Documents table not provisioned yet" : (docErr.message ?? "Could not save document"))
        return
      }
      const { error: updErr } = await supabase
        .from("deposits")
        .update({ document_id: doc.id })
        .eq("id", deposit.id)
        .eq("workspace_id", workspace.id)
      if (updErr) {
        showToast(updErr.message ?? "Document saved but could not link to deposit")
        return
      }
      showToast("Document uploaded and linked to deposit")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingId(null)
    }
  }

  // Map live Supabase data to display format — no mock fallback
  const DEPOSITS_LIVE: DepositRow[] = useMemo(() => {
    if (!liveDeposits) return []
    return liveDeposits.map(mapDepositRow)
  }, [liveDeposits])

  // Distinct property values from live deposits — replaces hardcoded mock options
  const propertyOptions = useMemo(() => {
    const set = new Set<string>()
    for (const d of DEPOSITS_LIVE) {
      if (d.propertyAddress && d.propertyAddress !== "Unknown Property") set.add(d.propertyAddress)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [DEPOSITS_LIVE])

  function handleExportCSV() {
    downloadCSV(
      DEPOSITS_LIVE.map(d => ({
        tenant: d.tenantName,
        ref: d.tenantRef,
        property: d.propertyAddress,
        amount: d.amount,
        received: d.receivedDate,
        status: d.status,
      })),
      "deposits.csv"
    )
  }

  const filtered = DEPOSITS_LIVE.filter((d) => !hiddenIds.has(d.id)).filter((d) => {
    const q = searchQuery.toLowerCase()
    const matchSearch =
      !q ||
      d.tenantName.toLowerCase().includes(q) ||
      d.propertyAddress.toLowerCase().includes(q) ||
      d.tenantRef.toLowerCase().includes(q)
    const matchStatus = selectedStatus === "all" || d.status === selectedStatus
    const matchScheme =
      selectedScheme === "all" ||
      (selectedScheme === "none" ? !d.scheme : d.scheme === selectedScheme)
    const matchProperty =
      selectedProperty === "all" || d.propertyAddress.toLowerCase().includes(selectedProperty.toLowerCase())
    return matchSearch && matchStatus && matchScheme && matchProperty
  })

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Deposits"
        subtitle={`${filtered.length} deposit${filtered.length === 1 ? "" : "s"}`}
        primaryAction={{ label: "Track Deposit", icon: Plus, onClick: () => setShowTrackModal(true) }}
        overflowActions={[{ label: "Export CSV", icon: Download, onClick: handleExportCSV }]}
      />
      {showTrackModal && <TrackDepositModal workspaceId={workspace?.id} onClose={() => setShowTrackModal(false)} onSaved={showToast} />}
      {returnDeposit && <ReturnDepositModal deposit={returnDeposit} onClose={() => setReturnDeposit(null)} onSaved={showToast} />}
      {protectDeposit && <AddProtectionModal deposit={protectDeposit} workspaceId={workspace?.id} onClose={() => setProtectDeposit(null)} onSaved={showToast} />}
      {detailDepositId && <DepositDetailDrawer depositId={detailDepositId} workspaceId={workspace?.id} onClose={() => setDetailDepositId(null)} />}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="hidden md:block">
      <MoneyPageHeader
        breadcrumb="Deposits"
        title="Deposits"
        subtitle="Track, protect and manage tenant deposits with confidence."
        actions={
          <>
            <button
              onClick={() => setShowTrackModal(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Track Deposit
            </button>
            <button onClick={handleExportCSV} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </>
        }
      />
      </div>

      <MoneyTabNav />

      {/* Mobile header — search (desktop controls gated below) */}
      <MobilePageHeader hideTitle
        title="Deposits"
        count={`${filtered.length} deposit${filtered.length === 1 ? "" : "s"}`}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search deposits…"
        className="mt-4"
      />

      {/* KPI Row */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MoneyKpiCard
          label="Total Tracked"
          value={liveSummary ? `£${liveSummary.totalTracked.toLocaleString("en-GB")}` : "—"}
          subtitle={`${DEPOSITS_LIVE.length} deposits`}
          icon={<Shield className="w-5 h-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MoneyKpiCard
          label="Protected"
          value={liveSummary ? `£${liveSummary.protected.toLocaleString("en-GB")}` : "—"}
          subtitle={liveSummary ? `${Math.round((liveSummary.protected / (liveSummary.totalTracked || 1)) * 100)}% of total` : "—"}
          icon={<CheckCircle className="w-5 h-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MoneyKpiCard
          label="Expected"
          value={liveSummary ? `£${liveSummary.expected.toLocaleString("en-GB")}` : "—"}
          subtitle="pending protection"
          icon={<Calendar className="w-5 h-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <MoneyKpiCard
          label="Return Due"
          value={liveSummary ? `£${liveSummary.returnDue.toLocaleString("en-GB")}` : "—"}
          subtitle="deposits"
          icon={<Calendar className="w-5 h-5" />}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <MoneyKpiCard
          label="Disputed"
          value={liveSummary ? `£${liveSummary.disputed.toLocaleString("en-GB")}` : "—"}
          subtitle="cases"
          icon={<AlertCircle className="w-5 h-5" />}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* Compliance Banner */}
      <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 flex-1">
          All tenancy deposits must be protected in an approved scheme within 30 days of receipt and prescribed information must be served on the tenant.
        </p>
        <a
          href="https://www.gov.uk/tenancy-deposit-protection"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap flex items-center gap-1 shrink-0"
        >
          View approved schemes <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Main Layout */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* Left */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Controls */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tenant, property or reference..."
                className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg text-sm bg-white border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Statuses</option>
                <option value="protected">Protected</option>
                <option value="unprotected">Unprotected</option>
                <option value="return_due">Return Due</option>
                <option value="disputed">Disputed</option>
                <option value="expected">Expected</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedScheme}
                onChange={(e) => setSelectedScheme(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg text-sm bg-white border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Schemes</option>
                <option value="Deposit Protection Service (DPS)">DPS</option>
                <option value="TDS (Custodial)">TDS</option>
                <option value="MyDeposits (Custodial)">MyDeposits</option>
                <option value="none">Not Protected</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg text-sm bg-white border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Properties</option>
                {propertyOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <button className="h-9 px-3 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
              More Filters
            </button>
            <button onClick={handleExportCSV} className="h-9 px-3 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Deposit Register */}
          {depositsLoading ? (
            <DepositListSkeleton />
          ) : (
            <div className="space-y-2">
              {filtered.map((deposit) => (
                <DepositRowItem
                  key={deposit.id}
                  deposit={deposit}
                  isLive={isLiveDeposit(deposit.id)}
                  onReturn={setReturnDeposit}
                  onToast={showToast}
                  onDelete={deleteDeposit}
                  onMarkReturned={markDepositReturned}
                  onProtect={setProtectDeposit}
                  onUploadDoc={uploadDepositDoc}
                  onViewDetails={(d) => setDetailDepositId(d.id)}
                  uploadingId={uploadingId}
                />
              ))}
              {filtered.length === 0 && (
                <div className="py-16 text-center space-y-2 bg-white rounded-xl border border-slate-100">
                  <Shield className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-sm font-medium">No deposits tracked yet</p>
                  <p className="text-slate-500 text-xs">
                    {DEPOSITS_LIVE.length === 0
                      ? "Use the Track Deposit button to record your first deposit."
                      : "No deposits match your current filters."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Count */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">Showing {filtered.length} deposit{filtered.length === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-6">
          {/* Donut */}
          <DepositDonut rows={DEPOSITS_LIVE} />

          {/* Upcoming Returns — derived from live return_due deposits */}
          {(() => {
            const upcomingReturns = DEPOSITS_LIVE
              .filter((d) => d.status === "return_due")
              .slice(0, 3)
            return (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">Upcoming Returns</h3>
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                    View all <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {upcomingReturns.length > 0 ? upcomingReturns.map((r) => {
                    const rawRow = liveDeposits?.find((d) => d.id === r.id)
                    const dueDate = rawRow?.return_due_date ? new Date(rawRow.return_due_date) : null
                    const month = dueDate ? dueDate.toLocaleString("en-GB", { month: "short" }).toUpperCase() : "—"
                    const day   = dueDate ? String(dueDate.getDate()) : "—"
                    return (
                      <div key={r.id} className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg bg-red-500 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-white/80 uppercase">{month}</span>
                          <span className="text-base font-bold text-white leading-none">{day}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{r.tenantName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{r.propertyAddress}</p>
                          <p className="text-xs font-bold text-blue-600 mt-0.5">£{r.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="text-xs text-slate-500 text-center py-4">No returns due.</p>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Needs Attention — live */}
          {(() => {
            const unprotected = DEPOSITS_LIVE.filter((d) => d.status === "unprotected")
            const returnsDue = DEPOSITS_LIVE.filter((d) => d.status === "return_due")
            const disputed = DEPOSITS_LIVE.filter((d) => d.status === "disputed")
            const returnsValue = returnsDue.reduce((acc, d) => acc + d.amount, 0)
            const items = [
              unprotected.length > 0 && {
                key: "unprotected", filter: "unprotected", icon: <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />,
                bg: "bg-amber-50 border-amber-100 hover:bg-amber-100", text: "text-amber-800", sub: "text-amber-600",
                title: `${unprotected.length} deposit${unprotected.length === 1 ? "" : "s"} unprotected`, subtitle: "Requires immediate protection",
              },
              returnsDue.length > 0 && {
                key: "returns", filter: "return_due", icon: <Calendar className="w-4 h-4 text-orange-600 shrink-0" />,
                bg: "bg-orange-50 border-orange-100 hover:bg-orange-100", text: "text-orange-800", sub: "text-orange-600",
                title: `${returnsDue.length} return${returnsDue.length === 1 ? "" : "s"} due`, subtitle: `Total value ${returnsValue.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 })}`,
              },
              disputed.length > 0 && {
                key: "disputed", filter: "disputed", icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
                bg: "bg-red-50 border-red-100 hover:bg-red-100", text: "text-red-800", sub: "text-red-600",
                title: `${disputed.length} disputed case${disputed.length === 1 ? "" : "s"}`, subtitle: "Action required",
              },
            ].filter(Boolean) as { key: string; filter: string; icon: React.ReactNode; bg: string; text: string; sub: string; title: string; subtitle: string }[]

            return (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">Needs Attention</h3>
                </div>
                {items.length > 0 ? (
                  <div className="space-y-2">
                    {items.map((it) => (
                      <button
                        key={it.key}
                        onClick={() => setSelectedStatus(it.filter)}
                        className={cn("w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left group", it.bg)}
                      >
                        {it.icon}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold", it.text)}>{it.title}</p>
                          <p className={cn("text-[10px]", it.sub)}>{it.subtitle}</p>
                        </div>
                        <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity", it.sub)} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Nothing needs attention.</p>
                )}
              </div>
            )
          })()}
        </aside>
      </div>
    </DashboardContainer>
  )
}
