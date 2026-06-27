"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  Users,
  ShieldCheck,
  Clock,
  Lock,
  Search,
  Eye,
  Send,
  RefreshCw,
} from "lucide-react"
import { ComplianceKpiCard } from "@/components/compliance"
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import {
  MobilePageHeader,
  MobileFilterSheet,
  ResponsiveTable,
  type FilterGroup,
} from "@/components/mobile"
import { useComplianceSupplierDocs } from "@/hooks/useComplianceData"
import { fmtDate, daysUntil, humaniseType, downloadCsv } from "../_lib/useComplianceItems"

const STATUS_FILTERS = ["", "valid", "expiring_soon", "expired", "pending", "requested"]

export default function SupplierDocsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: docs = [], isLoading, refetch } = useComplianceSupplierDocs()

  const activeFilterCount = statusFilter ? 1 : 0
  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: STATUS_FILTERS.map((s) => ({ value: s, label: s ? humaniseType(s) : "All statuses" })),
    },
  ]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false
      if (q) {
        const hay = `${d.supplier_name ?? ""} ${humaniseType(d.document_type)} ${d.document_reference ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [docs, search, statusFilter])

  const kpis = useMemo(() => {
    const suppliers = new Set(docs.map((d) => d.supplier_id)).size
    const valid = docs.filter((d) => d.status === "valid").length
    const expiring = docs.filter((d) => {
      const days = daysUntil(d.expiry_date)
      return d.status === "expiring_soon" || (days != null && days >= 0 && days <= 60)
    }).length
    const blocked = docs.filter((d) => d.status === "expired").length
    return { suppliers, valid, expiring, blocked }
  }, [docs])

  function exportCsv() {
    downloadCsv(
      "supplier-documents.csv",
      ["Supplier", "Document Type", "Reference", "Status", "Issue Date", "Expiry Date"],
      filtered.map((d) => [
        d.supplier_name ?? "",
        humaniseType(d.document_type),
        d.document_reference ?? "",
        d.status,
        d.issue_date ?? "",
        d.expiry_date ?? "",
      ])
    )
  }

  return (
    <>
      {/* Header — desktop / tablet */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-4 sm:px-6 py-4 items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Documents</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track supplier insurance, accreditations and compliance documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/property-manager/contacts")} className="flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Send className="w-4 h-4" />
            Manage suppliers
          </button>
          <button onClick={exportCsv} disabled={filtered.length === 0} className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
            <Download className="w-4 h-4" />
            Export
          </button>
          <ActionMenu
            items={[
              { label: "Refresh", icon: RefreshCw, onClick: () => refetch() },
              { label: "Open Contacts", icon: Users, onClick: () => router.push("/property-manager/contacts") },
              { label: "Open Coverage", icon: ShieldCheck, onClick: () => router.push("/property-manager/compliance/coverage") },
            ]}
          />
        </div>
      </div>

      <DashboardContainer>
        {/* Mobile header */}
        <div className="md:hidden px-4 pt-4">
          <MobilePageHeader
            title="Supplier Documents"
            count={`${filtered.length} of ${docs.length}`}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search supplier documents…"
            onOpenFilters={() => setFiltersOpen(true)}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 py-4">
          <ComplianceKpiCard label="Suppliers" value={isLoading ? "—" : kpis.suppliers} subtitle="With documents" icon={Users} iconBg="bg-[var(--color-brand-100)]" iconColor="text-[var(--brand)]" />
          <ComplianceKpiCard label="Valid Documents" value={isLoading ? "—" : kpis.valid} subtitle="In date" icon={ShieldCheck} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <ComplianceKpiCard label="Expiring Soon" value={isLoading ? "—" : kpis.expiring} subtitle="Within 60 days" icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <ComplianceKpiCard label="Expired" value={isLoading ? "—" : kpis.blocked} subtitle="Action required" icon={Lock} iconBg="bg-red-100" iconColor="text-red-600" />
        </div>

        {/* Filter bar — desktop / tablet */}
        <div className="hidden md:flex px-6 py-3 items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search supplier documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)] w-64"
            />
          </div>
          <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]">
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s ? humaniseType(s) : "All statuses"}</option>
            ))}
          </select>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(""); setStatusFilter("") }} className="text-xs text-slate-400 hover:text-slate-600 px-1">Clear</button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {docs.length}</span>
        </div>

        {/* Table */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="px-4 py-16 text-center text-sm text-slate-400">Loading supplier documents…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">{docs.length === 0 ? "No supplier documents yet" : "No documents match your filters"}</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">{docs.length === 0 ? "Supplier insurance and accreditation documents will appear here." : "Try adjusting your search or filters."}</p>
                {docs.length === 0 && (
                  <button onClick={() => router.push("/property-manager/contacts")} className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--brand-strong)]">
                    <Users className="w-3.5 h-3.5" /> Manage suppliers
                  </button>
                )}
              </div>
            ) : (
              <ResponsiveTable
                rows={filtered}
                mobile={{
                  getKey: (r) => r.id,
                  title: (r) => r.supplier_name ?? "Unknown supplier",
                  subtitle: (r) => humaniseType(r.document_type),
                  badge: (r) => <ComplianceStatusBadge status={r.status} />,
                  fields: [
                    { label: "Reference", render: (r) => r.document_reference ?? "—" },
                    { label: "Issued", render: (r) => fmtDate(r.issue_date) },
                    { label: "Expiry", render: (r) => {
                        if (!r.expiry_date) return "—"
                        const days = daysUntil(r.expiry_date)
                        const suffix = days == null ? "" : days < 0 ? " · Expired" : ` · in ${days}d`
                        return `${fmtDate(r.expiry_date)}${suffix}`
                      } },
                  ],
                  actions: (r) => (
                    <ActionMenu
                      items={[
                        { label: "View Supplier", icon: Eye, onClick: () => router.push("/property-manager/contacts") },
                        { label: "Open Contacts", icon: Users, onClick: () => router.push("/property-manager/contacts") },
                      ]}
                    />
                  ),
                }}
              >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {["Supplier", "Document Type", "Reference", "Status", "Issue Date", "Expiry Date", "Actions"].map((h) => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((row) => {
                      const days = daysUntil(row.expiry_date)
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">{row.supplier_name ?? "Unknown supplier"}</p>
                            {row.supplier_service_type && <p className="text-xs text-slate-400">{row.supplier_service_type}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{humaniseType(row.document_type)}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 font-mono">{row.document_reference ?? "—"}</td>
                          <td className="px-4 py-3"><ComplianceStatusBadge status={row.status} /></td>
                          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{fmtDate(row.issue_date)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-xs text-slate-700">{fmtDate(row.expiry_date)}</p>
                            {days != null && (
                              <p className={`text-[11px] font-medium ${days < 0 ? "text-red-600" : days <= 60 ? "text-amber-600" : "text-emerald-600"}`}>
                                {days < 0 ? "Expired" : `in ${days} days`}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <ActionMenu
                              items={[
                                { label: "View Supplier", icon: Eye, onClick: () => router.push("/property-manager/contacts") },
                                { label: "Open Contacts", icon: Users, onClick: () => router.push("/property-manager/contacts") },
                              ]}
                            />
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
          onClear={() => setStatusFilter("")}
        />
      </DashboardContainer>
    </>
  )
}
