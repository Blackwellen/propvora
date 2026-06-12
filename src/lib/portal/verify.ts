import { createAdminClient } from "@/lib/supabase/admin"
import { sha256, type PortalType, type PortalScope } from "./session"

// ============================================================================
// Token -> grant resolution for the magic-link verify flow.
//
// The live token lineage stores the token as a SHA-256 `token_hash` on
// `portal_access_tokens`, which links to a grant row in
// `contact_portal_access` via `access_id`. We resolve the contact +
// access_type from that grant and FREEZE the resulting scope into the
// portal_sessions row.
//
// Fail closed: a token that is unknown, expired, revoked, or whose grant is
// expired / revoked resolves to null. We deliberately do NOT distinguish
// reasons to the caller beyond a coarse code, to avoid token enumeration.
// ============================================================================

export type VerifyOutcome =
  | { ok: true; resolved: ResolvedGrant }
  | { ok: false; reason: "invalid" | "expired" | "revoked" }

export interface ResolvedGrant {
  workspaceId: string
  contactId: string | null
  portalType: PortalType
  portalAccessId: string | null
  tokenId: string | null
  scope: PortalScope
  /** token row expiry — the session never outlives the token. */
  tokenExpiresAt: string | null
}

function accessTypeToPortalType(t: unknown): PortalType {
  const v = String(t ?? "").toLowerCase()
  if (v === "landlord" || v === "owner" || v === "investor") return "landlord"
  if (v === "tenant" || v === "occupier") return "tenant"
  // supplier / accountant / solicitor / generic all use the supplier vertical
  return "supplier"
}

interface TokenRow {
  id?: string
  workspace_id?: string | null
  access_id?: string | null
  entity_id?: string | null
  entity_type?: string | null
  contact_id?: string | null
  portal_type?: string | null
  email?: string | null
  permissions?: Record<string, unknown> | null
  expires_at?: string | null
  revoked?: boolean | null
  status?: string | null
}

/**
 * Look up a raw magic-link token (we receive the RAW token, hash it, and
 * match by token_hash) and resolve it to a grant + frozen scope.
 */
export async function resolveTokenToGrant(rawToken: string): Promise<VerifyOutcome> {
  if (!rawToken || rawToken.length < 16) return { ok: false, reason: "invalid" }
  const admin = createAdminClient()
  const tokenHash = sha256(rawToken)

  let token: TokenRow | null = null
  try {
    // Select * so we tolerate either token lineage (access_id vs entity_id).
    const { data, error } = await admin
      .from("portal_access_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .limit(1)
      .maybeSingle()
    if (error) {
      // Missing table / column => treat as not-provisioned => invalid.
      return { ok: false, reason: "invalid" }
    }
    if (!data) return { ok: false, reason: "invalid" }
    token = data as TokenRow
  } catch {
    return { ok: false, reason: "invalid" }
  }

  // Token-level revoked / expired checks (fail closed).
  if (token.revoked === true) return { ok: false, reason: "revoked" }
  if (token.status && ["revoked", "disabled"].includes(String(token.status).toLowerCase())) {
    return { ok: false, reason: "revoked" }
  }
  if (token.expires_at) {
    const exp = new Date(token.expires_at).getTime()
    if (Number.isFinite(exp) && exp <= Date.now()) {
      return { ok: false, reason: "expired" }
    }
  }

  // Resolve the grant the token belongs to. Prefer the access_id lineage
  // (what the grant API writes); fall back to direct columns on the token.
  let workspaceId = token.workspace_id ?? null
  let contactId = token.contact_id ?? null
  let portalTypeSource: unknown = token.portal_type ?? null
  let permissions: Record<string, unknown> =
    (token.permissions as Record<string, unknown>) ?? {}
  const portalAccessId = token.access_id ?? null

  if (portalAccessId) {
    try {
      const { data: grant, error } = await admin
        .from("contact_portal_access")
        .select("id, workspace_id, contact_id, access_type, status, expires_at")
        .eq("id", portalAccessId)
        .maybeSingle()
      if (!error && grant) {
        const g = grant as Record<string, unknown>
        // Grant-level revoked / expired (fail closed).
        const gStatus = String(g.status ?? "").toLowerCase()
        if (gStatus === "revoked") return { ok: false, reason: "revoked" }
        if (g.expires_at) {
          const gexp = new Date(g.expires_at as string).getTime()
          if (Number.isFinite(gexp) && gexp <= Date.now()) {
            return { ok: false, reason: "expired" }
          }
        }
        workspaceId = (g.workspace_id as string) ?? workspaceId
        contactId = (g.contact_id as string) ?? contactId
        portalTypeSource = g.access_type ?? portalTypeSource
      }
    } catch {
      /* tolerate — fall through to token-level fields */
    }
  }

  // entity_id lineage: when the token carries entity_id/entity_type instead
  // of a separate grant row.
  if (!contactId && token.entity_id && (token.entity_type === "contact" || !token.entity_type)) {
    contactId = token.entity_id
  }
  if (!portalTypeSource && token.entity_type) portalTypeSource = token.entity_type

  if (!workspaceId) return { ok: false, reason: "invalid" }

  const portalType = accessTypeToPortalType(portalTypeSource)

  const scope: PortalScope = {
    workspaceId,
    contactId,
    portalType,
    permissions: typeof permissions === "object" && permissions ? permissions : {},
  }

  return {
    ok: true,
    resolved: {
      workspaceId,
      contactId,
      portalType,
      portalAccessId,
      tokenId: token.id ?? null,
      scope,
      tokenExpiresAt: token.expires_at ?? null,
    },
  }
}

/** Best-effort: stamp last_used_at on the token row after a successful verify. */
export async function markTokenUsed(tokenId: string | null): Promise<void> {
  if (!tokenId) return
  const admin = createAdminClient()
  try {
    await admin
      .from("portal_access_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", tokenId)
  } catch {
    /* tolerate — column may not exist on this lineage */
  }
}
