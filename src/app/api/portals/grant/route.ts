import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createHash, randomBytes } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
import { isExtendedPortalProfile } from "@/lib/portals/config"
import { isExtendedPortalProfilesEnabled } from "@/lib/portal/flags"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/portals/grant
 *
 * Provisions external portal access for a contact. The magic-link token is
 * minted SERVER-SIDE here from a high-entropy CSPRNG and stored ONLY as a
 * SHA-256 hash in portal_access_tokens. The RAW token is returned EXACTLY
 * ONCE in this response so the workspace user can copy the magic link; it is
 * never persisted and cannot be recovered later (only token STATUS is ever
 * surfaced afterwards).
 *
 * The recipient consumes the link at /portal?token=... which POSTs to
 * /api/portal/verify, establishing a scoped portal session.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the workspace user via the session cookie.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // 2. Parse + validate body.
    let body: {
      workspaceId?: string
      contactId?: string
      profile?: string
      accessType?: string
      purpose?: string
      expiryDays?: number
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { workspaceId, contactId } = body
    if (!workspaceId || !contactId) {
      return NextResponse.json(
        { error: "workspaceId and contactId are required" },
        { status: 400 }
      )
    }

    // Defence in depth: reject extended portal profiles when the flag is off,
    // so a flagged-off profile can't be granted via a direct API call even
    // though the UI hides it. V1 only provisions landlord/supplier/tenant.
    if (isExtendedPortalProfile(body.profile) && !isExtendedPortalProfilesEnabled()) {
      return NextResponse.json(
        { error: "This portal profile is not available." },
        { status: 403 }
      )
    }

    const expiryDays =
      typeof body.expiryDays === "number" && body.expiryDays > 0
        ? Math.min(body.expiryDays, 365)
        : 30
    const accessType = body.accessType || body.profile || "supplier"
    const purpose = body.purpose ?? null

    // 3. Authorise: the user must be a member of the target workspace.
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this workspace" },
        { status: 403 }
      )
    }

    const admin = createAdminClient()

    // 4. Verify the contact belongs to the workspace (no cross-tenant grants).
    const { data: contact, error: contactErr } = await admin
      .from("contacts")
      .select("id, workspace_id")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (contactErr && (contactErr as { code?: string }).code === "42P01") {
      return NextResponse.json(
        { error: "Contacts are not available in this environment" },
        { status: 503 }
      )
    }
    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found in this workspace" },
        { status: 404 }
      )
    }

    const expiresAt = new Date(
      Date.now() + expiryDays * 24 * 60 * 60 * 1000
    ).toISOString()

    // 5. Insert the portal access grant.
    const { data: grant, error: grantErr } = await admin
      .from("contact_portal_access")
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        access_type: accessType,
        purpose,
        status: "created",
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select("id")
      .single()

    if (grantErr) {
      if ((grantErr as { code?: string }).code === "42P01") {
        return NextResponse.json(
          { error: "Portal access table is not provisioned" },
          { status: 503 }
        )
      }
      console.error("[portals/grant] insert grant", grantErr)
      return NextResponse.json(
        { error: "Failed to create portal access" },
        { status: 500 }
      )
    }

    // 6. Mint the magic-link token SERVER-SIDE (256-bit CSPRNG) and store
    //    ONLY its SHA-256 hash. The raw token is returned once below.
    const rawToken = randomBytes(32).toString("base64url")
    const tokenHash = createHash("sha256").update(rawToken).digest("hex")

    const { error: tokenErr } = await admin.from("portal_access_tokens").insert({
      workspace_id: workspaceId,
      portal_type: accessType, // NOT NULL in the live schema
      entity_type: "portal_grant",
      entity_id: grant.id,
      token_hash: tokenHash,
      revoked: false,
      expires_at: expiresAt,
      created_by: user.id,
    })

    if (tokenErr && (tokenErr as { code?: string }).code !== "42P01") {
      console.error("[portals/grant] insert token", tokenErr)
      // Grant exists but token failed — surface a soft warning, keep the grant.
      return NextResponse.json(
        {
          id: grant.id,
          warning: "Grant created but token provisioning failed.",
        },
        { status: 207 }
      )
    }

    // Persist a non-reversible hash on the grant too (defence in depth).
    await admin
      .from("contact_portal_access")
      .update({ token_hash: tokenHash, status: "created" })
      .eq("id", grant.id)

    // Build the recipient magic link. Return the RAW token EXACTLY ONCE so
    // the workspace user can copy the link; it is never persisted in raw form
    // and cannot be retrieved again.
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin
    const magicLink = `${base.replace(/\/$/, "")}/portal?token=${rawToken}`

    // Best-effort audit. NEVER log the raw token / magic link.
    await recordAudit(admin, {
      workspaceId,
      userId: user.id,
      action: AUDIT_ACTIONS.PORTAL_GRANT_CREATED,
      resourceType: "contact_portal_access",
      resourceId: grant.id,
      metadata: { contactId, accessType, expiresAt },
    })

    return NextResponse.json(
      { id: grant.id, token: rawToken, magicLink, expiresAt },
      { status: 201 }
    )
  } catch (err) {
    console.error("[portals/grant]", err)
    return NextResponse.json(
      { error: "Failed to provision portal access" },
      { status: 500 }
    )
  }
}
