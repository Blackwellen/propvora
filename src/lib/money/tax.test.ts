import { describe, it, expect } from "vitest"
import { taxScheme, computeTax } from "./tax"

describe("taxScheme", () => {
  it("UK = VAT 20%", () => {
    const s = taxScheme("GB")
    expect(s.system).toBe("VAT")
    expect(s.standardRate).toBe(0.2)
  })
  it("Australia = GST 10%", () => {
    expect(taxScheme("AU").system).toBe("GST")
  })
  it("US = sales tax (state-set, 0 default)", () => {
    expect(taxScheme("US").system).toBe("sales_tax")
  })
  it("unknown = none", () => {
    expect(taxScheme("ZZ").system).toBe("none")
  })
})

describe("computeTax", () => {
  it("service in UK = 20% VAT", () => {
    const r = computeTax({ countryCode: "GB", net: 1000, category: "service" })
    expect(r.taxAmount).toBeCloseTo(200)
    expect(r.gross).toBeCloseTo(1200)
  })
  it("residential rent is exempt (no VAT line)", () => {
    const r = computeTax({ countryCode: "GB", net: 1000, category: "rent" })
    expect(r.taxAmount).toBe(0)
    expect(r.note).toMatch(/exempt/i)
  })
  it("cross-border B2B EU service = reverse charge", () => {
    const r = computeTax({ countryCode: "DE", net: 1000, category: "service", b2bCrossBorder: true })
    expect(r.reverseCharge).toBe(true)
    expect(r.taxAmount).toBe(0)
    expect(r.note).toMatch(/reverse charge/i)
  })
  it("Germany domestic service = 19% VAT", () => {
    expect(computeTax({ countryCode: "DE", net: 1000, category: "service" }).taxAmount).toBeCloseTo(190)
  })
  it("explicit override rate wins", () => {
    expect(computeTax({ countryCode: "GB", net: 1000, category: "service", overrideRate: 0.05 }).taxAmount).toBeCloseTo(50)
  })
})
