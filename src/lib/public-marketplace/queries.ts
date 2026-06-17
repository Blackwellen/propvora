import { SEED_STAYS, SEED_PROVIDERS, SEED_SERVICE_OFFERS, SEED_EMERGENCY_SERVICES, SEED_LONG_TERM_RENTALS } from './seed-fallback'
import type { PublicStay, PublicProvider, PublicServiceOffer, PublicEmergencyService, PublicLongTermRental } from './types'

export async function getPublicStays(): Promise<PublicStay[]> {
  try {
    return SEED_STAYS
  } catch {
    return SEED_STAYS
  }
}

export async function getPublicStayBySlug(slug: string): Promise<PublicStay | null> {
  return SEED_STAYS.find(s => s.slug === slug) ?? null
}

export async function getPublicProviders(): Promise<PublicProvider[]> {
  try {
    return SEED_PROVIDERS
  } catch {
    return SEED_PROVIDERS
  }
}

export async function getPublicProviderBySlug(slug: string): Promise<PublicProvider | null> {
  return SEED_PROVIDERS.find(p => p.slug === slug) ?? null
}

export async function getPublicServiceOffers(): Promise<PublicServiceOffer[]> {
  try {
    return SEED_SERVICE_OFFERS
  } catch {
    return SEED_SERVICE_OFFERS
  }
}

export async function getPublicServiceOfferBySlug(slug: string): Promise<PublicServiceOffer | null> {
  return SEED_SERVICE_OFFERS.find(s => s.slug === slug) ?? null
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
  return SEED_PROVIDERS.filter(p => p.featured)
}

export async function getFeaturedServiceOffers(): Promise<PublicServiceOffer[]> {
  return SEED_SERVICE_OFFERS.filter(s => s.featured)
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
    // When the DB table exists, query here. For now, fall back to seed data.
    // The table `marketplace_long_term_rentals` may not exist yet (42P01-safe).
    let results = SEED_LONG_TERM_RENTALS

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
    return SEED_LONG_TERM_RENTALS
  }
}

export async function getPublicLongTermRentalBySlug(
  slug: string,
): Promise<PublicLongTermRental | null> {
  try {
    return SEED_LONG_TERM_RENTALS.find(r => r.slug === slug) ?? null
  } catch {
    return SEED_LONG_TERM_RENTALS.find(r => r.slug === slug) ?? null
  }
}

export async function getPublicLongTermRentalMapData(
  filters?: LongTermRentalFilters,
): Promise<PublicLongTermRental[]> {
  return getPublicLongTermRentals(filters)
}
