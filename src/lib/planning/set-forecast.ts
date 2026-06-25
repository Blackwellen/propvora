// ─── Planning Set forecast/scenario derivation ─────────────────────────────────
// A planning_sets row already stores authoritative computed summary financials
// (gross_monthly_income, total_monthly_expenses, net_monthly_income,
// upfront_cash_required …). The per-set Forecasts and Scenarios tabs project those
// forward through the shared engine rather than querying line tables (which are
// profile-scoped) or a planning_forecasts table (which does not exist). This keeps
// the projection consistent with the figures shown on the set's Overview.

import {
  calcForecastMonths,
  calcScenarioVariant,
  type ScenarioInputs,
  type ForecastMonth,
} from "./calculations"

export interface PlanningSetSummary {
  gross_monthly_income?: number | null
  total_monthly_expenses?: number | null
  net_monthly_income?: number | null
  upfront_cash_required?: number | null
}

/** True when the set has enough stored financials to project a forecast. */
export function hasSetFinancials(set: PlanningSetSummary | null | undefined): boolean {
  if (!set) return false
  return Number(set.gross_monthly_income ?? 0) > 0 || Number(set.net_monthly_income ?? 0) !== 0
}

/** Build engine ScenarioInputs from a set row's stored summary figures. */
export function scenarioInputsFromSet(set: PlanningSetSummary): ScenarioInputs {
  const gross = Math.max(0, Number(set.gross_monthly_income ?? 0))
  const net = set.net_monthly_income != null ? Number(set.net_monthly_income) : null
  const expenses = Math.max(0, Number(set.total_monthly_expenses ?? 0))
  // Express all costs as a single operating-cost ratio of gross. Prefer deriving it
  // from the stored net so the base projection reproduces the set's Overview net
  // exactly (incl. loss-making plans); fall back to the expense total otherwise.
  // Capped generously to guard against pathological ratios, not normal losses.
  const rawPct = gross > 0
    ? (net != null ? (gross - net) / gross : expenses / gross)
    : 0
  const operatingCostsPct = Math.max(0, Math.min(6, rawPct))
  return {
    baseRentMonthly: gross,
    occupancyRate: 1,
    operatingCostsPct,
    billsMonthly: 0,
    financingMonthly: 0,
    upfrontCash: Math.max(0, Number(set.upfront_cash_required ?? 0)),
    incomeGrowthPctYearly: 0,
    costGrowthPctYearly: 0,
  }
}

export type ForecastScenarioType = "base" | "optimistic" | "conservative" | "stress"

/** Project `months` of forecast for a given scenario type from the set summary. */
export function forecastForSet(
  set: PlanningSetSummary,
  type: ForecastScenarioType,
  months = 24,
): ForecastMonth[] {
  const base = scenarioInputsFromSet(set)
  const inputs = type === "base" ? base : calcScenarioVariant(base, type)
  return calcForecastMonths(inputs, months)
}

export interface DerivedScenario {
  type: ForecastScenarioType
  name: string
  grossMonthly: number
  netMonthly: number
  annualNet: number
  marginPct: number
  occupancyPct: number
}

const SCENARIO_NAMES: Record<ForecastScenarioType, string> = {
  base: "Base Case",
  optimistic: "Optimistic",
  conservative: "Conservative",
  stress: "Stress Test",
}

/** Derive the four standard scenarios from the set summary, using the shared engine. */
export function deriveScenariosFromSet(set: PlanningSetSummary): DerivedScenario[] {
  const base = scenarioInputsFromSet(set)
  const types: ForecastScenarioType[] = ["base", "optimistic", "conservative", "stress"]
  return types.map((type) => {
    const inputs = type === "base" ? base : calcScenarioVariant(base, type)
    const grossMonthly = inputs.baseRentMonthly * inputs.occupancyRate
    const operatingCosts = grossMonthly * inputs.operatingCostsPct
    const netMonthly = grossMonthly - operatingCosts - inputs.billsMonthly - inputs.financingMonthly
    const marginPct = grossMonthly > 0 ? (netMonthly / grossMonthly) * 100 : 0
    return {
      type,
      name: SCENARIO_NAMES[type],
      grossMonthly: Math.round(grossMonthly),
      netMonthly: Math.round(netMonthly),
      annualNet: Math.round(netMonthly * 12),
      marginPct: Math.round(marginPct * 10) / 10,
      occupancyPct: Math.round(inputs.occupancyRate * 100),
    }
  })
}
