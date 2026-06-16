import Link from "next/link"
import { SearchX, ShieldCheck } from "lucide-react"
import { publicGetListing } from "@/components/marketplace-public/data"
import { resolvePublicSession } from "@/components/marketplace-public/session"
import { intentForTransactionType } from "@/components/marketplace-public/intent"
import QuoteRequestForm from "@/components/marketplace-public/QuoteRequestForm"
import { PriceTag } from "@/components/marketplace/PriceTag"

/* /marketplace/request/[requestId] — a focused "request a quote" page for a
   supplier/emergency listing. `requestId` is the listing id. The form POSTs a
   REAL `marketplace_enquiries` row via /api/marketplace/enquiries. */

export const dynamic = "force-dynamic"

export default async function RequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params
  const [listing, session] = await Promise.all([publicGetListing(requestId), resolvePublicSession()])

  if (!listing) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-8 h-8 text-slate-300" />
        </div>
        <h1 className="text-[19px] font-bold text-[#0B1B3F]">This listing isn&apos;t available</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">It may have been unpublished or is no longer taking requests.</p>
        <Link href="/marketplace/suppliers" className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors">Browse suppliers</Link>
      </div>
    )
  }

  const intent = intentForTransactionType(listing.transactionType)
  const urgent = intent.key === "emergency"

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-[#EEF3FB]">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">{urgent ? "Emergency request" : "Request a quote"}</p>
          <h1 className="text-[19px] font-bold text-[#0B1B3F] mt-1">{listing.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-[12.5px] text-slate-500">
            <span>From</span>
            <PriceTag pence={listing.basePricePence} currency={listing.currency} pricingModel={listing.pricingModel} size="sm" />
          </div>
        </div>
        <div className="px-6 sm:px-8 py-6">
          <QuoteRequestForm
            listingId={listing.id}
            defaultEmail={session.email}
            defaultName={session.name}
            buyerWorkspaceId={session.buyerWorkspaceId}
            urgent={urgent}
          />
        </div>
        <div className="px-6 sm:px-8 py-4 flex items-start gap-2.5 bg-[#F7F9FC] border-t border-[#EEF3FB]">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[12px] leading-relaxed text-slate-500">
            Your request goes straight to the supplier. No payment is taken now — you agree pricing before any work begins.
          </p>
        </div>
      </div>
    </div>
  )
}
