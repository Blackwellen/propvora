import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  getAvailability,
  setWeeklyAvailability,
  addDateOverride,
  type WeeklySlot,
  type DateOverrideInput,
} from "@/lib/supplier/availability"

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

/** GET /api/supplier/availability?workspaceId=... */
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

    const items = await getAvailability(supabase, workspaceId)
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/availability GET", requestId })
    return NextResponse.json({ error: "Failed to load availability", requestId }, { status: 500 })
  }
}

/**
 * PUT /api/supplier/availability
 * Body: { workspaceId, slots: WeeklySlot[] }  — replaces the weekly rules.
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
    if (!Array.isArray(body.slots)) {
      return NextResponse.json({ error: "slots must be an array" }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const slots: WeeklySlot[] = []
    for (const raw of body.slots as unknown[]) {
      if (!raw || typeof raw !== "object") continue
      const s = raw as Record<string, unknown>
      if (typeof s.weekday !== "number" || s.weekday < 0 || s.weekday > 6) continue
      slots.push({
        weekday: s.weekday,
        starts_at: typeof s.starts_at === "string" ? s.starts_at : null,
        ends_at: typeof s.ends_at === "string" ? s.ends_at : null,
        is_available: typeof s.is_available === "boolean" ? s.is_available : true,
        note: typeof s.note === "string" ? s.note : null,
      })
    }

    const items = await setWeeklyAvailability(supabase, workspaceId, slots)
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/availability PUT", requestId })
    return NextResponse.json({ error: "Failed to save availability", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier/availability
 * Body: { workspaceId, override: DateOverrideInput } — add/replace a single-date override.
 */
export async function POST(request: Request) {
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
    const o = (body.override ?? {}) as Record<string, unknown>
    const date = typeof o.date === "string" ? o.date.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!date) return NextResponse.json({ error: "override.date is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const override: DateOverrideInput = {
      date,
      is_available: typeof o.is_available === "boolean" ? o.is_available : false,
      starts_at: typeof o.starts_at === "string" ? o.starts_at : null,
      ends_at: typeof o.ends_at === "string" ? o.ends_at : null,
      note: typeof o.note === "string" ? o.note : null,
    }
    const row = await addDateOverride(supabase, workspaceId, override)
    return NextResponse.json({ override: row })
  } catch (err) {
    captureException(err, { source: "api/supplier/availability POST", requestId })
    return NextResponse.json({ error: "Failed to save override", requestId }, { status: 500 })
  }
}
