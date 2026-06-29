"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Enterprise idle-session timeout for the authenticated app shell.
 *
 * Browsers persist a Supabase session (refresh token) indefinitely, so a user
 * left on the dashboard — or the marketing "Open app" button — stays logged in
 * forever. That's not acceptable for an operator workspace handling tenant PII.
 *
 * Rule:
 *   • In a normal BROWSER tab: hard cap of {IDLE_LIMIT_MS} (1h) of inactivity.
 *     Activity = any pointer/keyboard/scroll interaction OR a route change inside
 *     the app. When the window elapses, we sign out and hard-route to
 *     /login?reason=timeout (which shows the "session expired" notice and the
 *     normal login buttons — exactly the enterprise re-auth flow).
 *   • In an INSTALLED PWA (display-mode: standalone): no idle logout — a PWA is a
 *     trusted, device-owned surface and should behave like a native app.
 *
 * The timer is debounced via a single setTimeout that we reset on activity, so
 * it costs nothing per event beyond a cheap timestamp + timer reset.
 */

const IDLE_LIMIT_MS = 60 * 60 * 1000 // 1 hour

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false
  // iOS Safari uses navigator.standalone; everything else uses display-mode.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  const displayStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: window-controls-overlay)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches
  return Boolean(iosStandalone || displayStandalone)
}

export default function IdleSessionGuard() {
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expiredRef = useRef(false)

  useEffect(() => {
    // PWA is exempt — behave like a native app and stay signed in.
    if (isStandalonePwa()) return

    let cancelled = false

    const expire = async () => {
      if (expiredRef.current || cancelled) return
      expiredRef.current = true
      try {
        await createClient().auth.signOut()
      } catch {
        /* sign-out is best-effort; we redirect regardless */
      }
      // Hard navigation (not router.push) so the proxy re-evaluates auth and the
      // login page mounts fresh with the timeout notice + normal buttons.
      window.location.assign("/login?reason=timeout")
    }

    const reset = () => {
      if (expiredRef.current) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => void expire(), IDLE_LIMIT_MS)
    }

    // Activity signals — passive listeners, throttled by the timer reset itself.
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "scroll",
      "wheel",
      "touchstart",
      "mousemove",
    ]
    for (const e of events) window.addEventListener(e, reset, { passive: true })

    // When the tab is hidden then revisited, check elapsed time immediately so a
    // backgrounded tab past the limit logs out on return rather than waiting.
    const onVisibility = () => {
      if (document.visibilityState === "visible") reset()
    }
    document.addEventListener("visibilitychange", onVisibility)

    reset() // arm on mount / route change

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const e of events) window.removeEventListener(e, reset)
      document.removeEventListener("visibilitychange", onVisibility)
    }
    // Re-arm on every in-app navigation: a dashboard route change counts as activity.
  }, [pathname])

  return null
}
