"use client"

import React from "react"
import PersonAvatar from "./PersonAvatar"
import CopilotComplianceResultCard from "./CopilotComplianceResultCard"
import CopilotDraftMessageCard from "./CopilotDraftMessageCard"
import CopilotApprovalCard from "./CopilotApprovalCard"
import CopilotAgentPlan from "./CopilotAgentPlan"
import CopilotBrandMark from "./CopilotBrandMark"
import { ArrowRight } from "lucide-react"
import type { QuickAction, ApprovalSpec, AgentPlanSpec } from "../types"

interface CopilotMessageBubbleProps {
  role: "user" | "ai"
  content: string
  timestamp: string
  card?: "compliance-result" | "draft-message"
  /** When set, render an approval card under the message. */
  approval?: ApprovalSpec
  /** When set, render a multi-step agent plan under the message. */
  agentPlan?: AgentPlanSpec
  /** When set, render a "navigate there" button under the message. */
  navTarget?: { route: string; label: string }
  onNavigate?: (route: string) => void
  /** When true and content is empty, show a typing indicator (streaming). */
  streaming?: boolean
  /** Suggested follow-up commands shown as clickable chips below AI messages. */
  quickActions?: QuickAction[]
  /** Called when the user clicks a quick-action chip. */
  onQuickAction?: (slug: string) => void
}

/**
 * Renders AI response content as clean plain-text blocks.
 * Handles numbered lists (1. 2. 3.), dashed lists (- item), and paragraphs.
 * Does NOT render markdown — the AI is instructed to output plain text only.
 */
function AiContentRenderer({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/)

  return (
    <div className="space-y-2">
      {paragraphs.map((para, i) => {
        const lines = para.split("\n").filter((l) => l.trim() !== "")

        if (lines.length === 0) return null

        const isNumberedList = lines.length > 1 && lines.every((l) => /^\d+\./.test(l.trim()))
        const isBulletList =
          lines.length > 1 && lines.every((l) => /^[-—•]/.test(l.trim()))

        if (isNumberedList) {
          return (
            <ol key={i} className="list-decimal list-inside space-y-1 text-[12.5px] leading-relaxed">
              {lines.map((l, j) => (
                <li key={j}>{l.replace(/^\d+\.\s*/, "")}</li>
              ))}
            </ol>
          )
        }

        if (isBulletList) {
          return (
            <ul key={i} className="list-disc list-inside space-y-1 text-[12.5px] leading-relaxed">
              {lines.map((l, j) => (
                <li key={j}>{l.replace(/^[-—•]\s*/, "")}</li>
              ))}
            </ul>
          )
        }

        // Multi-line block that isn't a list — render as a single paragraph preserving internal newlines
        return (
          <p key={i} className="text-[12.5px] leading-relaxed whitespace-pre-wrap">
            {para}
          </p>
        )
      })}
    </div>
  )
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
  return <CopilotBrandMark size={32} radius={10} />
}

export default function CopilotMessageBubble({
  role,
  content,
  timestamp,
  card,
  approval,
  agentPlan,
  navTarget,
  onNavigate,
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
          className={`px-3.5 py-2.5 rounded-2xl ${
            isUser
              ? "bg-slate-100 text-slate-800 rounded-br-md"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
          }`}
        >
          {content ? (
            isUser ? (
              <span className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{content}</span>
            ) : (
              <AiContentRenderer content={content} />
            )
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

        {/* Approval card — pre-flight cost → confirm → execute → inline result */}
        {!isUser && !streaming && approval && <CopilotApprovalCard spec={approval} />}

        {/* Multi-step agent plan — batch of proposed actions with Approve all */}
        {!isUser && !streaming && agentPlan && <CopilotAgentPlan spec={agentPlan} />}

        {/* Navigation action — jump to the resolved destination */}
        {!isUser && !streaming && navTarget && (
          <button
            onClick={() => onNavigate?.(navTarget.route)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-[12px] font-[600] text-violet-700 transition-colors hover:bg-violet-100"
          >
            Open {navTarget.label} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 px-1">{timestamp}</span>
      </div>
    </div>
  )
}
