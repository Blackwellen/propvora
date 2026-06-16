import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { getSupplierJob } from "@/lib/supplier/jobs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/supplier/jobs/[id]/events

   Returns an honest status timeline for a supplier_job_assignment. There is no
   dedicated job-events table in the live schema, so the timeline is DERIVED
   from the assignment row's own timestamps/status — every entry corresponds to
   a real recorded fact (created_at, scheduled_for, completed_at) and nothing is
   invented. If/when an events table is provisioned this route can be extended
   to merge real rows; until then it degrades to the derived view (and to an
   empty list if the assignments table itself is absent).

   Visible to a member of EITHER the operator or supplier workspace on the job.
─────────────────────────────────────────────────────────────────────────── */

interface JobEvent {
  id: string
  status: string
  note?: string
  created_at: string
}

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
    if (!job) {
      // Table absent or row not visible — return an empty, provisioned timeline.
      return NextResponse.json({ events: [] })
    }

    const isOperator = await isWorkspaceMember(supabase, job.operator_workspace_id, user.id)
    const isSupplier = await isWorkspaceMember(supabase, job.supplier_workspace_id, user.id)
    if (!isOperator && !isSupplier) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Build the derived timeline from real, recorded timestamps only.
    const events: JobEvent[] = []
    if (job.created_at) {
      events.push({
        id: `${job.id}:assigned`,
        status: "assigned",
        note: "Job assigned to your workspace.",
        created_at: job.created_at,
      })
    }
    if (job.scheduled_for) {
      events.push({
        id: `${job.id}:scheduled`,
        status: "scheduled",
        note: "Scheduled.",
        created_at: job.scheduled_for,
      })
    }
    // Reflect the current lifecycle status when it has progressed past 'assigned'.
    // updated_at is when that status was last written.
    if (job.status && job.status !== "assigned" && job.updated_at) {
      events.push({
        id: `${job.id}:${job.status}`,
        status: job.status,
        created_at: job.updated_at,
      })
    }
    if (job.completed_at) {
      events.push({
        id: `${job.id}:completed`,
        status: "completed",
        note: "Work marked complete.",
        created_at: job.completed_at,
      })
    }

    // Newest first, de-duplicated by id (e.g. status === completed already covered).
    const seen = new Set<string>()
    const ordered = events
      .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ events: ordered })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/[id]/events GET", requestId })
    return NextResponse.json({ error: "Failed to load job events", requestId }, { status: 500 })
  }
}
