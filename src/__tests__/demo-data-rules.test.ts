/**
 * Demo-data "preserve edited record" rule — unit coverage.
 *
 * Mirrors the SQL helper public._demo_row_edited(created_at, updated_at): a demo
 * row counts as EDITED when updated_at is more than 60s after created_at (the
 * seeder writes every row in one transaction, so untouched rows have
 * updated_at ≈ created_at). On auto-expiry and on preserve-reset, edited rows
 * are kept; untouched rows are removed.
 */
import { describe, it, expect } from "vitest"

const EDIT_THRESHOLD_MS = 60_000

/** JS mirror of the SQL _demo_row_edited rule. */
function demoRowEdited(createdAt: string | null, updatedAt: string | null): boolean {
  if (!createdAt || !updatedAt) return false
  return new Date(updatedAt).getTime() > new Date(createdAt).getTime() + EDIT_THRESHOLD_MS
}

/** Decide deletion under each lifecycle action. */
function shouldDelete(opts: {
  action: "reset" | "preserve-reset" | "expire"
  edited: boolean
  expired?: boolean
}): boolean {
  const { action, edited, expired } = opts
  if (action === "reset") return true // full reset removes everything
  if (action === "preserve-reset") return !edited // keep edited rows
  if (action === "expire") return !!expired && !edited // keep edited rows on auto-expiry
  return false
}

describe("demoRowEdited rule", () => {
  const created = "2026-06-01T10:00:00.000Z"

  it("treats updated_at == created_at as untouched", () => {
    expect(demoRowEdited(created, created)).toBe(false)
  })

  it("treats a sub-minute updated_at as untouched (same transaction)", () => {
    expect(demoRowEdited(created, "2026-06-01T10:00:30.000Z")).toBe(false)
  })

  it("treats a later updated_at as edited", () => {
    expect(demoRowEdited(created, "2026-06-02T09:00:00.000Z")).toBe(true)
  })

  it("is false when timestamps are missing", () => {
    expect(demoRowEdited(null, created)).toBe(false)
    expect(demoRowEdited(created, null)).toBe(false)
  })
})

describe("demo lifecycle deletion policy", () => {
  it("full reset deletes both edited and untouched rows", () => {
    expect(shouldDelete({ action: "reset", edited: true })).toBe(true)
    expect(shouldDelete({ action: "reset", edited: false })).toBe(true)
  })

  it("preserve-reset keeps edited rows, deletes untouched", () => {
    expect(shouldDelete({ action: "preserve-reset", edited: true })).toBe(false)
    expect(shouldDelete({ action: "preserve-reset", edited: false })).toBe(true)
  })

  it("auto-expiry only deletes expired untouched rows", () => {
    expect(shouldDelete({ action: "expire", edited: false, expired: true })).toBe(true)
    expect(shouldDelete({ action: "expire", edited: true, expired: true })).toBe(false)
    expect(shouldDelete({ action: "expire", edited: false, expired: false })).toBe(false)
  })
})
