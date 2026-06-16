// ============================================================================
// Accommodation-type registry + per-category field schemas + amenities catalogue
// data layer. Short-stays, long-term lets and shared rooms are different products
// with different field sets; this module is the single source of truth for
//   • which accommodation categories exist (+ their let-type defaults & grouping)
//   • which wizard/display sections each category shows
//   • the shape + parse/serialise of the `type_details` jsonb bag per category
//   • reads/writes for the amenities catalogue + a listing's selected amenities
//
// All reads are 42P01/42703-tolerant → empty/default, never throw. Money is
// integer pence (deposit_pence). Used by the operator wizard, the public detail
// page and the proof script.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

function isTolerable(err: unknown): boolean {
  const c = (err as { code?: string } | null)?.code
  return c === "42P01" || c === "42703" || c === "PGRST205" || c === "PGRST204"
}

// ── Categories ───────────────────────────────────────────────────────────────

export type AccommodationCategory =
  | "short_stay"
  | "serviced_accommodation"
  | "holiday_let"
  | "long_term_let"
  | "mid_term_let"
  | "hmo_room"
  | "student_room"
  | "co_living_room"
  | "commercial"

export type LetType = "entire" | "private_room" | "shared_room"

/** The three high-level families that drive which field sets apply. */
export type AccommodationFamily = "short" | "long" | "shared" | "commercial"

export interface CategoryMeta {
  value: AccommodationCategory
  label: string
  description: string
  family: AccommodationFamily
  /** Default let_type for this category. */
  defaultLetType: LetType
  /** Whether the category is room-level (shared accommodation). */
  roomLevel: boolean
  /** Whether nightly checkout applies (short-stay) vs enquire/apply (long-let). */
  nightlyCheckout: boolean
}

export const ACCOMMODATION_CATEGORIES: CategoryMeta[] = [
  {
    value: "short_stay",
    label: "Short stay",
    description: "Nightly bookings — city breaks, weekends, Airbnb-style.",
    family: "short",
    defaultLetType: "entire",
    roomLevel: false,
    nightlyCheckout: true,
  },
  {
    value: "serviced_accommodation",
    label: "Serviced accommodation",
    description: "Hotel-alternative stays with hospitality services.",
    family: "short",
    defaultLetType: "entire",
    roomLevel: false,
    nightlyCheckout: true,
  },
  {
    value: "holiday_let",
    label: "Holiday let",
    description: "Self-catering holiday homes and cottages.",
    family: "short",
    defaultLetType: "entire",
    roomLevel: false,
    nightlyCheckout: true,
  },
  {
    value: "long_term_let",
    label: "Long-term let",
    description: "Assured shorthold tenancies, 6+ months.",
    family: "long",
    defaultLetType: "entire",
    roomLevel: false,
    nightlyCheckout: false,
  },
  {
    value: "mid_term_let",
    label: "Mid-term let",
    description: "1–6 month corporate / relocation lets.",
    family: "long",
    defaultLetType: "entire",
    roomLevel: false,
    nightlyCheckout: false,
  },
  {
    value: "hmo_room",
    label: "HMO room",
    description: "A room in a house of multiple occupation.",
    family: "shared",
    defaultLetType: "private_room",
    roomLevel: true,
    nightlyCheckout: false,
  },
  {
    value: "student_room",
    label: "Student room",
    description: "Room in student accommodation, by academic term.",
    family: "shared",
    defaultLetType: "private_room",
    roomLevel: true,
    nightlyCheckout: false,
  },
  {
    value: "co_living_room",
    label: "Co-living room",
    description: "Room in a managed co-living community.",
    family: "shared",
    defaultLetType: "private_room",
    roomLevel: true,
    nightlyCheckout: false,
  },
  {
    value: "commercial",
    label: "Commercial",
    description: "Office, retail or commercial space.",
    family: "commercial",
    defaultLetType: "entire",
    roomLevel: false,
    nightlyCheckout: false,
  },
]

const CATEGORY_BY_VALUE = new Map(ACCOMMODATION_CATEGORIES.map((c) => [c.value, c]))

export function getCategoryMeta(value: string | null | undefined): CategoryMeta {
  return CATEGORY_BY_VALUE.get((value ?? "short_stay") as AccommodationCategory) ?? ACCOMMODATION_CATEGORIES[0]
}

export function categoryFamily(value: string | null | undefined): AccommodationFamily {
  return getCategoryMeta(value).family
}

/** Which wizard/display sections a category shows. Drives the type-aware UI. */
export interface CategorySections {
  amenities: boolean
  wifi: boolean
  keyless: boolean
  houseRules: boolean
  minMaxNights: boolean
  bills: boolean
  furnished: boolean
  deposit: boolean
  floorPlan: boolean
  epc: boolean
  councilTax: boolean
  tenancyLength: boolean
  availableFrom: boolean
  room: boolean
  sharedFacilities: boolean
  household: boolean
  /** Public CTA: instant nightly checkout vs apply/enquire. */
  applyFlow: boolean
}

export function sectionsForCategory(value: string | null | undefined): CategorySections {
  const fam = categoryFamily(value)
  if (fam === "short") {
    return {
      amenities: true, wifi: true, keyless: true, houseRules: true, minMaxNights: true,
      bills: false, furnished: false, deposit: false, floorPlan: false, epc: false,
      councilTax: false, tenancyLength: false, availableFrom: false, room: false,
      sharedFacilities: false, household: false, applyFlow: false,
    }
  }
  if (fam === "long" || fam === "commercial") {
    return {
      amenities: true, wifi: false, keyless: false, houseRules: false, minMaxNights: false,
      bills: true, furnished: true, deposit: true, floorPlan: true, epc: true,
      councilTax: true, tenancyLength: true, availableFrom: true, room: false,
      sharedFacilities: false, household: false, applyFlow: true,
    }
  }
  // shared
  return {
    amenities: true, wifi: true, keyless: true, houseRules: true, minMaxNights: false,
    bills: true, furnished: true, deposit: true, floorPlan: false, epc: true,
    councilTax: false, tenancyLength: true, availableFrom: true, room: true,
    sharedFacilities: true, household: true, applyFlow: true,
  }
}

// ── type_details shapes ──────────────────────────────────────────────────────

export type Furnished = "furnished" | "part_furnished" | "unfurnished"
export type DepositScheme = "dps" | "mydeposits" | "tds" | "other" | "none"

export interface BillsIncluded {
  water?: boolean
  gas?: boolean
  electric?: boolean
  internet?: boolean
  council_tax?: boolean
  tv_licence?: boolean
}

export interface SharedFacilities {
  kitchen?: boolean
  bathroom?: boolean
  lounge?: boolean
  garden?: boolean
  laundry?: boolean
}

/** Parsed, normalised view of the per-category type_details jsonb. */
export interface TypeDetails {
  // short-stay
  wifiName: string | null
  wifiPassword: string | null
  checkInMethod: string | null
  minNights: number | null
  maxNights: number | null
  // long/mid-term
  tenancyLengthMonths: number | null
  furnished: Furnished | null
  billsIncluded: BillsIncluded
  depositPence: number | null
  depositScheme: DepositScheme | null
  depositDeclaration: string | null
  availableFrom: string | null
  epcRating: string | null
  councilTaxBand: string | null
  floorPlanUrl: string | null
  // shared
  roomSizeSqm: number | null
  ensuite: boolean | null
  sharedFacilities: SharedFacilities
  householdSize: number | null
  contractLengthMonths: number | null
}

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null
}
function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v
  return null
}
function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

export function parseTypeDetails(raw: unknown): TypeDetails {
  const d = obj(raw)
  const bills = obj(d.bills_included)
  const shared = obj(d.shared_facilities)
  return {
    wifiName: str(d.wifi_name),
    wifiPassword: str(d.wifi_password),
    checkInMethod: str(d.check_in_method),
    minNights: num(d.min_nights),
    maxNights: num(d.max_nights),
    tenancyLengthMonths: num(d.tenancy_length_months),
    furnished: (str(d.furnished) as Furnished | null) ?? null,
    billsIncluded: {
      water: bool(bills.water) ?? undefined,
      gas: bool(bills.gas) ?? undefined,
      electric: bool(bills.electric) ?? undefined,
      internet: bool(bills.internet) ?? undefined,
      council_tax: bool(bills.council_tax) ?? undefined,
      tv_licence: bool(bills.tv_licence) ?? undefined,
    },
    depositPence: num(d.deposit_pence),
    depositScheme: (str(d.deposit_scheme) as DepositScheme | null) ?? null,
    depositDeclaration: str(d.deposit_declaration),
    availableFrom: str(d.available_from),
    epcRating: str(d.epc_rating),
    councilTaxBand: str(d.council_tax_band),
    floorPlanUrl: str(d.floor_plan_url),
    roomSizeSqm: num(d.room_size_sqm),
    ensuite: bool(d.ensuite),
    sharedFacilities: {
      kitchen: bool(shared.kitchen) ?? undefined,
      bathroom: bool(shared.bathroom) ?? undefined,
      lounge: bool(shared.lounge) ?? undefined,
      garden: bool(shared.garden) ?? undefined,
      laundry: bool(shared.laundry) ?? undefined,
    },
    householdSize: num(d.household_size),
    contractLengthMonths: num(d.contract_length_months),
  }
}

/** Serialise a partial TypeDetails patch back to the jsonb shape, dropping nulls. */
export function serialiseTypeDetails(patch: Partial<TypeDetails>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const set = (k: string, v: unknown) => {
    if (v !== null && v !== undefined) out[k] = v
  }
  set("wifi_name", patch.wifiName)
  set("wifi_password", patch.wifiPassword)
  set("check_in_method", patch.checkInMethod)
  set("min_nights", patch.minNights)
  set("max_nights", patch.maxNights)
  set("tenancy_length_months", patch.tenancyLengthMonths)
  set("furnished", patch.furnished)
  if (patch.billsIncluded) out.bills_included = cleanFlags(patch.billsIncluded as unknown as Record<string, unknown>)
  set("deposit_pence", patch.depositPence)
  set("deposit_scheme", patch.depositScheme)
  set("deposit_declaration", patch.depositDeclaration)
  set("available_from", patch.availableFrom)
  set("epc_rating", patch.epcRating)
  set("council_tax_band", patch.councilTaxBand)
  set("floor_plan_url", patch.floorPlanUrl)
  set("room_size_sqm", patch.roomSizeSqm)
  if (patch.ensuite !== null && patch.ensuite !== undefined) out.ensuite = patch.ensuite
  if (patch.sharedFacilities) out.shared_facilities = cleanFlags(patch.sharedFacilities as unknown as Record<string, unknown>)
  set("household_size", patch.householdSize)
  set("contract_length_months", patch.contractLengthMonths)
  return out
}

function cleanFlags(o: Record<string, unknown>): Record<string, boolean> {
  const r: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "boolean") r[k] = v
  }
  return r
}

export const BILL_LABELS: { key: keyof BillsIncluded; label: string }[] = [
  { key: "water", label: "Water" },
  { key: "gas", label: "Gas" },
  { key: "electric", label: "Electricity" },
  { key: "internet", label: "Internet" },
  { key: "council_tax", label: "Council tax" },
  { key: "tv_licence", label: "TV licence" },
]

export const SHARED_FACILITY_LABELS: { key: keyof SharedFacilities; label: string }[] = [
  { key: "kitchen", label: "Kitchen" },
  { key: "bathroom", label: "Bathroom" },
  { key: "lounge", label: "Lounge" },
  { key: "garden", label: "Garden" },
  { key: "laundry", label: "Laundry" },
]

export const FURNISHED_OPTIONS: { value: Furnished; label: string }[] = [
  { value: "furnished", label: "Furnished" },
  { value: "part_furnished", label: "Part furnished" },
  { value: "unfurnished", label: "Unfurnished" },
]

export const DEPOSIT_SCHEMES: { value: DepositScheme; label: string }[] = [
  { value: "dps", label: "Deposit Protection Service (DPS)" },
  { value: "mydeposits", label: "mydeposits" },
  { value: "tds", label: "Tenancy Deposit Scheme (TDS)" },
  { value: "other", label: "Other scheme" },
  { value: "none", label: "Not protected yet" },
]

// ── booking_listings category read/write ─────────────────────────────────────

/** The accommodation-typing columns on a booking_listings row. */
export interface ListingAccommodation {
  accommodationCategory: AccommodationCategory
  letType: LetType
  typeDetails: TypeDetails
  /** Raw jsonb bag (for round-tripping unknown keys we don't model). */
  rawTypeDetails: Record<string, unknown>
}

/**
 * Read the accommodation_category / let_type / type_details for one listing.
 * Tolerant → short_stay defaults, never throws. Used by wizard + public display.
 */
export async function getListingAccommodation(
  supabase: SupabaseClient,
  listingId: string
): Promise<ListingAccommodation> {
  const fallback: ListingAccommodation = {
    accommodationCategory: "short_stay",
    letType: "entire",
    typeDetails: parseTypeDetails({}),
    rawTypeDetails: {},
  }
  try {
    const { data, error } = await supabase
      .from("booking_listings")
      .select("accommodation_category, let_type, type_details")
      .eq("id", listingId)
      .maybeSingle()
    if (error || !data) return fallback
    const r = data as Record<string, unknown>
    const raw = obj(r.type_details)
    return {
      accommodationCategory: getCategoryMeta(r.accommodation_category as string).value,
      letType: ((r.let_type as LetType | null) ?? "entire") as LetType,
      typeDetails: parseTypeDetails(raw),
      rawTypeDetails: raw,
    }
  } catch (err) {
    if (isTolerable(err)) return fallback
    return fallback
  }
}

/**
 * Persist the accommodation typing for a listing. Validates the category against
 * the registry, derives a sane let_type default if not supplied, and MERGES the
 * type_details patch onto the existing bag (so partial saves don't wipe other
 * sections). Returns true on success.
 */
export async function setListingAccommodation(
  supabase: SupabaseClient,
  listingId: string,
  input: {
    accommodationCategory: string
    letType?: string | null
    typeDetailsPatch?: Partial<TypeDetails>
    replaceTypeDetails?: boolean
  }
): Promise<boolean> {
  const meta = getCategoryMeta(input.accommodationCategory)
  const letType: LetType =
    (input.letType as LetType | null) && ["entire", "private_room", "shared_room"].includes(input.letType as string)
      ? (input.letType as LetType)
      : meta.defaultLetType

  // Merge patch onto existing details unless an explicit replace is requested.
  let mergedDetails: Record<string, unknown> = {}
  if (input.typeDetailsPatch) {
    const serialised = serialiseTypeDetails(input.typeDetailsPatch)
    if (input.replaceTypeDetails) {
      mergedDetails = serialised
    } else {
      const current = await getListingAccommodation(supabase, listingId)
      mergedDetails = { ...current.rawTypeDetails, ...serialised }
    }
  }

  const row: Record<string, unknown> = {
    accommodation_category: meta.value,
    let_type: letType,
  }
  if (input.typeDetailsPatch) row.type_details = mergedDetails

  try {
    const { error } = await supabase.from("booking_listings").update(row).eq("id", listingId)
    return !error
  } catch {
    return false
  }
}

// ── Amenities catalogue ──────────────────────────────────────────────────────

export interface CatalogueAmenity {
  slug: string
  label: string
  category: string
  icon: string | null
  sortOrder: number
}

export const AMENITY_GROUP_LABELS: Record<string, string> = {
  essentials: "Essentials",
  features: "Standout features",
  parking: "Parking & access",
  checkin: "Getting in",
  safety: "Home safety",
  policies: "Policies & suitability",
  general: "Amenities",
}

/** Load the amenities catalogue (public). Tolerant → []. */
export async function listAmenityCatalogue(supabase: SupabaseClient): Promise<CatalogueAmenity[]> {
  try {
    const { data, error } = await supabase
      .from("accommodation_amenities")
      .select("slug, label, category, icon, sort_order")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
    if (error || !Array.isArray(data)) return []
    return (data as Record<string, unknown>[]).map((r) => ({
      slug: String(r.slug),
      label: String(r.label),
      category: String(r.category ?? "general"),
      icon: (r.icon as string | null) ?? null,
      sortOrder: Number(r.sort_order) || 0,
    }))
  } catch (err) {
    if (isTolerable(err)) return []
    return []
  }
}

/** The amenity slugs currently selected for a listing (from the link table). */
export async function getListingAmenitySlugs(
  supabase: SupabaseClient,
  listingId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("booking_listing_amenities")
      .select("amenity_slug, amenity_key")
      .eq("listing_id", listingId)
    if (error || !Array.isArray(data)) return []
    const out = new Set<string>()
    for (const r of data as Record<string, unknown>[]) {
      const slug = (r.amenity_slug as string | null) ?? (r.amenity_key as string | null)
      if (slug) out.add(slug)
    }
    return [...out]
  } catch {
    return []
  }
}

/**
 * Replace a listing's selected amenities with `slugs`, grouping each by its
 * catalogue category so the public display can render grouped sections. Returns
 * true on success. Workspace-member RLS on the link table is the boundary.
 */
export async function setListingAmenities(
  supabase: SupabaseClient,
  listingId: string,
  slugs: string[]
): Promise<boolean> {
  try {
    const catalogue = await listAmenityCatalogue(supabase)
    const bySlug = new Map(catalogue.map((a) => [a.slug, a]))
    const clean = [...new Set(slugs)].filter((s) => bySlug.has(s) || s.length > 0)

    // Wipe + reinsert (small set per listing).
    await supabase.from("booking_listing_amenities").delete().eq("listing_id", listingId)
    if (clean.length === 0) return true

    const rows = clean.map((slug) => {
      const meta = bySlug.get(slug)
      return {
        listing_id: listingId,
        amenity_key: slug,
        amenity_slug: slug,
        amenity_group: meta?.category ?? "general",
        value: meta?.label ?? slug.replace(/_/g, " "),
      }
    })
    const { error } = await supabase.from("booking_listing_amenities").insert(rows)
    return !error
  } catch {
    return false
  }
}
