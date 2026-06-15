import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { listCoverage, setCoverage, type CoverageAreaInput } from "@/lib/supplier/coverage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function isSupplierWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    if (data) return true
  } catch {
    /* fall through */
  }
  try {
    const { data } = await supabase
      .from("supplier_workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

const VALID_AREA_TYPES = new Set(["radius", "postcode", "region", "national"])

/** GET /api/supplier/coverage?workspaceId=... */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const workspaceId = (new URL(request.url).searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listCoverage(supabase, workspaceId)
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/coverage GET", requestId })
    return NextResponse.json({ error: "Failed to load coverage", requestId }, { status: 500 })
  }
}

/**
 * PUT /api/supplier/coverage  Body: { workspaceId, areas: CoverageAreaInput[] }
 * Full replace of the supplier's declared coverage set.
 */
export async function PUT(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!Array.isArray(body.areas)) {
      return NextResponse.json({ error: "areas must be an array" }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const areas: CoverageAreaInput[] = []
    for (const raw of body.areas as unknown[]) {
      if (!raw || typeof raw !== "object") continue
      const a = raw as Record<string, unknown>
      const area_type = typeof a.area_type === "string" ? a.area_type : ""
      if (!VALID_AREA_TYPES.has(area_type)) {
        return NextResponse.json({ error: `Invalid area_type '${area_type}'` }, { status: 400 })
      }
      areas.push({
        area_type: area_type as CoverageAreaInput["area_type"],
        value: typeof a.value === "string" ? a.value : null,
        latitude: typeof a.latitude === "number" ? a.latitude : null,
        longitude: typeof a.longitude === "number" ? a.longitude : null,
        radius_km: typeof a.radius_km === "number" ? a.radius_km : null,
      })
    }

    const items = await setCoverage(supabase, workspaceId, areas)
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/coverage PUT", requestId })
    return NextResponse.json({ error: "Failed to save coverage", requestId }, { status: 500 })
  }
}
