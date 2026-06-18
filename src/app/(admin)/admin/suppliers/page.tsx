import React from "react"
import Link from "next/link"
import {
  Store, ShieldCheck, Clock3, Shield, MapPin, Timer, AlertTriangle,
  ChevronRight, Wrench, Activity,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminSectionCard, AdminTable,
  AdminStatusChip, AdminSearchInput, AdminActionMenu, AdminEmptyState, AdminNotConfigured,
  AdminTabs, type AdminKpi, type AdminTab, type AdminTone,
} from "@/components/admin/ui"
import { listSuppliers, getSupplierKpis } from "@/lib/admin/pages/batch1"

export const dynamic = "force-dynamic"

interface PageProps { searchParams: Promise<{ q?: string; status?: string }> }

function statusTone(status: string): AdminTone {
  if (status === "active" || status === "verified" || status === "published") return "emerald"
  if (status === "pending" || status === "submitted") return "amber"
  if (status === "draft") return "slate"
  if (status === "suspended" || status === "rejected") return "red"
  return "slate"
}
function shortDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}
function fmt(n: number | null) { return n === null ? "—" : n.toLocaleString("en-GB") }

export default async function AdminSuppliersPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = (sp.q ?? "").toLowerCase().trim()
  const statusFilter = sp.status ?? "all"

  const [{ available, rows: allRows }, { kpis }] = await Promise.all([listSuppliers(500), getSupplierKpis()])

  const rows = allRows.filter((s) => {
    const hay = `${s.businessName ?? ""} ${s.workspaceName ?? ""} ${s.trades.join(" ")} ${s.baseLocation ?? ""}`.toLowerCase()
    if (q && !hay.includes(q)) return false
    if (statusFilter === "verified" && !(s.status === "active" || s.status === "verified" || s.status === "published")) return false
    if (statusFilter === "pending" && !(s.status === "pending" || s.status === "submitted" || s.status === "draft")) return false
    return true
  })

  const kpiCards: AdminKpi[] = [
    { label: "Total suppliers", value: fmt(kpis.total), icon: Store, tone: "blue" },
    { label: "Verified", value: fmt(kpis.verified), icon: ShieldCheck, tone: "emerald" },
    { label: "Pending", value: fmt(kpis.pending), icon: Clock3, tone: "amber" },
    { label: "Insurance verified", value: fmt(kpis.insuranceVerified), icon: Shield, tone: "violet" },
    { label: "Emergency-ready", value: fmt(kpis.emergency), icon: Timer, tone: "red" },
    { label: "Avg response (h)", value: kpis.avgResponseHours == null ? "—" : kpis.avgResponseHours, icon: Activity, tone: "sky" },
  ]

  const statusTabs: AdminTab[] = [
    { key: "all", label: "All suppliers", href: tabHref(sp, undefined) },
    { key: "verified", label: "Verified", href: tabHref(sp, "verified") },
    { key: "pending", label: "Pending", href: tabHref(sp, "pending") },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Store}
        title="Suppliers"
        subtitle="Platform-wide supplier accounts, trades, verification status, coverage and performance oversight."
      />

      {!available ? (
        <AdminNotConfigured
          title="Supplier directory not provisioned"
          description="The supplier_workspace_profiles table has not been created in this database yet. Once suppliers onboard, their accounts, verification status, coverage and performance will appear here."
        />
      ) : (
        <>
          <AdminKpiStrip kpis={kpiCards} cols={6} />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
            <AdminCard padded={false}>
              <div className="p-4 border-b border-[#EEF3FB] flex flex-wrap items-center gap-3">
                <AdminSearchInput placeholder="Search suppliers, trades, location…" className="w-full sm:w-72" />
                <AdminTabs tabs={statusTabs} activeKey={statusFilter} className="sm:ml-auto" />
              </div>

              {rows.length === 0 ? (
                <AdminEmptyState icon={Store} title="No suppliers match" description={allRows.length === 0 ? "Suppliers appear here as they onboard to the marketplace." : "Try clearing your search or filter."} />
              ) : (
                <>
                  <AdminTable head={[
                    { label: "Supplier" }, { label: "Trades" }, { label: "Coverage" },
                    { label: "Verification" }, { label: "Status" }, { label: "", align: "right" },
                  ]} minWidth={820}>
                    {rows.map((s) => (
                      <tr key={s.workspaceId} className="hover:bg-[#FAFCFF]">
                        <td className="px-4 py-2.5">
                          <Link href={`/admin/suppliers/${s.workspaceId}`} className="flex items-center gap-2.5 group">
                            <span className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0"><Wrench className="w-4 h-4" /></span>
                            <span className="min-w-0">
                              <span className="block text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{s.businessName ?? s.workspaceName ?? "Supplier"}</span>
                              <span className="block text-[11px] text-slate-400 truncate">Joined {shortDate(s.createdAt)}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-600">
                          {s.trades.length ? s.trades.slice(0, 2).join(", ") + (s.trades.length > 2 ? ` +${s.trades.length - 2}` : "") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-500 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{s.baseLocation ?? "—"}{s.serviceRadiusKm ? ` · ${s.serviceRadiusKm}km` : ""}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {s.insuranceVerified ? <AdminStatusChip tone="emerald" dot>Insured</AdminStatusChip> : <AdminStatusChip tone="slate">Unverified</AdminStatusChip>}
                        </td>
                        <td className="px-4 py-2.5"><AdminStatusChip tone={statusTone(s.status)} dot>{s.status}</AdminStatusChip></td>
                        <td className="px-4 py-2.5 text-right">
                          <AdminActionMenu actions={[
                            { label: "View supplier", href: `/admin/suppliers/${s.workspaceId}` },
                            { label: "Verification", href: `/admin/supplier-verification?workspace=${s.workspaceId}` },
                            { label: "Workspace", href: `/admin/workspaces/${s.workspaceId}` },
                          ]} />
                        </td>
                      </tr>
                    ))}
                  </AdminTable>
                  <div className="px-4 py-2.5 border-t border-[#EEF3FB] text-[12px] text-slate-500">
                    Showing {rows.length} of {allRows.length} supplier{allRows.length === 1 ? "" : "s"}
                  </div>
                </>
              )}
            </AdminCard>

            {/* Right rail */}
            <div className="space-y-4">
              <AdminSectionCard title="Verification queue" icon={ShieldCheck} viewAllHref="/admin/supplier-verification">
                {kpis.pending === 0 ? (
                  <p className="text-[13px] text-slate-400 py-2">No suppliers awaiting verification.</p>
                ) : (
                  <>
                    <p className="text-[26px] font-bold text-amber-600 leading-none">{kpis.pending}</p>
                    <p className="mt-1.5 text-[12px] text-slate-500">suppliers awaiting ID / insurance review.</p>
                    <Link href="/admin/supplier-verification" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
                      Review queue <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </AdminSectionCard>

              <AdminSectionCard title="Marketplace health" icon={Activity}>
                <dl className="space-y-2.5 text-[13px]">
                  <RailRow label="Verified rate" value={kpis.total ? `${Math.round((kpis.verified / kpis.total) * 100)}%` : "—"} />
                  <RailRow label="Insured" value={fmt(kpis.insuranceVerified)} />
                  <RailRow label="Emergency-ready" value={fmt(kpis.emergency)} />
                  <RailRow label="Avg response" value={kpis.avgResponseHours == null ? "—" : `${kpis.avgResponseHours}h`} />
                </dl>
                <Link href="/admin/marketplace/suppliers" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
                  Supplier marketplace <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </AdminSectionCard>

              <AdminSectionCard title="Risk flags" icon={AlertTriangle}>
                <p className="text-[13px] text-slate-500">No high-severity supplier risk flags. Computed signals are surfaced on the Risk page.</p>
                <Link href="/admin/risk" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
                  Risk &amp; fraud <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </AdminSectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function RailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-[#0B1B3F]">{value}</dd>
    </div>
  )
}

function tabHref(sp: { q?: string; status?: string }, status: string | undefined): string {
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  if (status) params.set("status", status)
  const qs = params.toString()
  return qs ? `/admin/suppliers?${qs}` : "/admin/suppliers"
}
