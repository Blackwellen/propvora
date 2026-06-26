import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { levelByBand, pendingMilestones } from "@/lib/affiliate/levels"

// ============================================================================
// Affiliate commission engine — driven by Stripe billing events (source of truth).
//
// Commission is NEVER computed on the client. The Stripe webhook calls these
// with the service-role client. All operations are best-effort and 42P01-safe
// so a missing affiliate table never breaks billing processing.
//
// Model (matches live schema after v3 migration):
//   affiliates(workspace_id, band, pending_pence, active_referrals_count,
//     sub_pending_pence, sub_affiliate_count, milestone_*_awarded, recruited_by_*)
//   affiliate_referrals(affiliate_workspace_id, referred_workspace_id, link_type,
//     initial/recurring pence, recurring_months_remaining)
//   affiliate_commissions(workspace_id, referred_workspace_id, commission_type,
//     amount, currency, status, ...)
//   affiliate_milestones(affiliate_workspace_id, milestone_key, bonus_pence, ...)
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
  link_type: string | null
}

async function findEligibleReferral(db: DB, referredWorkspaceId: string): Promise<ActiveReferral | null> {
  try {
    const { data } = await db
      .from("affiliate_referrals")
      .select("id, affiliate_workspace_id, status, first_invoice_at, initial_commission_pence, recurring_commission_pence, recurring_months_remaining, link_type")
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

// ── Sub-affiliate earn-through ────────────────────────────────────────────────

async function accrueSubAffiliateCommission(
  db: DB,
  args: {
    directAffiliateWorkspaceId: string
    referredWorkspaceId: string
    amountMinor: number
    currency: string
    invoiceId?: string
  }
): Promise<void> {
  try {
    // Find the recruiter (1 level up only — not recursive)
    const { data: directAff } = await db
      .from("affiliates")
      .select("recruited_by_affiliate_workspace_id, band, enrolled, approved")
      .eq("workspace_id", args.directAffiliateWorkspaceId)
      .maybeSingle()

    const recruiterWsId = directAff?.recruited_by_affiliate_workspace_id as string | null
    if (!recruiterWsId) return
    // Prevent self-referral at the sub-affiliate level
    if (recruiterWsId === args.directAffiliateWorkspaceId) return
    if (recruiterWsId === args.referredWorkspaceId) return

    // Recruiter must be enrolled + approved
    const { data: recruiterAff } = await db
      .from("affiliates")
      .select("workspace_id, band, sub_pending_pence, enrolled, approved")
      .eq("workspace_id", recruiterWsId)
      .maybeSingle()
    if (!recruiterAff || !recruiterAff.enrolled || !recruiterAff.approved) return

    const recruiterLevel = levelByBand(recruiterAff.band as number | null)
    const subRate = recruiterLevel.subAffiliateRate
    const commissionMinor = Math.round(args.amountMinor * subRate)
    if (commissionMinor <= 0) return

    // Insert ledger row for recruiter
    const { data: commRow } = await db.from("affiliate_commissions").insert({
      workspace_id: recruiterWsId,
      referred_workspace_id: args.referredWorkspaceId,
      commission_type: "sub_affiliate",
      amount: commissionMinor / 100,
      currency: (args.currency ?? "gbp").toUpperCase(),
      status: "pending",
      notes: args.invoiceId
        ? `sub_affiliate:invoice:${args.invoiceId}:via:${args.directAffiliateWorkspaceId}`
        : `sub_affiliate:via:${args.directAffiliateWorkspaceId}`,
    }).select("id").single()

    // Bump recruiter's sub_pending_pence balance
    await db
      .from("affiliates")
      .update({
        sub_pending_pence: Number(recruiterAff.sub_pending_pence ?? 0) + commissionMinor,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", recruiterWsId)

    void commRow // used only for milestone check below (not needed at sub level)
  } catch { /* non-fatal */ }
}

// ── Milestone bonus engine ────────────────────────────────────────────────────

async function checkAndAwardMilestones(
  db: DB,
  affiliateWorkspaceId: string
): Promise<void> {
  try {
    const { data: aff } = await db
      .from("affiliates")
      .select("active_referrals_count, pending_pence, milestone_5_awarded, milestone_15_awarded, milestone_50_awarded")
      .eq("workspace_id", affiliateWorkspaceId)
      .maybeSingle()
    if (!aff) return

    const activeCount = Number(aff.active_referrals_count ?? 0)
    const awarded = {
      m5:  Boolean(aff.milestone_5_awarded),
      m15: Boolean(aff.milestone_15_awarded),
      m50: Boolean(aff.milestone_50_awarded),
    }
    const due = pendingMilestones(activeCount, awarded)
    if (due.length === 0) return

    for (const milestone of due) {
      // Insert commission ledger row for the bonus
      const { data: commRow, error: commErr } = await db
        .from("affiliate_commissions")
        .insert({
          workspace_id: affiliateWorkspaceId,
          referred_workspace_id: null,
          commission_type: "milestone",
          amount: milestone.bonusPence / 100,
          currency: "GBP",
          status: "pending",
          notes: `milestone:${milestone.key}:bonus:${milestone.bonusPence}p`,
        })
        .select("id")
        .single()
      if (commErr) continue

      // Audit row in affiliate_milestones
      const commId = (commRow as { id: string } | null)?.id ?? null
      await db.from("affiliate_milestones").insert({
        affiliate_workspace_id: affiliateWorkspaceId,
        milestone_key: milestone.key,
        bonus_pence: milestone.bonusPence,
        commission_id: commId,
      })

      // Update the awarded flag + bump pending balance
      const flagCol = `milestone_${milestone.key.slice(1)}_awarded` as
        | "milestone_5_awarded"
        | "milestone_15_awarded"
        | "milestone_50_awarded"
      await db
        .from("affiliates")
        .update({
          [flagCol]: true,
          pending_pence: Number(aff.pending_pence ?? 0) + milestone.bonusPence,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", affiliateWorkspaceId)
    }
  } catch { /* non-fatal */ }
}

// ── Main accrual ──────────────────────────────────────────────────────────────

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
  // Self-referral guard: affiliate workspace cannot earn from its own subscription.
  if (referral.affiliate_workspace_id === referredWs) return
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
    const newActiveCount = Number(aff.active_referrals_count ?? 0) + (isFirst ? 1 : 0)
    await db
      .from("affiliates")
      .update({
        pending_pence: Number(aff.pending_pence ?? 0) + commissionMinor,
        active_referrals_count: newActiveCount,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", aff.workspace_id)

    // Check milestone bonuses after updating the active count
    if (isFirst) {
      await checkAndAwardMilestones(db, aff.workspace_id as string)
    }
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

  // Sub-affiliate earn-through pass (1 level only)
  await accrueSubAffiliateCommission(db, {
    directAffiliateWorkspaceId: aff.workspace_id as string,
    referredWorkspaceId: referredWs,
    amountMinor: args.amountMinor,
    currency: args.currency,
    invoiceId: args.invoiceId,
  })
}

// ── Reverse commission ────────────────────────────────────────────────────────

/**
 * Reverse the most recent pending commission for a customer (refund/chargeback).
 */
export async function reverseCommissionForCustomer(
  db: DB,
  args: { customerId: string }
): Promise<void> {
  const referredWs = await workspaceIdForCustomer(db, args.customerId)
  if (!referredWs) return

  interface CommRow { id: string; workspace_id: string; amount: number; commission_type: string }
  let commission: CommRow | null = null
  try {
    const { data } = await db
      .from("affiliate_commissions")
      .select("id, workspace_id, amount, status, commission_type")
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

  // Reduce the affiliate's appropriate balance
  try {
    const isSubComm = commission.commission_type === "sub_affiliate"
    const { data: aff } = await db
      .from("affiliates")
      .select("pending_pence, sub_pending_pence")
      .eq("workspace_id", commission.workspace_id)
      .maybeSingle()
    if (aff) {
      if (isSubComm) {
        await db
          .from("affiliates")
          .update({ sub_pending_pence: Math.max(0, Number(aff.sub_pending_pence ?? 0) - minor), updated_at: new Date().toISOString() })
          .eq("workspace_id", commission.workspace_id)
      } else {
        await db
          .from("affiliates")
          .update({ pending_pence: Math.max(0, Number(aff.pending_pence ?? 0) - minor), updated_at: new Date().toISOString() })
          .eq("workspace_id", commission.workspace_id)
      }
    }
  } catch { /* non-fatal */ }
}

// ── Clear matured commissions ─────────────────────────────────────────────────

/**
 * Move pending commissions past the 30-day cooling-off to `payable` and shift
 * the affiliate's pending_pence → cleared_pence (and sub_pending → sub_cleared).
 * Idempotent. Intended to run on a daily cron.
 */
export async function clearMaturedCommissions(db: DB): Promise<{ cleared: number }> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  interface MaturedRow { id: string; workspace_id: string; amount: number; commission_type: string }
  let matured: MaturedRow[] = []
  try {
    const { data } = await db
      .from("affiliate_commissions")
      .select("id, workspace_id, amount, commission_type")
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .limit(1000)
    matured = (data as unknown as MaturedRow[]) ?? []
  } catch {
    return { cleared: 0 }
  }
  if (matured.length === 0) return { cleared: 0 }

  // Aggregate per affiliate workspace, split by commission type
  const byWs: Record<string, { direct: number; sub: number }> = {}
  for (const c of matured) {
    const entry = byWs[c.workspace_id] ?? { direct: 0, sub: 0 }
    const minor = Math.round((c.amount ?? 0) * 100)
    if (c.commission_type === "sub_affiliate") {
      entry.sub += minor
    } else {
      entry.direct += minor
    }
    byWs[c.workspace_id] = entry
  }

  try {
    await db
      .from("affiliate_commissions")
      .update({ status: "payable", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in("id", matured.map((c) => c.id))
  } catch {
    return { cleared: 0 }
  }

  for (const [wsId, amounts] of Object.entries(byWs)) {
    try {
      const { data: aff } = await db
        .from("affiliates")
        .select("pending_pence, cleared_pence, sub_pending_pence, sub_cleared_pence")
        .eq("workspace_id", wsId)
        .maybeSingle()
      if (aff) {
        await db
          .from("affiliates")
          .update({
            pending_pence:     Math.max(0, Number(aff.pending_pence ?? 0) - amounts.direct),
            cleared_pence:     Number(aff.cleared_pence ?? 0) + amounts.direct,
            sub_pending_pence: Math.max(0, Number(aff.sub_pending_pence ?? 0) - amounts.sub),
            sub_cleared_pence: Number(aff.sub_cleared_pence ?? 0) + amounts.sub,
            updated_at:        new Date().toISOString(),
          })
          .eq("workspace_id", wsId)
      }
    } catch { /* non-fatal */ }
  }

  return { cleared: matured.length }
}

// ── Stop accrual on cancellation ──────────────────────────────────────────────

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
