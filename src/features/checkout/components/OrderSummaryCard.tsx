"use client"

// ============================================================================
// Order / price summary card — the sticky right rail on every checkout screen.
// Pure presentation over a CheckoutPriceBreakdown. Money is integer pence.
// ============================================================================

import { formatPence } from "@/lib/marketplace/money"
import { ShieldCheck } from "lucide-react"
import type { CheckoutPriceBreakdown, CheckoutType } from "../data/types"

function Row({
  label,
  pence,
  currency,
  muted,
  negative,
}: {
  label: string
  pence: number
  currency: string
  muted?: boolean
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className={muted ? "text-slate-500" : "text-slate-600"}>{label}</span>
      <span className={`tabular-nums font-medium ${negative ? "text-emerald-600" : "text-slate-700"}`}>
        {negative ? "− " : ""}
        {formatPence(Math.abs(pence), currency)}
      </span>
    </div>
  )
}

export function OrderSummaryCard({
  type,
  breakdown,
  thumbUrl,
  heading,
  subheading,
}: {
  type: CheckoutType
  breakdown: CheckoutPriceBreakdown
  thumbUrl?: string | null
  heading: string
  subheading?: string
}) {
  const c = breakdown.currency
  const isRange = type === "emergency" || type === "quote_request"
  const vatPct = (breakdown.vat_rate_bps / 100).toFixed(0)

  return (
    <aside className="rounded-2xl border border-[#E2EAF6] bg-white shadow-sm lg:sticky lg:top-20">
      <div className="flex items-center gap-3 border-b border-[#EEF2F9] px-5 py-4">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EFF5FF] text-[var(--brand)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#0B1B3F]">{heading}</p>
          {subheading ? <p className="truncate text-[12px] text-slate-500">{subheading}</p> : null}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="divide-y divide-[#F1F5FB]">
          {breakdown.subtotal_pence > 0 ? (
            <Row label="Subtotal" pence={breakdown.subtotal_pence} currency={c} />
          ) : null}
          {breakdown.cleaning_fee_pence > 0 ? (
            <Row label="Cleaning fee" pence={breakdown.cleaning_fee_pence} currency={c} />
          ) : null}
          {breakdown.service_fee_pence > 0 ? (
            <Row label="Service fee" pence={breakdown.service_fee_pence} currency={c} />
          ) : null}
          {breakdown.platform_fee_pence > 0 ? (
            <Row label="Platform fee" pence={breakdown.platform_fee_pence} currency={c} />
          ) : null}
          {breakdown.discount_pence > 0 ? (
            <Row label="Promo discount" pence={breakdown.discount_pence} currency={c} negative />
          ) : null}
          {breakdown.vat_pence > 0 ? (
            <Row label={`VAT (${vatPct}%)`} pence={breakdown.vat_pence} currency={c} muted />
          ) : null}
          {breakdown.deposit_hold_pence > 0 ? (
            <Row
              label={type === "booking" ? "Refundable deposit (hold)" : "Escrow protection (hold)"}
              pence={breakdown.deposit_hold_pence}
              currency={c}
              muted
            />
          ) : null}
        </div>

        <div className="mt-3 border-t border-[#E2EAF6] pt-3">
          {isRange && breakdown.estimate_low_pence != null && breakdown.estimate_high_pence != null ? (
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#0B1B3F]">
                {type === "quote_request" ? "Estimated range" : "Estimated total"}
              </span>
              <span className="text-[15px] font-bold tabular-nums text-[#0B1B3F]">
                {formatPence(breakdown.estimate_low_pence, c)} – {formatPence(breakdown.estimate_high_pence, c)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#0B1B3F]">Total due now</span>
              <span className="text-[18px] font-bold tabular-nums text-[#0B1B3F]">
                {formatPence(breakdown.total_due_now_pence, c)}
              </span>
            </div>
          )}

          {type === "booking" && breakdown.total_full_pence > breakdown.total_due_now_pence ? (
            <div className="mt-1 flex items-center justify-between text-[12px] text-slate-500">
              <span>Total trip price (incl. deposit hold)</span>
              <span className="tabular-nums">{formatPence(breakdown.total_full_pence, c)}</span>
            </div>
          ) : null}
        </div>

        {breakdown.deposit_hold_pence > 0 ? (
          <p className="mt-3 rounded-lg bg-[#F7FAFF] px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
            {type === "booking"
              ? "A refundable damage deposit is held, not charged, and released after checkout."
              : "Funds are held in escrow and released to the provider only after the work is completed and signed off."}
          </p>
        ) : null}
        {type === "quote_request" ? (
          <p className="mt-3 rounded-lg bg-[#F7FAFF] px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
            No payment is taken now. The supplier reviews your request and sends a quote.
          </p>
        ) : null}
      </div>
    </aside>
  )
}
