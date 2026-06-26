import { describe, it, expect } from "vitest"
import { rentIncreaseRule, maxIncreasedRent, canIncreaseNow, isAboveCap } from "./rent-control"

describe("rentIncreaseRule", () => {
  it("Ireland CPI-or-2% cap", () => {
    expect(rentIncreaseRule("IE").capPct).toBe(2)
  })
  it("Scotland adjudication cap 6%", () => {
    expect(rentIncreaseRule("GB", "SCT").capPct).toBe(6)
  })
  it("E&W has no general cap", () => {
    expect(rentIncreaseRule("GB").capPct).toBeNull()
  })
})

describe("maxIncreasedRent / isAboveCap", () => {
  it("IE 2% cap on £1000 = £1020 max", () => {
    expect(maxIncreasedRent(rentIncreaseRule("IE"), 1000)).toBeCloseTo(1020)
  })
  it("flags an above-cap increase", () => {
    expect(isAboveCap(rentIncreaseRule("IE"), 1000, 1100)).toBe(true)
  })
  it("allows an at-cap increase", () => {
    expect(isAboveCap(rentIncreaseRule("IE"), 1000, 1020)).toBe(false)
  })
  it("no cap → never above", () => {
    expect(isAboveCap(rentIncreaseRule("GB"), 1000, 5000)).toBe(false)
  })
})

describe("canIncreaseNow", () => {
  it("blocks within the frequency window", () => {
    const recent = new Date()
    recent.setMonth(recent.getMonth() - 3)
    expect(canIncreaseNow(rentIncreaseRule("IE"), recent)).toBe(false)
  })
  it("allows after the window", () => {
    const old = new Date()
    old.setMonth(old.getMonth() - 13)
    expect(canIncreaseNow(rentIncreaseRule("IE"), old)).toBe(true)
  })
  it("allows when never increased", () => {
    expect(canIncreaseNow(rentIncreaseRule("IE"), null)).toBe(true)
  })
})
