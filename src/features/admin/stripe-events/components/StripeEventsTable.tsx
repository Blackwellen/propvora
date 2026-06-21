import React from "react"
import { Webhook, CheckCircle2 } from "lucide-react"
import {
  AdminSectionCard, AdminTable, AdminStatusChip, AdminEmptyState, AdminTabs,
} from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"

type StripeEventRow = {
  id: string
  type: string
  status: string
  stripeEventId: string | null
  processedAt: string | null
  failed: boolean
}

type TabDef = { key: string; label: string; href: string; count?: number }

const STATUS_TONE: Record<string, AdminTone> = {
  processed: "emerald", succeeded: "emerald", pending: "amber", processing: "amber", failed: "red", dead_letter: "red",
}

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—"
}

interface Props {
  rows: StripeEventRow[]
  tabs: TabDef[]
  activeTab: string
  renderReplay: (eventId: string, type: string) => React.ReactNode
}

export function StripeEventsTable({ rows, tabs, activeTab, renderReplay }: Props) {
  return (
    <AdminSectionCard title="Webhook events" icon={Webhook} actions={<AdminTabs tabs={tabs} activeKey={activeTab} />}>
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={Webhook}
          title="No events in this view"
          description="Events are recorded as Stripe delivers webhooks. Switch tabs to view other statuses."
        />
      ) : (
        <AdminTable
          head={[
            { label: "Type" }, { label: "Status" }, { label: "Stripe event ID" },
            { label: "Processed" }, { label: "", align: "right" },
          ]}
          minWidth={760}
        >
          {rows.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-2.5"><AdminStatusChip tone="blue">{e.type}</AdminStatusChip></td>
              <td className="px-4 py-2.5">
                <AdminStatusChip tone={STATUS_TONE[e.status] ?? "slate"} dot>{e.status}</AdminStatusChip>
              </td>
              <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{e.stripeEventId ?? "—"}</td>
              <td className="px-4 py-2.5 text-[11px] text-slate-500 whitespace-nowrap">{fmt(e.processedAt)}</td>
              <td className="px-4 py-2.5 text-right">{e.failed && renderReplay(e.id, e.type)}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </AdminSectionCard>
  )
}

type DeadLetterRow = {
  id: string
  type: string
  stripeEventId: string | null
}

interface DeadLetterProps {
  rows: DeadLetterRow[]
  renderReplay: (eventId: string, type: string) => React.ReactNode
}

export function DeadLetterQueueTable({ rows, renderReplay }: DeadLetterProps) {
  return (
    <AdminSectionCard title="Dead-letter queue" icon={Webhook}>
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={CheckCircle2}
          title="Queue is clear"
          description="No webhook events have exhausted their retries. Failed events that cannot be processed land here for manual replay."
        />
      ) : (
        <AdminTable
          head={[{ label: "Type" }, { label: "Event ID" }, { label: "", align: "right" }]}
          minWidth={420}
        >
          {rows.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-2.5"><AdminStatusChip tone="red">{e.type}</AdminStatusChip></td>
              <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{e.stripeEventId ?? "—"}</td>
              <td className="px-4 py-2.5 text-right">{renderReplay(e.id, e.type)}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </AdminSectionCard>
  )
}
