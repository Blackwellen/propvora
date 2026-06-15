import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { gateMarketplacePublishing } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Postgres / PostgREST codes meaning "table not provisioned yet". */
const NOT_PROVISIONED = new Set(["42P01", "PGRST205"])

/**
 * Dynamically load the sibling-owned listings data layer. The module is owned by
 * another agent and may not exist yet on this branch — the `@ts-ignore` tolerates
 * its absence at compile time, while the try/catch tolerates it at runtime. Once
 * the module exists the bundler resolves and includes it normally.
 */
async function loadListingsModule(): Promise<Record<string, unknown> | null> {
  try {
    // @ts-ignore — module is provided by a sibling agent; may be absent here.
    return (await import("@/lib/marketplace/listings")) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Verify the caller is an accepted member of `workspaceId`. */
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

/**
 * GET /api/marketplace/listings?workspaceId=...
 * Lists the CALLER's OWN workspace listings (ALL statuses) — strictly
 * owner-scoped. The caller must be a member of `workspaceId`.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }

    if (!(await isWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) {
      if (NOT_PROVISIONED.has(error.code ?? "")) {
        return NextResponse.json({ items: [] })
      }
      throw error
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    captureException(err, { source: "api/marketplace/listings GET", requestId })
    return NextResponse.json({ error: "Failed to load listings", requestId }, { status: 500 })
  }
}

/**
 * POST /api/marketplace/listings
 * Create a listing in the caller's workspace. Gated by `gateMarketplacePublishing`
 * (entitlement) and workspace membership. Delegates creation to
 * `@/lib/marketplace/listings` (dynamic import); if that module/table is not yet
 * present, responds 503 "marketplace not ready" rather than throwing.
 *
 * Body: { workspaceId: string, ...listing fields }
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as
      | (Record<string, unknown> & { workspaceId?: unknown })
      | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }

    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }

    // Membership FIRST — never reveal gate/plan details to non-members.
    if (!(await isWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Entitlement gate for publishing/creating marketplace listings.
    const gate = await gateMarketplacePublishing(supabase, workspaceId)
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.reason, upgrade: true, tier: gate.tier },
        { status: gate.status ?? 402 }
      )
    }

    // Delegate creation to the listings data layer (owned by a sibling agent).
    // Import defensively: the module may not exist yet in this branch.
    let createListing:
      | ((
          supabase: Awaited<ReturnType<typeof createClient>>,
          input: Record<string, unknown>
        ) => Promise<unknown>)
      | undefined
    try {
      const mod = (await loadListingsModule()) as {
        createListing?: typeof createListing
      } | null
      createListing = mod?.createListing
    } catch {
      createListing = undefined
    }

    if (typeof createListing !== "function") {
      return NextResponse.json(
        { error: "Marketplace is not ready yet. Listing creation is unavailable." },
        { status: 503 }
      )
    }

    try {
      const created = await createListing(supabase, {
        ...body,
        workspaceId,
        createdBy: user.id,
      })
      return NextResponse.json({ listing: created }, { status: 201 })
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      if (code && NOT_PROVISIONED.has(code)) {
        return NextResponse.json(
          { error: "Marketplace is not ready yet. Listing creation is unavailable." },
          { status: 503 }
        )
      }
      throw err
    }
  } catch (err) {
    captureException(err, { source: "api/marketplace/listings POST", requestId })
    return NextResponse.json({ error: "Failed to create listing", requestId }, { status: 500 })
  }
}
