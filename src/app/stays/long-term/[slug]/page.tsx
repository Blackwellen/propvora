import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import {
  CheckCircle,
  Heart,
  Share2,
  MapPin,
  BedDouble,
  Bath,
  Users,
  Star,
  PawPrint,
  Car,
  TreePine,
  Zap,
} from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import StayTypeTabs from '@/components/marketplace/stays/StayTypeTabs'
import LongTermRentalCard from '@/components/marketplace/stays/LongTermRentalCard'
import LongTermRentalEnquiryPanel from '@/components/marketplace/stays/LongTermRentalEnquiryPanel'
import LongTermRentalCostBreakdown from '@/components/marketplace/stays/LongTermRentalCostBreakdown'
import LongTermRentalCompliance from '@/components/marketplace/stays/LongTermRentalCompliance'
import {
  getPublicLongTermRentalBySlug,
  getPublicLongTermRentals,
} from '@/lib/public-marketplace/queries'
import { SEED_LONG_TERM_RENTALS } from '@/lib/public-marketplace/seed-fallback'

export async function generateStaticParams() {
  return SEED_LONG_TERM_RENTALS.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const rental = await getPublicLongTermRentalBySlug(slug)
  if (!rental) return { title: 'Rental not found · Propvora' }
  return {
    title: `${rental.title} · Propvora Rentals`,
    description:
      rental.description ??
      `${rental.beds}-bed ${rental.propertyType} in ${rental.location} — available from ${rental.availableFrom}`,
  }
}

export default async function LongTermRentalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [rental, allRentals] = await Promise.all([
    getPublicLongTermRentalBySlug(slug),
    getPublicLongTermRentals(),
  ])
  if (!rental) notFound()

  const similar = allRentals
    .filter((r) => r.id !== rental.id && r.city === rental.city)
    .slice(0, 3)

  const isVerified =
    rental.licenceVerified || rental.landlordVerified || rental.agentVerified

  return (
    <PublicPageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sub-nav */}
        <div className="mb-6">
          <StayTypeTabs basePath="/stays" />
        </div>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap items-center gap-2">
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified rental
                </span>
              )}
              <span className="text-sm text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {rental.propertyType}
              </span>
              <span className="text-sm text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {rental.furnishingStatus}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                <Heart className="h-4 w-4" /> Save
              </button>
              <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">{rental.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {rental.location}
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {rental.beds} bedrooms
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {rental.bathrooms} bathrooms
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Max {rental.maxOccupants}
            </span>
            <div className="flex items-center gap-1 text-slate-900">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-semibold">{rental.rating}</span>
              <span className="text-slate-400">({rental.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-8 grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden aspect-[16/7]">
          {rental.gallery.slice(0, 5).map((img, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
              <Image
                src={img}
                alt={`${rental.title} — photo ${idx + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={idx === 0}
              />
            </div>
          ))}
        </div>

        {/* Main content + enquiry panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Feature chips */}
            <div className="flex flex-wrap gap-2">
              {rental.billsIncluded && (
                <span className="inline-flex items-center gap-1 text-sm bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-medium border border-sky-100">
                  <Zap className="h-3.5 w-3.5" /> Bills included
                </span>
              )}
              {rental.petsAllowed && (
                <span className="inline-flex items-center gap-1 text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-medium border border-amber-100">
                  <PawPrint className="h-3.5 w-3.5" /> Pets allowed
                </span>
              )}
              {rental.parkingAvailable && (
                <span className="inline-flex items-center gap-1 text-sm bg-slate-50 text-slate-600 px-3 py-1 rounded-full font-medium border border-slate-100">
                  <Car className="h-3.5 w-3.5" /> Parking
                </span>
              )}
              {rental.gardenAvailable && (
                <span className="inline-flex items-center gap-1 text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-100">
                  <TreePine className="h-3.5 w-3.5" /> Garden
                </span>
              )}
              {rental.studentFriendly && (
                <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium border border-purple-100">
                  Student friendly
                </span>
              )}
              {rental.familyFriendly && (
                <span className="text-sm bg-rose-50 text-rose-700 px-3 py-1 rounded-full font-medium border border-rose-100">
                  Family friendly
                </span>
              )}
              {rental.professionalFriendly && (
                <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-100">
                  Professional friendly
                </span>
              )}
            </div>

            {/* Description */}
            {rental.description && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">About this property</h2>
                <p className="text-slate-600 leading-relaxed">{rental.description}</p>
              </div>
            )}

            {/* Key features */}
            {rental.features && rental.features.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Key features</h2>
                <div className="grid grid-cols-2 gap-2">
                  {rental.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {rental.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">What&apos;s included</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {rental.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost breakdown */}
            <LongTermRentalCostBreakdown rental={rental} />

            {/* Compliance */}
            <LongTermRentalCompliance rental={rental} />

            {/* Rooms */}
            {rental.rooms && rental.rooms.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Room breakdown</h2>
                <div className="grid grid-cols-2 gap-3">
                  {rental.rooms.map((room) => (
                    <div
                      key={room.name}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <p className="font-semibold text-slate-900 text-sm mb-1">{room.name}</p>
                      <p className="text-xs text-slate-500">{room.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby transport */}
            {rental.nearbyTransport && rental.nearbyTransport.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Nearby transport</h2>
                <ul className="space-y-1.5">
                  {rental.nearbyTransport.map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nearby amenities */}
            {rental.nearbyAmenities && rental.nearbyAmenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Nearby amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {rental.nearbyAmenities.map((a) => (
                    <span
                      key={a}
                      className="text-sm bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: enquiry panel */}
          <div>
            <LongTermRentalEnquiryPanel rental={rental} isAuthenticated={false} />
          </div>
        </div>

        {/* Similar listings */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Similar rentals in {rental.city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.map((r) => (
                <LongTermRentalCard key={r.id} rental={r} basePath="/stays/long-term" />
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicPageShell>
  )
}
