'use client'

import { useCallback, useEffect, useState } from 'react'

// ============================================================
// Sub-tab state synced to the `?tab=` query param so detail
// sub-tabs are deep-linkable and survive a hard refresh and
// browser back/forward — without `useSearchParams` (which would
// force a Suspense boundary). Uses the History API directly and
// is SSR-safe (guards `window`).
// ============================================================

function readTabFromUrl<T extends string>(tabs: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback
  const raw = new URLSearchParams(window.location.search).get('tab')
  if (!raw) return fallback
  // Case-insensitive match so `?tab=overview` resolves to "Overview".
  const match = tabs.find((t) => t.toLowerCase() === raw.toLowerCase())
  return match ?? fallback
}

export function useTabParam<T extends string>(tabs: readonly T[], defaultTab: T): [T, (tab: T) => void] {
  // Initialise to the default on BOTH server and client so the first render is
  // deterministic (no hydration mismatch). The URL's `?tab=` value is adopted
  // in a post-mount effect below — deep-link, refresh and back/forward all work.
  const [activeTab, setActiveTab] = useState<T>(defaultTab)

  const setTab = useCallback(
    (tab: T) => {
      setActiveTab(tab)
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      if (tab === defaultTab) url.searchParams.delete('tab')
      else url.searchParams.set('tab', tab)
      window.history.replaceState(window.history.state, '', url.toString())
    },
    [defaultTab]
  )

  // After mount, adopt the tab from the URL (deep-link / refresh) and keep it in
  // sync on browser back/forward.
  useEffect(() => {
    setActiveTab(readTabFromUrl(tabs, defaultTab))
    const onPop = () => setActiveTab(readTabFromUrl(tabs, defaultTab))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [activeTab, setTab]
}
