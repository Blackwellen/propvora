// ─── Core Types ─────────────────────────────────────────────────────────────

export interface RoomIncome {
  id: string
  name: string
  type: string
  monthlyRent: number
}

export interface ExpenseLine {
  id: string
  label: string
  category: string
  monthlyAmount: number
}

export interface BillLine {
  id: string
  label: string
  provider: string
  monthlyAmount: number
  includedInRent: boolean
}

export interface UpfrontCostLine {
  id: string
  label: string
  category: string
  amount: number
}

export interface ComplianceLine {
  id: string
  label: string
  amount: number
  required: boolean
}

export interface ScenarioInputs {
  // New forecast-engine inputs
  baseRentMonthly: number
  occupancyRate: number          // 0–1
  operatingCostsPct: number      // 0–1 of gross
  billsMonthly: number
  financingMonthly: number
  upfrontCash: number
  incomeGrowthPctYearly: number
  costGrowthPctYearly: number
  // Legacy fields (preserved for backward compatibility)
  incomeAdjPct?: number
  costAdjPct?: number
  occupancyAdjPct?: number
}

export interface PlanningWizardData {
  profileKey: string
  propertyName: string
  address: string
  postcode: string
  linkedPropertyId?: string
  numUnits: number

  // Income
  rooms: RoomIncome[]
  adr?: number
  occupancyPct?: number
  singleMonthlyRent?: number

  // Landlord / owner assumptions
  landlordMonthlyRent?: number
  contractLengthMonths?: number
  breakClauseMonths?: number
  mortgageAmount?: number
  purchasePrice?: number
  propertyValue?: number

  // Dev / flip
  gdv?: number

  // Refinancing
  currentMonthlyPayment?: number
  newMonthlyPayment?: number
  cashOutAmount?: number

  // Void
  voidAllowancePct: number

  // Expenses
  expenses: ExpenseLine[]

  // Bills
  bills: BillLine[]

  // Upfront costs
  upfrontCosts: UpfrontCostLine[]

  // Compliance
  complianceItems: ComplianceLine[]

  // Landlord offer fields
  proposedLandlordRent?: number
  offerContractLength?: number
  offerBreakClause?: number
  offerBillsIncluded?: boolean
  offerManagementIncluded?: boolean

  // Status
  status?: "draft" | "active" | "offer_sent" | "accepted" | "converted" | "archived"
}

export interface PlanningCalculationResult {
  grossMonthlyIncome: number
  voidDeduction: number
  netMonthlyIncome: number
  totalMonthlyExpenses: number
  totalMonthlyBills: number
  netMonthlyCashflow: number
  grossAnnualIncome: number
  netAnnualCashflow: number
  totalUpfrontCash: number
  grossYield: number
  netYield: number
  roi: number
  breakevenMonth: number
  operatorMargin?: number
  operatorMarginPct?: number
  perRoomMargin?: number
  grossProfit?: number
  monthlySaving?: number
  riskScore: number
  riskStatus: "Healthy" | "Watch" | "At Risk" | "Critical" | "Needs Data"
  warnings: string[]
  // Legacy fields preserved for backward compatibility
  landlordCost?: number
  netMonthlyIncome_legacy?: number
  netAnnualIncome?: number
  upfrontCash?: number
  complianceCash?: number
  riskFactors?: RiskFactor[]
  monthlyProjection?: MonthlyProjection[]
}

// ─── Legacy Types (preserved for existing consumers) ────────────────────────

export interface RiskFactor {
  label: string
  score: number
  maxScore: number
  description: string
  severity: "low" | "medium" | "high"
}

export interface MonthlyProjection {
  month: number
  label: string
  grossIncome: number
  expenses: number
  netIncome: number
  cumulativeNet: number
}

// ─── New Forecast Types ──────────────────────────────────────────────────────

export interface ForecastMonth {
  monthIndex: number
  monthDate: string
  grossIncome: number
  operatingCosts: number
  bills: number
  financingCosts: number
  netCashflow: number
  cumulativeCashflow: number
}

// ─── Income Calculation ──────────────────────────────────────────────────────

export function calculateGrossIncome(data: PlanningWizardData): number {
  const { profileKey, rooms, adr, occupancyPct, singleMonthlyRent, voidAllowancePct } = data
  const voidMultiplier = 1 - (voidAllowancePct || 0) / 100

  if (["hmo", "rent_to_rent", "student_let", "co_living", "build_to_rent"].includes(profileKey)) {
    const roomTotal = rooms.reduce((sum, r) => sum + r.monthlyRent, 0)
    return roomTotal * voidMultiplier
  }

  if (["serviced_accommodation", "holiday_let"].includes(profileKey)) {
    const daysPerMonth = 30.44
    const adv = adr || 0
    const occ = (occupancyPct || 75) / 100
    return adv * daysPerMonth * occ
  }

  if (profileKey === "dev_flip") {
    return 0
  }

  if (profileKey === "refinancing") {
    return data.currentMonthlyPayment || 0
  }

  return (singleMonthlyRent || 0) * voidMultiplier
}

// ─── Expense Calculations ────────────────────────────────────────────────────

export function calculateMonthlyExpenses(data: PlanningWizardData): number {
  return data.expenses.reduce((sum, e) => sum + e.monthlyAmount, 0)
}

export function calculateMonthlyBills(data: PlanningWizardData): number {
  return data.bills
    .filter((b) => !b.includedInRent)
    .reduce((sum, b) => sum + b.monthlyAmount, 0)
}

export function calculateTotalUpfront(data: PlanningWizardData): number {
  const costs = data.upfrontCosts.reduce((sum, u) => sum + u.amount, 0)
  const compliance = data.complianceItems
    .filter((c) => c.required)
    .reduce((sum, c) => sum + c.amount, 0)
  return costs + compliance
}

// ─── Risk Scoring ────────────────────────────────────────────────────────────

export function calculateRiskScore(
  data: PlanningWizardData,
  result: Partial<PlanningCalculationResult>
): { score: number; warnings: string[] } {
  let score = 0
  const warnings: string[] = []

  const net = result.netMonthlyCashflow ?? 0
  const gross = result.grossMonthlyIncome ?? 0
  const upfront = result.totalUpfrontCash ?? 0

  // Net cashflow risk
  if (net < 0) {
    score += 30
    warnings.push("Negative net cashflow")
  } else if (net < 200) {
    score += 20
    warnings.push("Very low net cashflow")
  } else if (net < 500) {
    score += 10
    warnings.push("Low net cashflow")
  }

  // Margin risk
  const margin = gross > 0 ? net / gross : 0
  if (margin < 0.1) score += 15
  else if (margin < 0.2) score += 8

  // Upfront cash risk
  if (upfront > 100000) score += 10
  else if (upfront > 50000) score += 5

  // Missing data risk
  if (!data.expenses.length) {
    score += 10
    warnings.push("No expenses added")
  }
  if (!data.upfrontCosts.length) {
    score += 8
    warnings.push("No upfront costs defined")
  }
  if (!data.rooms.length && !data.singleMonthlyRent && !data.adr) {
    score += 15
    warnings.push("No income assumptions")
  }

  // Void allowance risk
  if (data.voidAllowancePct < 3) {
    score += 8
    warnings.push("Very low void allowance may be unrealistic")
  }
  if (data.voidAllowancePct > 25) {
    score += 10
    warnings.push("High void allowance — consider demand drivers")
  }

  // Profile-specific risks
  if (data.profileKey === "dev_flip") score += 15
  if (data.profileKey === "serviced_accommodation") score += 10

  return { score: Math.min(score, 100), warnings }
}

export function getRiskStatus(
  score: number
): "Healthy" | "Watch" | "At Risk" | "Critical" | "Needs Data" {
  if (score < 30) return "Healthy"
  if (score < 50) return "Watch"
  if (score < 70) return "At Risk"
  return "Critical"
}

// ─── Main Calculation ────────────────────────────────────────────────────────

export function calculatePlanningSet(
  data: PlanningWizardData,
  scenarioParam?: "pessimistic" | "base" | "optimistic" | ScenarioInputs
): PlanningCalculationResult {
  // Handle legacy scenario strings for backward compatibility
  let workingData = data
  if (typeof scenarioParam === "string") {
    const occupancyMultiplier =
      scenarioParam === "pessimistic" ? 0.8 : scenarioParam === "optimistic" ? 1.0 : 0.9
    const incomeMultiplier =
      scenarioParam === "pessimistic" ? 0.85 : scenarioParam === "optimistic" ? 1.05 : 1.0
    workingData = {
      ...data,
      rooms: data.rooms.map((r) => ({
        ...r,
        monthlyRent: r.monthlyRent * occupancyMultiplier * incomeMultiplier,
      })),
      adr: data.adr ? data.adr * incomeMultiplier : undefined,
      occupancyPct: data.occupancyPct
        ? Math.min(100, data.occupancyPct * occupancyMultiplier)
        : undefined,
    }
  }

  // ── Income ───────────────────────────────────────────────────────────────
  const grossMonthlyIncome = Math.round(calculateGrossIncome(workingData))
  const voidDeduction = 0 // already applied in calculateGrossIncome
  const netMonthlyIncome = grossMonthlyIncome

  // ── Expenses ─────────────────────────────────────────────────────────────
  const landlordCost =
    workingData.landlordMonthlyRent || workingData.mortgageAmount || 0
  const operatingExpenses = calculateMonthlyExpenses(workingData)
  const totalMonthlyBills = calculateMonthlyBills(workingData)
  const totalMonthlyExpenses = Math.round(landlordCost + operatingExpenses + totalMonthlyBills)

  // ── Net ───────────────────────────────────────────────────────────────────
  const netMonthlyCashflow = Math.round(netMonthlyIncome - totalMonthlyExpenses)
  const grossAnnualIncome = grossMonthlyIncome * 12
  const netAnnualCashflow = netMonthlyCashflow * 12

  // ── Upfront ───────────────────────────────────────────────────────────────
  const upfrontCashRaw = workingData.upfrontCosts.reduce((s, u) => s + u.amount, 0)
  const complianceCashRaw = workingData.complianceItems
    .filter((c) => c.required)
    .reduce((s, c) => s + c.amount, 0)
  const totalUpfrontCash = Math.round(upfrontCashRaw + complianceCashRaw)

  // ── Yields ────────────────────────────────────────────────────────────────
  const propValue =
    workingData.propertyValue || workingData.purchasePrice || 0
  const grossYield =
    propValue > 0 ? Math.round(((grossAnnualIncome / propValue) * 100) * 10) / 10 : 0
  const netYield =
    propValue > 0 ? Math.round(((netAnnualCashflow / propValue) * 100) * 10) / 10 : 0
  const roi =
    totalUpfrontCash > 0
      ? Math.round(((netAnnualCashflow / totalUpfrontCash) * 100) * 10) / 10
      : 0
  const breakevenMonth =
    netMonthlyCashflow > 0 ? Math.ceil(totalUpfrontCash / netMonthlyCashflow) : 999

  // ── Profile-specific ──────────────────────────────────────────────────────
  let operatorMargin: number | undefined
  let operatorMarginPct: number | undefined
  if (workingData.profileKey === "rent_to_rent") {
    const roomIncome = workingData.rooms.reduce((s, r) => s + r.monthlyRent, 0)
    operatorMargin = Math.round(
      roomIncome - (workingData.landlordMonthlyRent || 0) - totalMonthlyBills
    )
    operatorMarginPct =
      roomIncome > 0
        ? Math.round((operatorMargin / roomIncome) * 100 * 10) / 10
        : 0
  }

  let grossProfit: number | undefined
  if (workingData.profileKey === "dev_flip") {
    const totalCosts = (workingData.purchasePrice || 0) + totalUpfrontCash
    grossProfit = Math.round((workingData.gdv || 0) - totalCosts)
  }

  let monthlySaving: number | undefined
  if (workingData.profileKey === "refinancing") {
    monthlySaving = Math.round(
      (workingData.currentMonthlyPayment || 0) - (workingData.newMonthlyPayment || 0)
    )
  }

  const perRoomMargin =
    workingData.rooms.length > 0
      ? Math.round(netMonthlyCashflow / workingData.rooms.length)
      : undefined

  // ── Risk ──────────────────────────────────────────────────────────────────
  const { score: riskScore, warnings } = calculateRiskScore(workingData, {
    grossMonthlyIncome,
    netMonthlyCashflow,
    totalUpfrontCash,
  })
  const riskStatus = getRiskStatus(riskScore)

  // ── Legacy monthly projection ─────────────────────────────────────────────
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  let cumulative = -totalUpfrontCash
  const monthlyProjection: MonthlyProjection[] = months.map((label, i) => {
    cumulative += netMonthlyCashflow
    return {
      month: i + 1,
      label,
      grossIncome: grossMonthlyIncome,
      expenses: totalMonthlyExpenses,
      netIncome: netMonthlyCashflow,
      cumulativeNet: Math.round(cumulative),
    }
  })

  // ── Legacy risk factors ───────────────────────────────────────────────────
  const riskFactors: RiskFactor[] = [
    {
      label: "Net margin",
      score:
        netMonthlyCashflow < 200
          ? 25
          : netMonthlyCashflow < 400
          ? 15
          : netMonthlyCashflow < 600
          ? 8
          : 0,
      maxScore: 25,
      description:
        netMonthlyCashflow < 200
          ? "Very thin margin — vulnerable to any voids or cost increase"
          : netMonthlyCashflow < 400
          ? "Moderate margin — some buffer"
          : "Good margin — resilient to surprises",
      severity:
        netMonthlyCashflow < 200 ? "high" : netMonthlyCashflow < 400 ? "medium" : "low",
    },
    {
      label: "Upfront commitment",
      score:
        totalUpfrontCash > 15000
          ? 20
          : totalUpfrontCash > 8000
          ? 12
          : totalUpfrontCash > 3000
          ? 6
          : 0,
      maxScore: 20,
      description:
        totalUpfrontCash > 15000
          ? "High capital commitment — significant exposure"
          : totalUpfrontCash > 8000
          ? "Moderate upfront investment"
          : "Low upfront cost — good entry point",
      severity:
        totalUpfrontCash > 15000 ? "high" : totalUpfrontCash > 8000 ? "medium" : "low",
    },
    {
      label: "Breakeven speed",
      score: breakevenMonth > 18 ? 20 : breakevenMonth > 12 ? 14 : breakevenMonth > 6 ? 8 : 0,
      maxScore: 20,
      description:
        breakevenMonth > 18
          ? `${breakevenMonth} months to breakeven — very slow recovery`
          : breakevenMonth > 12
          ? `${breakevenMonth} months to breakeven — slow`
          : `${breakevenMonth} months to breakeven — acceptable`,
      severity: breakevenMonth > 18 ? "high" : breakevenMonth > 12 ? "medium" : "low",
    },
    {
      label: "Void exposure",
      score:
        (workingData.voidAllowancePct || 0) < 3
          ? 10
          : (workingData.voidAllowancePct || 0) < 5
          ? 5
          : 0,
      maxScore: 10,
      description:
        (workingData.voidAllowancePct || 0) < 3
          ? "Void allowance very low — underestimating vacancy risk"
          : (workingData.voidAllowancePct || 0) < 5
          ? "Void allowance conservative"
          : "Good void buffer in model",
      severity: (workingData.voidAllowancePct || 0) < 3 ? "medium" : "low",
    },
  ]

  return {
    grossMonthlyIncome,
    voidDeduction,
    netMonthlyIncome,
    totalMonthlyExpenses,
    totalMonthlyBills: Math.round(totalMonthlyBills),
    netMonthlyCashflow,
    grossAnnualIncome,
    netAnnualCashflow,
    totalUpfrontCash,
    grossYield,
    netYield,
    roi,
    breakevenMonth,
    operatorMargin,
    operatorMarginPct,
    perRoomMargin,
    grossProfit,
    monthlySaving,
    riskScore,
    riskStatus,
    warnings,
    // Legacy fields
    landlordCost: Math.round(landlordCost),
    netAnnualIncome: netAnnualCashflow,
    upfrontCash: Math.round(upfrontCashRaw),
    complianceCash: Math.round(complianceCashRaw),
    riskFactors,
    monthlyProjection,
  }
}

// ─── Scenario Calculation ────────────────────────────────────────────────────

export function calculateScenario(
  data: PlanningWizardData,
  scenario: ScenarioInputs
): PlanningCalculationResult {
  const incomeAdj = scenario.incomeAdjPct ?? 0
  const costAdj = scenario.costAdjPct ?? 0
  const occupancyAdj = scenario.occupancyAdjPct ?? 0

  const adjusted: PlanningWizardData = {
    ...data,
    rooms: data.rooms.map((r) => ({
      ...r,
      monthlyRent: r.monthlyRent * (1 + incomeAdj / 100),
    })),
    adr: data.adr ? data.adr * (1 + incomeAdj / 100) : undefined,
    occupancyPct: data.occupancyPct
      ? Math.min(100, data.occupancyPct * (1 + occupancyAdj / 100))
      : undefined,
    expenses: data.expenses.map((e) => ({
      ...e,
      monthlyAmount: e.monthlyAmount * (1 + costAdj / 100),
    })),
    bills: data.bills.map((b) => ({
      ...b,
      monthlyAmount: b.monthlyAmount * (1 + costAdj / 100),
    })),
  }
  return calculatePlanningSet(adjusted)
}

// ─── Formatting Helpers ──────────────────────────────────────────────────────

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

// ─── New Standalone Calculation Functions ────────────────────────────────────

/**
 * Convert an array of income lines to a total monthly figure.
 * Handles frequency: 'weekly' (× 52/12), 'annual' (÷ 12), 'monthly' (as-is).
 */
export function calcGrossMonthly(
  lines: Array<{ amount: number; frequency: string; quantity?: number }>
): number {
  return lines.reduce((sum, line) => {
    const qty = line.quantity ?? 1
    let monthly: number
    switch (line.frequency) {
      case "weekly":
        monthly = (line.amount * 52) / 12
        break
      case "annual":
      case "yearly":
        monthly = line.amount / 12
        break
      case "quarterly":
        monthly = line.amount / 3
        break
      default:
        monthly = line.amount
    }
    return sum + monthly * qty
  }, 0)
}

/**
 * Net monthly cashflow = gross - operating expenses - bills - financing costs.
 */
export function calcNetMonthly(
  gross: number,
  expenses: number,
  bills: number,
  financing: number
): number {
  return gross - expenses - bills - financing
}

/**
 * Annualised cashflow from a monthly figure.
 */
export function calcAnnualCashflow(netMonthly: number): number {
  return netMonthly * 12
}

/**
 * Gross yield as a percentage of property value.
 * Returns 0 if propertyValue is 0 or negative.
 */
export function calcGrossYield(grossMonthly: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0
  return (grossMonthly * 12 / propertyValue) * 100
}

/**
 * Net yield as a percentage of property value.
 * Returns 0 if propertyValue is 0 or negative.
 */
export function calcNetYield(netMonthly: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0
  return (netMonthly * 12 / propertyValue) * 100
}

/**
 * Return on investment as a percentage of upfront cash deployed.
 * Returns 0 if upfrontCash is 0 or negative.
 */
export function calcROI(annualNet: number, upfrontCash: number): number {
  if (upfrontCash <= 0) return 0
  return (annualNet / upfrontCash) * 100
}

/**
 * Number of months to recover upfront cash at the given net monthly cashflow.
 * Returns 0 if netMonthly is 0 or negative (never breaks even).
 */
export function calcBreakevenMonths(upfrontCash: number, netMonthly: number): number {
  if (netMonthly <= 0) return 0
  return Math.ceil(upfrontCash / netMonthly)
}

/**
 * Operator margin as a percentage of gross income.
 * Returns 0 if grossMonthly is 0 or negative.
 */
export function calcMarginPct(netMonthly: number, grossMonthly: number): number {
  if (grossMonthly <= 0) return 0
  return (netMonthly / grossMonthly) * 100
}

/**
 * Simple risk score (0–100) derived from profile metadata and runtime factors.
 * - Base from riskLevel:  Low=20, Medium=45, High=75
 * - +10 if managementIntensity is 'High'
 * - -5  if occupancyRate > 0.9
 * - +10 if hasAllCompliance is false
 */
export function calcRiskScore(factors: {
  riskLevel: string
  managementIntensity: string
  occupancyRate?: number
  hasAllCompliance?: boolean
}): number {
  const riskLevel = factors.riskLevel.toLowerCase()
  let score = riskLevel === "low" ? 20 : riskLevel === "high" ? 75 : 45

  if (factors.managementIntensity.toLowerCase() === "high") {
    score += 10
  }
  if ((factors.occupancyRate ?? 1) > 0.9) {
    score -= 5
  }
  if (factors.hasAllCompliance === false) {
    score += 10
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Conversion readiness as a percentage (0–100).
 * Counts required checklist items with status === 'complete', over total required items.
 * Returns 0 if no required items exist.
 */
export function calcConversionReadinessPct(
  checklist: Array<{ required: boolean; status: string }>
): number {
  const required = checklist.filter((item) => item.required)
  if (required.length === 0) return 0
  const completed = required.filter((item) => item.status === "complete").length
  return (completed / required.length) * 100
}

/**
 * Build a month-by-month forecast array.
 * - Income grows at incomeGrowthPctYearly per year (compounded monthly)
 * - Costs grow at costGrowthPctYearly per year (compounded monthly)
 * - Cumulative cashflow starts from 0 (upfront cost is tracked separately)
 */
export function calcForecastMonths(inputs: ScenarioInputs, months: number): ForecastMonth[] {
  const {
    baseRentMonthly,
    occupancyRate,
    operatingCostsPct,
    billsMonthly,
    financingMonthly,
    incomeGrowthPctYearly,
    costGrowthPctYearly,
  } = inputs

  const monthlyIncomeGrowth = Math.pow(1 + incomeGrowthPctYearly / 100, 1 / 12) - 1
  const monthlyCostGrowth = Math.pow(1 + costGrowthPctYearly / 100, 1 / 12) - 1

  let cumulativeCashflow = 0
  const result: ForecastMonth[] = []

  // Compute a reference start date: first day of next month
  const startDate = new Date()
  startDate.setDate(1)
  startDate.setMonth(startDate.getMonth() + 1)

  for (let i = 0; i < months; i++) {
    const incomeMultiplier = Math.pow(1 + monthlyIncomeGrowth, i)
    const costMultiplier = Math.pow(1 + monthlyCostGrowth, i)

    const grossIncome = Math.round(baseRentMonthly * occupancyRate * incomeMultiplier * 100) / 100
    const operatingCosts = Math.round(grossIncome * operatingCostsPct * costMultiplier * 100) / 100
    const bills = Math.round(billsMonthly * costMultiplier * 100) / 100
    const financingCosts = Math.round(financingMonthly * costMultiplier * 100) / 100
    const netCashflow = Math.round((grossIncome - operatingCosts - bills - financingCosts) * 100) / 100

    cumulativeCashflow = Math.round((cumulativeCashflow + netCashflow) * 100) / 100

    // Build ISO date string for this month
    const d = new Date(startDate)
    d.setMonth(d.getMonth() + i)
    const monthDate = d.toISOString().slice(0, 10) // YYYY-MM-DD

    result.push({
      monthIndex: i,
      monthDate,
      grossIncome,
      operatingCosts,
      bills,
      financingCosts,
      netCashflow,
      cumulativeCashflow,
    })
  }

  return result
}

/**
 * Derive a scenario variant from a base ScenarioInputs object.
 * - optimistic:    occupancy +0.05, rent +10%, costs -5%
 * - conservative:  occupancy -0.05, rent -10%, costs +10%
 * - stress:        occupancy -0.15, rent -20%, costs +20%
 */
export function calcScenarioVariant(
  base: ScenarioInputs,
  type: "optimistic" | "conservative" | "stress"
): ScenarioInputs {
  const clampOccupancy = (v: number) => Math.max(0, Math.min(1, v))

  switch (type) {
    case "optimistic":
      return {
        ...base,
        baseRentMonthly: base.baseRentMonthly * 1.1,
        occupancyRate: clampOccupancy(base.occupancyRate + 0.05),
        operatingCostsPct: base.operatingCostsPct * 0.95,
      }
    case "conservative":
      return {
        ...base,
        baseRentMonthly: base.baseRentMonthly * 0.9,
        occupancyRate: clampOccupancy(base.occupancyRate - 0.05),
        operatingCostsPct: base.operatingCostsPct * 1.1,
      }
    case "stress":
      return {
        ...base,
        baseRentMonthly: base.baseRentMonthly * 0.8,
        occupancyRate: clampOccupancy(base.occupancyRate - 0.15),
        operatingCostsPct: base.operatingCostsPct * 1.2,
      }
  }
}
