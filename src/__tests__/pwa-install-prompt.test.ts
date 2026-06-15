/**
 * PWA install-prompt suppression policy — pure-logic unit tests.
 * Covers: standalone, installed, dismissal cooldown window, blocked routes.
 */
import { describe, it, expect } from "vitest"
import {
  canShowInstallPrompt,
  isBlockedPath,
  SUPPRESS_DAYS,
} from "@/components/pwa/installPromptLogic"

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_700_000_000_000

const base = {
  standalone: false,
  pathname: "/app",
  dismissedAt: null as number | null,
  installed: false,
  now: NOW,
}

describe("canShowInstallPrompt", () => {
  it("shows for a fresh, eligible user on a normal route", () => {
    expect(canShowInstallPrompt(base)).toBe(true)
  })

  it("never shows in standalone (installed PWA / iOS home screen)", () => {
    expect(canShowInstallPrompt({ ...base, standalone: true })).toBe(false)
  })

  it("never shows once installed", () => {
    expect(canShowInstallPrompt({ ...base, installed: true })).toBe(false)
  })

  it("suppresses within the dismissal cooldown window", () => {
    const dismissedAt = NOW - 3 * DAY
    expect(canShowInstallPrompt({ ...base, dismissedAt })).toBe(false)
  })

  it("re-shows after the cooldown window elapses", () => {
    const dismissedAt = NOW - (SUPPRESS_DAYS + 1) * DAY
    expect(canShowInstallPrompt({ ...base, dismissedAt })).toBe(true)
  })

  it("still suppressed exactly one day before the window closes", () => {
    const dismissedAt = NOW - (SUPPRESS_DAYS - 1) * DAY
    expect(canShowInstallPrompt({ ...base, dismissedAt })).toBe(false)
  })

  it("never shows on form / wizard / checkout / onboarding routes", () => {
    for (const p of [
      "/onboarding",
      "/app/welcome",
      "/checkout",
      "/billing/upgrade",
      "/login",
      "/auth/callback",
      "/app/properties/new",
      "/affiliate-programme/apply",
      "/app/planning/abc/build",
    ]) {
      expect(canShowInstallPrompt({ ...base, pathname: p })).toBe(false)
    }
  })
})

describe("isBlockedPath", () => {
  it("blocks form/wizard/checkout/onboarding paths", () => {
    expect(isBlockedPath("/onboarding/step-2")).toBe(true)
    expect(isBlockedPath("/app/jobs/new")).toBe(true)
    expect(isBlockedPath("/checkout/confirm")).toBe(true)
    expect(isBlockedPath("/register")).toBe(true)
  })

  it("allows normal app + marketing routes", () => {
    expect(isBlockedPath("/app")).toBe(false)
    expect(isBlockedPath("/app/portfolio")).toBe(false)
    expect(isBlockedPath("/")).toBe(false)
    expect(isBlockedPath(null)).toBe(false)
  })
})
