// ============================================================
// Planning Set Detail — Shared TypeScript Types
// Covers all 17 tabs of the Planning Set detail experience.
// ============================================================

// ── Core entity ──────────────────────────────────────────────────────────────

export interface PlanningSet {
  id: string
  workspace_id: string
  owner_id: string | null
  profile_key: string
  name: string
  address: string | null
  postcode: string | null
  property_type: string | null
  units_count: number
  rooms_count: number
  status: PlanningSetStatus
  stage: string | null
  risk_score: number
  risk_level: RiskLevel
  target_net_monthly: number
  gross_monthly: number
  net_monthly: number
  upfront_cash: number
  margin_percent: number
  conversion_percent: number
  forecast_readiness_percent: number
  offer_stage: string | null
  notes: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export type PlanningSetStatus =
  | "draft"
  | "assumptions"
  | "forecast_ready"
  | "risk_review"
  | "offer_sent"
  | "accepted"
  | "converted"

export type RiskLevel = "Low" | "Medium" | "High" | "Critical"

// ── Tab 2: Assumptions ────────────────────────────────────────────────────────

export interface PlanningAssumption {
  id: string
  workspace_id: string
  planning_set_id: string
  assumption_type: string
  label: string
  value: number | null
  unit: string | null
  confidence: "low" | "medium" | "high" | null
  source: string | null
  created_at: string
  updated_at: string
}

// ── Tab 3: Income ─────────────────────────────────────────────────────────────

export interface PlanningIncomeLine {
  id: string
  workspace_id: string
  planning_set_id: string
  label: string
  amount: number
  frequency: "monthly" | "weekly" | "annual" | "one_off"
  quantity: number
  notes: string | null
  created_at: string
}

// ── Tab 4: Rooms & Units ──────────────────────────────────────────────────────

export interface PlanningUnitRoom {
  id: string
  workspace_id: string
  planning_set_id: string
  unit_code: string | null
  name: string
  floor: string | null
  unit_type: UnitRoomType | null
  size_sqm: number | null
  dimensions: string | null
  status: UnitRoomStatus
  target_rent_pcm: number
  actual_rent_pcm: number
  rentable: boolean
  compliance_status: string
  tenancy_id: string | null
  next_review_date: string | null
  tags: string[] | null
  image_url: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export type UnitRoomType = "ensuite" | "standard" | "studio" | "bathroom" | "kitchen" | "lounge"
export type UnitRoomStatus = "occupied" | "vacant" | "shared"

// ── Tab 5: Expenses ───────────────────────────────────────────────────────────

export interface PlanningExpenseLine {
  id: string
  workspace_id: string
  planning_set_id: string
  label: string
  amount: number
  frequency: "monthly" | "weekly" | "annual" | "one_off"
  category: string | null
  fixed_or_variable: "fixed" | "variable"
  notes: string | null
  created_at: string
}

// ── Tab 6: Bills ──────────────────────────────────────────────────────────────

export interface PlanningBill {
  id: string
  workspace_id: string
  planning_set_id: string
  label: string
  amount: number
  frequency: "monthly" | "weekly" | "annual" | "one_off"
  responsibility: "landlord" | "tenant" | "shared"
  included_in_rent: boolean
  notes: string | null
  created_at: string
}

// ── Tab 7: Upfront Costs ──────────────────────────────────────────────────────

export interface PlanningUpfrontCost {
  id: string
  workspace_id: string
  planning_set_id: string
  label: string
  amount: number
  category: string | null
  required_before_conversion: boolean
  notes: string | null
  created_at: string
}

// ── Tab 8: Compliance ─────────────────────────────────────────────────────────

export interface PlanningComplianceItem {
  id: string
  workspace_id: string
  planning_set_id: string
  label: string
  requirement_type: string | null
  required: boolean
  status: ComplianceStatus
  due_date: string | null
  estimated_cost: number | null
  notes: string | null
  created_at: string
}

export type ComplianceStatus = "pending" | "estimated" | "quoted" | "confirmed" | "complete" | "overdue"

// ── Tab 9: Landlord Offer ─────────────────────────────────────────────────────

export interface PlanningOffer {
  id: string
  workspace_id: string
  planning_set_id: string | null
  landlord_name: string | null
  landlord_contact_id: string | null
  property_address: string | null
  planning_profile_key: string | null
  status: OfferStatus
  offer_amount_monthly: number
  term_months: number | null
  break_clause_months: number | null
  deposit: number | null
  expiry_date: string | null
  acceptance_probability: number
  last_activity_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type OfferStatus = "draft" | "sent" | "under_review" | "accepted" | "rejected" | "expired" | "withdrawn"

export interface PlanningOfferVersion {
  id: string
  workspace_id: string
  planning_set_id: string
  offer_id: string | null
  version_num: number
  label: string | null
  offer_data: Record<string, unknown>
  created_by: string | null
  created_at: string
}

// ── Tab 10: Forecasts ─────────────────────────────────────────────────────────

export interface PlanningForecast {
  id: string
  workspace_id: string
  planning_set_id: string
  scenario_type: "base" | "optimistic" | "conservative" | "stress"
  month_index: number
  month_date: string
  gross_income: number
  operating_costs: number
  bills: number
  financing_costs: number
  net_cashflow: number
  cumulative_cashflow: number
  created_at: string
}

// ── Tab 11: Scenarios ─────────────────────────────────────────────────────────

export interface PlanningScenario {
  id: string
  workspace_id: string
  planning_set_id: string
  name: string
  scenario_type: "base" | "optimistic" | "conservative" | "stress" | "custom"
  assumptions_json: Record<string, unknown> | null
  net_monthly: number
  annual_cashflow: number
  breakeven_months: number | null
  risk_score: number
  confidence_score: number
  occupancy_pct: number | null
  total_costs_monthly: number
  created_at: string
  updated_at: string
}

// ── Tab 12: Risk ──────────────────────────────────────────────────────────────

export interface PlanningRisk {
  id: string
  workspace_id: string
  planning_set_id: string
  risk_code: string | null
  label: string
  category: RiskCategory
  risk_score: number
  likelihood: RiskRating
  impact: RiskRating
  risk_trend: "improving" | "stable" | "worsening"
  status: RiskStatus
  mitigation_owner: string | null
  mitigation_plan: string | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export type RiskCategory = "market" | "financial" | "regulatory" | "operational" | "construction"
export type RiskRating = "very_low" | "low" | "medium" | "high" | "very_high"
export type RiskStatus = "active" | "mitigated" | "closed" | "monitoring"

// ── Tab 13: Conversion ────────────────────────────────────────────────────────

export interface PlanningConversionChecklist {
  id: string
  workspace_id: string
  planning_set_id: string
  item_key: string
  label: string
  category: string | null
  required: boolean
  status: "pending" | "in_progress" | "complete" | "blocked"
  blocker: boolean
  completed_at: string | null
  completed_by: string | null
  created_at: string
}

// ── Tab 14: Documents ─────────────────────────────────────────────────────────

export interface PlanningDocument {
  id: string
  workspace_id: string
  planning_set_id: string
  title: string
  file_name: string | null
  file_path: string | null
  file_url: string | null
  category: DocumentCategory
  status: DocumentStatus
  expires_at: string | null
  linked_to: string | null
  notes: string | null
  uploaded_by: string | null
  uploaded_at: string
  created_at: string
  updated_at: string
}

export type DocumentCategory = "general" | "compliance" | "offer" | "property" | "financial" | "legal" | "insurance"
export type DocumentStatus = "missing" | "expired" | "unreadable" | "valid" | "approved" | "uploaded"

// ── Tab 15: Tasks ─────────────────────────────────────────────────────────────

export interface PlanningTask {
  id: string
  workspace_id: string
  planning_set_id: string
  title: string
  owner_name: string | null
  owner_id: string | null
  priority: TaskPriority
  due_date: string | null
  module_ref: string | null
  status: TaskStatus
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskStatus = "not_started" | "in_progress" | "completed" | "overdue"

// ── Tab 16: AI Review ─────────────────────────────────────────────────────────

export interface PlanningAiReview {
  id: string
  workspace_id: string
  planning_set_id: string
  overall_score: number
  financial_viability: number
  risk_assessment: number
  data_completeness: number
  compliance_readiness: number
  scenario_robustness: number
  strengths: string[] | null
  weaknesses: string[] | null
  missing_data: string[] | null
  suggestions: string[] | null
  recommendation: string | null
  raw_output: Record<string, unknown>
  reviewed_at: string
  reviewed_by: string | null
  created_at: string
}

// ── Tab 17: Activity ──────────────────────────────────────────────────────────

// Aligned to the live `planning_activity` schema (cols: action, detail, user_id,
// metadata). The migration-016 draft used action_type/title/description/actor_id,
// which never reached the live DB (create-table-if-not-exists lost to an earlier
// definition); live is the source of truth.
export interface PlanningActivity {
  id: string
  workspace_id: string
  planning_set_id: string
  user_id: string | null
  action: string
  detail: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export interface PlanningNote {
  id: string
  workspace_id: string
  planning_set_id: string
  body: string
  pinned: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── Full joined shape ─────────────────────────────────────────────────────────

export interface PlanningSetWithRelations extends Omit<PlanningSet, 'notes'> {
  notes: PlanningNote[]
  assumptions: PlanningAssumption[]
  income_lines: PlanningIncomeLine[]
  units_rooms: PlanningUnitRoom[]
  expense_lines: PlanningExpenseLine[]
  bills: PlanningBill[]
  upfront_costs: PlanningUpfrontCost[]
  compliance_items: PlanningComplianceItem[]
  offers: PlanningOffer[]
  offer_versions: PlanningOfferVersion[]
  forecasts: PlanningForecast[]
  scenarios: PlanningScenario[]
  risks: PlanningRisk[]
  conversion_checklists: PlanningConversionChecklist[]
  documents: PlanningDocument[]
  tasks: PlanningTask[]
  ai_reviews: PlanningAiReview[]
  activity: PlanningActivity[]
}

// ── Tab route slugs ───────────────────────────────────────────────────────────

export type PlanningSetTabSlug =
  | "overview"
  | "assumptions"
  | "income"
  | "rooms-units"
  | "expenses"
  | "bills"
  | "upfront-costs"
  | "compliance"
  | "landlord-offer"
  | "forecasts"
  | "scenarios"
  | "risk"
  | "conversion"
  | "documents"
  | "tasks"
  | "ai-review"
  | "activity"

export interface PlanningSetTab {
  num: number
  label: string
  slug: PlanningSetTabSlug
}

export const PLANNING_SET_TABS: PlanningSetTab[] = [
  { num: 1,  label: "Overview",       slug: "overview" },
  { num: 2,  label: "Assumptions",    slug: "assumptions" },
  { num: 3,  label: "Income",         slug: "income" },
  { num: 4,  label: "Rooms & Units",  slug: "rooms-units" },
  { num: 5,  label: "Expenses",       slug: "expenses" },
  { num: 6,  label: "Bills",          slug: "bills" },
  { num: 7,  label: "Upfront Costs",  slug: "upfront-costs" },
  { num: 8,  label: "Compliance",     slug: "compliance" },
  { num: 9,  label: "Landlord Offer", slug: "landlord-offer" },
  { num: 10, label: "Forecasts",      slug: "forecasts" },
  { num: 11, label: "Scenarios",      slug: "scenarios" },
  { num: 12, label: "Risk",           slug: "risk" },
  { num: 13, label: "Conversion",     slug: "conversion" },
  { num: 14, label: "Documents",      slug: "documents" },
  { num: 15, label: "Tasks",          slug: "tasks" },
  { num: 16, label: "AI Review",      slug: "ai-review" },
  { num: 17, label: "Activity",       slug: "activity" },
]
