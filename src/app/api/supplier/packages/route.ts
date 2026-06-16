import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import {
  listPackages,
  createPackage,
  updatePackage,
  deactivatePackage,
  type SupplierPackageInput,
} from "@/lib/supplier/packages"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function pickInput(body: Record<string, unknown>): Partial<SupplierPackageInput> {
  const out: Record<string, unknown> = {}
  for (const k of ["name", "description", "price_pence", "currency", "duration_days", "inclusions", "exclusions", "active"]) {
    if (k in body) out[k] = body[k]
  }
  return out as Partial<SupplierPackageInput>
}

/** GET /api/supplier/packages?workspaceId=...&includeInactive=1 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const includeInactive = url.searchParams.get("includeInactive") === "1"
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listPackages(supabase, workspaceId, { includeInactive })
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/packages GET", requestId })
    return NextResponse.json({ error: "Failed to load packages", requestId }, { status: 500 })
  }
}

/** POST /api/supplier/packages  Body: { workspaceId, name, ... } */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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

    const pkg = await createPackage(supabase, workspaceId, { ...pickInput(body), name } as SupplierPackageInput)
    if (!pkg) return NextResponse.json({ error: "Packages are not ready yet." }, { status: 503 })
    return NextResponse.json({ package: pkg }, { status: 201 })
  } catch (err) {
    captureException(err, { source: "api/supplier/packages POST", requestId })
    return NextResponse.json({ error: "Failed to create package", requestId }, { status: 500 })
  }
}

/** PATCH /api/supplier/packages  Body: { workspaceId, packageId, ...patch } */
export async function PATCH(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    const packageId = typeof body.packageId === "string" ? body.packageId.trim() : ""
    if (!workspaceId || !packageId) return NextResponse.json({ error: "workspaceId and packageId are required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const pkg = await updatePackage(supabase, workspaceId, packageId, pickInput(body))
    return NextResponse.json({ package: pkg })
  } catch (err) {
    captureException(err, { source: "api/supplier/packages PATCH", requestId })
    return NextResponse.json({ error: "Failed to update package", requestId }, { status: 500 })
  }
}

/** DELETE /api/supplier/packages?workspaceId=...&packageId=...  (soft deactivate) */
export async function DELETE(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const packageId = (url.searchParams.get("packageId") ?? "").trim()
    if (!workspaceId || !packageId) return NextResponse.json({ error: "workspaceId and packageId are required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const pkg = await deactivatePackage(supabase, workspaceId, packageId)
    return NextResponse.json({ package: pkg })
  } catch (err) {
    captureException(err, { source: "api/supplier/packages DELETE", requestId })
    return NextResponse.json({ error: "Failed to deactivate package", requestId }, { status: 500 })
  }
}
