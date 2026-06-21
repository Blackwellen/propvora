"use client"

import { useRef } from "react"

export interface EvidenceUploadZoneProps {
  onFileChosen: (file: File) => void
}

/**
 * Invisible file-input zone. Call triggerPick() imperatively from a parent slot button.
 * The ref is forwarded via the returned pick function.
 */
export function useEvidenceUploadZone(onFileChosen: (file: File) => void) {
  const fileRef = useRef<HTMLInputElement>(null)
  const pending = useRef<string | null>(null)

  function pick(slotId: string) {
    pending.current = slotId
    fileRef.current?.click()
  }

  function onChosen(f: File | undefined) {
    if (!f || !pending.current) return
    onFileChosen(f)
    pending.current = null
    if (fileRef.current) fileRef.current.value = ""
  }

  function InputElement() {
    return (
      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/*,application/pdf"
        onChange={(e) => onChosen(e.target.files?.[0])}
      />
    )
  }

  return { pick, getPendingSlotId: () => pending.current, InputElement }
}
