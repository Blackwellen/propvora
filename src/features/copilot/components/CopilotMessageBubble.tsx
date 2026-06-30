"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
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
 * Renders AI response content as GitHub-flavoured markdown — bold, italics,
 * numbered/bulleted lists, headings, tables, links and inline code — styled
 * compact to match the Copilot panel. Models naturally emit markdown (e.g.
 * **bold**), so rendering it here turns raw asterisks into proper formatting.
 *
 * Security: react-markdown does NOT render raw HTML (no rehype-raw), so model
 * output can never inject markup; links are forced to open safely.
 */
const MARKDOWN_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-outside pl-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-4 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h3 className="text-[13.5px] font-bold text-slate-900 mt-2 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="text-[13px] font-bold text-slate-900 mt-2 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="text-[12.5px] font-semibold text-slate-900 mt-1.5 first:mt-0">{children}</h4>,
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 text-[11.5px] font-mono text-slate-700">{children}</code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--brand)] underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11.5px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-slate-200 pl-3 text-slate-600 italic">{children}</blockquote>
  ),
}

function AiContentRenderer({ content }: { content: string }) {
  return (
    <div className="text-[12.5px] leading-relaxed space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
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
                className="px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-[11px] font-semibold hover:bg-[var(--color-brand-100)] transition-colors border border-[var(--color-brand-100)]"
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
