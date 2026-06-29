import { describe, it, expect } from "vitest"

// A11 — money-formatter consolidation drift guard.
// Each of the 5 stray currency formatters now delegates to the shared i18n
// currency core (`formatCurrencyAmount`). These tests pin every delegated
// function to a *frozen copy of its pre-refactor implementation* so any future
// value drift fails CI.

import { formatCurrency as utilsFormatCurrency } from "@/lib/utils"
import { formatCurrency as planningFormatCurrency } from "@/lib/planning/calculations"
import { formatPence, formatCurrency as mktFormatCurrency } from "@/lib/marketplace/money"
import { formatCurrencyFromPence } from "@/lib/international/countries"

const VALUES = [0, 1, 7, 50, 99, 100, 250, 1234, 120000, 123456, 99999, 250000, 1000000, 12350]
const CURRENCIES = ["GBP", "EUR", "USD", "JPY"]
const LOCALES = ["en-GB", "fr-FR", "de-DE", "ja-JP"]

// ── frozen legacy implementations (exact copies of the code before A11) ──────

function legacyUtils(amount: number, currency = "GBP", locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function legacyPlanning(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function legacyFormatPence(
  pence: number | null | undefined,
  currency: string | null | undefined = "GBP",
  locale = "en-GB"
): string {
  if (pence === null || pence === undefined || !Number.isFinite(Number(pence))) return "—"
  const code = (currency ?? "GBP").toUpperCase()
  const safeLocale = locale || "en-GB"
  const major = Number(pence) / 100
  const hasFraction = Math.round(Number(pence)) % 100 !== 0
  return new Intl.NumberFormat(safeLocale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(major)
}

function legacyMktCurrency(
  amountMinorUnits: number | null | undefined,
  currency = "GBP",
  locale = "en-GB",
  minorUnitsPerMajor = 100
): string {
  if (amountMinorUnits == null || !Number.isFinite(Number(amountMinorUnits))) return "—"
  const code = (currency ?? "GBP").toUpperCase()
  const major = Number(amountMinorUnits) / minorUnitsPerMajor
  const hasFraction = Math.round(Number(amountMinorUnits)) % minorUnitsPerMajor !== 0
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(major)
}

function legacyFromPence(currencyCode: string, localeDefault: string, pence: number): string {
  const major = pence / 100
  return new Intl.NumberFormat(localeDefault || "en-GB", {
    style: "currency",
    currency: currencyCode || "GBP",
  }).format(major)
}

// ── drift checks ─────────────────────────────────────────────────────────────

describe("A11 — utils.formatCurrency delegates without drift", () => {
  for (const v of VALUES.map((p) => p / 100).concat(VALUES)) {
    for (const c of CURRENCIES) {
      for (const l of LOCALES) {
        it(`utils ${v} ${c} ${l}`, () => {
          expect(utilsFormatCurrency(v, c, l)).toBe(legacyUtils(v, c, l))
        })
      }
    }
  }
})

describe("A11 — planning.formatCurrency delegates without drift", () => {
  for (const v of VALUES) {
    it(`planning ${v}`, () => {
      expect(planningFormatCurrency(v)).toBe(legacyPlanning(v))
    })
  }
})

describe("A11 — marketplace.formatPence delegates without drift", () => {
  for (const v of VALUES) {
    for (const c of CURRENCIES) {
      for (const l of LOCALES) {
        it(`formatPence ${v} ${c} ${l}`, () => {
          expect(formatPence(v, c, l)).toBe(legacyFormatPence(v, c, l))
        })
      }
    }
  }
  it("null/undefined → em dash", () => {
    expect(formatPence(null)).toBe("—")
    expect(formatPence(undefined)).toBe("—")
  })
})

describe("A11 — marketplace.formatCurrency delegates without drift", () => {
  for (const v of VALUES) {
    for (const c of CURRENCIES) {
      it(`mkt ${v} ${c}`, () => {
        expect(mktFormatCurrency(v, c, "en-GB")).toBe(legacyMktCurrency(v, c, "en-GB"))
      })
    }
  }
})

describe("A11 — countries.formatCurrencyFromPence delegates without drift", () => {
  for (const v of VALUES) {
    for (const [c, l] of [["GBP", "en-GB"], ["EUR", "fr-FR"], ["JPY", "ja-JP"], ["USD", "en-US"]] as const) {
      it(`fromPence ${v} ${c} ${l}`, () => {
        expect(formatCurrencyFromPence({ currencyCode: c, localeDefault: l }, v)).toBe(
          legacyFromPence(c, l, v)
        )
      })
    }
  }
})
