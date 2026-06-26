import { describe, it, expect } from "vitest"
import { resolveValue, numericCompare, type OverrideLayers } from "./resolve"

describe("resolveValue — override chain precedence", () => {
  const sourced = { value: 28, citation: "GOV.SCOT — Notice to Leave", statutoryMinimum: 28 }

  it("returns blank when nothing is set", () => {
    const r = resolveValue<number>({})
    expect(r.value).toBeNull()
    expect(r.source).toBe("blank")
    expect(r.isOverridden).toBe(false)
    expect(r.sourcedDefault).toBeNull()
  })

  it("falls back to the sourced default when no overrides exist", () => {
    const r = resolveValue<number>({ sourced })
    expect(r.value).toBe(28)
    expect(r.source).toBe("sourced")
    expect(r.isOverridden).toBe(false)
    expect(r.citation).toBe("GOV.SCOT — Notice to Leave")
    expect(r.sourcedDefault).toBe(28)
  })

  it("workspace beats sourced", () => {
    const r = resolveValue<number>({ workspace: { value: 56, reason: "agency policy" }, sourced })
    expect(r.value).toBe(56)
    expect(r.source).toBe("workspace")
    expect(r.isOverridden).toBe(true)
    expect(r.overrideReason).toBe("agency policy")
    // The sourced default is always preserved for showing the citation alongside.
    expect(r.sourcedDefault).toBe(28)
  })

  it("property beats workspace and sourced", () => {
    const r = resolveValue<number>({
      property: { value: 42 },
      workspace: { value: 56 },
      sourced,
    })
    expect(r.value).toBe(42)
    expect(r.source).toBe("property")
  })

  it("case beats everything (most specific)", () => {
    const r = resolveValue<number>({
      case: { value: 90, reason: "contractual notice", exemption: "contractual" },
      property: { value: 42 },
      workspace: { value: 56 },
      sourced,
    })
    expect(r.value).toBe(90)
    expect(r.source).toBe("case")
    expect(r.overrideReason).toBe("contractual notice")
    expect(r.overrideExemption).toBe("contractual")
  })

  it("flags a sub-statutory-minimum override (warn, never block)", () => {
    const r = resolveValue<number>(
      { case: { value: 14, reason: "tenant agreed" }, sourced },
      numericCompare,
    )
    expect(r.value).toBe(14)
    expect(r.belowStatutoryMinimum).toBe(true)
  })

  it("does not flag an at-or-above-minimum override", () => {
    const r = resolveValue<number>(
      { case: { value: 84 }, sourced },
      numericCompare,
    )
    expect(r.belowStatutoryMinimum).toBe(false)
  })

  it("works for non-numeric values (e.g. scheme name strings)", () => {
    const layers: OverrideLayers<string> = {
      property: { value: "mydeposits" },
      sourced: { value: "TDP", citation: "GOV.UK — deposit schemes" },
    }
    const r = resolveValue(layers)
    expect(r.value).toBe("mydeposits")
    expect(r.source).toBe("property")
    expect(r.belowStatutoryMinimum).toBeUndefined()
  })

  it("treats an explicit null layer as absent (skips to next)", () => {
    const r = resolveValue<number>({ case: null, property: { value: 42 }, sourced })
    expect(r.value).toBe(42)
    expect(r.source).toBe("property")
  })
})
