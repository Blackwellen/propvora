import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckCircle, MapPin, Clock, Star, Wifi, Tv, UtensilsCrossed, WashingMachine, BedDouble, Bath } from 'lucide-react'
import StayGallery from '@/components/public-marketplace/profiles/StayGallery'
import StayDetailActions from './StayDetailActions'
import StayBookingCard from '@/components/public-marketplace/profiles/StayBookingCard'
import StayCard from '@/components/public-marketplace/cards/StayCard'
import { getPublicStayBySlug, getPublicStays } from '@/lib/public-marketplace/queries'
import Image from 'next/image'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const stay = await getPublicStayBySlug(slug)
  if (!stay) return { title: 'Stay not found · Propvora' }
  return {
    title: `${stay.title} · Propvora`,
    description: stay.description ?? `Book ${stay.title} — ${stay.location}`,
  }
}

export default async function CustomerStayDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [stay, allStays] = await Promise.all([getPublicStayBySlug(slug), getPublicStays()])
  if (!stay) notFound()

  const similar = allStays.filter(s => s.id !== stay.id && s.city === stay.city).slice(0, 4)
  const hostOtherUnits = allStays.filter(s => s.id !== stay.id && s.hostName === stay.hostName).slice(0, 2)

  const amenityIcons: Record<string, React.ElementType> = {
    'Fast Wi-Fi': Wifi,
    'Smart TV': Tv,
    'Fully equipped kitchen': UtensilsCrossed,
    'Washer & dryer': WashingMachine,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {stay.verified && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-700 font-semibold">
                <CheckCircle className="h-4 w-4" /> Verified stay
              </span>
            )}
          </div>
          <StayDetailActions title={stay.title} slug={slug} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">{stay.title}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{stay.location}</span>
          <span>{stay.bedrooms} bedrooms · {stay.bathrooms} bathrooms · {stay.guests} guests</span>
          <div className="flex items-center gap-1 text-slate-900">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-semibold">{stay.rating}</span>
            <span className="text-slate-500">({stay.reviewCount} reviews) · Excellent location</span>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mb-8">
        <StayGallery images={stay.gallery} title={stay.title} />
      </div>

      {/* Main content + booking card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Host strip */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white shadow">
              <Image src={stay.hostAvatar} alt={stay.hostName} fill className="object-cover" sizes="56px" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Hosted by {stay.hostName}</span>
                {stay.hostProBadge && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>}
              </div>
              <div className="text-sm text-slate-500">{stay.hostProperties} properties · ★{stay.hostRating} ({stay.hostReviews.toLocaleString()} reviews)</div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Replies {stay.hostResponseTime}</div>
              <div className="text-xs mt-0.5">Professionally managed</div>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">About this stay</h2>
            <p className="text-slate-600 leading-relaxed">{stay.description ?? 'A beautifully appointed property in a prime location. This stunning space features premium finishes throughout and is perfect for both short and long stays.'}</p>
          </div>

          {/* Highlights */}
          {stay.highlights && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Highlights</h2>
              <div className="grid grid-cols-2 gap-3">
                {stay.highlights.map(h => (
                  <div key={h} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="text-2xl">🏠</span>
                    <span className="text-sm font-medium text-slate-700">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">What&apos;s included</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stay.amenities.map(amenity => {
                const Icon = amenityIcons[amenity]
                return (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-slate-700">
                    {Icon ? <Icon className="h-4 w-4 text-slate-400 shrink-0" /> : <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                    {amenity}
                  </div>
                )
              })}
            </div>
            <button className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
              Show all amenities →
            </button>
          </div>

          {/* Rooms */}
          {stay.rooms && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Room breakdown</h2>
              <div className="grid grid-cols-2 gap-3">
                {stay.rooms.map(room => (
                  <div key={room.name} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      {room.name.toLowerCase().includes('bedroom') ? <BedDouble className="h-4 w-4 text-slate-400" /> : <Bath className="h-4 w-4 text-slate-400" />}
                      <span className="font-semibold text-slate-900 text-sm">{room.name}</span>
                    </div>
                    <p className="text-xs text-slate-500">{room.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules, policy, protection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stay.houseRules && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">House rules</h3>
                <ul className="space-y-1.5">
                  {stay.houseRules.map(rule => (
                    <li key={rule} className="text-xs text-slate-600">{rule}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Cancellation policy</h3>
              <p className="text-xs text-slate-600">{stay.cancellationPolicy ?? 'Free cancellation before 48 hours of check-in.'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Booking protection</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />Verified stays</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />Secure payments</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />Dispute support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking card */}
        <div>
          <StayBookingCard stay={stay} />
        </div>
      </div>

      {/* Other units */}
      {hostOtherUnits.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Other units from this host</h2>
          <div className="grid grid-cols-2 gap-4">
            {hostOtherUnits.map(s => <StayCard key={s.id} stay={s} basePath="/user/stays" />)}
          </div>
        </section>
      )}

      {/* Similar stays */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Similar stays you might like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map(s => <StayCard key={s.id} stay={s} basePath="/user/stays" />)}
          </div>
        </section>
      )}
    </div>
  )
}
