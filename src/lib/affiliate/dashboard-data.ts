"use server"
// ============================================================================
// Affiliate dashboard data layer — server-only, scoped to affiliate workspace.
// All queries tolerate 42P01 (missing table). Money is integer pence throughout.
// ============================================================================

import { createClient } from "@/lib/supabase/server"

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
