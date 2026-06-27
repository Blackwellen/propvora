"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  Download,
  Folder,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  FileText,
  ImageIcon,
  RefreshCw,
  X,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { ComplianceKpiCard } from "@/components/compliance"
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { EvidenceUpload, type EvidenceDoc } from "@/components/work/EvidenceUpload"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useComplianceEvidence, type ComplianceEvidence } from "@/hooks/useComplianceData"
import { fmtDate, humaniseType, downloadCsv, useComplianceItems } from "../_lib/useComplianceItems"

const VERIFY_FILTERS = ["", "verified", "pending", "rejected"]

function FileThumb({ mime }: { mime: string | null }) {
  const isImage = (mime ?? "").startsWith("image/")
  return (
    <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${isImage ? "bg-slate-100 border border-slate-200" : "bg-red-50 border border-red-100"}`}>
      {isImage ? <ImageIcon className="w-5 h-5 text-slate-400" /> : <FileText className="w-5 h-5 text-red-500" />}
    </div>
  )
}

function humanSize(bytes: number | null) {
  if (bytes == null) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

export default function EvidencePage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { workspace } = useWorkspace()
  const [search, setSearch] = useState("")
  const [verifyFilter, setVerifyFilter] = useState("")
  const [showUpload, setShowUpload] = useState(false)
  const [linkItemId, setLinkItemId] = useState("")

  const { data: evidence = [], isLoading, refetch } = useComplianceEvidence()
  const { items: complianceItems } = useComplianceItems()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return evidence.filter((e) => {
      if (verifyFilter && e.verification_status !== verifyFilter) return false
      if (q) {
        const hay = `${e.evidence_name} ${humaniseType(e.evidence_type)} ${e.related_record_label ?? ""} ${e.source ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [evidence, search, verifyFilter])

  const kpis = useMemo(() => {
    const total = evidence.length
    const verified = evidence.filter((e) => e.verification_status === "verified").length
    const pending = evidence.filter((e) => e.verification_status === "pending").length
    const rejected = evidence.filter((e) => e.verification_status === "rejected").length
    return { total, verified, pending, rejected }
  }, [evidence])

  function exportCsv() {
    downloadCsv(
      "compliance-evidence.csv",
      ["Name", "Type", "Source", "Uploaded", "Related Record", "Verification", "Notes"],
      filtered.map((e) => [
        e.evidence_name,
        humaniseType(e.evidence_type),
        e.source ?? "",
        e.created_at ?? "",
        e.related_record_label ?? "",
        e.verification_status,
        e.notes ?? "",
      ])
    )
  }

  // Persist evidence metadata with the REAL compliance_evidence columns.
  // The live table requires a compliance_item_id, so evidence must be linked
  // to a tracked compliance item.
  async function handleUploaded(doc: EvidenceDoc) {
    if (!workspace?.id || !linkItemId) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const kind = doc.type.startsWith("image/") ? "photo" : "report"
      const note = doc.url ? `File: ${doc.url}` : null
      const { error } = await supabase.from("compliance_evidence").insert({
        workspace_id: workspace.id,
        compliance_item_id: linkItemId,
        kind,
        label: doc.name,
        notes: note,
        created_by: user?.id ?? null,
      })
      if (error) console.error("[evidence] insert error", error.message)
    } catch (e) {
      console.error("[evidence] upload persist error", e)
    } finally {
      qc.invalidateQueries({ queryKey: ["compliance-evidence"] })
    }
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evidence</h1>
          <p className="text-sm text-slate-500 mt-0.5">Photos, certificates and supporting files for compliance records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowUpload((v) => !v)} className="flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Upload className="w-4 h-4" />
            Upload evidence
          </button>
          <button onClick={exportCsv} disabled={filtered.length === 0} className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
            <Download className="w-4 h-4" />
            Export
          </button>
          <ActionMenu
            items={[
              { label: "Refresh", icon: RefreshCw, onClick: () => refetch() },
              { label: "Open Documents", icon: FileText, onClick: () => router.push("/property-manager/compliance/documents") },
            ]}
          />
        </div>
      </div>

      <DashboardContainer>
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 py-4">
          <ComplianceKpiCard label="Total Evidence" value={isLoading ? "—" : kpis.total} subtitle="Files on record" icon={Folder} iconBg="bg-[var(--color-brand-100)]" iconColor="text-[var(--brand)]" />
          <ComplianceKpiCard label="Verified" value={isLoading ? "—" : kpis.verified} subtitle={kpis.total ? `${Math.round((kpis.verified / kpis.total) * 100)}% of total` : "—"} icon={CheckCircle} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <ComplianceKpiCard label="Pending Review" value={isLoading ? "—" : kpis.pending} subtitle="Awaiting verification" icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <ComplianceKpiCard label="Rejected" value={isLoading ? "—" : kpis.rejected} subtitle="Needs re-upload" icon={XCircle} iconBg="bg-red-100" iconColor="text-red-600" />
        </div>

        {/* Upload panel */}
        {showUpload && (
          <div className="px-6 pb-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Upload evidence</h3>
                <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Link to compliance item <span className="text-red-500">*</span></label>
                <select
                  value={linkItemId}
                  onChange={(e) => setLinkItemId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)] max-h-60 overflow-y-auto"
                >
                  <option value="">{complianceItems.length ? "Select a compliance item…" : "No compliance items yet"}</option>
                  {complianceItems.map((it) => (
                    <option key={it.id} value={it.id}>{it.title || it.typeLabel}</option>
                  ))}
                </select>
              </div>
              {workspace?.id ? (
                linkItemId ? (
                  <EvidenceUpload
                    workspaceId={workspace.id}
                    folder="compliance-evidence"
                    onUploaded={handleUploaded}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  />
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">Select a compliance item above to attach evidence.</p>
                )
              ) : (
                <p className="text-sm text-slate-400 py-6 text-center">Loading workspace…</p>
              )}
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="px-6 py-3 flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search evidence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)] w-56"
            />
          </div>
          <select aria-label="Filter by verification status" value={verifyFilter} onChange={(e) => setVerifyFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]">
            {VERIFY_FILTERS.map((s) => (
              <option key={s} value={s}>{s ? humaniseType(s) : "All status"}</option>
            ))}
          </select>
          {(search || verifyFilter) && (
            <button onClick={() => { setSearch(""); setVerifyFilter("") }} className="text-xs text-slate-400 hover:text-slate-600 px-1">Clear</button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {evidence.length}</span>
        </div>

        {/* Table */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="px-4 py-16 text-center text-sm text-slate-400">Loading evidence…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <Folder className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">{evidence.length === 0 ? "No evidence uploaded yet" : "No evidence matches your filters"}</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">{evidence.length === 0 ? "Upload photos and certificates to support your compliance records." : "Try adjusting your search or filters."}</p>
                {evidence.length === 0 && (
                  <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--brand-strong)]">
                    <Upload className="w-3.5 h-3.5" /> Upload evidence
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {["Name", "Type", "Source", "Uploaded", "Related Record", "Verification", "Actions"].map((h) => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((row: ComplianceEvidence) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileThumb mime={row.file_mime_type} />
                            <div>
                              <p className="text-sm font-medium text-slate-800">{row.evidence_name}</p>
                              <p className="text-xs text-slate-400">{humanSize(row.file_size_bytes)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{humaniseType(row.evidence_type)}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.source ? humaniseType(row.source) : "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{fmtDate(row.created_at)}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-700">{row.related_record_label ?? "—"}</p>
                          {row.related_record_type && <p className="text-[11px] text-slate-400">{humaniseType(row.related_record_type)}</p>}
                        </td>
                        <td className="px-4 py-3"><ComplianceStatusBadge status={row.verification_status} /></td>
                        <td className="px-4 py-3 text-center">
                          <ActionMenu
                            items={[
                              { label: "Open File", icon: Download, onClick: () => row.file_url && window.open(row.file_url, "_blank"), disabled: !row.file_url },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardContainer>
    </>
  )
}
