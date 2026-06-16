import Link from "next/link"
import { ArrowLeft, CalendarDays, ShieldCheck, Lock, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPublicListingDetail } from "@/lib/booking"

export const dynamic = "force-dynamic"
export const metadata = { title: "Complete your booking · Propvora" }

/**
 * Checkout bridge: /booking/checkout/[draftId]
 *
 * The draftId may be a slug (from /stay/[slug]/checkout redirect) or a
 * real draft reservation ID. Try to resolve the listing for a rich summary;
 * if unresolvable, show a generic "go back to the listing" page.
 * The real checkout flow happens through StayBookingCard → /api/booking/listing/reserve → /pay.
 */
export default async function BookingCheckoutDraftPage({
  params,
}: {
  params: Promise<{ draftId: string }>
}) {
  const { draftId } = await params
  const supabase = await createClient()

  // Best-effort: resolve as a listing slug.
  const listing = await getPublicListingDetail(supabase, decodeURIComponent(draftId)).catch(() => null)
  const listingHref = listing ? `/stay/${encodeURIComponent(listing.slug ?? listing.id)}` : "/stay/search"
  const listingTitle = listing?.title ?? "your stay"
  const fromPence = listing?.fromNightlyPence
  const currency = listing?.currency ?? "GBP"

  function fmtMoney(pence: number, cur: string) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: cur, minimumFractionDigits: 0 }).format(pence / 100)
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
        <Link
          href={listingHref}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-[#1D4ED8] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {listingTitle}
        </Link>

        <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-7 pb-6 border-b border-[#EEF3FB]">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Booking checkout</p>
            <h1 className="text-[22px] font-bold text-[#0B1B3F] leading-tight">
              Complete your booking
            </h1>
            {listing && (
              <p className="mt-1 text-[13.5px] text-slate-500">{listing.title}</p>
            )}
            {fromPence != null && (
              <p className="mt-1 text-[13.5px] font-semibold text-[#0B1B3F]">
                From {fmtMoney(fromPence, currency)} per night
              </p>
            )}
          </div>

          {/* Security note */}
          <div className="px-6 sm:px-8 py-4 flex items-start gap-2.5 bg-emerald-50 border-b border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[12.5px] leading-relaxed text-emerald-700">
              Your payment is held securely in escrow until check-in. We never release funds to the host until
              your stay is confirmed and completed.
            </p>
          </div>

          {/* Steps */}
          <div className="px-6 sm:px-8 py-7 space-y-5">
            <h2 className="text-[15px] font-bold text-[#0B1B3F]">How booking works</h2>
            <ol className="space-y-5">
              {[
                {
                  icon: CalendarDays,
                  title: "Choose your dates",
                  body: "Select check-in and check-out dates. Availability is live — blocked dates reflect real reservations.",
                },
                {
                  icon: CreditCard,
                  title: "See the full price",
                  body: "Your total — including all fees — is shown before you confirm. No surprises at payment.",
                },
                {
                  icon: Lock,
                  title: "Secure payment",
                  body: "Pay by card. Funds are held in escrow until your stay completes, then released to the host.",
                },
                {
                  icon: ShieldCheck,
                  title: "Confirmation",
                  body: "You receive a booking reference immediately. The property manager confirms your stay and sends arrival details.",
                },
              ].map(({ icon: Icon, title, body }, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-[#0B1B3F]">{title}</span>
                    <span className="block text-[13px] text-slate-500 leading-relaxed mt-0.5">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA */}
          <div className="px-6 sm:px-8 pb-8">
            <Link
              href={`${listingHref}#booking-card`}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1D4ED8] text-[14.5px] font-semibold text-white hover:bg-[#1A45BE] transition-colors"
            >
              Choose dates &amp; book
            </Link>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-slate-400">
              <Lock className="w-3.5 h-3.5" /> No payment taken until you confirm
            </p>
          </div>
        </div>

        <p className="text-center text-[11.5px] text-slate-400 mt-6">
          Powered by <span className="font-semibold text-slate-500">Propvora</span> · Secure direct booking
        </p>
      </div>
    </main>
  )
}
