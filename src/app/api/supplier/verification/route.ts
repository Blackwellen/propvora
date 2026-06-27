import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import {
  getStatusSummary,
  loadVerification,
  isInsuranceExpired,
  isLicenceExpired,
  ensureVerification,
  recordInsurance,
  recordDocument,
  type InsuranceType,
  type SupplierDocType,
} from "@/lib/supplier-verification"

const INSURANCE_TYPES: InsuranceType[] = [
  "public_liability", "employers_liability", "professional_indemnity", "contractors_all_risk", "other",
]
const DOC_TYPES: SupplierDocType[] = [
  "passport", "driving_licence", "national_id", "proof_of_address", "other",
]

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/supplier/verification?workspaceId=...
 *
 * Consumes the canonical supplier-verification stack (src/lib/supplier-verification)
 * via the service-role admin client behind a membership gate. Returns:
 *   • summary  — level / label / badges / check statuses / expiry flags (honest,
 *                evidence-reviewed wording only).
 *   • insurance / licences — the actual evidence rows (masked numbers only) with
 *     a derived `expired` flag so the UI can show expiry without re-deriving it.
 *
 * Read-only: this route never mutates verification state (decisions are admin-only
 * and audited elsewhere). 42P01-tolerant via the lib (degrades to an empty L0).
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const [summary, loaded] = await Promise.all([
      getStatusSummary(workspaceId),
      loadVerification(workspaceId),
    ])

    const insurance = loaded.insurance.map((p) => ({
      id: p.id,
      insurance_type: p.insurance_type,
      provider: p.provider,
      policy_number_masked: p.policy_number_masked,
      coverage_amount_pence: p.coverage_amount_pence,
      valid_from: p.valid_from,
      valid_to: p.valid_to,
      minimum_cover_met: p.minimum_cover_met,
      status: p.status,
      expired: isInsuranceExpired(p),
    }))
    const licences = loaded.licences.map((l) => ({
      id: l.id,
      licence_type: l.licence_type,
      issuing_body: l.issuing_body,
      licence_number_masked: l.licence_number_masked,
      country: l.country,
      region: l.region,
      valid_from: l.valid_from,
      valid_to: l.valid_to,
      required_for_categories: l.required_for_categories,
      status: l.status,
      expired: isLicenceExpired(l),
    }))

    return NextResponse.json({ summary, insurance, licences })
  } catch (err) {
    captureException(err, { source: "api/supplier/verification GET", requestId })
    return NextResponse.json({ error: "Failed to load verification", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier/verification
 * Body: { workspaceId, kind: "insurance" | "document", ...fields }
 *
 * Records an uploaded evidence row (status "uploaded", awaiting admin review).
 * Nothing here auto-approves — verification level is recomputed from evidence by
 * the admin review flow. The file must already be uploaded to R2 (pass its key).
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })

    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    const kind = typeof body.kind === "string" ? body.kind.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const verification = await ensureVerification(workspaceId, user.id)
    if (!verification) {
      return NextResponse.json({ error: "Verification is not ready yet." }, { status: 503 })
    }

    if (kind === "insurance") {
      const insuranceType = typeof body.insuranceType === "string" && INSURANCE_TYPES.includes(body.insuranceType as InsuranceType)
        ? (body.insuranceType as InsuranceType)
        : "public_liability"
      const result = await recordInsurance({
        verificationId: verification.id,
        supplierWorkspaceId: workspaceId,
        insuranceType,
        provider: typeof body.provider === "string" ? body.provider : null,
        policyNumber: typeof body.policyNumber === "string" ? body.policyNumber : null,
        coverageAmountPence: typeof body.coverageAmountPence === "number" ? body.coverageAmountPence : null,
        validFrom: typeof body.validFrom === "string" ? body.validFrom : null,
        validTo: typeof body.validTo === "string" ? body.validTo : null,
        r2Key: typeof body.r2Key === "string" ? body.r2Key : null,
      })
      if (!result) return NextResponse.json({ error: "Could not save the policy." }, { status: 503 })
      return NextResponse.json({ id: result.id, status: "uploaded" }, { status: 201 })
    }

    if (kind === "document") {
      const docType = typeof body.docType === "string" && DOC_TYPES.includes(body.docType as SupplierDocType)
        ? (body.docType as SupplierDocType)
        : "other"
      const result = await recordDocument({
        verificationId: verification.id,
        supplierWorkspaceId: workspaceId,
        docType,
        documentCountry: typeof body.documentCountry === "string" ? body.documentCountry : null,
        documentNumber: typeof body.documentNumber === "string" ? body.documentNumber : null,
        expiryDate: typeof body.expiryDate === "string" ? body.expiryDate : null,
        nameOnDocument: typeof body.nameOnDocument === "string" ? body.nameOnDocument : null,
        r2KeyFront: typeof body.r2Key === "string" ? body.r2Key : null,
      })
      if (!result) return NextResponse.json({ error: "Could not save the document." }, { status: 503 })
      return NextResponse.json({ id: result.id, status: "uploaded" }, { status: 201 })
    }

    return NextResponse.json({ error: "kind must be 'insurance' or 'document'" }, { status: 400 })
  } catch (err) {
    captureException(err, { source: "api/supplier/verification POST", requestId })
    return NextResponse.json({ error: "Failed to submit verification", requestId }, { status: 500 })
  }
}
