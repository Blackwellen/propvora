"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { cn } from "@/lib/utils"
import {
  Flame,
  ChevronRight,
  Calendar,
  AlertTriangle,
  FileText,
  Download,
  Pencil,
  UploadCloud,
  RefreshCw,
  CheckSquare,
  Archive,
  Building2,
  User,
  Paperclip,
  ExternalLink,
  Clock,
  DollarSign,
  Activity,
  ShieldCheck,
  Sparkles,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
} from "lucide-react"

// Map certificate-style status (from the mapped compliance_item) back to the
// compliance_status enum the live table stores.
function toItemStatus(status: string): string {
  switch (status) {
    case "valid": return "ok"
    case "expiring_soon": return "due_soon"
    case "expired": return "overdue"
    case "missing": return "missing"
    case "exempt": return "exempt"
    default: return "ok"
  }
}

const CERT_TYPE_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety Certificate",
  eicr: "EICR Certificate",
  epc: "EPC Certificate",
  fire_risk: "Fire Risk Assessment",
  legionella: "Legionella Risk Assessment",
  pat: "PAT Testing Certificate",
}

const STATUS_OPTIONS = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "missing", label: "Missing" },
]

const RISK_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "watch", label: "Watch" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
]

const TYPE_OPTIONS = [
  { value: "gas_safety", label: "Gas Safety Certificate" },
  { value: "eicr", label: "EICR Certificate" },
  { value: "epc", label: "EPC Certificate" },
  { value: "fire_risk", label: "Fire Risk Assessment" },
  { value: "legionella", label: "Legionella Risk Assessment" },
  { value: "pat", label: "PAT Testing Certificate" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d || d === "—") return "—"
  const parsed = new Date(d)
  if (isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function daysUntil(d: string | null | undefined) {
  if (!d) return null
  const parsed = new Date(d)
  if (isNaN(parsed.getTime())) return null
  return Math.round((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function statusBadge(status: string) {
  const map: Record<string, { variant: "success" | "warning" | "danger" | "default"; label: string }> = {
    valid: { variant: "success", label: "Valid" },
    expiring_soon: { variant: "warning", label: "Expiring Soon" },
    expired: { variant: "danger", label: "Expired" },
    missing: { variant: "default", label: "Missing" },
  }
  const cfg = map[status] ?? { variant: "default" as const, label: status }
  return <Badge variant={cfg.variant} size="sm" dot>{cfg.label}</Badge>
}

// ─── Page ────────────────────────────────────────────────────────────────────

const DETAIL_TABS = [
  { key: "overview", label: "Overview", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { key: "document", label: "Document Preview", icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "linked", label: "Linked Records", icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: "renewal", label: "Renewal", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  { key: "tasks", label: "Work Tasks", icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { key: "costs", label: "Costs", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { key: "activity", label: "Activity", icon: <Activity className="w-3.5 h-3.5" /> },
  { key: "audit", label: "Audit", icon: <Eye className="w-3.5 h-3.5" /> },
]

export default function CertificateDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const qc = useQueryClient()

  // Fetch the live compliance item (mapped to certificate shape).
  const { data: cert, isLoading } = useQuery({
    queryKey: ["compliance-certificate-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_items")
        .select("*, properties(name:nickname)")
        .eq("id", id)
        .single()
      if (error) {
        if (error.code === "42P01" || error.code === "PGRST116") return null
        throw new Error(error.message)
      }
      const r = data as any
      const meta = r.metadata ?? {}
      const status =
        r.status === "ok" ? "valid"
          : r.status === "due_soon" ? "expiring_soon"
          : r.status === "overdue" ? "expired"
          : r.status === "missing" ? "missing"
          : "valid"
      return {
        id: r.id,
        property_id: r.property_id,
        certificate_type: r.kind,
        reference_number: r.reference_no,
        issue_date: r.last_completed_at,
        expiry_date: r.due_date,
        status,
        risk_level: meta.risk_level ?? "medium",
        notes: r.notes,
        property_name: r.properties?.name ?? undefined,
        created_at: r.created_at,
      }
    },
  })

  const row: any = cert ?? {}
  const notFound = !isLoading && !cert
  const isSeed = false // live data only — inline editing always enabled
  const label = CERT_TYPE_LABELS[row.certificate_type] ?? row.certificate_type ?? "Certificate"
  const days = daysUntil(row.expiry_date)

  // Persist a single field — maps view-model keys back to compliance_items columns.
  async function saveField(patch: Record<string, any>) {
    const out: Record<string, any> = { updated_at: new Date().toISOString() }
    if ("certificate_type" in patch) out.kind = patch.certificate_type
    if ("reference_number" in patch) out.reference_no = patch.reference_number
    if ("issue_date" in patch) out.last_completed_at = patch.issue_date
    if ("expiry_date" in patch) out.due_date = patch.expiry_date
    if ("notes" in patch) out.notes = patch.notes
    if ("status" in patch) out.status = toItemStatus(patch.status)
    const { error } = await supabase
      .from("compliance_items")
      .update(out)
      .eq("id", id)
    if (error && error.code !== "42P01") throw new Error(error.message)
    qc.invalidateQueries({ queryKey: ["compliance-certificate-detail", id] })
    qc.invalidateQueries({ queryKey: ["compliance-certificates"] })
  }

  async function setStatus(status: string) {
    await saveField({ status })
  }

  async function handleDelete() {
    const { error } = await supabase
      .from("compliance_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
    if (error && error.code !== "42P01") throw new Error(error.message)
    qc.invalidateQueries({ queryKey: ["compliance-certificates"] })
    router.push("/app/compliance/certificates")
  }

  function exportEvidence() {
    const payload = JSON.stringify(row, null, 2)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `certificate-${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Tab content ───────────────────────────────────────────────────────────

  function OverviewTab() {
    const detailRows: { label: string; node: React.ReactNode }[] = [
      {
        label: "Type",
        node: (
          <InlineEditField
            value={row.certificate_type}
            type="select"
            options={TYPE_OPTIONS}
            disabled={isSeed}
            onSave={(v) => saveField({ certificate_type: v })}
          />
        ),
      },
      {
        label: "Reference",
        node: (
          <InlineEditField
            value={row.reference_number}
            type="text"
            placeholder="Add reference"
            disabled={isSeed}
            onSave={(v) => saveField({ reference_number: v })}
          />
        ),
      },
      {
        label: "Property",
        node: <span className="text-sm text-slate-800 font-medium">{row.property_name ?? "—"}</span>,
      },
      {
        label: "Status",
        node: (
          <InlineEditField
            value={row.status}
            type="select"
            options={STATUS_OPTIONS}
            disabled={isSeed}
            onSave={(v) => saveField({ status: v })}
          />
        ),
      },
      {
        label: "Risk",
        node: (
          <InlineEditField
            value={row.risk_level}
            type="select"
            options={RISK_OPTIONS}
            disabled={isSeed}
            onSave={(v) => saveField({ risk_level: v })}
          />
        ),
      },
    ]

    const renewalRows: { label: string; node: React.ReactNode }[] = [
      {
        label: "Issue Date",
        node: (
          <InlineEditField
            value={row.issue_date}
            type="date"
            disabled={isSeed}
            onSave={(v) => saveField({ issue_date: v })}
          />
        ),
      },
      {
        label: "Expiry Date",
        node: (
          <InlineEditField
            value={row.expiry_date}
            type="date"
            disabled={isSeed}
            onSave={(v) => saveField({ expiry_date: v })}
          />
        ),
      },
      {
        label: "Days Remaining",
        node: (
          <span className={cn("text-sm font-semibold", days != null && days < 60 ? "text-amber-700" : "text-slate-700")}>
            {days != null ? `${days} days` : "—"}
          </span>
        ),
      },
    ]

    return (
      <div className="space-y-5">
        {isSeed && (
          <div className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            Showing example data — connect the compliance database to enable inline editing.
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Certificate Details</p>
          </div>
          <div className="divide-y divide-slate-50">
            {detailRows.map((r) => (
              <div key={r.label} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xs text-slate-400 font-medium w-24 shrink-0">{r.label}</span>
                <span className="text-sm text-slate-800 font-medium">{r.node}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Renewal Information</p>
          </div>
          <div className="divide-y divide-slate-50">
            {renewalRows.map((r) => (
              <div key={r.label} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xs text-slate-400 font-medium w-36 shrink-0">{r.label}</span>
                <span className="text-sm text-slate-800 font-medium">{r.node}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes</p>
          </div>
          <div className="px-5 py-4">
            <InlineEditField
              value={row.notes}
              type="textarea"
              placeholder="Add notes for this certificate"
              disabled={isSeed}
              onSave={(v) => saveField({ notes: v })}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Next Best Actions</p>
          </div>
          <div className="p-4 space-y-2.5">
            <Link
              href="/app/compliance/certificates/new"
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2563EB]">Schedule Renewal</p>
                <p className="text-xs text-slate-500">Create the next certificate record</p>
              </div>
            </Link>
            <button
              onClick={exportEvidence}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Export Evidence</p>
                <p className="text-xs text-slate-500">Download a copy of this record</p>
              </div>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic px-1">
          This is a record of your compliance document. Always confirm requirements with qualified professionals.
        </p>
      </div>
    )
  }

  function DocumentTab() {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Document Preview</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportEvidence}><Download className="w-3.5 h-3.5" />Download</Button>
            </div>
          </div>
          <div className="p-6">
            <div className="w-full min-h-80 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3">
              <FileText className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">PDF Preview — {label}</p>
              <p className="text-xs text-slate-400">{row.reference_number ?? "No reference"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function LinkedRecordsTab() {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Linked Records</p>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{row.property_name ?? "Unlinked property"}</p>
                <p className="text-xs text-slate-400">Property</p>
              </div>
              {row.property_id && (
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link href={`/app/properties/${row.property_id}`}><ExternalLink className="w-3.5 h-3.5" /></Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function RenewalTab() {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Renewal</p>
            <Button variant="primary" size="sm" asChild>
              <Link href="/app/compliance/certificates/new">
                <Plus className="w-3.5 h-3.5" />
                Schedule Next Renewal
              </Link>
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Certificate", "Issue Date", "Expiry Date", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr>
                <td className="px-5 py-3 font-semibold text-slate-800">{label} (Current)</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(row.issue_date)}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(row.expiry_date)}</td>
                <td className="px-5 py-3">{statusBadge(row.status)}</td>
                <td className="px-5 py-3">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/app/compliance/certificates/${id}`}><Eye className="w-3.5 h-3.5" /></Link>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function WorkTasksTab() {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Work Tasks</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/tasks/new"><Plus className="w-3.5 h-3.5" />Add Task</Link>
            </Button>
          </div>
          <div className="px-5 py-10 text-center text-sm text-slate-400">No tasks linked to this certificate yet.</div>
        </div>
      </div>
    )
  }

  function CostsTab() {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Costs</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/money"><Plus className="w-3.5 h-3.5" />Add Cost</Link>
            </Button>
          </div>
          <div className="px-5 py-10 text-center text-sm text-slate-400">No costs recorded for this certificate yet.</div>
        </div>
      </div>
    )
  }

  function ActivityTab() {
    const events = [
      { date: fmtDate(row.created_at), action: "Certificate created", actor: "You", detail: "Initial record created" },
    ]
    return (
      <div className="space-y-4">
        <div className="relative pl-5">
          {events.map((ev, i) => (
            <div key={i} className="relative mb-6">
              <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full bg-[#2563EB] border-2 border-white shadow" />
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ev.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ev.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-600">{ev.actor}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{ev.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function AuditTab() {
    const rows = [
      { date: fmtDate(row.created_at), action: "Created", actor: "You", detail: "Certificate record created" },
    ]
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Date", "Action", "Actor", "Details"].map((h) => (
                <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{r.date}</td>
                <td className="px-5 py-3 text-sm font-medium text-slate-800">{r.action}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{r.actor}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function RightRail() {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quick Actions</p>
          </div>
          <div className="p-3 space-y-1.5">
            <Button variant="soft" size="sm" className="w-full justify-start gap-2" asChild>
              <Link href="/app/compliance/certificates/new"><RefreshCw className="w-3.5 h-3.5" />Schedule Renewal</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <Link href="/app/tasks/new"><CheckSquare className="w-3.5 h-3.5" />Create Task</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={exportEvidence}>
              <Download className="w-3.5 h-3.5" />Export Evidence
            </Button>
            {row.property_id && (
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                <Link href={`/app/properties/${row.property_id}`}><Building2 className="w-3.5 h-3.5" />Open Property</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Certificate Info</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { label: "ID", value: id },
              { label: "Type", value: label },
              { label: "Reference", value: row.reference_number ?? "—" },
              { label: "Created", value: fmtDate(row.created_at) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center px-4 py-2.5 gap-2">
                <span className="text-xs text-slate-400">{r.label}</span>
                <span className="text-xs font-medium text-slate-700 truncate text-right max-w-[120px]">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {days != null && days < 60 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Risk Analysis</p>
            </div>
            <p className="text-sm font-semibold text-amber-800">Expiring in {days} days</p>
            <p className="text-xs text-amber-600 mt-1">Schedule renewal now to avoid a compliance gap.</p>
          </div>
        )}

        <div className="bg-[#F5F3FF] rounded-xl border border-[#DDD6FE] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            <p className="text-xs font-bold text-[#7C3AED] uppercase tracking-wide">AI Insight</p>
          </div>
          <p className="text-xs text-[#5b21b6] leading-relaxed">
            Renewals typically take 3–7 days to arrange with a certified engineer. Schedule early to avoid a compliance gap.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-0">
        <div className="p-10 text-center text-sm text-slate-400">Loading certificate…</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="space-y-0">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Certificate not found</h2>
          <p className="text-sm text-slate-500 mb-5">This compliance record may have been removed.</p>
          <Button variant="primary" size="sm" asChild>
            <Link href="/app/compliance/certificates">Back to Certificates</Link>
          </Button>
        </div>
      </div>
    )
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
          <span className="text-slate-700 font-medium">{label} — {row.property_name ?? "Certificate"}</span>
        </nav>
      </div>

      {/* Hero Card */}
      <div className="mx-6 mt-5 mb-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex">
            <div className="w-1.5 bg-amber-400 shrink-0" />
            <div className="flex-1 p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                  <div style={{ color: "#f97316" }}><Flame className="w-7 h-7" /></div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" size="sm">{label}</Badge>
                    {statusBadge(row.status)}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {row.property_name ?? "Unlinked property"}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Expires</span>
                      <span className="font-semibold text-slate-800">{fmtDate(row.expiry_date)}</span>
                    </div>
                    {days != null && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          {days} days remaining
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Hero Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button variant="primary" size="sm" asChild>
                  <Link href={`/app/compliance/certificates/${id}/edit`}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={exportEvidence}>
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
                <ActionMenu
                  items={[
                    { label: "Mark Valid", icon: CheckCircle2, onClick: () => setStatus("valid"), disabled: isSeed },
                    { label: "Mark Expiring Soon", icon: Clock, onClick: () => setStatus("expiring_soon"), disabled: isSeed },
                    { label: "Mark Expired", icon: AlertTriangle, onClick: () => setStatus("expired"), disabled: isSeed },
                    { label: "Schedule Renewal", icon: RefreshCw, onClick: () => router.push("/app/compliance/certificates/new") },
                    { label: "Export Evidence", icon: Download, onClick: exportEvidence },
                  ]}
                />
                <ConfirmDialog
                  title="Archive certificate?"
                  description="This certificate will be removed from active lists."
                  confirmLabel="Archive"
                  onConfirm={handleDelete}
                >
                  {(open) => (
                    <Button variant="outline" size="sm" className="text-red-600" onClick={open}>
                      <Archive className="w-3.5 h-3.5" />
                      Archive
                    </Button>
                  )}
                </ConfirmDialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Context Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mx-4 sm:mx-6 mt-4">
        {[
          { label: "Issue Date", value: fmtDate(row.issue_date), colour: "text-slate-800", bg: "bg-white", icon: <Calendar className="w-4 h-4 text-slate-400" /> },
          { label: "Expiry Date", value: fmtDate(row.expiry_date), colour: "text-amber-700", bg: "bg-amber-50", icon: <Calendar className="w-4 h-4 text-amber-500" /> },
          { label: "Risk Level", value: row.risk_level ?? "—", colour: "text-amber-700", bg: "bg-amber-50", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
          { label: "Days Remaining", value: days != null ? `${days} days` : "—", colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", icon: <Clock className="w-4 h-4 text-[#2563EB]" /> },
          { label: "Reference", value: row.reference_number ?? "—", colour: "text-emerald-700", bg: "bg-emerald-50", icon: <Paperclip className="w-4 h-4 text-emerald-500" /> },
        ].map((k) => (
          <div key={k.label} className={cn("rounded-xl border border-slate-200 p-3.5 flex items-start gap-3", k.bg)}>
            <div className="mt-0.5 shrink-0">{k.icon}</div>
            <div className="min-w-0">
              <p className={cn("text-sm font-bold truncate", k.colour)}>{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: Tabs + Right Rail */}
      <div className="flex flex-col lg:flex-row gap-5 mx-4 sm:mx-6 mt-5 pb-10 items-start">
        <div className="flex-1 min-w-0 w-full">
          <Tabs defaultValue="overview">
            <TabsList variant="underline" className="w-full">
              {DETAIL_TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="flex items-center gap-1.5">
                  {t.icon}
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="document"><DocumentTab /></TabsContent>
            <TabsContent value="linked"><LinkedRecordsTab /></TabsContent>
            <TabsContent value="renewal"><RenewalTab /></TabsContent>
            <TabsContent value="tasks"><WorkTasksTab /></TabsContent>
            <TabsContent value="costs"><CostsTab /></TabsContent>
            <TabsContent value="activity"><ActivityTab /></TabsContent>
            <TabsContent value="audit"><AuditTab /></TabsContent>
          </Tabs>
        </div>

        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6">
          <RightRail />
        </aside>
      </div>
    </div>
  )
}
