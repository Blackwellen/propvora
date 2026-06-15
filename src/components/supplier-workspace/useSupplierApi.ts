"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/* ──────────────────────────────────────────────────────────────────────────
   useSupplierApi — tolerant client-side fetch for the supplier-workspace
   pages. Sibling agents own the `/api/supplier/*` and `/api/marketplace/*`
   routes; they may not exist yet. This hook NEVER throws into render: a
   non-200, a network error, or an absent route all resolve to `data: null`
   with `notReady = true`, so pages fall back to premium empty states.
─────────────────────────────────────────────────────────────────────────── */

export interface SupplierApiState<T> {
  data: T | null
  /** True only while the very first request is in flight. */
  loading: boolean
  /** The endpoint responded but with a non-2xx status (or could not be reached). */
  notReady: boolean
  /** Re-run the request. */
  refresh: () => void
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

    fetch(url, { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!active) return
        if (!res.ok) {
          setNotReady(true)
          setData(null)
          return
        }
        let json: unknown = null
        try {
          json = await res.json()
        } catch {
          setNotReady(true)
          setData(null)
          return
        }
        const selected = selectRef.current ? selectRef.current(json) : (json as T)
        setData(selected)
      })
      .catch(() => {
        if (!active) return
        // AbortError (unmount/re-run) is benign — treat everything else as "not ready".
        setNotReady(true)
        setData(null)
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

  return { data, loading, notReady, refresh }
}
