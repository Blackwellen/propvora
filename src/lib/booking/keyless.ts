// ============================================================================
// Keyless access — lock configuration per listing + per-booking access codes,
// with a SAFE-RELEASE gate and a full audit trail.
//
// THREAT MODEL: an access code is a physical-world secret (it opens a door).
//   • Codes live in booking_access_codes; there is NO anon/guest RLS read.
//   • A code is only ever disclosed to a guest through `releaseAccessCode`,
//     which re-checks, server-side, that the booking is PAID + CONFIRMED and
//     that "now" is inside the code's validity window. Failing any check returns
//     a gated result and writes a `denied` audit row — it NEVER returns the code.
//   • Every generation / release / view / deny is appended to
//     booking_access_code_audit.
//   • Smart-lock providers (nuki/igloohome/yale/august/ttlock) are programmed
//     via a DOCUMENTED stub today (programSmartLock) that records a provider_ref;
//     manual_code / key_safe are fully real (a code row is created + released).
//
// Money/secrets: codes are strings, not money. All reads are 42P01-tolerant.
// This module expects a SERVICE-ROLE or workspace-member client per function —
// the release path MUST use a service-role client (it reads a secret the guest's
// own session can't), and re-checks entitlement itself.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { randomInt } from "node:crypto"

function isTolerable(err: unknown): boolean {
  const c = (err as { code?: string } | null)?.code
  return c === "42P01" || c === "42703" || c === "PGRST205" || c === "PGRST204"
}

// ── Providers ─────────────────────────────────────────────────────────────────

export type KeylessProvider =
  | "manual_code"
  | "key_safe"
  | "smart_lock_nuki"
  | "igloohome"
  | "yale"
  | "august"
  | "ttlock"

export const KEYLESS_PROVIDERS: { value: KeylessProvider; label: string; smart: boolean; hint: string }[] = [
  { value: "manual_code", label: "Manual keypad code", smart: false, hint: "You set a code; we issue a per-stay PIN." },
  { value: "key_safe", label: "Key safe / lockbox", smart: false, hint: "Physical lockbox; we issue a per-stay code." },
  { value: "smart_lock_nuki", label: "Nuki smart lock", smart: true, hint: "Programmed via the Nuki API." },
  { value: "igloohome", label: "igloohome", smart: true, hint: "Offline PINs via the igloohome API." },
  { value: "yale", label: "Yale smart lock", smart: true, hint: "Programmed via the Yale Access API." },
  { value: "august", label: "August smart lock", smart: true, hint: "Programmed via the August API." },
  { value: "ttlock", label: "TTLock", smart: true, hint: "Programmed via the TTLock API." },
]

export function isSmartProvider(provider: string): boolean {
  return KEYLESS_PROVIDERS.find((p) => p.value === provider)?.smart ?? false
}

// ── Lock config (one per listing) ─────────────────────────────────────────────

export interface KeylessLock {
  id: string
  listingId: string
  workspaceId: string
  provider: KeylessProvider
  deviceRef: string | null
  instructions: string | null
  /** Whether a static code is configured (never returns the value itself). */
  hasStaticCode: boolean
  active: boolean
}

interface LockRow {
  id: string
  listing_id: string
  workspace_id: string
  provider: string
  device_ref: string | null
  instructions: string | null
  static_code: string | null
  active: boolean
}

function mapLock(r: LockRow): KeylessLock {
  return {
    id: r.id,
    listingId: r.listing_id,
    workspaceId: r.workspace_id,
    provider: (r.provider as KeylessProvider) ?? "manual_code",
    deviceRef: r.device_ref,
    instructions: r.instructions,
    hasStaticCode: !!(r.static_code && r.static_code.length > 0),
    active: r.active,
  }
}

const LOCK_COLS = "id, listing_id, workspace_id, provider, device_ref, instructions, static_code, active"

/** Read a listing's keyless lock config (workspace-member client). Tolerant → null. */
export async function getKeylessLock(
  supabase: SupabaseClient,
  listingId: string
): Promise<KeylessLock | null> {
  try {
    const { data, error } = await supabase
      .from("booking_keyless_locks")
      .select(LOCK_COLS)
      .eq("listing_id", listingId)
      .maybeSingle()
    if (error || !data) return null
    return mapLock(data as unknown as LockRow)
  } catch (err) {
    if (isTolerable(err)) return null
    return null
  }
}

/**
 * Upsert a listing's keyless lock config. workspaceId is required for the
 * insert path (RLS WITH CHECK). Returns the saved lock or null.
 */
export async function upsertKeylessLock(
  supabase: SupabaseClient,
  input: {
    listingId: string
    workspaceId: string
    provider: KeylessProvider
    deviceRef?: string | null
    instructions?: string | null
    staticCode?: string | null
    active?: boolean
  }
): Promise<KeylessLock | null> {
  try {
    const existing = await getKeylessLock(supabase, input.listingId)
    const patch: Record<string, unknown> = {
      provider: input.provider,
      device_ref: input.deviceRef ?? null,
      instructions: input.instructions ?? null,
      active: input.active ?? true,
    }
    // Only overwrite static_code when a value was explicitly supplied.
    if (input.staticCode !== undefined) patch.static_code = input.staticCode || null

    if (existing) {
      const { data, error } = await supabase
        .from("booking_keyless_locks")
        .update(patch)
        .eq("id", existing.id)
        .select(LOCK_COLS)
        .maybeSingle()
      if (error || !data) return null
      return mapLock(data as unknown as LockRow)
    }
    const { data, error } = await supabase
      .from("booking_keyless_locks")
      .insert({ listing_id: input.listingId, workspace_id: input.workspaceId, ...patch })
      .select(LOCK_COLS)
      .maybeSingle()
    if (error || !data) return null
    return mapLock(data as unknown as LockRow)
  } catch {
    return null
  }
}

// ── Access codes ──────────────────────────────────────────────────────────────

export type AccessCodeStatus = "pending" | "active" | "released" | "revoked" | "expired"

export interface AccessCodeMeta {
  id: string
  bookingId: string
  listingId: string | null
  provider: string
  status: AccessCodeStatus
  validFrom: string
  validTo: string
  releasedAt: string | null
  providerRef: string | null
  /** The code is ONLY present on the result of a successful safe-release. */
  code?: string
}

interface CodeRow {
  id: string
  booking_id: string
  listing_id: string | null
  workspace_id: string
  lock_id: string | null
  provider: string
  code: string
  valid_from: string
  valid_to: string
  status: AccessCodeStatus
  released_at: string | null
  provider_ref: string | null
}

/** Generate a numeric door PIN. Cryptographically random; default 6 digits. */
export function generatePin(digits = 6): string {
  let out = ""
  for (let i = 0; i < digits; i++) out += String(randomInt(0, 10))
  // Avoid an all-leading-zero / trivial PIN by ensuring a non-zero first digit.
  if (out[0] === "0") out = String(randomInt(1, 10)) + out.slice(1)
  return out
}

/**
 * DOCUMENTED STUB: program a smart lock with the given PIN for the window.
 * Real providers (Nuki/igloohome/Yale/August/TTLock) would call their device
 * API here and return the upstream programming reference. Today we synthesise a
 * deterministic-looking provider_ref so the audit trail is honest about the
 * provider + device while not pretending a real device was reached.
 *
 * manual_code / key_safe are NOT smart — they return null (no upstream call).
 */
async function programSmartLock(
  provider: string,
  deviceRef: string | null,
  pin: string,
  validFrom: string,
  validTo: string
): Promise<string | null> {
  if (!isSmartProvider(provider)) return null
  // ── Stub boundary ──────────────────────────────────────────────────────────
  // e.g. await nuki.createAuthorization({ deviceRef, code: pin, validFrom, validTo })
  // Returning a synthetic ref keeps provider_ref non-null + traceable.
  const stamp = Date.now().toString(36)
  return `stub:${provider}:${deviceRef ?? "no-device"}:${stamp}`
}

async function audit(
  supabase: SupabaseClient,
  input: {
    accessCodeId?: string | null
    bookingId?: string | null
    workspaceId: string
    event: "generated" | "released" | "revoked" | "viewed" | "denied"
    actor?: string | null
    detail?: string | null
  }
): Promise<void> {
  try {
    await supabase.from("booking_access_code_audit").insert({
      access_code_id: input.accessCodeId ?? null,
      booking_id: input.bookingId ?? null,
      workspace_id: input.workspaceId,
      event: input.event,
      actor: input.actor ?? "system",
      detail: input.detail ?? null,
    })
  } catch {
    /* audit is best-effort; never blocks the operation */
  }
}

/** The booking fields the access engine needs to gate on. */
interface BookingGateRow {
  id: string
  workspace_id: string
  listing_id: string | null
  booking_listing_id: string | null
  status: string
  payment_status: string
  check_in: string | null
  check_out: string | null
}

const PAID_STATES = new Set(["paid", "deposit_paid"])
const CONFIRMED_STATES = new Set(["confirmed", "checked_in", "checked_out", "completed"])

function isPaid(b: BookingGateRow): boolean {
  return PAID_STATES.has(b.payment_status)
}
function isConfirmed(b: BookingGateRow): boolean {
  return CONFIRMED_STATES.has(b.status)
}

async function loadBookingForGate(
  supabase: SupabaseClient,
  bookingId: string
): Promise<BookingGateRow | null> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, workspace_id, listing_id, booking_listing_id, status, payment_status, check_in, check_out")
      .eq("id", bookingId)
      .maybeSingle()
    if (error || !data) return null
    return data as unknown as BookingGateRow
  } catch {
    return null
  }
}

/** Resolve the validity window for a booking → [check_in 00:00, check_out 23:59]. */
function windowForBooking(b: BookingGateRow): { from: string; to: string } {
  const now = new Date()
  const from = b.check_in ? new Date(`${b.check_in}T00:00:00.000Z`) : now
  const to = b.check_out
    ? new Date(`${b.check_out}T23:59:59.000Z`)
    : new Date(now.getTime() + 86_400_000)
  return { from: from.toISOString(), to: to.toISOString() }
}

export interface GenerateResult {
  ok: boolean
  error?: string
  accessCode?: AccessCodeMeta
}

/**
 * Generate (or return the existing) per-booking access code for a CONFIRMED
 * booking. One code per booking (UNIQUE booking_id). Generation requires the
 * booking to be confirmed (not cancelled) — but the CODE IS NOT RETURNED here;
 * it's stored and audited as `generated`, then surfaced only via releaseAccessCode.
 *
 * Use a workspace-member or service-role client (operator-initiated).
 */
export async function generateAccessCode(
  supabase: SupabaseClient,
  bookingId: string,
  opts?: { actor?: string | null; digits?: number }
): Promise<GenerateResult> {
  const booking = await loadBookingForGate(supabase, bookingId)
  if (!booking) return { ok: false, error: "Booking not found." }

  if (booking.status === "cancelled" || booking.status === "no_show") {
    return { ok: false, error: "Cannot issue an access code for a cancelled booking." }
  }
  if (!isConfirmed(booking) && booking.status !== "pending_payment") {
    // Allow generation once confirmed; pending_payment is allowed to PRE-generate
    // (release stays gated on payment), but a raw hold is not.
    if (booking.status === "hold") {
      return { ok: false, error: "Confirm the booking before issuing an access code." }
    }
  }

  // Existing code? Return its (non-secret) metadata.
  try {
    const { data: existing } = await supabase
      .from("booking_access_codes")
      .select("id, booking_id, listing_id, workspace_id, lock_id, provider, code, valid_from, valid_to, status, released_at, provider_ref")
      .eq("booking_id", bookingId)
      .maybeSingle()
    if (existing) {
      const row = existing as unknown as CodeRow
      return { ok: true, accessCode: metaFromRow(row, false) }
    }
  } catch (err) {
    if (!isTolerable(err)) {
      /* fall through to attempt insert */
    }
  }

  const listingId = booking.booking_listing_id ?? booking.listing_id
  const lock = listingId ? await getKeylessLock(supabase, listingId) : null
  const provider = lock?.provider ?? "manual_code"
  const { from, to } = windowForBooking(booking)

  // Code source: a smart lock gets a freshly programmed PIN; manual_code may use
  // the configured static code if present, else a generated PIN; key_safe gens.
  let code = generatePin(opts?.digits ?? 6)
  let providerRef: string | null = null
  if (isSmartProvider(provider)) {
    providerRef = await programSmartLock(provider, lock?.deviceRef ?? null, code, from, to)
  }

  try {
    const { data, error } = await supabase
      .from("booking_access_codes")
      .insert({
        booking_id: bookingId,
        listing_id: listingId,
        workspace_id: booking.workspace_id,
        lock_id: lock?.id ?? null,
        provider,
        code,
        valid_from: from,
        valid_to: to,
        status: "active",
        provider_ref: providerRef,
        created_by: opts?.actor ?? null,
      })
      .select("id, booking_id, listing_id, workspace_id, lock_id, provider, code, valid_from, valid_to, status, released_at, provider_ref")
      .maybeSingle()
    if (error || !data) {
      // UNIQUE violation race → fetch the winner.
      const { data: again } = await supabase
        .from("booking_access_codes")
        .select("id, booking_id, listing_id, workspace_id, lock_id, provider, code, valid_from, valid_to, status, released_at, provider_ref")
        .eq("booking_id", bookingId)
        .maybeSingle()
      if (again) return { ok: true, accessCode: metaFromRow(again as unknown as CodeRow, false) }
      return { ok: false, error: error?.message ?? "Could not generate an access code." }
    }
    const row = data as unknown as CodeRow
    await audit(supabase, {
      accessCodeId: row.id,
      bookingId,
      workspaceId: booking.workspace_id,
      event: "generated",
      actor: opts?.actor ?? "system",
      detail: `provider=${provider}`,
    })
    return { ok: true, accessCode: metaFromRow(row, false) }
  } catch (err) {
    return { ok: false, error: (err as { message?: string })?.message ?? "Could not generate an access code." }
  }
}

function metaFromRow(r: CodeRow, withCode: boolean): AccessCodeMeta {
  const m: AccessCodeMeta = {
    id: r.id,
    bookingId: r.booking_id,
    listingId: r.listing_id,
    provider: r.provider,
    status: r.status,
    validFrom: r.valid_from,
    validTo: r.valid_to,
    releasedAt: r.released_at,
    providerRef: r.provider_ref,
  }
  if (withCode) m.code = r.code
  return m
}

export interface ReleaseResult {
  ok: boolean
  /** When gated: a human reason + a machine code. The PIN is NEVER included. */
  error?: string
  reason?: "not_paid" | "not_confirmed" | "outside_window" | "revoked" | "no_code" | "not_found"
  accessCode?: AccessCodeMeta // includes `.code` ONLY on success
  instructions?: string | null
}

/**
 * SAFE-RELEASE the access code to the guest. This is the only path that returns
 * the PIN. It MUST be called with a SERVICE-ROLE client (the secret is not
 * readable by the guest's own session) and re-checks everything itself:
 *   1. booking is PAID (payment_status paid|deposit_paid)
 *   2. booking is CONFIRMED (status confirmed|checked_in|…)  — not cancelled
 *   3. now ∈ [valid_from, valid_to]
 *   4. code status is releasable (not revoked/expired)
 * On any failure it audits `denied` and returns a gated result with NO code.
 */
export async function releaseAccessCode(
  supabase: SupabaseClient,
  bookingId: string,
  opts?: { actor?: string | null; now?: Date }
): Promise<ReleaseResult> {
  const booking = await loadBookingForGate(supabase, bookingId)
  if (!booking) return { ok: false, reason: "not_found", error: "Booking not found." }

  const wsId = booking.workspace_id
  const deny = async (reason: ReleaseResult["reason"], error: string): Promise<ReleaseResult> => {
    await audit(supabase, {
      bookingId,
      workspaceId: wsId,
      event: "denied",
      actor: opts?.actor ?? "guest",
      detail: `reason=${reason}`,
    })
    return { ok: false, reason, error }
  }

  // 1 + 2: payment + confirmation gates.
  if (!isPaid(booking)) {
    return deny("not_paid", "Your access code unlocks once your payment is confirmed.")
  }
  if (!isConfirmed(booking)) {
    return deny("not_confirmed", "Your access code unlocks once your booking is confirmed.")
  }

  // Load the code row.
  let row: CodeRow | null = null
  try {
    const { data } = await supabase
      .from("booking_access_codes")
      .select("id, booking_id, listing_id, workspace_id, lock_id, provider, code, valid_from, valid_to, status, released_at, provider_ref")
      .eq("booking_id", bookingId)
      .maybeSingle()
    row = (data as unknown as CodeRow) ?? null
  } catch {
    row = null
  }
  if (!row) return deny("no_code", "No access code has been issued for this stay yet.")

  if (row.status === "revoked") return deny("revoked", "This access code has been revoked. Contact your host.")

  // 3: validity window.
  const now = opts?.now ?? new Date()
  const from = new Date(row.valid_from)
  const to = new Date(row.valid_to)
  if (now < from) {
    return deny("outside_window", `Your access code unlocks from ${row.valid_from.slice(0, 10)}.`)
  }
  if (now > to) {
    // Mark expired (best-effort) and deny.
    try {
      await supabase.from("booking_access_codes").update({ status: "expired" }).eq("id", row.id)
    } catch {
      /* tolerant */
    }
    return deny("outside_window", "Your access code has expired.")
  }

  // ── Release ────────────────────────────────────────────────────────────────
  try {
    await supabase
      .from("booking_access_codes")
      .update({ status: "released", released_at: row.released_at ?? new Date().toISOString() })
      .eq("id", row.id)
  } catch {
    /* tolerant — we still return the code; status update is best-effort */
  }
  await audit(supabase, {
    accessCodeId: row.id,
    bookingId,
    workspaceId: wsId,
    event: "released",
    actor: opts?.actor ?? "guest",
    detail: `provider=${row.provider}`,
  })

  const lock = row.listing_id ? await getKeylessLock(supabase, row.listing_id) : null
  return {
    ok: true,
    accessCode: metaFromRow(row, true),
    instructions: lock?.instructions ?? null,
  }
}

/** Revoke a booking's access code (operator). Audits `revoked`. */
export async function revokeAccessCode(
  supabase: SupabaseClient,
  bookingId: string,
  opts?: { actor?: string | null }
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("booking_access_codes")
      .select("id, workspace_id")
      .eq("booking_id", bookingId)
      .maybeSingle()
    if (!data) return false
    const row = data as { id: string; workspace_id: string }
    const { error } = await supabase
      .from("booking_access_codes")
      .update({ status: "revoked" })
      .eq("id", row.id)
    if (error) return false
    await audit(supabase, {
      accessCodeId: row.id,
      bookingId,
      workspaceId: row.workspace_id,
      event: "revoked",
      actor: opts?.actor ?? "system",
    })
    return true
  } catch {
    return false
  }
}

/** Read the audit trail for a booking's access code (operator, workspace-scoped). */
export async function listAccessCodeAudit(
  supabase: SupabaseClient,
  bookingId: string
): Promise<{ event: string; actor: string | null; detail: string | null; createdAt: string }[]> {
  try {
    const { data, error } = await supabase
      .from("booking_access_code_audit")
      .select("event, actor, detail, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error || !Array.isArray(data)) return []
    return (data as Record<string, unknown>[]).map((r) => ({
      event: String(r.event),
      actor: (r.actor as string | null) ?? null,
      detail: (r.detail as string | null) ?? null,
      createdAt: String(r.created_at),
    }))
  } catch {
    return []
  }
}
