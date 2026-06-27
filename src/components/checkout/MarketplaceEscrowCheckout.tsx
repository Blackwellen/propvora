"use client"

// ============================================================================
// MarketplaceEscrowCheckout — the REAL operator escrow checkout for buying a
// marketplace listing (service / supplier / emergency). Posts to the
// type-agnostic /api/marketplace/checkout (mints transaction + order + escrow
// PaymentIntent), then collects payment via the Stripe Payment Element (card /
// Google Pay / saved cards). Funds are authorised + HELD in escrow and released
// to the seller on completion. Operator-only (B2B). Light tokens only.
// ============================================================================

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, ShieldCheck, Tag } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { CheckoutShell } from "@/features/checkout/components/CheckoutShell"
import { SectionCard } from "@/features/checkout/components/primitives"
import PaymentForm from "@/components/payments/PaymentForm"

export interface MarketplaceEscrowCheckoutProps {
  listingId: string
  buyerWorkspaceId: string
  heading: string
  subheading?: string
  thumbUrl?: string
  metaRows?: { label: string; value: string }[]
  lineItems: { label: string; pence: number }[]
  currency?: string
  trustChips?: string[]
  backHref: string
  backLabel?: string
  successHref?: string
  successHrefLabel?: string
}

export default function MarketplaceEscrowCheckout(props: MarketplaceEscrowCheckoutProps) {
  const currency = props.currency ?? "GBP"
  const total = props.lineItems.reduce((s, l) => s + l.pence, 0)
  const [confirmed, setConfirmed] = useState(false)
  const [intentStatus, setIntentStatus] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  const summary = (
    <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-sm">
      <div className="flex gap-3 border-b border-[#EEF2F9] p-4">
        {props.thumbUrl ? (
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={props.thumbUrl} alt="" fill className="object-cover" sizes="80px" />
          </div>
        ) : (
          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-[#EFF5FF] text-[var(--brand)]">
            <MapPin className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-tight text-[#0B1B3F]">{props.heading}</p>
          {props.subheading && <p className="mt-0.5 text-[12px] text-slate-500">{props.subheading}</p>}
        </div>
      </div>
      {props.metaRows && props.metaRows.length > 0 && (
        <div className="space-y-1.5 border-b border-[#EEF2F9] px-4 py-3 text-[12.5px]">
          {props.metaRows.map((m) => (
            <div key={m.label} className="flex items-start justify-between gap-3">
              <span className="shrink-0 text-slate-500">{m.label}</span>
              <span className="min-w-0 break-words text-right font-medium text-[#0B1B3F]">{m.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2 px-4 py-3 text-[13px]">
        {props.lineItems.map((l) => (
          <div key={l.label} className="flex items-start justify-between gap-3 text-slate-600">
            <span className="min-w-0 break-words">{l.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-[#0B1B3F]">{formatPence(l.pence, currency)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[#EEF2F9] px-4 py-3.5">
        <span className="text-[14px] font-bold text-[#0B1B3F]">Total due now</span>
        <span className="text-[18px] font-extrabold tabular-nums text-[#0B1B3F]">{formatPence(total, currency)}</span>
      </div>
      <ul className="space-y-2 border-t border-[#EEF2F9] px-4 py-3 text-[12px] text-slate-500">
        <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> Funds held in escrow until the work is completed</li>
        <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" /> Authorised now, released to the supplier on completion</li>
      </ul>
      {props.trustChips && props.trustChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#EEF2F9] px-4 py-3">
          {props.trustChips.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-[#F1F6FF] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-strong)]">
              <ShieldCheck className="h-3 w-3" /> {c}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  if (confirmed) {
    const held = intentStatus === "requires_capture" || intentStatus === "succeeded" || intentStatus === "processing"
    return (
      <CheckoutShell step="review" title="Order confirmed" summary={summary} embedded>
        <SectionCard title={held ? "Payment authorised — held in escrow" : "Order created"}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#0B1B3F]">{props.heading}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                {held
                  ? <>Your payment of <strong>{formatPence(total, currency)}</strong> is <strong>held securely in escrow</strong> and released to the supplier once the work is completed.</>
                  : <>Your order has been created. Online payment will be arranged shortly.</>}
              </p>
              {paymentId && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F1F6FF] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--brand-strong)]">
                  <Tag className="h-3.5 w-3.5" /> Ref {paymentId.slice(0, 8).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
        <Link
          href={props.successHref ?? "/property-manager/work/jobs"}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
        >
          {props.successHrefLabel ?? "View in Work"} <ArrowRight className="h-4 w-4" />
        </Link>
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell step="payment" title="Book & pay securely" summary={summary} embedded>
      <Link href={props.backHref} className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-[var(--brand-strong)]">
        <ArrowLeft className="h-3.5 w-3.5" /> {props.backLabel ?? "Back"}
      </Link>
      <SectionCard title="Secure escrow payment" description="Your card is authorised now and held in escrow — released to the supplier when the work is completed.">
        <PaymentForm
          bookingRef={props.listingId}
          amountPence={total}
          currency={currency}
          intentRequest={{ url: "/api/marketplace/checkout", body: { listingId: props.listingId, buyerWorkspaceId: props.buyerWorkspaceId, quantity: 1 } }}
          onResult={(r) => { setIntentStatus(r.intentStatus); setPaymentId(r.paymentId); setConfirmed(true) }}
        />
      </SectionCard>
    </CheckoutShell>
  )
}
