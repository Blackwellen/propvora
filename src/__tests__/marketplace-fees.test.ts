import { describe, it, expect } from "vitest"
import {
  computeFee,
  resolveFeeRule,
  FALLBACK_FEE_PERCENT,
  type MarketplaceFeeRule,
} from "@/lib/marketplace/fees"

/** Test helper: a fully-populated rule with sensible defaults, overridable. */
function rule(overrides: Partial<MarketplaceFeeRule> = {}): MarketplaceFeeRule {
  return {
    id: overrides.id ?? "r",
    country_code: null,
    transaction_type: null,
    plan_tier: null,
    category: null,
    fee_percent: 2.5,
    minimum_fee_pence: null,
    maximum_fee_pence: null,
    provider_fee_pass_through: true,
    tax_inclusive: false,
    active: true,
    priority: 0,
    ...overrides,
  }
}

describe("computeFee", () => {
  it("applies the percent to gross (2.5% of £100.00 = £2.50)", () => {
    const b = computeFee(rule({ fee_percent: 2.5 }), 10000)
    expect(b.platformFeePercent).toBe(2.5)
    expect(b.platformFeePence).toBe(250)
    expect(b.sellerPayoutPence).toBe(9750)
    expect(b.netPlatformRevenuePence).toBe(250)
    expect(b.appliedRuleId).toBe("r")
  })

  it("clamps up to the minimum fee", () => {
    // 2.5% of £10.00 = 25p, but minimum is 150p → clamps to 150.
    const b = computeFee(rule({ fee_percent: 2.5, minimum_fee_pence: 150 }), 1000)
    expect(b.platformFeePence).toBe(150)
    expect(b.sellerPayoutPence).toBe(850)
  })

  it("clamps down to the maximum fee", () => {
    // 5% of £1000.00 = 5000p, but maximum is 2000p → clamps to 2000.
    const b = computeFee(rule({ fee_percent: 5, maximum_fee_pence: 2000 }), 100000)
    expect(b.platformFeePence).toBe(2000)
    expect(b.sellerPayoutPence).toBe(98000)
  })

  it("never charges more than the gross", () => {
    const b = computeFee(rule({ fee_percent: 2.5, minimum_fee_pence: 5000 }), 1000)
    expect(b.platformFeePence).toBe(1000)
    expect(b.sellerPayoutPence).toBe(0)
  })

  it("passes the provider fee through to the seller by default", () => {
    const b = computeFee(rule({ fee_percent: 2.5 }), 10000, 300)
    expect(b.platformFeePence).toBe(250)
    expect(b.providerFeePence).toBe(300)
    expect(b.sellerPayoutPence).toBe(9450) // 10000 − 250 − 300
    expect(b.netPlatformRevenuePence).toBe(250)
  })

  it("absorbs the provider fee from platform revenue when not passed through", () => {
    const b = computeFee(
      rule({ fee_percent: 2.5, provider_fee_pass_through: false }),
      10000,
      300
    )
    expect(b.sellerPayoutPence).toBe(9750) // 10000 − 250 (provider not deducted)
    expect(b.netPlatformRevenuePence).toBe(-50) // 250 − 300 absorbed
  })

  it("surfaces appliedRuleId = null for the fallback", () => {
    const b = computeFee(rule({ fee_percent: FALLBACK_FEE_PERCENT }), 10000, 0, null)
    expect(b.appliedRuleId).toBeNull()
  })
})

describe("resolveFeeRule — specificity", () => {
  const global = rule({ id: "global", priority: 0 })
  const byType = rule({ id: "type", transaction_type: "supplier_job", priority: 10 })
  const byCountryType = rule({
    id: "gb-type",
    country_code: "GB",
    transaction_type: "supplier_job",
    minimum_fee_pence: 150,
    priority: 20,
  })

  it("prefers the rule with the most matched dimensions", () => {
    const r = resolveFeeRule([global, byType, byCountryType], {
      countryCode: "GB",
      transactionType: "supplier_job",
    })
    expect(r?.id).toBe("gb-type")
  })

  it("falls back to a less-specific rule when the specific one does not match", () => {
    const r = resolveFeeRule([global, byType, byCountryType], {
      countryCode: "US",
      transactionType: "supplier_job",
    })
    expect(r?.id).toBe("type") // GB rule rejected, type rule still eligible
  })

  it("rejects rules whose non-null dimension does not match", () => {
    const r = resolveFeeRule([global, byType], {
      countryCode: "GB",
      transactionType: "stay_booking",
    })
    expect(r?.id).toBe("global") // supplier_job rule ineligible for stay_booking
  })

  it("breaks ties on priority (higher wins)", () => {
    const lo = rule({ id: "lo", transaction_type: "supplier_job", priority: 1 })
    const hi = rule({ id: "hi", transaction_type: "supplier_job", priority: 9 })
    const r = resolveFeeRule([lo, hi], {
      countryCode: "GB",
      transactionType: "supplier_job",
    })
    expect(r?.id).toBe("hi")
  })

  it("ignores inactive rules", () => {
    const inactive = rule({
      id: "inactive",
      country_code: "GB",
      transaction_type: "supplier_job",
      active: false,
      priority: 99,
    })
    const r = resolveFeeRule([global, inactive], {
      countryCode: "GB",
      transactionType: "supplier_job",
    })
    expect(r?.id).toBe("global")
  })

  it("returns null when nothing is eligible", () => {
    const r = resolveFeeRule([byType], {
      countryCode: "GB",
      transactionType: "stay_booking",
    })
    expect(r).toBeNull()
  })
})
