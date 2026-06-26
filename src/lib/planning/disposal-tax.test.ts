import { describe, it, expect } from "vitest"
import { disposalTax } from "./disposal-tax"

describe("disposalTax — UK", () => {
  it("higher-rate residential CGT 24% + 60-day reporting", () => {
    const r = disposalTax({ countryCode: "GB", gain: 100_000, higherRate: true })
    expect(r.rate).toBe(0.24)
    expect(r.taxAmount).toBeCloseTo(24_000)
    expect(r.reportingDeadlineDays).toBe(60)
  })
  it("basic-rate CGT 18%", () => {
    expect(disposalTax({ countryCode: "GB", gain: 100_000 }).rate).toBe(0.18)
  })
  it("main residence is exempt (PRR)", () => {
    expect(disposalTax({ countryCode: "GB", gain: 100_000, isMainResidence: true }).taxAmount).toBe(0)
  })
})

describe("disposalTax — holding-period exemptions", () => {
  it("Germany exempt after 10-year hold", () => {
    expect(disposalTax({ countryCode: "DE", gain: 100_000, holdingYears: 11 }).taxAmount).toBe(0)
  })
  it("Germany taxed within 10 years", () => {
    expect(disposalTax({ countryCode: "DE", gain: 100_000, holdingYears: 3 }).taxAmount).toBeGreaterThan(0)
  })
  it("Italy exempt after 5 years", () => {
    expect(disposalTax({ countryCode: "IT", gain: 100_000, holdingYears: 6 }).taxAmount).toBe(0)
  })
})

describe("disposalTax — non-resident withholding", () => {
  it("US FIRPTA 15% withholding for non-resident", () => {
    expect(disposalTax({ countryCode: "US", gain: 100_000, isNonResident: true }).withholding).toBeCloseTo(15_000)
  })
  it("Spain 3% non-resident retention", () => {
    expect(disposalTax({ countryCode: "ES", gain: 100_000, isNonResident: true }).withholding).toBeCloseTo(3_000)
  })
})
