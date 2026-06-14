"use client"

import { openCookiePreferences } from "@/lib/consent"

/**
 * Footer affordance that reopens the cookie preferences modal by dispatching
 * the `open-cookie-preferences` window event that <CookieConsent/> listens for.
 * Styled to match the surrounding footer links.
 */
export default function CookiePreferencesLink({
  className,
}: {
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferences()}
      className={
        className ??
        "text-sm text-slate-500 hover:text-slate-900 transition-colors text-left"
      }
    >
      Cookie preferences
    </button>
  )
}
