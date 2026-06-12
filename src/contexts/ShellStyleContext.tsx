"use client"

import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ShellStyle, ShellLayout, ShellPrefs, ShellTokens,
  DEFAULT_SHELL_PREFS, SHELL_TOKENS, SHELL_PREFS_CACHE_KEY,
} from "@/lib/shell"

/* ------------------------------------------------------------------ */
/* Context shape                                                        */
/* ------------------------------------------------------------------ */
interface ShellStyleContextValue {
  prefs: ShellPrefs
  tokens: ShellTokens
  setStyle: (s: ShellStyle) => void
  setLayout: (l: ShellLayout) => void
  setCollapsed: (v: boolean) => void
  setTopNavCompact: (v: boolean) => void
  savePrefs: () => Promise<void>
  resetPrefs: () => void
  isSaving: boolean
  isSaved: boolean
  isLoaded: boolean
}

const ShellStyleContext = createContext<ShellStyleContextValue | null>(null)

export function useShellStyle(): ShellStyleContextValue {
  const ctx = useContext(ShellStyleContext)
  if (!ctx) throw new Error("useShellStyle must be used within ShellStyleProvider")
  return ctx
}

/* ------------------------------------------------------------------ */
/* localStorage helpers                                                 */
/* ------------------------------------------------------------------ */
function loadCachedPrefs(): ShellPrefs {
  if (typeof window === "undefined") return DEFAULT_SHELL_PREFS
  try {
    const raw = localStorage.getItem(SHELL_PREFS_CACHE_KEY)
    if (!raw) return DEFAULT_SHELL_PREFS
    return { ...DEFAULT_SHELL_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SHELL_PREFS
  }
}

function cachePrefs(prefs: ShellPrefs) {
  try {
    localStorage.setItem(SHELL_PREFS_CACHE_KEY, JSON.stringify(prefs))
  } catch { /* localStorage might be blocked in some envs */ }
}

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */
export function ShellStyleProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<ShellPrefs>(loadCachedPrefs)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from Supabase on mount; use localStorage value immediately to avoid flicker
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) { setIsLoaded(true); return }

        const { data } = await supabase
          .from("profiles")
          .select("shell_preferences")
          .eq("id", user.id)
          .single()

        if (!cancelled && data?.shell_preferences) {
          const loaded: ShellPrefs = { ...DEFAULT_SHELL_PREFS, ...(data.shell_preferences as Partial<ShellPrefs>) }
          setPrefsState(loaded)
          cachePrefs(loaded)
        }
      } catch {
        // Network error or column not yet migrated — silently fall back to cached/default
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const updatePrefs = useCallback((patch: Partial<ShellPrefs>) => {
    setPrefsState(p => {
      const next = { ...p, ...patch }
      cachePrefs(next)
      return next
    })
  }, [])

  const setStyle       = useCallback((s: ShellStyle)  => updatePrefs({ shell_style: s }),         [updatePrefs])
  const setLayout      = useCallback((l: ShellLayout) => updatePrefs({ shell_layout: l }),        [updatePrefs])
  const setCollapsed   = useCallback((v: boolean)     => updatePrefs({ side_nav_collapsed: v }),  [updatePrefs])
  const setTopNavCompact = useCallback((v: boolean)   => updatePrefs({ top_nav_compact: v }),     [updatePrefs])
  const resetPrefs     = useCallback(()               => updatePrefs({ ...DEFAULT_SHELL_PREFS }), [updatePrefs])

  const savePrefs = useCallback(async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      await supabase
        .from("profiles")
        .update({ shell_preferences: prefs, updated_at: new Date().toISOString() })
        .eq("id", user.id)
      setIsSaved(true)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setIsSaved(false), 2500)
    } finally {
      setIsSaving(false)
    }
  }, [prefs])

  const tokens = SHELL_TOKENS[prefs.shell_style]

  return (
    <ShellStyleContext.Provider value={{
      prefs, tokens,
      setStyle, setLayout, setCollapsed, setTopNavCompact,
      savePrefs, resetPrefs,
      isSaving, isSaved, isLoaded,
    }}>
      {children}
    </ShellStyleContext.Provider>
  )
}
