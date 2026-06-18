"use client"

import React, { useState } from "react"
import {
  CalendarClock, RefreshCw, Receipt, ArrowUpRight, ArrowDownRight,
  Phone, Heart, LifeBuoy, ChevronRight, ShieldX,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useSubscription, useRenewalEvents, useCancellation, useBillingProfile } from "../data/hooks"
import { formatBillingDate } from "../data/calc"
import { BillingCard, Row, StatusBadge, BillingButton } from "./ui"

const STATUS_TONE: Record<string, "blue" | "emerald" | "amber" | "red" | "slate"> = {
  active: "emerald",
  trialing: "blue",
  past_due: "amber",
  cancelled: "red",
  paused: "amber",
}

const BASE = "/property-manager/workspace/billing"

/** Right-hand summary rail shown across all billing tabs. */
export function BillingSummaryRail({ basePath = BASE }: { basePath?: string }) {
  const { data: sub } = useSubscription()
  const { data: renewals } = useRenewalEvents()
  const { data: cancellation } = useCancellation()
  const { data: profile } = useBillingProfile()
  const [showBreakdown, setShowBreakdown] = useState(false)

  const estimate = renewals.find((r) => r.kind === "estimate") ?? null
  const taxPct = Math.round(profile.taxRateBps / 100)

  return (
    <aside className="space-y-4 lg:w-[320px] lg:shrink-0">
      {/* Renewal summary */}
      <BillingCard title="Renewal summary" icon={CalendarClock}>
        <div className="space-y-0.5">
          <Row
            label="Status"
            value={
              <StatusBadge tone={STATUS_TONE[sub.status] ?? "slate"}>
                {sub.status === "active" ? "Active" : sub.status.replace("_", " ")}
              </StatusBadge>
            }
          />
          <Row label="Next renewal" value={formatBillingDate(sub.currentPeriodEnd)} />
          <Row
            label="Auto-renew"
            value={
              <StatusBadge tone={sub.autoRenew ? "emerald" : "slate"}>
                {sub.autoRenew ? "On" : "Off"}
              </StatusBadge>
            }
          />
          <Row
            label="Upcoming invoice"
            value={estimate?.amountPence != null ? `${formatPence(estimate.amountPence)} inc. VAT` : "—"}
          />
        </div>

        {showBreakdown && estimate?.amountPence != null && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 space-y-1">
            <Row label="Base plan" value={formatPence(sub.basePricePence)} />
            <Row label={`VAT (${taxPct}%)`} value={formatPence(Math.round(estimate.amountPence - estimate.amountPence / (1 + taxPct / 100)))} />
            <Row label="Total" value={<span className="font-bold">{formatPence(estimate.amountPence)}</span>} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
        >
          {showBreakdown ? "Hide breakdown" : "View full breakdown"}
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showBreakdown ? "rotate-90" : ""}`} />
        </button>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <BillingButton href={`${basePath}/checkout`} variant="primary" icon={ArrowUpRight} className="text-[12px] px-3">
            Upgrade
          </BillingButton>
          <BillingButton href={`${basePath}/checkout`} variant="ghost" icon={ArrowDownRight} className="text-[12px] px-3">
            Downgrade
          </BillingButton>
        </div>
        <BillingButton
          href="mailto:sales@propvora.com?subject=Subscription%20enquiry"
          variant="secondary"
          icon={Phone}
          className="w-full mt-2 text-[12px]"
        >
          Contact sales
        </BillingButton>
      </BillingCard>

      {/* Cancellation summary */}
      <BillingCard title="Cancellation" icon={ShieldX}>
        {cancellation ? (
          <div className="space-y-0.5">
            <Row label="Status" value={<StatusBadge tone="amber">Scheduled</StatusBadge>} />
            <Row label="Access until" value={formatBillingDate(cancellation.accessUntil)} />
            <Row label="Data retained" value={`${cancellation.dataRetentionDays} days`} />
          </div>
        ) : (
          <>
            <p className="text-[12.5px] text-slate-500">
              No cancellation scheduled. Your plan renews automatically. You can cancel any time and keep
              access until the end of your term.
            </p>
            <BillingButton href={`${basePath}/cancellation`} variant="ghost" className="w-full mt-3 text-[12px]">
              Manage cancellation
            </BillingButton>
          </>
        )}
      </BillingCard>

      {/* Retention card */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Heart className="w-4 h-4 text-emerald-600" />
          <h3 className="text-[13.5px] font-bold text-emerald-800">We value your business</h3>
        </div>
        <p className="text-[12px] text-emerald-700 leading-relaxed">
          Thinking of leaving? Claim 2 months free when you stay on an annual plan — our way of saying thanks.
        </p>
        <BillingButton href={`${basePath}/cancellation`} variant="secondary" className="w-full mt-3 text-[12px] border-emerald-600 text-emerald-700 hover:bg-emerald-100">
          See retention offer
        </BillingButton>
      </div>

      {/* Need help */}
      <BillingCard title="Need help?" icon={LifeBuoy}>
        <p className="text-[12.5px] text-slate-500">
          Questions about invoices, VAT or your plan? Our billing team is here to help.
        </p>
        <div className="mt-3 space-y-2">
          <BillingButton href="mailto:billing@propvora.com" variant="ghost" icon={Receipt} className="w-full text-[12px]">
            Email billing support
          </BillingButton>
          <BillingButton href={`${basePath}/history`} variant="ghost" icon={RefreshCw} className="w-full text-[12px]">
            View billing history
          </BillingButton>
        </div>
      </BillingCard>
    </aside>
  )
}
