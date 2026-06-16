import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { getSupplierJob } from "@/lib/supplier/jobs"
import {
  listEvidence,
  addEvidence,
  removeEvidence,
  recordJobEvent,
  type EvidencePhase,
} from "@/lib/supplier/evidence"
import { fileViewUrl } from "@/lib/r2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PHASES: EvidencePhase[] = ["before", "during", "after"]

async function isMember(
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

/** GET /api/supplier/jobs/[id]/evidence — before/during/after evidence. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const job = await getSupplierJob(supabase, id)
    if (!job) return NextResponse.json({ items: [] })
    const operator = await isMember(supabase, job.operator_workspace_id, user.id)
    const supplier = await isSupplierWorkspaceMember(supabase, job.supplier_workspace_id, user.id)
    if (!operator && !supplier) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    const rows = await listEvidence(supabase, id)
    const items = rows.map((r) => ({ ...r, url: fileViewUrl(r.r2_key) }))
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/[id]/evidence GET", requestId })
    return NextResponse.json({ error: "Failed to load evidence", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier/jobs/[id]/evidence
 * Body: { phase, r2Key, fileName?, contentType?, sizeBytes?, caption? }
 * Records evidence already uploaded to R2 via /api/upload. Supplier-side only.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const phase = typeof body.phase === "string" ? body.phase.trim() : "during"
    const r2Key = typeof body.r2Key === "string" ? body.r2Key.trim() : ""
    if (!PHASES.includes(phase as EvidencePhase)) {
      return NextResponse.json({ error: "phase must be 'before', 'during' or 'after'" }, { status: 400 })
    }
    if (!r2Key) return NextResponse.json({ error: "r2Key is required" }, { status: 400 })

    const job = await getSupplierJob(supabase, id)
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })
    if (!(await isSupplierWorkspaceMember(supabase, job.supplier_workspace_id, user.id))) {
      return NextResponse.json({ error: "Only the supplier may add evidence" }, { status: 403 })
    }

    const evidence = await addEvidence(supabase, {
      assignmentId: id,
      supplierWorkspaceId: job.supplier_workspace_id,
      phase: phase as EvidencePhase,
      r2Key,
      fileName: typeof body.fileName === "string" ? body.fileName : null,
      contentType: typeof body.contentType === "string" ? body.contentType : null,
      sizeBytes: typeof body.sizeBytes === "number" ? body.sizeBytes : null,
      caption: typeof body.caption === "string" ? body.caption : null,
      uploadedBy: user.id,
    })
    if (!evidence) return NextResponse.json({ error: "Evidence is not ready yet." }, { status: 503 })

    await recordJobEvent(supabase, {
      assignmentId: id,
      eventType: "evidence",
      note: `${phase} evidence added${evidence.file_name ? `: ${evidence.file_name}` : ""}`,
      actorUserId: user.id,
      actorSide: "supplier",
      metadata: { evidence_id: evidence.id, phase },
    })

    return NextResponse.json({ evidence: { ...evidence, url: fileViewUrl(evidence.r2_key) } }, { status: 201 })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/[id]/evidence POST", requestId })
    return NextResponse.json({ error: "Failed to add evidence", requestId }, { status: 500 })
  }
}

/** DELETE /api/supplier/jobs/[id]/evidence?evidenceId=... (soft delete, supplier-side). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const evidenceId = (url.searchParams.get("evidenceId") ?? "").trim()
    if (!evidenceId) return NextResponse.json({ error: "evidenceId is required" }, { status: 400 })

    const job = await getSupplierJob(supabase, id)
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })
    if (!(await isSupplierWorkspaceMember(supabase, job.supplier_workspace_id, user.id))) {
      return NextResponse.json({ error: "Only the supplier may remove evidence" }, { status: 403 })
    }

    const ok = await removeEvidence(supabase, job.supplier_workspace_id, evidenceId)
    if (!ok) return NextResponse.json({ error: "Could not remove evidence." }, { status: 409 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/[id]/evidence DELETE", requestId })
    return NextResponse.json({ error: "Failed to remove evidence", requestId }, { status: 500 })
  }
}
