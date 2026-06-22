/**
 * Public marketplace queries — Supabase-backed with seed fallback.
 *
 * Providers / Service Offers / Emergency Services all query the
 * supplier_workspace_profiles + supplier_workspace_services tables
 * (public read policies for status='active' added in migration
 * 20260621000001_supplier_public_marketplace_rls.sql).
 *
 * If the tables do not exist (42P01 / PGRST116) OR the live table returns
 * zero rows, the functions fall back to the expanded seed arrays so the UI is
 * never empty during the transition period.
 */

import { createClient } from "@/lib/supabase/server"
import { SEED_EMERGENCY_SERVICES } from './seed-fallback'
import { EXPANDED_STAYS, EXPANDED_PROVIDERS, EXPANDED_SERVICE_OFFERS, EXPANDED_LONG_TERM_RENTALS } from './seed-expander'
import { withProviderMedia, withServiceMedia, withEmergencyMedia } from './media-fallback'
import type { PublicStay, PublicProvider, PublicServiceOffer, PublicEmergencyService, PublicLongTermRental } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function is42P01(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const e = err as Record<string, unknown>
  // Supabase JS surfaces the Postgres error code in e.code
  return e.code === "42P01" || String(e.message ?? "").includes("does not exist")
}

function slugify(text: string | null | undefined, fallback: string): string {
  if (!text) return fallback
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

/** Map a raw supplier_workspace_profiles row → PublicProvider */
function mapRowToProvider(
  row: SupplierProfileRow,
  avgRating: number,
  reviewCount: number,
  services: SupplierServiceRow[],
): PublicProvider {
  const name = row.display_name ?? "Propvora Supplier"
  const trade = row.trades?.[0] ?? "General Maintenance"
  const slug = slugify(name, `provider-${row.workspace_id}`)
  const insurancePence = row.public_liability_cover_pence ?? 0
  const insuranceStr =
    insurancePence >= 500_000_00 ? "£5M" :
    insurancePence >= 200_000_00 ? "£2M" :
    insurancePence >= 100_000_00 ? "£1M" :
    insurancePence > 0 ? `£${(insurancePence / 100).toLocaleString()}` : "Not disclosed"

  const responseHours = row.response_time_hours ?? 24
  const responseTime =
    responseHours <= 1 ? "Within 1 hour" :
    responseHours <= 4 ? "Within 4 hours" :
    responseHours <= 8 ? "Same day" :
    responseHours <= 24 ? "Within 24 hours" : "Next working day"

  const pricedServices = services.filter(s => s.rate_pence != null && (s.rate_pence ?? 0) > 0)
  const minServicePence = pricedServices.length > 0
    ? Math.min(...pricedServices.map(s => s.rate_pence ?? 0))
    : 0

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase()

  const PIN_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"]
  const pinColor = PIN_COLORS[Math.abs(hashStr(row.workspace_id)) % PIN_COLORS.length]

  return {
    id: row.workspace_id,
    slug,
    companyName: name,
    trade,
    location: row.base_location ?? "United Kingdom",
    city: extractCity(row.base_location),
    rating: avgRating,
    reviewCount,
    proBadge: row.insurance_verified,
    vetted: row.insurance_verified,
    insured: row.insurance_verified,
    insuranceAmount: insuranceStr,
    teamSize: 1,
    jobsDone: 0,
    yearsActive: row.years_experience ?? 0,
    responseTime,
    fromPrice: minServicePence,
    heroImage: "",
    logo: "",
    certifications: [],
    coverageRadius: row.service_radius_km != null ? Math.round(row.service_radius_km * 0.621) : 10,
    coverageCities: [extractCity(row.base_location)],
    featured: false,
    emergency24h: row.accepts_emergency,
    description: row.bio ?? undefined,
    services: services.map(s => s.name),
    lat: Number(row.latitude ?? 51.5),
    lng: Number(row.longitude ?? -0.12),
    initials,
    pinColor,
  }
}

/** Map a raw supplier_workspace_services row → PublicServiceOffer */
function mapRowToServiceOffer(
  service: SupplierServiceRow,
  profile: SupplierProfileRow,
  avgRating: number,
  reviewCount: number,
): PublicServiceOffer {
  const providerName = profile.display_name ?? "Propvora Supplier"
  const providerSlug = slugify(providerName, `provider-${profile.workspace_id}`)
  const slug = slugify(service.name, `service-${service.id}`)
  const pricePence = service.rate_pence ?? 0
  const calloutPence = service.callout_fee_pence ?? 0

  return {
    id: service.id,
    slug,
    title: service.name,
    subtitle: service.description ?? `Professional ${service.category ?? "maintenance"} service`,
    category: service.category ?? "General",
    providerName,
    providerSlug,
    providerAvatar: "",
    providerPro: profile.insurance_verified,
    rating: avgRating,
    reviewCount,
    jobsDone: 0,
    location: profile.base_location ?? "United Kingdom",
    city: extractCity(profile.base_location),
    heroImage: "",
    gallery: [],
    basePrice: pricePence > 0 ? pricePence : calloutPence,
    standardPrice: pricePence > 0 ? Math.round(pricePence * 1.3) : calloutPence,
    premiumPrice: pricePence > 0 ? Math.round(pricePence * 1.6) : calloutPence,
    duration: "To be confirmed",
    responseTime: profile.response_time_hours != null
      ? (profile.response_time_hours <= 4 ? "Within 4 hours" : "Same day")
      : "To be confirmed",
    nextAvailable: "Contact for availability",
    featured: false,
    verified: profile.insurance_verified,
    insured: profile.insurance_verified,
    urgent: profile.accepts_emergency && service.category?.toLowerCase().includes("emergen") === true,
    deliverables: [],
    tags: [service.category ?? "General"],
    lat: Number(profile.latitude ?? 51.5),
    lng: Number(profile.longitude ?? -0.12),
  }
}

function extractCity(location: string | null | undefined): string {
  if (!location) return "United Kingdom"
  const parts = location.split(",")
  return parts[0]?.trim() ?? location
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

// ─── Types for raw DB rows ────────────────────────────────────────────────────

interface SupplierProfileRow {
  workspace_id: string
  display_name: string | null
  bio: string | null
  trades: string[]
  years_experience: number | null
  insurance_verified: boolean
  public_liability_cover_pence: number | null
  service_radius_km: number | null
  base_location: string | null
  latitude: number | null
  longitude: number | null
  response_time_hours: number | null
  accepts_emergency: boolean
  status: string
}

interface SupplierServiceRow {
  id: string
  workspace_id: string
  name: string
  category: string | null
  description: string | null
  pricing_model: string
  rate_pence: number | null
  callout_fee_pence: number | null
  active: boolean
}

// ─── Core data loaders ───────────────────────────────────────────────────────

interface LiveData {
  providers: PublicProvider[]
  offers: PublicServiceOffer[]
  emergencyServices: PublicEmergencyService[]
}

let _cache: LiveData | null = null
let _cacheTs = 0
const CACHE_TTL_MS = 60_000 // 60 s cache — avoids N+1 on the same build/request

async function loadLiveData(): Promise<LiveData | null> {
  const now = Date.now()
  if (_cache && now - _cacheTs < CACHE_TTL_MS) return _cache

  try {
    const supabase = await createClient()

    const { data: profiles, error: profilesErr } = await supabase
      .from("supplier_workspace_profiles")
      .select(
        "workspace_id, display_name, bio, trades, years_experience, insurance_verified, " +
        "public_liability_cover_pence, service_radius_km, base_location, " +
        "latitude, longitude, response_time_hours, accepts_emergency, status"
      )
      .eq("status", "active")

    if (profilesErr) {
      if (is42P01(profilesErr)) return null // table missing — fallback
      // Other DB error — log but fallback
      console.warn("[public-marketplace] profiles query error:", profilesErr.message)
      return null
    }

    if (!profiles || profiles.length === 0) return null // no live data yet

    const typedProfiles = profiles as unknown as SupplierProfileRow[]
    const workspaceIds = typedProfiles.map(p => p.workspace_id)

    const { data: services, error: servicesErr } = await supabase
      .from("supplier_workspace_services")
      .select("id, workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence, active")
      .in("workspace_id", workspaceIds)
      .eq("active", true)

    if (servicesErr && !is42P01(servicesErr)) {
      console.warn("[public-marketplace] services query error:", servicesErr.message)
    }

    const servicesByWorkspace = new Map<string, SupplierServiceRow[]>()
    for (const svc of (services ?? []) as SupplierServiceRow[]) {
      const arr = servicesByWorkspace.get(svc.workspace_id) ?? []
      arr.push(svc)
      servicesByWorkspace.set(svc.workspace_id, arr)
    }

    const providers: PublicProvider[] = typedProfiles.map(p =>
      mapRowToProvider(
        p,
        /* avgRating */ 4.5,
        /* reviewCount */ 0,
        servicesByWorkspace.get(p.workspace_id) ?? [],
      )
    )

    const offers: PublicServiceOffer[] = []
    for (const profile of typedProfiles) {
      const svcs = servicesByWorkspace.get(profile.workspace_id) ?? []
      for (const svc of svcs) {
        offers.push(mapRowToServiceOffer(svc, profile, 4.5, 0))
      }
    }

    const emergencyServices: PublicEmergencyService[] = typedProfiles
      .filter(p => p.accepts_emergency)
      .map(p => {
        const svcs = servicesByWorkspace.get(p.workspace_id) ?? []
        const name = p.display_name ?? "Emergency Supplier"
        const slug = slugify(name, `emergency-${p.workspace_id}`)
        const calloutSvc = svcs.find(s => s.callout_fee_pence != null)
        return {
          id: p.workspace_id,
          slug,
          title: `24/7 Emergency ${p.trades?.[0] ?? "Maintenance"}`,
          subtitle: `Emergency response from ${name}`,
          category: p.trades?.[0] ?? "General Maintenance",
          providerName: name,
          providerSlug: slugify(name, `provider-${p.workspace_id}`),
          providerAvatar: "",
          leadTechnicianName: name,
          leadTechnicianRole: "Lead Technician",
          phone: "Contact via Propvora",
          rating: 4.5,
          reviewCount: 0,
          responseTimeMin: Math.round((p.response_time_hours ?? 4) * 60),
          responseTimeMax: Math.round((p.response_time_hours ?? 4) * 60 * 1.5),
          heroImage: "",
          location: p.base_location ?? "United Kingdom",
          coveragePostcodes: [],
          available24h: true,
          policeVetted: false,
          insured: p.insurance_verified,
          insuranceAmount: p.public_liability_cover_pence != null
            ? `£${(p.public_liability_cover_pence / 100).toLocaleString()}`
            : "Not disclosed",
          baseCalloutPrice: calloutSvc?.callout_fee_pence ?? 0,
          noCalloutFee: (calloutSvc?.callout_fee_pence ?? 0) === 0,
          description: p.bio ?? undefined,
          coverageLat: Number(p.latitude ?? 51.5),
          coverageLng: Number(p.longitude ?? -0.12),
        } satisfies PublicEmergencyService
      })

    const result: LiveData = { providers, offers, emergencyServices }
    _cache = result
    _cacheTs = now
    return result
  } catch (err) {
    if (is42P01(err)) return null
    console.warn("[public-marketplace] unexpected error loading live data:", err)
    return null
  }
}

// ─── Stays (always seed — stays come from property listings, not supplier tables) ──

export async function getPublicStays(): Promise<PublicStay[]> {
  return EXPANDED_STAYS
}

export async function getPublicStayBySlug(slug: string): Promise<PublicStay | null> {
  return EXPANDED_STAYS.find(s => s.slug === slug) ?? null
}

// ─── Providers ───────────────────────────────────────────────────────────────

export async function getPublicProviders(): Promise<PublicProvider[]> {
  const live = await loadLiveData()
  // Merge live + seed (deduped by slug) so the public + PM marketplace stay rich
  // even when only a few real suppliers exist (was either/or → 1-card sparse page).
  const liveRows = live?.providers ?? []
  const seen = new Set(liveRows.map(p => p.slug))
  const merged = [...liveRows, ...EXPANDED_PROVIDERS.filter(p => !seen.has(p.slug))]
  return merged.map(withProviderMedia)
}

export async function getPublicProviderBySlug(slug: string): Promise<PublicProvider | null> {
  const providers = await getPublicProviders()
  return providers.find(p => p.slug === slug) ?? null
}

export async function getFeaturedProviders(): Promise<PublicProvider[]> {
  const providers = await getPublicProviders()
  const featured = providers.filter(p => p.featured)
  // If no providers are marked featured (likely on live data), return first 4
  return featured.length > 0 ? featured : providers.slice(0, 4)
}

// ─── Service Offers ───────────────────────────────────────────────────────────

export async function getPublicServiceOffers(): Promise<PublicServiceOffer[]> {
  const live = await loadLiveData()
  const liveRows = live?.offers ?? []
  const seen = new Set(liveRows.map(s => s.slug))
  const merged = [...liveRows, ...EXPANDED_SERVICE_OFFERS.filter(s => !seen.has(s.slug))]
  return merged.map(withServiceMedia)
}

export async function getPublicServiceOfferBySlug(slug: string): Promise<PublicServiceOffer | null> {
  const offers = await getPublicServiceOffers()
  return offers.find(s => s.slug === slug) ?? null
}

export async function getFeaturedServiceOffers(): Promise<PublicServiceOffer[]> {
  const offers = await getPublicServiceOffers()
  const featured = offers.filter(s => s.featured)
  return featured.length > 0 ? featured : offers.slice(0, 4)
}

// ─── Emergency Services ───────────────────────────────────────────────────────

export async function getPublicEmergencyServices(): Promise<PublicEmergencyService[]> {
  const live = await loadLiveData()
  const liveRows = live?.emergencyServices ?? []
  const seen = new Set(liveRows.map(s => s.slug))
  const merged = [...liveRows, ...SEED_EMERGENCY_SERVICES.filter(s => !seen.has(s.slug))]
  return merged.map(withEmergencyMedia)
}

export async function getPublicEmergencyServiceBySlug(slug: string): Promise<PublicEmergencyService | null> {
  const services = await getPublicEmergencyServices()
  return services.find(s => s.slug === slug) ?? null
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
        results = results.filter(r => r.furnishingStatus === "Furnished")
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
