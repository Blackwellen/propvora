"use client"
import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileCheck2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileX,
  Upload,
  Plus,
  Download,
  Search,
  Eye,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { ComplianceKpiCard } from "@/components/compliance/ComplianceKpiCard"
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge"
import { ComplianceRiskBadge } from "@/components/compliance/ComplianceRiskBadge"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import {
  MobilePageHeader,
  MobileFilterSheet,
  ResponsiveTable,
  type FilterGroup,
} from "@/components/mobile"
import {
  useComplianceCertificates,
  useDeleteCertificate,
  useUpdateCertificate,
  type ComplianceCertificate,
} from "@/hooks/useComplianceData"
import { InlineEditCell, InlineEditDate } from "@/components/editing"
import { fmtDate, daysUntil, humaniseType, downloadCsv } from "../_lib/useComplianceItems"

const CERT_STATUS_OPTIONS = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "missing", label: "Missing" },
]

const STATUS_FILTERS = ["", "valid", "expiring_soon", "expired", "missing", "pending_review"]
const RISK_FILTERS = ["", "low", "medium", "high", "critical"]

function expiryLabel(d: string | null) {
  const days = daysUntil(d)
  if (days == null) return { text: "—", cls: "text-slate-400" }
  if (days < 0) return { text: "Expired", cls: "text-red-600 font-semibold" }
  if (days <= 30) return { text: `${days} days`, cls: "text-red-600 font-semibold" }
  if (days <= 90) return { text: `${days} days`, cls: "text-amber-600 font-semibold" }
  return { text: `${days} days`, cls: "text-emerald-600" }
}

export default function CertificatesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [riskFilter, setRiskFilter] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: certs = [], isLoading, refetch } = useComplianceCertificates()
  const del = useDeleteCertificate()
  const update = useUpdateCertificate()

  const activeFilterCount = (statusFilter ? 1 : 0) + (riskFilter ? 1 : 0)

  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: STATUS_FILTERS.map((s) => ({ value: s, label: s ? humaniseType(s) : "All statuses" })),
    },
    {
      key: "risk",
      label: "Risk level",
      value: riskFilter,
      onChange: setRiskFilter,
      options: RISK_FILTERS.map((r) => ({ value: r, label: r ? humaniseType(r) : "All risk levels" })),
    },
  ]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return certs.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (riskFilter && c.risk_level !== riskFilter) return false
      if (q) {
        const hay = `${humaniseType(c.certificate_type)} ${c.reference_number ?? ""} ${c.property_name ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [certs, search, statusFilter, riskFilter])

  const kpis = useMemo(() => {
    const total = certs.length
    const valid = certs.filter((c) => c.status === "valid").length
    const expiring = certs.filter((c) => {
      const d = daysUntil(c.expiry_date)
      return c.status === "expiring_soon" || (d != null && d >= 0 && d <= 30)
    }).length
    const expired = certs.filter((c) => {
      const d = daysUntil(c.expiry_date)
      return c.status === "expired" || (d != null && d < 0)
    }).length
    const missing = certs.filter((c) => c.status === "missing").length
    return { total, valid, expiring, expired, missing }
  }, [certs])

  function exportCsv() {
    downloadCsv(
      "compliance-certificates.csv",
      ["Type", "Reference", "Property", "Issue Date", "Expiry Date", "Status", "Risk"],
      filtered.map((c) => [
        humaniseType(c.certificate_type),
        c.reference_number ?? "",
        c.property_name ?? "",
        c.issue_date ?? "",
        c.expiry_date ?? "",
        c.status,
        c.risk_level,
      ])
    )
  }

  async function handleDelete(c: ComplianceCertificate) {
    await del.mutateAsync(c.id)
  }

  return (
    <>
      {/* Header — desktop / tablet */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-4 sm:px-6 py-4 items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track all compliance certificates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/property-manager/compliance/certificates/new")}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add certificate
          </button>
          <button
            onClick={() => router.push("/property-manager/compliance/documents/new")}
            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <ActionMenu
            items={[
              { label: "Refresh", icon: RefreshCw, onClick: () => refetch() },
              { label: "Export CSV", icon: Download, onClick: exportCsv },
              { label: "Open Coverage", icon: CheckCircle, onClick: () => router.push("/property-manager/compliance/coverage") },
            ]}
          />
        </div>
      </div>

      {/* Mobile header: title + search + filters */}
      <div className="md:hidden px-4 pt-4">
        <MobilePageHeader
          title="Certificates"
          count={`${filtered.length} of ${certs.length}`}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search certificates…"
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 px-4 sm:px-6 py-4">
        <ComplianceKpiCard label="Total Certificates" value={isLoading ? "—" : kpis.total} subtitle="On record" icon={FileCheck2} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <ComplianceKpiCard label="Valid" value={isLoading ? "—" : kpis.valid} subtitle={kpis.total ? `${Math.round((kpis.valid / kpis.total) * 100)}% of total` : "—"} icon={CheckCircle} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <ComplianceKpiCard label="Expiring Soon" value={isLoading ? "—" : kpis.expiring} subtitle="Within 30 days" icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <ComplianceKpiCard label="Expired" value={isLoading ? "—" : kpis.expired} subtitle="Requires attention" icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-600" />
        <ComplianceKpiCard label="Missing" value={isLoading ? "—" : kpis.missing} subtitle="No certificate on file" icon={FileX} iconBg="bg-red-100" iconColor="text-red-600" />
      </div>

      {/* Filter bar — desktop / tablet */}
      <div className="hidden md:flex px-6 pb-3 items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search certificates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s ? humaniseType(s) : "All statuses"}</option>
          ))}
        </select>
        <select aria-label="Filter by risk level" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]">
          {RISK_FILTERS.map((r) => (
            <option key={r} value={r}>{r ? humaniseType(r) : "All risk levels"}</option>
          ))}
        </select>
        {(search || statusFilter || riskFilter) && (
          <button onClick={() => { setSearch(""); setStatusFilter(""); setRiskFilter("") }} className="text-xs text-slate-400 hover:text-slate-600 px-1">Clear</button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {certs.length}</span>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-16 text-center text-sm text-slate-400">Loading certificates…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">{certs.length === 0 ? "No certificates yet" : "No certificates match your filters"}</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">{certs.length === 0 ? "Add your first compliance certificate to get started." : "Try adjusting your search or filters."}</p>
              {certs.length === 0 && (
                <button onClick={() => router.push("/property-manager/compliance/certificates/new")} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  <Plus className="w-3.5 h-3.5" /> Add certificate
                </button>
              )}
            </div>
          ) : (
            <ResponsiveTable
              rows={filtered}
              mobile={{
                getKey: (c) => c.id,
                title: (c) => humaniseType(c.certificate_type),
                subtitle: (c) => c.property_name ?? c.reference_number ?? undefined,
                badge: (c) => <ComplianceStatusBadge status={c.status} />,
                onRowClick: (c) => router.push(`/property-manager/compliance/certificates/${c.id}`),
                fields: [
                  { label: "Expiry", render: (c) => { const e = expiryLabel(c.expiry_date); return <span className={e.cls}>{fmtDate(c.expiry_date)} · {e.text}</span> } },
                  { label: "Issued", render: (c) => fmtDate(c.issue_date) },
                  { label: "Risk", render: (c) => <ComplianceRiskBadge risk={c.risk_level} /> },
                  { label: "Reminder", render: (c) => c.reminder_enabled ? "On" : "Off" },
                ],
              }}
            >
            <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Certificate Type", "Property", "Issue Date", "Expiry Date", "Status", "Risk", "Reminder", "Actions"].map((h) => (
                    <th key={h} className={`px-3 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide ${h === "Actions" || h === "Reminder" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((cert) => {
                  const exp = expiryLabel(cert.expiry_date)
                  return (
                    <tr
                      key={cert.id}
                      onClick={() => router.push(`/property-manager/compliance/certificates/${cert.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-800 leading-tight">{humaniseType(cert.certificate_type)}</p>
                        {cert.reference_number && <span className="text-[11px] text-slate-400">{cert.reference_number}</span>}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-700 leading-tight truncate max-w-[180px]">{cert.property_name ?? "—"}</p>
                        {cert.property_address && <p className="text-slate-400 text-[11px] truncate max-w-[180px]">{cert.property_address}</p>}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{fmtDate(cert.issue_date)}</td>
                      <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <InlineEditDate
                          value={cert.expiry_date}
                          label="Expiry date"
                          silentToast
                          displayClassName="text-slate-600"
                          onSave={async (v) => { await update.mutateAsync({ id: cert.id, expiry_date: v || null }) }}
                        />
                        <p className={`text-[11px] mt-0.5 ${exp.cls}`}>{exp.text}</p>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <InlineEditCell
                          value={cert.status}
                          type="select"
                          label="Status"
                          options={CERT_STATUS_OPTIONS}
                          onSave={async (v) => { await update.mutateAsync({ id: cert.id, status: v }) }}
                        />
                      </td>
                      <td className="px-3 py-3"><ComplianceRiskBadge risk={cert.risk_level} /></td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${cert.reminder_enabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <span className="text-[11px] text-slate-500">{cert.reminder_enabled ? "On" : "Off"}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/property-manager/compliance/certificates/${cert.id}`)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          <ActionMenu
                            items={[
                              { label: "View", icon: Eye, onClick: () => router.push(`/property-manager/compliance/certificates/${cert.id}`) },
                              { label: "Edit", icon: Pencil, onClick: () => router.push(`/property-manager/compliance/certificates/${cert.id}/edit`) },
                              { label: "Renew", icon: RefreshCw, onClick: () => router.push("/property-manager/compliance/certificates/new") },
                              { label: "Upload Evidence", icon: Upload, onClick: () => router.push("/property-manager/compliance/documents/new") },
                            ]}
                          />
                          <ConfirmDialog
                            title="Archive certificate?"
                            description="This certificate will be removed from active lists."
                            confirmLabel="Archive"
                            onConfirm={() => handleDelete(cert)}
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
            </ResponsiveTable>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        groups={mobileFilterGroups}
        activeCount={activeFilterCount}
        onClear={() => { setStatusFilter(""); setRiskFilter("") }}
      />
    </>
  )
}
