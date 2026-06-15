/**
 * P6 — Identity / KYC verification engine (DB + pure helpers ONLY).
 *
 * This module records and reads the identity-verification trail. It NEVER calls
 * Stripe — `buildVerificationSessionParams` only assembles the params a caller
 * (or a future server action) would pass to `stripe.identity.verificationSessions
 * .create`. The live Stripe key must never be exercised here.
 *
 * RELATIONSHIP TO STRIPE CONNECT
 * ------------------------------
 * Stripe Connect (src/lib/billing/connect.ts + stripe_connect_accounts) already
 * collects seller identity/KYC as part of payout onboarding. This KYC layer does
 * NOT duplicate that: `isWorkspaceVerified` treats a fully-enabled Connect
 * account (charges + payouts enabled) as proof of identity for selling, and only
 * ADDITIONALLY recognises a standalone `verified` individual/business
 * verification recorded here (e.g. Stripe Identity for higher-risk suppliers or
 * customer/guest verification, where Connect is not in play).
 *
 * COMPLIANCE HONESTY
 * ------------------
 * A verification status here reflects ONLY what the provider (Stripe Identity) or
 * an admin recorded. `setVerificationStatus` is the ONLY mutator of status and is
 * called exclusively by the verified-webhook handler or an authenticated admin
 * action — never auto-approved from client input.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  IdentityVerification,
  StartVerificationArgs,
  VerificationStatus,
  VerificationSubject,
  VerificationSessionParams,
  SellingGateResult,
} from "./types"

/** Postgres / PostgREST codes meaning the table/column is not provisioned yet. */
const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703", "PGRST116"])

function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * Most-recent verification for a subject, or null. 42P01-tolerant: returns null
 * if the identity tables are not provisioned in this environment.
 */
export async function getVerification(
  supabase: SupabaseClient,
  { subjectType, subjectId }: VerificationSubject
): Promise<IdentityVerification | null> {
  const { data, error } = await supabase
    .from("identity_verifications")
    .select("*")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    if (isNotProvisioned(error)) return null
    throw error
  }
  return (data as IdentityVerification | null) ?? null
}

/** Look up a verification by its provider VerificationSession id. */
export async function getVerificationByProviderRef(
  supabase: SupabaseClient,
  providerRef: string
): Promise<IdentityVerification | null> {
  const { data, error } = await supabase
    .from("identity_verifications")
    .select("*")
    .eq("provider_ref", providerRef)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    if (isNotProvisioned(error)) return null
    throw error
  }
  return (data as IdentityVerification | null) ?? null
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Create an `identity_verifications` row in status='pending' (i.e. a session is
 * about to be created with the provider). Does NOT call Stripe — pair this with
 * `buildVerificationSessionParams` + a server action that performs the actual
 * `stripe.identity.verificationSessions.create`, then `linkProviderRef`.
 */
export async function startVerification(
  supabase: SupabaseClient,
  args: StartVerificationArgs
): Promise<IdentityVerification> {
  const row = {
    subject_type: args.subjectType,
    subject_id: args.subjectId,
    workspace_id: args.workspaceId ?? null,
    kind: args.kind ?? "individual",
    provider: args.provider ?? "stripe_identity",
    status: "pending" as VerificationStatus,
    created_by: args.createdBy ?? null,
  }
  const { data, error } = await supabase
    .from("identity_verifications")
    .insert(row)
    .select("*")
    .single()
  if (error) throw error
  return data as IdentityVerification
}

/**
 * Pure: build the params for a Stripe Identity VerificationSession. We DO NOT
 * call Stripe — the caller passes the return value to the Stripe SDK. The
 * verification row id is threaded through `metadata` so the webhook can correlate
 * the resulting session back to our row (alongside provider_ref).
 */
export function buildVerificationSessionParams(args: {
  verificationId: string
  kind?: StartVerificationArgs["kind"]
  workspaceId?: string | null
  subjectId: string
  email?: string | null
  requireSelfie?: boolean
}): VerificationSessionParams {
  const metadata: Record<string, string> = {
    propvora_verification_id: args.verificationId,
    subject_id: args.subjectId,
  }
  if (args.workspaceId) metadata.workspace_id = args.workspaceId
  if (args.kind) metadata.kind = args.kind

  const params: VerificationSessionParams = {
    type: "document",
    metadata,
    options: {
      document: {
        require_matching_selfie: args.requireSelfie ?? true,
        require_live_capture: true,
        allowed_types: ["driving_license", "passport", "id_card"],
      },
    },
  }
  if (args.email) params.provided_details = { email: args.email }
  return params
}

/**
 * Attach the provider's VerificationSession id to a verification row, moving it
 * to 'processing' (the subject's flow is now in the provider's hands). DB only.
 */
export async function linkProviderRef(
  supabase: SupabaseClient,
  verificationId: string,
  providerRef: string
): Promise<void> {
  const { error } = await supabase
    .from("identity_verifications")
    .update({ provider_ref: providerRef, status: "processing" })
    .eq("id", verificationId)
  if (error) throw error
}

/**
 * The ONLY status mutator. DB-only — called by the verified-webhook handler or
 * an authenticated admin decision. Sets verified_at when (and only when) the
 * status becomes 'verified'. Never invoked from unauthenticated client input.
 */
export async function setVerificationStatus(
  supabase: SupabaseClient,
  id: string,
  status: VerificationStatus,
  opts?: { riskLevel?: string | null }
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (status === "verified") patch.verified_at = new Date().toISOString()
  if (opts?.riskLevel !== undefined) patch.risk_level = opts.riskLevel
  const { error } = await supabase
    .from("identity_verifications")
    .update(patch)
    .eq("id", id)
  if (error) throw error
}

/** Same as setVerificationStatus but keyed by provider_ref (webhook path). */
export async function setVerificationStatusByProviderRef(
  supabase: SupabaseClient,
  providerRef: string,
  status: VerificationStatus,
  opts?: { riskLevel?: string | null }
): Promise<boolean> {
  const patch: Record<string, unknown> = { status }
  if (status === "verified") patch.verified_at = new Date().toISOString()
  if (opts?.riskLevel !== undefined) patch.risk_level = opts.riskLevel
  const { data, error } = await supabase
    .from("identity_verifications")
    .update(patch)
    .eq("provider_ref", providerRef)
    .select("id")
  if (error) {
    if (isNotProvisioned(error)) return false
    throw error
  }
  return Array.isArray(data) && data.length > 0
}

// ── Gates ─────────────────────────────────────────────────────────────────────

/**
 * True when a workspace is verified ENOUGH to sell, by either path:
 *   (a) its Stripe Connect account is fully enabled (charges + payouts) —
 *       Connect already proved identity for payouts, OR
 *   (b) a standalone `verified` individual/business verification exists in this
 *       layer (e.g. Stripe Identity).
 * 42P01-tolerant: missing tables are treated as "not verified" (false).
 */
export async function isWorkspaceVerified(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<boolean> {
  // (a) Connect account fully enabled.
  try {
    const { data: acct, error } = await supabase
      .from("stripe_connect_accounts")
      .select("charges_enabled, payouts_enabled, status")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (!error && acct && acct.charges_enabled && acct.payouts_enabled) {
      return true
    }
  } catch {
    /* connect table unavailable — fall through to (b) */
  }

  // (b) Standalone verified individual/business verification.
  try {
    const { data, error } = await supabase
      .from("identity_verifications")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("status", "verified")
      .in("kind", ["individual", "business"])
      .limit(1)
    if (error) {
      if (isNotProvisioned(error)) return false
      throw error
    }
    return Array.isArray(data) && data.length > 0
  } catch (err) {
    if (isNotProvisioned(err)) return false
    throw err
  }
}

/**
 * Gate helper for selling-side actions. Returns {allowed, reason}. The reason is
 * honest and non-legal: it states what proof is (or is not) on file.
 */
export async function requireVerifiedForSelling(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SellingGateResult> {
  const verified = await isWorkspaceVerified(supabase, workspaceId)
  if (verified) {
    return {
      allowed: true,
      reason:
        "Identity confirmed via Stripe Connect payout onboarding or a recorded identity verification.",
    }
  }
  return {
    allowed: false,
    reason:
      "Identity not yet confirmed. Complete Stripe Connect payout onboarding or an identity verification before selling. This reflects only the records on file, not a legal determination.",
  }
}

// ── Webhook handler logic ─────────────────────────────────────────────────────

/** Minimal Stripe event shape we need (kept dependency-light). */
export interface IdentityEventLike {
  id: string
  type: string
  data: { object: { id?: string | null; status?: string | null } }
}

export interface HandleIdentityEventResult {
  handled: boolean
  type: string
  /** Short, non-sensitive note of the transition applied. */
  transition: string | null
}

/**
 * Map a verified Stripe Identity event onto our verification status, keyed by
 * provider_ref (the VerificationSession id). Idempotent: `setVerificationStatus
 * ByProviderRef` is a conditional UPDATE, so a replay re-applies the same
 * terminal status with no side effect (route-level dedupe is the primary guard).
 *
 * Events handled (Stripe `identity.verification_session.*`):
 *   - verified        → status 'verified'
 *   - requires_input  → status 'requires_input'
 *   - processing      → status 'processing'
 *   - canceled        → status 'cancelled'
 *
 * The event's signature MUST already have been verified by the route handler.
 */
export async function handleIdentityEvent(
  event: IdentityEventLike,
  deps: { supabase: SupabaseClient }
): Promise<HandleIdentityEventResult> {
  const sessionId = event.data?.object?.id ?? null
  const result: HandleIdentityEventResult = {
    handled: false,
    type: event.type,
    transition: null,
  }
  if (!sessionId) return result

  const map: Record<string, VerificationStatus> = {
    "identity.verification_session.verified": "verified",
    "identity.verification_session.requires_input": "requires_input",
    "identity.verification_session.processing": "processing",
    "identity.verification_session.canceled": "cancelled",
  }
  const next = map[event.type]
  if (!next) return result

  const updated = await setVerificationStatusByProviderRef(deps.supabase, sessionId, next)
  result.handled = updated
  result.transition = updated ? `${sessionId} → ${next}` : null
  return result
}
