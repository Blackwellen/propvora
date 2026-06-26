import { describe, it, expect } from "vitest"
import { shortLetRule } from "./short-let"

describe("shortLetRule", () => {
  it("Scotland requires a short-term let licence", () => {
    const r = shortLetRule("GB", "SCT")
    expect(r.registrationRequired).toBe(true)
    expect(r.registrationName).toMatch(/licence/i)
  })
  it("England (E&W) has a 90-night cap", () => {
    expect(shortLetRule("GB").nightCap).toBe(90)
  })
  it("France has a 120-night primary-residence cap + registration", () => {
    const r = shortLetRule("FR")
    expect(r.nightCap).toBe(120)
    expect(r.registrationRequired).toBe(true)
  })
  it("Spain VUT is gated (restrictive)", () => {
    expect(shortLetRule("ES").applicability).toBe("gate")
  })
  it("unknown jurisdiction flags for local check", () => {
    expect(shortLetRule("ZZ").applicability).toBe("flag")
  })
})
