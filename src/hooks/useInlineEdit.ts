"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { showInlineEditToast } from "@/components/editing/inlineEditToast"

/* ──────────────────────────────────────────────────────────────────────────
   useInlineEdit — the state engine behind the global inline-editing system.

   Owns the editing / saving / error / draft-value lifecycle for a single
   field. It is presentation-agnostic: the caller supplies an `onSave` that
   persists to Supabase (workspace-scoped + RLS handled there) and resolves
   when the mutation + any query invalidation is done.

   Behaviour:
   - Optimistic: the displayed value flips to the draft the instant a save
     starts, then rolls back to the previous value if `onSave` rejects.
   - Toast on success/failure (self-contained portal — no provider required).
   - `validate` runs before save; a returned string becomes the field error
     and blocks the save.
   - `permission` (default true) gates editing entirely — when false the field
     is read-only and `enterEdit` is a no-op.
─────────────────────────────────────────────────────────────────────────── */

export interface UseInlineEditOptions<T = string> {
  /** The committed (source-of-truth) value coming from the caller. */
  value: T
  /** Persist the new value. Resolve on success, reject (throw) on failure. */
  onSave: (next: T) => Promise<void>
  /** Optional sync validation. Return an error string to block the save. */
  validate?: (next: T) => string | null | undefined
  /** When false, the field is read-only. Defaults to true (editable). */
  permission?: boolean
  /** Label used in success/error toast copy, e.g. "Target rent". */
  label?: string
  /** Skip the toast entirely (some dense table contexts prefer silence). */
  silent?: boolean
}

export interface UseInlineEditReturn<T = string> {
  /** True while the inline editor is open. */
  editing: boolean
  /** True while an async save is in flight. */
  saving: boolean
  /** Current field-level validation/save error, or null. */
  error: string | null
  /** The working draft (what the editor binds to). */
  draft: T
  /** The value to display: optimistic draft while saving, else committed. */
  displayValue: T
  /** Whether editing is permitted at all. */
  canEdit: boolean
  setDraft: (next: T) => void
  enterEdit: () => void
  cancel: () => void
  /** Commit the current draft. No-op when unchanged. */
  save: () => Promise<void>
  /** Commit an explicit value (discrete pickers). No-op when unchanged. */
  commit: (next: T) => Promise<void>
}

export function useInlineEdit<T = string>(
  opts: UseInlineEditOptions<T>
): UseInlineEditReturn<T> {
  const { value, onSave, validate, permission = true, label, silent } = opts

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraftState] = useState<T>(value)
  // Optimistic value shown while a save is in flight; null when not saving.
  const [optimistic, setOptimistic] = useState<{ v: T } | null>(null)

  const canEdit = permission !== false

  // Keep the draft in sync with external value changes while not actively editing.
  useEffect(() => {
    if (!editing && !saving) setDraftState(value)
  }, [value, editing, saving])

  const setDraft = useCallback((next: T) => {
    setDraftState(next)
    setError(null)
  }, [])

  const enterEdit = useCallback(() => {
    if (!canEdit) return
    setDraftState(value)
    setError(null)
    setEditing(true)
  }, [canEdit, value])

  const cancel = useCallback(() => {
    setDraftState(value)
    setError(null)
    setEditing(false)
  }, [value])

  // Guard against setState after unmount on a slow save.
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Core commit. Accepts an explicit value so discrete pickers (relationship
  // select) can save a chosen option without a draft-state round-trip race.
  const commit = useCallback(
    async (next: T) => {
      // Unchanged → just close, no network call.
      if (Object.is(next, value)) {
        setEditing(false)
        return
      }
      if (validate) {
        const v = validate(next)
        if (v) {
          setError(v)
          setEditing(true)
          return
        }
      }
      const prev = value
      setSaving(true)
      setError(null)
      setOptimistic({ v: next }) // optimistic flip
      setEditing(false)
      try {
        await onSave(next)
        if (!mounted.current) return
        setOptimistic(null)
        if (!silent) {
          showInlineEditToast({
            variant: "success",
            message: label ? `${label} updated` : "Saved",
          })
        }
      } catch (e: unknown) {
        if (!mounted.current) return
        const msg = e instanceof Error ? e.message : "Save failed"
        // Roll back the optimistic value and reopen the editor with the draft.
        setOptimistic(null)
        setDraftState(prev)
        setError(msg)
        setEditing(true)
        if (!silent) {
          showInlineEditToast({
            variant: "error",
            message: label ? `Couldn't update ${label}` : "Save failed",
            description: msg,
          })
        }
      } finally {
        if (mounted.current) setSaving(false)
      }
    },
    [value, validate, onSave, silent, label]
  )

  const save = useCallback(() => commit(draft), [commit, draft])

  const displayValue = optimistic ? optimistic.v : value

  return {
    editing,
    saving,
    error,
    draft,
    displayValue,
    canEdit,
    setDraft,
    enterEdit,
    cancel,
    save,
    commit,
  }
}
