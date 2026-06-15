/**
 * Propvora Smoke Tests
 *
 * Lightweight sanity checks on the planning calculation module, run by Vitest
 * (`npm test`). These complement the focused pure-function suites in this folder.
 */
import { describe, it, expect } from "vitest"
import { existsSync } from "node:fs"
import {
  calculatePlanningSet,
  formatCurrency,
  formatPercent,
} from "@/lib/planning/calculations"

describe("Propvora smoke tests", () => {
  it("should have an env example file checked in", () => {
    expect(existsSync(".env.example")).toBe(true)
  })

  it("should export planning calculation functions", () => {
    expect(typeof calculatePlanningSet).toBe("function")
    expect(typeof formatCurrency).toBe("function")
    expect(typeof formatPercent).toBe("function")
  })

  it("returns the expected structure for a rent-to-rent profile", () => {
    const result = calculatePlanningSet({
      profileKey: "rent_to_rent",
      propertyName: "Test HMO",
      address: "1 Test Street",
      postcode: "TE1 1ST",
      numUnits: 1,
      rooms: [
        { id: "1", name: "Room 1", type: "single", monthlyRent: 600 },
        { id: "2", name: "Room 2", type: "single", monthlyRent: 600 },
      ],
      voidAllowancePct: 5,
      landlordMonthlyRent: 700,
      expenses: [{ id: "1", label: "Management", category: "management", monthlyAmount: 100 }],
      bills: [
        { id: "1", label: "Utilities", provider: "OVO", monthlyAmount: 200, includedInRent: false },
      ],
      upfrontCosts: [{ id: "1", label: "Deposit", category: "deposit", amount: 2000 }],
      complianceItems: [],
      status: "draft",
    })

    expect(result).toHaveProperty("grossMonthlyIncome")
    expect(result).toHaveProperty("netMonthlyIncome")
    expect(result).toHaveProperty("riskScore")
    expect(result).toHaveProperty("totalUpfrontCash")
    expect(result).toHaveProperty("monthlyProjection")
    expect(result.grossMonthlyIncome).toBeGreaterThan(0)
    expect(Array.isArray(result.monthlyProjection)).toBe(true)
    expect(result.monthlyProjection!.length).toBeGreaterThan(0)
  })

  it("risk score is a number between 0 and 100", () => {
    const result = calculatePlanningSet({
      profileKey: "rent_to_rent",
      propertyName: "Test",
      address: "",
      postcode: "",
      numUnits: 1,
      rooms: [{ id: "1", name: "Room 1", type: "single", monthlyRent: 400 }],
      voidAllowancePct: 10,
      landlordMonthlyRent: 600,
      expenses: [],
      bills: [],
      upfrontCosts: [],
      complianceItems: [],
      status: "draft",
    })

    expect(typeof result.riskScore).toBe("number")
    expect(result.riskScore).toBeGreaterThanOrEqual(0)
    expect(result.riskScore).toBeLessThanOrEqual(100)
  })
})
