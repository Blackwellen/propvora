"use client"

import { useEffect, useRef } from "react"
import CopilotPanelShell from "@/features/copilot/components/CopilotPanelShell"
import CopilotUpgradePrompt from "@/features/copilot/components/CopilotUpgradePrompt"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  /** Whether the workspace plan includes AI Copilot access. */
  aiCopilotEnabled?: boolean
}

export default function ChatPanel({ isOpen, onClose, aiCopilotEnabled = false }: ChatPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // WCAG: Esc closes the Copilot dialog; Tab is trapped within it; focus is
  // moved in on open and restored to the trigger on close. On mobile the panel
  // is a full-screen sheet, so trapping keeps keyboard/AT users inside it.
  useEffect(() => {
    if (!isOpen) return
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const focusables = () =>
      dialogRef.current
        ? Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null)
        : []

    const t = setTimeout(() => {
      const items = focusables()
      ;(items[0] ?? dialogRef.current)?.focus()
    }, 30)

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "Tab") {
        const items = focusables()
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener("keydown", onKey)
      previouslyFocused.current?.focus?.()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // role=dialog / aria-modal wrapper so assistive tech announces the Copilot as
  // a modal surface. The inner shells are position:fixed, so this wrapper does
  // not affect their layout.
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Propvora Copilot" tabIndex={-1}>
      {aiCopilotEnabled ? (
        <CopilotPanelShell isOpen={isOpen} onClose={onClose} />
      ) : (
        <CopilotUpgradePrompt isOpen={isOpen} onClose={onClose} />
      )}
    </div>
  )
}
