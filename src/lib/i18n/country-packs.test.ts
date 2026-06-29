import { describe, it, expect } from "vitest"
import {
  COUNTRY_PACKS,
  getCountryPack,
  getAllCountryPacks,
  type CountryPack,
} from "./country-packs"

// H50 — COUNTRY_PACKS structural guard. The packs drive UI taxonomy/terms/tabs
// per jurisdiction; these tests pin the invariants that the rest of the app
// (and the legal-safety stance) rely on.

const codes = Object.keys(COUNTRY_PACKS)

describe("COUNTRY_PACKS — coverage & shape", () => {
  it("covers 45 jurisdictions", () => {
    expect(codes.length).toBe(45)
  })

  it("includes the original reviewed/generic anchors", () => {
    for (const c of ["GB", "US", "AU", "CA", "DE", "AE"]) {
      expect(COUNTRY_PACKS[c]).toBeDefined()
    }
  })

  it("every pack key matches its entry.code (uppercase ISO-3166 alpha-2)", () => {
    for (const [key, pack] of Object.entries(COUNTRY_PACKS)) {
      expect(key).toMatch(/^[A-Z]{2}$/)
      expect(pack.code).toBe(key)
    }
  })
})

describe("COUNTRY_PACKS — legal-safety invariants", () => {
  it("ONLY GB is reviewed; every other pack is generic", () => {
    for (const pack of getAllCountryPacks()) {
      if (pack.code === "GB") expect(pack.reviewStatus).toBe("reviewed")
      else expect(pack.reviewStatus).toBe("generic")
    }
  })

  it("UK-only instruments (Section 21/8 + UK trackers) are off outside GB", () => {
    for (const pack of getAllCountryPacks()) {
      if (pack.code === "GB") continue
      expect(pack.terms.section21).toBeNull()
      expect(pack.terms.section8).toBeNull()
      expect(pack.tabVisibility.hmoLicensing).toBe(false)
      expect(pack.tabVisibility.rightToRent).toBe(false)
      expect(pack.tabVisibility.section21Tracker).toBe(false)
      expect(pack.tabVisibility.section8Tracker).toBe(false)
    }
  })

  it("every pack carries a non-empty legal disclaimer", () => {
    for (const pack of getAllCountryPacks()) {
      expect(pack.legalDisclaimer.trim().length).toBeGreaterThan(20)
    }
  })
})

describe("COUNTRY_PACKS — field validity", () => {
  const required: (keyof CountryPack)[] = [
    "code", "name", "currency", "currencySymbol", "locale",
    "dateFormat", "legalFramework", "reviewStatus", "terms",
    "propertyTypes", "complianceCategories", "tabVisibility", "legalDisclaimer",
  ]

  it("every pack has all required fields populated", () => {
    for (const pack of getAllCountryPacks()) {
      for (const f of required) expect(pack[f]).toBeDefined()
    }
  })

  it("currency is a 3-letter ISO-4217 code", () => {
    for (const pack of getAllCountryPacks()) {
      expect(pack.currency).toMatch(/^[A-Z]{3}$/)
    }
  })

  it("locale is a BCP-47-ish tag (xx-XX)", () => {
    for (const pack of getAllCountryPacks()) {
      expect(pack.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
    }
  })

  it("every pack offers at least 3 property types and 2 compliance items", () => {
    for (const pack of getAllCountryPacks()) {
      expect(pack.propertyTypes.length).toBeGreaterThanOrEqual(3)
      expect(pack.complianceCategories.length).toBeGreaterThanOrEqual(2)
    }
  })

  it("property type + compliance keys are unique within each pack", () => {
    for (const pack of getAllCountryPacks()) {
      const pt = pack.propertyTypes.map((p) => p.key)
      const cc = pack.complianceCategories.map((c) => c.key)
      expect(new Set(pt).size).toBe(pt.length)
      expect(new Set(cc).size).toBe(cc.length)
    }
  })
})

describe("getCountryPack — fallback behaviour", () => {
  it("returns the requested pack (case-insensitive)", () => {
    expect(getCountryPack("fr").code).toBe("FR")
    expect(getCountryPack("FR").code).toBe("FR")
  })

  it("falls back to GB for unknown / null", () => {
    expect(getCountryPack(null).code).toBe("GB")
    expect(getCountryPack("ZZ").code).toBe("GB")
  })
})
