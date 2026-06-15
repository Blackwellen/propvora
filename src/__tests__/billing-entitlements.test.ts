import { describe, it, expect } from "vitest"
import { normaliseTier, PLAN_ORDER, gbp } from "@/lib/billing/plans"
import {
  featuresForTier,
  limitsForTier,
  entitlementsForTier,
} from "@/lib/billing/entitlements"

describe("billing — pure entitlement helpers", () => {
  describe("normaliseTier", () => {
    it("passes through canonical tiers", () => {
      for (const t of PLAN_ORDER) expect(normaliseTier(t)).toBe(t)
    })
    it("maps legacy aliases", () => {
      expect(normaliseTier("trial")).toBe("starter")
      expect(normaliseTier("basic")).toBe("starter")
      expect(normaliseTier("growth")).toBe("operator")
      expect(normaliseTier("pro")).toBe("pro_agency")
      expect(normaliseTier("agency")).toBe("pro_agency")
      expect(normaliseTier("business")).toBe("pro_agency")
    })
    it("is case-insensitive", () => {
      expect(normaliseTier("SCALE")).toBe("scale")
    })
    it("falls back to starter for unknown / null / undefined", () => {
      expect(normaliseTier("mystery")).toBe("starter")
      expect(normaliseTier(null)).toBe("starter")
      expect(normaliseTier(undefined)).toBe("starter")
    })
  })

  describe("featuresForTier", () => {
    it("starter has no premium features", () => {
      const f = featuresForTier("starter")
      expect(f.aiCopilot).toBe(false)
      expect(f.portals).toBe(false)
      expect(f.automation).toBe(false)
      expect(f.whiteLabel).toBe(false)
      expect(f.ssoSaml).toBe(false)
    })
    it("scale unlocks AI Copilot, portals and automation but not white-label/SSO", () => {
      const f = featuresForTier("scale")
      expect(f.aiCopilot).toBe(true)
      expect(f.portals).toBe(true)
      expect(f.automation).toBe(true)
      expect(f.whiteLabel).toBe(false)
      expect(f.ssoSaml).toBe(false)
    })
    it("pro_agency and enterprise unlock white-label + SSO", () => {
      for (const t of ["pro_agency", "enterprise"] as const) {
        const f = featuresForTier(t)
        expect(f.whiteLabel).toBe(true)
        expect(f.ssoSaml).toBe(true)
      }
    })
    it("a feature, once unlocked, stays unlocked at higher tiers (monotonic)", () => {
      const keys = ["aiCopilot", "portals", "automation", "whiteLabel", "ssoSaml"] as const
      for (const key of keys) {
        let seenTrue = false
        for (const t of PLAN_ORDER) {
          const on = featuresForTier(t)[key]
          if (on) seenTrue = true
          if (seenTrue) expect(featuresForTier(t)[key]).toBe(true)
        }
      }
    })
  })

  describe("limitsForTier", () => {
    it("limits grow with tier; enterprise is unlimited (Infinity)", () => {
      expect(limitsForTier("starter").properties).toBe(5)
      expect(limitsForTier("scale").properties).toBe(100)
      expect(limitsForTier("enterprise").properties).toBe(Infinity)
      expect(limitsForTier("enterprise").teamSeats).toBe(Infinity)
      expect(limitsForTier("enterprise").storageBytes).toBe(Infinity)
    })
    it("storage allowance is non-decreasing across tiers", () => {
      let prev = -1
      for (const t of PLAN_ORDER) {
        const bytes = limitsForTier(t).storageBytes
        expect(bytes).toBeGreaterThanOrEqual(prev)
        prev = bytes
      }
    })
  })

  describe("entitlementsForTier", () => {
    it("bundles tier, limits and features consistently", () => {
      const e = entitlementsForTier("scale")
      expect(e.tier).toBe("scale")
      expect(e.features).toEqual(featuresForTier("scale"))
      expect(e.limits).toEqual(limitsForTier("scale"))
    })
  })

  describe("gbp formatting", () => {
    it("formats whole pounds without decimals", () => {
      expect(gbp(2900)).toBe("£29")
    })
    it("formats fractional pounds with 2 decimals", () => {
      expect(gbp(2999)).toBe("£29.99")
    })
  })
})
