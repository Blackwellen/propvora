import { NextResponse } from "next/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  ensureVerification,
  recordDocument,
  listDocuments,
  type SupplierDocType,
} from "@/lib/supplier-verification"
import { requireSupplierMember } from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DOC_TYPES: SupplierDocType[] = [
  "passport",
  "driving_licence",
  "national_id",
  "proof_of_address",
  "other",
]

/**
 * GET /api/supplier-verification/documents?workspaceId=...
 * Lists the supplier's uploaded ID documents (masked numbers only; r2 keys are
 * not surfaced raw — the admin detail view resolves authed URLs).
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? ""
    const auth = await requireSupplierMember(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const rec = await ensureVerification(workspaceId, auth.userId)
    if (!rec) return NextResponse.json({ documents: [] })
    const docs = await listDocuments(rec.id)
    // Surface only non-sensitive fields (no raw r2 keys to the supplier client).
    return NextResponse.json({
      documents: docs.map((d) => ({
        id: d.id,
        docType: d.doc_type,
        documentCountry: d.document_country,
        documentNumberMasked: d.document_number_masked,
        expiryDate: d.expiry_date,
        nameOnDocument: d.name_on_document,
        ocrStatus: d.ocr_status,
        status: d.status,
        hasFront: Boolean(d.r2_key_front),
        hasBack: Boolean(d.r2_key_back),
        hasSelfie: Boolean(d.r2_key_selfie),
        createdAt: d.created_at,
      })),
    })
  } catch (err) {
    captureException(err, { source: "api/supplier-verification/documents:GET", requestId })
    return NextResponse.json({ error: "Failed to load documents", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier-verification/documents
 * Body: { workspaceId, docType, documentCountry?, documentNumber?, expiryDate?,
 *         nameOnDocument?, r2KeyFront?, r2KeyBack?, r2KeySelfie? }
 *
 * Records an uploaded ID document. Files must already be in R2 (via /api/upload);
 * this stores the keys + a MASKED number. Status is 'uploaded' (awaiting review)
 * and ocr_status is 'manual_required' — nothing auto-approves.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const body = await request.json().catch(() => ({}))
    const workspaceId = String(body.workspaceId ?? "")
    const auth = await requireSupplierMember(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const docType = String(body.docType ?? "") as SupplierDocType
    if (!DOC_TYPES.includes(docType)) {
      return NextResponse.json({ error: "Invalid docType" }, { status: 400 })
    }

    const rec = await ensureVerification(workspaceId, auth.userId)
    if (!rec) return NextResponse.json({ error: "Could not start verification" }, { status: 500 })

    const created = await recordDocument({
      verificationId: rec.id,
      supplierWorkspaceId: workspaceId,
      docType,
      documentCountry: body.documentCountry ?? null,
      documentNumber: body.documentNumber ?? null, // masked before storage
      expiryDate: body.expiryDate ?? null,
      nameOnDocument: body.nameOnDocument ?? null,
      r2KeyFront: body.r2KeyFront ?? null,
      r2KeyBack: body.r2KeyBack ?? null,
      r2KeySelfie: body.r2KeySelfie ?? null,
    })
    if (!created) return NextResponse.json({ error: "Could not record document" }, { status: 500 })

    return NextResponse.json({ id: created.id })
  } catch (err) {
    captureException(err, { source: "api/supplier-verification/documents:POST", requestId })
    return NextResponse.json({ error: "Failed to record document", requestId }, { status: 500 })
  }
}
