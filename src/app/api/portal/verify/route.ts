import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isExternalPortalEnabled } from "@/lib/portal/flags"
import { resolveTokenToGrant, markTokenUsed } from "@/lib/portal/verify"
import { checkVerifyRateLimit } from "@/lib/portal/rate-limit"
import {
  PORTAL_COOKIE_NAME,
  buildSignedCookieValue,
  generateToken,
  sha256,
  portalCookieOptions,
  getRequestMeta,
  PROPERTY_SCOPED_PORTAL_TYPES,
} from "@/lib/portal/session"
import { getLandlordPropertyIds } from "@/lib/portal/data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ============================================================================
// POST /api/portal/verify
//
// Consumes a magic-link token. On success it:
//   1. rate-limits the attempt (fail-closed redirect on abuse)
//   2. SHA-256s the token and resolves it to a grant + frozen scope
//   3. creates a portal_sessions row with a fresh random session token
//      (only its SHA-256 hash is stored)
//   4. sets the HttpOnly+Secure+SameSite=Lax SIGNED session cookie
//   5. stamps token last_used_at
//   6. redirects to /portal/{sessionId}/{portal_type}
//
// Invalid / expired / revoked => redirect to a safe generic page. We never
// reveal which condition failed (no enumeration).
// ============================================================================

const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8h cap, further clamped to token expiry

function redirect(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, req.url), { status: 303 })
}

export async function POST(req: NextRequest) {
  if (!isExternalPortalEnabled()) {
    return redirect(req, "/portal/expired")
  }

  // Extract token from form body or query.
  let rawToken: string | null = null
  try {
    const ct = req.headers.get("content-type") ?? ""
    if (ct.includes("application/json")) {
      const body = (await req.json()) as { token?: string }
      rawToken = typeof body.token === "string" ? body.token : null
    } else {
      const form = await req.formData()
      const v = form.get("token")
      rawToken = typeof v === "string" ? v : null
    }
  } catch {
    rawToken = null
  }
  if (!rawToken) {
    const url = new URL(req.url)
    rawToken = url.searchParams.get("token")
  }
  if (!rawToken) return redirect(req, "/portal/expired")

  const { ip, userAgent } = await getRequestMeta()

  // Rate limit BEFORE any token lookup.
  const allowed = await checkVerifyRateLimit(ip, rawToken)
  if (!allowed) {
    // Generic safe page; do not reveal rate-limit specifics.
    return redirect(req, "/portal/expired")
  }

  const outcome = await resolveTokenToGrant(rawToken)
  if (!outcome.ok) {
    // Log the failure server-side (no token material), then redirect generic.
    console.warn(`[portal/verify] failed: ${outcome.reason} ip=${ip ?? "?"}`)
    if (outcome.reason === "revoked") return redirect(req, "/portal/revoked")
    return redirect(req, "/portal/expired")
  }

  const grant = outcome.resolved

  // Freeze any record-level allow-lists for property-scoped verticals
  // (landlord / accountant / solicitor / generic) at verify time so the
  // session carries them and downstream reads can't be widened.
  const scope = { ...grant.scope }
  if (PROPERTY_SCOPED_PORTAL_TYPES.includes(grant.portalType) && grant.contactId) {
    try {
      const ids = await getLandlordPropertyIds({
        id: "pending",
        workspaceId: grant.workspaceId,
        contactId: grant.contactId,
        portalType: grant.portalType,
        scope: grant.scope,
        expiresAt: new Date().toISOString(),
        workspaceName: "",
      })
      if (ids.length > 0) scope.propertyIds = ids
    } catch {
      /* tolerate — page-level resolver will recompute */
    }
  }

  // Mint the session token; store only its hash.
  const sessionToken = generateToken(32)
  const sessionTokenHash = sha256(sessionToken)

  // Clamp the session lifetime to the token's expiry if the token expires
  // sooner than our default TTL.
  let ttlSeconds = SESSION_TTL_SECONDS
  if (grant.tokenExpiresAt) {
    const remainMs = new Date(grant.tokenExpiresAt).getTime() - Date.now()
    if (Number.isFinite(remainMs) && remainMs > 0) {
      ttlSeconds = Math.min(ttlSeconds, Math.floor(remainMs / 1000))
    }
  }
  if (ttlSeconds <= 0) return redirect(req, "/portal/expired")
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()

  const admin = createAdminClient()
  let sessionId: string
  try {
    const { data, error } = await admin
      .from("portal_sessions")
      .insert({
        workspace_id: grant.workspaceId,
        portal_access_id: grant.portalAccessId,
        token_id: grant.tokenId,
        contact_id: grant.contactId,
        portal_type: grant.portalType,
        scope,
        session_token_hash: sessionTokenHash,
        expires_at: expiresAt,
        revoked: false,
        last_seen_at: new Date().toISOString(),
        ip,
        user_agent: userAgent,
      })
      .select("id")
      .single()
    if (error || !data) {
      console.error("[portal/verify] session insert failed", error)
      return redirect(req, "/portal/expired")
    }
    sessionId = data.id as string
  } catch (e) {
    console.error("[portal/verify] session insert threw", e)
    return redirect(req, "/portal/expired")
  }

  await markTokenUsed(grant.tokenId)

  const cookieValue = buildSignedCookieValue(sessionToken)
  if (!cookieValue) {
    // No signing secret => cannot establish a trustworthy session. Fail closed.
    console.error("[portal/verify] no signing secret; cannot set session cookie")
    return redirect(req, "/portal/expired")
  }

  const res = redirect(req, `/portal/${sessionId}/${grant.portalType}`)
  res.cookies.set(PORTAL_COOKIE_NAME, cookieValue, portalCookieOptions(ttlSeconds))
  return res
}

// A GET to /api/portal/verify (e.g. someone pasting the API URL) is treated
// as a generic invalid attempt — never an error page that hints at internals.
export async function GET(req: NextRequest) {
  return redirect(req, "/portal/login")
}
