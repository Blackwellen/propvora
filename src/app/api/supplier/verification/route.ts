import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import {
  getStatusSummary,
  loadVerification,
  isInsuranceExpired,
  isLicenceExpired,
} from "@/lib/supplier-verification"

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
