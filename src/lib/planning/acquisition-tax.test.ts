import { describe, it, expect } from "vitest"
import { acquisitionTax } from "./acquisition-tax"

describe("acquisitionTax — England SDLT", () => {
  it("computes progressive SDLT on £300k", () => {
    // 0–125k @0 + 125–250k @2% (2500) + 250–300k @5% (2500) = 5000
    const r = acquisitionTax({ countryCode: "GB", price: 300_000 })
    expect(r.taxName).toBe("SDLT")
    expect(r.total).toBeCloseTo(5000)
  })
  it("adds the additional-dwelling +5% per band", () => {
    const base = acquisitionTax({ countryCode: "GB", price: 300_000 }).total
    const add = acquisitionTax({ countryCode: "GB", price: 300_000, isAdditional: true }).total
    // +5% on the full 300k = +15000
    expect(add - base).toBeCloseTo(15_000)
  })
  it("adds the non-resident +2% per band", () => {
    const base = acquisitionTax({ countryCode: "GB", price: 300_000 }).total
    const nr = acquisitionTax({ countryCode: "GB", price: 300_000, isNonResident: true }).total
    expect(nr - base).toBeCloseTo(6_000)
  })
})

describe("acquisitionTax — Scotland LBTT + ADS", () => {
  it("LBTT on £300k", () => {
    // 0–145k @0 + 145–250k @2% (2100) + 250–300k @5% (2500) = 4600
    const r = acquisitionTax({ countryCode: "GB", region: "SCT", price: 300_000 })
    expect(r.taxName).toBe("LBTT")
    expect(r.total).toBeCloseTo(4600)
  })
  it("ADS adds 8% of the full price as a surcharge", () => {
    const r = acquisitionTax({ countryCode: "GB", region: "SCT", price: 300_000, isAdditional: true })
    expect(r.surcharges[0].amount).toBeCloseTo(24_000)
    expect(r.total).toBeCloseTo(4600 + 24_000)
  })
})

describe("acquisitionTax — Wales LTT", () => {
  it("uses higher-rate bands for additional dwellings", () => {
    const main = acquisitionTax({ countryCode: "GB", region: "WLS", price: 300_000 }).total
    const higher = acquisitionTax({ countryCode: "GB", region: "WLS", price: 300_000, isAdditional: true }).total
    expect(higher).toBeGreaterThan(main)
  })
})

describe("acquisitionTax — flat-rate jurisdictions", () => {
  it("Germany Grunderwerbsteuer ~5%", () => {
    expect(acquisitionTax({ countryCode: "DE", price: 400_000 }).total).toBeCloseTo(20_000)
  })
  it("Ireland stamp duty steps to 2% above €1m", () => {
    expect(acquisitionTax({ countryCode: "IE", price: 500_000 }).total).toBeCloseTo(5_000)
    expect(acquisitionTax({ countryCode: "IE", price: 2_000_000 }).total).toBeCloseTo(40_000)
  })
  it("unknown jurisdiction returns zero + a 'set your own' citation", () => {
    const r = acquisitionTax({ countryCode: "ZZ", price: 300_000 })
    expect(r.total).toBe(0)
    expect(r.citation).toMatch(/set and verify your own/i)
  })
})
