"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LegalJurisdictionGate } from "@/components/legal/LegalJurisdictionGate"
import {
  Key,
  Clock,
  AlertTriangle,
  Building2,
  Plus,
  Download,
  Eye,
  ChevronRight,
  Search,
  Trash2,
  Calendar,
} from "lucide-react"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  useHmoLicences,
  useDeleteHmoLicence,
  formatDate,
  daysUntil,
  type HmoLicence,
} from "../legal-data"

const TYPE_LABEL: Record<string, string> = { mandatory: "Mandatory", additional: "Additional", selective: "Selective" }
const TYPE_COLOR: Record<string, string> = {
  mandatory: "bg-[var(--color-brand-100)] text-[var(--brand)]",
  additional: "bg-purple-100 text-purple-700",
  selective: "bg-emerald-100 text-emerald-700",
}
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700 border border-green-200" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700 border border-red-200" },
  pending: { label: "Pending", cls: "bg-[var(--color-brand-100)] text-[var(--brand)] border border-[var(--color-brand-100)]" },
  revoked: { label: "Revoked", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
}

function statusCfg(s: string) {
  return STATUS_CONFIG[s] ?? { label: s, cls: "bg-slate-100 text-slate-600 border border-slate-200" }
}
function effectiveStatus(lic: HmoLicence): string {
  const days = daysUntil(lic.expiry_date)
  if (days != null && days < 0) return "expired"
  return lic.status
}

function exportRenewalCsv(licences: HmoLicence[]) {
  const headers = ["Property", "Type", "Licence number", "Council", "Max occupants", "Issue date", "Expiry date", "Days remaining", "Status"]
  const rows = licences.map((l) => [
    l.property?.nickname ?? "—",
    TYPE_LABEL[l.licence_type] ?? l.licence_type,
    l.licence_number ?? "",
    l.issuing_council ?? "",
    l.max_occupants != null ? String(l.max_occupants) : "",
    formatDate(l.issue_date),
    formatDate(l.expiry_date),
    daysUntil(l.expiry_date)?.toString() ?? "",
    statusCfg(effectiveStatus(l)).label,
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `hmo-renewal-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function HmoLicencesPage() {
  return (
    <LegalJurisdictionGate module="hmo">
      <HmoLicencesPageInner />
    </LegalJurisdictionGate>
  )
}

function HmoLicencesPageInner() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { data: licences = [], isLoading } = useHmoLicences(workspaceId)
  const deleteLicence = useDeleteHmoLicence()

  const [search, setSearch] = useState("")

  // Deep-link: /legal/hmo-licences?new=1 opens the register-licence wizard (used
  // by the Copilot's "Register an HMO licence" action). Read from window to
  // avoid the useSearchParams Suspense prerender requirement.
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") {
      router.replace("/property-manager/legal/hmo-licences/new")
    }
  }, [router])

  const filtered = licences.filter((l) => {
    const hay = `${l.property?.nickname ?? ""} ${l.licence_number ?? ""} ${l.issuing_council ?? ""}`.toLowerCase()
    return hay.includes(search.toLowerCase())
  })

  const activeCount = licences.filter((l) => effectiveStatus(l) === "active").length
  const expiringCount = licences.filter((l) => {
    const d = daysUntil(l.expiry_date)
    return d != null && d >= 0 && d <= 90
  }).length
  const expiredCount = licences.filter((l) => effectiveStatus(l) === "expired" || l.status === "pending").length
  const expiringSoon = [...licences]
    .filter((l) => daysUntil(l.expiry_date) != null)
    .sort((a, b) => (daysUntil(a.expiry_date) ?? 0) - (daysUntil(b.expiry_date) ?? 0))
    .slice(0, 3)

  const KPIS = [
    { icon: Key, value: activeCount, label: "Active Licences", sub: "Currently valid", iconCls: "bg-green-100 text-green-600" },
    { icon: Clock, value: expiringCount, label: "Expiring in 90 Days", sub: "Renewal due soon", iconCls: "bg-orange-100 text-orange-600" },
    { icon: AlertTriangle, value: expiredCount, label: "Expired / Pending", sub: "Requires attention", iconCls: "bg-red-100 text-red-600" },
    { icon: Building2, value: licences.length, label: "Total Licences", sub: "Across portfolio", iconCls: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
  ]

  /* Row → card mapping for the mobile licence list (presentation only). */
  const licenceCardMapping: MobileCardMapping<HmoLicence> = {
    getKey: (l) => l.id,
    title: (l) => l.property?.nickname ?? "—",
    subtitle: (l) => l.licence_number ?? "—",
    badge: (l) => {
      const cfg = statusCfg(effectiveStatus(l))
      return <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>
    },
    fields: [
      {
        label: "Type",
        render: (l) => (
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${TYPE_COLOR[l.licence_type] ?? "bg-slate-100 text-slate-600"}`}>
            {TYPE_LABEL[l.licence_type] ?? l.licence_type}
          </span>
        ),
      },
      { label: "Council", render: (l) => l.issuing_council ?? "—" },
      { label: "Expiry", render: (l) => formatDate(l.expiry_date) },
      {
        label: "Days left",
        render: (l) => {
          const days = daysUntil(l.expiry_date)
          const daysColor = days == null ? "text-slate-400" : days < 0 ? "text-red-700 font-bold" : days <= 30 ? "text-red-700 font-bold" : days <= 90 ? "text-amber-600 font-medium" : "text-slate-600"
          return <span className={daysColor}>{days == null ? "—" : days < 0 ? `${Math.abs(days)}d ago` : `${days} days`}</span>
        },
      },
    ],
    onRowClick: (l) => router.push(`/property-manager/legal/hmo-licences/${l.id}`),
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
            <Key className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900">HMO Licences</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage mandatory, additional and selective HMO licences across your portfolio.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportRenewalCsv(licences)}
            disabled={licences.length === 0}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Renewal Report (CSV)
          </button>
          <button
            onClick={() => router.push("/property-manager/legal/hmo-licences/new")}
            className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Licence
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="px-4 sm:px-6 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(({ icon: Icon, value, label, sub, iconCls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-tight">{isLoading ? <span className="text-slate-300">…</span> : value}</p>
              <p className="text-[12px] font-medium text-slate-700 mt-0.5">{label}</p>
              <p className="text-[11px] text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="px-4 sm:px-6 pb-6 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search licences…"
                  className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                />
              </div>
              <span className="ml-auto text-[11px] text-slate-400">{licences.length} licence{licences.length === 1 ? "" : "s"}</span>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-[12px] text-slate-400">Loading licences…</div>
            ) : licences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-[14px] font-semibold text-slate-700 mb-1">No HMO licences yet</p>
                <p className="text-[12px] text-slate-500 max-w-xs mb-4">
                  Register a licence against a property to track expiry, conditions and renewal reminders.
                </p>
                <button
                  onClick={() => router.push("/property-manager/legal/hmo-licences/new")}
                  className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register First Licence
                </button>
              </div>
            ) : (
              <ResponsiveTable<HmoLicence> rows={filtered} mobile={licenceCardMapping} className="p-3">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Property", "Type", "Licence Number", "Council", "Max Occ.", "Expiry Date", "Days Left", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lic, i) => {
                      const days = daysUntil(lic.expiry_date)
                      const cfg = statusCfg(effectiveStatus(lic))
                      const daysColor = days == null ? "text-slate-400" : days < 0 ? "text-red-700 font-bold" : days <= 30 ? "text-red-700 font-bold" : days <= 90 ? "text-amber-600 font-medium" : "text-slate-600"
                      return (
                        <tr
                          key={lic.id}
                          onClick={() => router.push(`/property-manager/legal/hmo-licences/${lic.id}`)}
                          className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800 text-[12px] max-w-[160px]">
                            <span className="block truncate">{lic.property?.nickname ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${TYPE_COLOR[lic.licence_type] ?? "bg-slate-100 text-slate-600"}`}>
                              {TYPE_LABEL[lic.licence_type] ?? lic.licence_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                            {lic.licence_number || <span className="italic text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{lic.issuing_council ?? "—"}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-600 text-center">{lic.max_occupants ?? "—"}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(lic.expiry_date)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] ${daysColor}`}>
                              {days == null ? "—" : days < 0 ? `${Math.abs(days)}d ago` : `${days} days`}
                              {days != null && days <= 30 && days >= 0 && <span className="ml-1">⚠</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.cls}`}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/property-manager/legal/hmo-licences/${lic.id}`}
                                className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </Link>
                              <ConfirmDialog
                                title="Delete licence?"
                                description="This HMO licence record will be permanently removed."
                                confirmLabel="Delete"
                                onConfirm={async () => {
                                  if (workspaceId) await deleteLicence.mutateAsync({ id: lic.id, workspaceId })
                                }}
                              >
                                {(open) => (
                                  <ActionMenu
                                    items={[
                                      { label: "View", icon: Eye, onClick: () => router.push(`/property-manager/legal/hmo-licences/${lic.id}`) },
                                      { label: "Open Property", icon: Building2, onClick: () => router.push(lic.property_id ? `/property-manager/portfolio/properties/${lic.property_id}` : "/property-manager/portfolio/properties") },
                                      { label: "Delete Licence", icon: Trash2, variant: "danger", onClick: open },
                                    ]}
                                  />
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

        {/* Right Rail */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-800">Expiring Soon</h3>
            </div>
            <div className="p-4 space-y-3">
              {expiringSoon.length === 0 ? (
                <p className="text-[12px] text-slate-400">No licences to surface yet.</p>
              ) : (
                expiringSoon.map((l) => {
                  const days = daysUntil(l.expiry_date) ?? 0
                  return (
                    <Link key={l.id} href={`/property-manager/legal/hmo-licences/${l.id}`} className="flex items-start justify-between gap-2 hover:bg-slate-50 -mx-1 px-1 py-1 rounded-lg transition-colors">
                      <div>
                        <p className="text-[12px] font-medium text-slate-800">{l.property?.nickname ?? "—"}</p>
                        <p className="text-[11px] text-slate-500">{l.licence_number ?? "—"}</p>
                      </div>
                      <span className={`text-[11px] font-semibold whitespace-nowrap ${days < 0 ? "text-red-600" : days <= 30 ? "text-red-600" : days <= 90 ? "text-orange-600" : "text-slate-500"}`}>
                        {days < 0 ? `${Math.abs(days)}d ago` : `${days} days`}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Calendar surface */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">Renewal Calendar</h3>
            </div>
            <div className="p-4">
              <p className="text-[12px] text-slate-500 mb-2">Each licence expiry date is surfaced as a key date you can act on.</p>
              <Link href="/property-manager/calendar" className="text-[11px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-medium flex items-center gap-1 transition-colors">
                Open Calendar <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

