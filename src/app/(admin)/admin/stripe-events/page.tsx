import React from "react"
import { Webhook, Zap } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { listStripeEvents } from "@/lib/admin/ops"

export const dynamic = "force-dynamic"

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"
}

const TH = "text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"

export default async function AdminStripeEventsPage() {
  const { available, rows, total, topTypes } = await listStripeEvents(200)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Stripe Events</h1>
        <p className="text-xs text-slate-500">
          Recent webhook events from <code className="font-mono">stripe_webhook_events</code> · read-only · no payloads shown
        </p>
      </div>

      {!available ? (
        <Card className="py-12 text-center">
          <Webhook className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">stripe_webhook_events table not provisioned</p>
          <p className="text-xs text-slate-400 mt-1">Webhook events appear here once the Stripe integration is live.</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center">
          <Webhook className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No Stripe events yet</p>
          <p className="text-xs text-slate-400 mt-1">Events will be recorded as Stripe delivers webhooks.</p>
        </Card>
      ) : (
        <>
          {/* KPI strip */}
          <div className="flex flex-wrap items-stretch gap-3">
            <Card className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Total events</p>
                <p className="text-lg font-bold text-slate-900 leading-tight">{total.toLocaleString("en-GB")}</p>
              </div>
            </Card>
            {topTypes.length > 0 && (
              <Card className="px-4 py-3 flex-1 min-w-[260px]">
                <p className="text-[11px] text-slate-500 mb-2">Top event types (recent {rows.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {topTypes.map((t) => (
                    <Badge key={t.type} variant="outline" size="sm" className="font-mono">
                      {t.type} · {t.count}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Table */}
          <Card noPadding>
            {/* Mobile card list */}
            <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
              {rows.map((e) => (
                <li key={e.id} className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="primary" size="sm" className="font-mono">{e.type}</Badge>
                    <span className="text-[11px] text-slate-500 shrink-0">{fmt(e.processedAt)}</span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-400 truncate">{e.stripeEventId ?? "—"}</p>
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50">
                    {["Type", "Stripe event ID", "Processed at"].map((h) => (
                      <th key={h} className={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {rows.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2">
                        <Badge variant="primary" size="sm" className="font-mono">{e.type}</Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{e.stripeEventId ?? "—"}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{fmt(e.processedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-[#E2E8F0]">
              <span className="text-xs text-slate-500">
                Showing {rows.length} of {total.toLocaleString("en-GB")} event{total === 1 ? "" : "s"}
              </span>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
