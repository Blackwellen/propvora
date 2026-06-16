import { NextResponse } from "next/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { getAdminIdentity } from "@/lib/admin/guard"
import { decide, acceptEvidence, type AdminDecision } from "@/lib/supplier-verification"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DECISIONS: AdminDecision[] = ["approve", "reject", "more_info", "expired", "suspicious", "blocked"]

const EVIDENCE_TABLES = [
  "supplier_insurance_policies",
  "supplier_licence_verifications",
  "supplier_business_verifications",
  "supplier_identity_documents",
] as const

/**
 * POST /api/admin/supplier-verification
 *
 * Platform-admin decision endpoint. Fail-closed: re-checks admin identity
 * server-side on every call (never relies solely on the layout guard).
 *
 *   { kind: "decision", verificationId, decision, note?, riskFlag? }
 *   { kind: "evidence", table, id, accept (bool), note? }
 *
 * NOTHING auto-decides — the admin supplies the explicit verb. Every decision is
 * written to supplier_verification_events + audit_logs (recordAudit).
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const admin = await getAdminIdentity()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const kind = String(body.kind ?? "decision")

    if (kind === "decision") {
      const verificationId = String(body.verificationId ?? "")
      const decision = String(body.decision ?? "") as AdminDecision
      if (!verificationId) return NextResponse.json({ error: "verificationId is required" }, { status: 400 })
      if (!DECISIONS.includes(decision))
        return NextResponse.json({ error: "Invalid decision" }, { status: 400 })

      const result = await decide({
        verificationId,
        decision,
        adminUserId: admin.userId,
        note: body.note ?? null,
        riskFlag: body.riskFlag ?? undefined,
      })
      if (!result.ok) return NextResponse.json({ error: result.error ?? "Decision failed" }, { status: 400 })
      return NextResponse.json({ ok: true, newStatus: result.newStatus })
    }

    if (kind === "evidence") {
      const table = String(body.table ?? "") as (typeof EVIDENCE_TABLES)[number]
      const id = String(body.id ?? "")
      const accept = Boolean(body.accept)
      if (!EVIDENCE_TABLES.includes(table))
        return NextResponse.json({ error: "Invalid table" }, { status: 400 })
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

      const ok = await acceptEvidence(table, id, admin.userId, accept, body.note ?? null)
      if (!ok) return NextResponse.json({ error: "Evidence update failed" }, { status: 400 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unknown kind" }, { status: 400 })
  } catch (err) {
    captureException(err, { source: "api/admin/supplier-verification", requestId })
    return NextResponse.json({ error: "Request failed", requestId }, { status: 500 })
  }
}
