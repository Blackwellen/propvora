// ============================================================================
// Booking listings — operator-side CRUD over `booking_listings` (+ photos,
// amenities) and the publish-readiness gate. A booking_listing is a sellable
// stay product, separate from the property record and from marketplace_listings.
//
// Publish gate (enforced in `publishListing`): a listing cannot go live without
//   • a linked property (or unit)            • at least one photo
//   • an active pricing profile (base > 0)    • open availability (>=1 bookable day)
//   • a cancellation policy                    • a title
// Each missing requirement is returned as a structured blocker so the UI can
// show exactly what's outstanding.
//
// 42P01/error tolerant reads (return []/null). Money is integer pence.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export type ListingType =
  | "entire_home"
  | "private_room"
  | "shared_room"
  | "serviced_accommodation"
  | "student_room"
  | "hmo_room"
  | "unit"
  | "other"

export type ListingStatus = "draft" | "in_review" | "published" | "paused" | "archived"
export type BookingMode = "instant" | "request" | "enquiry"
export type CancellationPolicy = "flexible" | "moderate" | "strict" | "non_refundable" | "custom"

export interface BookingListing {
  id: string
  workspaceId: string
  propertyId: string | null
  unitId: string | null
  listingType: ListingType
  title: string
  slug: string | null
  summary: string | null
  description: string | null
  status: ListingStatus
  bookingMode: BookingMode
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: unknown[]
  houseRules: Record<string, unknown>
  checkInWindow: string | null
  checkoutTime: string | null
  cancellationPolicy: CancellationPolicy
  pricingProfileId: string | null
  countryCode: string
  currency: string
  timezone: string
  complianceStatus: string
  coverPhotoId: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

const COLS =
  "id, workspace_id, property_id, unit_id, listing_type, title, slug, summary, description, status, " +
  "booking_mode, max_guests, bedrooms, beds, bathrooms, amenities, house_rules, check_in_window, " +
  "checkout_time, cancellation_policy, pricing_profile_id, country_code, currency, timezone, " +
  "compliance_status, cover_photo_id, published_at, created_at, updated_at"

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

interface ListingRow {
  id: string
  workspace_id: string
  property_id: string | null
  unit_id: string | null
  listing_type: ListingType
  title: string
  slug: string | null
  summary: string | null
  description: string | null
  status: ListingStatus
  booking_mode: BookingMode
  max_guests: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: unknown
  house_rules: unknown
  check_in_window: string | null
  checkout_time: string | null
  cancellation_policy: CancellationPolicy
  pricing_profile_id: string | null
  country_code: string
  currency: string
  timezone: string
  compliance_status: string
  cover_photo_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

function mapRow(r: ListingRow): BookingListing {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    propertyId: r.property_id,
    unitId: r.unit_id,
    listingType: r.listing_type,
    title: r.title,
    slug: r.slug,
    summary: r.summary,
    description: r.description,
    status: r.status,
    bookingMode: r.booking_mode,
    maxGuests: Number(r.max_guests) || 1,
    bedrooms: Number(r.bedrooms) || 0,
    beds: Number(r.beds) || 0,
    bathrooms: Number(r.bathrooms) || 0,
    amenities: Array.isArray(r.amenities) ? r.amenities : [],
    houseRules: (r.house_rules as Record<string, unknown>) ?? {},
    checkInWindow: r.check_in_window,
    checkoutTime: r.checkout_time,
    cancellationPolicy: r.cancellation_policy,
    pricingProfileId: r.pricing_profile_id,
    countryCode: r.country_code || "GB",
    currency: r.currency || "GBP",
    timezone: r.timezone || "Europe/London",
    complianceStatus: r.compliance_status || "pending",
    coverPhotoId: r.cover_photo_id,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────

/** List a workspace's booking listings (operator view). Tolerant → []. */
export async function listBookingListings(
  supabase: SupabaseClient,
  workspaceId: string,
  opts?: { status?: ListingStatus | ListingStatus[] }
): Promise<BookingListing[]> {
  try {
    let q = supabase.from("booking_listings").select(COLS).eq("workspace_id", workspaceId)
    if (opts?.status) {
      q = Array.isArray(opts.status) ? q.in("status", opts.status) : q.eq("status", opts.status)
    }
    const { data, error } = await q.order("created_at", { ascending: false }).limit(500)
    if (error || !Array.isArray(data)) return []
    return data.map((r) => mapRow(r as unknown as ListingRow))
  } catch (err) {
    if (isMissingTable(err)) return []
    return []
  }
}

/** Fetch one booking listing (RLS-scoped). Tolerant → null. */
export async function getBookingListing(
  supabase: SupabaseClient,
  listingId: string
): Promise<BookingListing | null> {
  try {
    const { data, error } = await supabase
      .from("booking_listings")
      .select(COLS)
      .eq("id", listingId)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as ListingRow)
  } catch {
    return null
  }
}

// ── Photos / amenities ───────────────────────────────────────────────────────

export interface ListingPhoto {
  id: string
  listingId: string
  url: string | null
  r2Key: string | null
  caption: string | null
  roomTag: string | null
  sortOrder: number
  isCover: boolean
}

export async function listListingPhotos(
  supabase: SupabaseClient,
  listingId: string
): Promise<ListingPhoto[]> {
  try {
    const { data, error } = await supabase
      .from("booking_listing_photos")
      .select("id, listing_id, url, r2_key, caption, room_tag, sort_order, is_cover")
      .eq("listing_id", listingId)
      .order("sort_order", { ascending: true })
    if (error || !Array.isArray(data)) return []
    return data.map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id),
        listingId: String(row.listing_id),
        url: (row.url as string) ?? null,
        r2Key: (row.r2_key as string) ?? null,
        caption: (row.caption as string) ?? null,
        roomTag: (row.room_tag as string) ?? null,
        sortOrder: Number(row.sort_order) || 0,
        isCover: Boolean(row.is_cover),
      }
    })
  } catch {
    return []
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export interface CreateListingInput {
  workspaceId: string
  propertyId?: string | null
  unitId?: string | null
  listingType?: ListingType
  title: string
  summary?: string | null
  bookingMode?: BookingMode
  maxGuests?: number
  bedrooms?: number
  beds?: number
  bathrooms?: number
  countryCode?: string
  currency?: string
  cancellationPolicy?: CancellationPolicy
  createdBy?: string | null
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60)
}

/** Create a draft booking listing. Returns the created row or null. */
export async function createBookingListing(
  supabase: SupabaseClient,
  input: CreateListingInput
): Promise<BookingListing | null> {
  const base = slugify(input.title || "listing")
  const slug = `${base || "listing"}-${Math.random().toString(36).slice(2, 7)}`
  try {
    const { data, error } = await supabase
      .from("booking_listings")
      .insert({
        workspace_id: input.workspaceId,
        property_id: input.propertyId ?? null,
        unit_id: input.unitId ?? null,
        listing_type: input.listingType ?? "entire_home",
        title: input.title.trim() || "Untitled listing",
        slug,
        summary: input.summary ?? null,
        booking_mode: input.bookingMode ?? "request",
        max_guests: Math.max(1, Math.trunc(input.maxGuests ?? 2)),
        bedrooms: Math.max(0, Math.trunc(input.bedrooms ?? 1)),
        beds: Math.max(0, Math.trunc(input.beds ?? 1)),
        bathrooms: Math.max(0, input.bathrooms ?? 1),
        country_code: input.countryCode ?? "GB",
        currency: input.currency ?? "GBP",
        cancellation_policy: input.cancellationPolicy ?? "flexible",
        status: "draft",
        created_by: input.createdBy ?? null,
      })
      .select(COLS)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as ListingRow)
  } catch {
    return null
  }
}

/** Patch fields on a booking listing. Returns the updated row or null. */
export async function updateBookingListing(
  supabase: SupabaseClient,
  listingId: string,
  patch: Partial<{
    title: string
    summary: string | null
    description: string | null
    listingType: ListingType
    bookingMode: BookingMode
    maxGuests: number
    bedrooms: number
    beds: number
    bathrooms: number
    amenities: unknown[]
    houseRules: Record<string, unknown>
    checkInWindow: string | null
    checkoutTime: string | null
    cancellationPolicy: CancellationPolicy
    pricingProfileId: string | null
    propertyId: string | null
    unitId: string | null
    status: ListingStatus
  }>
): Promise<BookingListing | null> {
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.summary !== undefined) row.summary = patch.summary
  if (patch.description !== undefined) row.description = patch.description
  if (patch.listingType !== undefined) row.listing_type = patch.listingType
  if (patch.bookingMode !== undefined) row.booking_mode = patch.bookingMode
  if (patch.maxGuests !== undefined) row.max_guests = Math.max(1, Math.trunc(patch.maxGuests))
  if (patch.bedrooms !== undefined) row.bedrooms = Math.max(0, Math.trunc(patch.bedrooms))
  if (patch.beds !== undefined) row.beds = Math.max(0, Math.trunc(patch.beds))
  if (patch.bathrooms !== undefined) row.bathrooms = Math.max(0, patch.bathrooms)
  if (patch.amenities !== undefined) row.amenities = patch.amenities
  if (patch.houseRules !== undefined) row.house_rules = patch.houseRules
  if (patch.checkInWindow !== undefined) row.check_in_window = patch.checkInWindow
  if (patch.checkoutTime !== undefined) row.checkout_time = patch.checkoutTime
  if (patch.cancellationPolicy !== undefined) row.cancellation_policy = patch.cancellationPolicy
  if (patch.pricingProfileId !== undefined) row.pricing_profile_id = patch.pricingProfileId
  if (patch.propertyId !== undefined) row.property_id = patch.propertyId
  if (patch.unitId !== undefined) row.unit_id = patch.unitId
  if (patch.status !== undefined) row.status = patch.status
  if (Object.keys(row).length === 0) return getBookingListing(supabase, listingId)
  try {
    const { data, error } = await supabase
      .from("booking_listings")
      .update(row)
      .eq("id", listingId)
      .select(COLS)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as ListingRow)
  } catch {
    return null
  }
}

// ── Publish gate ─────────────────────────────────────────────────────────────

export interface PublishBlocker {
  key: string
  label: string
}

export interface PublishReadiness {
  ready: boolean
  blockers: PublishBlocker[]
  checks: { key: string; label: string; done: boolean }[]
}

/**
 * Evaluate publish-readiness for a listing WITHOUT mutating it. Inspects the
 * listing, its photos, its pricing profile and its availability grid. Returns a
 * structured list of checks + blockers.
 */
export async function evaluatePublishReadiness(
  supabase: SupabaseClient,
  listingId: string
): Promise<PublishReadiness> {
  const listing = await getBookingListing(supabase, listingId)
  const checks: { key: string; label: string; done: boolean }[] = []

  const hasTitle = !!listing && listing.title.trim().length > 2 && listing.title !== "Untitled listing"
  const hasProperty = !!listing && (!!listing.propertyId || !!listing.unitId)
  const hasCancellation = !!listing && !!listing.cancellationPolicy

  // photos
  let photoCount = 0
  try {
    const { count } = await supabase
      .from("booking_listing_photos")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId)
    photoCount = count ?? 0
  } catch {
    /* tolerant */
  }

  // pricing
  let hasPricing = false
  try {
    const { data } = await supabase
      .from("booking_pricing_profiles")
      .select("base_nightly_pence")
      .eq("listing_id", listingId)
      .eq("is_active", true)
      .gt("base_nightly_pence", 0)
      .limit(1)
      .maybeSingle()
    hasPricing = !!data
  } catch {
    /* tolerant */
  }

  // availability — at least one bookable day in the next 365 days
  let hasAvailability = false
  try {
    const { count } = await supabase
      .from("booking_availability_days")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId)
      .eq("status", "available")
    hasAvailability = (count ?? 0) > 0
  } catch {
    /* tolerant */
  }

  checks.push({ key: "title", label: "Listing has a descriptive title", done: hasTitle })
  checks.push({ key: "property", label: "Linked to a property or unit", done: hasProperty })
  checks.push({ key: "photos", label: "At least one photo uploaded", done: photoCount > 0 })
  checks.push({ key: "pricing", label: "Active pricing with a nightly rate", done: hasPricing })
  checks.push({ key: "availability", label: "Open availability set", done: hasAvailability })
  checks.push({ key: "cancellation", label: "Cancellation policy selected", done: hasCancellation })

  const blockers: PublishBlocker[] = checks
    .filter((c) => !c.done)
    .map((c) => ({ key: c.key, label: c.label }))

  return { ready: blockers.length === 0 && !!listing, blockers, checks }
}

/**
 * Publish a listing — ENFORCES the publish gate. Returns the updated listing on
 * success, or { error, blockers } when readiness checks fail. Never publishes a
 * listing that isn't ready.
 */
export async function publishListing(
  supabase: SupabaseClient,
  listingId: string
): Promise<{ listing?: BookingListing; error?: string; blockers?: PublishBlocker[] }> {
  const readiness = await evaluatePublishReadiness(supabase, listingId)
  if (!readiness.ready) {
    return { error: "Listing is not ready to publish.", blockers: readiness.blockers }
  }
  try {
    const { data, error } = await supabase
      .from("booking_listings")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", listingId)
      .select(COLS)
      .maybeSingle()
    if (error || !data) return { error: error?.message ?? "Publish failed." }
    return { listing: mapRow(data as unknown as ListingRow) }
  } catch (err) {
    return { error: (err as { message?: string })?.message ?? "Publish failed." }
  }
}

/** Pause a published listing (stops new bookings; keeps existing). */
export async function pauseListing(
  supabase: SupabaseClient,
  listingId: string
): Promise<BookingListing | null> {
  return updateBookingListing(supabase, listingId, { status: "paused" })
}
