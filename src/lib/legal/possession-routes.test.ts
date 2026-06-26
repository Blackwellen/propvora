import { describe, it, expect } from "vitest"
import { possessionRoutes } from "./possession-routes"

describe("possessionRoutes", () => {
  it("England & Wales returns null (uses the Section 8/21 wizard)", () => {
    expect(possessionRoutes("GB")).toBeNull()
    expect(possessionRoutes("GB", "EW")).toBeNull()
  })
  it("Scotland → Notice to Leave 28/84 days", () => {
    const p = possessionRoutes("GB", "SCT")
    expect(p?.regionName).toBe("Scotland")
    expect(p?.routes.map((r) => r.noticeDays)).toEqual([28, 84])
  })
  it("Northern Ireland → Notice to Quit 4/8/12 weeks", () => {
    const p = possessionRoutes("GB", "NI")
    expect(p?.routes.map((r) => r.noticeDays)).toEqual([28, 56, 84])
  })
  it("Ireland → Notice of Termination 90–224 days", () => {
    const p = possessionRoutes("IE")
    expect(p?.regionName).toBe("Ireland")
    expect(p?.routes.some((r) => r.noticeDays === 224)).toBe(true)
  })
  it("unknown jurisdiction → generic single route with no fixed days", () => {
    const p = possessionRoutes("ZZ")
    expect(p?.routes).toHaveLength(1)
    expect(p?.routes[0].noticeDays).toBeNull()
  })
})
