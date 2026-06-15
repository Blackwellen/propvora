"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

/* ──────────────────────────────────────────────────────────────────────────
   Breakpoint primitives — SSR-safe, hydration-safe.

   The Propvora desktop shell switches at Tailwind's `lg` (1024px). The mobile
   component system targets phones (<768) and uses the tablet band (768–1024)
   to keep desktop chrome but allow denser mobile-friendly content where useful.

   Server always reports "desktop" so the first paint matches the desktop markup
   and there is no layout flash before hydration. After mount we subscribe to
   matchMedia and re-render with the real device class.
─────────────────────────────────────────────────────────────────────────── */

export type Breakpoint = "mobile" | "tablet" | "desktop"

export const BREAKPOINTS = {
  /** < 768px — phones. Dedicated mobile components render here. */
  mobile: 768,
  /** 768–1023px — tablets. */
  tablet: 1024,
} as const

const MOBILE_QUERY = `(max-width: ${BREAKPOINTS.mobile - 1}px)`
const TABLET_QUERY = `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`
/** Matches the desktop shell's `lg:` switch so nav branching is consistent. */
const BELOW_DESKTOP_QUERY = `(max-width: ${BREAKPOINTS.tablet - 1}px)`

/* ── Low-level matchMedia subscription via useSyncExternalStore ─────────────
   useSyncExternalStore is the React 18/19 sanctioned way to read external,
   mutable browser state without hydration mismatches: the server snapshot is
   passed explicitly and is used for SSR + the first client render. */
function makeMediaStore(query: string) {
  function subscribe(callback: () => void) {
    if (typeof window === "undefined" || !window.matchMedia) return () => {}
    const mql = window.matchMedia(query)
    // Safari < 14 only supports addListener.
    if (mql.addEventListener) mql.addEventListener("change", callback)
    else mql.addListener(callback)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", callback)
      else mql.removeListener(callback)
    }
  }
  function getSnapshot() {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia(query).matches
  }
  // Server snapshot — always false so the desktop branch renders on the server.
  function getServerSnapshot() {
    return false
  }
  return { subscribe, getSnapshot, getServerSnapshot }
}

/** Generic media-query hook. SSR-safe (returns `false` on the server). */
export function useMediaQuery(query: string): boolean {
  const [store] = useState(() => makeMediaStore(query))
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}

/**
 * Resolve the active device class. Returns "desktop" on the server and during
 * the first client render to keep hydration stable, then settles to the real
 * value after mount.
 */
export function useBreakpoint(): Breakpoint {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const isTablet = useMediaQuery(TABLET_QUERY)
  if (isMobile) return "mobile"
  if (isTablet) return "tablet"
  return "desktop"
}

/** True below 768px — the band where dedicated mobile components take over. */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY)
}

/** True below 1024px — matches the desktop shell's `lg:` nav switch. */
export function useIsBelowDesktop(): boolean {
  return useMediaQuery(BELOW_DESKTOP_QUERY)
}

/**
 * `true` only after the component has mounted on the client. Useful for gating
 * mobile-only portals/sheets so they never render mismatched markup on the
 * server. Pairs with the matchMedia hooks above.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
