import React from "react"
import Link from "next/link"
import {
  CalendarRange, CheckCircle2, Clock, CreditCard, XCircle, BadgeCheck,
  ShieldCheck, FileClock, RotateCcw,
} from "lucide-react"
import { getBookingsData, fmtPence, type BookingRow } from "@/lib/admin/pages/batch2"
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
  searchParams: Promise<{ status?: string; q?: string }>
}

const STATUS_TONE: Record<string, AdminTone> = {
  confirmed: "emerald", completed: "blue",
  hold: "amber", pending_payment: "amber",
  cancelled: "red", no_show: "red",
}

function humanise(v: string): string {
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
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

function paymentLabel(r: BookingRow): { label: string; tone: AdminTone } {
  switch (r.status) {
    case "confirmed":
    case "completed":
      return { label: "Paid", tone: "emerald" }
    case "pending_payment":
      return { label: "Awaiting payment", tone: "amber" }
    case "hold":
      return { label: "Hold", tone: "slate" }
    case "cancelled":
    case "no_show":
      return { label: "Refund review", tone: "red" }
    default:
      return { label: "—", tone: "slate" }
  }
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const status = sp.status ?? "all"
  const q = sp.q ?? ""

  const [data, audit] = await Promise.all([
    getBookingsData({ status, q }),
    listAudit({ limit: 8 }),
  ])
  const { available, kpis, rows } = data

  const kpiCards: AdminKpi[] = [
    { label: "Confirmed", value: kpis.confirmed.toLocaleString("en-GB"), icon: CheckCircle2, tone: "emerald" },
    { label: "Active holds", value: kpis.holds.toLocaleString("en-GB"), icon: Clock, tone: "amber" },
    { label: "Awaiting payment", value: kpis.pendingPayment.toLocaleString("en-GB"), icon: CreditCard, tone: "violet" },
    { label: "Completed", value: kpis.completed.toLocaleString("en-GB"), icon: BadgeCheck, tone: "blue" },
    { label: "Cancelled", value: kpis.cancelled.toLocaleString("en-GB"), icon: XCircle, tone: "red" },
  ]

  const base = (s: string) => {
    const params = new URLSearchParams()
    if (s !== "all") params.set("status", s)
    if (q) params.set("q", q)
    const qs = params.toString()
    return qs ? `/admin/bookings?${qs}` : "/admin/bookings"
  }

  const tabs: AdminTab[] = [
    { key: "all", label: "All", href: base("all"), count: kpis.total },
    { key: "confirmed", label: "Confirmed", href: base("confirmed"), count: kpis.confirmed },
    { key: "hold", label: "Holds", href: base("hold"), count: kpis.holds },
    { key: "pending_payment", label: "Awaiting payment", href: base("pending_payment"), count: kpis.pendingPayment },
    { key: "completed", label: "Completed", href: base("completed"), count: kpis.completed },
    { key: "cancelled", label: "Cancelled", href: base("cancelled"), count: kpis.cancelled },
  ]

  const refundQueue = rows.filter((r) => r.status === "cancelled" || r.status === "no_show").slice(0, 5)
  const checkoutDrafts = rows.filter((r) => r.status === "hold" || r.status === "pending_payment").slice(0, 5)

  const bookingAudit = audit.filter((a) => a.action.includes("booking") || a.resourceType === "booking")
  const auditEntries: AdminAuditEntry[] = (bookingAudit.length ? bookingAudit : audit).map((a) => ({
    actor: a.actorName ?? "System",
    action: `${a.action.replace(/[._]/g, " ")}${a.workspaceName ? ` · ${a.workspaceName}` : ""}`,
    when: timeAgo(a.createdAt),
  }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={CalendarRange}
        title="Bookings"
        subtitle="Platform-wide reservations, checkout drafts, payment status and refund review. Booking changes are made by the owning workspace; this is oversight."
      />

      <AdminKpiStrip kpis={kpiCards} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-4">
          <AdminTabs tabs={tabs} activeKey={status} />

          <AdminFilterBar>
            <AdminSearchInput placeholder="Search guest, email, workspace…" className="max-w-sm flex-1" />
          </AdminFilterBar>

          <AdminCard padded={false}>
            {!available ? (
              <div className="p-5">
                <AdminNotConfigured
                  title="Bookings not provisioned"
                  description="The bookings table has not been created yet. Reservations appear here as guests book through the marketplace."
                />
              </div>
            ) : rows.length === 0 ? (
              <AdminEmptyState
                icon={CalendarRange}
                title="No bookings match"
                description="No reservations match the current tab and search. Bookings appear as guests reserve stays."
              />
            ) : (
              <AdminTable
                minWidth={900}
                head={[
                  { label: "Guest" },
                  { label: "Stay" },
                  { label: "Status" },
                  { label: "Payment" },
                  { label: "Total", align: "right" },
                  { label: "Fee", align: "right" },
                  { label: "Workspace", align: "right" },
                ]}
              >
                {rows.map((r) => {
                  const pay = paymentLabel(r)
                  return (
                    <tr key={r.id} className="hover:bg-[#FAFCFF]">
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-semibold text-[#0B1B3F]">{r.guestName}</p>
                        {r.guestEmail && <p className="text-[11px] text-slate-400">{r.guestEmail}</p>}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">
                        {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                        <span className="text-slate-400"> · {r.nights}n</span>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusChip tone={STATUS_TONE[r.status] ?? "slate"} dot>{humanise(r.status)}</AdminStatusChip>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusChip tone={pay.tone}>{pay.label}</AdminStatusChip>
                      </td>
                      <td className="px-4 py-3 text-right text-[12.5px] font-medium text-slate-700 whitespace-nowrap">{fmtPence(r.totalPence, r.currency)}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-slate-500 whitespace-nowrap">{fmtPence(r.platformFeePence, r.currency)}</td>
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
                  )
                })}
              </AdminTable>
            )}
          </AdminCard>
        </div>

        <AdminRightRail>
          <AdminBanner tone="amber" icon={ShieldCheck} title="Refunds are authorised actions.">
            Refunds and cancellations are reviewed and actioned explicitly, never automatically, and are recorded in the audit trail.
          </AdminBanner>

          <AdminSectionCard title="Refund / cancellation review" icon={RotateCcw} actions={<AdminStatusChip tone={refundQueue.length ? "red" : "emerald"}>{refundQueue.length}</AdminStatusChip>}>
            {refundQueue.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-1">No bookings awaiting refund review.</p>
            ) : (
              <ul className="space-y-2.5">
                {refundQueue.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-slate-700 truncate">{r.guestName}</p>
                      <p className="text-[11px] text-slate-400">{humanise(r.status)} · {fmtDate(r.checkIn)}</p>
                    </div>
                    <span className="text-[12px] font-medium text-slate-600 shrink-0">{fmtPence(r.totalPence, r.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Checkout drafts & holds" icon={FileClock} actions={<AdminStatusChip tone={checkoutDrafts.length ? "amber" : "emerald"}>{checkoutDrafts.length}</AdminStatusChip>}>
            {checkoutDrafts.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-1">No open holds or checkout drafts.</p>
            ) : (
              <ul className="space-y-2.5">
                {checkoutDrafts.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-slate-700 truncate">{r.guestName}</p>
                      <p className="text-[11px] text-slate-400">{humanise(r.status)} · {r.nights}n</p>
                    </div>
                    <span className="text-[12px] font-medium text-slate-600 shrink-0">{fmtPence(r.totalPence, r.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          <AdminAuditTrailPanel title="Booking audit trail" entries={auditEntries} viewAllHref="/admin/audit" />
        </AdminRightRail>
      </div>
    </div>
  )
}
