"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  FileText,
  CheckCircle,
  Clock,
  CalendarDays,
  Upload,
  Download,
  Search,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react"
import { ComplianceKpiCard } from "@/components/compliance/ComplianceKpiCard"
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { createClient } from "@/lib/supabase/client"
import { useComplianceDocuments } from "@/hooks/useComplianceData"
import { fmtDate, daysUntil, humaniseType, downloadCsv } from "../_lib/useComplianceItems"

const VERIFY_FILTERS = ["", "verified", "pending", "pending_review", "rejected"]

export default function ComplianceDocumentsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [verifyFilter, setVerifyFilter] = useState("")

  const { data: docs = [], isLoading, refetch } = useComplianceDocuments()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      if (verifyFilter && d.verification_status !== verifyFilter) return false
      if (q) {
        const hay = `${d.document_name} ${humaniseType(d.document_type)} ${d.property_name ?? ""} ${d.issuer ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [docs, search, verifyFilter])

  const kpis = useMemo(() => {
    const total = docs.length
    const verified = docs.filter((d) => d.verification_status === "verified").length
    const pending = docs.filter((d) => d.verification_status === "pending" || d.verification_status === "pending_review").length
    const expiring = docs.filter((d) => {
      const days = daysUntil(d.expiry_date)
      return days != null && days >= 0 && days <= 30
    }).length
    return { total, verified, pending, expiring }
  }, [docs])

  function exportCsv() {
    downloadCsv(
      "compliance-documents.csv",
      ["Document", "Type", "Property", "Issuer", "Issue Date", "Expiry Date", "Verification", "Version"],
      filtered.map((d) => [
        d.document_name,
        humaniseType(d.document_type),
        d.property_name ?? "",
        d.issuer ?? "",
        d.issue_date ?? "",
        d.expiry_date ?? "",
        d.verification_status,
        d.version,
      ])
    )
  }

  async function archiveDoc(id: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("compliance_documents")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)
      if (error && error.code !== "42P01") throw new Error(error.message)
    } finally {
      qc.invalidateQueries({ queryKey: ["compliance-documents"] })
    }
  }

  return (
    <DashboardContainer>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">Store and verify compliance documents across your portfolio.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/app/compliance/documents/new")} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Upload className="w-4 h-4" />
            Upload document
          </button>
          <button onClick={exportCsv} disabled={filtered.length === 0} className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
            <Download className="w-4 h-4" />
            Export
          </button>
          <ActionMenu
            items={[
              { label: "Refresh", icon: RefreshCw, onClick: () => refetch() },
              { label: "Open Evidence", icon: CheckCircle, onClick: () => router.push("/app/compliance/evidence") },
              { label: "Open Certificates", icon: CheckCircle, onClick: () => router.push("/app/compliance/certificates") },
            ]}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <ComplianceKpiCard label="Total Documents" value={isLoading ? "—" : kpis.total} subtitle="On record" icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <ComplianceKpiCard label="Verified" value={isLoading ? "—" : kpis.verified} subtitle={kpis.total ? `${Math.round((kpis.verified / kpis.total) * 100)}% of total` : "—"} icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <ComplianceKpiCard label="Pending Review" value={isLoading ? "—" : kpis.pending} subtitle="Awaiting verification" icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <ComplianceKpiCard label="Expiring Soon" value={isLoading ? "—" : kpis.expiring} subtitle="Within 30 days" icon={CalendarDays} iconBg="bg-orange-50" iconColor="text-orange-600" />
      </div>

      {/* Filter bar */}
      <div className="px-6 py-3 flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-56"
          />
        </div>
        <select value={verifyFilter} onChange={(e) => setVerifyFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none">
          {VERIFY_FILTERS.map((s) => (
            <option key={s} value={s}>{s ? humaniseType(s) : "All verification"}</option>
          ))}
        </select>
        {(search || verifyFilter) && (
          <button onClick={() => { setSearch(""); setVerifyFilter("") }} className="text-xs text-slate-400 hover:text-slate-600 px-1">Clear</button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {docs.length}</span>
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-16 text-center text-sm text-slate-400">Loading documents…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">{docs.length === 0 ? "No documents yet" : "No documents match your filters"}</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">{docs.length === 0 ? "Upload your first compliance document." : "Try adjusting your search or filters."}</p>
              {docs.length === 0 && (
                <button onClick={() => router.push("/app/compliance/documents/new")} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  <Plus className="w-3.5 h-3.5" /> Upload document
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Document Name", "Property", "Type", "Issue Date", "Expiry Date", "Verification", "Version", "Actions"].map((h) => (
                      <th key={h} className={`px-3 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((doc) => {
                    const days = daysUntil(doc.expiry_date)
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => router.push(`/app/compliance/documents/${doc.id}`)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-red-500" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 leading-tight">{doc.document_name}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{doc.property_name ?? "—"}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{humaniseType(doc.document_type)}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{fmtDate(doc.issue_date)}</td>
                        <td className="px-3 py-3">
                          {doc.expiry_date ? (
                            <div>
                              <p className="text-slate-700">{fmtDate(doc.expiry_date)}</p>
                              {days != null && (
                                <p className={`text-xs font-medium ${days < 0 ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-emerald-600"}`}>
                                  {days < 0 ? "Expired" : `in ${days} days`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3"><ComplianceStatusBadge status={doc.verification_status} /></td>
                        <td className="px-3 py-3 text-xs text-slate-500 font-mono">{doc.version}</td>
                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            <ActionMenu
                              items={[
                                { label: "View", icon: Eye, onClick: () => router.push(`/app/compliance/documents/${doc.id}`) },
                                { label: "Open File", icon: Download, onClick: () => doc.file_url && window.open(doc.file_url, "_blank"), disabled: !doc.file_url },
                              ]}
                            />
                            <ConfirmDialog
                              title="Archive document?"
                              description="This document will be removed from active lists."
                              confirmLabel="Archive"
                              onConfirm={() => archiveDoc(doc.id)}
                            >
                              {(open) => (
                                <button onClick={open} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Archive">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </ConfirmDialog>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardContainer>
  )
}
