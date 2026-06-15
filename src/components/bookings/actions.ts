"use server"

import { createClient } from "@/lib/supabase/server"
import { resolveWorkspaceContext } from "@/lib/context/workspace-context"
import { gateBookingPages } from "@/lib/billing/gates"

/* ──────────────────────────────────────────────────────────────────────────
   Booking server actions — non-destructive reservation lifecycle transitions.

   These are the ONLY mutations the operator booking UI performs. They:
     1. re-resolve the active workspace + re-check the booking entitlement
        server-side (never trust the client),
     2. prefer the sibling-owned `@/lib/booking/reservations` lib (confirm /
        cancel), and
     3. fall back to a tolerant direct status update on booking_reservations,
        scoped by workspace_id (defence-in-depth over RLS).

   They NEVER touch payments/refunds — payment capture is a later release. A
   status change here makes no monetary claim.

   All results are structured { ok, error } — these actions never throw to the
   client; a cold/migrating booking schema yields a friendly message.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "PGRST202"])

function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned/i.test(e.message ?? "")
}

export interface ActionResult {
  ok: boolean
  error?: string
  /** New normalised status when the action succeeded. */
  status?: string
}

type SB = Awaited<ReturnType<typeof createClient>>

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
  { ok: true; supabase: SB; workspaceId: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "You need to be signed in." }

  const workspaceId = await resolveWorkspaceId(supabase, user.id)
  if (!workspaceId) return { ok: false, error: "No active workspace found." }

  // Re-check entitlement (and that this is a real workspace) server-side.
  await resolveWorkspaceContext(supabase, workspaceId)
  const gate = await gateBookingPages(supabase, workspaceId)
  if (!gate.allowed) {
    return { ok: false, error: gate.reason ?? "Booking management isn't on your plan." }
  }
  return { ok: true, supabase, workspaceId }
}

interface ReservationsLib {
  confirmBooking?: (supabase: SB, workspaceId: string, id: string) => Promise<unknown>
  cancelBooking?: (
    supabase: SB,
    workspaceId: string,
    id: string,
    reason?: string
  ) => Promise<unknown>
}

async function loadLib(): Promise<ReservationsLib | null> {
  try {
    // @ts-ignore — sibling-owned; tolerate absence on this branch.
    return (await import("@/lib/booking/reservations")) as ReservationsLib
  } catch {
    return null
  }
}

async function directStatusUpdate(
  supabase: SB,
  workspaceId: string,
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("booking_reservations")
      .update({ status })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
    if (error) {
      if (isMissing(error)) {
        return { ok: false, error: "The reservations engine isn't provisioned yet." }
      }
      return { ok: false, error: error.message ?? "Could not update the reservation." }
    }
    return { ok: true, status }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update the reservation." }
  }
}

/** Confirm a reservation (hold/pending → confirmed). Non-destructive. */
export async function confirmReservation(id: string): Promise<ActionResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, workspaceId } = auth

  const lib = await loadLib()
  if (lib?.confirmBooking) {
    try {
      await lib.confirmBooking(supabase, workspaceId, id)
      return { ok: true, status: "confirmed" }
    } catch (err) {
      if (!isMissing(err)) {
        return { ok: false, error: err instanceof Error ? err.message : "Could not confirm the reservation." }
      }
    }
  }
  return directStatusUpdate(supabase, workspaceId, id, "confirmed")
}

/** Cancel a reservation. Non-destructive; takes no payment action. */
export async function cancelReservation(id: string, reason?: string): Promise<ActionResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, workspaceId } = auth

  const lib = await loadLib()
  if (lib?.cancelBooking) {
    try {
      await lib.cancelBooking(supabase, workspaceId, id, reason)
      return { ok: true, status: "cancelled" }
    } catch (err) {
      if (!isMissing(err)) {
        return { ok: false, error: err instanceof Error ? err.message : "Could not cancel the reservation." }
      }
    }
  }
  return directStatusUpdate(supabase, workspaceId, id, "cancelled")
}

// ── Rate plans & availability ──────────────────────────────────────────────

interface LibUpsertRatePlanInput {
  id?: string
  listingId: string
  name?: string
  nightlyRatePence: number
  minNights?: number
  maxNights?: number | null
  weekendUpliftPct?: number | null
  active?: boolean
}
interface RatesLib {
  /** Real signature: (supabase, input) — workspace scoping is via listing RLS. */
  upsertRatePlan?: (supabase: SB, input: LibUpsertRatePlanInput) => Promise<unknown>
}
interface LibBlockedDate {
  id: string
  listingId: string
  date: string
  reason: string | null
}
interface AvailabilityLib {
  /** Real signatures: per-listing reads + full-replace writes. */
  getBlockedDates?: (
    supabase: SB,
    listingId: string,
    opts?: { from?: string; to?: string }
  ) => Promise<LibBlockedDate[]>
  setBlockedDates?: (
    supabase: SB,
    listingId: string,
    dates: Array<{ date: string; reason?: string | null }>
  ) => Promise<boolean>
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

export interface RatePlanInput {
  /** Existing pricing-profile id, when updating. */
  id?: string | null
  listingId: string
  /** Nightly rate in integer pence. */
  nightlyPence: number
  minNights: number
  maxNights: number | null
  weekendUpliftPct: number
  currency: string
}

/** Create or update a per-listing rate plan. Money is integer pence. */
export async function saveRatePlan(input: RatePlanInput): Promise<ActionResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, workspaceId } = auth

  if (!input.listingId) return { ok: false, error: "A listing is required." }
  if (!Number.isFinite(input.nightlyPence) || input.nightlyPence < 0) {
    return { ok: false, error: "Enter a valid nightly rate." }
  }

  const lib = await loadRatesLib()
  if (lib?.upsertRatePlan) {
    try {
      const saved = await lib.upsertRatePlan(supabase, {
        id: input.id ?? undefined,
        listingId: input.listingId,
        nightlyRatePence: Math.round(input.nightlyPence),
        minNights: Math.max(1, Math.round(input.minNights)),
        maxNights: input.maxNights == null ? null : Math.round(input.maxNights),
        weekendUpliftPct: input.weekendUpliftPct,
      })
      if (saved) return { ok: true }
      return { ok: false, error: "The pricing engine isn't provisioned yet." }
    } catch (err) {
      if (!isMissing(err)) {
        return { ok: false, error: err instanceof Error ? err.message : "Could not save the rate plan." }
      }
      return { ok: false, error: "The pricing engine isn't provisioned yet." }
    }
  }
  return { ok: false, error: "The pricing engine isn't provisioned yet." }
}

/** Block or unblock a set of dates for a listing (availability editor). */
export async function updateBlockedDates(
  listingId: string,
  dates: string[],
  blocked: boolean
): Promise<ActionResult> {
  const auth = await authorise()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, workspaceId } = auth
  if (!listingId || dates.length === 0) return { ok: false, error: "Select at least one date." }

  // The real availability lib uses a FULL-REPLACE model per listing. To
  // block/unblock an incremental set we read the current blocks, merge, and
  // write the whole set back. Workspace scoping is enforced by listing RLS.
  const lib = await loadAvailabilityLib()
  if (lib?.getBlockedDates && lib?.setBlockedDates) {
    try {
      const current = await lib.getBlockedDates(supabase, listingId)
      const merged = new Map<string, string | null>()
      for (const row of current ?? []) merged.set(row.date.slice(0, 10), row.reason)
      for (const d of dates) {
        const day = d.slice(0, 10)
        if (blocked) {
          if (!merged.has(day)) merged.set(day, "blocked_manual")
        } else {
          merged.delete(day)
        }
      }
      const next = Array.from(merged.entries()).map(([date, reason]) => ({ date, reason }))
      const ok = await lib.setBlockedDates(supabase, listingId, next)
      if (ok) return { ok: true }
      return { ok: false, error: "The availability engine isn't provisioned yet." }
    } catch (err) {
      if (!isMissing(err)) {
        return { ok: false, error: err instanceof Error ? err.message : "Could not update availability." }
      }
      return { ok: false, error: "The availability engine isn't provisioned yet." }
    }
  }
  return { ok: false, error: "The availability engine isn't provisioned yet." }
}
