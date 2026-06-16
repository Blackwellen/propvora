import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminIdentity } from "@/lib/admin/guard"
import { recordAudit } from "@/lib/audit/log"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NOT_PROVISIONED = new Set(["42P01", "PGRST205"])

/**
 * POST /api/admin/marketplace/listings/[id]/moderate
 *
 * Platform-admin action to approve or reject a listing that is in
 * `pending_review` status.
 *
 * Body:
 *   { decision: "approve" | "reject", reason?: string }
 *
 * Approve → sets status = 'published', published_at = now()
 * Reject  → sets status = 'draft', records reason in metadata.rejection_reason
 *
 * Security: fail-closed — requires verified platform admin identity (checked
 * here even though (admin) layout also redirects, so this API is safe even if
 * called directly). Uses the service-role admin client.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    // Platform-admin identity check (fail-closed)
    const identity = await getAdminIdentity()
    if (!identity) {
      return NextResponse.json({ error: "Forbidden: platform admin access required" }, { status: 403 })
    }

    const { id } = await params
    const body = (await request.json().catch(() => null)) as {
      decision?: string
      reason?: string
    } | null

    if (!body || !["approve", "reject"].includes(body.decision ?? "")) {
      return NextResponse.json(
        { error: "Body must include decision: 'approve' | 'reject'" },
        { status: 400 }
      )
    }

    const adminDb = createAdminClient()

    // Load the listing
    const { data: listing, error: fetchErr } = await adminDb
      .from("marketplace_listings")
      .select("id, workspace_id, status, metadata, company_name, title")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr) {
      if (NOT_PROVISIONED.has((fetchErr as { code?: string }).code ?? "")) {
        return NextResponse.json({ error: "Marketplace not provisioned" }, { status: 503 })
      }
      throw fetchErr
    }
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if ((listing as { status: string }).status !== "pending_review") {
      return NextResponse.json(
        { error: `Listing is not in pending_review state (current: ${(listing as { status: string }).status})` },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const existingMeta = (listing as { metadata?: Record<string, unknown> }).metadata ?? {}

    let patch: Record<string, unknown>
    if (body.decision === "approve") {
      patch = {
        status: "published",
        published_at: now,
        updated_at: now,
        metadata: {
          ...existingMeta,
          moderation_approved_at: now,
          moderation_approved_by: identity.userId,
          moderation_rejection_reason: null,
        },
      }
    } else {
      patch = {
        status: "draft",
        updated_at: now,
        metadata: {
          ...existingMeta,
          moderation_rejected_at: now,
          moderation_rejected_by: identity.userId,
          moderation_rejection_reason: body.reason ?? null,
        },
      }
    }

    const { data: updated, error: updateErr } = await adminDb
      .from("marketplace_listings")
      .update(patch)
      .eq("id", id)
      .select("id, status, updated_at")
      .maybeSingle()

    if (updateErr) throw updateErr

    // Audit log — use anon client (user-authenticated) for workspace context
    try {
      const supabase = await createClient()
      await recordAudit(supabase, {
        workspaceId: (listing as { workspace_id: string }).workspace_id,
        userId: identity.userId,
        action:
          body.decision === "approve"
            ? "marketplace.listing_approved"
            : "marketplace.listing_rejected",
        resourceType: "marketplace_listing",
        resourceId: id,
        metadata: {
          decision: body.decision,
          reason: body.reason ?? null,
          admin_id: identity.userId,
        },
      })
    } catch {
      // Audit failure is non-fatal
    }

    return NextResponse.json({
      listing: updated,
      decision: body.decision,
    })
  } catch (err) {
    captureException(err, { source: "api/admin/marketplace/listings/[id]/moderate POST", requestId })
    return NextResponse.json({ error: "Moderation action failed", requestId }, { status: 500 })
  }
}
