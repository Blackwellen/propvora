"use client"

import { useEffect, useRef, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

const TIMEOUT_MS = 30 * 60 * 1000   // 30 minutes
const WARN_BEFORE_MS = 60 * 1000    // warn 1 minute before sign-out
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const

/**
 * Signs the user out after TIMEOUT_MS of inactivity.
 * Shows a browser confirm dialog WARN_BEFORE_MS before expiry so the user can
 * extend the session. Mount once in AppShell (client component).
 */
export function useInactivityTimeout() {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningShownRef = useRef(false)

  const signOut = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    router.push("/login?reason=timeout")
  }, [router])

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warnRef.current) clearTimeout(warnRef.current)
    warningShownRef.current = false

    warnRef.current = setTimeout(() => {
      if (warningShownRef.current) return
      warningShownRef.current = true
      const extend = window.confirm(
        "You have been inactive for 29 minutes.\n\nClick OK to stay signed in, or Cancel to sign out now.",
      )
      if (extend) {
        reset()
      } else {
        void signOut()
      }
    }, TIMEOUT_MS - WARN_BEFORE_MS)

    timeoutRef.current = setTimeout(() => {
      void signOut()
    }, TIMEOUT_MS)
  }, [signOut])

  useEffect(() => {
    reset()
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, reset, { passive: true })
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warnRef.current) clearTimeout(warnRef.current)
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, reset)
      }
    }
  }, [reset])
}
