import { describe, it, expect } from "vitest"
import { tenantFeesRule, holdingDepositCap, isBannedFee } from "./tenant-fees"

describe("tenantFeesRule", () => {
  it("England has a banned-fees regime + 1-week holding cap", () => {
    const r = tenantFeesRule("GB")
    expect(r.bannedFeesRegime).toBe(true)
    expect(r.holdingDepositCapWeeks).toBe(1)
  })
  it("Scotland bans premiums beyond rent + deposit", () => {
    expect(tenantFeesRule("GB", "SCT").bannedFeesRegime).toBe(true)
  })
})

describe("holdingDepositCap", () => {
  it("England 1 week of £1300/mo ≈ £300", () => {
    expect(holdingDepositCap(tenantFeesRule("GB"), 1300)).toBeCloseTo(300)
  })
  it("null where no cap", () => {
    expect(holdingDepositCap(tenantFeesRule("ZZ"), 1300)).toBeNull()
  })
})

describe("isBannedFee", () => {
  it("flags a banned referencing fee in England", () => {
    expect(isBannedFee(tenantFeesRule("GB"), "Referencing fee")).toBe(true)
  })
  it("does not flag rent", () => {
    expect(isBannedFee(tenantFeesRule("GB"), "Rent")).toBe(false)
  })
  it("never flags where no banned regime", () => {
    expect(isBannedFee(tenantFeesRule("ZZ"), "Referencing fee")).toBe(false)
  })
})
