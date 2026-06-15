import { describe, it, expect } from "vitest"

import {
  formatMoney,
  formatMoneyMajor,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatDate,
  minorUnitExponent,
} from "@/lib/i18n/format"
import { t, createTranslator } from "@/lib/i18n/messages"
import { resolveLocale, negotiateAcceptLanguage } from "@/lib/i18n/locale"
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/config"

// The legacy GB money formatter we must remain byte-identical to.
function legacyMoneyPence(pence: number, currency = "GBP"): string {
  const amount = pence / 100
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

describe("formatMoney — GBP/en-GB matches the legacy formatter exactly", () => {
  const cases = [0, 1, 50, 99, 100, 120000, 123456, 99999, 250000, 7, 1000000]
  for (const pence of cases) {
    it(`matches for ${pence} pence`, () => {
      expect(formatMoney(pence, "GBP", "en-GB")).toBe(legacyMoneyPence(pence))
    })
  }

  it("formats whole pounds without decimals (£1,200)", () => {
    expect(formatMoney(120000, "GBP", "en-GB")).toBe("£1,200")
  })

  it("formats fractional pounds with 2 decimals (£1,234.56)", () => {
    expect(formatMoney(123456, "GBP", "en-GB")).toBe("£1,234.56")
  })

  it("defaults to en-GB / GBP when locale & currency omitted", () => {
    expect(formatMoney(123456)).toBe("£1,234.56")
  })

  it("returns em dash for null / NaN", () => {
    expect(formatMoney(null)).toBe("—")
    expect(formatMoney(undefined)).toBe("—")
    expect(formatMoney(Number.NaN)).toBe("—")
  })
})

describe("formatMoney — multi-currency & minor units", () => {
  it("handles zero-decimal currencies (JPY: 123456 minor units = whole yen, no decimals)", () => {
    expect(minorUnitExponent("JPY")).toBe(0)
    // en-GB disambiguates yen as "JP¥"; the key proof is no division/decimals.
    expect(formatMoney(123456, "JPY", "en-GB")).toBe("JP¥123,456")
    // Native ja-JP renders the bare ¥ symbol.
    expect(formatMoney(123456, "JPY", "ja-JP")).toBe("￥123,456")
  })

  it("uses locale-correct grouping/symbol for EUR in fr-FR", () => {
    // fr-FR groups with thin space and trails the € symbol.
    const out = formatMoney(123456, "EUR", "fr-FR")
    expect(out).toContain("€")
    expect(out).toContain("234")
  })

  it("formatMoneyMajor does not divide by minor units", () => {
    expect(formatMoneyMajor(1234.56, "GBP", "en-GB")).toBe("£1,234.56")
  })
})

describe("formatNumber / formatPercent / formatDate / formatRelativeTime", () => {
  it("groups thousands for en-GB", () => {
    expect(formatNumber(1234567, undefined, "en-GB")).toBe("1,234,567")
  })

  it("formats a ratio as percent", () => {
    expect(formatPercent(0.125, undefined, "en-GB")).toBe("12.5%")
  })

  it("supports already-percent inputs", () => {
    expect(formatPercent(12.5, { alreadyPercent: true }, "en-GB")).toBe("12.5%")
  })

  it("formats a yyyy-mm-dd date in en-GB medium style", () => {
    // en-GB medium → "15 Jun 2026"
    expect(formatDate("2026-06-15", undefined, "en-GB")).toBe("15 Jun 2026")
  })

  it("produces relative time in the past", () => {
    const now = new Date("2026-06-15T12:00:00Z")
    const earlier = new Date("2026-06-15T09:00:00Z")
    expect(formatRelativeTime(earlier, "en-GB", now)).toBe("3 hours ago")
  })
})

describe("t() — fallback chain & interpolation", () => {
  it("returns the active-locale string", () => {
    expect(t("fr-FR", "actions.save")).toBe("Enregistrer")
  })

  it("falls back to en-GB for a missing key in the active locale", () => {
    // fr-FR has no actions.upload → en-GB "Upload"
    expect(t("fr-FR", "actions.upload")).toBe("Upload")
  })

  it("falls back to the key itself when nowhere defined", () => {
    expect(t("en-GB", "totally.unknown.key")).toBe("totally.unknown.key")
  })

  it("interpolates params", () => {
    expect(t("en-GB", "common.greeting", { name: "Sam" })).toBe("Welcome back, Sam")
  })

  it("leaves unknown placeholders intact (no crash)", () => {
    expect(t("en-GB", "common.greeting")).toBe("Welcome back, {name}")
  })

  it("treats an unsupported locale as en-GB", () => {
    expect(t("xx-YY", "actions.save")).toBe("Save")
    expect(t(null, "actions.save")).toBe("Save")
  })

  it("createTranslator binds a locale", () => {
    const tr = createTranslator("fr-FR")
    expect(tr("actions.cancel")).toBe("Annuler")
  })
})

describe("resolveLocale — priority order & GB default invariant", () => {
  it("defaults to en-GB with no signals", () => {
    expect(resolveLocale()).toBe(DEFAULT_LOCALE)
    expect(resolveLocale({})).toBe("en-GB")
  })

  it("profile beats workspace beats header", () => {
    expect(
      resolveLocale({
        profileLocale: "fr-FR",
        workspaceLocale: "de-DE",
        acceptLanguage: "es-ES",
      })
    ).toBe("fr-FR")
  })

  it("uses workspace when no profile preference", () => {
    expect(resolveLocale({ workspaceLocale: "de-DE" })).toBe("de-DE")
  })

  it("loose-matches a bare primary subtag (en → en-GB)", () => {
    expect(resolveLocale({ profileLocale: "en" })).toBe("en-GB")
    expect(resolveLocale({ workspaceLocale: "fr" })).toBe("fr-FR")
  })

  it("negotiates Accept-Language by q-weight", () => {
    expect(negotiateAcceptLanguage("fr-FR,en;q=0.8")).toBe("fr-FR")
    expect(negotiateAcceptLanguage("en-AU,en;q=0.9")).toBe("en-GB")
    expect(negotiateAcceptLanguage("")).toBeNull()
    expect(negotiateAcceptLanguage("*")).toBeNull()
  })

  it("falls through unsupported signals to en-GB", () => {
    expect(resolveLocale({ profileLocale: "zz-ZZ", acceptLanguage: "zz" })).toBe("en-GB")
  })
})

describe("config guards", () => {
  it("isSupportedLocale", () => {
    expect(isSupportedLocale("en-GB")).toBe(true)
    expect(isSupportedLocale("en-US")).toBe(true)
    expect(isSupportedLocale("xx-YY")).toBe(false)
    expect(isSupportedLocale(null)).toBe(false)
  })
})
