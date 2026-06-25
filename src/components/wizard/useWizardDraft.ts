"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ============================================================
// useWizardDraft — shared draft persistence + unsaved-changes
// guard for the in-page operator wizards (Create Task, Create
// Job, New PPM Schedule).
//
// • Restores in-progress form data from localStorage on mount,
//   so navigating away (or an accidental refresh / tab close)
//   never loses what the user typed.
// • Warns on hard unload (refresh / close / browser nav) while
//   the form is dirty — the localStorage copy already protects
//   in-app navigation, this covers the destructive cases.
// • `clearDraft()` is called on a successful submit so a created
//   record doesn't leave a stale draft behind.
//
// No backend, no DB row — a draft is purely client-side until
// the user actually submits, so cancelling never creates a
// partial record (Wizard checklist 97).
// ============================================================

const PREFIX = "propvora.wizard-draft."

function stableEqual<T>(a: T, b: T): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export interface WizardDraft<T> {
  data: T
  setData: React.Dispatch<React.SetStateAction<T>>
  /** True when the initial state was rehydrated from a saved draft. */
  restoredFromDraft: boolean
  /** Reset the form to defaults and remove the saved draft. */
  discardDraft: () => void
  /** Remove the saved draft + drop the dirty flag (call after a successful submit). */
  clearDraft: () => void
}

export function useWizardDraft<T extends object>(key: string, defaultData: T): WizardDraft<T> {
  const storageKey = PREFIX + key

  // Read any saved draft synchronously for the initial render so there is no
  // flash of empty fields before a restore.
  const [restoredFromDraft, setRestoredFromDraft] = useState(false)
  const [data, setData] = useState<T>(() => {
    if (typeof window === "undefined") return defaultData
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return defaultData
      const parsed = JSON.parse(raw) as Partial<T>
      // Merge over defaults so a schema change (new field) can't break restore.
      return { ...defaultData, ...parsed }
    } catch {
      return defaultData
    }
  })

  // Flag a restore on mount (separate effect so the state initialiser stays pure).
  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(storageKey)
    if (raw && !stableEqual(JSON.parse(raw), defaultData)) setRestoredFromDraft(true)
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dirtyRef = useRef(false)
  const clearedRef = useRef(false)

  // Persist on every change (unless it equals the default → treat as no draft).
  useEffect(() => {
    if (typeof window === "undefined" || clearedRef.current) return
    if (stableEqual(data, defaultData)) {
      window.localStorage.removeItem(storageKey)
      dirtyRef.current = false
      return
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data))
      dirtyRef.current = true
    } catch {
      /* storage full / disabled — non-fatal */
    }
  }, [data, defaultData, storageKey])

  // Warn before unload while dirty.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current && !clearedRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const clearDraft = useCallback(() => {
    clearedRef.current = true
    dirtyRef.current = false
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey)
  }, [storageKey])

  const discardDraft = useCallback(() => {
    setData(defaultData)
    setRestoredFromDraft(false)
    dirtyRef.current = false
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey)
  }, [defaultData])

  return { data, setData, restoredFromDraft, discardDraft, clearDraft }
}
