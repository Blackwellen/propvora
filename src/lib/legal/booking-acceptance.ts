import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getBookingPolicy,
  requiredLegalFor,
  type BookingPolicySlug,
  type LegalContext,
} from "./booking-policies"

/**
 * Server-side booking legal-acceptance capture + gate.
 *
 * Writes a versioned, evidence-bearing acceptance row to the EXISTING
 * public.booking_legal_acceptances table (booking_id, workspace_id,
 * document_type, document_version, accepted, snapshot, ip, user_agent) for each
 * document a guest or host accepted at a checkout / onboarding moment.
 *
 * IMPORTANT: acceptance is captured SERVER-SIDE ONLY. The table has no client
 * INSERT policy; these writes go through a service-role (admin) client from a
 * Server Action or Route Handler, so an acceptance can never be forged from the
 * frontend. The `snapshot` jsonb is the durable proof of exactly what was shown
 * and accepted (slug, title, version, audience, country, captured-at).
 *
 * 42P01/42703-tolerant: a missing table/column degrades to a structured
 * { ok:false } rather than throwing.
 */

const TABLE = "booking_legal_acceptances"

/** Minimal structural client — works with admin or cookie-scoped server client. */
type AcceptanceClient = Pick<SupabaseClient, "from">

function errCode(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function isMissingSchema(e: unknown): boolean {
  const c = errCode(e)
  return c === "42P01" || c === "42703"
}

/** Evidence captured server-side at the moment of acceptance. */
export interface AcceptanceEvidence {
  /** Acting user id (guest or host), if signed in. */
  userId?: string | null
  /** Caller IP, read server-side from request headers. */
  ip?: string | null
  /** Caller user-agent, read server-side from request headers. */
  userAgent?: string | null
  /** ISO-3166 country the policy was served under (drives the jurisdiction note). */
  country?: string | null
  /** Where the acceptance happened. */
  context?: LegalContext | "checkout" | "onboarding" | "other"
}

export interface BookingAcceptanceResult {
  slug: BookingPolicySlug
  version: string
  ok: boolean
  error?: string
}

/**
 * Build the immutable snapshot stored on an acceptance row. This is the legal
 * proof of WHAT was accepted, captured at acceptance time so it is independent
 * of later registry edits.
 */
function buildSnapshot(
  slug: BookingPolicySlug,
  evidence: AcceptanceEvidence,
): Record<string, unknown> {
  const meta = getBookingPolicy(slug)
  return {
    slug,
    title: meta?.title ?? slug,
    audience: meta?.audience ?? null,
    version: meta?.currentVersion ?? null,
    effective_from: meta?.effectiveFrom ?? null,
    href: meta?.href ?? null,
    context: evidence.context ?? "checkout",
    country: evidence.country ?? null,
    user_id: evidence.userId ?? null,
    ip: evidence.ip ?? null,
    user_agent: evidence.userAgent ?? null,
    captured_at: new Date().toISOString(),
  }
}

/**
 * Record acceptance of a SINGLE booking document at its current version against
 * a booking. Server-side only (pass a service-role client). Idempotent-friendly:
 * a repeat row is fine — each row is an append-only acceptance event.
 */
export async function recordBookingAcceptance(
  client: AcceptanceClient,
  bookingId: string,
  workspaceId: string | null,
  slug: BookingPolicySlug,
  evidence: AcceptanceEvidence = {},
): Promise<BookingAcceptanceResult> {
  const meta = getBookingPolicy(slug)
  const version = meta?.currentVersion ?? "unknown"
  if (!meta) {
    return { slug, version, ok: false, error: `Unknown booking policy: ${slug}` }
  }
  try {
    const { error } = await client.from(TABLE).insert({
      booking_id: bookingId,
      workspace_id: workspaceId,
      document_type: slug,
      document_version: version,
      accepted: true,
      snapshot: buildSnapshot(slug, evidence),
      ip: evidence.ip ?? null,
      user_agent: evidence.userAgent ?? null,
    })
    if (error) {
      if (isMissingSchema(error)) return { slug, version, ok: false, error: "schema_missing" }
      return { slug, version, ok: false, error: error.message }
    }
    return { slug, version, ok: true }
  } catch (e) {
    if (isMissingSchema(e)) return { slug, version, ok: false, error: "schema_missing" }
    return { slug, version, ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Record acceptance of the FULL required set for a context (guest_checkout /
 * guest_direct / host_onboarding) against a booking, in one server-side call.
 * Returns the per-document outcome so the caller can fail the checkout if any
 * required document could not be recorded.
 */
export async function recordRequiredBookingAcceptances(
  client: AcceptanceClient,
  bookingId: string,
  workspaceId: string | null,
  context: LegalContext,
  evidence: AcceptanceEvidence = {},
): Promise<{ ok: boolean; results: BookingAcceptanceResult[] }> {
  const required = requiredLegalFor(context)
  const results: BookingAcceptanceResult[] = []
  for (const slug of required) {
    results.push(
      await recordBookingAcceptance(client, bookingId, workspaceId, slug, {
        ...evidence,
        context,
      }),
    )
  }
  // schema_missing is tolerated (cold DB); a real insert error is a hard fail.
  const hardFail = results.some((r) => !r.ok && r.error !== "schema_missing")
  return { ok: !hardFail, results }
}

export interface AcceptedDocRow {
  document_type: string
  document_version: string
  accepted: boolean
  created_at: string
}

/**
 * Read the acceptance rows recorded for a booking (most recent first). [] on a
 * missing table — never throws.
 */
export async function listBookingAcceptances(
  client: AcceptanceClient,
  bookingId: string,
): Promise<AcceptedDocRow[]> {
  try {
    const { data, error } = await client
      .from(TABLE)
      .select("document_type, document_version, accepted, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
    if (error || !Array.isArray(data)) return []
    return data as AcceptedDocRow[]
  } catch {
    return []
  }
}

/**
 * Which required documents for a context a booking has NOT yet had recorded at
 * the current version. Empty array → the acceptance gate is satisfied.
 */
export async function outstandingBookingAcceptances(
  client: AcceptanceClient,
  bookingId: string,
  context: LegalContext,
): Promise<BookingPolicySlug[]> {
  const required = requiredLegalFor(context)
  const recorded = await listBookingAcceptances(client, bookingId)
  const acceptedAtCurrent = new Set(
    recorded
      .filter((r) => {
        const meta = getBookingPolicy(r.document_type)
        return (
          r.accepted === true &&
          meta &&
          r.document_version === meta.currentVersion
        )
      })
      .map((r) => r.document_type),
  )
  return required.filter((slug) => !acceptedAtCurrent.has(slug))
}
