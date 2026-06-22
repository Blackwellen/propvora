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
import {
  rotatingFeatured, similarItems,
  scoreStay, scoreRental, scoreProvider, scoreOffer, scoreEmergency,
} from './ranking'
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

// ─── Stays ─────────────────────────────────────────────────────────────────
// REAL published stay listings (marketplace_listings, transaction_type=
// 'stay_booking') are merged FIRST so they're bookable end-to-end via the
// reserve→escrow flow; the expanded seed fills out the marketplace for demo.

const STAY_PHOTOS = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
  "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858",
]

function dbRowToStay(r: Record<string, unknown>): PublicStay {
  const g = (k: string) => r[k]
  const id = String(g("id"))
  const title = String(g("title") ?? "Stay")
  const slug = `${slugify(title, id)}-${id.slice(0, 4)}`
  const images = (g("images") as string[] | null) ?? []
  const media = (g("media_r2_keys") as string[] | null) ?? []
  const meta = (g("metadata") as Record<string, unknown> | null) ?? {}
  const heroImage =
    images[0] ||
    (media[0] ? `/api/files/${media[0]}` : "") ||
    (meta.hero as string | undefined) ||
    `${STAY_PHOTOS[Math.abs(hashStr(id)) % STAY_PHOTOS.length]}?auto=format&fit=crop&w=800&q=80`
  // Nightly price in pence — use base_price_pence because that is EXACTLY what
  // the reserve RPC charges, so the public price always matches the charge.
  // (Some seed rows have base_price_pence = price × 1000 rather than × 100 — a
  // data quirk to correct at source; display stays consistent with the charge.)
  const priceMajor = Number(g("price") ?? 0)
  const nightlyPence = Number(g("base_price_pence") ?? 0) || (priceMajor > 0 ? Math.round(priceMajor * 100) : 0)
  const beds = Number(g("bedrooms") ?? 1)
  return {
    id, slug, title,
    stayType: "Entire home",
    location: String(g("location") ?? g("location_city") ?? "United Kingdom"),
    city: String(g("location_city") ?? "United Kingdom"),
    postcode: String(g("location_postcode") ?? g("postcode") ?? ""),
    beds, bathrooms: Number(g("bathrooms") ?? 1), guests: Math.max(2, beds * 2), bedrooms: beds,
    rating: Number(g("rating") ?? 4.7), reviewCount: Number(g("review_count") ?? 0),
    pricePerNight: nightlyPence, cleaningFee: 0, serviceFee: 0, taxes: 0,
    verified: Boolean(g("verified")), instantBook: Boolean(g("instant_book")),
    freeCancellation: true, shortLets: true, longStays: false, petsAllowed: false,
    hostName: String(g("company_name") ?? "Propvora Host"), hostAvatar: "", hostProBadge: Boolean(g("verified")),
    hostProperties: 0, hostRating: Number(g("rating") ?? 4.7), hostReviews: Number(g("review_count") ?? 0), hostResponseTime: "within an hour",
    heroImage, gallery: images.length ? images : [heroImage],
    lat: Number(g("latitude") ?? 51.5), lng: Number(g("longitude") ?? -0.12),
    amenities: ((g("features") as string[] | null) ?? []).slice(0, 8),
    badges: Boolean(g("verified")) ? ["Verified"] : [],
    description: String(g("description") ?? ""),
  }
}

let _stayCache: PublicStay[] | null = null
let _stayCacheTs = 0

async function loadLiveStays(): Promise<PublicStay[]> {
  const now = Date.now()
  if (_stayCache && now - _stayCacheTs < CACHE_TTL_MS) return _stayCache
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select(
        "id, title, description, rating, review_count, verified, location, location_city, " +
        "location_postcode, postcode, bedrooms, bathrooms, instant_book, images, media_r2_keys, " +
        "metadata, features, base_price_pence, price, latitude, longitude, company_name"
      )
      .eq("transaction_type", "stay_booking")
      .eq("status", "published")
    if (error || !data) return []
    const stays = (data as unknown as Record<string, unknown>[]).map(dbRowToStay)
    _stayCache = stays
    _stayCacheTs = now
    return stays
  } catch {
    return []
  }
}

export async function getPublicStays(): Promise<PublicStay[]> {
  const live = await loadLiveStays()
  const seen = new Set(live.map(s => s.slug))
  return [...live, ...EXPANDED_STAYS.filter(s => !seen.has(s.slug))]
}

export async function getPublicStayBySlug(slug: string): Promise<PublicStay | null> {
  const live = await loadLiveStays()
  return live.find(s => s.slug === slug) ?? EXPANDED_STAYS.find(s => s.slug === slug) ?? null
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
  // Rotate the featured set daily so the top of the page isn't always identical.
  return rotatingFeatured(providers, 4, "providers")
}

// ─── Service Offers ───────────────────────────────────────────────────────────
// Real published marketplace_listings (service_package) are merged FIRST so the
// operator suppliers-hub can purchase them through the real escrow engine
// (/api/marketplace/checkout) — their `id` is the real listing id.

function dbRowToServiceOffer(r: Record<string, unknown>): PublicServiceOffer {
  const g = (k: string) => r[k]
  const id = String(g("id"))
  const title = String(g("title") ?? "Service")
  const slug = `${slugify(title, id)}-${id.slice(0, 4)}`
  const images = (g("images") as string[] | null) ?? []
  const priceMajor = Number(g("price") ?? 0)
  const basePence = Number(g("base_price_pence") ?? 0) || (priceMajor > 0 ? Math.round(priceMajor * 100) : 0)
  const provider = String(g("company_name") ?? "Propvora Supplier")
  return {
    id, slug, title,
    subtitle: String(g("description") ?? "").slice(0, 120),
    category: String(g("category") ?? "General"),
    providerName: provider, providerSlug: slugify(provider, id), providerAvatar: "",
    providerPro: Boolean(g("verified")),
    rating: Number(g("rating") ?? 4.7), reviewCount: Number(g("review_count") ?? 0), jobsDone: 0,
    location: String(g("location") ?? g("location_city") ?? "United Kingdom"),
    city: String(g("location_city") ?? "United Kingdom"),
    heroImage: images[0] || "", gallery: images,
    basePrice: basePence, standardPrice: Math.round(basePence * 1.3), premiumPrice: Math.round(basePence * 1.6),
    duration: "To be confirmed", responseTime: "Within 24 hours", nextAvailable: "Contact for availability",
    featured: Boolean(g("is_featured")), verified: Boolean(g("verified")), insured: Boolean(g("verified")), urgent: false,
    deliverables: ((g("features") as string[] | null) ?? []).slice(0, 6),
    tags: [String(g("category") ?? "General")],
    lat: Number(g("latitude") ?? 51.5), lng: Number(g("longitude") ?? -0.12),
  }
}

let _svcCache: PublicServiceOffer[] | null = null
let _svcCacheTs = 0

async function loadLiveServiceListings(): Promise<PublicServiceOffer[]> {
  const now = Date.now()
  if (_svcCache && now - _svcCacheTs < CACHE_TTL_MS) return _svcCache
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select(
        "id, title, description, company_name, rating, review_count, verified, base_price_pence, " +
        "price, category, location, location_city, latitude, longitude, is_featured, features, images"
      )
      .eq("transaction_type", "service_package")
      .eq("status", "published")
    if (error || !data) return []
    const offers = (data as unknown as Record<string, unknown>[]).map(dbRowToServiceOffer)
    _svcCache = offers
    _svcCacheTs = now
    return offers
  } catch {
    return []
  }
}

export async function getPublicServiceOffers(): Promise<PublicServiceOffer[]> {
  const dbListings = await loadLiveServiceListings()
  const live = await loadLiveData()
  const liveRows = live?.offers ?? []
  const seen = new Set([...dbListings.map(s => s.slug), ...liveRows.map(s => s.slug)])
  const merged = [
    ...dbListings,
    ...liveRows,
    ...EXPANDED_SERVICE_OFFERS.filter(s => !seen.has(s.slug)),
  ]
  return merged.map(withServiceMedia)
}

export async function getPublicServiceOfferBySlug(slug: string): Promise<PublicServiceOffer | null> {
  const offers = await getPublicServiceOffers()
  return offers.find(s => s.slug === slug) ?? null
}

export async function getFeaturedServiceOffers(): Promise<PublicServiceOffer[]> {
  const offers = await getPublicServiceOffers()
  return rotatingFeatured(offers, 4, "services")
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

// ─── Similar / "you might also like" ──────────────────────────────────────────
// Score-ranked + daily-jittered so the related rail isn't always identical.

export async function getSimilarStays(slug: string, count = 4): Promise<PublicStay[]> {
  const stays = await getPublicStays()
  const target = stays.find(s => s.slug === slug)
  if (!target) return stays.slice(0, count)
  return similarItems(target, stays, count, scoreStay)
}

export async function getSimilarLongTermRentals(slug: string, count = 4): Promise<PublicLongTermRental[]> {
  const rentals = await getPublicLongTermRentals()
  const target = rentals.find(r => r.slug === slug)
  if (!target) return rentals.slice(0, count)
  return similarItems(target, rentals, count, scoreRental)
}

export async function getSimilarProviders(slug: string, count = 4): Promise<PublicProvider[]> {
  const providers = await getPublicProviders()
  const target = providers.find(p => p.slug === slug)
  if (!target) return rotatingFeatured(providers, count, "providers")
  return similarItems(target, providers, count, scoreProvider)
}

export async function getSimilarServiceOffers(slug: string, count = 4): Promise<PublicServiceOffer[]> {
  const offers = await getPublicServiceOffers()
  const target = offers.find(o => o.slug === slug)
  if (!target) return rotatingFeatured(offers, count, "services")
  return similarItems(target, offers, count, scoreOffer)
}

export async function getSimilarEmergencyServices(slug: string, count = 4): Promise<PublicEmergencyService[]> {
  const services = await getPublicEmergencyServices()
  const target = services.find(s => s.slug === slug)
  if (!target) return services.slice(0, count)
  return similarItems(target, services, count, scoreEmergency)
}
