import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { gateSupplierWorkspace } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  listConnections,
  inviteSupplier,
  acceptConnection,
  setConnectionStatus,
  endConnection,
  getConnection,
  type ConnectionStatus,
} from "@/lib/supplier/connections"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Verify the caller is a member of `workspaceId` (the V1 operator/membership table). */
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
 * GET /api/supplier/connections?workspaceId=...&side=operator|supplier
 * Lists connections where `workspaceId` is the given side. Caller must be a
 * member of `workspaceId`.
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
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }
    if (side !== "operator" && side !== "supplier") {
      return NextResponse.json({ error: "side must be 'operator' or 'supplier'" }, { status: 400 })
    }
    if (!(await isWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listConnections(supabase, workspaceId, side)
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/connections GET", requestId })
    return NextResponse.json({ error: "Failed to load connections", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier/connections
 * Operator invites a supplier workspace.
 * Body: { operatorWorkspaceId, supplierWorkspaceId }
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
    if (!operatorWorkspaceId || !supplierWorkspaceId) {
      return NextResponse.json(
        { error: "operatorWorkspaceId and supplierWorkspaceId are required" },
        { status: 400 }
      )
    }
    if (operatorWorkspaceId === supplierWorkspaceId) {
      return NextResponse.json({ error: "A workspace cannot connect to itself" }, { status: 400 })
    }

    // Membership FIRST — never reveal gate/plan details to non-members.
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
      const connection = await inviteSupplier(supabase, {
        operatorWorkspaceId,
        supplierWorkspaceId,
        invitedBy: user.id,
      })
      return NextResponse.json({ connection }, { status: 201 })
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      if (code === "42P01" || code === "PGRST205") {
        return NextResponse.json({ error: "Supplier connections are not ready yet." }, { status: 503 })
      }
      throw err
    }
  } catch (err) {
    captureException(err, { source: "api/supplier/connections POST", requestId })
    return NextResponse.json({ error: "Failed to invite supplier", requestId }, { status: 500 })
  }
}

/**
 * PATCH /api/supplier/connections
 * Change a connection's status. Body: { connectionId, action }
 *   action 'accept' → supplier accepts (supplier-side membership required)
 *   action 'pause' | 'resume' | 'end' → either side
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
    const connectionId = typeof body.connectionId === "string" ? body.connectionId.trim() : ""
    const action = typeof body.action === "string" ? body.action.trim() : ""
    if (!connectionId || !action) {
      return NextResponse.json({ error: "connectionId and action are required" }, { status: 400 })
    }

    const connection = await getConnection(supabase, connectionId)
    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const isOperator = await isWorkspaceMember(supabase, connection.operator_workspace_id, user.id)
    const isSupplier = await isWorkspaceMember(supabase, connection.supplier_workspace_id, user.id)
    if (!isOperator && !isSupplier) {
      return NextResponse.json({ error: "Not a member of this connection" }, { status: 403 })
    }

    let updated
    switch (action) {
      case "accept":
        if (!isSupplier) {
          return NextResponse.json(
            { error: "Only the supplier workspace can accept an invite" },
            { status: 403 }
          )
        }
        updated = await acceptConnection(supabase, connectionId)
        break
      case "pause":
        updated = await setConnectionStatus(supabase, connectionId, "paused" as ConnectionStatus)
        break
      case "resume":
        updated = await setConnectionStatus(supabase, connectionId, "active" as ConnectionStatus)
        break
      case "end":
        updated = await endConnection(supabase, connectionId)
        break
      default:
        return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 })
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Connection could not be updated (already in a terminal state?)" },
        { status: 409 }
      )
    }
    return NextResponse.json({ connection: updated })
  } catch (err) {
    captureException(err, { source: "api/supplier/connections PATCH", requestId })
    return NextResponse.json({ error: "Failed to update connection", requestId }, { status: 500 })
  }
}
