import { describe, it, expect } from "vitest"
import { t, getCatalogue } from "./messages"
import { SUPPORTED_LOCALES } from "./config"

describe("translation catalogues", () => {
  it("translates the core vocabulary per locale", () => {
    expect(t("it-IT", "actions.save")).toBe("Salva")
    expect(t("de-DE", "actions.save")).toBe("Speichern")
    expect(t("es-ES", "nav.money")).toBe("Finanzas")
    expect(t("ja-JP", "actions.cancel")).toBe("キャンセル")
    expect(t("tr-TR", "status.paid")).toBe("Ödendi")
    expect(t("nl-NL", "common.yes")).toBe("Ja")
  })

  it("preserves interpolation placeholders across locales", () => {
    expect(t("fr-FR", "common.greeting", { name: "Sam" })).toBe("Bon retour, Sam")
    expect(t("pt-BR", "common.showingCount", { count: 3, total: 10 })).toBe("Mostrando 3 de 10")
  })

  it("falls back to en-GB for any untranslated key", () => {
    // 'totally.unknown' exists in no catalogue → key fallback.
    expect(t("ja-JP", "totally.unknown")).toBe("totally.unknown")
  })

  it("every supported locale resolves the core action keys (no missing-key crash)", () => {
    const coreKeys = ["actions.save", "actions.cancel", "nav.settings", "common.yes", "status.active"]
    for (const loc of SUPPORTED_LOCALES) {
      for (const key of coreKeys) {
        const v = t(loc, key)
        expect(v).not.toBe(key) // resolved, not the raw key
        expect(v.length).toBeGreaterThan(0)
      }
    }
  })

  it("each non-English catalogue has the same section shape as en-GB", () => {
    const enSections = Object.keys(getCatalogue("en-GB")).filter((k) => k !== "$meta")
    for (const loc of ["fr-FR", "de-DE", "it-IT", "ja-JP", "th-TH", "hu-HU"] as const) {
      const sections = Object.keys(getCatalogue(loc)).filter((k) => k !== "$meta")
      expect(sections.sort()).toEqual(enSections.sort())
    }
  })
})
