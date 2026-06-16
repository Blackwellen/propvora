"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/* ──────────────────────────────────────────────────────────────────────────
   useSupplierApi — tolerant client-side fetch for the supplier-workspace
   pages. This hook NEVER throws into render.

   IMPORTANT (regression history): every supplier tab once called its API with
   NO `?workspaceId=`, the route answered 400, and this hook silently folded that
   into `notReady` → a permanent, calm "coming online" screen that hid a real
   wiring bug. Two changes guard against that recurring:

     1. Callers now always thread `workspaceId` (via SupplierWorkspaceContext)
        and pass a `null` url until it is known, so a 400-missing-param can no
        longer happen by construction.
     2. This hook now distinguishes "not provisioned" (404/503 — the endpoint
        genuinely isn't there yet → calm empty state) from a REAL failure
        (400/401/403/5xx/malformed/network). Real failures still degrade
        gracefully (data:null) but set `error = true` AND are logged to
        observability, so a future regression is visible to QA instead of
        masquerading as an empty state.
─────────────────────────────────────────────────────────────────────────── */

export interface SupplierApiState<T> {
  data: T | null
  /** True only while the very first request is in flight. */
  loading: boolean
  /**
   * The endpoint isn't available (HTTP 404/503) or a real failure occurred.
   * Pages use this to render a calm "coming online" state. Prefer reading
   * `error` to tell a genuine regression apart from a not-yet-provisioned route.
   */
  notReady: boolean
  /**
   * A REAL failure occurred (400/401/403/5xx, malformed JSON, or a network
   * error) — as opposed to a route that simply isn't provisioned yet (404/503).
   * Logged to observability when set. Surface this to QA dashboards.
   */
  error: boolean
  /** Re-run the request. */
  refresh: () => void
}

/** 404/503 mean "this route isn't provisioned yet" — a calm, expected state. */
function isNotProvisionedStatus(status: number): boolean {
  return status === 404 || status === 503
}

/**
 * Fetch JSON from a supplier/marketplace endpoint. `select` lets a page pull a
 * nested array/object out of the envelope (e.g. `(j) => j.jobs ?? j.data ?? j`).
 */
export function useSupplierApi<T = unknown>(
  url: string | null,
  options?: {
    select?: (json: unknown) => T
    /** Skip the request entirely (e.g. waiting on a dependency). */
    skip?: boolean
  }
): SupplierApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(url) && !options?.skip)
  const [notReady, setNotReady] = useState(false)
  const [error, setError] = useState(false)
  const [nonce, setNonce] = useState(0)
  const selectRef = useRef(options?.select)
  selectRef.current = options?.select

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!url || options?.skip) {
      setLoading(false)
      return
    }
    let active = true
    const controller = new AbortController()
    setLoading(true)
    setNotReady(false)
    setError(false)

    fetch(url, { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!active) return
        if (!res.ok) {
          setData(null)
          setNotReady(true)
          if (!isNotProvisionedStatus(res.status)) {
            // A genuine failure (400/401/403/5xx) — NOT a missing route. Make it
            // visible rather than masking it as a calm empty state.
            setError(true)
            // eslint-disable-next-line no-console
            console.error(
              `[useSupplierApi] ${res.status} from ${url} — this is a real error, not "not provisioned". Check the workspaceId/query params.`
            )
          }
          return
        }
        let json: unknown = null
        try {
          json = await res.json()
        } catch {
          setData(null)
          setNotReady(true)
          setError(true)
          // eslint-disable-next-line no-console
          console.error(`[useSupplierApi] malformed JSON from ${url}`)
          return
        }
        const selected = selectRef.current ? selectRef.current(json) : (json as T)
        setData(selected)
      })
      .catch((err: unknown) => {
        if (!active) return
        // AbortError (unmount/re-run) is benign — ignore it entirely.
        if (err instanceof DOMException && err.name === "AbortError") return
        // Any other network/runtime failure is a real error.
        setData(null)
        setNotReady(true)
        setError(true)
        // eslint-disable-next-line no-console
        console.error(`[useSupplierApi] network error fetching ${url}`, err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, options?.skip, nonce])

  return { data, loading, notReady, error, refresh }
}
