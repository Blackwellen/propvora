import "server-only"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspaceContext } from "@/lib/context/workspace-context"
import { gateBookingPages } from "@/lib/billing/gates"
import { PLAN_DISPLAY, type PlanTier } from "@/lib/billing/plans"
import type { WorkspaceType } from "@/lib/context/context-types"

/* ──────────────────────────────────────────────────────────────────────────
   Operator BOOKING server access — workspace + entitlement resolution and the
   tolerant data layer for the operator booking management UI.

   Mirrors the marketplace server module: resolves the ACTIVE workspace
   server-side (profile.current_workspace_id → first membership), then gates the
   whole section on REAL entitlement via `gateBookingPages` — never a feature
   flag, never a client-only check. When the workspace isn't entitled we still
   render the section shell with a premium upgrade prompt (we never hide it).

   The booking schema + libs are owned by sibling agents and may not exist on
   this branch yet. EVERY read here is best-effort and 42P01-tolerant: a cold /
   migrating DB resolves to empty data + a "not ready" flag so the UI renders a
   coherent premium not-ready / empty state rather than crashing.

   All money is integer pence; we never format here — the edge (UI) formats.
─────────────────────────────────────────────────────────────────────────── */

/** Postgres / PostgREST codes meaning "the booking schema isn't provisioned". */
const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "PGRST202"])

function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned|relation .* does not exist/i.test(e.message ?? "")
}

// ── Entitlement / access ────────────────────────────────────────────────────

export interface BookingAccess {
  /** Active workspace id, or null when unresolved (signed-out / no membership). */
  workspaceId: string | null
  /** Workspace type (operator/supplier/customer/platform_admin). */
  workspaceType: WorkspaceType
  /** Plan tier for upgrade copy. */
  tier: PlanTier
  /** Human plan name for prompts. */
  planName: string
  /** Default country from the workspace context. */
  defaultCountry: string
  /** Entitlement: may this workspace manage bookings? */
  canManage: boolean
  /** Upgrade reason copy when `canManage` is false. */
  upgradeReason: string | null
}

/** Resolve the user's active workspace id (server-side). */
async function resolveActiveWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", userId)
      .maybeSingle()
    const fromProfile = (profile?.current_workspace_id as string | undefined) ?? null
    if (fromProfile) return fromProfile

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    return (membership?.workspace_id as string | undefined) ?? null
  } catch {
    return null
  }
}

/**
 * Resolve booking-section access for the current request. Operator workspaces
 * are gated on plan entitlement (`gateBookingPages`); the gate fails CLOSED for
 * tiers without it, which is surfaced as a premium upgrade prompt.
 */
export async function getBookingAccess(): Promise<BookingAccess> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      workspaceId: null,
      workspaceType: "operator",
      tier: "starter",
      planName: PLAN_DISPLAY.starter.name,
      defaultCountry: "GB",
      canManage: false,
      upgradeReason: "Sign in to a workspace with booking management to manage reservations.",
    }
  }

  const workspaceId = await resolveActiveWorkspaceId(supabase, user.id)
  const ctx = await resolveWorkspaceContext(supabase, workspaceId)

  const gate = workspaceId ? await gateBookingPages(supabase, workspaceId) : null
  const tier = (gate?.tier ?? "starter") as PlanTier

  return {
    workspaceId,
    workspaceType: ctx.type,
    tier,
    planName: PLAN_DISPLAY[tier]?.name ?? "Starter",
    defaultCountry: ctx.businessCountryCode,
    canManage: gate?.allowed ?? false,
    upgradeReason: gate && !gate.allowed ? (gate.reason ?? null) : null,
  }
}

// ── Tolerant dynamic loaders for the sibling booking libs ───────────────────

type SB = Awaited<ReturnType<typeof createClient>>

interface ReservationsLib {
  listBookings?: (
    supabase: SB,
    workspaceId: string,
    filters?: Record<string, unknown>
  ) => Promise<unknown>
  getBooking?: (supabase: SB, workspaceId: string, id: string) => Promise<unknown>
}

interface RatesLibRatePlan {
  id: string
  listingId: string
  name?: string
  nightlyRatePence: number
  minNights: number
  maxNights: number | null
  weekendUpliftPct: number | null
}
interface RatesLib {
  /** Per-listing rate plans (the real lib signature). */
  listRatePlans?: (supabase: SB, listingId: string) => Promise<RatesLibRatePlan[]>
  getActiveRatePlan?: (supabase: SB, listingId: string) => Promise<RatesLibRatePlan | null>
}

interface AvailabilityLibBlockedDate {
  id: string
  listingId: string
  date: string
  reason: string | null
}
interface AvailabilityLib {
  /** Per-listing blocked dates (the real lib signature) → BlockedDate[]. */
  getBlockedDates?: (
    supabase: SB,
    listingId: string,
    opts?: { from?: string; to?: string }
  ) => Promise<AvailabilityLibBlockedDate[]>
}

async function loadReservationsLib(): Promise<ReservationsLib | null> {
  try {
    // @ts-ignore — provided by a sibling agent; may be absent on this branch.
    return (await import("@/lib/booking/reservations")) as ReservationsLib
  } catch {
    return null
  }
}

async function loadRatesLib(): Promise<RatesLib | null> {
  try {
    // @ts-ignore — sibling-owned; tolerate absence.
    return (await import("@/lib/booking/rates")) as RatesLib
  } catch {
    return null
  }
}

async function loadAvailabilityLib(): Promise<AvailabilityLib | null> {
  try {
    // @ts-ignore — sibling-owned; tolerate absence.
    return (await import("@/lib/booking/availability")) as AvailabilityLib
  } catch {
    return null
  }
}

// ── Domain types (UI-facing, money in pence) ────────────────────────────────

export type ReservationStatus =
  | "hold"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "checked_in"
  | "checked_out"

export interface BookingRow {
  id: string
  reference: string
  listingId: string | null
  listingTitle: string
  guestName: string
  guestEmail: string | null
  checkIn: string | null // yyyy-mm-dd
  checkOut: string | null // yyyy-mm-dd
  nights: number
  guests: number
  status: ReservationStatus
  /** Indicative — payments land in P5. Integer pence. */
  subtotalPence: number
  feesPence: number
  totalPence: number
  currency: string
  amountPaidPence: number
  source: string
  createdAt: string | null
}

export interface BookableListing {
  id: string
  title: string
  status: string
  location: string | null
  currency: string
  baseNightlyPence: number | null
  propertyId: string | null
}

export interface BookingsData {
  ready: boolean
  bookings: BookingRow[]
  listings: BookableListing[]
}

// ── Mappers (defensive — sibling shapes are not guaranteed) ─────────────────

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null
}

function dateOnly(v: unknown): string | null {
  const s = str(v)
  return s ? s.slice(0, 10) : null
}

function nightsBetween(from: string | null, to: string | null): number {
  if (!from || !to) return 0
  const a = new Date(`${from}T00:00:00Z`).getTime()
  const b = new Date(`${to}T00:00:00Z`).getTime()
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0
  return Math.round((b - a) / 86_400_000)
}

const STATUS_ALIASES: Record<string, ReservationStatus> = {
  hold: "hold",
  provisional_hold: "hold",
  draft: "hold",
  pending: "pending",
  pending_payment: "pending",
  pending_host_approval: "pending",
  requested: "pending",
  confirmed: "confirmed",
  approved: "confirmed",
  cancelled: "cancelled",
  canceled: "cancelled",
  rejected: "cancelled",
  expired: "cancelled",
  completed: "completed",
  checked_in: "checked_in",
  checked_out: "checked_out",
}

export function normaliseStatus(raw: unknown): ReservationStatus {
  const key = (str(raw) ?? "pending").toLowerCase()
  return STATUS_ALIASES[key] ?? "pending"
}

function mapBookingRow(r: Record<string, unknown>): BookingRow {
  const checkIn = dateOnly(r.check_in_date ?? r.check_in ?? r.start_date)
  const checkOut = dateOnly(r.check_out_date ?? r.check_out ?? r.end_date)
  const nights = num(r.nights) || nightsBetween(checkIn, checkOut)
  const subtotal = num(r.base_price ?? r.subtotal_pence ?? r.subtotal)
  const fees =
    num(r.cleaning_fee) + num(r.service_fee) + num(r.platform_fee) + num(r.taxes) ||
    num(r.fees_pence)
  const total = num(r.total_price ?? r.total_pence ?? r.total) || subtotal + fees
  const guest =
    (r.guest as Record<string, unknown> | undefined) ??
    (r.primary_guest as Record<string, unknown> | undefined) ??
    {}

  return {
    id: String(r.id ?? r.reservation_id ?? crypto.randomUUID()),
    reference: str(r.booking_reference ?? r.reference) ?? String(r.id ?? "").slice(0, 8).toUpperCase(),
    listingId: str(r.listing_id),
    listingTitle: str(r.listing_title ?? (r.listing as Record<string, unknown> | undefined)?.title) ?? "Listing",
    guestName: str(r.guest_name ?? guest.full_name ?? guest.display_name ?? guest.name) ?? "Guest",
    guestEmail: str(r.guest_email ?? guest.email),
    checkIn,
    checkOut,
    nights,
    guests: num(r.guests_count ?? r.total_guests ?? r.guests ?? (num(r.adults) + num(r.children))) || 1,
    status: normaliseStatus(r.status ?? r.lifecycle_stage),
    subtotalPence: subtotal,
    feesPence: fees,
    totalPence: total,
    currency: str(r.currency) ?? "GBP",
    amountPaidPence: num(r.amount_paid),
    source: str(r.source_channel ?? r.source) ?? "direct",
    createdAt: str(r.created_at),
  }
}

function mapListingRow(r: Record<string, unknown>): BookableListing {
  return {
    id: String(r.id),
    title: str(r.title) ?? "Untitled listing",
    status: str(r.status) ?? "draft",
    location: str(r.location),
    currency: str(r.currency) ?? "GBP",
    baseNightlyPence: r.base_price_pence == null ? null : num(r.base_price_pence),
    propertyId: str(r.property_id),
  }
}

// ── Reads ───────────────────────────────────────────────────────────────────

/** Tolerant direct read of reservations from the REAL `bookings` table. */
async function readReservationsDirect(
  supabase: SB,
  workspaceId: string
): Promise<{ rows: Record<string, unknown>[]; ready: boolean }> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) {
      if (isMissing(error)) return { rows: [], ready: false }
      return { rows: [], ready: true }
    }
    return { rows: (data ?? []) as Record<string, unknown>[], ready: true }
  } catch {
    return { rows: [], ready: false }
  }
}

/** Read the workspace's booking_listings (the canonical operator listing). */
async function readBookingListings(
  supabase: SB,
  workspaceId: string
): Promise<{ listings: BookableListing[]; ready: boolean }> {
  try {
    const { data, error } = await supabase
      .from("booking_listings")
      .select("id, title, status, country_code, currency, property_id, pricing_profile_id")
      .eq("workspace_id", workspaceId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(300)
    if (error) {
      if (isMissing(error)) return { listings: [], ready: false }
      return { listings: [], ready: true }
    }
    const ids = (data ?? []).map((r) => String((r as Record<string, unknown>).id))
    const priceById = new Map<string, number>()
    if (ids.length > 0) {
      try {
        const { data: profs } = await supabase
          .from("booking_pricing_profiles")
          .select("listing_id, base_nightly_pence, is_active")
          .in("listing_id", ids)
          .eq("is_active", true)
        for (const p of profs ?? []) {
          const row = p as { listing_id: string; base_nightly_pence: number }
          priceById.set(row.listing_id, Number(row.base_nightly_pence) || 0)
        }
      } catch {
        /* tolerant */
      }
    }
    const listings = (data ?? []).map((r) => {
      const row = r as Record<string, unknown>
      const id = String(row.id)
      return {
        id,
        title: (row.title as string) ?? "Untitled listing",
        status: (row.status as string) ?? "draft",
        location: (row.country_code as string) ?? null,
        currency: (row.currency as string) ?? "GBP",
        baseNightlyPence: priceById.has(id) ? priceById.get(id)! : null,
        propertyId: (row.property_id as string) ?? null,
      } satisfies BookableListing
    })
    return { listings, ready: true }
  } catch {
    return { listings: [], ready: false }
  }
}

/** Tolerant read of bookable stay listings from marketplace_listings. */
async function readBookableListings(
  supabase: SB,
  workspaceId: string
): Promise<BookableListing[]> {
  try {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("id, title, status, location, currency, base_price_pence, property_id, transaction_type")
      .eq("workspace_id", workspaceId)
      .eq("transaction_type", "stay_booking")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error || !Array.isArray(data)) return []
    return data.map((r) => mapListingRow(r as Record<string, unknown>))
  } catch {
    return []
  }
}

function asRowArray(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[]
  const obj = result as { data?: unknown; bookings?: unknown; rows?: unknown } | null
  const inner = obj?.data ?? obj?.bookings ?? obj?.rows
  return Array.isArray(inner) ? (inner as Record<string, unknown>[]) : []
}

/** Load the full bookings dataset (reservations + bookable listings). */
export async function loadBookingsData(workspaceId: string | null): Promise<BookingsData> {
  if (!workspaceId) return { ready: false, bookings: [], listings: [] }
  const supabase = await createClient()

  let rows: Record<string, unknown>[] = []
  let ready = true

  const lib = await loadReservationsLib()
  if (lib?.listBookings) {
    try {
      rows = asRowArray(await lib.listBookings(supabase, workspaceId, {}))
    } catch (err) {
      if (isMissing(err)) {
        ready = false
      } else {
        const direct = await readReservationsDirect(supabase, workspaceId)
        rows = direct.rows
        ready = direct.ready
      }
    }
  } else {
    const direct = await readReservationsDirect(supabase, workspaceId)
    rows = direct.rows
    ready = direct.ready
  }

  // Listings: prefer the canonical booking_listings, fall back to marketplace
  // stay listings (legacy P4 path). Merge by id so titles resolve for both.
  const bl = await readBookingListings(supabase, workspaceId)
  const mkt = await readBookableListings(supabase, workspaceId)
  const byId = new Map<string, BookableListing>()
  for (const l of mkt) byId.set(l.id, l)
  for (const l of bl.listings) byId.set(l.id, l) // booking_listings win
  const listings = Array.from(byId.values())

  // Enrich reservation listing titles from the merged listing set.
  const titleById = new Map(listings.map((l) => [l.id, l.title]))
  const bookings = rows.map((r) => {
    const mapped = mapBookingRow(r)
    const lid = (r.booking_listing_id as string) ?? (r.listing_id as string) ?? null
    if (lid && titleById.has(lid)) {
      mapped.listingId = lid
      mapped.listingTitle = titleById.get(lid)!
    } else if (lid) {
      mapped.listingId = lid
    }
    return mapped
  })

  return {
    ready: ready || listings.length > 0,
    bookings,
    listings,
  }
}

/** Load a single reservation by id (tolerant). Returns null when not found. */
export async function loadBooking(
  workspaceId: string | null,
  id: string
): Promise<BookingRow | null> {
  if (!workspaceId) return null
  const supabase = await createClient()

  let row: Record<string, unknown> | null = null
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .maybeSingle()
    if (error || !data) return null
    row = data as Record<string, unknown>
  } catch {
    return null
  }
  if (!row) return null

  const mapped = mapBookingRow(row)
  // Resolve the listing title for the detail header.
  const lid = (row.booking_listing_id as string) ?? (row.listing_id as string) ?? null
  if (lid) {
    mapped.listingId = lid
    try {
      const { data: bl } = await supabase
        .from("booking_listings")
        .select("title")
        .eq("id", lid)
        .maybeSingle()
      if (bl?.title) mapped.listingTitle = bl.title as string
      else {
        const { data: ml } = await supabase
          .from("marketplace_listings")
          .select("title")
          .eq("id", lid)
          .maybeSingle()
        if (ml?.title) mapped.listingTitle = ml.title as string
      }
    } catch {
      /* tolerant */
    }
  }
  return mapped
}

export interface RatePlan {
  id: string
  listingId: string | null
  listingTitle: string | null
  nightlyPence: number
  minNights: number
  maxNights: number | null
  weekendUpliftPct: number
  currency: string
}

/** Load pricing for the workspace's bookable listings (tolerant). Canonical
 * source is `booking_pricing_profiles`; legacy `rate_plans` is merged in for
 * marketplace-backed listings that don't have a profile yet. */
export async function loadRatePlans(
  workspaceId: string | null,
  listings: BookableListing[]
): Promise<{ ready: boolean; plans: RatePlan[] }> {
  if (!workspaceId) return { ready: false, plans: [] }
  const supabase = await createClient()
  const titleById = new Map(listings.map((l) => [l.id, l.title]))
  const currencyById = new Map(listings.map((l) => [l.id, l.currency]))
  const plans: RatePlan[] = []
  const covered = new Set<string>()
  let ready = listings.length > 0

  // 1) booking_pricing_profiles — the deep, canonical pricing.
  try {
    const ids = listings.map((l) => l.id)
    if (ids.length > 0) {
      const { data, error } = await supabase
        .from("booking_pricing_profiles")
        .select(
          "id, listing_id, base_nightly_pence, weekend_pence, min_nights, max_nights, currency, is_active"
        )
        .in("listing_id", ids)
        .eq("is_active", true)
      if (!error && Array.isArray(data)) {
        ready = true
        for (const r of data) {
          const row = r as Record<string, unknown>
          const lid = String(row.listing_id)
          const base = num(row.base_nightly_pence)
          const weekend = row.weekend_pence == null ? null : num(row.weekend_pence)
          const upliftPct = weekend != null && base > 0 ? Math.round(((weekend - base) / base) * 100) : 0
          covered.add(lid)
          plans.push({
            id: String(row.id),
            listingId: lid,
            listingTitle: titleById.get(lid) ?? null,
            nightlyPence: base,
            minNights: num(row.min_nights, 1) || 1,
            maxNights: row.max_nights == null ? null : num(row.max_nights),
            weekendUpliftPct: Math.max(0, upliftPct),
            currency: (row.currency as string) ?? currencyById.get(lid) ?? "GBP",
          })
        }
      }
    }
  } catch {
    /* tolerant */
  }

  // 2) legacy rate_plans for any listing not covered by a pricing profile.
  const lib = await loadRatesLib()
  if (lib?.listRatePlans) {
    const uncovered = listings.filter((l) => !covered.has(l.id))
    if (uncovered.length > 0) {
      try {
        const perListing = await Promise.all(
          uncovered.map(async (l) => {
            const rps = await lib.listRatePlans!(supabase, l.id)
            return (rps ?? []).map((p) => mapLibRatePlan(p, l.title, l.currency))
          })
        )
        for (const arr of perListing) for (const p of arr) plans.push(p)
        if (perListing.length > 0) ready = true
      } catch (err) {
        if (isMissing(err) && plans.length === 0) return { ready: false, plans: [] }
      }
    }
  }

  return { ready, plans }
}

/** Map the real `@/lib/booking/rates` RatePlan shape into the UI shape. */
function mapLibRatePlan(
  p: RatesLibRatePlan,
  listingTitle: string | null,
  currency: string
): RatePlan {
  return {
    id: p.id,
    listingId: p.listingId,
    listingTitle,
    nightlyPence: num(p.nightlyRatePence),
    minNights: num(p.minNights, 1) || 1,
    maxNights: p.maxNights == null ? null : num(p.maxNights),
    weekendUpliftPct: p.weekendUpliftPct == null ? 0 : num(p.weekendUpliftPct),
    currency: currency || "GBP",
  }
}

/** Load blocked dates for a listing across a window (tolerant). */
export async function loadBlockedDates(
  listingId: string,
  from: string,
  to: string
): Promise<{ ready: boolean; blockedDates: string[]; minNights: number }> {
  const supabase = await createClient()
  const lib = await loadAvailabilityLib()
  const ratesLib = await loadRatesLib()

  // min_nights comes from the active rate plan (booking engine falls back to 1).
  let minNights = 1
  if (ratesLib?.getActiveRatePlan) {
    try {
      const active = await ratesLib.getActiveRatePlan(supabase, listingId)
      if (active?.minNights) minNights = num(active.minNights, 1) || 1
    } catch {
      /* tolerant */
    }
  }

  if (lib?.getBlockedDates) {
    try {
      const rows = await lib.getBlockedDates(supabase, listingId, { from, to })
      return {
        ready: true,
        blockedDates: (rows ?? []).map((r) => String(r.date).slice(0, 10)),
        minNights,
      }
    } catch (err) {
      if (isMissing(err)) return { ready: false, blockedDates: [], minNights }
    }
  }
  return { ready: false, blockedDates: [], minNights }
}
