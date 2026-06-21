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

// ─── Income tab line types ──────────────────────────────────────────────────

export interface UnitLine {
  id: string
  unitType: string
  unitNumber: string
  tenancyType: string
  unitSizeSqFt: number
  avgRentPcm: number
  voidPct: number
  furnished: string
  notes: string
}

export interface NightlyRateLine {
  id: string
  category: string
  baseRateWeekday: number
  weekendUpliftPct: number
  minStayNights: number
  occupancyTargetPct: number
  cleaningFee: number
  channelDirectPct: number
  channelOtaPct: number
  channelCorpPct: number
  seasonalityRule: string
  notes: string
}

export interface OccupancyScenario {
  id: string
  name: string
  kind: "base" | "upside" | "downside" | "ramp"
  targetOccupancyPct: number | null
  expectedVoidPct: number | null
  turnoverPct: number | null
  leaseUpPeriod: string
  stabilisedPeriod: string
  channel: string
  segment: string
  notes: string
}

export interface SeasonLine {
  id: string
  name: string
  colour: string
  dateRange: string
  occupancyAdjPct: number
  rateAdjPct: number
  demandLevel: "High" | "Medium" | "Low"
  localEvents: string
  notes: string
}

export interface AncillaryLine {
  id: string
  name: string
  pricingModel: string
  unitPriceIncVat: number
  frequency: string
  adoptionRate: number
  vatStatus: string
  linkedUnitType: string
  notes: string
}

export interface ParkingLine {
  id: string
  parkingType: string
  spacesAvailable: number
  reservedSpaces: number
  rentableSpaces: number
  monthlyFee: number
  nightlyFee: number
  currentUtilPct: number
  targetUtilPct: number
  permitType: string
  chargeType: string
  seasonality: string
  notes: string
}

export interface LaundryLine {
  id: string
  serviceType: string
  machineModel: string
  washPrice: number
  dryPrice: number
  packagePrice: number
  usageFreq: number
  adoptionRate: number
  costRecoveryPct: number
  freePaid: string
  notes: string
}

export interface MembershipLine {
  id: string
  name: string
  billingBasis: string
  pricePerUnit: number
  billingFrequency: string
  includedServices: string
  eligibleUnits: number
  vatStatus: string
  takeUpRate: number
  notes: string
}

export interface CorporateLetLine {
  id: string
  client: string
  sector: string
  unitAllocation: string
  contractType: string
  contractSubtype: string
  expectedMonths: number
  agreedRatePcm: number
  occupancyCommitmentPct: number
  invoicingFrequency: string
  noticePeriod: string
  notes: string
}

export interface OtherIncomeLine {
  id: string
  source: string
  category: string
  pricingBasis: string
  amount: number
  frequency: string
  adoptionPct: number
  vatRate: number
  linkedUnitType: string
  notes: string
}

export interface IncomeAiRecommendation {
  id: string
  incomeTab: string
  recommendationType: string
  title: string
  body: string
  estimatedImpactMonthly: number
  status: "draft" | "reviewed" | "applied" | "dismissed"
  createdAt: string
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

  // Step 3: Income — extended revenue model
  activeIncomeTab: string
  units: UnitLine[]
  nightlyRates: NightlyRateLine[]
  nightlyVoidPct: number
  occupancyScenarios: OccupancyScenario[]
  occupancySensitivityMode: "month" | "propertyType"
  seasons: SeasonLine[]
  seasonalBaseStrategy: string
  seasonalMode: "pct" | "index"
  ancillaryLines: AncillaryLine[]
  parkingLines: ParkingLine[]
  laundryLines: LaundryLine[]
  membershipLines: MembershipLine[]
  corporateLets: CorporateLetLine[]
  otherIncomeLines: OtherIncomeLine[]
  incomeAiRecommendations: IncomeAiRecommendation[]

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

  activeIncomeTab: "Rent per room",
  units: [],
  nightlyRates: [],
  nightlyVoidPct: 10,
  occupancyScenarios: [],
  occupancySensitivityMode: "month",
  seasons: [],
  seasonalBaseStrategy: "4-Season UK (Default)",
  seasonalMode: "pct",
  ancillaryLines: [],
  parkingLines: [],
  laundryLines: [],
  membershipLines: [],
  corporateLets: [],
  otherIncomeLines: [],
  incomeAiRecommendations: [],

  expenses: [],
  bills: [],

  upfrontCosts: [],
  complianceItems: [],
  fundingEquityPct: 40,
  fundingMortgagePct: 55,
  fundingOtherPct: 5,
  contingencyPct: 10,

  hasLandlordOffer: false,
  offerRentMonthly: 0,
  offerRentEscalationPct: 2.5,
  offerEscalationFrequency: "Annually",
  offerStructure: "guaranteed_rent",
  offerInitialTermYears: 3,
  offerRenewalOption: "",
  offerLockInMonths: 12,
  offerRentFreeMonths: 0,
  offerBreakClauseAfter: "",
  offerBreakNoticeMonths: 2,
  offerTerminationNoticeMonths: 2,
  offerEarlyTerminationPenalty: "",
  offerDepositAmount: 0,
  offerDepositType: "Rent Deposit",
  offerMaintenanceStructural: "Landlord",
  offerMaintenanceInternal: "Tenant",
  offerFurnishingFittings: "Tenant",
  offerReplacementResponsibility: "Tenant",
  offerBillsUtilities: "Tenant",
  offerCouncilTax: "Tenant",
  offerCommissionModel: "Fixed Fee",
  offerManagementFeePct: 0,
  offerSpecialTerms: "",
  offerNegotiationNotes: "",
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

  riskFactors: [],
  aiReviewGenerated: false,
  aiOpportunityRating: 0,
  aiConfidenceScore: 0,
  aiRiskAdjustedReturn: 0,
  aiStrengths: [],
  aiWeaknesses: [],
  aiAssumptionsToReview: [],
  aiNextActions: [],
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
