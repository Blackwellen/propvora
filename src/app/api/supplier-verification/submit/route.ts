import { NextResponse } from "next/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  ensureVerification,
  markContactStep,
  syncPayoutVerified,
  recordInsurance,
  recordLicence,
  recordEvent,
  getStatusSummary,
  type InsuranceType,
} from "@/lib/supplier-verification"
import { requireSupplierMember } from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/supplier-verification/submit
 *
 * One endpoint for the supplier-facing verification centre to advance steps:
 *   action: "confirm_email" | "confirm_phone" | "sync_payout"
 *           | "add_insurance" | "add_licence" | "submit_for_review"
 *
 * Member-gated. Contact steps (email/phone) move the record's level FLOOR;
 * payout is synced from Stripe Connect; insurance / licence record evidence at
 * status 'uploaded' (awaiting admin review). "submit_for_review" moves the record
 * to pending_review so it enters the admin queue — it does NOT approve anything.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const body = await request.json().catch(() => ({}))
    const workspaceId = String(body.workspaceId ?? "")
    const action = String(body.action ?? "")
    const auth = await requireSupplierMember(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const rec = await ensureVerification(workspaceId, auth.userId)
    if (!rec) return NextResponse.json({ error: "Could not start verification" }, { status: 500 })

    switch (action) {
      case "confirm_email": {
        // NOTE: actual email confirmation happens via the account email flow; this
        // records that the confirmed-email step is satisfied for this supplier.
        const ok = await markContactStep(workspaceId, "email")
        if (ok)
          await recordEvent({
            verificationId: rec.id,
            supplierWorkspaceId: workspaceId,
            eventType: "email_confirmed",
            actorUserId: auth.userId,
            actorRole: "supplier",
          })
        break
      }
      case "confirm_phone": {
        const ok = await markContactStep(workspaceId, "phone")
        if (ok)
          await recordEvent({
            verificationId: rec.id,
            supplierWorkspaceId: workspaceId,
            eventType: "phone_confirmed",
            actorUserId: auth.userId,
            actorRole: "supplier",
          })
        break
      }
      case "sync_payout": {
        const verified = await syncPayoutVerified(workspaceId)
        await recordEvent({
          verificationId: rec.id,
          supplierWorkspaceId: workspaceId,
          eventType: verified ? "payout_verified" : "payout_sync",
          actorUserId: auth.userId,
          actorRole: "supplier",
          detail: { payoutVerified: verified },
        })
        break
      }
      case "add_insurance": {
        const created = await recordInsurance({
          verificationId: rec.id,
          supplierWorkspaceId: workspaceId,
          insuranceType: String(body.insuranceType ?? "public_liability") as InsuranceType,
          provider: body.provider ?? null,
          policyNumber: body.policyNumber ?? null, // masked before storage
          coverageAmountPence: body.coverageAmountPence ?? null,
          validFrom: body.validFrom ?? null,
          validTo: body.validTo ?? null,
          r2Key: body.r2Key ?? null,
        })
        if (!created)
          return NextResponse.json({ error: "Could not record insurance" }, { status: 500 })
        await recordEvent({
          verificationId: rec.id,
          supplierWorkspaceId: workspaceId,
          eventType: "insurance_uploaded",
          actorUserId: auth.userId,
          actorRole: "supplier",
        })
        break
      }
      case "add_licence": {
        const created = await recordLicence({
          verificationId: rec.id,
          supplierWorkspaceId: workspaceId,
          licenceType: String(body.licenceType ?? "other"),
          issuingBody: body.issuingBody ?? null,
          licenceNumber: body.licenceNumber ?? null, // masked before storage
          country: body.country ?? null,
          region: body.region ?? null,
          validFrom: body.validFrom ?? null,
          validTo: body.validTo ?? null,
          requiredForCategories: Array.isArray(body.requiredForCategories)
            ? body.requiredForCategories.map(String)
            : [],
          r2Key: body.r2Key ?? null,
        })
        if (!created)
          return NextResponse.json({ error: "Could not record licence" }, { status: 500 })
        await recordEvent({
          verificationId: rec.id,
          supplierWorkspaceId: workspaceId,
          eventType: "licence_uploaded",
          actorUserId: auth.userId,
          actorRole: "supplier",
        })
        break
      }
      case "submit_for_review": {
        // Move to pending_review + mark document/selfie checks as needing manual
        // review. NEVER sets status to verified — only an admin can do that.
        try {
          const admin = createAdminClient()
          await admin
            .from("supplier_identity_verifications")
            .update({
              status: "pending_review",
              manual_review_status: "pending",
              document_check_status: "manual_required",
              selfie_check_status: "manual_required",
            })
            .eq("id", rec.id)
        } catch {
          /* ignore */
        }
        await recordEvent({
          verificationId: rec.id,
          supplierWorkspaceId: workspaceId,
          eventType: "submitted_for_review",
          toStatus: "pending_review",
          actorUserId: auth.userId,
          actorRole: "supplier",
        })
        break
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    const summary = await getStatusSummary(workspaceId)
    return NextResponse.json({ summary })
  } catch (err) {
    captureException(err, { source: "api/supplier-verification/submit", requestId })
    return NextResponse.json({ error: "Submit failed", requestId }, { status: 500 })
  }
}
