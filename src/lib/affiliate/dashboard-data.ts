"use server"
// ============================================================================
// Affiliate dashboard data layer — server-only, scoped to affiliate workspace.
// All queries tolerate 42P01 (missing table). Money is integer pence throughout.
// ============================================================================

import { createClient } from "@/lib/supabase/server"
import { MILESTONE_CONFIGS } from "@/lib/affiliate/levels"

function isPgError(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e
}
function isMissing(e: unknown) {
  return isPgError(e) && (e.code === "42P01" || e.code === "42703" || e.code === "PGRST116")
}

// ---- Types ------------------------------------------------------------------

export interface CommissionLedgerRow {
  id: string
  created_at: string
  status: "pending" | "payable" | "paid" | "reversed"
  commission_pence: number
  referral_id: string | null
  invoice_ref: string | null
}

export interface MonthlyEarningsRow {
  month: string          // "YYYY-MM"
  conversions: number
  gross_commission_pence: number
  net_commission_pence: number
}

export interface AffiliateLinkRow {
  id: string
  created_at: string
  target_page: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  vanity_slug: string | null
  clicks: number
  conversions: number
  last_clicked_at: string | null
}

export interface ReferralDetailRow {
  id: string
  status: string
  created_at: string
  first_invoice_at: string | null
  initial_commission_pence: number | null
  recurring_commission_pence: number | null
  recurring_months_remaining: number | null
  referred_plan: string | null
  workspace_created: boolean
}

// ---- Commission ledger ------------------------------------------------------

/**
 * Full commission ledger for the affiliate workspace.
 * Reads affiliate_commissions; falls back to empty if table absent.
 */
export async function getCommissionLedger(
  workspaceId: string
): Promise<CommissionLedgerRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("affiliate_commissions")
      // commission_pence is a GENERATED column (CEIL(amount * 100)) added in
      // 20260621000002_affiliate_schema_v2.sql.  Falls back to 0 if column absent.
      .select("id, created_at, status, commission_pence, referral_id:referred_workspace_id")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) {
      if (isMissing(error)) return []
      console.error("[affiliate/dashboard-data] commission ledger:", error)
      return []
    }
    return (data ?? []) as CommissionLedgerRow[]
  } catch (e) {
    if (isMissing(e)) return []
    console.error("[affiliate/dashboard-data] commission ledger catch:", e)
    return []
  }
}

// ---- Monthly breakdown ------------------------------------------------------

/**
 * Aggregates affiliate_commissions by calendar month.
 * If table missing, returns empty array.
 */
export async function getMonthlyEarnings(
  workspaceId: string
): Promise<MonthlyEarningsRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("affiliate_commissions")
      // commission_pence GENERATED column (see 20260621000002_affiliate_schema_v2.sql)
      .select("created_at, commission_pence, status")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
    if (error) {
      if (isMissing(error)) return []
      return []
    }
    // Aggregate in-memory by YYYY-MM
    const map = new Map<string, { conversions: number; gross: number; net: number }>()
    for (const row of (data ?? []) as { created_at: string; commission_pence: number; status: string }[]) {
      const month = row.created_at.slice(0, 7)
      const existing = map.get(month) ?? { conversions: 0, gross: 0, net: 0 }
      existing.conversions += 1
      existing.gross += row.commission_pence ?? 0
      if (row.status !== "reversed") existing.net += row.commission_pence ?? 0
      map.set(month, existing)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({
        month,
        conversions: v.conversions,
        gross_commission_pence: v.gross,
        net_commission_pence: v.net,
      }))
  } catch (e) {
    if (isMissing(e)) return []
    return []
  }
}

// ---- Affiliate links --------------------------------------------------------

/**
 * Custom tracked links created by the affiliate (affiliate_links table).
 * Tolerates 42P01. If the table doesn't exist returns empty array — the page
 * still renders the UTM builder and base link which work without this table.
 */
export async function getAffiliateLinks(
  workspaceId: string
): Promise<AffiliateLinkRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("affiliate_links")
      .select("id, created_at, target_page, utm_source, utm_medium, utm_campaign, vanity_slug, clicks, conversions, last_clicked_at")
      .eq("affiliate_workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error) {
      if (isMissing(error)) return []
      return []
    }
    return (data ?? []) as AffiliateLinkRow[]
  } catch (e) {
    if (isMissing(e)) return []
    return []
  }
}

/**
 * Create a new tracked link for the affiliate workspace.
 * Returns the created row or an error string.
 */
export async function createAffiliateLink(
  workspaceId: string,
  input: {
    target_page: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    vanity_slug?: string
    referral_code: string
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Not authenticated." }

    const { data, error } = await supabase
      .from("affiliate_links")
      .insert({
        affiliate_workspace_id: workspaceId,
        target_page: input.target_page,
        utm_source: input.utm_source || null,
        utm_medium: input.utm_medium || null,
        utm_campaign: input.utm_campaign || null,
        vanity_slug: input.vanity_slug || null,
        clicks: 0,
        conversions: 0,
      })
      .select("id")
      .single()
    if (error) {
      if (isMissing(error)) return { ok: false, error: "Link tracking not enabled yet." }
      return { ok: false, error: error.message }
    }
    return { ok: true, id: (data as { id: string }).id }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ---- Detailed referrals (with plan / workspace flags) -----------------------

/**
 * Referrals with additional plan and workspace metadata.
 * Reads affiliate_referrals; falls back gracefully.
 */
export async function getReferralDetails(
  workspaceId: string
): Promise<ReferralDetailRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("affiliate_referrals")
      .select(
        // referred_plan / workspace_created don't exist on live affiliate_referrals — mapped to null/false below
        "id, status, created_at, first_invoice_at, initial_commission_pence, recurring_commission_pence, recurring_months_remaining"
      )
      .eq("affiliate_workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error) {
      if (isMissing(error)) return []
      // Column may not exist — fall back to basic select
      const { data: d2, error: e2 } = await supabase
        .from("affiliate_referrals")
        .select("id, status, created_at, first_invoice_at, initial_commission_pence, recurring_commission_pence, recurring_months_remaining")
        .eq("affiliate_workspace_id", workspaceId)
        .order("created_at", { ascending: false })
      if (e2) return []
      return ((d2 ?? []) as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        status: r.status as string,
        created_at: r.created_at as string,
        first_invoice_at: (r.first_invoice_at as string) ?? null,
        initial_commission_pence: (r.initial_commission_pence as number) ?? null,
        recurring_commission_pence: (r.recurring_commission_pence as number) ?? null,
        recurring_months_remaining: (r.recurring_months_remaining as number) ?? null,
        referred_plan: null,
        workspace_created: false,
      }))
    }
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      status: r.status as string,
      created_at: r.created_at as string,
      first_invoice_at: (r.first_invoice_at as string) ?? null,
      initial_commission_pence: (r.initial_commission_pence as number) ?? null,
      recurring_commission_pence: (r.recurring_commission_pence as number) ?? null,
      recurring_months_remaining: (r.recurring_months_remaining as number) ?? null,
      referred_plan: (r.referred_plan as string) ?? null,
      workspace_created: Boolean(r.workspace_created),
    }))
  } catch (e) {
    if (isMissing(e)) return []
    return []
  }
}

// ── Sub-affiliate network ─────────────────────────────────────────────────────

export interface SubAffiliateRow {
  workspace_id: string
  band: number | null
  active_referrals_count: number
  pending_pence: number
  enrolled_at: string | null
  /** Earn-through commission the parent has earned from this sub so far (pence). */
  parent_earned_pence: number
}

/**
 * Returns the list of affiliates recruited by this workspace (1 level deep).
 * Also aggregates the sub-commission the parent has earned from each.
 */
export async function getSubAffiliateNetwork(
  workspaceId: string
): Promise<SubAffiliateRow[]> {
  try {
    const supabase = await createClient()
    const { data: subs, error: subErr } = await supabase
      .from("affiliates")
      .select("workspace_id, band, active_referrals_count, pending_pence, applied_at")
      .eq("recruited_by_affiliate_workspace_id", workspaceId)
      .eq("enrolled", true)
      .order("applied_at", { ascending: false })
    if (subErr) {
      if (isMissing(subErr)) return []
      return []
    }

    const subRows = (subs ?? []) as {
      workspace_id: string
      band: number | null
      active_referrals_count: number | null
      pending_pence: number | null
      applied_at: string | null
    }[]
    if (subRows.length === 0) return []

    const result: SubAffiliateRow[] = []
    for (const sub of subRows) {
      let parentEarned = 0
      try {
        const { data: comms } = await supabase
          .from("affiliate_commissions")
          .select("commission_pence, status")
          .eq("workspace_id", workspaceId)
          .eq("commission_type", "sub_affiliate")
          .like("notes", `%${sub.workspace_id}%`)
        if (comms) {
          parentEarned = (comms as { commission_pence: number; status: string }[])
            .filter((c) => c.status !== "reversed")
            .reduce((s, c) => s + (c.commission_pence ?? 0), 0)
        }
      } catch { /* best effort */ }

      result.push({
        workspace_id: sub.workspace_id,
        band: sub.band,
        active_referrals_count: Number(sub.active_referrals_count ?? 0),
        pending_pence: Number(sub.pending_pence ?? 0),
        enrolled_at: sub.applied_at,
        parent_earned_pence: parentEarned,
      })
    }
    return result
  } catch (e) {
    if (isMissing(e)) return []
    return []
  }
}

// ── Milestone status ──────────────────────────────────────────────────────────

export interface MilestoneStatusRow {
  key: "m5" | "m15" | "m50"
  threshold: number
  bonusPence: number
  label: string
  awarded: boolean
  awardedAt: string | null
  currentCount: number
}

export async function getMilestoneStatus(workspaceId: string): Promise<MilestoneStatusRow[]> {
  try {
    const supabase = await createClient()
    const { data: aff } = await supabase
      .from("affiliates")
      .select("active_referrals_count, milestone_5_awarded, milestone_15_awarded, milestone_50_awarded")
      .eq("workspace_id", workspaceId)
      .maybeSingle()

    const currentCount = Number((aff as Record<string, unknown> | null)?.active_referrals_count ?? 0)
    const awardedMap: Record<string, boolean> = {
      m5:  Boolean((aff as Record<string, unknown> | null)?.milestone_5_awarded),
      m15: Boolean((aff as Record<string, unknown> | null)?.milestone_15_awarded),
      m50: Boolean((aff as Record<string, unknown> | null)?.milestone_50_awarded),
    }

    const awardedDates: Record<string, string> = {}
    try {
      const { data: milestoneRows } = await supabase
        .from("affiliate_milestones")
        .select("milestone_key, awarded_at")
        .eq("affiliate_workspace_id", workspaceId)
      if (milestoneRows) {
        for (const m of milestoneRows as { milestone_key: string; awarded_at: string }[]) {
          awardedDates[m.milestone_key] = m.awarded_at
        }
      }
    } catch { /* tolerate missing table */ }

    return MILESTONE_CONFIGS.map((m) => ({
      key: m.key,
      threshold: m.threshold,
      bonusPence: m.bonusPence,
      label: m.label,
      awarded: awardedMap[m.key] ?? false,
      awardedAt: awardedDates[m.key] ?? null,
      currentCount,
    }))
  } catch (e) {
    if (isMissing(e)) return []
    return []
  }
}

// ── Click / conversion funnel ─────────────────────────────────────────────────

export interface ClickFunnelData {
  totalClicks: number
  discountClicks: number
  standardClicks: number
  signups: number
  paidConversions: number
  conversionRate: number
  byCampaign: { campaign: string; clicks: number }[]
}

export async function getClickFunnel(workspaceId: string): Promise<ClickFunnelData> {
  const empty: ClickFunnelData = {
    totalClicks: 0, discountClicks: 0, standardClicks: 0,
    signups: 0, paidConversions: 0, conversionRate: 0, byCampaign: [],
  }
  try {
    const supabase = await createClient()

    const { data: clicks, error: clickErr } = await supabase
      .from("affiliate_click_log")
      .select("link_type, utm_campaign")
      .eq("affiliate_workspace_id", workspaceId)
    if (clickErr && !isMissing(clickErr)) return empty

    const clickRows = (clicks ?? []) as { link_type: string; utm_campaign: string | null }[]
    const totalClicks = clickRows.length
    const discountClicks = clickRows.filter((c) => c.link_type === "discount").length
    const standardClicks = totalClicks - discountClicks

    const campaignMap: Record<string, number> = {}
    for (const c of clickRows) {
      const key = c.utm_campaign ?? "(none)"
      campaignMap[key] = (campaignMap[key] ?? 0) + 1
    }
    const byCampaign = Object.entries(campaignMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([campaign, count]) => ({ campaign, clicks: count }))

    const { data: refs, error: refErr } = await supabase
      .from("affiliate_referrals")
      .select("status")
      .eq("affiliate_workspace_id", workspaceId)
    if (refErr && !isMissing(refErr)) {
      return { totalClicks, discountClicks, standardClicks, signups: 0, paidConversions: 0, conversionRate: 0, byCampaign }
    }

    const refRows = (refs ?? []) as { status: string }[]
    const signups = refRows.length
    const paidConversions = refRows.filter((r) => r.status === "active" || r.status === "converted").length
    const conversionRate = signups > 0 ? Math.round((paidConversions / signups) * 100) : 0

    return { totalClicks, discountClicks, standardClicks, signups, paidConversions, conversionRate, byCampaign }
  } catch (e) {
    if (isMissing(e)) return empty
    return empty
  }
}
