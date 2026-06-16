import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NOT_PROVISIONED = new Set(["42P01", "PGRST205"])

/**
 * Dynamically load the sibling-owned listings data layer. Owned by another agent
 * and may not exist yet on this branch — `@ts-ignore` tolerates its absence at
 * compile time, the try/catch at runtime. Returns null when absent.
 */
async function loadListingsModule(): Promise<Record<string, unknown> | null> {
  try {
    // @ts-ignore — module is provided by a sibling agent; may be absent here.
    return (await import("@/lib/marketplace/listings")) as Record<string, unknown>
  } catch {
    return null
  }
}

type ListingRow = {
  id: string
  workspace_id: string
  status: string | null
} & Record<string, unknown>

/** Verify the caller is a member of `workspaceId`. */
async function isWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return Boolean(data)
}

/** Load a listing by id. Returns { listing } or a sentinel for not-found /
 *  not-provisioned so callers can map to the right status. */
async function loadListing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
): Promise<{ listing: ListingRow | null; notProvisioned: boolean }> {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    if (NOT_PROVISIONED.has(error.code ?? "")) {
      return { listing: null, notProvisioned: true }
    }
    throw error
  }
  return { listing: (data as ListingRow) ?? null, notProvisioned: false }
}

/**
 * GET /api/marketplace/listings/[id]
 * A PUBLISHED listing is visible to any authenticated user. A draft / paused /
 * archived listing is visible ONLY to members of its owning workspace.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { listing, notProvisioned } = await loadListing(supabase, id)
    if (notProvisioned || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (listing.status !== "published") {
      // Non-public: owner-workspace members only.
      const member = await isWorkspaceMember(supabase, listing.workspace_id, user.id)
      if (!member) {
        // Do not leak existence of a non-public listing.
        return NextResponse.json({ error: "Listing not found" }, { status: 404 })
      }
    }

    return NextResponse.json({ listing })
  } catch (err) {
    captureException(err, { source: "api/marketplace/listings/[id] GET", requestId })
    return NextResponse.json({ error: "Failed to load listing", requestId }, { status: 500 })
  }
}

/**
 * PATCH /api/marketplace/listings/[id]
 * Owner-scoped update. The caller must be a member of the listing's workspace.
 * Delegates to `@/lib/marketplace/listings.updateListing` when available; falls
 * back to a tolerant, workspace-scoped direct update otherwise.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }

    const { listing, notProvisioned } = await loadListing(supabase, id)
    if (notProvisioned || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }
    if (!(await isWorkspaceMember(supabase, listing.workspace_id, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prefer the sibling-owned data layer if present.
    let updateListing:
      | ((
          supabase: Awaited<ReturnType<typeof createClient>>,
          id: string,
          patch: Record<string, unknown>
        ) => Promise<unknown>)
      | undefined
    try {
      const mod = (await loadListingsModule()) as {
        updateListing?: typeof updateListing
      } | null
      updateListing = mod?.updateListing
    } catch {
      updateListing = undefined
    }

    // Never allow these to be reassigned via a patch.
    const { id: _omitId, workspace_id: _omitWs, workspaceId: _omitWs2, created_by: _omitCb, ...patch } =
      body as Record<string, unknown>
    void _omitId
    void _omitWs
    void _omitWs2
    void _omitCb

    // Moderation gate: suppliers cannot publish directly.
    // Sending status='published' is redirected to 'pending_review'.
    // Only a platform-admin approval (POST /api/admin/marketplace/listings/[id]/moderate)
    // can move a listing to 'published'.
    if (patch.status === "published") {
      patch.status = "pending_review"
    }

    // Strip privileged fields that only admins may set.
    delete patch.is_featured
    delete patch.verified
    delete patch.rating
    delete patch.review_count
    delete patch.view_count
    delete patch.enquiry_count

    if (typeof updateListing === "function") {
      try {
        const updated = await updateListing(supabase, id, patch)
        return NextResponse.json({ listing: updated })
      } catch (err) {
        const code = (err as { code?: string } | null)?.code
        if (code && NOT_PROVISIONED.has(code)) {
          return NextResponse.json(
            { error: "Marketplace is not ready yet." },
            { status: 503 }
          )
        }
        throw err
      }
    }

    // Fallback: tolerant direct update, scoped to the owning workspace.
    const { data, error } = await supabase
      .from("marketplace_listings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", listing.workspace_id)
      .select("*")
      .maybeSingle()

    if (error) {
      if (NOT_PROVISIONED.has(error.code ?? "")) {
        return NextResponse.json({ error: "Marketplace is not ready yet." }, { status: 503 })
      }
      throw error
    }
    return NextResponse.json({ listing: data })
  } catch (err) {
    captureException(err, { source: "api/marketplace/listings/[id] PATCH", requestId })
    return NextResponse.json({ error: "Failed to update listing", requestId }, { status: 500 })
  }
}

/**
 * DELETE /api/marketplace/listings/[id]
 * Owner-scoped delete. Caller must be a member of the listing's workspace.
 * Delegates to `@/lib/marketplace/listings.deleteListing` when available; falls
 * back to a tolerant, workspace-scoped direct delete otherwise.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { listing, notProvisioned } = await loadListing(supabase, id)
    if (notProvisioned || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }
    if (!(await isWorkspaceMember(supabase, listing.workspace_id, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let deleteListing:
      | ((
          supabase: Awaited<ReturnType<typeof createClient>>,
          id: string
        ) => Promise<unknown>)
      | undefined
    try {
      const mod = (await loadListingsModule()) as {
        deleteListing?: typeof deleteListing
      } | null
      deleteListing = mod?.deleteListing
    } catch {
      deleteListing = undefined
    }

    if (typeof deleteListing === "function") {
      try {
        await deleteListing(supabase, id)
        return NextResponse.json({ success: true })
      } catch (err) {
        const code = (err as { code?: string } | null)?.code
        if (code && NOT_PROVISIONED.has(code)) {
          return NextResponse.json({ error: "Marketplace is not ready yet." }, { status: 503 })
        }
        throw err
      }
    }

    const { error } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", id)
      .eq("workspace_id", listing.workspace_id)

    if (error) {
      if (NOT_PROVISIONED.has(error.code ?? "")) {
        return NextResponse.json({ error: "Marketplace is not ready yet." }, { status: 503 })
      }
      throw error
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    captureException(err, { source: "api/marketplace/listings/[id] DELETE", requestId })
    return NextResponse.json({ error: "Failed to delete listing", requestId }, { status: 500 })
  }
}
