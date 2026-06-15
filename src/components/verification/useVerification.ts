"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { normalisePhase, type VerificationStatus } from "./status"

/* ──────────────────────────────────────────────────────────────────────────
   useVerification — tolerant client fetch + poll for `/api/identity/status`.

   • NEVER throws into render: a non-200, network error, or absent route all
     resolve to a not-ready state with status "not_started".
   • Auto-polls while the verification is mid-flight (pending/processing) so the
     UI advances as the provider finishes — and stops once it settles.
   • The returned `status` is the only source of truth; the UI shows "verified"
     solely when this says so.
─────────────────────────────────────────────────────────────────────────── */

const POLL_MS = 4000

export interface UseVerificationResult {
  status: VerificationStatus | null
  loading: boolean
  /** The endpoint could not be reached / isn't provisioned. */
  notReady: boolean
  refresh: () => void
}

export function useVerification(): UseVerificationResult {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const [nonce, setNonce] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch("/api/identity/status", {
          signal: controller.signal,
          headers: { accept: "application/json" },
        })
        if (!active) return
        if (!res.ok) {
          setNotReady(true)
          setStatus(null)
          return
        }
        const json = (await res.json()) as VerificationStatus
        if (!active) return
        setNotReady(Boolean(json?.notReady))
        setStatus(json)
      } catch {
        if (!active) return
        setNotReady(true)
        setStatus(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
      controller.abort()
    }
  }, [nonce])

  // Poll only while mid-flight; clean up on settle/unmount.
  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const phase = normalisePhase(status?.status)
    const midFlight = phase === "pending" || phase === "processing"
    if (midFlight && !notReady) {
      timer.current = setTimeout(() => setNonce((n) => n + 1), POLL_MS)
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [status, notReady])

  return { status, loading, notReady, refresh }
}
