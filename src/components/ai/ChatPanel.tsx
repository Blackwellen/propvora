"use client"

import { useEffect } from "react"
import CopilotPanelShell from "@/features/copilot/components/CopilotPanelShell"
import CopilotUpgradePrompt from "@/features/copilot/components/CopilotUpgradePrompt"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  /** Whether the workspace plan includes AI Copilot access. */
  aiCopilotEnabled?: boolean
}

export default function ChatPanel({ isOpen, onClose, aiCopilotEnabled = false }: ChatPanelProps) {
  // WCAG: Esc closes the Copilot dialog from anywhere while it is open.
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // role=dialog / aria-modal wrapper so assistive tech announces the Copilot as
  // a modal surface. The inner shells are position:fixed, so this wrapper does
  // not affect their layout.
  return (
    <div role="dialog" aria-modal="true" aria-label="Propvora Copilot">
      {aiCopilotEnabled ? (
        <CopilotPanelShell isOpen={isOpen} onClose={onClose} />
      ) : (
        <CopilotUpgradePrompt isOpen={isOpen} onClose={onClose} />
      )}
    </div>
  )
}
