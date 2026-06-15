import { describe, it, expect } from "vitest"
import { PLAN_CAPS } from "@/lib/ai/caps"
import { PLAN_ORDER } from "@/lib/billing/plans"

describe("AI caps — per-plan cap windowing data", () => {
  it("defines caps for every plan tier", () => {
    for (const tier of PLAN_ORDER) {
      expect(PLAN_CAPS[tier]).toBeDefined()
    }
  })

  it("request windows are monotonically non-decreasing (6h <= day <= week <= month)", () => {
    for (const tier of PLAN_ORDER) {
      const c = PLAN_CAPS[tier]
      expect(c.requests6h).toBeLessThanOrEqual(c.requestsDay)
      expect(c.requestsDay).toBeLessThanOrEqual(c.requestsWeek)
      expect(c.requestsWeek).toBeLessThanOrEqual(c.requestsMonth)
    }
  })

  it("token windows are monotonically non-decreasing across windows", () => {
    for (const tier of PLAN_ORDER) {
      const c = PLAN_CAPS[tier]
      expect(c.tokens6h).toBeLessThanOrEqual(c.tokensDay)
      expect(c.tokensDay).toBeLessThanOrEqual(c.tokensWeek)
      expect(c.tokensWeek).toBeLessThanOrEqual(c.tokensMonth)
    }
  })

  it("caps increase with tier (starter <= operator <= scale <= pro_agency <= enterprise)", () => {
    const tiers = PLAN_ORDER
    for (let i = 1; i < tiers.length; i++) {
      const lower = PLAN_CAPS[tiers[i - 1]]
      const higher = PLAN_CAPS[tiers[i]]
      expect(higher.requestsMonth).toBeGreaterThanOrEqual(lower.requestsMonth)
      expect(higher.tokensMonth).toBeGreaterThanOrEqual(lower.tokensMonth)
      expect(higher.costPenceMonth).toBeGreaterThanOrEqual(lower.costPenceMonth)
    }
  })

  it("enterprise is effectively unlimited", () => {
    const e = PLAN_CAPS.enterprise
    expect(e.requestsMonth).toBe(Number.MAX_SAFE_INTEGER)
    expect(e.tokensMonth).toBe(Number.MAX_SAFE_INTEGER)
    expect(e.costPenceMonth).toBe(Number.MAX_SAFE_INTEGER)
  })

  it("every paid window cap and cost budget is a positive number", () => {
    for (const tier of PLAN_ORDER) {
      const c = PLAN_CAPS[tier]
      expect(c.requests6h).toBeGreaterThan(0)
      expect(c.tokens6h).toBeGreaterThan(0)
      expect(c.costPenceMonth).toBeGreaterThan(0)
    }
  })
})
