"use client"

import { useEffect } from "react"

// Captures an affiliate referral code from ?ref=CODE into a first-party cookie
// (60-day window, last-click). Read server-side at workspace creation to attribute
// the referral. Purely functional — renders nothing.
export default function RefCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get("ref")
      if (!ref) return
      const clean = ref.trim().slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, "")
      if (!clean) return
      // 60-day cookie, last-click wins (always overwrite).
      const maxAge = 60 * 60 * 24 * 60
      document.cookie = `propvora_ref=${clean}; max-age=${maxAge}; path=/; SameSite=Lax`
    } catch {
      /* no-op */
    }
  }, [])
  return null
}
