import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Star, MapPin, ChevronRight, Share2, Heart, BedDouble, Bath, Users, Zap, Shield, Lock } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import StayBookingCard from '@/components/public-marketplace/profiles/StayBookingCard'
import { getPublicStayBySlug } from '@/lib/public-marketplace/queries'
import { SEED_STAYS } from '@/lib/public-marketplace/seed-fallback'
import { formatPence } from '@/lib/marketplace/money'

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
    <PublicPageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
          <Link href="/stays" className="hover:text-slate-900">Stays</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{stay.city}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 truncate max-w-xs">{stay.title}</span>
        </nav>

        {/* Top badges + actions */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            {stay.verified && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                <CheckCircle className="h-3 w-3" />Verified stay
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Heart className="h-4 w-4" />Save
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Share2 className="h-4 w-4" />Share
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">{stay.title}</h1>

        {/* Subtitle row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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

        {/* GALLERY */}
        {galleryImages.length > 0 && (
          <div className="relative h-[420px] grid grid-cols-5 gap-2 mb-8 rounded-2xl overflow-hidden">
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
              <button className="absolute bottom-4 left-4 bg-white/90 hover:bg-white text-slate-900 font-semibold text-sm px-4 py-2 rounded-full shadow transition-colors">
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

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* LEFT: 60% */}
          <div className="lg:col-span-3 space-y-8">
            {/* Host strip */}
            <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
                <Image src={stay.hostAvatar} alt={stay.hostName} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">Hosted by {stay.hostName}</span>
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
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">About this stay</h2>
                <p className="text-slate-600 leading-relaxed">{stay.description}</p>
              </div>
            )}

            {/* Amenities */}
            {stay.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">What&apos;s included</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Room breakdown</h2>
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
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <h3 className="font-semibold text-amber-900 text-sm mb-2">Cancellation policy</h3>
                    <p className="text-xs text-amber-800 leading-relaxed">{stay.cancellationPolicy}</p>
                  </div>
                )}
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h3 className="font-semibold text-blue-900 text-sm mb-2">Booking protection</h3>
                  <p className="text-xs text-blue-800 leading-relaxed">All bookings are protected by Propvora secure payments and dispute resolution.</p>
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Location overview</h2>
              <div className="bg-slate-100 rounded-2xl h-48 flex items-center justify-center border border-slate-200">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">{stay.location}</p>
                  <p className="text-xs text-slate-400 mt-1">{stay.lat.toFixed(4)}, {stay.lng.toFixed(4)}</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div>
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

          {/* RIGHT: 40% sticky */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <StayBookingCard stay={stay} />
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
