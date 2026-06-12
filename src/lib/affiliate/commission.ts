import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { levelByBand } from "@/lib/affiliate/levels"

// ============================================================================
// Affiliate commission engine — driven by Stripe billing events (source of truth).
//
// Commission is NEVER computed on the client. The Stripe webhook calls these with
// the service-role client. All operations are best-effort and 42P01-safe so a
// missing affiliate table never breaks billing processing.
//
// Model (matches live schema):
//   - affiliate_referrals(affiliate_workspace_id, referred_workspace_id, status,
//       first_invoice_at, initial/recurring_commission_pence, recurring_months_remaining)
//   - affiliates(workspace_id, band, pending_pence, active_referrals_count, approved, enrolled)
//   - affiliate_commissions(workspace_id, referred_workspace_id, commission_type,
//       amount, currency, status, ...)  amount is MAJOR units; pence fields are MINOR.
// ============================================================================

type DB = SupabaseClient

async function workspaceIdForCustomer(db: DB, customerId: string): Promise<string | null> {
  try {
    const { data } = await db
      .from("workspaces")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle()
    return (data?.id as string | null) ?? null
  } catch {
    return null
  }
}

interface ActiveReferral {
  id: string
  affiliate_workspace_id: string
  status: string
  first_invoice_at: string | null
  initial_commission_pence: number | null
  recurring_commission_pence: number | null
  recurring_months_remaining: number | null
}

async function findEligibleReferral(db: DB, referredWorkspaceId: string): Promise<ActiveReferral | null> {
  try {
    const { data } = await db
      .from("affiliate_referrals")
      .select("id, affiliate_workspace_id, status, first_invoice_at, initial_commission_pence, recurring_commission_pence, recurring_months_remaining")
      .eq("referred_workspace_id", referredWorkspaceId)
      .not("status", "in", "(reversed,cancelled,refunded,rejected)")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    return (data as ActiveReferral) ?? null
  } catch {
    return null
  }
}

/**
 * Accrue commission for a paid invoice. Called from invoice.paid.
 * amountMinor = invoice amount_paid in minor units (pence for GBP).
 */
export async function accrueCommissionForInvoice(
  db: DB,
  args: { customerId: string; amountMinor: number; currency: string; invoiceId?: string }
): Promise<void> {
  if (!args.customerId || !args.amountMinor || args.amountMinor <= 0) return

  const referredWs = await workspaceIdForCustomer(db, args.customerId)
  if (!referredWs) return

  const referral = await findEligibleReferral(db, referredWs)
  if (!referral) return
  if ((referral.recurring_months_remaining ?? 0) <= 0 && referral.first_invoice_at) return

  // Affiliate must be enrolled + approved (approved=false acts as suspension).
  const { data: aff } = await db
    .from("affiliates")
    .select("workspace_id, band, pending_pence, active_referrals_count, enrolled, approved")
    .eq("workspace_id", referral.affiliate_workspace_id)
    .maybeSingle()
  if (!aff || !aff.enrolled || !aff.approved) return

  const rate = levelByBand(aff.band as number | null).rate
  const commissionMinor = Math.round(args.amountMinor * rate)
  if (commissionMinor <= 0) return

  const isFirst = !referral.first_invoice_at
  const monthsLeft = referral.recurring_months_remaining ?? 0
  if (!isFirst && monthsLeft <= 0) return

  // Update referral accrual + decrement months.
  try {
    await db
      .from("affiliate_referrals")
      .update({
        status: "active",
        first_invoice_at: referral.first_invoice_at ?? new Date().toISOString(),
        initial_commission_pence: isFirst ? commissionMinor : referral.initial_commission_pence ?? 0,
        recurring_commission_pence: (referral.recurring_commission_pence ?? 0) + (isFirst ? 0 : commissionMinor),
        recurring_months_remaining: Math.max(0, monthsLeft - 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", referral.id)
  } catch { /* non-fatal */ }

  // Bump affiliate pending balance + active referral count (on first paid invoice).
  try {
    await db
      .from("affiliates")
      .update({
        pending_pence: Number(aff.pending_pence ?? 0) + commissionMinor,
        active_referrals_count: Number(aff.active_referrals_count ?? 0) + (isFirst ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", aff.workspace_id)
  } catch { /* non-fatal */ }

  // Ledger row (pending; clears after 30-day cooling-off).
  try {
    await db.from("affiliate_commissions").insert({
      workspace_id: aff.workspace_id,
      referred_workspace_id: referredWs,
      commission_type: isFirst ? "initial" : "recurring",
      amount: commissionMinor / 100,
      currency: (args.currency ?? "gbp").toUpperCase(),
      status: "pending",
      notes: args.invoiceId ? `invoice:${args.invoiceId}` : null,
    })
  } catch { /* non-fatal */ }
}

/**
 * Reverse the most recent pending commission for a customer (refund/chargeback).
 */
export async function reverseCommissionForCustomer(
  db: DB,
  args: { customerId: string }
): Promise<void> {
  const referredWs = await workspaceIdForCustomer(db, args.customerId)
  if (!referredWs) return

  // Most recent non-reversed commission for this referred workspace.
  interface CommRow { id: string; workspace_id: string; amount: number }
  let commission: CommRow | null = null
  try {
    const { data } = await db
      .from("affiliate_commissions")
      .select("id, workspace_id, amount, status")
      .eq("referred_workspace_id", referredWs)
      .in("status", ["pending", "approved", "payable"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    commission = (data as unknown as CommRow | null) ?? null
  } catch {
    return
  }
  if (!commission) return

  const minor = Math.round((commission.amount ?? 0) * 100)
  try {
    await db.from("affiliate_commissions").update({ status: "reversed", updated_at: new Date().toISOString() }).eq("id", commission.id)
  } catch { /* non-fatal */ }

  // Reduce the affiliate's pending balance.
  try {
    const { data: aff } = await db
      .from("affiliates")
      .select("pending_pence")
      .eq("workspace_id", commission.workspace_id)
      .maybeSingle()
    if (aff) {
      await db
        .from("affiliates")
        .update({ pending_pence: Math.max(0, Number(aff.pending_pence ?? 0) - minor), updated_at: new Date().toISOString() })
        .eq("workspace_id", commission.workspace_id)
    }
  } catch { /* non-fatal */ }
}

/**
 * Move pending commissions past the 30-day cooling-off to `cleared` and shift the
 * affiliate's pending_pence → cleared_pence. Idempotent. Intended to run on a daily
 * schedule (cron/Vercel scheduled function — wired in the release-hardening phase);
 * can also be invoked manually from the admin console.
 */
export async function clearMaturedCommissions(db: DB): Promise<{ cleared: number }> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  interface MaturedRow { id: string; workspace_id: string; amount: number }
  let matured: MaturedRow[] = []
  try {
    const { data } = await db
      .from("affiliate_commissions")
      .select("id, workspace_id, amount")
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .limit(1000)
    matured = (data as unknown as MaturedRow[]) ?? []
  } catch {
    return { cleared: 0 }
  }
  if (matured.length === 0) return { cleared: 0 }

  // Aggregate per affiliate workspace.
  const byWs: Record<string, number> = {}
  for (const c of matured) {
    byWs[c.workspace_id] = (byWs[c.workspace_id] ?? 0) + Math.round((c.amount ?? 0) * 100)
  }

  try {
    await db
      .from("affiliate_commissions")
      .update({ status: "payable", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in("id", matured.map((c) => c.id))
  } catch {
    return { cleared: 0 }
  }

  for (const [wsId, minor] of Object.entries(byWs)) {
    try {
      const { data: aff } = await db
        .from("affiliates")
        .select("pending_pence, cleared_pence")
        .eq("workspace_id", wsId)
        .maybeSingle()
      if (aff) {
        await db
          .from("affiliates")
          .update({
            pending_pence: Math.max(0, Number(aff.pending_pence ?? 0) - minor),
            cleared_pence: Number(aff.cleared_pence ?? 0) + minor,
            updated_at: new Date().toISOString(),
          })
          .eq("workspace_id", wsId)
      }
    } catch { /* non-fatal */ }
  }

  return { cleared: matured.length }
}

/** Stop future accrual when a referred subscription is cancelled. */
export async function stopReferralAccrual(db: DB, args: { customerId: string }): Promise<void> {
  const referredWs = await workspaceIdForCustomer(db, args.customerId)
  if (!referredWs) return
  try {
    await db
      .from("affiliate_referrals")
      .update({ recurring_months_remaining: 0, status: "cancelled", updated_at: new Date().toISOString() })
      .eq("referred_workspace_id", referredWs)
      .not("status", "in", "(reversed,refunded)")
  } catch { /* non-fatal */ }
}
