"use client"

import React from "react"
import PersonAvatar from "./PersonAvatar"
import CopilotComplianceResultCard from "./CopilotComplianceResultCard"
import CopilotDraftMessageCard from "./CopilotDraftMessageCard"
import CopilotApprovalCard from "./CopilotApprovalCard"
import CopilotAgentPlan from "./CopilotAgentPlan"
import CopilotBrandMark from "./CopilotBrandMark"
import AiMarkdown from "./AiMarkdown"
import { ArrowRight, Plus, Pencil, RefreshCw, FileText, Eye, MessageCircle } from "lucide-react"
import type { QuickAction, ApprovalSpec, AgentPlanSpec, ActionKind } from "../types"

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

// Icon + accent per suggested-action kind. Model-suggested action buttons carry
// a `kind`; plain slash-command follow-ups don't and render as simple pills.
const ACTION_ICON: Record<ActionKind, React.ComponentType<{ className?: string }>> = {
  create: Plus,
  edit: Pencil,
  update: RefreshCw,
  draft: FileText,
  view: Eye,
  ask: MessageCircle,
}

function ActionButton({
  action,
  onClick,
}: {
  action: QuickAction
  onClick: () => void
}) {
  // Rich action button (model-suggested): icon + label, button-like surface.
  if (action.kind) {
    const Icon = ACTION_ICON[action.kind] ?? MessageCircle
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-brand-100)] bg-white px-2.5 py-1.5 text-[11.5px] font-[600] text-[var(--brand)] shadow-sm transition-colors hover:bg-[var(--brand-soft)]"
      >
        <Icon className="h-3.5 w-3.5" />
        {action.label}
      </button>
    )
  }
  // Plain slash-command follow-up chip.
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-[var(--color-brand-100)] bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--color-brand-100)]"
    >
      {action.label}
    </button>
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
              <AiMarkdown content={content} />
            )
          ) : streaming ? (
            <TypingDots />
          ) : null}
        </div>

        {/* Action buttons + quick-action chips — under AI messages, after streaming. */}
        {!isUser && !streaming && quickActions && quickActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {quickActions.map((action, i) => (
              <ActionButton
                key={`${action.slug}-${i}`}
                action={action}
                onClick={() => onQuickAction?.(action.prompt ?? action.slug)}
              />
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
