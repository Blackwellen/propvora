import { describe, it, expect } from "vitest"
import { depositRules, maxDeposit, isOverCap, depositCapSourced } from "./deposits"

describe("depositRules — jurisdiction lookup", () => {
  it("England & Wales = 5 weeks, TDP, prescribed info", () => {
    const r = depositRules("GB")
    expect(r.cap).toEqual({ kind: "weeks", value: 5 })
    expect(r.protectionRequired).toBe(true)
    expect(r.prescribedInfo).toBe(true)
  })
  it("Scotland sub-jurisdiction resolves distinctly", () => {
    const r = depositRules("GB", "SCT")
    expect(r.jurisdiction).toBe("GB-SCT")
    expect(r.cap.value).toBeNull() // no statutory multiple
  })
  it("Germany = 3 months cold rent", () => {
    expect(depositRules("DE").cap).toEqual({ kind: "months", value: 3 })
  })
  it("UAE = 5% of annual rent", () => {
    expect(depositRules("AE").cap).toEqual({ kind: "percent", value: 5 })
  })
  it("unknown jurisdiction falls back to generic (no cap)", () => {
    const r = depositRules("ZZ")
    expect(r.cap).toEqual({ kind: "none", value: null })
    expect(r.scheme).toBeNull()
  })
})

describe("maxDeposit", () => {
  it("weeks cap (E&W 5 weeks of £1300/mo)", () => {
    // annual 15600 / 52 * 5 = 1500
    expect(maxDeposit(depositRules("GB"), 1300)).toBeCloseTo(1500)
  })
  it("months cap (DE 3 months of €1000)", () => {
    expect(maxDeposit(depositRules("DE"), 1000)).toBe(3000)
  })
  it("percent cap (AE 5% of annual)", () => {
    expect(maxDeposit(depositRules("AE"), 5000, 60000)).toBe(3000)
  })
  it("returns null when no statutory multiple", () => {
    expect(maxDeposit(depositRules("GB", "SCT"), 1000)).toBeNull()
  })
})

describe("isOverCap", () => {
  it("flags an over-cap deposit", () => {
    expect(isOverCap(depositRules("GB"), 1800, 1300)).toBe(true)
  })
  it("allows an at-cap deposit", () => {
    expect(isOverCap(depositRules("GB"), 1500, 1300)).toBe(false)
  })
  it("never flags when no cap applies", () => {
    expect(isOverCap(depositRules("GB", "SCT"), 999999, 1000)).toBe(false)
  })
})

describe("depositCapSourced", () => {
  it("returns a SourcedDefault carrying the citation", () => {
    const s = depositCapSourced(depositRules("GB"), 1300)
    expect(s?.value).toBeCloseTo(1500)
    expect(s?.citation).toMatch(/Tenancy Deposit/)
  })
  it("returns null when no cap", () => {
    expect(depositCapSourced(depositRules("GB", "SCT"), 1000)).toBeNull()
  })
})
