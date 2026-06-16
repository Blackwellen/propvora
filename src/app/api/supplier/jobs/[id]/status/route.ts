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
import { recordJobEvent } from "@/lib/supplier/evidence"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   PATCH /api/supplier/jobs/[id]/status
   Body: { to: 'accepted' | 'in_progress' | 'completed' | 'cancelled' }

   Drives a supplier_job_assignment through the REAL state machine in
   src/lib/supplier/jobs.ts. This is a thin, honest wrapper:
     • 'accepted' / 'in_progress' / 'cancelled' → transitionJob (status-guarded)
     • 'completed'                              → completeJob (stamps completed_at)
   Nothing is ever marked complete/closed without a successful guarded write.

   Membership: the caller must belong to EITHER the operator or supplier
   workspace on the job; forward progression (accept/start/complete) is the
   supplier's, cancellation may come from either side. RLS is the real boundary;
   this mirrors the side rules of the sibling `[id]` PATCH so both stay aligned.
   42P01/PGRST205-tolerant via the lib (surfaces as 503).
─────────────────────────────────────────────────────────────────────────── */

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
    const to = typeof body.to === "string" ? (body.to.trim() as JobStatus) : ""
    const allowed: JobStatus[] = ["accepted", "in_progress", "completed", "cancelled"]
    if (!to || !allowed.includes(to as JobStatus)) {
      return NextResponse.json(
        { error: "to must be one of 'accepted', 'in_progress', 'completed', 'cancelled'" },
        { status: 400 }
      )
    }

    const job = await getSupplierJob(supabase, id)
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    const isOperator = await isWorkspaceMember(supabase, job.operator_workspace_id, user.id)
    const isSupplier = await isWorkspaceMember(supabase, job.supplier_workspace_id, user.id)
    if (!isOperator && !isSupplier) {
      // Don't leak existence to non-members.
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Side authorisation: forward progression is the supplier's; either side may cancel.
    if ((to === "accepted" || to === "in_progress" || to === "completed") && !isSupplier) {
      return NextResponse.json(
        { error: "Only the supplier may accept, start or complete a job" },
        { status: 403 }
      )
    }

    const result =
      to === "completed"
        ? await completeJob(supabase, id)
        : await transitionJob(supabase, id, to, {
            scheduledFor: typeof body.scheduledFor === "string" ? body.scheduledFor : undefined,
          })

    if (!result.ok) return transitionFailure(result)

    // Append a real audit event for the transition (best-effort; never blocks
    // the response if the events table isn't provisioned).
    await recordJobEvent(supabase, {
      assignmentId: id,
      eventType: "status",
      fromStatus: job.status,
      toStatus: to,
      actorUserId: user.id,
      actorSide: isSupplier ? "supplier" : "operator",
    })

    return NextResponse.json({ job: result.job })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/[id]/status PATCH", requestId })
    return NextResponse.json({ error: "Failed to update job status", requestId }, { status: 500 })
  }
}
