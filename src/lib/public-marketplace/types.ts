export interface PublicStay {
  id: string
  slug: string
  title: string
  stayType: 'Entire home' | 'Private room' | 'Shared room' | 'Studio' | 'Penthouse'
  location: string
  city: string
  postcode: string
  beds: number
  bathrooms: number
  guests: number
  bedrooms: number
  rating: number
  reviewCount: number
  pricePerNight: number // pence
  cleaningFee: number // pence
  serviceFee: number // pence
  taxes: number // pence
  verified: boolean
  instantBook: boolean
  freeCancellation: boolean
  shortLets: boolean
  longStays: boolean
  petsAllowed: boolean
  hostName: string
  hostAvatar: string
  hostProBadge: boolean
  hostProperties: number
  hostRating: number
  hostReviews: number
  hostResponseTime: string
  heroImage: string
  gallery: string[]
  lat: number
  lng: number
  amenities: string[]
  badges: string[]
  description?: string
  highlights?: string[]
  houseRules?: string[]
  cancellationPolicy?: string
  rooms?: { name: string; description: string }[]
}

export interface PublicProvider {
  id: string
  slug: string
  companyName: string
  trade: string
  location: string
  city: string
  rating: number
  reviewCount: number
  proBadge: boolean
  vetted: boolean
  insured: boolean
  insuranceAmount: string
  teamSize: number
  jobsDone: number
  yearsActive: number
  responseTime: string
  fromPrice: number // pence per visit
  heroImage: string
  logo: string
  certifications: string[]
  coverageRadius: number // miles
  coverageCities: string[]
  featured: boolean
  emergency24h: boolean
  gasSafe?: string
  niceic?: boolean
  description?: string
  services?: string[]
  faqs?: { q: string; a: string }[]
  recentWork?: string[]
  teamMembers?: { name: string; role: string; avatar: string }[]
  lat: number
  lng: number
  initials: string
  pinColor: string
}

export interface PublicServiceOffer {
  id: string
  slug: string
  title: string
  subtitle: string
  category: string
  providerName: string
  providerSlug: string
  providerAvatar: string
  providerPro: boolean
  rating: number
  reviewCount: number
  jobsDone: number
  location: string
  city: string
  heroImage: string
  gallery: string[]
  basePrice: number // pence (basic package)
  standardPrice: number // pence
  premiumPrice: number // pence
  duration: string
  responseTime: string
  nextAvailable: string
  featured: boolean
  verified: boolean
  insured: boolean
  urgent: boolean
  deliverables: string[]
  tags: string[]
  packages?: {
    name: string
    price: number // pence
    description: string
    includes: string[]
  }[]
  addons?: { name: string; price: number; description?: string }[]
  lat: number
  lng: number
}

export interface PublicLongTermRental {
  id: string
  slug: string
  title: string
  propertyType: 'Flat' | 'House' | 'Studio' | 'Room' | 'Townhouse' | 'Penthouse' | 'Bungalow'
  location: string
  city: string
  postcode: string
  lat: number
  lng: number
  beds: number
  bathrooms: number
  maxOccupants: number
  furnishingStatus: 'Furnished' | 'Part furnished' | 'Unfurnished'
  billsIncluded: boolean
  petsAllowed: boolean
  parkingAvailable: boolean
  gardenAvailable: boolean
  studentFriendly: boolean
  familyFriendly: boolean
  professionalFriendly: boolean
  monthlyRentPence: number // always pence
  depositPence: number // always pence
  holdingDepositPence?: number
  councilTaxBand?: string
  epcRating?: string
  licenceVerified: boolean
  landlordVerified: boolean
  agentVerified: boolean
  depositProtectionScheme?: string
  availableFrom: string // ISO date string
  minTenancyMonths: number
  maxTenancyMonths?: number
  rating: number
  reviewCount: number
  hostName: string
  hostAvatar: string
  hostProBadge: boolean
  heroImage: string
  gallery: string[]
  amenities: string[]
  badges: string[]
  description?: string
  nearbyTransport?: string[]
  nearbyAmenities?: string[]
  rooms?: { name: string; description: string }[]
  features?: string[]
}

export interface PublicEmergencyService {
  id: string
  slug: string
  title: string
  subtitle: string
  category: string
  providerName: string
  providerSlug: string
  providerAvatar: string
  leadTechnicianName: string
  leadTechnicianRole: string
  phone: string
  rating: number
  reviewCount: number
  responseTimeMin: number // minutes
  responseTimeMax: number // minutes
  heroImage: string
  location: string
  coveragePostcodes: string[]
  available24h: boolean
  policeVetted: boolean
  insured: boolean
  insuranceAmount: string
  baseCalloutPrice: number // pence
  noCalloutFee: boolean
  description?: string
  coverageLat: number
  coverageLng: number
  priceItems?: { service: string; from: number; to?: number }[]
}
