import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  getSupplierProfile,
  upsertSupplierProfile,
  setSupplierStatus,
  type SupplierProfileInput,
  type SupplierStatus,
} from "@/lib/supplier/profile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Membership check for a supplier WORKSPACE. The owner is bootstrapped into
 * `workspace_members` by the workspaces trigger, and team members live in
 * `supplier_workspace_members` — a caller in EITHER table may manage the
 * workspace. Tolerant: a missing table never throws.
 */
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

const PROFILE_FIELDS: (keyof SupplierProfileInput)[] = [
  "display_name",
  "bio",
  "trades",
  "years_experience",
  "insurance_verified",
  "public_liability_cover_pence",
  "service_radius_km",
  "base_location",
  "latitude",
  "longitude",
  "response_time_hours",
  "accepts_emergency",
  "status",
]

/** GET /api/supplier/profile?workspaceId=... */
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

    const profile = await getSupplierProfile(supabase, workspaceId)
    return NextResponse.json({ profile })
  } catch (err) {
    captureException(err, { source: "api/supplier/profile GET", requestId })
    return NextResponse.json({ error: "Failed to load profile", requestId }, { status: 500 })
  }
}

/**
 * PATCH /api/supplier/profile
 * Body: { workspaceId, ...profileFields }  or  { workspaceId, status }
 */
export async function PATCH(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Status-only shortcut.
    if (typeof body.status === "string" && Object.keys(body).length <= 2) {
      const profile = await setSupplierStatus(supabase, workspaceId, body.status as SupplierStatus)
      return NextResponse.json({ profile })
    }

    const input: SupplierProfileInput = {}
    for (const key of PROFILE_FIELDS) {
      if (key in body) (input as Record<string, unknown>)[key] = body[key]
    }
    const profile = await upsertSupplierProfile(supabase, workspaceId, input)
    return NextResponse.json({ profile })
  } catch (err) {
    captureException(err, { source: "api/supplier/profile PATCH", requestId })
    return NextResponse.json({ error: "Failed to save profile", requestId }, { status: 500 })
  }
}
