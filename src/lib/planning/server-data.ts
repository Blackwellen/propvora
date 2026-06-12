// ============================================================
// Planning Set Detail — Server-side Supabase data fetchers
// All functions are async server-side helpers (no "use client").
// ============================================================

import { createClient } from "@/lib/supabase/server"
import type {
  PlanningSet,
  PlanningAssumption,
  PlanningIncomeLine,
  PlanningUnitRoom,
  PlanningExpenseLine,
  PlanningBill,
  PlanningUpfrontCost,
  PlanningComplianceItem,
  PlanningOffer,
  PlanningOfferVersion,
  PlanningForecast,
  PlanningScenario,
  PlanningRisk,
  PlanningConversionChecklist,
  PlanningDocument,
  PlanningTask,
  PlanningAiReview,
  PlanningActivity,
  PlanningNote,
} from "@/lib/planning/types"

// ── Planning Set ─────────────────────────────────────────────────────────────

export async function getPlanningSet(
  id: string,
  workspaceId: string
): Promise<PlanningSet | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_sets")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single()
  if (error) return null
  return data as PlanningSet
}

export async function getPlanningSetById(id: string): Promise<PlanningSet | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_sets")
    .select("*")
    .eq("id", id)
    .single()
  if (error) return null
  return data as PlanningSet
}

// ── Tab 2: Assumptions ────────────────────────────────────────────────────────

export async function getPlanningAssumptions(
  planningSetId: string
): Promise<PlanningAssumption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_assumptions")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("assumption_type")
  if (error) return []
  return (data ?? []) as PlanningAssumption[]
}

// ── Tab 3: Income ─────────────────────────────────────────────────────────────

export async function getPlanningIncomeLines(
  planningSetId: string
): Promise<PlanningIncomeLine[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_income_lines")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at")
  if (error) return []
  return (data ?? []) as PlanningIncomeLine[]
}

// ── Tab 4: Rooms & Units ──────────────────────────────────────────────────────

export async function getPlanningUnitsRooms(
  planningSetId: string
): Promise<PlanningUnitRoom[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_units_rooms")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("sort_order")
  if (error) return []
  return (data ?? []) as PlanningUnitRoom[]
}

// ── Tab 5: Expenses ───────────────────────────────────────────────────────────

export async function getPlanningExpenseLines(
  planningSetId: string
): Promise<PlanningExpenseLine[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_expense_lines")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at")
  if (error) return []
  return (data ?? []) as PlanningExpenseLine[]
}

// ── Tab 6: Bills ──────────────────────────────────────────────────────────────

export async function getPlanningBills(
  planningSetId: string
): Promise<PlanningBill[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_bills")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at")
  if (error) return []
  return (data ?? []) as PlanningBill[]
}

// ── Tab 7: Upfront Costs ──────────────────────────────────────────────────────

export async function getPlanningUpfrontCosts(
  planningSetId: string
): Promise<PlanningUpfrontCost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_upfront_costs")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at")
  if (error) return []
  return (data ?? []) as PlanningUpfrontCost[]
}

// ── Tab 8: Compliance ─────────────────────────────────────────────────────────

export async function getPlanningComplianceItems(
  planningSetId: string
): Promise<PlanningComplianceItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_compliance_items")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at")
  if (error) return []
  return (data ?? []) as PlanningComplianceItem[]
}

// ── Tab 9: Landlord Offer ─────────────────────────────────────────────────────

export async function getPlanningOffers(
  planningSetId: string
): Promise<PlanningOffer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_offers")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at", { ascending: false })
  if (error) return []
  return (data ?? []) as PlanningOffer[]
}

export async function getPlanningOfferVersions(
  planningSetId: string
): Promise<PlanningOfferVersion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_offer_versions")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("version_num", { ascending: false })
  if (error) return []
  return (data ?? []) as PlanningOfferVersion[]
}

// ── Tab 10: Forecasts ─────────────────────────────────────────────────────────

export async function getPlanningForecasts(
  planningSetId: string,
  scenarioType?: string
): Promise<PlanningForecast[]> {
  const supabase = await createClient()
  let query = supabase
    .from("planning_forecasts")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("month_index")
  if (scenarioType) {
    query = query.eq("scenario_type", scenarioType)
  }
  const { data, error } = await query
  if (error) return []
  return (data ?? []) as PlanningForecast[]
}

// ── Tab 11: Scenarios ─────────────────────────────────────────────────────────

export async function getPlanningScenarios(
  planningSetId: string
): Promise<PlanningScenario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_scenarios")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at")
  if (error) return []
  return (data ?? []) as PlanningScenario[]
}

// ── Tab 12: Risk ──────────────────────────────────────────────────────────────

export async function getPlanningRisks(
  planningSetId: string
): Promise<PlanningRisk[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_risks")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("risk_score", { ascending: false })
  if (error) return []
  return (data ?? []) as PlanningRisk[]
}

// ── Tab 13: Conversion ────────────────────────────────────────────────────────

export async function getPlanningConversionChecklists(
  planningSetId: string
): Promise<PlanningConversionChecklist[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_conversion_checklists")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at")
  if (error) return []
  return (data ?? []) as PlanningConversionChecklist[]
}

// ── Tab 14: Documents ─────────────────────────────────────────────────────────

export async function getPlanningDocuments(
  planningSetId: string
): Promise<PlanningDocument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_documents")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("uploaded_at", { ascending: false })
  if (error) return []
  return (data ?? []) as PlanningDocument[]
}

// ── Tab 15: Tasks ─────────────────────────────────────────────────────────────

export async function getPlanningTasks(
  planningSetId: string
): Promise<PlanningTask[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_tasks")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("due_date", { ascending: true, nullsFirst: false })
  if (error) return []
  return (data ?? []) as PlanningTask[]
}

// ── Tab 16: AI Reviews ────────────────────────────────────────────────────────

export async function getPlanningAiReviews(
  planningSetId: string
): Promise<PlanningAiReview[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_ai_reviews")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("reviewed_at", { ascending: false })
  if (error) return []
  return (data ?? []) as PlanningAiReview[]
}

export async function getLatestPlanningAiReview(
  planningSetId: string
): Promise<PlanningAiReview | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_ai_reviews")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return data as PlanningAiReview
}

// ── Tab 17: Activity ──────────────────────────────────────────────────────────

export async function getPlanningActivity(
  planningSetId: string,
  limit = 50
): Promise<PlanningActivity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_activity")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as PlanningActivity[]
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getPlanningNotes(
  planningSetId: string
): Promise<PlanningNote[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planning_notes")
    .select("*")
    .eq("planning_set_id", planningSetId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) return []
  return (data ?? []) as PlanningNote[]
}
