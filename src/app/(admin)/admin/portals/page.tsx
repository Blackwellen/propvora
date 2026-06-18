import React from "react"
import Link from "next/link"
import {
  DoorOpen, KeyRound, Activity, Clock, ShieldOff, Home, Users, Wrench,
  ShieldCheck, Link2,
} from "lucide-react"
import { getPortalsData, type PortalSessionRow } from "@/lib/admin/pages/batch2"
import { listAudit } from "@/lib/admin/data"
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
  AdminAuditTrailPanel,
  AdminBanner,
  type AdminKpi,
  type AdminTab,
  type AdminTone,
  type AdminAuditEntry,
} from "@/components/admin/ui"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ tab?: string; q?: string }>
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
  } catch {
    return "—"
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—"
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TYPE_TONE: Record<string, AdminTone> = { landlord: "blue", tenant: "violet", supplier: "amber" }
const STATUS_TONE: Record<PortalSessionRow["status"], AdminTone> = { active: "emerald", expired: "slate", revoked: "red" }

export default async function AdminPortalsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const tab = sp.tab ?? "all"
  const q = sp.q ?? ""

  const [data, audit] = await Promise.all([
    getPortalsData({ type: tab, q }),
    listAudit({ limit: 8 }),
  ])
  const { available, kpis, rows } = data

  const kpiCards: AdminKpi[] = [
    { label: "Total sessions", value: kpis.total.toLocaleString("en-GB"), icon: DoorOpen, tone: "blue" },
    { label: "Active", value: kpis.active.toLocaleString("en-GB"), icon: Activity, tone: "emerald" },
    { label: "Landlord", value: kpis.landlord.toLocaleString("en-GB"), icon: Home, tone: "blue" },
    { label: "Tenant", value: kpis.tenant.toLocaleString("en-GB"), icon: Users, tone: "violet" },
    { label: "Supplier", value: kpis.supplier.toLocaleString("en-GB"), icon: Wrench, tone: "amber" },
    { label: "Revoked", value: kpis.revoked.toLocaleString("en-GB"), icon: ShieldOff, tone: "red" },
  ]

  const base = (t: string) => {
    const params = new URLSearchParams()
    if (t !== "all") params.set("tab", t)
    if (q) params.set("q", q)
    const qs = params.toString()
    return qs ? `/admin/portals?${qs}` : "/admin/portals"
  }

  const tabs: AdminTab[] = [
    { key: "all", label: "All", href: base("all"), count: kpis.total },
    { key: "landlord", label: "Landlord", href: base("landlord"), count: kpis.landlord },
    { key: "tenant", label: "Tenant", href: base("tenant"), count: kpis.tenant },
    { key: "supplier", label: "Supplier", href: base("supplier"), count: kpis.supplier },
    { key: "active", label: "Active", href: base("active"), count: kpis.active },
    { key: "revoked", label: "Revoked", href: base("revoked"), count: kpis.revoked },
  ]

  const auditEntries: AdminAuditEntry[] = audit.map((a) => ({
    actor: a.actorName ?? "System",
    action: `${a.action.replace(/[._]/g, " ")}${a.workspaceName ? ` · ${a.workspaceName}` : ""}`,
    when: timeAgo(a.createdAt),
    tone: a.action.includes("revoke") ? ("red" as const) : undefined,
  }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={DoorOpen}
        title="Portals"
        subtitle="Central oversight for landlord, tenant and supplier portal sessions, access grants and revoked links across every workspace. Read-only."
      />

      <AdminKpiStrip kpis={kpiCards} cols={6} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-4">
          <AdminTabs tabs={tabs} activeKey={tab} />

          <AdminFilterBar>
            <AdminSearchInput placeholder="Search recipient, workspace, IP…" className="max-w-sm flex-1" />
          </AdminFilterBar>

          <AdminCard padded={false}>
            {!available ? (
              <div className="p-5">
                <AdminNotConfigured
                  title="Portal sessions not provisioned"
                  description="The portal_sessions table has not been created yet. Run the portal engine migration to populate session and access-grant oversight."
                />
              </div>
            ) : rows.length === 0 ? (
              <AdminEmptyState
                icon={KeyRound}
                title="No portal sessions match"
                description="No active or historical portal sessions match the current tab and search. Sessions appear as recipients open magic-link portals."
              />
            ) : (
              <AdminTable
                minWidth={820}
                head={[
                  { label: "Recipient" },
                  { label: "Portal" },
                  { label: "Workspace" },
                  { label: "Status" },
                  { label: "Granted" },
                  { label: "Expires" },
                  { label: "Last seen", align: "right" },
                ]}
              >
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#0B1B3F]">{r.recipient ?? "Magic-link recipient"}</p>
                      {r.ip && <p className="text-[11px] text-slate-400 font-mono">{r.ip}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusChip tone={TYPE_TONE[r.portalType] ?? "slate"} className="capitalize">{r.portalType}</AdminStatusChip>
                    </td>
                    <td className="px-4 py-3">
                      {r.workspaceId ? (
                        <Link href={`/admin/workspaces/${r.workspaceId}`} className="text-[12.5px] text-slate-500 hover:text-[#2563EB]">
                          {r.workspaceName ?? "Workspace"}
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusChip tone={STATUS_TONE[r.status]} dot className="capitalize">{r.status}</AdminStatusChip>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{fmtDate(r.expiresAt)}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-400 text-right whitespace-nowrap">{timeAgo(r.lastSeenAt)}</td>
                  </tr>
                ))}
              </AdminTable>
            )}
          </AdminCard>
        </div>

        <AdminRightRail>
          <AdminBanner tone="amber" icon={ShieldCheck} title="Security boundary.">
            Sessions are validated fail-closed: usable only when not revoked and not past expiry. Raw tokens are never stored.
          </AdminBanner>

          <AdminSectionCard title="Access grant queue" icon={KeyRound}>
            <ul className="space-y-3">
              {[
                { label: "Active grants", value: kpis.active, tone: "emerald" as AdminTone },
                { label: "Expired links", value: kpis.expired, tone: "slate" as AdminTone },
                { label: "Revoked links", value: kpis.revoked, tone: "red" as AdminTone },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] text-slate-600">
                    <Link2 className="w-4 h-4 text-slate-400" /> {row.label}
                  </span>
                  <AdminStatusChip tone={row.tone}>{row.value}</AdminStatusChip>
                </li>
              ))}
            </ul>
          </AdminSectionCard>

          <AdminAuditTrailPanel title="Recent portal audit events" entries={auditEntries} viewAllHref="/admin/audit" />
        </AdminRightRail>
      </div>
    </div>
  )
}
