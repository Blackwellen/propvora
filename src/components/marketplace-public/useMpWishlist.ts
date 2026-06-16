"use client"

import { useCallback, useEffect, useState } from "react"

/* localStorage-backed wishlist for the public marketplace (anon visitors).
   Mirrors the /stay wishlist but keyed separately. Real, persistent, no fake
   server data invented for anonymous users. */

const KEY = "propvora.marketplace.wishlist"
const EVT = "propvora:mp-wishlist"

function read(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
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
    /* best-effort */
  }
}

export function useMpWishlist() {
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
  return { has, toggle, count: ids.size }
}
