import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  BedDouble,
  Bath,
  Users,
  CheckCircle,
  ChevronRight,
  Heart,
  MapPin,
  Share2,
  Shield,
  ShieldCheck,
  Star,
  Wifi,
  Car,
  Utensils,
  Waves,
  Coffee,
  Wind,
  Tv,
  WashingMachine,
  Grid2x2,
} from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import StayBookingCard from '@/components/public-marketplace/profiles/StayBookingCard'
import { getPublicStayBySlug } from '@/lib/public-marketplace/queries'
import { SEED_STAYS } from '@/lib/public-marketplace/seed-fallback'

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'WiFi': Wifi,
  'Free WiFi': Wifi,
  'Parking': Car,
  'Free parking': Car,
  'Kitchen': Utensils,
  'Full kitchen': Utensils,
  'Pool': Waves,
  'Swimming pool': Waves,
  'Coffee maker': Coffee,
  'Air conditioning': Wind,
  'TV': Tv,
  'Washer': WashingMachine,
  'Washing machine': WashingMachine,
}

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

  const reviewSamples = [
    { name: 'Sarah M.', initials: 'SM', date: 'May 2026', text: 'Absolutely stunning apartment. Everything exactly as described and the host was incredibly responsive.' },
    { name: 'James T.', initials: 'JT', date: 'April 2026', text: 'Perfect location, clean and well-equipped. Loved the balcony views. Great value for money.' },
    { name: 'Priya K.', initials: 'PK', date: 'March 2026', text: 'Lovely stay, felt very at home. The amenities were great and check-in was smooth and easy.' },
  ]

  return (
    <PublicPageShell marketplaceNav hideFooter>
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-10">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4 flex items-center gap-1.5 text-[13px] font-[500] text-slate-500">
          <Link href="/stays" className="hover:text-slate-900 transition-colors">Stays</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{stay.city}</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-slate-900 truncate max-w-xs">{stay.title}</span>
        </nav>

        {/* Title + action bar */}
        <div className="mb-1 flex items-start justify-between gap-4">
          <h1 className="text-[26px] font-[800] leading-[1.15] text-slate-950 sm:text-[30px] lg:max-w-[860px]">
            {stay.title}
          </h1>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <button
              aria-label="Save this stay"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              aria-label="Share this stay"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Rating + location row */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-semibold text-slate-900">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" aria-hidden="true" />
            {stay.rating}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{stay.reviewCount} reviews</span>
          <span className="text-slate-400">·</span>
          {stay.verified && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> Verified stay
            </span>
          )}
          <span className="text-slate-400 hidden sm:inline">·</span>
          <span className="flex items-center gap-1 text-slate-500">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />{stay.location}
          </span>
        </div>

        {/* GALLERY — Airbnb 5-grid: 1 large left + 2×2 right */}
        {galleryImages.length > 0 && (
          <div className="relative mb-6 grid h-[340px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[16px] sm:h-[400px]">
            {/* Main large image */}
            <div className="col-span-2 row-span-2 relative overflow-hidden">
              <Image
                src={galleryImages[0]}
                alt={`${stay.title} — main photo`}
                fill
                className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                sizes="50vw"
                priority
              />
            </div>
            {/* 4 smaller thumbnails */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="relative overflow-hidden">
                <Image
                  src={galleryImages[i] ?? galleryImages[0]}
                  alt={`${stay.title} — photo ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-[1.04]"
                  sizes="25vw"
                />
                {i === 3 && galleryImages.length > 5 && (
                  <div className="absolute inset-0 bg-slate-950/40 flex items-end justify-end p-2">
                    <span className="rounded-[6px] bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800">
                      +{galleryImages.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            ))}
            {/* Show all photos */}
            <button
              aria-label={`View all ${galleryImages.length} photos`}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-[8px] border border-white/30 bg-white/90 px-4 py-2 text-[13px] font-[700] text-slate-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
            >
              <Grid2x2 className="h-3.5 w-3.5" aria-hidden="true" />
              Show all photos
            </button>
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_344px]">
          {/* ── Left column ── */}
          <div className="min-w-0 space-y-6">

            {/* Property stat icons */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-2 text-[15px] font-[600] text-slate-800">
                <BedDouble className="h-5 w-5 text-slate-400" aria-hidden="true" />
                {stay.beds} bedroom{stay.beds !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2 text-[15px] font-[600] text-slate-800">
                <Bath className="h-5 w-5 text-slate-400" aria-hidden="true" />
                {stay.bathrooms} bathroom{stay.bathrooms !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2 text-[15px] font-[600] text-slate-800">
                <Users className="h-5 w-5 text-slate-400" aria-hidden="true" />
                Up to {stay.guests} guests
              </div>
              <div className="ml-auto hidden sm:flex items-center gap-1.5 text-sm text-slate-500">
                <span className="text-slate-300">|</span>
                <span className="font-medium text-slate-700">{stay.stayType}</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {stay.verified && (
                <div className="flex items-center gap-2 rounded-[10px] border border-emerald-100 bg-emerald-50 px-3 py-2 text-[13px] font-[600] text-emerald-700">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" /> ID Verified
                </div>
              )}
              {stay.hostProBadge && (
                <div className="flex items-center gap-2 rounded-[10px] border border-blue-100 bg-blue-50 px-3 py-2 text-[13px] font-[600] text-blue-700">
                  <Star className="h-4 w-4 shrink-0 fill-blue-300 text-blue-400" aria-hidden="true" /> Superhost
                </div>
              )}
              {stay.freeCancellation && (
                <div className="flex items-center gap-2 rounded-[10px] border border-slate-100 bg-slate-50 px-3 py-2 text-[13px] font-[600] text-slate-700">
                  <CheckCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> Free cancellation
                </div>
              )}
              {stay.instantBook && (
                <div className="flex items-center gap-2 rounded-[10px] border border-amber-100 bg-amber-50 px-3 py-2 text-[13px] font-[600] text-amber-700">
                  <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> Instant book
                </div>
              )}
            </div>

            {/* Host strip */}
            <div className="flex items-center gap-4 rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100">
                <Image src={stay.hostAvatar} alt={`Host: ${stay.hostName}`} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-[800] text-slate-950">Hosted by {stay.hostName}</span>
                  {stay.hostProBadge && (
                    <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-[700] text-white uppercase tracking-wide">Pro</span>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {stay.hostProperties} propert{stay.hostProperties !== 1 ? 'ies' : 'y'} · {stay.hostRating}★ · {stay.hostReviews} reviews
                </p>
              </div>
              <div className="hidden md:flex shrink-0 items-center gap-6 text-[12px] text-slate-600">
                <div className="text-center">
                  <p className="font-[700] text-slate-900">{stay.hostResponseTime}</p>
                  <p className="text-slate-400 mt-0.5">Response time</p>
                </div>
                <div className="text-center">
                  <p className="font-[700] text-slate-900">24/7</p>
                  <p className="text-slate-400 mt-0.5">Guest support</p>
                </div>
              </div>
            </div>

            {/* About */}
            {stay.description && (
              <div className="rounded-[14px] border border-slate-200 bg-white p-5">
                <h2 className="mb-3 text-[18px] font-[800] text-slate-950">About this stay</h2>
                <p className="leading-[1.8] text-[14.5px] text-slate-600">{stay.description}</p>
              </div>
            )}

            {/* Amenities with icons */}
            {stay.amenities.length > 0 && (
              <div className="rounded-[14px] border border-slate-200 bg-white p-5">
                <h2 className="mb-5 text-[18px] font-[800] text-slate-950">What&apos;s included</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {stay.amenities.map(a => {
                    const Icon = AMENITY_ICONS[a] ?? CheckCircle
                    return (
                      <div key={a} className="flex items-center gap-2.5 rounded-[10px] border border-slate-100 bg-slate-50 px-3 py-2.5 text-[13.5px] font-[500] text-slate-700">
                        <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        {a}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Room breakdown */}
            {stay.rooms && stay.rooms.length > 0 && (
              <div className="rounded-[14px] border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-[18px] font-[800] text-slate-950">Room breakdown</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {stay.rooms.map(room => (
                    <div key={room.name} className="rounded-[10px] border border-slate-100 bg-slate-50 p-4">
                      <p className="font-[700] text-slate-900 text-[13.5px] mb-1">{room.name}</p>
                      <p className="text-[13px] text-slate-500 leading-relaxed">{room.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Things to know: 3-col grid */}
            <div className="rounded-[14px] border border-slate-200 bg-white p-5">
              <h2 className="mb-5 text-[18px] font-[800] text-slate-950">Things to know</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* House rules */}
                <div>
                  <h3 className="mb-3 text-[13px] font-[700] text-slate-900 uppercase tracking-wide">House rules</h3>
                  <ol className="space-y-2.5">
                    {(stay.houseRules && stay.houseRules.length > 0
                      ? stay.houseRules.slice(0, 5)
                      : ['Quiet hours 10pm–8am', 'No smoking indoors', 'No parties or events', 'Pets need prior approval']
                    ).map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{i + 1}</span>
                        {rule}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Cancellation policy */}
                <div>
                  <h3 className="mb-3 text-[13px] font-[700] text-slate-900 uppercase tracking-wide">Cancellation</h3>
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    {stay.cancellationPolicy ?? 'Free cancellation before check-in. After that, the first night is non-refundable.'}
                  </p>
                </div>

                {/* Safety + booking protection */}
                <div>
                  <h3 className="mb-3 text-[13px] font-[700] text-slate-900 uppercase tracking-wide">Safety &amp; security</h3>
                  <div className="space-y-2">
                    {['Smoke detector', 'Carbon monoxide detector', 'First aid kit', 'Fire extinguisher'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-[13px] text-slate-600">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-[14px] border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-[18px] font-[800] text-slate-950">Location</h2>
              <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-[10px] border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 shadow-lg">
                    <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="text-[15px] font-[700] text-slate-800">{stay.location}</p>
                  <p className="mt-1 text-[12px] text-slate-400">{stay.city} · Exact address provided after booking</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-[14px] border border-slate-200 bg-white p-5">
              {/* Header */}
              <div className="mb-6 flex items-center gap-3">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" aria-hidden="true" />
                <span className="text-[22px] font-[800] text-slate-950">{stay.rating}</span>
                <h2 className="text-[18px] font-[800] text-slate-950">·</h2>
                <h2 className="text-[18px] font-[800] text-slate-950">{stay.reviewCount} reviews</h2>
              </div>

              {/* Category ratings */}
              <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-3 border-b border-slate-100 pb-6 sm:grid-cols-3">
                {[
                  { label: 'Cleanliness', score: 4.9 },
                  { label: 'Communication', score: 4.8 },
                  { label: 'Check-in', score: 5.0 },
                  { label: 'Accuracy', score: 4.7 },
                  { label: 'Location', score: 4.9 },
                  { label: 'Value', score: 4.6 },
                ].map(cat => (
                  <div key={cat.label} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-slate-600">{cat.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-16 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-slate-800" style={{ width: `${(cat.score / 5) * 100}%` }} />
                      </div>
                      <span className="text-[12px] font-[600] text-slate-700">{cat.score}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviewSamples.map(review => (
                  <div key={review.name} className="rounded-[12px] border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[12px] font-[800] text-white">
                        {review.initials}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-[700] text-slate-900">{review.name}</p>
                        <p className="text-[11.5px] text-slate-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="mb-2 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column: sticky booking sidebar ── */}
          <aside aria-label="Booking panel" className="hidden lg:block">
            <div className="sticky top-[88px] space-y-4">
              <StayBookingCard stay={stay} />
              <div className="rounded-[14px] border border-slate-200 bg-white p-5">
                <h3 className="mb-4 text-[14px] font-[800] text-slate-950">Book with confidence</h3>
                <div className="space-y-3">
                  {[
                    { icon: ShieldCheck, label: 'Verified stays', sub: 'All listings are identity-checked' },
                    { icon: Shield, label: 'Secure payments', sub: 'Card held in escrow until check-in' },
                    { icon: CheckCircle, label: '24/7 guest support', sub: 'Help available around the clock' },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-[600] text-slate-800">{label}</p>
                        <p className="text-[12px] text-slate-500">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile booking card (below all content) */}
        <div className="mt-8 space-y-4 lg:hidden">
          <StayBookingCard stay={stay} />
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pb-safe-bottom pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.10)] lg:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="flex-1 min-w-0">
            <span className="block text-[17px] font-[800] text-slate-950">
              £{(stay.pricePerNight / 100).toFixed(0)}
              <span className="text-[13px] font-[500] text-slate-500"> / night</span>
            </span>
            <div className="flex items-center gap-1 text-[12px] text-slate-400">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
              {stay.rating} · {stay.reviewCount} reviews
            </div>
          </div>
          <button
            aria-label="Reserve this stay"
            className="h-12 rounded-[10px] bg-blue-600 px-6 text-[15px] font-[800] text-white shadow-lg transition-colors hover:bg-blue-700 active:scale-[0.98]"
          >
            Reserve
          </button>
        </div>
      </div>
    </PublicPageShell>
  )
}
