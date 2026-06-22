import "server-only"

// ============================================================================
// UNIFIED, FLAG-GATED seller go-live / payout gate.
//
// Policy (confirmed): everyone who receives money on the marketplace must be
// identity-verified before they can go live or be paid out — suppliers, PMs
// listing stays/lets, and any other seller. Suppliers additionally need valid
// public-liability insurance on file. KYC itself is satisfied by Stripe Connect
// payout onboarding (payouts_enabled) OR a recorded identity verification.
//
// This whole gate is behind the `sellerVerificationRequired` feature flag so it
// is INERT until the marketplace launches (pre-launch listings/payouts are not
// blocked). Turn the flag ON at launch to enforce.
//
// Composes the existing infra rather than reimplementing it:
//   - identity:  @/lib/identity/verification  (requireVerifiedForSelling)
//   - insurance: @/lib/supplier-verification   (loadVerification + valid insurance)
// ============================================================================
import type { SupabaseClient } from "@supabase/supabase-js"
import { isFeatureEnabled } from "@/lib/flags"
import { requireVerifiedForSelling } from "@/lib/identity/verification"

export type SellerKind = "supplier" | "host" | "seller"

export interface SellerGateResult {
  /** Whether the action may proceed. */
  allowed: boolean
  /** Whether the gate is currently being enforced (flag on). When false, allowed is always true. */
  enforced: boolean
  /** Honest, non-legal explanation of what is / isn't on file. */
  reason: string
  /** Outstanding requirement keys (empty when allowed). */
  missing: Array<"identity" | "insurance">
}

const ALLOW_PRE_LAUNCH: SellerGateResult = {
  allowed: true,
  enforced: false,
  reason: "Seller verification is not yet enforced (pre-launch).",
  missing: [],
}

async function supplierInsuranceValid(supplierWorkspaceId: string): Promise<boolean> {
  try {
    const { loadVerification } = await import("@/lib/supplier-verification/levels")
    const { hasValidInsurance } = await import("@/lib/supplier-verification/insurance")
    const { insurance, available } = await loadVerification(supplierWorkspaceId)
    if (!available) return false
    return hasValidInsurance(insurance)
  } catch {
    // Subsystem unavailable → treat insurance as not-on-file (fail closed when enforced).
    return false
  }
}

/**
 * Resolve whether a workspace may go live / receive payouts.
 * @param kind  "supplier" also requires valid insurance; "host"/"seller" require identity only.
 */
export async function sellerGoLiveGate(
  supabase: SupabaseClient,
  workspaceId: string,
  kind: SellerKind
): Promise<SellerGateResult> {
  if (!workspaceId) {
    return { allowed: false, enforced: true, reason: "No workspace.", missing: ["identity"] }
  }

  const enforced = await isFeatureEnabled("sellerVerificationRequired", { supabase, workspaceId })
  if (!enforced) return ALLOW_PRE_LAUNCH

  const missing: SellerGateResult["missing"] = []

  // Identity / KYC (Connect payouts_enabled OR recorded identity verification).
  const idGate = await requireVerifiedForSelling(supabase, workspaceId)
  if (!idGate.allowed) missing.push("identity")

  // Suppliers additionally need valid insurance on file.
  if (kind === "supplier") {
    const insuranceOk = await supplierInsuranceValid(workspaceId)
    if (!insuranceOk) missing.push("insurance")
  }

  if (missing.length === 0) {
    return {
      allowed: true,
      enforced: true,
      reason: "Identity confirmed" + (kind === "supplier" ? " and insurance on file." : "."),
      missing: [],
    }
  }

  const parts: string[] = []
  if (missing.includes("identity")) parts.push("complete Stripe payout onboarding or an identity verification")
  if (missing.includes("insurance")) parts.push("upload valid public-liability insurance")
  return {
    allowed: false,
    enforced: true,
    reason: `Before going live you need to ${parts.join(" and ")}. This reflects only the records on file, not a legal determination.`,
    missing,
  }
}
