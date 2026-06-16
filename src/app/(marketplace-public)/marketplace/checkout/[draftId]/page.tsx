import Link from "next/link"
import { SearchX } from "lucide-react"
import { publicGetListing } from "@/components/marketplace-public/data"
import { resolvePublicSession } from "@/components/marketplace-public/session"
import CheckoutClient from "@/components/marketplace-public/CheckoutClient"

/* Public marketplace checkout. `draftId` is the listing id of the item being
   bought (the "draft" of the order). The CheckoutClient drives the REAL escrow
   checkout API (POST /api/marketplace/checkout) + Stripe Elements. Anon users
   are prompted to sign in (returning here) before payment. */

export const dynamic = "force-dynamic"

export default async function CheckoutPage({ params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params
  const [listing, session] = await Promise.all([publicGetListing(draftId), resolvePublicSession()])

  if (!listing) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-8 h-8 text-slate-300" />
        </div>
        <h1 className="text-[19px] font-bold text-[#0B1B3F]">This item isn&apos;t available to book</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">It may have been unpublished or sold out.</p>
        <Link href="/marketplace" className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors">Back to marketplace</Link>
      </div>
    )
  }

  return (
    <CheckoutClient
      listingId={listing.id}
      listingTitle={listing.title}
      pricePence={listing.basePricePence}
      currency={listing.currency ?? "GBP"}
      signedIn={session.signedIn}
      buyerWorkspaceId={session.buyerWorkspaceId}
      returnTo={`/marketplace/checkout/${listing.id}`}
    />
  )
}
