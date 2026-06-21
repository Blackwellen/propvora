"use client"

import React from "react"
import PersonAvatar from "./PersonAvatar"
import CopilotComplianceResultCard from "./CopilotComplianceResultCard"
import CopilotDraftMessageCard from "./CopilotDraftMessageCard"
import type { QuickAction } from "../types"

interface CopilotMessageBubbleProps {
  role: "user" | "ai"
  content: string
  timestamp: string
  card?: "compliance-result" | "draft-message"
  /** When true and content is empty, show a typing indicator (streaming). */
  streaming?: boolean
  /** Suggested follow-up commands shown as clickable chips below AI messages. */
  quickActions?: QuickAction[]
  /** Called when the user clicks a quick-action chip. */
  onQuickAction?: (slug: string) => void
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5" aria-label="Copilot is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

function AiIcon() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}>✦</span>
    </div>
  )
}

export default function CopilotMessageBubble({
  role,
  content,
  timestamp,
  card,
  streaming,
  quickActions,
  onQuickAction,
}: CopilotMessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}
    >
      {/* Avatar */}
      <div className="shrink-0 mb-0.5">
        {isUser ? (
          <PersonAvatar name="JT" size={28} />
        ) : (
          <AiIcon />
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Text bubble */}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed ${
            isUser
              ? "bg-slate-100 text-slate-800 rounded-br-md"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
          }`}
        >
          {content ? (
            <span className="whitespace-pre-wrap">{content}</span>
          ) : streaming ? (
            <TypingDots />
          ) : null}
        </div>

        {/* Quick action chips — shown under AI messages only, after streaming completes */}
        {!isUser && !streaming && quickActions && quickActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {quickActions.map((action) => (
              <button
                key={action.slug}
                onClick={() => onQuickAction?.(action.slug)}
                className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-colors border border-blue-100"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Card */}
        {card === "compliance-result" && (
          <div className="w-full max-w-[480px]">
            <CopilotComplianceResultCard />
          </div>
        )}
        {card === "draft-message" && (
          <div className="w-full max-w-[480px]">
            <CopilotDraftMessageCard />
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 px-1">{timestamp}</span>
      </div>
    </div>
  )
}
