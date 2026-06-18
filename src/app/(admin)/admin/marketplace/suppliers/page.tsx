import React from "react"
import { redirect } from "next/navigation"
import {
  Store, ShieldCheck, Siren, FileText, ListChecks, Gavel, MapPin, ShieldAlert, Quote,
} from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import {
  AdminPageHeader, AdminKpiStrip, AdminSectionCard, AdminTable, AdminStatusChip,
  AdminEmptyState, AdminNotConfigured, AdminBanner, AdminActionMenu, AdminSearchInput,
  AdminTabs, type AdminKpi, type AdminTone,
} from "@/components/admin/ui"
import {
  getSupplierMarketKpis, listSupplierListings, listSupplierQuoteRequests,
  fmtPence, shortId,
} from "@/lib/admin/pages/batch3"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

const STATUS_TABS = [
  { key: "", label: "All listings" },
  { key: "active", label: "Active" },
  { key: "pending_review", label: "Pending review" },
  { key: "paused", label: "Paused" },
  { key: "archived", label: "Archived" },
]

function statusTone(status: string): AdminTone {
  switch (status) {
    case "active": case "verified": case "quoted": return "emerald"
    case "pending_review": case "pending": case "requested": case "new": case "open": return "amber"
    case "paused": case "expired": return "slate"
    case "rejected": case "archived": case "declined": return "red"
    default: return "slate"
  }
}

function num(n: number | null): string {
  return n == null ? "—" : n.toLocaleString("en-GB")
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }
  catch { return "—" }
}

/**
 * Supplier marketplace oversight (manifest row 24).
 *
 * Cross-tenant BY DESIGN — a platform admin oversees supplier listings, offers,
 * quote requests and coverage across every workspace. Gated by the (admin)
 * layout AND re-checked here server-side (fail-closed). Read-only oversight; all
 * figures are real recorded marketplace state.
 */
export default async function AdminSupplierMarketplacePage({ searchParams }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const sp = await searchParams
  const status = sp.status || ""
  const q = sp.q || ""

  const [kpis, listings, requests] = await Promise.all([
    getSupplierMarketKpis(),
    listSupplierListings({ q, status }),
    listSupplierQuoteRequests(12),
  ])

  const kpiCards: AdminKpi[] = [
    { label: "Active supplier listings", value: num(kpis.activeListings), icon: Store, tone: "blue" },
    { label: "Emergency services", value: num(kpis.emergencyListings), icon: Siren, tone: kpis.emergencyListings ? "red" : "slate" },
    { label: "Active suppliers", value: num(kpis.activeSuppliers), icon: ShieldCheck, tone: "emerald", href: "/admin/supplier-verification" },
    { label: "Open quote requests", value: num(kpis.openQuoteRequests), icon: FileText, tone: kpis.openQuoteRequests ? "amber" : "slate" },
    { label: "Active quotes / offers", value: num(kpis.activeQuotes), icon: Quote, tone: "violet" },
    { label: "Open disputes", value: num(kpis.openDisputes), icon: Gavel, tone: kpis.openDisputes ? "red" : "slate", href: "/admin/marketplace/disputes" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Supplier marketplace"
        icon={Store}
        breadcrumb={[{ label: "Marketplace", href: "/admin/marketplace/oversight" }, { label: "Suppliers" }]}
        subtitle="Cross-workspace oversight of supplier listings, service offers, emergency providers, quote requests, coverage and supplier disputes."
      />

      {kpis.available && <AdminKpiStrip kpis={kpiCards} cols={6} />}

      <AdminBanner tone="slate" icon={ShieldAlert} title="Read-only oversight.">
        Every figure is real recorded marketplace state across all workspaces. Supplier verification, dispute resolution
        and listing moderation are explicit, recorded admin actions carried out in their dedicated queues.
      </AdminBanner>

      <AdminSectionCard title="Supplier listings & service offers" icon={ListChecks} viewAllHref="/admin/marketplace/moderation" viewAllLabel="Moderation queue">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AdminTabs tabs={STATUS_TABS} activeKey={status} className="sm:max-w-[60%]" />
          <AdminSearchInput placeholder="Search listings…" className="sm:w-64" />
        </div>

        {!listings.available ? (
          <AdminNotConfigured
            title="Marketplace not provisioned"
            description="The marketplace_listings table is not present in this database yet. Supplier listings will appear here once the marketplace is provisioned."
          />
        ) : listings.rows.length === 0 ? (
          <AdminEmptyState
            icon={Store}
            title={status || q ? "No listings match" : "No supplier listings yet"}
            description={status || q ? "Adjust the filters to widen the search." : "Supplier and service listings created across workspaces will appear here."}
          />
        ) : (
          <AdminTable
            minWidth={860}
            head={[
              { label: "Listing" }, { label: "Supplier" }, { label: "Type" },
              { label: "Coverage" }, { label: "Price", align: "right" },
              { label: "Status" }, { label: "Created" }, { label: "", align: "right" },
            ]}
          >
            {listings.rows.map((r) => (
              <tr key={r.id} className="hover:bg-[#FAFCFF]">
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#0B1B3F] truncate max-w-[220px]">{r.title}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{shortId(r.id)}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.supplierName ?? <span className="font-mono text-slate-400">{shortId(r.supplierWorkspaceId)}</span>}</td>
                <td className="px-4 py-3">
                  {r.transactionType === "emergency_job"
                    ? <AdminStatusChip tone="red" dot>emergency</AdminStatusChip>
                    : <span className="text-slate-600">{(r.transactionType ?? "—").replace(/_/g, " ")}</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.region ?? "—"}</td>
                <td className="px-4 py-3 text-right font-medium text-[#0B1B3F]">{r.pricePence == null ? "—" : fmtPence(r.pricePence, r.currency)}</td>
                <td className="px-4 py-3"><AdminStatusChip tone={statusTone(r.status)} dot>{r.status.replace(/_/g, " ")}</AdminStatusChip></td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <AdminActionMenu
                    actions={[
                      { label: "Open moderation queue", href: "/admin/marketplace/moderation" },
                      { label: "View supplier workspace", href: r.supplierWorkspaceId ? `/admin/workspaces/${r.supplierWorkspaceId}` : "/admin/workspaces" },
                      { label: "Review verification", href: "/admin/supplier-verification" },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminSectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AdminSectionCard title="Quote requests" icon={FileText} className="lg:col-span-2">
          {!requests.available ? (
            <AdminNotConfigured
              title="Quote requests not provisioned"
              description="The supplier_requests table is not present in this database yet."
            />
          ) : requests.rows.length === 0 ? (
            <AdminEmptyState icon={FileText} title="No quote requests" description="Open supplier quote requests across workspaces will appear here." />
          ) : (
            <AdminTable
              minWidth={560}
              head={[{ label: "Request" }, { label: "Workspace" }, { label: "Amount", align: "right" }, { label: "Status" }, { label: "Created" }]}
            >
              {requests.rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAFCFF]">
                  <td className="px-4 py-3 font-medium text-[#0B1B3F] truncate max-w-[200px]">{r.title ?? "Untitled request"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.workspaceName ?? <span className="font-mono text-slate-400">{shortId(r.workspaceId)}</span>}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{r.amountPence == null ? "—" : fmtPence(r.amountPence, r.currency)}</td>
                  <td className="px-4 py-3"><AdminStatusChip tone={statusTone(r.status)}>{r.status.replace(/_/g, " ")}</AdminStatusChip></td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </AdminTable>
          )}
        </AdminSectionCard>

        <AdminSectionCard title="Coverage & disputes" icon={MapPin}>
          <ul className="space-y-2.5 text-[12.5px] text-slate-600">
            <li className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Siren className="w-3.5 h-3.5 text-red-500" /> Emergency providers</span><AdminStatusChip tone={kpis.emergencyListings ? "red" : "slate"}>{num(kpis.emergencyListings)}</AdminStatusChip></li>
            <li className="flex items-center justify-between"><span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Active suppliers</span><AdminStatusChip tone="emerald">{num(kpis.activeSuppliers)}</AdminStatusChip></li>
            <li className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Gavel className="w-3.5 h-3.5 text-slate-400" /> Open disputes</span><AdminStatusChip tone={kpis.openDisputes ? "amber" : "emerald"}>{num(kpis.openDisputes)}</AdminStatusChip></li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-400">Disputes ride the shared governance queue — resolution is explicit and recorded.</p>
        </AdminSectionCard>
      </div>
    </div>
  )
}
