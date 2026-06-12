"use client"

import CopilotPanelShell from "@/features/copilot/components/CopilotPanelShell"
import CopilotUpgradePrompt from "@/features/copilot/components/CopilotUpgradePrompt"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  /** Whether the workspace plan includes AI Copilot access. */
  aiCopilotEnabled?: boolean
}

export default function ChatPanel({ isOpen, onClose, aiCopilotEnabled = false }: ChatPanelProps) {
  if (!aiCopilotEnabled) {
    return <CopilotUpgradePrompt isOpen={isOpen} onClose={onClose} />
  }
  return <CopilotPanelShell isOpen={isOpen} onClose={onClose} />
}
