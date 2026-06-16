"use server"

import { createClient } from "@/lib/supabase/server"
import { resolveWorkspaceContext } from "@/lib/context/workspace-context"
import { gateBookingPages } from "@/lib/billing/gates"
import {
  createBookingListing,
  updateBookingListing,
  publishListing as libPublishListing,
  pauseListing as libPauseListing,
  evaluatePublishReadiness,
  type ListingType,
  type BookingMode,
  type CancellationPolicy,
  type ListingStatus,
} from "@/lib/booking/booking-listings"
import { upsertPricingProfile } from "@/lib/booking/pricing-profiles"
import { setAvailabilityDay, setAvailabilityRange, seedAvailabilityWindow } from "@/lib/booking/availability"

/* ──────────────────────────────────────────────────────────────────────────
   Deep booking server actions — booking_listings CRUD, pricing profiles,
   availability days and the publish gate. Every action re-resolves the active
   workspace + re-checks the booking entitlement server-side (never trusts the
   client). Results are structured { ok, error } — these never throw to the UI.
─────────────────────────────────────────────────────────────────────────── */

type SB = Awaited<ReturnType<typeof createClient>>

export interface DeepResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

async function resolveWorkspaceId(supabase: SB, userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", userId)
      .maybeSingle()
    const fromProfile = (profile?.current_workspace_id as string | undefined) ?? null
    if (fromProfile) return fromProfile
    const { data: m } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    return (m?.workspace_id as string | undefined) ?? null
  } catch {
    return null
  }
}

async function authorise(): Promise<
  { ok: true; supabase: SB; workspaceId: string; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "You need to be signed in." }
  const workspaceId = await resolveWorkspaceId(supabase, user.id)
  if (!workspaceId) return { ok: false, error: "No active workspace found." }
  await resolveWorkspaceContext(supabase, workspaceId)
  const gate = await gateBookingPages(supabase, workspaceId)
  if (!gate.allowed) return { ok: false, error: gate.reason ?? "Booking management isn't on your plan." }
  return { ok: true, supabase, workspaceId, userId: user.id }
}

// ── Listing CRUD ────────────────────────────────────────────────────────────

export interface CreateListingActionInput {
  title: string
  listingType?: ListingType
  propertyId?: string | null
  bookingMode?: BookingMode
  maxGuests?: number
  bedrooms?: number
  beds?: number
  bathrooms?: number
  countryCode?: string
  currency?: string
  cancellationPolicy?: CancellationPolicy
}

export async function createListing(
  input: CreateListingActionInput
): Promise<DeepResult<{ id: string }>> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (!input.title?.trim()) return { ok: false, error: "A title is required." }
  const listing = await createBookingListing(auth.supabase, {
    workspaceId: auth.workspaceId,
    title: input.title,
    listingType: input.listingType,
    propertyId: input.propertyId ?? null,
    bookingMode: input.bookingMode,
    maxGuests: input.maxGuests,
    bedrooms: input.bedrooms,
    beds: input.beds,
    bathrooms: input.bathrooms,
    countryCode: input.countryCode ?? "GB",
    currency: input.currency,
    cancellationPolicy: input.cancellationPolicy,
    createdBy: auth.userId,
  })
  if (!listing) return { ok: false, error: "Could not create the listing." }
  return { ok: true, data: { id: listing.id } }
}

export interface UpdateListingActionInput {
  listingId: string
  title?: string
  summary?: string | null
  description?: string | null
  listingType?: ListingType
  bookingMode?: BookingMode
  maxGuests?: number
  bedrooms?: number
  beds?: number
  bathrooms?: number
  amenities?: string[]
  houseRules?: Record<string, unknown>
  checkInWindow?: string | null
  checkoutTime?: string | null
  cancellationPolicy?: CancellationPolicy
  propertyId?: string | null
  status?: ListingStatus
}

export async function updateListing(input: UpdateListingActionInput): Promise<DeepResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (!input.listingId) return { ok: false, error: "A listing is required." }
  const { listingId, ...patch } = input
  const updated = await updateBookingListing(auth.supabase, listingId, patch)
  if (!updated) return { ok: false, error: "Could not update the listing." }
  return { ok: true }
}

// ── Pricing ──────────────────────────────────────────────────────────────────

export interface SavePricingActionInput {
  listingId: string
  baseNightlyPence: number
  weekendPence?: number | null
  weeklyDiscountPct?: number
  monthlyDiscountPct?: number
  minNights?: number
  maxNights?: number | null
  cleaningFeePence?: number
  extraGuestFeePence?: number
  extraGuestAfter?: number
  securityDepositPence?: number
  currency?: string
}

export async function savePricingProfile(input: SavePricingActionInput): Promise<DeepResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (!input.listingId) return { ok: false, error: "A listing is required." }
  if (!Number.isFinite(input.baseNightlyPence) || input.baseNightlyPence < 0) {
    return { ok: false, error: "Enter a valid nightly rate." }
  }
  const saved = await upsertPricingProfile(auth.supabase, {
    workspaceId: auth.workspaceId,
    listingId: input.listingId,
    baseNightlyPence: input.baseNightlyPence,
    weekendPence: input.weekendPence,
    weeklyDiscountPct: input.weeklyDiscountPct,
    monthlyDiscountPct: input.monthlyDiscountPct,
    minNights: input.minNights,
    maxNights: input.maxNights,
    cleaningFeePence: input.cleaningFeePence,
    extraGuestFeePence: input.extraGuestFeePence,
    extraGuestAfter: input.extraGuestAfter,
    securityDepositPence: input.securityDepositPence,
    currency: input.currency,
  })
  if (!saved) return { ok: false, error: "Could not save pricing." }
  return { ok: true }
}

// ── Availability ─────────────────────────────────────────────────────────────

export async function setDayStatus(
  listingId: string,
  date: string,
  status: string
): Promise<DeepResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const ok = await setAvailabilityDay(auth.supabase, listingId, date, {
    status: status as never,
  })
  return ok ? { ok: true } : { ok: false, error: "Could not update availability." }
}

export async function setDayPrice(
  listingId: string,
  date: string,
  priceOverridePence: number | null
): Promise<DeepResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const ok = await setAvailabilityDay(auth.supabase, listingId, date, { priceOverridePence })
  return ok ? { ok: true } : { ok: false, error: "Could not set the price override." }
}

export async function blockRange(
  listingId: string,
  from: string,
  toExclusive: string,
  block: boolean
): Promise<DeepResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const ok = await setAvailabilityRange(auth.supabase, listingId, from, toExclusive, {
    status: block ? "blocked_manual" : "available",
  })
  return ok ? { ok: true } : { ok: false, error: "Could not update the date range." }
}

export async function openAvailabilityWindow(
  listingId: string,
  from: string,
  days: number
): Promise<DeepResult<{ count: number }>> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const count = await seedAvailabilityWindow(auth.supabase, listingId, from, days)
  return { ok: count > 0, data: { count }, error: count > 0 ? undefined : "No days were opened." }
}

// ── Publish ──────────────────────────────────────────────────────────────────

export interface PublishActionResult extends DeepResult {
  blockers?: { key: string; label: string }[]
}

export async function checkPublishReadiness(
  listingId: string
): Promise<DeepResult<{ ready: boolean; checks: { key: string; label: string; done: boolean }[] }>> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const readiness = await evaluatePublishReadiness(auth.supabase, listingId)
  return { ok: true, data: { ready: readiness.ready, checks: readiness.checks } }
}

export async function publishListing(listingId: string): Promise<PublishActionResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const res = await libPublishListing(auth.supabase, listingId)
  if (res.listing) return { ok: true }
  return { ok: false, error: res.error ?? "Could not publish.", blockers: res.blockers }
}

export async function pauseListing(listingId: string): Promise<DeepResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const updated = await libPauseListing(auth.supabase, listingId)
  return updated ? { ok: true } : { ok: false, error: "Could not pause the listing." }
}
