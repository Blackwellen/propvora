import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { getSupplierJob } from "@/lib/supplier/jobs"
import {
  listDisputes,
  createDispute,
  withdrawDispute,
  type DisputeCategory,
  type DisputeStatus,
} from "@/lib/supplier/disputes"
import { recordJobEvent } from "@/lib/supplier/evidence"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CATEGORIES: DisputeCategory[] = ["payment", "scope", "quality", "access", "other"]

/** GET /api/supplier/disputes?workspaceId=...&status=...&assignmentId=... */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const status = (url.searchParams.get("status") ?? "").trim()
    const assignmentId = (url.searchParams.get("assignmentId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listDisputes(supabase, workspaceId, {
      status: status ? (status as DisputeStatus) : undefined,
      assignmentId: assignmentId || undefined,
    })
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/disputes GET", requestId })
    return NextResponse.json({ error: "Failed to load disputes", requestId }, { status: 500 })
  }
}

/** POST /api/supplier/disputes  Body: { workspaceId, assignmentId, subject, category?, detail? } */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    const assignmentId = typeof body.assignmentId === "string" ? body.assignmentId.trim() : ""
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const category = typeof body.category === "string" ? body.category.trim() : "other"
    const detail = typeof body.detail === "string" ? body.detail : null
    if (!workspaceId || !assignmentId) return NextResponse.json({ error: "workspaceId and assignmentId are required" }, { status: 400 })
    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Confirm the assignment belongs to this supplier workspace.
    const job = await getSupplierJob(supabase, assignmentId)
    if (!job || job.supplier_workspace_id !== workspaceId) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const dispute = await createDispute(supabase, {
      assignmentId,
      operatorWorkspaceId: job.operator_workspace_id,
      supplierWorkspaceId: workspaceId,
      raisedBySide: "supplier",
      raisedBy: user.id,
      category: (CATEGORIES.includes(category as DisputeCategory) ? category : "other") as DisputeCategory,
      subject,
      detail,
    })
    if (!dispute) return NextResponse.json({ error: "Disputes are not ready yet." }, { status: 503 })

    await recordJobEvent(supabase, {
      assignmentId,
      eventType: "dispute",
      note: `Dispute raised: ${subject}`,
      actorUserId: user.id,
      actorSide: "supplier",
      metadata: { dispute_id: dispute.id, category: dispute.category },
    })

    return NextResponse.json({ dispute }, { status: 201 })
  } catch (err) {
    captureException(err, { source: "api/supplier/disputes POST", requestId })
    return NextResponse.json({ error: "Failed to raise dispute", requestId }, { status: 500 })
  }
}

/** PATCH /api/supplier/disputes  Body: { workspaceId, disputeId, action: 'withdraw' } */
export async function PATCH(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    const disputeId = typeof body.disputeId === "string" ? body.disputeId.trim() : ""
    const action = typeof body.action === "string" ? body.action.trim() : ""
    if (!workspaceId || !disputeId) return NextResponse.json({ error: "workspaceId and disputeId are required" }, { status: 400 })
    if (action !== "withdraw") return NextResponse.json({ error: "action must be 'withdraw'" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const dispute = await withdrawDispute(supabase, workspaceId, disputeId)
    if (!dispute) return NextResponse.json({ error: "That dispute can no longer be withdrawn." }, { status: 409 })
    return NextResponse.json({ dispute })
  } catch (err) {
    captureException(err, { source: "api/supplier/disputes PATCH", requestId })
    return NextResponse.json({ error: "Failed to update dispute", requestId }, { status: 500 })
  }
}
