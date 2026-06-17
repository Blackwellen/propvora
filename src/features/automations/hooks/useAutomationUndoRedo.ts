"use client"

import { useCallback, useRef, useState } from "react"

/** Generic undo/redo stack with a configurable history cap. */
export function useAutomationUndoRedo<T>(initialState: T, maxHistory = 100) {
  const [present, setPresent] = useState<T>(initialState)
  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])

  const set = useCallback((newState: T) => {
    setPresent((prev) => {
      pastRef.current = [...pastRef.current.slice(-(maxHistory - 1)), prev]
      futureRef.current = []
      return newState
    })
  }, [maxHistory])

  const undo = useCallback(() => {
    const past = pastRef.current
    if (!past.length) return
    setPresent((current) => {
      const previous = past[past.length - 1]
      pastRef.current = past.slice(0, -1)
      futureRef.current = [current, ...futureRef.current]
      return previous
    })
  }, [])

  const redo = useCallback(() => {
    const future = futureRef.current
    if (!future.length) return
    setPresent((current) => {
      const next = future[0]
      futureRef.current = future.slice(1)
      pastRef.current = [...pastRef.current, current]
      return next
    })
  }, [])

  const canUndo = pastRef.current.length > 0
  const canRedo = futureRef.current.length > 0

  return { present, set, undo, redo, canUndo, canRedo }
}
