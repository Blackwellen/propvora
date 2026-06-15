import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  resolveWorkspaceId,
  isMember,
  loadIdentityFn,
  type SupabaseServer,
} from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/identity/status?workspaceId=...

   Returns the CURRENT verification status for the workspace plus any checks
   and recorded supporting documents, for the UI to render + poll. The data
   layer is sibling-owned and imported dynamically; when it isn't wired we
   return `{ notReady: true }` (HTTP 200) so the page shows a calm
   "connecting" state rather than an error.

   The status returned here is the SINGLE SOURCE OF TRUTH for the UI — the
   client never asserts "verified" unless this endpoint says so.
─────────────────────────────────────────────────────────────────────────── */

type GetVerification = (
  supabase: SupabaseServer,
  workspaceId: string
) => Promise<{
  id?: string
  status?: string
  provider?: string | null
  checks?: Array<{ type?: string; status?: string; label?: string }> | null
  riskFlags?: string[] | null
  verifiedAt?: string | null
  submittedAt?: string | null
  expiresAt?: string | null
  updatedAt?: string | null
} | null>

type ListDocuments = (
  supabase: SupabaseServer,
  workspaceId: string
) => Promise<Array<Record<string, unknown>>>

type IsWorkspaceVerified = (
  supabase: SupabaseServer,
  workspaceId: string
) => Promise<boolean>

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const explicit = new URL(request.url).searchParams.get("workspaceId")
    const workspaceId = await resolveWorkspaceId(supabase, user.id, explicit)
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found for this user" }, { status: 404 })
    }
    if (!(await isMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const getVerification = await loadIdentityFn<GetVerification>("verification", "getVerification")
    if (!getVerification) {
      // Not provisioned — HTTP 200 with a not-ready flag so the page renders a
      // calm connecting state and can still poll later.
      return NextResponse.json({ notReady: true, workspaceId, status: "not_started" })
    }

    let verification: Awaited<ReturnType<GetVerification>> = null
    try {
      verification = await getVerification(supabase, workspaceId)
    } catch (err) {
      captureException(err, { source: "api/identity/status getVerification", requestId })
      return NextResponse.json({ notReady: true, workspaceId, status: "not_started" })
    }

    // Documents + a definitive verified flag are best-effort enrichers.
    let documents: Array<Record<string, unknown>> = []
    const listDocuments = await loadIdentityFn<ListDocuments>("documents", "listDocuments")
    if (listDocuments) {
      try {
        documents = (await listDocuments(supabase, workspaceId)) ?? []
      } catch {
        documents = []
      }
    }

    let verified = (verification?.status ?? "").toLowerCase() === "verified"
    const isWorkspaceVerified = await loadIdentityFn<IsWorkspaceVerified>(
      "verification",
      "isWorkspaceVerified"
    )
    if (isWorkspaceVerified) {
      try {
        verified = await isWorkspaceVerified(supabase, workspaceId)
      } catch {
        /* keep status-derived value */
      }
    }

    return NextResponse.json({
      workspaceId,
      verificationId: verification?.id ?? null,
      status: verification?.status ?? "not_started",
      provider: verification?.provider ?? null,
      verified,
      checks: verification?.checks ?? [],
      riskFlags: verification?.riskFlags ?? [],
      verifiedAt: verification?.verifiedAt ?? null,
      submittedAt: verification?.submittedAt ?? null,
      expiresAt: verification?.expiresAt ?? null,
      updatedAt: verification?.updatedAt ?? null,
      documents,
    })
  } catch (err) {
    captureException(err, { source: "api/identity/status", requestId })
    return NextResponse.json({ error: "Failed to read status", requestId }, { status: 500 })
  }
}
