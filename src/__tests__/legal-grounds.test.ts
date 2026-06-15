import { describe, it, expect } from "vitest"
import {
  SECTION_8_GROUNDS,
  groundById,
  toSelectedGrounds,
  indicativeNoticeDays,
  groundsLabel,
  computeExpiry,
  type SelectedGround,
} from "@/lib/legal/grounds"

const sel = (id: string): SelectedGround => {
  const g = groundById(id)!
  return { id: g.id, number: g.number, name: g.name, type: g.type, noticeDays: g.noticeDays }
}

describe("legal grounds — notice period logic", () => {
  describe("groundById / toSelectedGrounds", () => {
    it("finds a known ground", () => {
      expect(groundById("g8")?.number).toBe("Ground 8")
    })
    it("returns undefined for an unknown id", () => {
      expect(groundById("nope")).toBeUndefined()
    })
    it("maps ids to selected grounds and drops unknown ids", () => {
      const out = toSelectedGrounds(["g8", "bogus", "g10"])
      expect(out.map((g) => g.id)).toEqual(["g8", "g10"])
      expect(out[0]).toMatchObject({ number: "Ground 8", noticeDays: 14 })
    })
  })

  describe("indicativeNoticeDays", () => {
    it("section 21 is a fixed 2-month reference (60 days)", () => {
      expect(indicativeNoticeDays("section_21", [])).toBe(60)
      // grounds are irrelevant for s21
      expect(indicativeNoticeDays("section_21", [sel("g8")])).toBe(60)
    })
    it("section 8 with no grounds falls back to 14 days", () => {
      expect(indicativeNoticeDays("section_8", [])).toBe(14)
    })
    it("section 8 uses the LONGEST notice across selected grounds", () => {
      // g14 (nuisance) is 0 days, g8 is 14 -> max is 14
      expect(indicativeNoticeDays("section_8", [sel("g14"), sel("g8")])).toBe(14)
    })
    it("section 8 with only a zero-day ground returns 0", () => {
      expect(indicativeNoticeDays("section_8", [sel("g14")])).toBe(0)
    })
  })

  describe("groundsLabel", () => {
    it("labels section 21 plainly", () => {
      expect(groundsLabel("section_21", [])).toBe("Section 21 (no-fault)")
    })
    it("defaults to Ground 8 when no s8 grounds selected", () => {
      expect(groundsLabel("section_8", [])).toBe("Ground 8")
    })
    it("joins selected ground numbers", () => {
      expect(groundsLabel("section_8", [sel("g8"), sel("g10")])).toBe("Ground 8, Ground 10")
    })
  })

  describe("computeExpiry", () => {
    it("adds days to a yyyy-mm-dd served date", () => {
      expect(computeExpiry("2026-01-01", 14)).toBe("2026-01-15")
    })
    it("rolls across month boundaries", () => {
      expect(computeExpiry("2026-01-20", 14)).toBe("2026-02-03")
    })
    it("returns empty string for an invalid date", () => {
      expect(computeExpiry("not-a-date", 14)).toBe("")
    })
  })

  it("catalogue: every ground has a non-negative indicative notice period", () => {
    expect(SECTION_8_GROUNDS.length).toBeGreaterThan(0)
    for (const g of SECTION_8_GROUNDS) {
      expect(g.noticeDays).toBeGreaterThanOrEqual(0)
      expect(g.evidence.length).toBeGreaterThan(0)
    }
  })
})
