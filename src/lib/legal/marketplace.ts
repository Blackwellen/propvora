/**
 * Marketplace legal acceptance API.
 *
 * Data layer over public.marketplace_policy_acceptance (migration
 * 20260616170000_marketplace_legal.sql). Records and reads versioned policy
 * acceptances for marketplace participants (buyer / seller / supplier /
 * operator), and computes which policies a given role still has outstanding.
 *
 * Sits alongside, and reuses the shape of, the SaaS-side legal_acceptances log
 * (20260615080000_consent_acceptance.sql). The policy registry + version source
 * of truth is src/lib/legal/policies.ts; the legal entity is read from
 * src/lib/legal/company.ts by the UI.
 *
 * 42P01/42703-tolerant: every read returns a safe default ([] / false) rather
 * than throwing if the table is missing in a given environment.
 */

import { currentVersion, isPolicySlug, type PolicySlug } from "./policies"

/**
 * Minimal structural type for a Supabase client — works with both the browser
 * and server clients in this codebase without coupling to either import path.
 */
type SupabaseLike = {
  from: (table: string) => any
}

/** Marketplace participant roles that drive required-policy sets. */
export type MarketplaceRole = "buyer" | "seller" | "supplier" | "operator"

/** Where the acceptance was captured. Matches the DB CHECK constraint. */
export type AcceptanceContext =
  | "signup"
  | "seller_onboarding"
  | "checkout"
  | "booking"
  | "re_acceptance"
  | "other"

export interface RecordAcceptanceInput {
  userId: string
  workspaceId?: string | null
  slug: PolicySlug | string
  context: AcceptanceContext
  /** Optional version override; defaults to the registry's current version. */
  version?: string
  ip?: string | null
}

export interface AcceptanceRow {
  document_slug: string
  version: string
  accepted_at: string
  context: string
}

const TABLE = "marketplace_policy_acceptance"

function errCode(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/** True for "relation/column does not exist" — treated as empty, never thrown. */
function isMissingSchema(e: unknown): boolean {
  const c = errCode(e)
  return c === "42P01" || c === "42703"
}

/**
 * Which policies a role MUST accept before transacting.
 *
 *  - buyer    → marketplace terms, buyer terms, refund + cancellation policies
 *  - seller   → marketplace terms, seller agreement, refund + cancellation, AUP
 *  - supplier → marketplace terms, seller agreement, AUP (supplier is a seller
 *               of services; refund/cancellation are set per-listing)
 *  - operator → seller set plus buyer set (operators both list and book)
 */
export function requiredPoliciesFor(role: MarketplaceRole): PolicySlug[] {
  switch (role) {
    case "buyer":
      return [
        "marketplace-terms",
        "buyer-terms",
        "refund-policy",
        "cancellation-policy",
      ]
    case "seller":
      return [
        "marketplace-terms",
        "seller-agreement",
        "refund-policy",
        "cancellation-policy",
        "acceptable-use",
      ]
    case "supplier":
      return ["marketplace-terms", "seller-agreement", "acceptable-use"]
    case "operator":
      return [
        "marketplace-terms",
        "seller-agreement",
        "buyer-terms",
        "refund-policy",
        "cancellation-policy",
        "acceptable-use",
      ]
    default:
      return ["marketplace-terms"]
  }
}

/**
 * Record a policy acceptance. Idempotent at the DB level (unique on
 * user_id + document_slug + version), so a repeat accept is a no-op upsert.
 * Returns { ok, error? }; never throws on a missing table.
 */
export async function recordPolicyAcceptance(
  supabase: SupabaseLike,
  input: RecordAcceptanceInput,
): Promise<{ ok: boolean; error?: string }> {
  const version = input.version ?? currentVersion(input.slug) ?? undefined
  if (!version) {
    return { ok: false, error: `Unknown policy slug: ${input.slug}` }
  }
  const row = {
    user_id: input.userId,
    workspace_id: input.workspaceId ?? null,
    document_slug: input.slug,
    version,
    context: input.context,
    ip: input.ip ?? null,
  }
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(row, { onConflict: "user_id,document_slug,version" })
    if (error) {
      if (isMissingSchema(error)) return { ok: false, error: "schema_missing" }
      return { ok: false, error: error.message ?? "insert_failed" }
    }
    return { ok: true }
  } catch (e) {
    if (isMissingSchema(e)) return { ok: false, error: "schema_missing" }
    return { ok: false, error: (e as Error)?.message ?? "insert_failed" }
  }
}

/**
 * Has the user accepted a policy? When `version` is omitted, checks against the
 * registry's CURRENT version (so a stale acceptance of an old version counts as
 * not-yet-accepted and re-acceptance is required).
 */
export async function hasAccepted(
  supabase: SupabaseLike,
  userId: string,
  slug: PolicySlug | string,
  version?: string,
): Promise<boolean> {
  const wanted = version ?? currentVersion(slug)
  if (!wanted) return false
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id")
      .eq("user_id", userId)
      .eq("document_slug", slug)
      .eq("version", wanted)
      .limit(1)
    if (error) return false
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

/** All acceptances for a user (most recent first). [] on missing schema. */
export async function listAcceptances(
  supabase: SupabaseLike,
  userId: string,
): Promise<AcceptanceRow[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("document_slug, version, accepted_at, context")
      .eq("user_id", userId)
      .order("accepted_at", { ascending: false })
    if (error || !Array.isArray(data)) return []
    return data as AcceptanceRow[]
  } catch {
    return []
  }
}

/**
 * Which required policies for `role` the user has NOT yet accepted at the
 * current version. Empty array → fully covered, the role may proceed.
 */
export async function outstandingAcceptances(
  supabase: SupabaseLike,
  userId: string,
  role: MarketplaceRole,
): Promise<PolicySlug[]> {
  const required = requiredPoliciesFor(role)
  const accepted = await listAcceptances(supabase, userId)
  const acceptedAtCurrent = new Set(
    accepted
      .filter(
        (a) =>
          isPolicySlug(a.document_slug) &&
          a.version === currentVersion(a.document_slug),
      )
      .map((a) => a.document_slug),
  )
  return required.filter((slug) => !acceptedAtCurrent.has(slug))
}
