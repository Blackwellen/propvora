import { describe, it, expect } from "vitest"
import {
  calcGrossMonthly,
  calcNetMonthly,
  calcAnnualCashflow,
  calcGrossYield,
  calcNetYield,
  calcROI,
  calcBreakevenMonths,
  calcMarginPct,
  calcRiskScore,
  calcConversionReadinessPct,
  calcForecastMonths,
  calcScenarioVariant,
  type ScenarioInputs,
} from "@/lib/planning/calculations"

describe("planning calculators — pure maths", () => {
  describe("calcGrossMonthly", () => {
    it("normalises weekly / annual / quarterly / monthly frequencies", () => {
      const lines = [
        { amount: 100, frequency: "weekly" }, // 100 * 52 / 12 = 433.33
        { amount: 1200, frequency: "annual" }, // 100
        { amount: 300, frequency: "quarterly" }, // 100
        { amount: 100, frequency: "monthly" }, // 100
      ]
      expect(calcGrossMonthly(lines)).toBeCloseTo(733.333, 2)
    })

    it("multiplies by quantity", () => {
      expect(calcGrossMonthly([{ amount: 500, frequency: "monthly", quantity: 3 }])).toBe(1500)
    })

    it("treats unknown frequency as monthly", () => {
      expect(calcGrossMonthly([{ amount: 250, frequency: "fortnightly" }])).toBe(250)
    })
  })

  describe("calcNetMonthly / calcAnnualCashflow", () => {
    it("subtracts all cost categories", () => {
      expect(calcNetMonthly(2000, 300, 150, 800)).toBe(750)
    })
    it("can go negative", () => {
      expect(calcNetMonthly(1000, 400, 400, 400)).toBe(-200)
    })
    it("annualises monthly figure", () => {
      expect(calcAnnualCashflow(750)).toBe(9000)
    })
  })

  describe("yield / ROI / margin guards against divide-by-zero", () => {
    it("gross yield as % of property value", () => {
      // 1000/mo * 12 = 12000; over 200000 = 6%
      expect(calcGrossYield(1000, 200000)).toBeCloseTo(6, 5)
    })
    it("net yield as % of property value", () => {
      expect(calcNetYield(500, 200000)).toBeCloseTo(3, 5)
    })
    it("returns 0 when property value is zero or negative", () => {
      expect(calcGrossYield(1000, 0)).toBe(0)
      expect(calcNetYield(1000, -10)).toBe(0)
    })
    it("ROI over upfront cash deployed", () => {
      expect(calcROI(9000, 30000)).toBeCloseTo(30, 5)
    })
    it("ROI returns 0 when no cash deployed", () => {
      expect(calcROI(9000, 0)).toBe(0)
    })
    it("margin pct returns 0 when gross is zero", () => {
      expect(calcMarginPct(500, 0)).toBe(0)
      expect(calcMarginPct(750, 2000)).toBeCloseTo(37.5, 5)
    })
  })

  describe("calcBreakevenMonths", () => {
    it("rounds up to whole months", () => {
      expect(calcBreakevenMonths(10000, 750)).toBe(14) // 13.33 -> 14
    })
    it("returns 0 (never breaks even) when net is non-positive", () => {
      expect(calcBreakevenMonths(10000, 0)).toBe(0)
      expect(calcBreakevenMonths(10000, -100)).toBe(0)
    })
  })

  describe("calcRiskScore", () => {
    it("low risk, healthy occupancy, full compliance => clamped low", () => {
      expect(
        calcRiskScore({
          riskLevel: "Low",
          managementIntensity: "Low",
          occupancyRate: 0.95,
          hasAllCompliance: true,
        })
      ).toBe(15) // 20 base - 5 occupancy
    })
    it("high risk + high intensity + missing compliance stacks but clamps at 100", () => {
      expect(
        calcRiskScore({
          riskLevel: "High",
          managementIntensity: "High",
          occupancyRate: 0.5,
          hasAllCompliance: false,
        })
      ).toBe(95) // 75 + 10 + 10
    })
    it("clamps to 0..100", () => {
      const s = calcRiskScore({ riskLevel: "low", managementIntensity: "low", occupancyRate: 0.99 })
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    })
  })

  describe("calcConversionReadinessPct", () => {
    it("counts only required items, completed over total", () => {
      const pct = calcConversionReadinessPct([
        { required: true, status: "complete" },
        { required: true, status: "pending" },
        { required: false, status: "pending" }, // ignored
      ])
      expect(pct).toBe(50)
    })
    it("returns 0 when there are no required items", () => {
      expect(calcConversionReadinessPct([{ required: false, status: "complete" }])).toBe(0)
    })
  })

  describe("calcForecastMonths", () => {
    const base: ScenarioInputs = {
      baseRentMonthly: 1000,
      occupancyRate: 1,
      operatingCostsPct: 0.2,
      billsMonthly: 100,
      financingMonthly: 400,
      upfrontCash: 5000,
      incomeGrowthPctYearly: 0,
      costGrowthPctYearly: 0,
    }

    it("produces the requested number of months", () => {
      expect(calcForecastMonths(base, 12)).toHaveLength(12)
    })

    it("with no growth, every month is identical and cumulative is linear", () => {
      const rows = calcForecastMonths(base, 3)
      // gross 1000, opex 200, bills 100, financing 400 => net 300
      for (const r of rows) {
        expect(r.grossIncome).toBe(1000)
        expect(r.operatingCosts).toBe(200)
        expect(r.netCashflow).toBe(300)
      }
      expect(rows[0].cumulativeCashflow).toBe(300)
      expect(rows[2].cumulativeCashflow).toBe(900)
    })

    it("income growth compounds month over month", () => {
      const rows = calcForecastMonths({ ...base, incomeGrowthPctYearly: 12 }, 13)
      // month 0 is the base, month 12 (one full year) should be ~12% higher
      expect(rows[12].grossIncome).toBeGreaterThan(rows[0].grossIncome)
      expect(rows[12].grossIncome).toBeCloseTo(1120, 0)
    })
  })

  describe("calcScenarioVariant", () => {
    const base: ScenarioInputs = {
      baseRentMonthly: 1000,
      occupancyRate: 0.9,
      operatingCostsPct: 0.3,
      billsMonthly: 100,
      financingMonthly: 400,
      upfrontCash: 5000,
      incomeGrowthPctYearly: 3,
      costGrowthPctYearly: 3,
    }

    it("optimistic raises rent + occupancy, lowers costs", () => {
      const v = calcScenarioVariant(base, "optimistic")
      expect(v.baseRentMonthly).toBeCloseTo(1100, 5)
      expect(v.occupancyRate).toBeCloseTo(0.95, 5)
      expect(v.operatingCostsPct).toBeCloseTo(0.285, 5)
    })

    it("stress clamps occupancy into [0,1]", () => {
      const v = calcScenarioVariant({ ...base, occupancyRate: 0.1 }, "stress")
      expect(v.occupancyRate).toBeGreaterThanOrEqual(0)
      expect(v.occupancyRate).toBeLessThanOrEqual(1)
    })

    it("conservative drops rent and lifts costs", () => {
      const v = calcScenarioVariant(base, "conservative")
      expect(v.baseRentMonthly).toBeCloseTo(900, 5)
      expect(v.operatingCostsPct).toBeCloseTo(0.33, 5)
    })
  })
})
