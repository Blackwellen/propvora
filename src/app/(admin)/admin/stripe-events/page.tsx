import React from "react"
import { Webhook, Zap, CheckCircle2, Clock, AlertTriangle, Inbox } from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminSectionCard,
  AdminTable,
  AdminStatusChip,
  AdminEmptyState,
  AdminNotConfigured,
  AdminBanner,
  AdminTabs,
  type AdminKpi,
  type AdminTone,
} from "@/components/admin/ui"
import { getStripeEventsData } from "@/lib/admin/pages/batch4"
import ReplayButton from "./ReplayButton"

export const dynamic = "force-dynamic"
export const metadata = { title: "Stripe events — Propvora admin" }

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"
}

const STATUS_TONE: Record<string, AdminTone> = {
  processed: "emerald", succeeded: "emerald", pending: "amber", processing: "amber", failed: "red", dead_letter: "red",
}

export default async function AdminStripeEventsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "all" } = await searchParams
  const data = await getStripeEventsData(200)

  const rows = data.rows.filter((r) =>
    tab === "failed" ? r.failed : tab === "delivered" ? !r.failed : tab === "pending" ? (r.status === "pending" || r.status === "processing") : true,
  )

  const kpis: AdminKpi[] = [
    { label: "Total events", value: data.kpis.total.toLocaleString("en-GB"), icon: Zap, tone: "blue" },
    { label: "Delivered", value: data.kpis.delivered, icon: CheckCircle2, tone: "emerald" },
    { label: "Pending", value: data.kpis.pending, icon: Clock, tone: "amber" },
    { label: "Failed", value: data.kpis.failed, icon: AlertTriangle, tone: "red" },
    { label: "Dead-letter", value: data.kpis.deadLetter, icon: Inbox, tone: "violet" },
  ]

  const tabs = [
    { key: "all", label: "All events", href: "/admin/stripe-events?tab=all", count: data.kpis.total },
    { key: "delivered", label: "Delivered", href: "/admin/stripe-events?tab=delivered" },
    { key: "pending", label: "Pending", href: "/admin/stripe-events?tab=pending" },
    { key: "failed", label: "Failed", href: "/admin/stripe-events?tab=failed", count: data.kpis.failed },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Webhook}
        title="Stripe events"
        subtitle="Webhook delivery health, event log and the dead-letter queue. Replay failed events from the stored record. No payloads or card data are shown."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Operations" }, { label: "Stripe events" }]}
      />

      {!data.stripeConfigured && (
        <AdminBanner tone="amber" icon={AlertTriangle} title="Stripe not configured.">No <code className="font-mono">STRIPE_SECRET_KEY</code> / webhook secret is set in this environment. Any events below were recorded earlier; replay will requeue stored events only.</AdminBanner>
      )}

      {data.notConfigured ? (
        <AdminNotConfigured title="stripe_webhook_events table not provisioned" description="Webhook events appear here once the Stripe integration writes to the events table." />
      ) : (
        <>
          <AdminKpiStrip kpis={kpis} cols={5} />

          <AdminSectionCard title="Webhook events" icon={Webhook} actions={<AdminTabs tabs={tabs} activeKey={tab} />}>
            {rows.length === 0 ? (
              <AdminEmptyState icon={Webhook} title="No events in this view" description="Events are recorded as Stripe delivers webhooks. Switch tabs to view other statuses." />
            ) : (
              <AdminTable head={[{ label: "Type" }, { label: "Status" }, { label: "Stripe event ID" }, { label: "Processed" }, { label: "", align: "right" }]} minWidth={760}>
                {rows.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5"><AdminStatusChip tone="blue">{e.type}</AdminStatusChip></td>
                    <td className="px-4 py-2.5"><AdminStatusChip tone={STATUS_TONE[e.status] ?? "slate"} dot>{e.status}</AdminStatusChip></td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{e.stripeEventId ?? "—"}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500 whitespace-nowrap">{fmt(e.processedAt)}</td>
                    <td className="px-4 py-2.5 text-right">{e.failed && <ReplayButton eventId={e.id} type={e.type} />}</td>
                  </tr>
                ))}
              </AdminTable>
            )}
          </AdminSectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminSectionCard title="Top event types" icon={Zap}>
              {data.topTypes.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-4">No events recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {data.topTypes.map((t) => (
                    <li key={t.type} className="flex items-center justify-between">
                      <span className="font-mono text-[12px] text-slate-700">{t.type}</span>
                      <span className="text-[12px] font-semibold text-[#0B1B3F]">{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSectionCard>

            <AdminSectionCard title="Dead-letter queue" icon={Inbox}>
              {data.deadLetter.length === 0 ? (
                <AdminEmptyState icon={CheckCircle2} title="Queue is clear" description="No webhook events have exhausted their retries. Failed events that cannot be processed land here for manual replay." />
              ) : (
                <AdminTable head={[{ label: "Type" }, { label: "Event ID" }, { label: "", align: "right" }]} minWidth={420}>
                  {data.deadLetter.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5"><AdminStatusChip tone="red">{e.type}</AdminStatusChip></td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{e.stripeEventId ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right"><ReplayButton eventId={e.id} type={e.type} /></td>
                    </tr>
                  ))}
                </AdminTable>
              )}
            </AdminSectionCard>
          </div>
        </>
      )}
    </div>
  )
}
