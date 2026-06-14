"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"
import {
  acceptAll,
  defaultPreferences,
  getConsent,
  hasStoredConsent,
  OPEN_COOKIE_PREFERENCES_EVENT,
  rejectNonEssential,
  setConsent,
  type ConsentPreferences,
} from "@/lib/consent"

/**
 * UK-GDPR / PECR cookie consent banner + preferences modal.
 *
 * - Necessary cookies are exempt and always on.
 * - Analytics + marketing are OFF until the user explicitly opts in here.
 * - Hidden once any valid choice for the current policy version is stored.
 * - Re-openable via the `open-cookie-preferences` window event (footer link).
 */
export default function CookieConsent() {
  // Start hidden so SSR markup matches; decide on mount (avoids hydration flash).
  const [visible, setVisible] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [prefs, setPrefs] = useState<ConsentPreferences>(defaultPreferences)

  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeModalBtnRef = useRef<HTMLButtonElement | null>(null)

  // Decide visibility on mount + listen for re-open requests.
  useEffect(() => {
    if (!hasStoredConsent()) setVisible(true)

    const openPreferences = () => {
      const existing = getConsent()
      setPrefs(
        existing
          ? {
              necessary: true,
              analytics: existing.analytics,
              marketing: existing.marketing,
            }
          : defaultPreferences(),
      )
      setVisible(true)
      setPrefsOpen(true)
    }

    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences)
    return () =>
      window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences)
  }, [])

  // ESC closes the modal; focus the close button when it opens.
  useEffect(() => {
    if (!prefsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPrefsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    closeModalBtnRef.current?.focus()
    return () => window.removeEventListener("keydown", onKey)
  }, [prefsOpen])

  const handleAcceptAll = useCallback(() => {
    acceptAll()
    setVisible(false)
    setPrefsOpen(false)
  }, [])

  const handleRejectNonEssential = useCallback(() => {
    rejectNonEssential()
    setVisible(false)
    setPrefsOpen(false)
  }, [])

  const handleSavePreferences = useCallback(() => {
    setConsent({ analytics: prefs.analytics, marketing: prefs.marketing })
    setVisible(false)
    setPrefsOpen(false)
  }, [prefs])

  if (!visible) return null

  return (
    <>
      {/* Banner */}
      {!prefsOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
              <div className="flex flex-1 items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
                  <Cookie className="h-5 w-5 text-blue-600" aria-hidden="true" />
                </div>
                <div className="text-sm leading-relaxed text-slate-600">
                  <p>
                    We use strictly necessary cookies to run Propvora. With your
                    consent we&apos;d also use analytics cookies to improve the
                    product. See our{" "}
                    <Link
                      href="/legal/cookies"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      Cookie Policy
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/legal/privacy"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPrefsOpen(true)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Preferences
                </button>
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Reject non-essential
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences modal */}
      {prefsOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setPrefsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-prefs-title"
            className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
                  <Cookie className="h-5 w-5 text-blue-600" aria-hidden="true" />
                </div>
                <h2
                  id="cookie-prefs-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Cookie preferences
                </h2>
              </div>
              <button
                ref={closeModalBtnRef}
                type="button"
                onClick={() => setPrefsOpen(false)}
                aria-label="Close cookie preferences"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <ToggleRow
                title="Strictly necessary"
                description="Required for sign-in, security and core platform functionality. These cannot be switched off."
                checked
                locked
              />
              <ToggleRow
                title="Analytics"
                description="Help us understand how Propvora is used so we can improve it. No data is collected until you allow this."
                checked={prefs.analytics}
                onChange={(value) =>
                  setPrefs((p) => ({ ...p, analytics: value }))
                }
              />
              <ToggleRow
                title="Marketing"
                description="Used to measure and improve our marketing. Off by default."
                checked={prefs.marketing}
                onChange={(value) =>
                  setPrefs((p) => ({ ...p, marketing: value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  locked = false,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  locked?: boolean
  onChange?: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={locked}
        onClick={() => onChange?.(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-slate-300"
        } ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}
