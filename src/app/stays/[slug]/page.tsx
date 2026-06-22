import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, ChevronRight, Star } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import StayBookingCard from '@/components/public-marketplace/profiles/StayBookingCard'
import ShareSaveButtons from '@/components/checkout/ShareSaveButtons'
import LocationMap from '@/components/maps/LocationMap'
import { getPublicStayBySlug } from '@/lib/public-marketplace/queries'
import { SEED_STAYS } from '@/lib/public-marketplace/seed-fallback'

export async function generateStaticParams() {
  return SEED_STAYS.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const stay = await getPublicStayBySlug(slug)
  if (!stay) return {}
  return {
    title: `${stay.title} | Propvora Stays`,
    description: stay.description ?? `Book ${stay.title} — ${stay.location}`,
  }
}

export default async function StayDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const stay = await getPublicStayBySlug(slug)
  if (!stay) notFound()

  const galleryImages = [stay.heroImage, ...stay.gallery].filter(Boolean)

  return (
    <PublicPageShell marketplaceNav hideFooter>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-[13px] font-[500] text-slate-500">
          <Link href="/stays" className="hover:text-slate-900">Stays</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{stay.city}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 truncate max-w-xs">{stay.title}</span>
        </nav>

        {/* Top badges + actions */}
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {stay.verified && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                <CheckCircle className="h-3 w-3" />Verified stay
              </span>
            )}
          </div>
          <ShareSaveButtons slug={stay.slug} storageKey="propvora_saved_stays" title={stay.title} />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-[28px] font-[800] leading-[1.12] text-slate-950">{stay.title}</h1>

        {/* Subtitle row */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">
            {stay.location} • {stay.beds} bedroom{stay.beds !== 1 ? 's' : ''} • {stay.bathrooms} bathroom{stay.bathrooms !== 1 ? 's' : ''} • {stay.guests} guests
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 font-semibold text-slate-900">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />{stay.rating}
            </span>
            <span className="text-slate-500">({stay.reviewCount} reviews)</span>
            <span className="text-emerald-600 font-medium">Excellent location</span>
          </div>
        </div>

        {/* Main grid: content + sticky sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 min-w-0">
        {galleryImages.length > 0 && (
          <div className="relative mb-4 grid h-[362px] grid-cols-5 gap-2 overflow-hidden rounded-[12px]">
            {/* Large image left (55%) */}
            <div className="col-span-3 relative">
              <Image
                src={galleryImages[0]}
                alt={stay.title}
                fill
                className="object-cover"
                sizes="55vw"
                priority
              />
              {/* View all photos button */}
              <button className="absolute bottom-4 left-4 rounded-[8px] bg-black/65 px-4 py-2 text-[13px] font-[800] text-white shadow transition-colors hover:bg-black/75">
                View all photos ({galleryImages.length + 20})
              </button>
            </div>
            {/* 2x2 grid right (45%) */}
            <div className="col-span-2 grid grid-rows-2 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="relative overflow-hidden rounded-sm">
                  <Image
                    src={galleryImages[i] ?? galleryImages[0]}
                    alt={`${stay.title} photo ${i + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="22vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

            <div className="space-y-4">
            {/* Host strip */}
            <div className="flex items-center gap-4 rounded-[12px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
                <Image src={stay.hostAvatar} alt={stay.hostName} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[16px] font-[800] text-slate-950">Hosted by {stay.hostName}</span>
                  {stay.hostProBadge && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">Pro</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  Professional Host · {stay.hostProperties} properties · {stay.hostRating}★
                </p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-xs text-slate-600 shrink-0">
                <div className="text-center">
                  <p className="font-semibold text-slate-900">{stay.hostResponseTime}</p>
                  <p className="text-slate-400">Typically replies</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900">Pro</p>
                  <p className="text-slate-400">Management</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900">24/7</p>
                  <p className="text-slate-400">Guest support</p>
                </div>
              </div>
            </div>

            {/* About */}
            {stay.description && (
              <div className="rounded-[12px] border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-[18px] font-[800] text-slate-950">About this stay</h2>
                <p className="max-w-3xl text-[14px] leading-6 text-slate-600">{stay.description}</p>
              </div>
            )}

            {/* Amenities */}
            {stay.amenities.length > 0 && (
              <div className="rounded-[12px] border border-slate-200 bg-white p-4">
                <h2 className="mb-4 text-[18px] font-[800] text-slate-950">What&apos;s included</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {stay.amenities.map(a => (
                    <span key={a} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <CheckCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />{a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms */}
            {stay.rooms && stay.rooms.length > 0 && (
              <div className="rounded-[12px] border border-slate-200 bg-white p-4">
                <h2 className="mb-4 text-[18px] font-[800] text-slate-950">Room breakdown</h2>
                <div className="grid grid-cols-2 gap-3">
                  {stay.rooms.map(room => (
                    <div key={room.name} className="p-4 bg-white border border-slate-200 rounded-xl">
                      <p className="font-semibold text-slate-900 text-sm mb-1">{room.name}</p>
                      <p className="text-sm text-slate-500">{room.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules + Policy + Protection */}
            {(stay.houseRules?.length || stay.cancellationPolicy) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stay.houseRules && stay.houseRules.length > 0 && (
                  <div className="rounded-[12px] border border-slate-200 bg-white p-4">
                    <h3 className="font-semibold text-slate-900 text-sm mb-3">House rules</h3>
                    <ol className="space-y-2">
                      {stay.houseRules.slice(0, 4).map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="shrink-0 w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                          {rule}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {stay.cancellationPolicy && (
                  <div className="rounded-[12px] border border-slate-200 bg-white p-4">
                    <h3 className="font-semibold text-amber-900 text-sm mb-2">Cancellation policy</h3>
                    <p className="text-xs text-amber-800 leading-relaxed">{stay.cancellationPolicy}</p>
                  </div>
                )}
                <div className="rounded-[12px] border border-slate-200 bg-white p-4">
                  <h3 className="font-semibold text-blue-900 text-sm mb-2">Booking protection</h3>
                  <p className="text-xs text-blue-800 leading-relaxed">All bookings are protected by Propvora secure payments and dispute resolution.</p>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="rounded-[12px] border border-slate-200 bg-white p-4">
              <h2 className="mb-4 text-[18px] font-[800] text-slate-950">Location overview</h2>
              <LocationMap
                markers={[{ id: stay.slug, lat: stay.lat, lng: stay.lng, label: stay.title, sublabel: stay.location }]}
                height={224}
                zoom={14}
                title={stay.location}
              />
            </div>

            {/* Reviews */}
            <div className="rounded-[12px] border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold text-slate-900">Guest reviews</h2>
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-bold text-slate-900">{stay.rating}</span>
                  <span className="text-sm text-slate-500">({stay.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Sarah M.', date: 'May 2026', text: 'Absolutely stunning apartment. Everything exactly as described and the host was incredibly responsive.' },
                  { name: 'James T.', date: 'April 2026', text: 'Perfect location, clean and well-equipped. Loved the balcony views. Great value for money.' },
                  { name: 'Priya K.', date: 'March 2026', text: 'Lovely stay, felt very at home. The amenities were great and check-in was smooth and easy.' },
                ].map(review => (
                  <div key={review.name} className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                        <p className="text-xs text-slate-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />)}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          </div>

          {/* Sticky booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <StayBookingCard stay={stay} />
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
