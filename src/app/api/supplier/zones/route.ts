import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { listZones, saveZones, type ServiceZoneInput, type LngLat } from "@/lib/supplier/zones"
import { listTeam } from "@/lib/supplier/team"

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

const VALID_SHAPES = new Set(["radius", "postcode", "region", "polygon"])

function coercePolygon(v: unknown): LngLat[] | null {
  if (!Array.isArray(v)) return null
  const out: LngLat[] = []
  for (const pt of v) {
    if (Array.isArray(pt) && pt.length >= 2) {
      const lng = Number(pt[0])
      const lat = Number(pt[1])
      if (Number.isFinite(lng) && Number.isFinite(lat)) out.push([lng, lat])
    }
  }
  return out.length >= 3 ? out : null
}

/** GET /api/supplier/zones?workspaceId=...  → { zones, team } */
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

    const [zones, team] = await Promise.all([
      listZones(supabase, workspaceId),
      listTeam(supabase, workspaceId),
    ])
    return NextResponse.json({
      zones,
      team: team.map((m) => ({ id: m.user_id, name: m.name, email: m.email, role: m.role })),
    })
  } catch (err) {
    captureException(err, { source: "api/supplier/zones GET", requestId })
    return NextResponse.json({ error: "Failed to load zones", requestId }, { status: 500 })
  }
}

/** PUT /api/supplier/zones  Body: { workspaceId, zones: ServiceZoneInput[] } */
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
    if (!Array.isArray(body.zones)) {
      return NextResponse.json({ error: "zones must be an array" }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const zones: ServiceZoneInput[] = []
    for (const raw of body.zones as unknown[]) {
      if (!raw || typeof raw !== "object") continue
      const z = raw as Record<string, unknown>
      const shape_type = typeof z.shape_type === "string" ? z.shape_type : ""
      if (!VALID_SHAPES.has(shape_type)) {
        return NextResponse.json({ error: `Invalid shape_type '${shape_type}'` }, { status: 400 })
      }
      const member_ids = Array.isArray(z.member_ids)
        ? (z.member_ids as unknown[]).filter((m): m is string => typeof m === "string")
        : []
      zones.push({
        name: typeof z.name === "string" && z.name.trim() ? z.name.trim() : "Zone",
        colour: typeof z.colour === "string" ? z.colour : null,
        shape_type: shape_type as ServiceZoneInput["shape_type"],
        centre_lat: typeof z.centre_lat === "number" ? z.centre_lat : null,
        centre_lng: typeof z.centre_lng === "number" ? z.centre_lng : null,
        radius_km: typeof z.radius_km === "number" ? z.radius_km : null,
        value: typeof z.value === "string" ? z.value : null,
        polygon: coercePolygon(z.polygon),
        is_active: z.is_active !== false,
        priority: typeof z.priority === "number" ? z.priority : 0,
        member_ids,
      })
    }

    const saved = await saveZones(supabase, workspaceId, zones)
    return NextResponse.json({ zones: saved })
  } catch (err) {
    captureException(err, { source: "api/supplier/zones PUT", requestId })
    return NextResponse.json({ error: "Failed to save zones", requestId }, { status: 500 })
  }
}
