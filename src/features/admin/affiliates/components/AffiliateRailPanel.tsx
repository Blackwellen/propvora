import React from "react"
import Link from "next/link"
import { Award, CalendarClock, ShieldCheck, ChevronRight } from "lucide-react"
import { AdminSectionCard } from "@/components/admin/ui"

type TopPerformer = { id: string; name: string | null; code: string; referrals: number }

interface KpiData {
  pendingPayoutPence: number
  clearedPence: number
  paidPence: number
}

interface Props {
  kpis: KpiData
  topPerformers: TopPerformer[]
  formatPence: (pence: number) => string
}

export function AffiliateRailPanel({ kpis, topPerformers, formatPence }: Props) {
  return (
    <div className="space-y-4">
      <AdminSectionCard title="Top performers" icon={Award}>
        {topPerformers.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-2">No affiliates yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {topPerformers.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/affiliates/${a.id}`} className="flex items-center justify-between gap-2 group">
                  <span className="text-[13px] font-medium text-[#0B1B3F] group-hover:text-[var(--brand)] truncate">
                    {a.name ?? a.code}
                  </span>
                  <span className="text-[12px] text-slate-500 shrink-0">
                    {a.referrals} refs{" "}
                    <ChevronRight className="inline w-3.5 h-3.5 text-slate-300" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Payout schedule" icon={CalendarClock}>
        <dl className="space-y-2.5 text-[13px]">
          {[
            { label: "Pending", value: formatPence(kpis.pendingPayoutPence), cls: "text-amber-600" },
            { label: "Cleared", value: formatPence(kpis.clearedPence), cls: "text-violet-600" },
            { label: "Paid total", value: formatPence(kpis.paidPence), cls: "text-emerald-600" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className={`font-semibold tabular-nums ${row.cls}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-slate-400">
          Cleared balances become payable after the 30-day cooling-off window. Payouts are feature-flagged.
        </p>
      </AdminSectionCard>

      <AdminSectionCard title="Compliance and KYC" icon={ShieldCheck}>
        <p className="text-[13px] text-slate-500">
          Affiliate KYC and payout-method verification are required before any payout is released.
        </p>
        <Link href="/admin/id-verification" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] hover:underline">
          Verification queue <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </AdminSectionCard>
    </div>
  )
}
