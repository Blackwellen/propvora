"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { MIN_PAYOUT_PENCE } from "@/lib/affiliate/levels"
import { isAffiliatePayoutsEnabled } from "@/lib/affiliate/payout-flag"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"

// ============================================================================
// Affiliate payout workflow — request → review → mark-paid.
//
// Built on the existing `affiliate_payouts` table (extended in
// 20260615070000_recipient_portals.sql with request/review columns + a widened
// status CHECK). Payouts are FEATURE-FLAG aware: the programme ships with
// payouts GATED OFF. The flag wires the REQUEST door; review + mark-paid are
// admin operations that always work (so back-office can clear a queue), but an
// affiliate cannot raise a request until the flag is on.
//
// Lifecycle:  requested → approved → paid     (terminal: paid, rejected)
//             requested → rejected
//
// On `paid` we move the affiliate's cleared_pence → paid_pence atomically.
// Audited on every transition. Service-role only; never client.
// ============================================================================

export interface PayoutResult {
  ok: boolean
  error?: string
  id?: string
  /** When the gate is closed, an honest reason to surface in the UI. */
  gated?: boolean
}

async function audit(
  db: ReturnType<typeof createAdminClient>,
  args: { workspaceId: string | null; action: string; resourceId: string; meta: Record<string, unknown>; userId?: string | null }
) {
  try {
    await db.from("audit_logs").insert({
      workspace_id: args.workspaceId,
      user_id: args.userId ?? null,
      action: args.action,
      resource_type: "affiliate_payout",
      resource_id: args.resourceId,
      new_data: args.meta,
    })
  } catch {
    /* non-fatal */
  }
}

/**
 * Affiliate raises a payout request for their current cleared balance.
 * Gated by the payouts feature flag. Snapshots cleared_pence at request time.
 */
export async function requestAffiliatePayout(workspaceId: string): Promise<PayoutResult> {
  if (!workspaceId) return { ok: false, error: "No workspace selected." }
  if (!isAffiliatePayoutsEnabled()) {
    return {
      ok: false,
      gated: true,
      error: "Payout requests are not open yet. You'll be able to request a payout once payouts are enabled.",
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Please sign in." }

  // Must be owner/admin of the workspace.
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member || !["owner", "admin"].includes((member.role as string) ?? "")) {
    return { ok: false, error: "Only a workspace owner or admin can request a payout." }
  }

  const admin = createAdminClient()

  // Read the affiliate's current state (cleared balance + enrolment/approval).
  const { data: aff, error: affErr } = await admin
    .from("affiliates")
    .select("workspace_id, enrolled, approved, cleared_pence, payout_email")
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (affErr || !aff) return { ok: false, error: "Affiliate account not found." }
  if (!aff.enrolled || !aff.approved) {
    return { ok: false, error: "Your affiliate account isn't active." }
  }

  const cleared = Number(aff.cleared_pence ?? 0)
  if (cleared < MIN_PAYOUT_PENCE) {
    return { ok: false, error: "Your cleared balance is below the minimum payout threshold." }
  }

  // Reject if a request is already in flight.
  const { data: open } = await admin
    .from("affiliate_payouts")
    .select("id")
    .eq("affiliate_workspace_id", workspaceId)
    .in("status", ["requested", "approved", "processing"])
    .limit(1)
    .maybeSingle()
  if (open) return { ok: false, error: "You already have a payout request in progress." }

  const period = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { data: row, error } = await admin
    .from("affiliate_payouts")
    .insert({
      affiliate_workspace_id: workspaceId,
      period,
      amount_pence: cleared,
      cleared_snapshot_pence: cleared,
      status: "requested",
      requested_at: new Date().toISOString(),
      requested_by: user.id,
      payout_email: aff.payout_email ?? user.email ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single()
  if (error || !row) {
    console.error("[requestAffiliatePayout]", error)
    return { ok: false, error: "Could not raise your payout request." }
  }

  await audit(admin, {
    workspaceId,
    userId: user.id,
    action: "affiliate_payout.requested",
    resourceId: row.id as string,
    meta: { amount_pence: cleared, period },
  })

  revalidatePath("/property-manager/affiliates/earnings")
  revalidatePath("/user/affiliate/earnings")
  revalidatePath("/affiliate/earnings")
  return { ok: true, id: row.id as string }
}

// ── Admin review operations (require platform admin) ────────────────────────

async function requireAdminUser(): Promise<{ userId: string } | { error: string }> {
  try {
    const { requireAdmin } = await import("@/lib/admin/guard")
    const admin = await requireAdmin()
    return { userId: admin.userId }
  } catch {
    return { error: "Admin authorisation required." }
  }
}

/** Admin approves a requested payout (ready to pay). */
export async function approveAffiliatePayout(payoutId: string, note?: string): Promise<PayoutResult> {
  const auth = await requireAdminUser()
  if ("error" in auth) return { ok: false, error: auth.error }
  if (!payoutId) return { ok: false, error: "Missing payout id." }

  const admin = createAdminClient()
  const { data: row, error: readErr } = await admin
    .from("affiliate_payouts")
    .select("id, affiliate_workspace_id, status")
    .eq("id", payoutId)
    .maybeSingle()
  if (readErr || !row) return { ok: false, error: "Payout not found." }
  if (row.status !== "requested") return { ok: false, error: `Cannot approve a payout that is "${row.status}".` }

  const { error } = await admin
    .from("affiliate_payouts")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: auth.userId, review_note: note ?? null, updated_at: new Date().toISOString() })
    .eq("id", payoutId)
  if (error) return { ok: false, error: "Could not approve the payout." }

  await audit(admin, {
    workspaceId: row.affiliate_workspace_id as string,
    userId: auth.userId,
    action: "affiliate_payout.approved",
    resourceId: payoutId,
    meta: { note: note ?? null },
  })
  revalidatePath("/admin/affiliates")
  return { ok: true, id: payoutId }
}

/** Admin rejects a requested payout. */
export async function rejectAffiliatePayout(payoutId: string, note?: string): Promise<PayoutResult> {
  const auth = await requireAdminUser()
  if ("error" in auth) return { ok: false, error: auth.error }
  if (!payoutId) return { ok: false, error: "Missing payout id." }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from("affiliate_payouts")
    .select("id, affiliate_workspace_id, status")
    .eq("id", payoutId)
    .maybeSingle()
  if (!row) return { ok: false, error: "Payout not found." }
  if (!["requested", "approved"].includes(row.status as string)) {
    return { ok: false, error: `Cannot reject a payout that is "${row.status}".` }
  }

  const { error } = await admin
    .from("affiliate_payouts")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: auth.userId, review_note: note ?? null, updated_at: new Date().toISOString() })
    .eq("id", payoutId)
  if (error) return { ok: false, error: "Could not reject the payout." }

  await audit(admin, {
    workspaceId: row.affiliate_workspace_id as string,
    userId: auth.userId,
    action: "affiliate_payout.rejected",
    resourceId: payoutId,
    meta: { note: note ?? null },
  })
  revalidatePath("/admin/affiliates")
  return { ok: true, id: payoutId }
}

/**
 * Admin marks an approved payout as paid. Atomically shifts the affiliate's
 * cleared_pence → paid_pence by the payout amount and stamps paid_at + a
 * reference. Idempotent guard: only transitions from `approved`.
 */
export async function markAffiliatePayoutPaid(payoutId: string, reference?: string): Promise<PayoutResult> {
  const auth = await requireAdminUser()
  if ("error" in auth) return { ok: false, error: auth.error }
  if (!payoutId) return { ok: false, error: "Missing payout id." }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from("affiliate_payouts")
    .select("id, affiliate_workspace_id, status, amount_pence")
    .eq("id", payoutId)
    .maybeSingle()
  if (!row) return { ok: false, error: "Payout not found." }
  if (row.status !== "approved") {
    return { ok: false, error: `Only an approved payout can be marked paid (currently "${row.status}").` }
  }

  const amount = Number(row.amount_pence ?? 0)
  const wsId = row.affiliate_workspace_id as string

  const { error } = await admin
    .from("affiliate_payouts")
    .update({ status: "paid", paid_at: new Date().toISOString(), payout_reference: reference ?? null, reviewed_by: auth.userId, updated_at: new Date().toISOString() })
    .eq("id", payoutId)
    .eq("status", "approved") // guard against double-pay
  if (error) return { ok: false, error: "Could not mark the payout paid." }

  // Shift the balance: cleared → paid.
  try {
    const { data: aff } = await admin
      .from("affiliates")
      .select("cleared_pence, paid_pence")
      .eq("workspace_id", wsId)
      .maybeSingle()
    if (aff) {
      await admin
        .from("affiliates")
        .update({
          cleared_pence: Math.max(0, Number(aff.cleared_pence ?? 0) - amount),
          paid_pence: Number(aff.paid_pence ?? 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", wsId)
    }
  } catch {
    /* non-fatal — payout row already marked paid */
  }

  await audit(admin, {
    workspaceId: wsId,
    userId: auth.userId,
    action: "affiliate_payout.paid",
    resourceId: payoutId,
    meta: { amount_pence: amount, reference: reference ?? null },
  })
  revalidatePath("/admin/affiliates")
  revalidatePath("/property-manager/affiliates/earnings")
  revalidatePath("/user/affiliate/earnings")
  revalidatePath("/affiliate/earnings")
  return { ok: true, id: payoutId }
}

/**
 * Admin pays an APPROVED payout via a real Stripe Connect transfer to the
 * affiliate's connected account, then marks it paid (recording the transfer id
 * as the reference). Requires the affiliate to have completed Connect
 * onboarding (a row in stripe_connect_accounts). Funds move from the platform
 * balance to the affiliate's connected account.
 */
export async function payAffiliatePayoutViaStripe(payoutId: string): Promise<PayoutResult> {
  const auth = await requireAdminUser()
  if ("error" in auth) return { ok: false, error: auth.error }
  if (!payoutId) return { ok: false, error: "Missing payout id." }

  const secretKey = stripeSecretKey()
  if (!secretKey) return { ok: false, error: "Stripe is not configured." }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from("affiliate_payouts")
    .select("id, affiliate_workspace_id, status, amount_pence")
    .eq("id", payoutId)
    .maybeSingle()
  if (!row) return { ok: false, error: "Payout not found." }
  if (row.status !== "approved") {
    return { ok: false, error: `Only an approved payout can be paid (currently "${row.status}").` }
  }

  const wsId = row.affiliate_workspace_id as string
  const amount = Number(row.amount_pence ?? 0)
  if (amount <= 0) return { ok: false, error: "Payout has no payable amount." }

  // The affiliate must have a connected account to receive the transfer.
  const { data: acct } = await admin
    .from("stripe_connect_accounts")
    .select("stripe_account_id")
    .eq("workspace_id", wsId)
    .maybeSingle()
  const destination = acct?.stripe_account_id as string | undefined
  if (!destination) {
    return { ok: false, error: "This affiliate hasn't connected a Stripe account to receive payouts yet." }
  }

  // Execute the Connect transfer (platform balance → affiliate's connected acct).
  let transferId: string
  try {
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" as const })
    const transfer = await stripe.transfers.create({
      amount,
      currency: "gbp",
      destination,
      description: `Propvora affiliate payout ${payoutId.slice(0, 8)}`,
      metadata: { affiliate_payout_id: payoutId, affiliate_workspace_id: wsId },
    })
    transferId = transfer.id
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? ""
    if (/insufficient|balance/i.test(msg)) {
      return { ok: false, error: "Insufficient platform balance to pay this affiliate yet." }
    }
    return { ok: false, error: "The Stripe transfer could not be completed." }
  }

  // Record the transfer id + flip to paid (shifts cleared → paid).
  return markAffiliatePayoutPaid(payoutId, transferId)
}
