"use client"

import { useCallback, useEffect, useState } from "react"

/* ──────────────────────────────────────────────────────────────────────────
   useWishlist — a localStorage-backed wishlist for the PUBLIC (anon) stay
   surface. Saved-stays for signed-in customers live server-side in
   `customer_saved_listings`; for anonymous visitors we persist a local set so
   the wishlist heart is real and survives a refresh without inventing data.
   Cross-tab + cross-component sync via a custom event + the storage event.
─────────────────────────────────────────────────────────────────────────── */

const KEY = "propvora.stay.wishlist"
const EVT = "propvora:wishlist"

function read(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set()
  } catch {
    return new Set()
  }
}

function write(set: Set<string>) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...set]))
    window.dispatchEvent(new Event(EVT))
  } catch {
    /* quota / private mode — wishlist is best-effort */
  }
}

export function useWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setIds(read())
    const sync = () => setIds(read())
    window.addEventListener(EVT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const toggle = useCallback((id: string) => {
    const next = read()
    if (next.has(id)) next.delete(id)
    else next.add(id)
    write(next)
    setIds(new Set(next))
  }, [])

  const has = useCallback((id: string) => ids.has(id), [ids])

  return { ids, has, toggle, count: ids.size }
}
