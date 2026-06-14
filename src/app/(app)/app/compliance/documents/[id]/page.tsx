"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import {
  FileText, Home, CheckCircle, Download, Eye, RefreshCw, Archive,
  ClipboardList, Calendar, User, Shield, Clock, ChevronRight, Sparkles,
  RotateCcw, Trash2,
} from "lucide-react"

const DOC_TYPE_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety Certificate",
  eicr: "EICR Certificate",
  epc: "EPC Certificate",
  insurance: "Insurance Document",
  contract: "Contract",
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
]

const TYPE_OPTIONS = [
  { value: "gas_safety", label: "Gas Safety Certificate" },
  { value: "eicr", label: "EICR Certificate" },
  { value: "epc", label: "EPC Certificate" },
  { value: "insurance", label: "Insurance Document" },
  { value: "contract", label: "Contract" },
]

type Tab = "overview" | "preview" | "links" | "renewal" | "activity" | "audit"

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "preview", label: "Preview" },
  { key: "links", label: "Links" },
  { key: "renewal", label: "Renewal" },
  { key: "activity", label: "Activity" },
  { key: "audit", label: "Audit" },
]

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  const p = new Date(d)
  return isNaN(p.getTime()) ? d : p.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function DocumentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const { data: doc, isLoading } = useQuery({
    queryKey: ["compliance-document-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, properties(name:nickname)")
        .eq("id", id)
        .single()
      if (error) {
        if (error.code === "42P01" || error.code === "PGRST116") return null
        throw new Error(error.message)
      }
      const r = data as any
      const meta = r.metadata ?? {}
      return {
        id: r.id,
        property_id: r.property_id,
        document_name: r.name,
        document_type: r.type ?? "other",
        verification_status: meta.verification_status ?? (r.status === "active" ? "pending" : r.status),
        issue_date: meta.issue_date ?? null,
        expiry_date: r.expires_at,
        issuer: meta.issuer ?? null,
        category: r.category,
        version: meta.version ?? "v1",
        file_url: r.url,
        linked_certificate_id: meta.linked_certificate_id ?? null,
        linked_inspection_id: meta.linked_inspection_id ?? null,
        property_name: r.properties?.name ?? undefined,
        created_at: r.created_at,
      }
    },
  })

  const row: any = doc ?? {}
  const notFound = !isLoading && !doc
  const isSeed = false // live data only
  const label = row.document_name || DOC_TYPE_LABELS[row.document_type] || "Document"

  // Map view-model field keys back to documents columns (some live in metadata).
  async function saveField(patch: Record<string, any>) {
    const out: Record<string, any> = { updated_at: new Date().toISOString() }
    const metaPatch: Record<string, any> = {}
    if ("document_name" in patch) out.name = patch.document_name
    if ("document_type" in patch) out.type = patch.document_type
    if ("category" in patch) out.category = patch.category
    if ("expiry_date" in patch) out.expires_at = patch.expiry_date
    if ("issuer" in patch) metaPatch.issuer = patch.issuer
    if ("issue_date" in patch) metaPatch.issue_date = patch.issue_date
    if ("verification_status" in patch) metaPatch.verification_status = patch.verification_status
    if (Object.keys(metaPatch).length) {
      out.metadata = {
        issuer: row.issuer,
        issue_date: row.issue_date,
        verification_status: row.verification_status,
        version: row.version,
        linked_certificate_id: row.linked_certificate_id,
        linked_inspection_id: row.linked_inspection_id,
        ...metaPatch,
      }
    }
    const { error } = await supabase
      .from("documents")
      .update(out)
      .eq("id", id)
    if (error && error.code !== "42P01") throw new Error(error.message)
    qc.invalidateQueries({ queryKey: ["compliance-document-detail", id] })
    qc.invalidateQueries({ queryKey: ["compliance-documents"] })
  }

  async function setStatus(verification_status: string) {
    await saveField({ verification_status })
  }

  async function handleArchive() {
    const { error } = await supabase
      .from("documents")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
    if (error && error.code !== "42P01") throw new Error(error.message)
    qc.invalidateQueries({ queryKey: ["compliance-documents"] })
    router.push("/app/compliance/documents")
  }

  function downloadDoc() {
    if (row.file_url) {
      window.open(row.file_url, "_blank")
      return
    }
    const blob = new Blob([JSON.stringify(row, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `document-${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const verified = row.verification_status === "verified"

  function RightRail() {
    return (
      <aside className="w-full lg:w-72 shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Document Info</h3>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center gap-2">
              <dt className="text-slate-500 shrink-0">Issuer</dt>
              <dd className="font-medium text-slate-800 text-right">
                <InlineEditField value={row.issuer} placeholder="Add issuer" disabled={isSeed} onSave={(v) => saveField({ issuer: v })} />
              </dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-slate-500 shrink-0">Category</dt>
              <dd className="font-medium text-slate-800 text-right">
                <InlineEditField value={row.category} placeholder="Add category" disabled={isSeed} onSave={(v) => saveField({ category: v })} />
              </dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-slate-500 shrink-0">Version</dt>
              <dd className="font-medium text-slate-800">{row.version ?? "v1"}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Quick Actions</h3>
          <button onClick={() => setActiveTab("preview")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
            <Eye className="w-4 h-4 text-slate-400" />Preview Document
          </button>
          <button onClick={downloadDoc} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
            <Download className="w-4 h-4 text-slate-400" />Download
          </button>
          <button onClick={() => setStatus(verified ? "pending" : "verified")} disabled={isSeed} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left disabled:opacity-40">
            {verified ? <RotateCcw className="w-4 h-4 text-slate-400" /> : <CheckCircle className="w-4 h-4 text-slate-400" />}
            {verified ? "Unverify" : "Mark Verified"}
          </button>
          <Link href="/app/tasks/new" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
            <Calendar className="w-4 h-4 text-slate-400" />Create Renewal Task
          </Link>
        </div>

        {row.linked_certificate_id && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Linked Certificate</h3>
            <Link href={`/app/compliance/certificates/${row.linked_certificate_id}`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
              Open Certificate <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        <div className="bg-violet-50 rounded-xl border border-violet-200 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div style={{ color: "#7c3aed" }}><Sparkles className="w-4 h-4" /></div>
            <h3 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">AI Insight</h3>
          </div>
          <p className="text-xs text-violet-700">
            Keep this document verified and schedule a renewal reminder before expiry to maintain compliance continuity.
          </p>
        </div>
      </aside>
    )
  }

  function OverviewTab() {
    const rows: { label: string; icon: any; node: React.ReactNode }[] = [
      { label: "Document Name", icon: FileText, node: <InlineEditField value={row.document_name} placeholder="Add name" disabled={isSeed} onSave={(v) => saveField({ document_name: v })} /> },
      { label: "Document Type", icon: Shield, node: <InlineEditField value={row.document_type} type="select" options={TYPE_OPTIONS} disabled={isSeed} onSave={(v) => saveField({ document_type: v })} /> },
      { label: "Issuer", icon: User, node: <InlineEditField value={row.issuer} placeholder="Add issuer" disabled={isSeed} onSave={(v) => saveField({ issuer: v })} /> },
      { label: "Category", icon: ClipboardList, node: <InlineEditField value={row.category} placeholder="Add category" disabled={isSeed} onSave={(v) => saveField({ category: v })} /> },
      { label: "Linked Property", icon: Home, node: <span className="font-medium text-slate-800">{row.property_name ?? "—"}</span> },
      { label: "Issue Date", icon: Calendar, node: <InlineEditField value={row.issue_date} type="date" disabled={isSeed} onSave={(v) => saveField({ issue_date: v })} /> },
      { label: "Expiry Date", icon: Calendar, node: <InlineEditField value={row.expiry_date} type="date" disabled={isSeed} onSave={(v) => saveField({ expiry_date: v })} /> },
      { label: "Status", icon: CheckCircle, node: <InlineEditField value={row.verification_status} type="select" options={STATUS_OPTIONS} disabled={isSeed} onSave={(v) => saveField({ verification_status: v })} /> },
    ]
    return (
      <div className="space-y-4">
        {isSeed && (
          <div className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            Showing example data — connect the compliance database to enable inline editing.
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">Document Metadata</h3>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {rows.map((r) => {
                const Icon = r.icon
                return (
                  <tr key={r.label} className="hover:bg-slate-50">
                    <td className="px-5 py-3 w-44">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        {r.label}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{r.node}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function PreviewTab() {
    return (
      <div className="space-y-4">
        <div className="bg-slate-100 rounded-xl border border-slate-200 h-[480px] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">PDF Preview</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadDoc} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />Download
          </button>
        </div>
      </div>
    )
  }

  function LinksTab() {
    const items = [
      row.property_id && { title: "Property", subtitle: row.property_name, icon: Home, color: "text-blue-600", bg: "bg-blue-50", href: `/app/properties/${row.property_id}`, link: "Open Property" },
      row.linked_certificate_id && { title: "Certificate Record", subtitle: "Linked certificate", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50", href: `/app/compliance/certificates/${row.linked_certificate_id}`, link: "Open Certificate" },
      row.linked_inspection_id && { title: "Inspection", subtitle: "Linked inspection", icon: ClipboardList, color: "text-violet-600", bg: "bg-violet-50", href: `/app/compliance/inspections/${row.linked_inspection_id}`, link: "Open Inspection" },
    ].filter(Boolean) as any[]

    if (!items.length) {
      return <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">No linked records.</div>
    }
    return (
      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.bg}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{item.title}</p>
                <p className="text-sm font-semibold text-slate-800">{item.subtitle}</p>
                <Link href={item.href} className="mt-2 text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                  {item.link} <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function RenewalTab() {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Renewal Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Document Type</p>
              <p className="font-medium text-slate-800">{label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Current Expiry</p>
              <p className="font-medium text-slate-800">{fmtDate(row.expiry_date)}</p>
            </div>
          </div>
        </div>
        <Link href="/app/tasks/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          <Calendar className="w-4 h-4" />Schedule Renewal Task
        </Link>
      </div>
    )
  }

  function ActivityTab() {
    const items = [
      { action: verified ? "Document verified" : "Document pending verification", by: "You", date: fmtDate(row.created_at), icon: verified ? CheckCircle : Clock, color: verified ? "text-emerald-500" : "text-amber-500" },
      { action: "Document uploaded", by: "You", date: fmtDate(row.created_at), icon: FileText, color: "text-blue-500" },
    ]
    return (
      <div className="space-y-0">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {i < items.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
              </div>
              <div className="pb-5 min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.action}</p>
                <p className="text-xs text-slate-400">{item.by} · {item.date}</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function AuditTab() {
    const rows = [
      { event: "document_uploaded", detail: `${label} uploaded`, actor: "You", date: fmtDate(row.created_at) },
      { event: "status_set", detail: `Status: ${row.verification_status}`, actor: "You", date: fmtDate(row.created_at) },
    ]
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Event", "Detail", "Actor", "Date"].map((h) => (
                <th key={h} className="px-5 py-3 text-left font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-mono">{r.event}</span></td>
                <td className="px-5 py-3 text-slate-600">{r.detail}</td>
                <td className="px-5 py-3 text-slate-600">{r.actor}</td>
                <td className="px-5 py-3 text-slate-400">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-0">
        <div className="p-10 text-center text-sm text-slate-400">Loading document…</div>
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
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Document not found</h2>
          <p className="text-sm text-slate-500 mb-5">This document may have been archived or removed.</p>
          <Link href="/app/compliance/documents" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="p-6 space-y-6">
        {/* Hero */}
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{label}</h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <Home className="w-3.5 h-3.5" />
                      <span>{row.property_name ?? "Unlinked"}</span>
                      <span>·</span>
                      <span>Expires {fmtDate(row.expiry_date)}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium shrink-0 ${verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    <CheckCircle className="w-4 h-4" />
                    {verified ? "Verified" : (row.verification_status ?? "Pending")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button onClick={() => setActiveTab("preview")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                <Eye className="w-3.5 h-3.5" />Preview
              </button>
              <button onClick={downloadDoc} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Download className="w-3.5 h-3.5" />Download
              </button>
              <button onClick={() => setStatus(verified ? "pending" : "verified")} disabled={isSeed} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40">
                {verified ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {verified ? "Unverify" : "Mark Verified"}
              </button>
              <ActionMenu
                items={[
                  { label: "Mark Verified", icon: CheckCircle, onClick: () => setStatus("verified"), disabled: isSeed },
                  { label: "Mark Pending", icon: Clock, onClick: () => setStatus("pending"), disabled: isSeed },
                  { label: "Mark Rejected", icon: RotateCcw, onClick: () => setStatus("rejected"), disabled: isSeed },
                  { label: "Download", icon: Download, onClick: downloadDoc },
                  { label: "Create Renewal Task", icon: Calendar, onClick: () => router.push("/app/tasks/new") },
                ]}
              />
              <ConfirmDialog
                title="Archive document?"
                description="This document will be removed from active lists."
                confirmLabel="Archive"
                onConfirm={handleArchive}
              >
                {(open) => (
                  <button onClick={open} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <Archive className="w-3.5 h-3.5" />Archive
                  </button>
                )}
              </ConfirmDialog>
            </div>
          </div>
        </div>

        {/* Tabs + Right Rail */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 w-full space-y-4">
            <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div>
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "preview" && <PreviewTab />}
              {activeTab === "links" && <LinksTab />}
              {activeTab === "renewal" && <RenewalTab />}
              {activeTab === "activity" && <ActivityTab />}
              {activeTab === "audit" && <AuditTab />}
            </div>
          </div>
          <RightRail />
        </div>
      </div>
    </div>
  )
}
