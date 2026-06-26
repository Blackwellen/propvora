import { describe, it, expect } from "vitest"
import { fxConvert, rollup, fxKey, type FxRateMap } from "./fx"

const rates: FxRateMap = {
  "GBP>EUR": 1.18,
  "GBP>AED": 4.62,
  "EUR>GBP": 0.847,
  "AED>GBP": 0.216,
}

describe("fxConvert", () => {
  it("identity when same currency", () => {
    expect(fxConvert(100, "GBP", "GBP", rates)).toBe(100)
  })
  it("direct rate", () => {
    expect(fxConvert(100, "GBP", "EUR", rates)).toBeCloseTo(118)
  })
  it("inverse rate when no direct pair", () => {
    // No "USD>GBP" or "GBP>USD"; but EUR>GBP exists so EUR→? uses it for inverse paths
    expect(fxConvert(100, "EUR", "GBP", rates)).toBeCloseTo(84.7)
  })
  it("pivots via GBP", () => {
    // EUR → AED has no direct/inverse; pivot EUR→GBP (0.847) then GBP→AED (4.62)
    expect(fxConvert(100, "EUR", "AED", rates)).toBeCloseTo(100 * 0.847 * 4.62)
  })
  it("returns null when no path exists", () => {
    expect(fxConvert(100, "JPY", "EUR", rates)).toBeNull()
  })
})

describe("rollup", () => {
  it("sums into reporting currency with per-currency breakdown", () => {
    const r = rollup(
      [
        { amount: 1000, currency: "GBP" },
        { amount: 1000, currency: "EUR" },
        { amount: 500, currency: "GBP" },
      ],
      "GBP",
      rates,
    )
    // 1500 GBP + (1000 EUR * 0.847) = 1500 + 847 = 2347
    expect(r.total).toBeCloseTo(2347)
    expect(r.reportingCurrency).toBe("GBP")
    expect(r.hasMissingRate).toBe(false)
    const gbp = r.byCurrency.find((c) => c.currency === "GBP")
    expect(gbp?.amount).toBe(1500)
  })
  it("flags a missing rate and excludes it from the total", () => {
    const r = rollup([{ amount: 100, currency: "GBP" }, { amount: 100, currency: "JPY" }], "GBP", rates)
    expect(r.hasMissingRate).toBe(true)
    expect(r.total).toBe(100)
  })
})

describe("fxKey", () => {
  it("uppercases both sides", () => {
    expect(fxKey("gbp", "eur")).toBe("GBP>EUR")
  })
})
