"use client"

import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TUTORIALS, PORTAL_TUTORIALS } from "./data/defaultTutorialTemplates"
import type { Tutorial, HelpStatus, TutorialSurface } from "./tutorial-types"

const ALL_TUTORIALS = [...TUTORIALS, ...PORTAL_TUTORIALS]

const SEEN_LS = "propvora.help.seen"
const ENABLED_LS = "propvora.help.enabled"

interface GuidedHelpValue {
  ready: boolean
  enabled: boolean
  setEnabled: (v: boolean) => void
  tutorials: Tutorial[]
  isSeen: (key: string) => boolean
  markStatus: (key: string, status: HelpStatus) => void
  resetAll: () => void
  /** The first-use tutorial that should auto-open for a given route (or null). */
  firstUseFor: (pathname: string) => Tutorial | null
  /** A tutorial forced open from the launcher (overrides route-based). */
  forced: Tutorial | null
  openTutorial: (key: string) => void
  clearForced: () => void
}

const Ctx = createContext<GuidedHelpValue | null>(null)

function readLocalSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_LS)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

export function GuidedHelpProvider({
  children,
  workspaceId,
  surface = "app",
}: {
  children: React.ReactNode
  workspaceId?: string
  surface?: TutorialSurface
}) {
  const scoped = useMemo(() => ALL_TUTORIALS.filter((t) => (t.surface ?? "app") === surface), [surface])
  const [ready, setReady] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [enabled, setEnabledState] = useState(true)
  const [forcedKey, setForcedKey] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  // Load persisted state (Supabase first, localStorage fallback/mirror).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const local = readLocalSeen()
      try {
        const en = localStorage.getItem(ENABLED_LS)
        if (en === "false") setEnabledState(false)
      } catch { /* ignore */ }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        userIdRef.current = user?.id ?? null
        if (user) {
          const { data, error } = await supabase
            .from("guided_help_state")
            .select("key, status")
            .eq("user_id", user.id)
          if (!error && data) {
            for (const r of data) {
              const s = r.status as string
              if (s === "seen" || s === "dismissed" || s === "completed") local.add(r.key as string)
            }
          }
        }
      } catch { /* table may be unmigrated — localStorage only */ }

      if (!cancelled) {
        setSeen(local)
        setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const persistLocal = useCallback((next: Set<string>) => {
    try { localStorage.setItem(SEEN_LS, JSON.stringify([...next])) } catch { /* ignore */ }
  }, [])

  const markStatus = useCallback((key: string, status: HelpStatus) => {
    setSeen((prev) => {
      const next = new Set(prev)
      next.add(key)
      persistLocal(next)
      return next
    })
    // Best-effort server upsert.
    const uid = userIdRef.current
    if (uid) {
      try {
        const supabase = createClient()
        supabase
          .from("guided_help_state")
          .upsert(
            { user_id: uid, workspace_id: workspaceId ?? null, key, status, updated_at: new Date().toISOString() },
            { onConflict: "user_id,key" }
          )
          .then(() => {}, () => {})
      } catch { /* ignore */ }
    }
  }, [persistLocal, workspaceId])

  const resetAll = useCallback(() => {
    setSeen(new Set())
    try { localStorage.removeItem(SEEN_LS) } catch { /* ignore */ }
    const uid = userIdRef.current
    if (uid) {
      try {
        const supabase = createClient()
        supabase.from("guided_help_state").delete().eq("user_id", uid).then(() => {}, () => {})
      } catch { /* ignore */ }
    }
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v)
    try { localStorage.setItem(ENABLED_LS, String(v)) } catch { /* ignore */ }
  }, [])

  const isSeen = useCallback((key: string) => seen.has(key), [seen])

  const openTutorial = useCallback((key: string) => setForcedKey(key), [])
  const clearForced = useCallback(() => setForcedKey(null), [])
  const forced = useMemo(() => ALL_TUTORIALS.find((t) => t.key === forcedKey) ?? null, [forcedKey])

  const firstUseFor = useCallback(
    (pathname: string): Tutorial | null => {
      if (!enabled || !ready) return null
      const matches = (pattern: string): boolean => {
        // Root /property-manager only triggers on the dashboard itself, never on sub-routes.
        if (pattern === "/property-manager") return pathname === "/property-manager" || pathname === "/property-manager/"
        return pathname.startsWith(pattern)
      }
      // Most specific (longest) matching routePattern wins.
      const candidates = scoped.filter(
        (t) => t.type === "first-use" && t.routePattern && matches(t.routePattern) && !seen.has(t.key)
      ).sort((a, b) => (b.routePattern!.length - a.routePattern!.length))
      return candidates[0] ?? null
    },
    [enabled, ready, seen, scoped]
  )

  const value = useMemo<GuidedHelpValue>(
    () => ({ ready, enabled, setEnabled, tutorials: TUTORIALS, isSeen, markStatus, resetAll, firstUseFor, forced, openTutorial, clearForced }),
    [ready, enabled, setEnabled, isSeen, markStatus, resetAll, firstUseFor, forced, openTutorial, clearForced]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useGuidedHelp(): GuidedHelpValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useGuidedHelp must be used within <GuidedHelpProvider>")
  return ctx
}
