import { SEED_EMERGENCY_SERVICES } from './seed-fallback'
import { EXPANDED_STAYS, EXPANDED_PROVIDERS, EXPANDED_SERVICE_OFFERS, EXPANDED_LONG_TERM_RENTALS } from './seed-expander'
import type { PublicStay, PublicProvider, PublicServiceOffer, PublicEmergencyService, PublicLongTermRental } from './types'

export async function getPublicStays(): Promise<PublicStay[]> {
  return EXPANDED_STAYS
}

export async function getPublicStayBySlug(slug: string): Promise<PublicStay | null> {
  return EXPANDED_STAYS.find(s => s.slug === slug) ?? null
}

export async function getPublicProviders(): Promise<PublicProvider[]> {
  return EXPANDED_PROVIDERS
}

export async function getPublicProviderBySlug(slug: string): Promise<PublicProvider | null> {
  return EXPANDED_PROVIDERS.find(p => p.slug === slug) ?? null
}

export async function getPublicServiceOffers(): Promise<PublicServiceOffer[]> {
  return EXPANDED_SERVICE_OFFERS
}

export async function getPublicServiceOfferBySlug(slug: string): Promise<PublicServiceOffer | null> {
  return EXPANDED_SERVICE_OFFERS.find(s => s.slug === slug) ?? null
}

export async function getPublicEmergencyServices(): Promise<PublicEmergencyService[]> {
  try {
    return SEED_EMERGENCY_SERVICES
  } catch {
    return SEED_EMERGENCY_SERVICES
  }
}

export async function getPublicEmergencyServiceBySlug(slug: string): Promise<PublicEmergencyService | null> {
  return SEED_EMERGENCY_SERVICES.find(s => s.slug === slug) ?? null
}

export async function getFeaturedProviders(): Promise<PublicProvider[]> {
  return EXPANDED_PROVIDERS.filter(p => p.featured)
}

export async function getFeaturedServiceOffers(): Promise<PublicServiceOffer[]> {
  return EXPANDED_SERVICE_OFFERS.filter(s => s.featured)
}

// ─── Long-Term Rentals ──────────────────────────────────────────────────────

export interface LongTermRentalFilters {
  city?: string
  minBeds?: number
  maxRentPence?: number
  propertyType?: string
  furnished?: boolean
  billsIncluded?: boolean
  availableNow?: boolean
}

export async function getPublicLongTermRentals(
  filters?: LongTermRentalFilters,
): Promise<PublicLongTermRental[]> {
  try {
    let results = EXPANDED_LONG_TERM_RENTALS

    if (filters?.city) {
      results = results.filter(r => r.city.toLowerCase() === filters.city!.toLowerCase())
    }
    if (filters?.minBeds !== undefined) {
      results = results.filter(r => r.beds >= filters.minBeds!)
    }
    if (filters?.maxRentPence !== undefined) {
      results = results.filter(r => r.monthlyRentPence <= filters.maxRentPence!)
    }
    if (filters?.propertyType) {
      results = results.filter(r => r.propertyType === filters.propertyType)
    }
    if (filters?.furnished !== undefined) {
      if (filters.furnished) {
        results = results.filter(r => r.furnishingStatus === 'Furnished')
      }
    }
    if (filters?.billsIncluded !== undefined) {
      results = results.filter(r => r.billsIncluded === filters.billsIncluded)
    }
    if (filters?.availableNow) {
      const today = new Date().toISOString().slice(0, 10)
      results = results.filter(r => r.availableFrom <= today)
    }

    return results
  } catch {
    return EXPANDED_LONG_TERM_RENTALS
  }
}

export async function getPublicLongTermRentalBySlug(
  slug: string,
): Promise<PublicLongTermRental | null> {
  return EXPANDED_LONG_TERM_RENTALS.find(r => r.slug === slug) ?? null
}

export async function getPublicLongTermRentalMapData(
  filters?: LongTermRentalFilters,
): Promise<PublicLongTermRental[]> {
  return getPublicLongTermRentals(filters)
}
