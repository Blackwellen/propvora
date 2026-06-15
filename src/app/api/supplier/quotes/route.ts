import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { gateSupplierWorkspace } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { listQuotes, requestQuote, type QuoteStatus } from "@/lib/supplier/quotes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
 * GET /api/supplier/quotes?workspaceId=...&side=operator|supplier&status=...
 * Lists quotes where `workspaceId` is the given side. Caller must be a member of
 * `workspaceId`. A supplier sees only quotes addressed to it; an operator only
 * its own.
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
    const side = (url.searchParams.get("side") ?? "operator").trim()
    const status = (url.searchParams.get("status") ?? "").trim()
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }
    if (side !== "operator" && side !== "supplier") {
      return NextResponse.json({ error: "side must be 'operator' or 'supplier'" }, { status: 400 })
    }
    if (!(await isWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listQuotes(
      supabase,
      workspaceId,
      side,
      status ? { status: status as QuoteStatus } : undefined
    )
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/quotes GET", requestId })
    return NextResponse.json({ error: "Failed to load quotes", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier/quotes
 * Operator requests a quote from a supplier workspace.
 * Body: { operatorWorkspaceId, supplierWorkspaceId, title, description?,
 *         propertyId?, jobId?, serviceId?, currency?, validUntil? }
 * Gated by operator membership + gateSupplierWorkspace.
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
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }

    const operatorWorkspaceId =
      typeof body.operatorWorkspaceId === "string" ? body.operatorWorkspaceId.trim() : ""
    const supplierWorkspaceId =
      typeof body.supplierWorkspaceId === "string" ? body.supplierWorkspaceId.trim() : ""
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!operatorWorkspaceId || !supplierWorkspaceId) {
      return NextResponse.json(
        { error: "operatorWorkspaceId and supplierWorkspaceId are required" },
        { status: 400 }
      )
    }
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    if (!(await isWorkspaceMember(supabase, operatorWorkspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const gate = await gateSupplierWorkspace(supabase, operatorWorkspaceId)
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.reason, upgrade: true, tier: gate.tier },
        { status: gate.status ?? 402 }
      )
    }

    try {
      const quote = await requestQuote(supabase, {
        operatorWorkspaceId,
        supplierWorkspaceId,
        title,
        description: typeof body.description === "string" ? body.description : null,
        propertyId: typeof body.propertyId === "string" ? body.propertyId : null,
        jobId: typeof body.jobId === "string" ? body.jobId : null,
        serviceId: typeof body.serviceId === "string" ? body.serviceId : null,
        currency: typeof body.currency === "string" ? body.currency : undefined,
        validUntil: typeof body.validUntil === "string" ? body.validUntil : null,
        createdBy: user.id,
      })
      return NextResponse.json({ quote }, { status: 201 })
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      if (code === "42P01" || code === "PGRST205") {
        return NextResponse.json({ error: "Supplier quotes are not ready yet." }, { status: 503 })
      }
      throw err
    }
  } catch (err) {
    captureException(err, { source: "api/supplier/quotes POST", requestId })
    return NextResponse.json({ error: "Failed to request quote", requestId }, { status: 500 })
  }
}
