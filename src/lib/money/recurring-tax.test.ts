import { describe, it, expect } from "vitest"
import { recurringTax, estimateRecurringTax } from "./recurring-tax"

describe("recurringTax", () => {
  it("UK = Council Tax, occupier, band-based (no % rate)", () => {
    const r = recurringTax("GB")
    expect(r.taxName).toBe("Council Tax")
    expect(r.payer).toBe("occupier")
    expect(r.indicativeRatePct).toBeNull()
  })
  it("Ireland = LPT, landlord pays", () => {
    expect(recurringTax("IE").payer).toBe("landlord")
  })
  it("UAE = none", () => {
    expect(recurringTax("AE").basis).toBe("none")
  })
  it("estimate uses the % rate where present (ES IBI)", () => {
    expect(estimateRecurringTax(recurringTax("ES"), 200_000)).toBeCloseTo(1200)
  })
  it("estimate is null for band/rates-based jurisdictions", () => {
    expect(estimateRecurringTax(recurringTax("GB"), 200_000)).toBeNull()
  })
})
