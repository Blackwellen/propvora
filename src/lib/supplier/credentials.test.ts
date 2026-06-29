import { describe, it, expect } from "vitest"
import { credentialStatus } from "./credentials"

const NOW = new Date("2026-06-29T00:00:00.000Z").getTime()
const DAY = 1000 * 60 * 60 * 24

describe("credentialStatus", () => {
  it("expired when the expiry date has passed", () => {
    expect(credentialStatus({ expires_at: "2026-06-01", verified_at: "2026-01-01" }, NOW)).toBe("expired")
  })

  it("expiring when within 30 days of expiry", () => {
    const inTwoWeeks = new Date(NOW + 14 * DAY).toISOString().slice(0, 10)
    expect(credentialStatus({ expires_at: inTwoWeeks, verified_at: null }, NOW)).toBe("expiring")
  })

  it("verified when far from expiry and a verified_at date is set", () => {
    expect(credentialStatus({ expires_at: "2027-12-31", verified_at: "2026-06-01" }, NOW)).toBe("verified")
  })

  it("unverified when no expiry and no verification", () => {
    expect(credentialStatus({ expires_at: null, verified_at: null }, NOW)).toBe("unverified")
  })

  it("verified when no expiry but a verification date exists", () => {
    expect(credentialStatus({ expires_at: null, verified_at: "2026-06-01" }, NOW)).toBe("verified")
  })

  it("a far-future expiry without verification is unverified (awaiting review), not verified", () => {
    expect(credentialStatus({ expires_at: "2030-01-01", verified_at: null }, NOW)).toBe("unverified")
  })
})
