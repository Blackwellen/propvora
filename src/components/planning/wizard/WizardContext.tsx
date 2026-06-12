"use client"

import React, { createContext, useContext, useReducer, useCallback, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoomLine {
  id: string
  name: string
  type: string
  contractType: string
  contractLengthMonths: number
  avgRentPcm: number
  voidPct: number
  seasonality: string
  notes: string
}

export interface ExpenseLine {
  id: string
  name: string
  description: string
  category: string
  frequency: "Monthly" | "Quarterly" | "Annual" | "One-off"
  isFixed: boolean
  payer: "Landlord" | "Tenant" | "Operator" | "Split"
  monthlyAmount: number
  vatTreatment: "Ex VAT" | "Inc VAT" | "No VAT"
}

export interface BillLine {
  id: string
  name: string
  description: string
  category: string
  frequency: "Monthly" | "Quarterly" | "Annual"
  isFixed: boolean
  payer: "Landlord" | "Tenant" | "Operator"
  monthlyAmount: number
  vatTreatment: "Ex VAT" | "Inc VAT" | "No VAT"
}

export interface UpfrontCostLine {
  id: string
  name: string
  category: string
  amount: number
  notes: string
}

export interface ComplianceItem {
  id: string
  title: string
  priority: "Mandatory" | "Recommended" | "Important"
  status: "not_started" | "in_progress" | "completed" | "blocked"
  estimatedCostMin: number
  estimatedCostMax: number
  dueDate: string
  evidenceRequired: string[]
  notes: string
}

export interface RiskFactor {
  id: string
  label: string
  description: string
  score: number
  maxScore: number
  alertLevel: "Low" | "Medium" | "High"
  trend: "improving" | "stable" | "worsening"
}

export interface WizardState {
  // Meta
  draftId: string | null
  planningSetId: string | null
  currentStep: number
  isDirty: boolean
  lastSavedAt: string | null
  completionPct: number

  // Step 1: Profile
  profileKey: string

  // Step 2: Basics
  setName: string
  propertyType: string
  opportunityType: string
  opportunitySource: string
  targetStrategy: string
  status: string
  leadOwner: string
  coOwner: string
  visibility: string
  tags: string[]
  address: string
  postcode: string
  city: string
  region: string
  propertyValue: number
  valuationMethod: string
  valuationDate: string
  tenure: string
  currentOccupancy: string
  numUnits: number
  intendedStartDate: string
  expectedDecisionDate: string
  targetMonthlyCashflow: number
  notes: string

  // Step 3: Income
  rooms: RoomLine[]
  voidAllowancePct: number
  occupancyPct: number
  adr: number
  singleMonthlyRent: number
  landlordMonthlyRent: number

  // Step 4: Expenses + Bills
  expenses: ExpenseLine[]
  bills: BillLine[]

  // Step 5: Upfront + Compliance
  upfrontCosts: UpfrontCostLine[]
  complianceItems: ComplianceItem[]
  fundingEquityPct: number
  fundingMortgagePct: number
  fundingOtherPct: number
  contingencyPct: number

  // Step 6: LL Offer
  hasLandlordOffer: boolean
  offerRentMonthly: number
  offerRentEscalationPct: number
  offerEscalationFrequency: string
  offerStructure: "guaranteed_rent" | "management_fee"
  offerInitialTermYears: number
  offerRenewalOption: string
  offerLockInMonths: number
  offerRentFreeMonths: number
  offerBreakClauseAfter: string
  offerBreakNoticeMonths: number
  offerTerminationNoticeMonths: number
  offerEarlyTerminationPenalty: string
  offerDepositAmount: number
  offerDepositType: string
  offerMaintenanceStructural: "Landlord" | "Tenant"
  offerMaintenanceInternal: "Landlord" | "Tenant"
  offerFurnishingFittings: "Landlord" | "Tenant"
  offerReplacementResponsibility: "Landlord" | "Tenant"
  offerBillsUtilities: "Landlord" | "Tenant"
  offerCouncilTax: "Landlord" | "Tenant"
  offerCommissionModel: string
  offerManagementFeePct: number
  offerSpecialTerms: string
  offerNegotiationNotes: string
  offerStatus: "draft" | "internal_review" | "negotiation" | "agreed" | "signed"

  // Step 7: Forecast
  forecastOccupancyPct: number
  forecastRentGrowthPct: number
  forecastOpCostInflationPct: number
  forecastVoidTurnoverLossPct: number
  forecastLtvPct: number
  forecastInterestRatePct: number
  forecastLoanTermYears: number
  forecastCapexAmount: number
  forecastExitHoldMonths: number
  forecastScenario: "best" | "base" | "worst"

  // Step 8: Risk + AI Review
  riskFactors: RiskFactor[]
  aiReviewGenerated: boolean
  aiOpportunityRating: number
  aiConfidenceScore: number
  aiRiskAdjustedReturn: number
  aiStrengths: string[]
  aiWeaknesses: string[]
  aiAssumptionsToReview: string[]
  aiNextActions: string[]
  aiReviewTimestamp: string | null

  // Step 9: Post-create automations
  postCreateTasks: boolean
  postCreateDocumentChecklist: boolean
  postCreateOfferFollowUpTask: boolean
  postCreateNotifyTeam: boolean
  postCreateScheduleReview: boolean
}

export type WizardAction =
  | { type: "SET_STEP"; step: number }
  | { type: "UPDATE"; payload: Partial<WizardState> }
  | { type: "SET_DIRTY"; dirty: boolean }
  | { type: "SET_DRAFT_ID"; draftId: string }
  | { type: "SET_LAST_SAVED"; ts: string }
  | { type: "SET_COMPLETION"; pct: number }

export interface WizardContextValue {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  update: (payload: Partial<WizardState>) => void
  setStep: (step: number) => void
  saveDraft: () => Promise<void>
  isSaving: boolean
}

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_STATE: WizardState = {
  draftId: null,
  planningSetId: null,
  currentStep: 1,
  isDirty: false,
  lastSavedAt: null,
  completionPct: 0,

  profileKey: "",

  setName: "",
  propertyType: "Terraced House",
  opportunityType: "HMO (Multiple Occupancy)",
  opportunitySource: "Rightmove",
  targetStrategy: "",
  status: "Active",
  leadOwner: "",
  coOwner: "",
  visibility: "Private – Only me",
  tags: [],
  address: "",
  postcode: "",
  city: "",
  region: "",
  propertyValue: 0,
  valuationMethod: "Comparable Sales",
  valuationDate: "",
  tenure: "Freehold",
  currentOccupancy: "Vacant",
  numUnits: 1,
  intendedStartDate: "",
  expectedDecisionDate: "",
  targetMonthlyCashflow: 0,
  notes: "",

  rooms: [],
  voidAllowancePct: 5,
  occupancyPct: 90,
  adr: 0,
  singleMonthlyRent: 0,
  landlordMonthlyRent: 0,

  expenses: [
    { id: "e1", name: "Management Fees", description: "Letting / management agent fees", category: "Management", frequency: "Monthly", isFixed: true, payer: "Landlord", monthlyAmount: 450, vatTreatment: "Ex VAT" },
    { id: "e2", name: "Maintenance", description: "Repairs & general maintenance", category: "Maintenance", frequency: "Monthly", isFixed: false, payer: "Landlord", monthlyAmount: 250, vatTreatment: "Ex VAT" },
    { id: "e3", name: "Cleaning", description: "Regular cleaning & common areas", category: "Cleaning", frequency: "Monthly", isFixed: true, payer: "Landlord", monthlyAmount: 160, vatTreatment: "Ex VAT" },
    { id: "e4", name: "Licensing", description: "HMO / selective / property licence", category: "Licensing", frequency: "Annual", isFixed: true, payer: "Landlord", monthlyAmount: 120, vatTreatment: "Ex VAT" },
    { id: "e5", name: "Insurance", description: "Building & landlord insurance", category: "Insurance", frequency: "Monthly", isFixed: true, payer: "Landlord", monthlyAmount: 85, vatTreatment: "Ex VAT" },
  ],
  bills: [
    { id: "b1", name: "Broadband", description: "Internet & Wi-Fi service", category: "Utilities", frequency: "Monthly", isFixed: true, payer: "Landlord", monthlyAmount: 45, vatTreatment: "Ex VAT" },
    { id: "b2", name: "Council Tax", description: "Local authority tax", category: "Council Tax", frequency: "Monthly", isFixed: true, payer: "Landlord", monthlyAmount: 126, vatTreatment: "No VAT" },
    { id: "b3", name: "Energy", description: "Gas & electricity", category: "Energy", frequency: "Monthly", isFixed: false, payer: "Landlord", monthlyAmount: 380, vatTreatment: "No VAT" },
    { id: "b4", name: "Water", description: "Water supply & sewerage", category: "Water", frequency: "Monthly", isFixed: false, payer: "Landlord", monthlyAmount: 280, vatTreatment: "No VAT" },
    { id: "b5", name: "Service Charges", description: "Ground rent / estate charges", category: "Service", frequency: "Monthly", isFixed: true, payer: "Landlord", monthlyAmount: 180, vatTreatment: "Ex VAT" },
  ],

  upfrontCosts: [
    { id: "u1", name: "Acquisition Price", category: "Acquisition", amount: 380000, notes: "" },
    { id: "u2", name: "Legal Fees", category: "Legal", amount: 1750, notes: "" },
    { id: "u3", name: "Stamp Duty", category: "Tax", amount: 11400, notes: "" },
    { id: "u4", name: "Broker Fees", category: "Fees", amount: 4750, notes: "" },
    { id: "u5", name: "Mortgage Fees", category: "Financing", amount: 1500, notes: "" },
    { id: "u6", name: "Refurbishment Costs", category: "Refurb", amount: 42000, notes: "" },
    { id: "u7", name: "Furnishing & Fittings", category: "Furnishing", amount: 18000, notes: "" },
    { id: "u8", name: "Setup Costs", category: "Setup", amount: 2500, notes: "" },
    { id: "u9", name: "Licensing Costs", category: "Licensing", amount: 2450, notes: "" },
    { id: "u10", name: "Contingency", category: "Contingency", amount: 9900, notes: "" },
    { id: "u11", name: "Deposit (Initial)", category: "Deposit", amount: 25000, notes: "" },
    { id: "u12", name: "Other Capex", category: "Other", amount: 5000, notes: "" },
  ],
  complianceItems: [
    { id: "c1", title: "HMO Licensing", priority: "Mandatory", status: "in_progress", estimatedCostMin: 1000, estimatedCostMax: 2300, dueDate: "2025-06-20", evidenceRequired: ["Application", "Floor Plans", "ID Proof"], notes: "" },
    { id: "c2", title: "Gas Safety Certificate", priority: "Mandatory", status: "completed", estimatedCostMin: 90, estimatedCostMax: 150, dueDate: "2026-02-28", evidenceRequired: ["Gas Cert", "Engineer Cert"], notes: "" },
    { id: "c3", title: "EICR (Electrical)", priority: "Mandatory", status: "in_progress", estimatedCostMin: 150, estimatedCostMax: 320, dueDate: "2025-08-15", evidenceRequired: ["EICR Report", "Cert Electrician"], notes: "" },
    { id: "c4", title: "EPC (Energy Performance)", priority: "Recommended", status: "completed", estimatedCostMin: 60, estimatedCostMax: 120, dueDate: "2035-03-10", evidenceRequired: ["EPC Certificate"], notes: "" },
    { id: "c5", title: "Smoke & CO Alarms", priority: "Mandatory", status: "in_progress", estimatedCostMin: 150, estimatedCostMax: 300, dueDate: "2025-06-15", evidenceRequired: ["Checklist", "Installation Cert"], notes: "" },
    { id: "c6", title: "Fire Doors", priority: "Mandatory", status: "not_started", estimatedCostMin: 150, estimatedCostMax: 300, dueDate: "2025-08-01", evidenceRequired: ["Inspection Report", "Cert Installer"], notes: "" },
    { id: "c7", title: "Right-to-Rent Checks", priority: "Mandatory", status: "completed", estimatedCostMin: 30, estimatedCostMax: 60, dueDate: "2025-05-10", evidenceRequired: ["ID Docs", "Check Report"], notes: "" },
    { id: "c8", title: "Planning Use Class", priority: "Important", status: "in_progress", estimatedCostMin: 250, estimatedCostMax: 600, dueDate: "2025-07-05", evidenceRequired: ["Planning Cert", "LL Approval"], notes: "" },
    { id: "c9", title: "Landlord Registration", priority: "Mandatory", status: "completed", estimatedCostMin: 40, estimatedCostMax: 80, dueDate: "2026-06-12", evidenceRequired: ["Registration Cert"], notes: "" },
    { id: "c10", title: "Insurance", priority: "Mandatory", status: "in_progress", estimatedCostMin: 1000, estimatedCostMax: 1300, dueDate: "2025-09-01", evidenceRequired: ["Policy Doc", "Schedule"], notes: "" },
    { id: "c11", title: "Local Authority Rules", priority: "Important", status: "not_started", estimatedCostMin: 150, estimatedCostMax: 200, dueDate: "", evidenceRequired: ["Check requirements"], notes: "" },
  ],
  fundingEquityPct: 40,
  fundingMortgagePct: 55,
  fundingOtherPct: 5,
  contingencyPct: 10,

  hasLandlordOffer: false,
  offerRentMonthly: 8750,
  offerRentEscalationPct: 2.5,
  offerEscalationFrequency: "Annually",
  offerStructure: "guaranteed_rent",
  offerInitialTermYears: 5,
  offerRenewalOption: "1 x 5 Years",
  offerLockInMonths: 24,
  offerRentFreeMonths: 2,
  offerBreakClauseAfter: "After 24 Months",
  offerBreakNoticeMonths: 3,
  offerTerminationNoticeMonths: 3,
  offerEarlyTerminationPenalty: "3 Months Rent",
  offerDepositAmount: 26250,
  offerDepositType: "Rent Deposit",
  offerMaintenanceStructural: "Landlord",
  offerMaintenanceInternal: "Tenant",
  offerFurnishingFittings: "Tenant",
  offerReplacementResponsibility: "Tenant",
  offerBillsUtilities: "Tenant",
  offerCouncilTax: "Tenant",
  offerCommissionModel: "Fixed Fee",
  offerManagementFeePct: 6,
  offerSpecialTerms: "Exclusive use of reception area.\nRight of first refusal on adjoining unit.",
  offerNegotiationNotes: "Landlord is motivated by long-term stability and minimal void risk.\nFlexible on rent-free if we commit to longer term.",
  offerStatus: "draft",

  forecastOccupancyPct: 95,
  forecastRentGrowthPct: 3,
  forecastOpCostInflationPct: 2.5,
  forecastVoidTurnoverLossPct: 2,
  forecastLtvPct: 70,
  forecastInterestRatePct: 4.75,
  forecastLoanTermYears: 25,
  forecastCapexAmount: 120000,
  forecastExitHoldMonths: 36,
  forecastScenario: "base",

  riskFactors: [
    { id: "r1", label: "Occupancy Risk", description: "Risk of lower than expected occupancy and rental income.", score: 72, maxScore: 100, alertLevel: "Medium", trend: "stable" },
    { id: "r2", label: "Compliance Risk", description: "Regulatory, licensing and compliance exposure.", score: 58, maxScore: 100, alertLevel: "Medium", trend: "worsening" },
    { id: "r3", label: "Landlord Negotiation Risk", description: "Terms, renewals and lease escalation exposure.", score: 64, maxScore: 100, alertLevel: "Medium", trend: "stable" },
    { id: "r4", label: "Financing Risk", description: "Capital structure, cost of debt and refinancing risk.", score: 66, maxScore: 100, alertLevel: "Medium", trend: "stable" },
    { id: "r5", label: "Operational Complexity", description: "Complexity of operations, staffing and process.", score: 49, maxScore: 100, alertLevel: "High", trend: "worsening" },
    { id: "r6", label: "Market Volatility", description: "Market demand, rate and macroeconomic volatility.", score: 61, maxScore: 100, alertLevel: "Medium", trend: "stable" },
    { id: "r7", label: "Execution Risk", description: "Project execution, timeline and delivery risk.", score: 70, maxScore: 100, alertLevel: "Medium", trend: "improving" },
  ],
  aiReviewGenerated: false,
  aiOpportunityRating: 76,
  aiConfidenceScore: 74,
  aiRiskAdjustedReturn: 12.4,
  aiStrengths: [
    "Strong income potential with solid demand fundamentals.",
    "Diversified income streams reduce single-source risk.",
    "Attractive cash yield relative to local market.",
  ],
  aiWeaknesses: [
    "Operational complexity may pressure margins.",
    "Compliance readiness requires attention.",
    "Sensitivity to occupancy and cost inflation.",
  ],
  aiAssumptionsToReview: [
    "Achievable occupancy in first 6 months.",
    "Lease escalation assumptions vs market reality.",
    "Financing terms and refinance timing.",
  ],
  aiNextActions: [
    "Strengthen operational plan and staffing model.",
    "Validate compliance path and licensing timeline.",
    "Negotiate lease terms to reduce escalation risk.",
    "Reduce debt terms or increase equity buffer.",
  ],
  aiReviewTimestamp: null,

  postCreateTasks: true,
  postCreateDocumentChecklist: true,
  postCreateOfferFollowUpTask: true,
  postCreateNotifyTeam: true,
  postCreateScheduleReview: false,
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step }
    case "UPDATE":
      return { ...state, ...action.payload, isDirty: true }
    case "SET_DIRTY":
      return { ...state, isDirty: action.dirty }
    case "SET_DRAFT_ID":
      return { ...state, draftId: action.draftId }
    case "SET_LAST_SAVED":
      return { ...state, lastSavedAt: action.ts, isDirty: false }
    case "SET_COMPLETION":
      return { ...state, completionPct: action.pct }
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({
  children,
  initialDraftId,
  initialData,
}: {
  children: React.ReactNode
  initialDraftId?: string
  initialData?: Partial<WizardState>
}) {
  const { workspace } = useWorkspace()
  const [state, dispatch] = useReducer(wizardReducer, {
    ...INITIAL_STATE,
    ...(initialData ?? {}),
    draftId: initialDraftId ?? null,
  })
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = useCallback((payload: Partial<WizardState>) => {
    dispatch({ type: "UPDATE", payload })
  }, [])

  const setStep = useCallback((step: number) => {
    dispatch({ type: "SET_STEP", step })
  }, [])

  const saveDraft = useCallback(async () => {
    if (!workspace?.id) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      const draftData = {
        workspace_id: workspace.id,
        current_step: state.currentStep,
        selected_profile: state.profileKey,
        draft_status: "in_progress" as const,
        draft_data: state as unknown as Record<string, unknown>,
        completion_pct: state.completionPct,
        last_saved_at: new Date().toISOString(),
      }

      if (state.draftId) {
        await supabase.from("planning_wizard_drafts").update(draftData).eq("id", state.draftId)
      } else {
        const { data } = await supabase
          .from("planning_wizard_drafts")
          .insert(draftData)
          .select("id")
          .single()
        if (data?.id) dispatch({ type: "SET_DRAFT_ID", draftId: data.id as string })
      }

      dispatch({ type: "SET_LAST_SAVED", ts: new Date().toISOString() })
    } catch (e) {
      console.error("Draft save error", e)
    } finally {
      setIsSaving(false)
    }
  }, [workspace?.id, state])

  // Auto-save 3s after last change
  React.useEffect(() => {
    if (!state.isDirty) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => { void saveDraft() }, 3000)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [state.isDirty, saveDraft])

  return (
    <WizardContext.Provider value={{ state, dispatch, update, setStep, saveDraft, isSaving }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider")
  return ctx
}

export { INITIAL_STATE }
