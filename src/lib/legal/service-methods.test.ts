import { describe, it, expect } from "vitest"
import { serviceMethodsFor, serviceMethodLabel } from "./service-methods"

describe("serviceMethodsFor — jurisdiction resolution", () => {
  it("England & Wales offers post + process server + hand", () => {
    const set = serviceMethodsFor("GB", "EW")
    const ids = set.methods.map((m) => m.id)
    expect(ids).toContain("hand")
    expect(ids).toContain("post")
    expect(ids).toContain("process")
    expect(set.jurisdiction).toBe("GB-EW")
  })

  it("bare GB defaults to England & Wales", () => {
    expect(serviceMethodsFor("GB").jurisdiction).toBe("GB-EW")
  })

  it("Scotland offers sheriff officer, not a process server", () => {
    const set = serviceMethodsFor("GB", "SCT")
    const ids = set.methods.map((m) => m.id)
    expect(ids).toContain("sheriff")
    expect(ids).not.toContain("process")
    expect(set.jurisdiction).toBe("GB-SCT")
  })

  it("Ireland uses registered post (RTB)", () => {
    const set = serviceMethodsFor("IE")
    const ids = set.methods.map((m) => m.id)
    expect(ids).toContain("registered")
    expect(set.jurisdiction).toBe("IE")
  })

  it("unreviewed jurisdiction falls back to the generic set", () => {
    const set = serviceMethodsFor("BR")
    expect(set.jurisdiction).toBe("generic")
    expect(set.methods.length).toBeGreaterThan(0)
  })

  it("null/undefined country falls back to GB-EW", () => {
    expect(serviceMethodsFor(null).jurisdiction).toBe("GB-EW")
    expect(serviceMethodsFor(undefined).jurisdiction).toBe("GB-EW")
  })

  it("is case-insensitive on country + region", () => {
    expect(serviceMethodsFor("gb", "sct").jurisdiction).toBe("GB-SCT")
  })
})

describe("service-methods invariants", () => {
  for (const code of ["GB", "GB:SCT", "GB:NI", "IE", "generic-via-BR"]) {
    const [country, region] = code.split(":")
    const set = serviceMethodsFor(country === "generic-via-BR" ? "BR" : country, region)
    it(`${code}: hand delivery always available + every method has a label`, () => {
      expect(set.methods.some((m) => m.id === "hand")).toBe(true)
      for (const m of set.methods) {
        expect(m.label.length).toBeGreaterThan(0)
        expect(m.description.length).toBeGreaterThan(0)
      }
    })
    it(`${code}: email (if present) requires an agreement clause`, () => {
      const email = set.methods.find((m) => m.id === "email")
      if (email) expect(email.requiresAgreementClause).toBe(true)
    })
  }

  it("serviceMethodLabel resolves a known id and falls back to the id", () => {
    const set = serviceMethodsFor("GB")
    expect(serviceMethodLabel(set, "hand")).toBe("Hand delivered")
    expect(serviceMethodLabel(set, "unknown")).toBe("unknown")
    expect(serviceMethodLabel(set.methods, "post")).toBe("First-class post")
  })
})
