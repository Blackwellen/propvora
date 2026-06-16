import type { Metadata } from "next"
import Link from "next/link"
import { SearchX } from "lucide-react"
import { publicGetListing } from "@/components/marketplace-public/data"
import { resolvePublicSession } from "@/components/marketplace-public/session"
import PublicListingDetail from "@/components/marketplace-public/PublicListingDetail"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const l = await publicGetListing(slug)
  if (!l) return { title: "Stay · Propvora Marketplace" }
  return {
    title: `${l.title} · Propvora Marketplace`,
    description: l.description?.slice(0, 160) ?? "Book this stay directly with escrow protection.",
    openGraph: { images: l.images.slice(0, 1) },
  }
}

export default async function StayDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [listing, session] = await Promise.all([publicGetListing(slug), resolvePublicSession()])
  if (!listing) return <NotFound />
  return <PublicListingDetail listing={listing} session={session} />
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <SearchX className="w-8 h-8 text-slate-300" />
      </div>
      <h1 className="text-[19px] font-bold text-[#0B1B3F]">This stay isn&apos;t available</h1>
      <p className="mt-2 text-[13.5px] text-slate-500">It may have been unpublished or is no longer accepting bookings.</p>
      <Link href="/marketplace/stays" className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors">Browse stays</Link>
    </div>
  )
}
