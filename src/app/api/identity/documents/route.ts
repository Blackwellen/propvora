import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
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
   POST /api/identity/documents

   Records metadata for a supporting verification document. The FILE itself is
   already uploaded to R2 via the existing `/api/upload` route (which validates
   MIME/size, sniffs magic bytes and returns a `{ key }`). Here we only persist
   the metadata row (membership-checked) by delegating to the sibling data
   layer (`@/lib/identity/documents.addVerificationDocument`).

   Body: { workspaceId?, verificationId?, docType, key, name?, contentType?,
           side? }

   No Stripe calls. No file bytes pass through this route.
─────────────────────────────────────────────────────────────────────────── */

const ALLOWED_DOC_TYPES = new Set([
  "passport",
  "driving_licence",
  "national_id",
  "residence_permit",
  "selfie",
  "proof_of_address",
  "insurance",
  "licence",
  "business_registration",
  "other",
])

type AddVerificationDocument = (
  supabase: SupabaseServer,
  args: {
    workspaceId: string
    userId: string
    verificationId?: string | null
    docType: string
    key: string
    name?: string | null
    contentType?: string | null
    side?: string | null
  }
) => Promise<Record<string, unknown>>

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

    const explicit = typeof body.workspaceId === "string" ? body.workspaceId : null
    const workspaceId = await resolveWorkspaceId(supabase, user.id, explicit)
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found for this user" }, { status: 404 })
    }
    if (!(await isMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const docType = String(body.docType ?? "").trim()
    const key = String(body.key ?? "").trim()
    if (!docType || !ALLOWED_DOC_TYPES.has(docType)) {
      return NextResponse.json({ error: "A valid docType is required" }, { status: 400 })
    }
    if (!key) {
      return NextResponse.json({ error: "key is required (upload the file via /api/upload first)" }, { status: 400 })
    }
    // The key must belong to this workspace's namespace — `/api/upload` builds
    // keys as `<workspaceId>/<folder>/<file>`. Enforce that prefix so a caller
    // can't attach an object from another workspace.
    if (!key.startsWith(`${workspaceId}/`)) {
      return NextResponse.json({ error: "key does not belong to this workspace" }, { status: 400 })
    }

    const addVerificationDocument = await loadIdentityFn<AddVerificationDocument>(
      "documents",
      "addVerificationDocument"
    )
    if (!addVerificationDocument) {
      return NextResponse.json(
        { error: "Identity verification is not provisioned yet.", notReady: true },
        { status: 503 }
      )
    }

    let record: Record<string, unknown>
    try {
      record = await addVerificationDocument(supabase, {
        workspaceId,
        userId: user.id,
        verificationId: typeof body.verificationId === "string" ? body.verificationId : null,
        docType,
        key,
        name: typeof body.name === "string" ? body.name : null,
        contentType: typeof body.contentType === "string" ? body.contentType : null,
        side: typeof body.side === "string" ? body.side : null,
      })
    } catch (err) {
      captureException(err, { source: "api/identity/documents add", requestId })
      return NextResponse.json({ error: "Could not record document.", requestId }, { status: 502 })
    }

    // Audit the metadata write (the upload itself was audited by /api/upload).
    try {
      await recordAudit(supabase, {
        workspaceId,
        userId: user.id,
        action: AUDIT_ACTIONS.FILE_UPLOADED,
        resourceType: "verification_document",
        resourceId: key,
        metadata: { docType, key },
      })
    } catch {
      /* audit is best-effort */
    }

    return NextResponse.json({ document: record })
  } catch (err) {
    captureException(err, { source: "api/identity/documents", requestId })
    return NextResponse.json({ error: "Failed to record document", requestId }, { status: 500 })
  }
}
