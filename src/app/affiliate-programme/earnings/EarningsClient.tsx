"use client"

import { useState } from "react"
import { levelForReferrals } from "@/lib/affiliate/levels"

const REFERRAL_TIERS = [3, 10, 25, 50, 100]
const PLAN_PRICES = [29, 49, 79, 129]

function gbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n)
}

export default function EarningsClient() {
  const [plan, setPlan] = useState(49)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#0D1B2A]">Earnings examples</h1>
        <p className="mt-2 text-sm text-slate-600">
          Illustrative estimates based on the average subscription you refer. Higher referral counts unlock
          higher commission bands.
        </p>
      </div>

      {/* Plan price selector */}
      <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
        <span className="text-sm text-slate-500">Average plan price:</span>
        {PLAN_PRICES.map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold border transition-all ${
              plan === p
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            {gbp(p)}/mo
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2">Paying customers</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Monthly commission</th>
              <th className="px-4 py-2">6-month total</th>
            </tr>
          </thead>
          <tbody>
            {REFERRAL_TIERS.map((count) => {
              const lvl = levelForReferrals(count)
              const monthly = plan * count * lvl.rate
              const sixMonth = monthly * lvl.durationMonths
              return (
                <tr key={count} className="bg-white">
                  <td className="px-4 py-3 rounded-l-xl border-y border-l border-slate-200 font-semibold text-slate-900">
                    {count}
                  </td>
                  <td className="px-4 py-3 border-y border-slate-200 text-slate-600">{lvl.name}</td>
                  <td className="px-4 py-3 border-y border-slate-200 text-[#2563EB] font-semibold">
                    {Math.round(lvl.rate * 100)}%
                  </td>
                  <td className="px-4 py-3 border-y border-slate-200 text-slate-700">{gbp(monthly)}</td>
                  <td className="px-4 py-3 rounded-r-xl border-y border-r border-slate-200 font-semibold text-emerald-600">
                    {gbp(sixMonth)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-xs text-slate-400 leading-relaxed">
        These are illustrative examples only. Actual earnings depend on approved referrals, the customer's
        plan, payment status, refunds, chargebacks, cancellations, attribution rules and programme terms.
        Commission accrues for up to 6 months per referral and clears after a 30-day cooling-off period.
      </p>
    </div>
  )
}
