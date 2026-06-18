import type { PublicStay, PublicProvider, PublicServiceOffer, PublicLongTermRental } from './types'
import { SEED_STAYS, SEED_PROVIDERS, SEED_SERVICE_OFFERS, SEED_LONG_TERM_RENTALS } from './seed-fallback'

// Multiplier data — realistic UK property content
const STAY_TITLES = [
  'Luxury 2-Bed Apartment, Shoreditch',
  'Modern Studio, Canary Wharf',
  'Victorian Townhouse, Notting Hill',
  'Penthouse with City Views, Manchester',
  'Cosy Flat, Edinburgh Old Town',
  'Seaside Apartment, Brighton',
  'Smart 1-Bed, Birmingham Jewellery Quarter',
  'Executive Suite, Leeds City Centre',
  'Garden Flat, Bristol Harbourside',
  'Contemporary Loft, Liverpool Docklands',
  'Heritage Home, Bath City Centre',
  'City Centre Studio, Newcastle',
  'Designer Apartment, Sheffield',
  'Chic 2-Bed, Cardiff Bay',
  'Waterfront Studio, Salford Quays',
  'Period Conversion, Oxford',
  'Compact Studio, Coventry',
  'Modern 3-Bed, Leicester',
  'Riverside Apartment, Norwich',
  'Boutique Studio, Cambridge',
  'Skyline Penthouse, Birmingham',
  'Trendy 1-Bed, Bristol Clifton',
  'Victorian Villa, Manchester Didsbury',
  'New-Build 2-Bed, Milton Keynes',
  'Luxury Studio, London Mayfair',
  'Converted Mill, Bradford',
  'Contemporary Home, Reading',
  'Beach Retreat, Portsmouth',
  'Countryside Cottage, York',
  'City Loft, Nottingham',
  'Spacious 4-Bed, Wolverhampton',
  'Townhouse, Exeter',
]

const STAY_LOCATIONS = [
  'Shoreditch, London E2', 'Canary Wharf, London E14', 'Notting Hill, London W11',
  'Manchester City Centre, M1', 'Edinburgh Old Town, EH1', 'Brighton Marina, BN2',
  'Jewellery Quarter, Birmingham B1', 'Leeds City Centre, LS1', 'Bristol Harbourside, BS1',
  'Liverpool Docklands, L3', 'Bath City Centre, BA1', 'Newcastle Quayside, NE1',
  'Sheffield City Centre, S1', 'Cardiff Bay, CF10', 'Salford Quays, M50',
  'Oxford City Centre, OX1', 'Coventry City Centre, CV1', 'Leicester City Centre, LE1',
  'Norwich City Centre, NR1', 'Cambridge City Centre, CB1', 'Birmingham Skyline, B2',
  'Clifton, Bristol BS8', 'Didsbury, Manchester M20', 'Milton Keynes Central, MK9',
  'Mayfair, London W1K', 'Bradford City Centre, BD1', 'Reading Town Centre, RG1',
  'Portsmouth Old Town, PO1', 'York City Centre, YO1', 'Nottingham City Centre, NG1',
  'Wolverhampton WV1', 'Exeter City Centre, EX1',
]

const STAY_TYPES: PublicStay['stayType'][] = ['Entire home', 'Private room', 'Shared room', 'Studio', 'Penthouse']
const CITIES = ['London', 'Manchester', 'Edinburgh', 'Brighton', 'Birmingham', 'Leeds', 'Bristol', 'Liverpool', 'Bath', 'Newcastle', 'Sheffield', 'Cardiff', 'Salford', 'Oxford', 'Coventry', 'Leicester', 'Norwich', 'Cambridge', 'Bradford', 'Reading', 'Portsmouth', 'York', 'Nottingham', 'Wolverhampton', 'Exeter']

const UNSPLASH_STAYS = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
  'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800',
]

const HOST_NAMES = ['Sarah M.', 'James T.', 'Emma W.', 'Oliver B.', 'Charlotte K.', 'Henry P.', 'Isabella R.', 'George F.', 'Amelia N.', 'William D.']
const HOST_AVATARS = [
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
]

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function buildExpandedStays(targetCount = 32): PublicStay[] {
  const base = [...SEED_STAYS]
  const result: PublicStay[] = [...base]
  let i = base.length

  while (result.length < targetCount) {
    const src = base[i % base.length]
    const idx = i
    const r = (offset: number) => seededRandom(idx * 37 + offset)
    const titleIdx = idx % STAY_TITLES.length
    const locIdx = idx % STAY_LOCATIONS.length
    const cityIdx = idx % CITIES.length

    result.push({
      ...src,
      id: `gen-stay-${idx}`,
      slug: `stay-${CITIES[cityIdx].toLowerCase().replace(/\s/g, '-')}-${idx}`,
      title: STAY_TITLES[titleIdx],
      location: STAY_LOCATIONS[locIdx],
      city: CITIES[cityIdx],
      postcode: src.postcode,
      stayType: STAY_TYPES[Math.floor(r(1) * STAY_TYPES.length)],
      beds: Math.max(1, Math.floor(r(2) * 4) + 1),
      bathrooms: Math.max(1, Math.floor(r(3) * 3) + 1),
      bedrooms: Math.max(1, Math.floor(r(4) * 4) + 1),
      guests: Math.floor(r(5) * 6) + 2,
      rating: parseFloat((4 + r(6) * 0.95).toFixed(1)),
      reviewCount: Math.floor(r(7) * 200) + 5,
      pricePerNight: Math.floor((r(8) * 15000) + 5000),
      cleaningFee: Math.floor(r(9) * 6000) + 2000,
      serviceFee: Math.floor(r(10) * 3000) + 800,
      taxes: Math.floor(r(11) * 2000) + 500,
      verified: r(12) > 0.35,
      instantBook: r(13) > 0.4,
      freeCancellation: r(14) > 0.3,
      shortLets: r(15) > 0.2,
      longStays: r(16) > 0.5,
      petsAllowed: r(17) > 0.6,
      hostName: HOST_NAMES[idx % HOST_NAMES.length],
      hostAvatar: HOST_AVATARS[idx % HOST_AVATARS.length],
      hostProBadge: r(18) > 0.5,
      hostProperties: Math.floor(r(19) * 20) + 1,
      hostRating: parseFloat((4 + r(20) * 0.95).toFixed(1)),
      hostReviews: Math.floor(r(21) * 150) + 5,
      hostResponseTime: ['Within an hour', 'Within a few hours', 'Within a day'][Math.floor(r(22) * 3)],
      heroImage: UNSPLASH_STAYS[idx % UNSPLASH_STAYS.length],
      gallery: [UNSPLASH_STAYS[idx % UNSPLASH_STAYS.length], UNSPLASH_STAYS[(idx + 1) % UNSPLASH_STAYS.length]],
      lat: 51.5 + (r(23) - 0.5) * 5,
      lng: -1.5 + (r(24) - 0.5) * 4,
    })
    i++
  }
  return result
}

const PROVIDER_COMPANY_NAMES = [
  'Citywide Plumbing & Heating', 'Manchester Electrical Solutions', 'Northern Waste Management',
  'Elite Cleaning Services', 'Swift Boiler Repairs', 'ProLock Security',
  'GreenThumb Landscaping', 'Brightside Painting & Decorating', 'AllFix Handyman Services',
  'ThermoTech Heating', 'ShieldPest Control', 'AquaFix Drainage',
  'VoltMaster Electricians', 'CondorRoofing Ltd', 'AirFresh Ventilation',
  'HomeGuard Alarm Systems', 'CleanSlate Cleaning Co.', 'ProPlumb North',
  'SmartBuild Renovations', 'SafeGas Engineers', 'UltraFit Bathrooms',
  'FixIt Manchester', 'Northern Electrical Group', 'GlazePro Windows',
]

const TRADES = ['Plumbing', 'Electrical', 'Cleaning', 'Boiler repair', 'Locksmith', 'Landscaping', 'Painting & Decorating', 'Handyman', 'Heating', 'Pest control', 'Drainage', 'Roofing', 'Ventilation', 'Alarm systems', 'Bathroom fitting']

const UNSPLASH_PROVIDERS = [
  'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
  'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800',
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800',
]

const PIN_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2']

export function buildExpandedProviders(targetCount = 24): PublicProvider[] {
  const base = [...SEED_PROVIDERS]
  const result: PublicProvider[] = [...base]
  let i = base.length

  while (result.length < targetCount) {
    const src = base[i % base.length]
    const idx = i
    const r = (offset: number) => seededRandom(idx * 41 + offset)
    const nameIdx = idx % PROVIDER_COMPANY_NAMES.length
    const tradeIdx = idx % TRADES.length
    const cityIdx = idx % CITIES.length
    const name = PROVIDER_COMPANY_NAMES[nameIdx]

    result.push({
      ...src,
      id: `gen-prov-${idx}`,
      slug: `provider-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}`,
      companyName: name,
      trade: TRADES[tradeIdx],
      location: `${CITIES[cityIdx]}, UK`,
      city: CITIES[cityIdx],
      rating: parseFloat((4 + r(1) * 0.95).toFixed(1)),
      reviewCount: Math.floor(r(2) * 300) + 10,
      proBadge: r(3) > 0.4,
      vetted: r(4) > 0.3,
      insured: r(5) > 0.2,
      insuranceAmount: ['£1M', '£2M', '£5M'][Math.floor(r(6) * 3)],
      teamSize: Math.floor(r(7) * 15) + 1,
      jobsDone: Math.floor(r(8) * 2000) + 50,
      yearsActive: Math.floor(r(9) * 20) + 1,
      responseTime: ['Within 1 hour', 'Same day', 'Within 4 hours', 'Next working day'][Math.floor(r(10) * 4)],
      fromPrice: Math.floor(r(11) * 15000) + 3500,
      heroImage: UNSPLASH_PROVIDERS[idx % UNSPLASH_PROVIDERS.length],
      logo: UNSPLASH_PROVIDERS[(idx + 1) % UNSPLASH_PROVIDERS.length],
      certifications: [],
      coverageRadius: Math.floor(r(12) * 30) + 5,
      coverageCities: [CITIES[cityIdx]],
      featured: r(13) > 0.75,
      emergency24h: r(14) > 0.5,
      gasSafe: r(15) > 0.6 ? `GS${100000 + idx}` : undefined,
      niceic: r(16) > 0.7,
      lat: 51.5 + (r(17) - 0.5) * 5,
      lng: -1.5 + (r(18) - 0.5) * 4,
      initials: name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
      pinColor: PIN_COLORS[idx % PIN_COLORS.length],
    })
    i++
  }
  return result
}

const OFFER_TITLES = [
  'Full Property Deep Clean', 'Emergency Boiler Repair', 'Electrical Safety Certificate',
  'Gas Safety Inspection', 'End-of-Tenancy Clean', 'Bathroom Installation',
  'Roof Repair & Inspection', 'Garden Design & Landscaping', 'Interior Painting & Decorating',
  'Pest Control Treatment', 'Drainage Unblocking Service', 'CCTV & Alarm Installation',
  'Kitchen Refurbishment', 'Loft Insulation Fitting', 'Window Replacement Service',
  'Flooring Installation', 'Plastering & Skimming', 'Damp Proofing Treatment',
  'Air Conditioning Service', 'Solar Panel Installation', 'Carpet Cleaning',
  'Commercial Kitchen Cleaning', 'HMO Compliance Inspection', 'Fire Safety Assessment',
  'EPC Survey & Certificate', 'Smart Thermostat Installation', 'Fence & Gate Repair',
  'Asbestos Survey', 'Legionella Risk Assessment', 'Mould Treatment',
  'Party Wall Agreement Survey', 'Structural Survey',
]

const SERVICE_CATEGORIES = ['Cleaning', 'Plumbing', 'Electrical', 'Heating', 'Gardening', 'Handyman', 'Waste Removal', 'Roofing', 'Pest Control', 'Security']

const UNSPLASH_SERVICES = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800',
  'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800',
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800',
]

const PROVIDER_NAMES = ['ProFix Services', 'Citywide Professionals', 'Elite Tradesmen', 'Swift Solutions', 'Northern Experts', 'Reliable Works', 'Premium Trades', 'Top Craft Services']

export function buildExpandedServiceOffers(targetCount = 32): PublicServiceOffer[] {
  const base = [...SEED_SERVICE_OFFERS]
  const result: PublicServiceOffer[] = [...base]
  let i = base.length

  while (result.length < targetCount) {
    const src = base[i % base.length]
    const idx = i
    const r = (offset: number) => seededRandom(idx * 43 + offset)
    const titleIdx = idx % OFFER_TITLES.length
    const catIdx = idx % SERVICE_CATEGORIES.length
    const cityIdx = idx % CITIES.length
    const provName = PROVIDER_NAMES[idx % PROVIDER_NAMES.length]

    result.push({
      ...src,
      id: `gen-offer-${idx}`,
      slug: `service-${SERVICE_CATEGORIES[catIdx].toLowerCase()}-${idx}`,
      title: OFFER_TITLES[titleIdx],
      subtitle: `Professional ${SERVICE_CATEGORIES[catIdx]} service`,
      category: SERVICE_CATEGORIES[catIdx],
      providerName: provName,
      providerSlug: provName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      providerAvatar: UNSPLASH_PROVIDERS[idx % UNSPLASH_PROVIDERS.length],
      providerPro: r(1) > 0.4,
      rating: parseFloat((4 + r(2) * 0.95).toFixed(1)),
      reviewCount: Math.floor(r(3) * 200) + 5,
      jobsDone: Math.floor(r(4) * 500) + 10,
      location: `${CITIES[cityIdx]}, UK`,
      city: CITIES[cityIdx],
      heroImage: UNSPLASH_SERVICES[idx % UNSPLASH_SERVICES.length],
      gallery: [UNSPLASH_SERVICES[idx % UNSPLASH_SERVICES.length]],
      basePrice: Math.floor(r(5) * 30000) + 5000,
      standardPrice: Math.floor(r(6) * 50000) + 10000,
      premiumPrice: Math.floor(r(7) * 80000) + 20000,
      duration: ['2-3 hours', '4-6 hours', '1 day', 'Half day', '2 days'][Math.floor(r(8) * 5)],
      responseTime: ['Within 1 hour', '2-4 hours', 'Same day', 'Next day'][Math.floor(r(9) * 4)],
      nextAvailable: ['Today', 'Tomorrow', 'Within 3 days', 'This week'][Math.floor(r(10) * 4)],
      featured: r(11) > 0.8,
      verified: r(12) > 0.3,
      insured: r(13) > 0.25,
      urgent: r(14) > 0.65,
      deliverables: [],
      tags: [SERVICE_CATEGORIES[catIdx]],
      lat: 51.5 + (r(15) - 0.5) * 5,
      lng: -1.5 + (r(16) - 0.5) * 4,
    })
    i++
  }
  return result
}

export function buildExpandedLongTermRentals(targetCount = 32): PublicLongTermRental[] {
  const base = [...SEED_LONG_TERM_RENTALS]
  const result: PublicLongTermRental[] = [...base]
  let i = base.length
  const TYPES: PublicLongTermRental['propertyType'][] = ['Flat', 'House', 'Studio', 'Room', 'Townhouse', 'Penthouse', 'Bungalow']
  const FURNISH: PublicLongTermRental['furnishingStatus'][] = ['Furnished', 'Part furnished', 'Unfurnished']

  while (result.length < targetCount) {
    const src = base[i % base.length]
    const idx = i
    const r = (offset: number) => seededRandom(idx * 47 + offset)
    const cityIdx = idx % CITIES.length
    const city = CITIES[cityIdx]

    result.push({
      ...src,
      id: `gen-ltr-${idx}`,
      slug: `rental-${city.toLowerCase().replace(/\s/g, '-')}-${idx}`,
      title: `${TYPES[Math.floor(r(1) * TYPES.length)]} in ${city}`,
      propertyType: TYPES[Math.floor(r(2) * TYPES.length)],
      location: `${city} City Centre`,
      city,
      postcode: src.postcode,
      beds: Math.max(1, Math.floor(r(3) * 5) + 1),
      bathrooms: Math.max(1, Math.floor(r(4) * 3) + 1),
      maxOccupants: Math.floor(r(5) * 6) + 1,
      furnishingStatus: FURNISH[Math.floor(r(6) * FURNISH.length)],
      billsIncluded: r(7) > 0.5,
      petsAllowed: r(8) > 0.6,
      parkingAvailable: r(9) > 0.5,
      gardenAvailable: r(10) > 0.6,
      studentFriendly: r(11) > 0.5,
      familyFriendly: r(12) > 0.5,
      professionalFriendly: r(13) > 0.3,
      monthlyRentPence: Math.floor(r(14) * 200000) + 60000,
      depositPence: Math.floor(r(15) * 400000) + 100000,
      licenceVerified: r(16) > 0.4,
      landlordVerified: r(17) > 0.35,
      agentVerified: r(18) > 0.5,
      availableFrom: new Date(Date.now() + r(19) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minTenancyMonths: [6, 12, 18][Math.floor(r(20) * 3)],
      rating: parseFloat((4 + r(21) * 0.95).toFixed(1)),
      reviewCount: Math.floor(r(22) * 50) + 1,
      hostName: HOST_NAMES[idx % HOST_NAMES.length],
      hostAvatar: HOST_AVATARS[idx % HOST_AVATARS.length],
      hostProBadge: r(23) > 0.5,
      heroImage: UNSPLASH_STAYS[idx % UNSPLASH_STAYS.length],
      gallery: [UNSPLASH_STAYS[idx % UNSPLASH_STAYS.length]],
      amenities: [],
      badges: [],
      lat: 51.5 + (r(24) - 0.5) * 5,
      lng: -1.5 + (r(25) - 0.5) * 4,
    })
    i++
  }
  return result
}

// Pre-built expanded arrays — imported by queries.ts
export const EXPANDED_STAYS = buildExpandedStays(32)
export const EXPANDED_PROVIDERS = buildExpandedProviders(24)
export const EXPANDED_SERVICE_OFFERS = buildExpandedServiceOffers(32)
export const EXPANDED_LONG_TERM_RENTALS = buildExpandedLongTermRentals(32)
