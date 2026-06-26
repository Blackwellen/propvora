import { describe, it, expect } from "vitest"
import { interestReliefRule, computeIncomeTax } from "./interest-relief"

describe("interestReliefRule", () => {
  it("UK = restricted with a 20% credit (S24)", () => {
    const r = interestReliefRule("GB")
    expect(r.regime).toBe("restricted")
    expect(r.creditRate).toBe(0.2)
  })
  it("other jurisdictions = full deduction", () => {
    expect(interestReliefRule("DE").regime).toBe("full")
    expect(interestReliefRule("IE").regime).toBe("full")
  })
})

describe("computeIncomeTax — UK S24 (personal)", () => {
  // profit before interest £20k, interest £8k, higher-rate 40%.
  const base = { countryCode: "GB", profitBeforeInterest: 20_000, interest: 8_000, marginalRate: 0.4 }

  it("does not deduct interest; applies a 20% credit", () => {
    const r = computeIncomeTax(base)
    expect(r.regime).toBe("restricted")
    // tax = 20k * 40% = 8000; credit = 8k * 20% = 1600; due = 6400
    expect(r.taxBeforeCredit).toBeCloseTo(8_000)
    expect(r.interestCredit).toBeCloseTo(1_600)
    expect(r.taxDue).toBeCloseTo(6_400)
  })
  it("shows the S24 penalty vs full deduction", () => {
    const r = computeIncomeTax(base)
    // full deduction: (20k-8k)=12k * 40% = 4800; penalty = 6400-4800 = 1600
    expect(r.taxIfFullyDeductible).toBeCloseTo(4_800)
    expect(r.reliefPenalty).toBeCloseTo(1_600)
  })
})

describe("computeIncomeTax — full relief", () => {
  it("corporate UK holding gets full deduction (no S24 penalty)", () => {
    const r = computeIncomeTax({ countryCode: "GB", structure: "corporate", profitBeforeInterest: 20_000, interest: 8_000, marginalRate: 0.25 })
    expect(r.regime).toBe("full")
    expect(r.reliefPenalty).toBe(0)
    expect(r.taxDue).toBeCloseTo(3_000) // (20k-8k)*25%
  })
  it("Germany personal landlord deducts interest fully", () => {
    const r = computeIncomeTax({ countryCode: "DE", profitBeforeInterest: 20_000, interest: 8_000, marginalRate: 0.42 })
    expect(r.regime).toBe("full")
    expect(r.taxDue).toBeCloseTo(5_040) // (20k-8k)*42%
  })
})
