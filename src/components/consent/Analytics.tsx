"use client"

import { useEffect } from "react"
import { hasConsent, onConsentChange } from "@/lib/consent"

/**
 * Consent-gated Google Analytics (GA4 / gtag) loader.
 *
 * PRIVACY-BY-DESIGN
 * ─────────────────
 * - Loads NOTHING until the visitor has granted the `analytics` consent
 *   category. No GA cookies or network calls happen before then.
 * - The GA domains (googletagmanager.com / google-analytics.com) are already
 *   whitelisted in the CSP (next.config.ts); this component is the only place
 *   that actually loads them, and only after consent.
 * - On consent WITHDRAWAL we flip GA's own Consent Mode to "denied" and set the
 *   global opt-out flag so any already-loaded gtag stops collecting. We do not
 *   attempt to re-inject after that.
 * - Entirely env-driven: with no NEXT_PUBLIC_GA_MEASUREMENT_ID set this is a
 *   complete no-op, so non-configured environments load zero analytics.
 *
 * Marketing pixels (if ever added) must be gated on the `marketing` category in
 * the same pattern — see hasConsent("marketing").
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    [key: `ga-disable-${string}`]: boolean | undefined
  }
}

let scriptInjected = false

function injectGtag(measurementId: string) {
  if (scriptInjected || typeof document === "undefined") return
  scriptInjected = true

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  // Consent Mode: analytics granted (we only reach here after explicit consent),
  // everything else denied by default.
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  })
  window.gtag("js", new Date())
  // IP anonymisation on by default for UK/EU GDPR.
  window.gtag("config", measurementId, { anonymize_ip: true })

  const s = document.createElement("script")
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(s)
}

function denyAnalytics(measurementId: string) {
  if (typeof window === "undefined") return
  // Hard opt-out switch GA respects even if already loaded.
  window[`ga-disable-${measurementId}`] = true
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: "denied" })
  }
}

export default function Analytics() {
  useEffect(() => {
    if (!GA_ID) return // unconfigured → no-op

    const apply = () => {
      if (hasConsent("analytics")) {
        window[`ga-disable-${GA_ID}`] = false
        injectGtag(GA_ID)
        if (scriptInjected && typeof window.gtag === "function") {
          window.gtag("consent", "update", { analytics_storage: "granted" })
        }
      } else {
        denyAnalytics(GA_ID)
      }
    }

    apply() // evaluate current stored consent on mount
    const unsubscribe = onConsentChange(apply) // re-evaluate on change/withdrawal
    return unsubscribe
  }, [])

  return null
}
