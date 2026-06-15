import "server-only"
import { createClient } from "@/lib/supabase/server"
import { gateBookingPages } from "@/lib/billing/gates"
import { PLAN_DISPLAY, type PlanTier } from "@/lib/billing/plans"

/* ──────────────────────────────────────────────────────────────────────────
   Operator PAYOUTS / ESCROW — server access + tolerant data layer.

   ENTITLEMENT GATE (no feature flags):
   We gate on `gateBookingPages` — the SAME entitlement that lets a workspace run
   direct booking pages (Scale and above). Receiving payouts is the money side of
   running booking pages: a workspace that can take direct bookings is the one
   that accrues escrow + payouts here, so the booking-pages entitlement is the
   natural "can receive payouts" gate. (gateMarketplacePublishing is narrower —
   Pro/Agency marketplace controls — and would wrongly lock out Scale operators
   who take direct bookings, so we deliberately do NOT use it.)

   The payment/payout libs (`@/lib/payments/payouts`, `@/lib/payments/escrow`)
   are owned by sibling agents and may be absent. Every read is best-effort and
   42P01-tolerant: a cold / migrating DB → empty data + `ready:false` so the page
   shows a premium "not ready" state rather than crashing.

   All money is integer pence; we never format here — the UI edge formats.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "PGRST202"])
function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned|relation .* does not exist/i.test(e.message ?? "")
}

type SB = Awaited<ReturnType<typeof createClient>>

// ── Access ───────────────────────────────────────────────────────────────────
export interface PayoutsAccess {
  workspaceId: string | null
  tier: PlanTier
  planName: string
  canReceivePayouts: boolean
  upgradeReason: string | null
}

async function resolveActiveWorkspaceId(supabase: SB, userId: string): Promise<string | null> {
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

export async function getPayoutsAccess(): Promise<PayoutsAccess> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      workspaceId: null,
      tier: "starter",
      planName: PLAN_DISPLAY.starter.name,
      canReceivePayouts: false,
      upgradeReason: "Sign in to a workspace with booking & payouts to view your earnings.",
    }
  }

  const workspaceId = await resolveActiveWorkspaceId(supabase, user.id)
  const gate = workspaceId ? await gateBookingPages(supabase, workspaceId) : null
  const tier = (gate?.tier ?? "starter") as PlanTier

  return {
    workspaceId,
    tier,
    planName: PLAN_DISPLAY[tier]?.name ?? "Starter",
    canReceivePayouts: gate?.allowed ?? false,
    upgradeReason: gate && !gate.allowed ? (gate.reason ?? null) : null,
  }
}

// ── Sibling payout/escrow libs (tolerant) ────────────────────────────────────
export interface PayoutRow {
  id: string
  bookingId: string | null
  reference: string
  guestName: string | null
  listingTitle: string | null
  checkIn: string | null
  checkOut: string | null
  /** Integer pence. */
  grossPence: number
  feePence: number
  netPence: number
  currency: string
  status: string // raw — UI normalises (in_escrow | pending_payout | paid | …)
  createdAt: string | null
  expectedReleaseAt: string | null
}

export interface PayoutSummary {
  escrowHeldPence: number
  pendingPayoutPence: number
  paidThisMonthPence: number
  currency: string
}

export interface PayoutsData {
  ready: boolean
  summary: PayoutSummary
  payouts: PayoutRow[]
}

interface PayoutsLib {
  listPayouts?: (supabase: SB, workspaceId: string, filters?: unknown) => Promise<unknown>
  getPayoutSummary?: (supabase: SB, workspaceId: string) => Promise<unknown>
}

async function loadPayoutsLib(): Promise<PayoutsLib | null> {
  try {
    // @ts-ignore — sibling-owned; tolerate absence.
    return (await import("@/lib/payments/payouts")) as PayoutsLib
  } catch {
    return null
  }
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null
}

function asRowArray(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[]
  // The real lib returns { items, provisioned }; tolerate several shapes.
  const obj = result as { items?: unknown; data?: unknown; payouts?: unknown; rows?: unknown } | null
  const inner = obj?.items ?? obj?.data ?? obj?.payouts ?? obj?.rows
  return Array.isArray(inner) ? (inner as Record<string, unknown>[]) : []
}

function mapPayoutRow(r: Record<string, unknown>): PayoutRow {
  const booking = (r.booking as Record<string, unknown> | undefined) ?? {}
  const gross = num(r.gross_pence ?? r.amount_pence ?? r.total_pence)
  const fee = num(r.fee_pence ?? r.platform_fee_pence)
  const net = num(r.net_pence) || Math.max(0, gross - fee)
  return {
    id: String(r.id ?? r.payment_id ?? crypto.randomUUID()),
    bookingId: str(r.booking_id ?? r.linked_id) ?? null,
    reference:
      str(r.reference ?? r.booking_reference) ??
      String(r.booking_id ?? r.id ?? "").slice(0, 8).toUpperCase(),
    guestName: str(r.guest_name ?? booking.guest_name),
    listingTitle: str(r.listing_title ?? booking.listing_title),
    checkIn: str(r.check_in ?? booking.check_in)?.slice(0, 10) ?? null,
    checkOut: str(r.check_out ?? booking.check_out)?.slice(0, 10) ?? null,
    grossPence: gross,
    feePence: fee,
    netPence: net,
    currency: str(r.currency) ?? "GBP",
    status: str(r.payout_status ?? r.status) ?? "in_escrow",
    createdAt: str(r.created_at),
    expectedReleaseAt: str(r.expected_release_at ?? r.release_at ?? r.check_out ?? booking.check_out),
  }
}

/**
 * Tolerant DIRECT read used when the sibling lib is absent. We derive an escrow
 * view from the `bookings` table joined to its listing: bookings that are
 * confirmed/held with money represent escrowed funds (until payments+payouts
 * tables are provisioned by the sibling agent). Status here reflects the BOOKING
 * lifecycle so the operator sees something coherent and HONEST rather than
 * fabricated payout rows.
 */
async function readBookingsAsEscrow(
  supabase: SB,
  workspaceId: string
): Promise<{ rows: PayoutRow[]; ready: boolean }> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, guest_name, check_in, check_out, total_pence, platform_fee_pence, currency, status, created_at, marketplace_listings(title)"
      )
      .eq("workspace_id", workspaceId)
      .in("status", ["confirmed", "completed", "pending_payment", "hold"])
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) {
      if (isMissing(error)) return { rows: [], ready: false }
      return { rows: [], ready: true }
    }
    const rows = (data ?? []).map((b) => {
      const row = b as Record<string, unknown>
      const listing = row.marketplace_listings as { title?: string } | null
      const bookingStatus = (row.status as string) || "hold"
      // Map booking lifecycle → an honest payout phase.
      const payoutStatus =
        bookingStatus === "completed"
          ? "pending_payout"
          : bookingStatus === "confirmed"
          ? "in_escrow"
          : "in_escrow"
      return mapPayoutRow({
        id: row.id,
        booking_id: row.id,
        reference: String(row.id).slice(0, 8).toUpperCase(),
        guest_name: row.guest_name,
        listing_title: listing?.title ?? null,
        check_in: row.check_in,
        check_out: row.check_out,
        gross_pence: row.total_pence,
        platform_fee_pence: row.platform_fee_pence,
        currency: row.currency,
        status: payoutStatus,
        created_at: row.created_at,
        expected_release_at: row.check_out,
      })
    })
    return { rows, ready: true }
  } catch (err) {
    if (isMissing(err)) return { rows: [], ready: false }
    return { rows: [], ready: false }
  }
}

function summarise(rows: PayoutRow[]): PayoutSummary {
  const currency = rows[0]?.currency ?? "GBP"
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  let escrow = 0
  let pending = 0
  let paid = 0
  for (const r of rows) {
    const s = (r.status || "").toLowerCase()
    if (["in_escrow", "escrow", "held", "requires_capture"].includes(s)) escrow += r.netPence
    else if (["pending", "pending_payout", "in_transit", "scheduled"].includes(s))
      pending += r.netPence
    else if (["paid", "paid_out", "settled", "succeeded"].includes(s)) {
      const created = r.createdAt ? new Date(r.createdAt).getTime() : 0
      if (created >= monthStart) paid += r.netPence
    }
  }
  return { escrowHeldPence: escrow, pendingPayoutPence: pending, paidThisMonthPence: paid, currency }
}

export async function loadPayoutsData(workspaceId: string | null): Promise<PayoutsData> {
  const empty: PayoutsData = {
    ready: false,
    summary: { escrowHeldPence: 0, pendingPayoutPence: 0, paidThisMonthPence: 0, currency: "GBP" },
    payouts: [],
  }
  if (!workspaceId) return empty
  const supabase = await createClient()

  const lib = await loadPayoutsLib()

  // Per-booking ESCROW rows (with guest/listing/dates) drive the table +
  // timeline. The real `payouts` table holds RELEASED transfers (no booking
  // detail), so we additionally merge those rows in when present.
  const fb = await readBookingsAsEscrow(supabase, workspaceId)
  let rows: PayoutRow[] = fb.rows
  let ready = fb.ready

  if (lib?.listPayouts) {
    try {
      const released = asRowArray(await lib.listPayouts(supabase, workspaceId, {})).map(mapPayoutRow)
      if (released.length > 0) {
        // De-dupe by booking id where possible; released rows win on status.
        const byBooking = new Map(rows.map((r) => [r.bookingId ?? r.id, r]))
        for (const rel of released) byBooking.set(rel.bookingId ?? rel.id, rel)
        rows = Array.from(byBooking.values())
        ready = true
      }
    } catch (err) {
      if (!isMissing(err)) {
        /* keep the booking-derived escrow rows */
      }
    }
  }

  // Summary: derive escrow-held from rows; override pending/paid with the real
  // payout summary (the authoritative released-side totals) when available.
  let summary = summarise(rows)
  if (lib?.getPayoutSummary) {
    try {
      const s = (await lib.getPayoutSummary(supabase, workspaceId)) as Record<string, unknown> | null
      if (s) {
        summary = {
          escrowHeldPence: summary.escrowHeldPence, // escrow side stays booking-derived
          pendingPayoutPence: num(
            s.pendingPence ?? s.inTransitPence ?? s.pending_payout_pence,
            summary.pendingPayoutPence
          ),
          paidThisMonthPence: num(
            s.thisMonthPaidPence ?? s.paid_this_month_pence,
            summary.paidThisMonthPence
          ),
          currency: str(s.currency) ?? summary.currency,
        }
      }
    } catch {
      /* keep derived summary */
    }
  }

  return { ready, summary, payouts: rows }
}

// ── Connect status (re-used data — for the onboarding banner) ────────────────
export interface ConnectBanner {
  connected: boolean
  status: string // none | pending | active | restricted | disabled
  payoutsEnabled: boolean
}

export async function loadConnectBanner(workspaceId: string | null): Promise<ConnectBanner> {
  const off: ConnectBanner = { connected: false, status: "none", payoutsEnabled: false }
  if (!workspaceId) return off
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from("stripe_connect_accounts")
      .select("status, payouts_enabled")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error || !data) return off
    const row = data as Record<string, unknown>
    return {
      connected: true,
      status: (row.status as string) ?? "pending",
      payoutsEnabled: !!row.payouts_enabled,
    }
  } catch {
    return off
  }
}
