import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  listServices,
  createService,
  updateService,
  deactivateService,
  type SupplierServiceInput,
} from "@/lib/supplier/services"

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

function pickServiceInput(body: Record<string, unknown>): Partial<SupplierServiceInput> {
  const out: Record<string, unknown> = {}
  for (const k of ["name", "category", "description", "pricing_model", "rate_pence", "callout_fee_pence", "active"]) {
    if (k in body) out[k] = body[k]
  }
  return out as Partial<SupplierServiceInput>
}

/** GET /api/supplier/services?workspaceId=...&includeInactive=1 */
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
    const includeInactive = url.searchParams.get("includeInactive") === "1"
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listServices(supabase, workspaceId, { includeInactive })
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/services GET", requestId })
    return NextResponse.json({ error: "Failed to load services", requestId }, { status: 500 })
  }
}

/** POST /api/supplier/services  Body: { workspaceId, name, ... } */
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
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const service = await createService(supabase, workspaceId, {
      ...pickServiceInput(body),
      name,
    } as SupplierServiceInput)
    if (!service) return NextResponse.json({ error: "Services are not ready yet." }, { status: 503 })
    return NextResponse.json({ service }, { status: 201 })
  } catch (err) {
    captureException(err, { source: "api/supplier/services POST", requestId })
    return NextResponse.json({ error: "Failed to create service", requestId }, { status: 500 })
  }
}

/** PATCH /api/supplier/services  Body: { workspaceId, serviceId, ...patch } */
export async function PATCH(request: Request) {
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
    const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : ""
    if (!workspaceId || !serviceId) {
      return NextResponse.json({ error: "workspaceId and serviceId are required" }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const service = await updateService(supabase, workspaceId, serviceId, pickServiceInput(body))
    return NextResponse.json({ service })
  } catch (err) {
    captureException(err, { source: "api/supplier/services PATCH", requestId })
    return NextResponse.json({ error: "Failed to update service", requestId }, { status: 500 })
  }
}

/** DELETE /api/supplier/services?workspaceId=...&serviceId=...  (soft deactivate) */
export async function DELETE(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const serviceId = (url.searchParams.get("serviceId") ?? "").trim()
    if (!workspaceId || !serviceId) {
      return NextResponse.json({ error: "workspaceId and serviceId are required" }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const service = await deactivateService(supabase, workspaceId, serviceId)
    return NextResponse.json({ service })
  } catch (err) {
    captureException(err, { source: "api/supplier/services DELETE", requestId })
    return NextResponse.json({ error: "Failed to deactivate service", requestId }, { status: 500 })
  }
}
