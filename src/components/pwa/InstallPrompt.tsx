"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Download, X, Share } from "lucide-react"
import {
  canShowInstallPrompt,
  isBlockedPath,
  readDismissedAt,
  readInstalled,
  persistDismissed,
  persistInstalled,
} from "./installPromptLogic"

/* ──────────────────────────────────────────────────────────────────────────
   PWA install prompt — SINGLE centralised owner (mounted once in app/layout).

   Behaviour:
   - Appears at most once per session, and never within the 21-day cooldown
     after a dismissal (timestamp persisted in localStorage).
   - Never in standalone (Android/desktop installed OR iOS home-screen).
   - Never on form / wizard / checkout / onboarding routes (isBlockedPath).
   - Does NOT re-fire on route changes: the deferred event is captured once and
     a one-shot guard prevents re-evaluation. (Navigating INTO a blocked route
     while visible hides it; it is not re-shown automatically.)
   - The eligibility policy itself lives in installPromptLogic.ts (unit-tested).
─────────────────────────────────────────────────────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
}

export default function InstallPrompt() {
  const pathname = usePathname()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  // One-shot: once we've shown (or decided) in this session we never re-trigger.
  const decidedRef = useRef(false)

  // Capture the beforeinstallprompt / appinstalled events ONCE.
  useEffect(() => {
    if (isStandalone()) return
    if (readInstalled()) return

    const eligible = () =>
      canShowInstallPrompt({
        standalone: isStandalone(),
        pathname: window.location.pathname,
        dismissedAt: readDismissedAt(),
        installed: readInstalled(),
      })

    const onBip = (e: Event) => {
      e.preventDefault()
      // Always keep the latest deferred event so the Install button works even
      // if the banner is shown later — but only flip `show` when eligible.
      setDeferred(e as BeforeInstallPromptEvent)
      if (decidedRef.current) return
      if (!eligible()) return
      decidedRef.current = true
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", onBip)

    // iOS never fires beforeinstallprompt — show manual instructions after a
    // beat, but only if eligible and not on a blocked route.
    let t: ReturnType<typeof setTimeout> | undefined
    if (isIos()) {
      t = setTimeout(() => {
        if (decidedRef.current) return
        if (!eligible()) return
        decidedRef.current = true
        setIosHint(true)
        setShow(true)
      }, 4000)
    }

    const onInstalled = () => {
      persistInstalled()
      setShow(false)
    }
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip)
      window.removeEventListener("appinstalled", onInstalled)
      if (t) clearTimeout(t)
    }
  }, [])

  // Hide the banner the moment the user enters a blocked route (form/wizard/
  // checkout/onboarding). We never auto-re-show it after this.
  useEffect(() => {
    if (show && isBlockedPath(pathname)) setShow(false)
  }, [pathname, show])

  function dismiss() {
    setShow(false)
    persistDismissed()
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    try {
      const choice = await deferred.userChoice
      if (choice?.outcome === "accepted") persistInstalled()
    } catch {
      /* ignore */
    }
    setDeferred(null)
    dismiss()
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] z-[70] pwa-safe-bottom">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,var(--brand),var(--accent))" }}>
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Install Propvora</p>
          {iosHint ? (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Tap <Share className="inline w-3.5 h-3.5 align-text-bottom" /> Share, then <strong>Add to Home Screen</strong> for the full app experience.
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Add Propvora to your home screen for faster access and a full-screen experience.
            </p>
          )}
          {!iosHint && (
            <button onClick={install} className="mt-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5">
              Install app
            </button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
