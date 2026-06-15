import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  getSupplierJob,
  transitionJob,
  completeJob,
  type JobStatus,
  type TransitionResult,
} from "@/lib/supplier/jobs"

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

/** Map a failed transition reason to an HTTP response. */
function transitionFailure(result: Extract<TransitionResult, { ok: false }>) {
  switch (result.reason) {
    case "not_found":
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    case "not_provisioned":
      return NextResponse.json({ error: "Supplier jobs are not ready yet." }, { status: 503 })
    case "invalid_transition":
    default:
      return NextResponse.json({ error: "Invalid status transition" }, { status: 409 })
  }
}

/**
 * GET /api/supplier/jobs/[id]
 * Visible to a member of EITHER the operator or supplier workspace on the job.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const job = await getSupplierJob(supabase, id)
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    const isOperator = await isWorkspaceMember(supabase, job.operator_workspace_id, user.id)
    const isSupplier = await isWorkspaceMember(supabase, job.supplier_workspace_id, user.id)
    if (!isOperator && !isSupplier) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/[id] GET", requestId })
    return NextResponse.json({ error: "Failed to load job", requestId }, { status: 500 })
  }
}

/**
 * PATCH /api/supplier/jobs/[id]
 * Body: { action, ...payload }
 *   action 'transition' → { to: 'accepted'|'in_progress'|'cancelled', scheduledFor? }
 *   action 'complete'   (supplier) → in_progress → completed
 *
 * Side rules:
 *   - 'accept' / 'start' (in_progress) / 'complete' are supplier actions.
 *   - 'cancel' may be done by either side.
 * Both sides must be members of the corresponding workspace.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }
    const action = typeof body.action === "string" ? body.action.trim() : ""
    if (!action) return NextResponse.json({ error: "action is required" }, { status: 400 })

    const job = await getSupplierJob(supabase, id)
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    const isOperator = await isWorkspaceMember(supabase, job.operator_workspace_id, user.id)
    const isSupplier = await isWorkspaceMember(supabase, job.supplier_workspace_id, user.id)
    if (!isOperator && !isSupplier) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (action === "complete") {
      if (!isSupplier) {
        return NextResponse.json({ error: "Only the supplier may complete a job" }, { status: 403 })
      }
      const result = await completeJob(supabase, id)
      if (!result.ok) return transitionFailure(result)
      return NextResponse.json({ job: result.job })
    }

    if (action === "transition") {
      const to = typeof body.to === "string" ? (body.to.trim() as JobStatus) : ""
      const allowed: JobStatus[] = ["accepted", "in_progress", "cancelled"]
      if (!to || !allowed.includes(to as JobStatus)) {
        return NextResponse.json(
          { error: "to must be one of 'accepted', 'in_progress', 'cancelled'" },
          { status: 400 }
        )
      }
      // Side authorisation: forward progression (accept/start) is the supplier's;
      // cancellation may come from either side.
      if ((to === "accepted" || to === "in_progress") && !isSupplier) {
        return NextResponse.json(
          { error: "Only the supplier may accept or start a job" },
          { status: 403 }
        )
      }
      const result = await transitionJob(supabase, id, to as JobStatus, {
        scheduledFor: typeof body.scheduledFor === "string" ? body.scheduledFor : undefined,
      })
      if (!result.ok) return transitionFailure(result)
      return NextResponse.json({ job: result.job })
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/[id] PATCH", requestId })
    return NextResponse.json({ error: "Failed to update job", requestId }, { status: 500 })
  }
}
