import { SEED_STAYS, SEED_PROVIDERS, SEED_SERVICE_OFFERS, SEED_EMERGENCY_SERVICES } from './seed-fallback'
import type { PublicStay, PublicProvider, PublicServiceOffer, PublicEmergencyService } from './types'

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
