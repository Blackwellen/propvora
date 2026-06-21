"use client"

/**
 * OpenCopilotWithContext
 *
 * A lightweight wrapper that opens the Copilot panel and injects page-level
 * structured data (KPIs, counts, status summaries) as context for the AI.
 *
 * Usage:
 *   <OpenCopilotWithContext summaryData={{ section: 'portfolio', propertyCount: 12 }}>
 *     <button>Ask AI</button>
 *   </OpenCopilotWithContext>
 *
 * The summaryData is forwarded via the OPEN_COPILOT_EVENT detail so the shell
 * can capture it and pass it through to CopilotChatScreen → API route.
 */

import { openCopilot } from "@/lib/copilot/open"

interface OpenCopilotWithContextProps {
  children: React.ReactNode
  summaryData?: Record<string, unknown>
  className?: string
}

export function OpenCopilotWithContext({
  children,
  summaryData,
  className,
}: OpenCopilotWithContextProps) {
  return (
    <span
      className={className}
      onClick={() => openCopilot({ summaryData })}
      style={{ cursor: "pointer", display: "contents" }}
    >
      {children}
    </span>
  )
}
