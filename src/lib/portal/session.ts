import { cookies, headers } from "next/headers"
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"

// ============================================================================
// EXTERNAL PORTAL — SERVER-SIDE AUTHORIZATION BOUNDARY
//
// External portal users (landlord / supplier / tenant magic-link recipients)
// have NO Supabase auth session, so RLS — which keys off workspace_members —
// CANNOT authorize them. This module is the ONLY authorization boundary for
// the external surface. Every /portal data read must:
//
//   1. read the signed portal-session cookie  (readPortalSessionCookie)
//   2. validate the session                    (getValidatedPortalSession)
//        - cookie signature is intact (HMAC, constant-time compare)
//        - session row exists for the SHA-256 of the cookie's token
//        - not revoked, not past expires_at
//   3. derive the scope                         (session.scope + portal_type)
//   4. query with the SERVICE-ROLE client STRICTLY filtered to that scope
//
// Fail closed on ANY doubt: a missing secret, a malformed cookie, a tampered
// signature, an unknown / expired / revoked session all resolve to `null`,
// which callers MUST treat as "no access".
//
// This file is `server-only` — importing it from a client bundle is a build
// error, which prevents the service-role client from ever reaching the client.
// ============================================================================

export const PORTAL_COOKIE_NAME = "pv_portal_session"

/** Portal verticals this engine understands. */
export type PortalType =
  | "supplier"
  | "landlord"
  | "tenant"
  | "applicant"
  | "accountant"
  | "solicitor"
  | "generic"

/**
 * Property-scoped portal verticals: these resolve their data through the
 * landlord-style linked-property allow-list (contact_portal_access /
 * contact_links with linked_type='property'). Applicant is contact/email
 * scoped (via prospects) so it is deliberately excluded.
 */
export const PROPERTY_SCOPED_PORTAL_TYPES: PortalType[] = [
  "landlord",
  "accountant",
  "solicitor",
  "generic",
]

export interface PortalScope {
  /** The workspace the session is bound to. NEVER widened past this. */
  workspaceId: string
  /** The external contact this session represents. */
  contactId: string | null
  portalType: PortalType
  /** Permissions captured at grant time (free-form; defaults to read-only). */
  permissions: Record<string, unknown>
  /** Optional record-id allow-lists frozen at verify time (e.g. property ids). */
  propertyIds?: string[]
  tenancyIds?: string[]
}

export interface PortalSession {
  id: string
  workspaceId: string
  contactId: string | null
  portalType: PortalType
  scope: PortalScope
  expiresAt: string
  workspaceName: string
}

// ---- secret -----------------------------------------------------------------

/**
 * HMAC secret for signing the session cookie. We derive it from the service
 * role key (always present server-side) so there is no extra secret to
 * provision, but allow an explicit override. If neither is present we fail
 * closed (return null everywhere) rather than sign with a weak key.
 */
function getSigningSecret(): string | null {
  const explicit = process.env.PORTAL_SESSION_SECRET
  if (explicit && explicit.length >= 16) return explicit
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (fallback && fallback.length >= 16) return `portal:${fallback}`
  return null
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

/** A high-entropy URL-safe random token (used for raw magic-link + session tokens). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url")
}

// ---- cookie value: "<token>.<hmac(token)>" ---------------------------------

function sign(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("base64url")
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  try {
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

/** Build the signed cookie value for a freshly-minted session token. */
export function buildSignedCookieValue(sessionToken: string): string | null {
  const secret = getSigningSecret()
  if (!secret) return null
  return `${sessionToken}.${sign(sessionToken, secret)}`
}

/**
 * Verify the signed cookie value and return the bare session token, or null.
 * The signature is checked with a constant-time compare to avoid leaking
 * timing information about valid prefixes.
 */
export function parseSignedCookieValue(value: string | undefined | null): string | null {
  if (!value) return null
  const secret = getSigningSecret()
  if (!secret) return null
  const dot = value.lastIndexOf(".")
  if (dot <= 0) return null
  const token = value.slice(0, dot)
  const sig = value.slice(dot + 1)
  if (!token || !sig) return null
  if (!safeEqual(sig, sign(token, secret))) return null
  return token
}

// ---- cookie I/O -------------------------------------------------------------

/**
 * Standard attributes for the portal session cookie.
 *
 * path="/" so the cookie is sent to BOTH the rendered pages under /portal AND
 * the API routes under /api/portal (verify sets it; logout + file read it).
 * Scoping is enforced in the handlers via the session row, not the cookie
 * path. HttpOnly + Secure(prod) + SameSite=Lax.
 */
export function portalCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  }
}

/** Read + signature-verify the cookie, returning the bare session token. */
export async function readPortalSessionToken(): Promise<string | null> {
  const store = await cookies()
  return parseSignedCookieValue(store.get(PORTAL_COOKIE_NAME)?.value)
}

// ---- session validation (THE check) ----------------------------------------

interface RawSessionRow {
  id: string
  workspace_id: string
  portal_access_id: string | null
  contact_id: string | null
  portal_type: string
  scope: Record<string, unknown> | null
  expires_at: string
  revoked: boolean
}

function coercePortalType(v: unknown): PortalType {
  if (
    v === "supplier" ||
    v === "landlord" ||
    v === "tenant" ||
    v === "applicant" ||
    v === "accountant" ||
    v === "solicitor" ||
    v === "generic"
  ) {
    return v
  }
  // owner/investor map to the landlord vertical; occupier to tenant.
  if (v === "owner" || v === "investor") return "landlord"
  if (v === "occupier") return "tenant"
  // Anything else is treated as the most-restrictive generic document portal.
  return "generic"
}

/**
 * Validate the current request's portal session. Returns a fully-derived
 * PortalSession (scope frozen at verify time) or null. NEVER throws to the
 * caller — any error path fails closed to null.
 */
export async function getValidatedPortalSession(): Promise<PortalSession | null> {
  const token = await readPortalSessionToken()
  if (!token) return null

  const admin = createAdminClient()
  const tokenHash = sha256(token)

  let row: RawSessionRow | null = null
  try {
    const { data, error } = await admin
      .from("portal_sessions")
      .select(
        "id, workspace_id, portal_access_id, contact_id, portal_type, scope, expires_at, revoked"
      )
      .eq("session_token_hash", tokenHash)
      .maybeSingle()
    if (error || !data) return null
    row = data as RawSessionRow
  } catch {
    return null
  }

  if (!row) return null
  // Fail closed on revoked / expired.
  if (row.revoked === true) return null
  const exp = new Date(row.expires_at).getTime()
  if (!Number.isFinite(exp) || exp <= Date.now()) return null
  if (!row.workspace_id) return null

  const portalType = coercePortalType(row.portal_type)
  const rawScope = (row.scope ?? {}) as Record<string, unknown>

  // The scope is the frozen authorization context. We re-bind workspaceId +
  // contactId from the row itself (source of truth) rather than trusting the
  // scope blob alone, so a malformed scope can never widen access.
  const scope: PortalScope = {
    workspaceId: row.workspace_id,
    contactId: row.contact_id,
    portalType,
    permissions:
      rawScope.permissions && typeof rawScope.permissions === "object"
        ? (rawScope.permissions as Record<string, unknown>)
        : {},
    propertyIds: Array.isArray(rawScope.propertyIds)
      ? (rawScope.propertyIds as string[]).filter((x) => typeof x === "string")
      : undefined,
    tenancyIds: Array.isArray(rawScope.tenancyIds)
      ? (rawScope.tenancyIds as string[]).filter((x) => typeof x === "string")
      : undefined,
  }

  // Resolve a display name for the shell (never trusts client input).
  let workspaceName = "Portal"
  try {
    const { data: ws } = await admin
      .from("workspaces")
      .select("name")
      .eq("id", row.workspace_id)
      .maybeSingle()
    if (ws?.name) workspaceName = String(ws.name)
  } catch {
    /* tolerate — generic name */
  }

  // Best-effort heartbeat (non-blocking on failure).
  try {
    await admin
      .from("portal_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", row.id)
  } catch {
    /* tolerate */
  }

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    contactId: row.contact_id,
    portalType,
    scope,
    expiresAt: row.expires_at,
    workspaceName,
  }
}

/**
 * Validate AND assert the session matches the sessionId in the URL. This
 * binds the rendered page to the cookie's session: a valid cookie for
 * session A cannot be replayed against /portal/B/... to view B's data.
 */
export async function getSessionForRoute(
  routeSessionId: string
): Promise<PortalSession | null> {
  const session = await getValidatedPortalSession()
  if (!session) return null
  if (session.id !== routeSessionId) return null
  return session
}

// ---- request metadata (audit) ----------------------------------------------

export async function getRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers()
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null
    const userAgent = h.get("user-agent") || null
    return { ip, userAgent }
  } catch {
    return { ip: null, userAgent: null }
  }
}
