import React from "react"
import { redirect } from "next/navigation"
import {
  Home, Star, ListChecks, AlertTriangle, ShieldAlert, MessagesSquare,
  Building2, ClipboardCheck, TrendingUp,
} from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import {
  AdminPageHeader, AdminKpiStrip, AdminSectionCard, AdminTable, AdminStatusChip,
  AdminEmptyState, AdminNotConfigured, AdminBanner, AdminActionMenu, AdminSearchInput,
  AdminTabs, type AdminKpi, type AdminTone,
} from "@/components/admin/ui"
import {
  getLettingsKpis, listLettingsListings, fmtPence, shortId,
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
    case "active": return "emerald"
    case "pending_review": case "pending": case "in_review": return "amber"
    case "paused": return "slate"
    case "rejected": case "archived": return "red"
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
 * Lettings marketplace oversight (manifest row 23).
 *
 * Cross-tenant BY DESIGN — a platform admin oversees stay/letting listings across
 * every workspace. Gated by the (admin) layout AND re-checked here server-side
 * (fail-closed): a non-admin is redirected before any data loads. Read-only
 * oversight surface; all figures are real recorded marketplace state.
 */
export default async function AdminLettingsMarketplacePage({ searchParams }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const sp = await searchParams
  const status = sp.status || ""
  const q = sp.q || ""

  const [kpis, listings] = await Promise.all([
    getLettingsKpis(),
    listLettingsListings({ q, status }),
  ])

  const kpiCards: AdminKpi[] = [
    { label: "Active stay listings", value: num(kpis.activeListings), icon: Home, tone: "blue" },
    { label: "Active hosts", value: num(kpis.hosts), icon: Building2, tone: "violet" },
    { label: "Host quality (avg ★)", value: kpis.avgRating == null ? "—" : kpis.avgRating.toFixed(1), sub: kpis.reviewCount ? `${num(kpis.reviewCount)} reviews` : undefined, icon: Star, tone: "amber" },
    { label: "Stay bookings", value: num(kpis.bookings), icon: TrendingUp, tone: "emerald" },
    { label: "Pending moderation", value: num(kpis.pendingModeration), icon: ClipboardCheck, tone: kpis.pendingModeration ? "amber" : "slate", href: "/admin/marketplace/moderation" },
    { label: "Open guest complaints", value: num(kpis.openComplaints), icon: MessagesSquare, tone: kpis.openComplaints ? "red" : "slate" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Lettings marketplace"
        icon={Home}
        breadcrumb={[{ label: "Marketplace", href: "/admin/marketplace/oversight" }, { label: "Lettings" }]}
        subtitle="Cross-workspace oversight of stay & long-term listings, host quality, the booking funnel, guest complaints, safety flags and lettings compliance."
      />

      {kpis.available && <AdminKpiStrip kpis={kpiCards} cols={6} />}

      <AdminBanner tone="slate" icon={ShieldAlert} title="Read-only oversight.">
        Every figure is real recorded marketplace state across all workspaces. Listing approval / removal is an explicit,
        recorded admin action carried out in the listing moderation queue — nothing is auto-actioned here.
      </AdminBanner>

      <AdminSectionCard title="Stay & letting listings" icon={ListChecks} viewAllHref="/admin/marketplace/moderation" viewAllLabel="Moderation queue">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AdminTabs tabs={STATUS_TABS} activeKey={status} className="sm:max-w-[60%]" />
          <AdminSearchInput placeholder="Search listings…" className="sm:w-64" />
        </div>

        {!listings.available ? (
          <AdminNotConfigured
            title="Marketplace not provisioned"
            description="The marketplace_listings table is not present in this database yet. Lettings listings will appear here once the marketplace is provisioned."
          />
        ) : listings.rows.length === 0 ? (
          <AdminEmptyState
            icon={Home}
            title={status || q ? "No listings match" : "No stay listings yet"}
            description={status || q ? "Adjust the filters to widen the search." : "Stay and letting listings created across workspaces will appear here."}
          />
        ) : (
          <AdminTable
            minWidth={820}
            head={[
              { label: "Listing" }, { label: "Host" }, { label: "Category" },
              { label: "Region" }, { label: "Price", align: "right" },
              { label: "Status" }, { label: "Created" }, { label: "", align: "right" },
            ]}
          >
            {listings.rows.map((r) => (
              <tr key={r.id} className="hover:bg-[#FAFCFF]">
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#0B1B3F] truncate max-w-[220px]">{r.title}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{shortId(r.id)}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.hostName ?? <span className="font-mono text-slate-400">{shortId(r.hostWorkspaceId)}</span>}</td>
                <td className="px-4 py-3 text-slate-600">{r.category ? r.category.replace(/_/g, " ") : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{r.region ?? "—"}</td>
                <td className="px-4 py-3 text-right font-medium text-[#0B1B3F]">{r.pricePence == null ? "—" : fmtPence(r.pricePence, r.currency)}</td>
                <td className="px-4 py-3"><AdminStatusChip tone={statusTone(r.status)} dot>{r.status.replace(/_/g, " ")}</AdminStatusChip></td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <AdminActionMenu
                    actions={[
                      { label: "Open moderation queue", href: "/admin/marketplace/moderation" },
                      { label: "View host workspace", href: r.hostWorkspaceId ? `/admin/workspaces/${r.hostWorkspaceId}` : "/admin/workspaces" },
                      { label: "Review safety flags", href: "/admin/risk" },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminSectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AdminSectionCard title="Booking funnel" icon={TrendingUp}>
          <dl className="space-y-3">
            <FunnelRow label="Active listings" value={num(kpis.activeListings)} tone="blue" />
            <FunnelRow label="Stay bookings" value={num(kpis.bookings)} tone="emerald" />
            <FunnelRow label="Hosts" value={num(kpis.hosts)} tone="violet" />
          </dl>
          <p className="mt-3 text-[11px] text-slate-400">Counts derive from real marketplace_listings and marketplace_transactions rows.</p>
        </AdminSectionCard>

        <AdminSectionCard title="Guest complaints" icon={MessagesSquare}>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><MessagesSquare className="w-5 h-5" /></span>
            <div>
              <p className="text-[26px] font-bold text-[#0B1B3F] leading-none">{num(kpis.openComplaints)}</p>
              <p className="text-[12px] text-slate-500">open / acknowledged</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">From job_complaints. Resolution happens in the originating workspace; admins triage safety-critical cases via Risk.</p>
        </AdminSectionCard>

        <AdminSectionCard title="Safety flags & compliance" icon={AlertTriangle} viewAllHref="/admin/risk" viewAllLabel="Open Risk">
          <ul className="space-y-2.5 text-[12.5px] text-slate-600">
            <li className="flex items-center justify-between"><span>High-risk hosts</span><AdminStatusChip tone="slate">Risk engine</AdminStatusChip></li>
            <li className="flex items-center justify-between"><span>Listing moderation queue</span><AdminStatusChip tone={kpis.pendingModeration ? "amber" : "emerald"}>{num(kpis.pendingModeration)}</AdminStatusChip></li>
            <li className="flex items-center justify-between"><span>Host verification</span><AdminStatusChip tone="slate">ID Verification</AdminStatusChip></li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-400">Safety flags are computed signals reviewed in Risk & fraud — never auto-enforced here.</p>
        </AdminSectionCard>
      </div>
    </div>
  )
}

function FunnelRow({ label, value, tone }: { label: string; value: string; tone: AdminTone }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[13px] text-slate-600">{label}</dt>
      <dd><AdminStatusChip tone={tone}>{value}</AdminStatusChip></dd>
    </div>
  )
}
