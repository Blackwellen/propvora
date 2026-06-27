"use client"

import Link from "next/link"
import { CalendarCheck, Info, Lock, ShieldCheck, Clock, Star, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { PriceTag, formatPence } from "@/components/marketplace/PriceTag"
import { TrustBadge } from "@/components/marketplace/TrustBadge"
import QuoteRequestForm from "@/components/marketplace-public/QuoteRequestForm"
import type { IntentMeta } from "@/components/marketplace-public/intent"
import type { TrustKind } from "@/components/marketplace/TrustBadge"

interface Session {
  signedIn: boolean
  email?: string | null
  name?: string | null
  buyerWorkspaceId?: string | null
}

interface Props {
  listingId: string
  /** Listing title — reserved for future use in booking context display. */
  title?: string
  basePricePence: number | null
  currency: string | null | undefined
  pricingModel: string | null | undefined
  instantBook: boolean | null | undefined
  intent: IntentMeta
  trust: TrustKind[]
  session?: Session
}

function PriceBreakdown({ pence, currency }: { pence: number; currency: string }) {
  const fee = Math.round(pence * 0.025)
  const total = pence + fee
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[12.5px]">
      <div className="flex items-center justify-between">
        <span className="text-slate-500">Listing price</span>
        <span className="font-medium text-slate-700 tabular-nums">{formatPence(pence, currency)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-400">Platform fee (2.5%)</span>
        <span className="font-medium text-slate-700 tabular-nums">{formatPence(fee, currency)}</span>
      </div>
      <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[13px] font-bold text-slate-800">Estimated total</span>
        <span className="text-[14px] font-bold text-slate-900 tabular-nums">{formatPence(total, currency)}</span>
      </div>
    </div>
  )
}

/**
 * Sticky right-rail booking panel — price display, CTA (checkout or quote), and
 * trust badge strip. Covers both checkout intents (stays / services) and quote
 * intents (suppliers / emergency).
 */
export default function StayBookingPanel({
  listingId,

  basePricePence,
  currency,
  pricingModel,
  instantBook,
  intent,
  trust,
  session,
}: Props) {
  const isStay = intent.key === "stays"
  const isCheckout = intent.cta === "checkout"

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-[72px]">
      {/* Price + CTA card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-5">
        <div className="flex items-baseline justify-between">
          <PriceTag
            pence={basePricePence}
            currency={currency}
            pricingModel={pricingModel}
            size="lg"
          />
          {instantBook && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--brand)]">
              <Zap className="w-3.5 h-3.5" /> Instant
            </span>
          )}
        </div>

        {isCheckout && basePricePence != null && basePricePence > 0 && (
          <PriceBreakdown pence={basePricePence} currency={currency ?? "GBP"} />
        )}

        <div className="mt-4">
          {isCheckout ? (
            <Link
              href={`/marketplace/checkout/${listingId}`}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--brand)] text-white text-[14.5px] font-semibold shadow-[0_2px_12px_rgba(37,99,235,0.32)] hover:bg-[var(--brand-strong)] transition-colors"
            >
              <CalendarCheck className="w-4.5 h-4.5" />
              {isStay ? "Reserve this stay" : "Book this service"}
            </Link>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-[12px] font-semibold text-slate-500">
                {intent.key === "emergency" ? (
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                )}
                {intent.key === "emergency"
                  ? "Responds now — request a call-out"
                  : "Request a quote from this supplier"}
              </div>
              <QuoteRequestForm
                listingId={listingId}
                defaultEmail={session?.email ?? null}
                defaultName={session?.name ?? null}
                buyerWorkspaceId={session?.buyerWorkspaceId ?? null}
                urgent={intent.key === "emergency"}
              />
            </div>
          )}
        </div>

        {isCheckout && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {session?.signedIn
              ? "You'll confirm payment securely on the next step."
              : "You'll sign in to confirm payment securely."}
          </p>
        )}
      </div>

      {/* Trust badges */}
      {trust.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-[13.5px] font-bold text-slate-900 mb-3">
            Why you can trust this listing
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {trust.map((t) => (
              <TrustBadge key={t} kind={t} size="md" />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
