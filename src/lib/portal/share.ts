import "server-only"
import { createHash, randomBytes } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"

// ============================================================================
// RECIPIENT SHARE PORTALS — /p/[token] access boundary.
//
// A complement to the magic-link session model (lib/portal/session.ts). Here
// the token in the URL IS the credential — there is no session exchange. A
// single `portal_share_links` row maps a hashed token to:
//   * a workspace
//   * a resource_type + resource_ids[]  (the ONLY things the recipient may see)
//   * a capabilities[]                  (view / download / upload / sign / comment)
//   * an expiry + a revocation flag
//
// This module is the ONLY authorization boundary for /p/[token]. Every read
// here:
//   1. hashes the raw URL token (SHA-256) and looks up the row by token_hash
//   2. fails closed on missing / expired / revoked
//   3. returns a FROZEN grant whose scope downstream code must respect
//
// `server-only` keeps the service-role client out of any client bundle.
// ============================================================================

export type ShareResourceType =
  | "document"
  | "documents"
  | "invoice"
  | "job"
  | "work_order"
  | "tenancy"
  | "property"

export type ShareCapability = "view" | "download" | "upload" | "sign" | "comment"

export const ALL_CAPABILITIES: ShareCapability[] = [
  "view",
  "download",
  "upload",
  "sign",
  "comment",
]

export type ShareOutcome =
  | { ok: true; grant: ShareGrant }
  | { ok: false; reason: "invalid" | "expired" | "revoked" }

export interface ShareGrant {
  id: string
  workspaceId: string
  workspaceName: string
  contactId: string | null
  resourceType: ShareResourceType
  /** The allow-list of resource ids the recipient may reach. Never widened. */
  resourceIds: string[]
  capabilities: ShareCapability[]
  title: string | null
  recipientLabel: string | null
  expiresAt: string
}

// ─── token helpers ───────────────────────────────────────────────────────────

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

/** Mint a 256-bit URL-safe secret. Returned to the issuer EXACTLY ONCE. */
export function generateShareToken(): string {
  return randomBytes(32).toString("base64url")
}

function coerceResourceType(v: unknown): ShareResourceType | null {
  const s = String(v ?? "")
  if (
    s === "document" ||
    s === "documents" ||
    s === "invoice" ||
    s === "job" ||
    s === "work_order" ||
    s === "tenancy" ||
    s === "property"
  ) {
    return s
  }
  return null
}

function coerceCapabilities(v: unknown): ShareCapability[] {
  if (!Array.isArray(v)) return ["view"]
  const out = v.filter((c): c is ShareCapability =>
    ALL_CAPABILITIES.includes(c as ShareCapability)
  )
  // 'view' is always implied so a recipient can at least see the page chrome.
  if (!out.includes("view")) out.unshift("view")
  return Array.from(new Set(out))
}

interface ShareRow {
  id: string
  workspace_id: string
  contact_id: string | null
  resource_type: string
  resource_ids: string[] | null
  capabilities: string[] | null
  title: string | null
  recipient_label: string | null
  expires_at: string
  revoked_at: string | null
}

/**
 * Resolve a RAW /p/[token] secret to a frozen grant, or a coarse failure
 * reason. Fails closed on every doubt. We deliberately collapse "not found"
 * into `invalid` so a probe cannot enumerate tokens.
 */
export async function resolveShareToken(rawToken: string): Promise<ShareOutcome> {
  if (!rawToken || rawToken.length < 16) return { ok: false, reason: "invalid" }
  const admin = createAdminClient()
  const tokenHash = sha256Hex(rawToken)

  let row: ShareRow | null = null
  try {
    const { data, error } = await admin
      .from("portal_share_links")
      .select(
        "id, workspace_id, contact_id, resource_type, resource_ids, capabilities, title, recipient_label, expires_at, revoked_at"
      )
      .eq("token_hash", tokenHash)
      .maybeSingle()
    if (error || !data) return { ok: false, reason: "invalid" }
    row = data as ShareRow
  } catch {
    return { ok: false, reason: "invalid" }
  }
  if (!row) return { ok: false, reason: "invalid" }

  // Revocation + expiry (fail closed).
  if (row.revoked_at) return { ok: false, reason: "revoked" }
  const exp = new Date(row.expires_at).getTime()
  if (!Number.isFinite(exp) || exp <= Date.now()) return { ok: false, reason: "expired" }
  if (!row.workspace_id) return { ok: false, reason: "invalid" }

  const resourceType = coerceResourceType(row.resource_type)
  if (!resourceType) return { ok: false, reason: "invalid" }

  // Resolve a display name for the chrome (never trusts client input).
  let workspaceName = "Propvora"
  try {
    const { data: ws } = await admin
      .from("workspaces")
      .select("name")
      .eq("id", row.workspace_id)
      .maybeSingle()
    if (ws?.name) workspaceName = String(ws.name)
  } catch {
    /* tolerate */
  }

  const grant: ShareGrant = {
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName,
    contactId: row.contact_id,
    resourceType,
    resourceIds: Array.isArray(row.resource_ids)
      ? row.resource_ids.filter((x) => typeof x === "string")
      : [],
    capabilities: coerceCapabilities(row.capabilities),
    title: row.title,
    recipientLabel: row.recipient_label,
    expiresAt: row.expires_at,
  }
  return { ok: true, grant }
}

/** Whether the grant carries a given capability. */
export function can(grant: ShareGrant, cap: ShareCapability): boolean {
  return grant.capabilities.includes(cap)
}

/**
 * Strict scope check: is `resourceId` inside this grant's allow-list?
 * An empty allow-list means "no specific ids" — used for collection grants
 * (e.g. resource_type='documents') where scoping is by the workspace + type,
 * and the caller has already constrained the query to the grant's workspace.
 */
export function isResourceInScope(grant: ShareGrant, resourceId: string): boolean {
  if (grant.resourceIds.length === 0) return false
  return grant.resourceIds.includes(resourceId)
}

/** Best-effort: bump view counters + last_viewed_at. Never throws. */
export async function markShareViewed(shareLinkId: string): Promise<void> {
  if (!shareLinkId) return
  const admin = createAdminClient()
  try {
    const { data } = await admin
      .from("portal_share_links")
      .select("view_count")
      .eq("id", shareLinkId)
      .maybeSingle()
    const next = Number((data as { view_count?: number } | null)?.view_count ?? 0) + 1
    await admin
      .from("portal_share_links")
      .update({ view_count: next, last_viewed_at: new Date().toISOString() })
      .eq("id", shareLinkId)
  } catch {
    /* tolerate */
  }
}
