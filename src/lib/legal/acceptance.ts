import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  CORE_ACCEPTANCE_DOCUMENTS,
  LEGAL_DOCUMENTS,
  type LegalDocumentType,
} from "./documents"

/**
 * Legal-acceptance logging.
 *
 * Records that a user accepted a specific VERSION of a legal document, and
 * exposes helpers to read the currently-accepted version and to detect when a
 * re-acceptance is required (because the published version moved on).
 *
 * Idempotent: the (user, document_type, document_version) unique index means
 * re-recording the same acceptance is a safe no-op (we swallow the 23505).
 *
 * PII hygiene: only an optional IP / user-agent string is stored as evidence;
 * nothing sensitive. The table is RLS-scoped to the owning user.
 */

export interface AcceptanceContext {
  /** Where the acceptance happened. */
  context?: "signup" | "re_acceptance" | "onboarding" | "checkout" | "other"
  ip?: string | null
  userAgent?: string | null
}

export interface RecordedAcceptance {
  documentType: LegalDocumentType
  version: string
  ok: boolean
  /** true when the row already existed (idempotent re-accept). */
  alreadyRecorded: boolean
  error?: string
}

/** Minimal structural client (works with admin or cookie-scoped server client). */
type AcceptanceClient = Pick<SupabaseClient, "from">

/**
 * Record acceptance of a single document at its CURRENT published version.
 * Idempotent on (user, type, version).
 */
export async function recordAcceptance(
  client: AcceptanceClient,
  userId: string,
  documentType: LegalDocumentType,
  ctx: AcceptanceContext = {},
): Promise<RecordedAcceptance> {
  const version = LEGAL_DOCUMENTS[documentType].version
  try {
    const { error } = await client.from("legal_acceptances").insert({
      user_id: userId,
      document_type: documentType,
      document_version: version,
      context: ctx.context ?? "signup",
      ip: ctx.ip ?? null,
      user_agent: ctx.userAgent ?? null,
    })
    if (error) {
      // 23505 = unique violation = this exact version was already accepted.
      if ((error as { code?: string }).code === "23505") {
        return { documentType, version, ok: true, alreadyRecorded: true }
      }
      return { documentType, version, ok: false, alreadyRecorded: false, error: error.message }
    }
    return { documentType, version, ok: true, alreadyRecorded: false }
  } catch (err) {
    return {
      documentType,
      version,
      ok: false,
      alreadyRecorded: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Record acceptance of the CORE documents (Terms + Privacy) at signup. Each is
 * idempotent. Returns the per-document outcome.
 */
export async function recordCoreAcceptances(
  client: AcceptanceClient,
  userId: string,
  ctx: AcceptanceContext = {},
): Promise<RecordedAcceptance[]> {
  const results: RecordedAcceptance[] = []
  for (const type of CORE_ACCEPTANCE_DOCUMENTS) {
    results.push(await recordAcceptance(client, userId, type, ctx))
  }
  return results
}

export interface AcceptedVersion {
  documentType: LegalDocumentType
  /** Latest version the user has accepted, or null if never. */
  acceptedVersion: string | null
  acceptedAt: string | null
  /** Current published version. */
  currentVersion: string
  /** true when the accepted version is stale (or missing) vs the current one. */
  needsReacceptance: boolean
}

/**
 * Read the latest accepted version for each CORE document and whether a
 * re-acceptance is required (published version moved on, or never accepted).
 */
export async function getCoreAcceptanceStatus(
  client: AcceptanceClient,
  userId: string,
): Promise<AcceptedVersion[]> {
  const out: AcceptedVersion[] = []
  for (const type of CORE_ACCEPTANCE_DOCUMENTS) {
    const current = LEGAL_DOCUMENTS[type].version
    let acceptedVersion: string | null = null
    let acceptedAt: string | null = null
    try {
      const { data } = await client
        .from("legal_acceptances")
        .select("document_version, accepted_at")
        .eq("user_id", userId)
        .eq("document_type", type)
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        acceptedVersion = (data as { document_version: string }).document_version
        acceptedAt = (data as { accepted_at: string }).accepted_at
      }
    } catch {
      /* read failure → treat as not accepted (safe default = re-prompt) */
    }
    out.push({
      documentType: type,
      acceptedVersion,
      acceptedAt,
      currentVersion: current,
      needsReacceptance: acceptedVersion !== current,
    })
  }
  return out
}
