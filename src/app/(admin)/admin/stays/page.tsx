import React from "react"
import Link from "next/link"
import {
  BedDouble, Building, Home, BadgeCheck, Clock, ShieldCheck, ListChecks, CalendarCheck,
} from "lucide-react"
import { getStaysData, fmtPence } from "@/lib/admin/pages/batch2"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminCard,
  AdminTable,
  AdminTabs,
  AdminSearchInput,
  AdminFilterBar,
  AdminStatusChip,
  AdminEmptyState,
  AdminNotConfigured,
  AdminRightRail,
  AdminSectionCard,
  AdminBanner,
  AdminButtonLink,
  type AdminKpi,
  type AdminTab,
  type AdminTone,
} from "@/components/admin/ui"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ kind?: string; status?: string; q?: string }>
}

const STATUS_TONE: Record<string, AdminTone> = {
  published: "emerald", active: "emerald",
  draft: "slate", archived: "slate", paused: "amber",
  pending_review: "amber", pending: "amber",
}

function humanise(v: string): string {
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function AdminStaysPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const kind = sp.kind ?? "all"
  const status = sp.status ?? "all"
  const q = sp.q ?? ""

  const data = await getStaysData({ kind, status, q })
  const { shortAvailable, longAvailable, kpis, rows } = data
  const anyAvailable = shortAvailable || longAvailable

  const kpiCards: AdminKpi[] = [
    { label: "Short-stay listings", value: kpis.shortStays === null ? "—" : kpis.shortStays.toLocaleString("en-GB"), icon: BedDouble, tone: "blue" },
    { label: "Long-term rentals", value: kpis.longTerm === null ? "—" : kpis.longTerm.toLocaleString("en-GB"), icon: Building, tone: "violet" },
    { label: "Published / live", value: kpis.published.toLocaleString("en-GB"), icon: Home, tone: "emerald" },
    { label: "Pending review", value: kpis.pendingReview.toLocaleString("en-GB"), icon: Clock, tone: "amber" },
    { label: "Verified hosts", value: kpis.verifiedHosts.toLocaleString("en-GB"), icon: BadgeCheck, tone: "sky" },
  ]

  const base = (k: string) => {
    const params = new URLSearchParams()
    if (k !== "all") params.set("kind", k)
    if (status !== "all") params.set("status", status)
    if (q) params.set("q", q)
    const qs = params.toString()
    return qs ? `/admin/stays?${qs}` : "/admin/stays"
  }

  const tabs: AdminTab[] = [
    { key: "all", label: "All stays", href: base("all"), count: (kpis.shortStays ?? 0) + (kpis.longTerm ?? 0) },
    { key: "short", label: "Short-stay", href: base("short"), count: kpis.shortStays ?? 0 },
    { key: "long", label: "Long-term", href: base("long"), count: kpis.longTerm ?? 0 },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={BedDouble}
        title="Stays"
        subtitle="Oversight for short-stay and long-term rental listings — host verification, availability health and listing moderation across the marketplace."
      />

      <AdminKpiStrip kpis={kpiCards} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-4">
          <AdminTabs tabs={tabs} activeKey={kind} />

          <AdminFilterBar>
            <AdminSearchInput placeholder="Search title, location, workspace…" className="max-w-sm flex-1" />
          </AdminFilterBar>

          <AdminCard padded={false}>
            {!anyAvailable ? (
              <div className="p-5">
                <AdminNotConfigured
                  title="Stay listings not provisioned"
                  description="Neither the short-stay (marketplace_listings) nor long-term rental tables are provisioned yet. Listings appear here once the marketplace is live."
                />
              </div>
            ) : rows.length === 0 ? (
              <AdminEmptyState
                icon={BedDouble}
                title="No listings match"
                description="No stay listings match the current tab and search. Listings appear as hosts publish them."
              />
            ) : (
              <AdminTable
                minWidth={820}
                head={[
                  { label: "Listing" },
                  { label: "Kind" },
                  { label: "Location" },
                  { label: "Price" },
                  { label: "Host" },
                  { label: "Status" },
                  { label: "Workspace", align: "right" },
                ]}
              >
                {rows.map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#0B1B3F] truncate max-w-[220px]">{r.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusChip tone={r.kind === "short" ? "blue" : "violet"}>
                        {r.kind === "short" ? "Short-stay" : "Long-term"}
                      </AdminStatusChip>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-500">{r.location ?? "—"}</td>
                    <td className="px-4 py-3 text-[12.5px] font-medium text-slate-700 whitespace-nowrap">
                      {r.pricePence != null ? <>{fmtPence(r.pricePence)}<span className="text-slate-400 font-normal">{r.priceUnit}</span></> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.verified ? (
                        <AdminStatusChip tone="emerald" dot>Verified</AdminStatusChip>
                      ) : (
                        <AdminStatusChip tone="slate">Unverified</AdminStatusChip>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusChip tone={STATUS_TONE[r.status] ?? "blue"} dot>{humanise(r.status)}</AdminStatusChip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.workspaceId ? (
                        <Link href={`/admin/workspaces/${r.workspaceId}`} className="text-[12px] text-slate-500 hover:text-[#2563EB]">
                          {r.workspaceName ?? "Workspace"}
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </AdminTable>
            )}
          </AdminCard>
        </div>

        <AdminRightRail>
          <AdminBanner tone="blue" icon={ShieldCheck} title="Moderation is explicit.">
            Listings are approved or rejected from the moderation queue — never auto-published. Every decision is recorded in the audit log.
          </AdminBanner>

          <AdminSectionCard title="Availability & host health" icon={CalendarCheck}>
            <ul className="space-y-3 text-[13px]">
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Verified hosts</span>
                <AdminStatusChip tone="emerald">{kpis.verifiedHosts}</AdminStatusChip>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Pending review</span>
                <AdminStatusChip tone={kpis.pendingReview > 0 ? "amber" : "emerald"}>{kpis.pendingReview}</AdminStatusChip>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Published / live</span>
                <AdminStatusChip tone="blue">{kpis.published}</AdminStatusChip>
              </li>
            </ul>
          </AdminSectionCard>

          <AdminSectionCard title="Moderation queues" icon={ListChecks}>
            <p className="text-[13px] text-slate-500 mb-3">
              {kpis.pendingReview > 0
                ? `${kpis.pendingReview} listing${kpis.pendingReview === 1 ? "" : "s"} awaiting review.`
                : "No listings awaiting review."}
            </p>
            <AdminButtonLink href="/admin/marketplace/moderation" variant="secondary" icon={ListChecks}>
              Open moderation queue
            </AdminButtonLink>
          </AdminSectionCard>
        </AdminRightRail>
      </div>
    </div>
  )
}
