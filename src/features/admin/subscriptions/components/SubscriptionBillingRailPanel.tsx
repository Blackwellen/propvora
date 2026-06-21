import React from "react"
import Link from "next/link"
import { TrendingUp, CalendarClock, PlugZap, ChevronRight } from "lucide-react"
import { AdminSectionCard, AdminStatusChip } from "@/components/admin/ui"

type PlanMixEntry = { label: string; value: number }

interface KpiData {
  total: number
  active: number
  trialing: number
  pastDue: number
  canceled: number
  stripeLinked: boolean
  planMix: PlanMixEntry[]
  mrrPence: number | null
}

interface Props {
  kpis: KpiData
}

export function SubscriptionBillingRailPanel({ kpis }: Props) {
  return (
    <div className="space-y-4">
      <AdminSectionCard title="Stripe sync" icon={PlugZap}>
        <ul className="space-y-2.5 text-[13px]">
          <HealthRow label="Stripe linked" ok={kpis.stripeLinked} pendingLabel="Not wired" />
          <HealthRow label="Amounts populated" ok={kpis.mrrPence != null} pendingLabel="No amounts" />
        </ul>
        <Link href="/admin/stripe-events" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
          Stripe events <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </AdminSectionCard>

      <AdminSectionCard title="Plan distribution" icon={TrendingUp}>
        {kpis.planMix.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-2">No subscriptions yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {kpis.planMix.map((p) => {
              const pct = kpis.total ? Math.round((p.value / kpis.total) * 100) : 0
              return (
                <li key={p.label}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="capitalize text-slate-600">{p.label}</span>
                    <span className="font-semibold text-[#0B1B3F]">
                      {p.value} <span className="text-slate-400 font-normal">· {pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Billing health" icon={CalendarClock}>
        <dl className="space-y-2.5 text-[13px]">
          {[
            { label: "Active", value: kpis.active },
            { label: "Trialing", value: kpis.trialing },
            { label: "Past due", value: kpis.pastDue },
            { label: "Cancelled", value: kpis.canceled },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-semibold text-[#0B1B3F]">{row.value.toLocaleString("en-GB")}</dd>
            </div>
          ))}
        </dl>
      </AdminSectionCard>
    </div>
  )
}

function HealthRow({ label, ok, pendingLabel }: { label: string; ok: boolean; pendingLabel: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <AdminStatusChip tone={ok ? "emerald" : "amber"} dot>{ok ? "Yes" : pendingLabel}</AdminStatusChip>
    </li>
  )
}
