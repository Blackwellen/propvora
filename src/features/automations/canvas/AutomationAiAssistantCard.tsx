"use client"

// AI assistant card — suggests nodes and flow improvements.
// AI can suggest but CANNOT publish, enable, or run automations.

import React, { useState } from "react"
import { Sparkles, X, Loader2, ShieldCheck, Send } from "lucide-react"
import Link from "next/link"
import { useSectionLink } from "@/components/sections/SectionBasePath"

interface Props {
  onClose: () => void
  onSuggestNodes?: (suggestion: string) => void
}

const QUICK_PROMPTS = [
  "Suggest nodes for a rent overdue workflow",
  "Add an approval step after the action",
  "What trigger should I use for compliance?",
  "How do I handle the FALSE branch?",
]

export function AutomationAiAssistantCard({ onClose, onSuggestNodes }: Props) {
  const sectionLink = useSectionLink()
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState<string | null>(null)

  async function ask(question: string) {
    if (!question.trim()) return
    setLoading(true)
    setReply(null)
    setPrompt(question)
    // Simulate AI response (real AI route: /api/automations/nl)
    await new Promise((r) => setTimeout(r, 1200))
    const answers: Record<string, string> = {
      "Suggest nodes for a rent overdue workflow":
        "For a rent-overdue workflow I'd suggest:\n1. Trigger: invoice.overdue (min_days_overdue: 3)\n2. Condition: if_else (field: amount, op: gte, value: 100)\n3. Action: comm.external_message_draft — draft a reminder\n4. Approval: approval.request_human — manager review\n5. End: end.success",
      "Add an approval step after the action":
        "Drag 'Request Human Approval' from the Approval group and connect it after your action node. Set sla_hours to 24. The flow will pause until a manager approves.",
      "What trigger should I use for compliance?":
        "Use 'compliance.expiring' trigger with within_days set to 30 or 60 days. This fires ahead of certificate expiry. Mark review_first: true for safety.",
      "How do I handle the FALSE branch?":
        "Connect the FALSE handle of your condition to a Log Event (action.add_note) or a Webhook node. This records non-matching cases without any sensitive side-effects.",
    }
    const fallback =
      "I can help suggest node configurations and flow patterns. For full AI-assisted automation building, use the AI Builder tab where you can describe your workflow in plain English."
    setReply(answers[question] ?? fallback)
    setLoading(false)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_2px_12px_rgba(139,92,246,0.10)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-violet-900">AI Assistant</p>
            <p className="text-[10px] text-violet-500">Suggest only · Cannot publish</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-lg text-violet-400 hover:bg-violet-100 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Conversation area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {!reply && !loading && (
          <>
            <p className="text-[11px] text-slate-500">Quick prompts:</p>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => ask(p)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] text-slate-700 hover:border-violet-200 hover:bg-violet-50 transition"
              >
                {p}
              </button>
            ))}
          </>
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            <span className="text-[12px] text-violet-600">Thinking…</span>
          </div>
        )}

        {reply && (
          <div className="space-y-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600 font-medium">
              {prompt}
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-3 text-[12px] text-violet-900 whitespace-pre-line leading-relaxed">
              {reply}
            </div>
            <button
              onClick={() => { setReply(null); setPrompt("") }}
              className="text-[11px] text-slate-400 underline"
            >
              Ask another
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-violet-100 px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(prompt) } }}
            placeholder="Ask about your workflow…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition"
          />
          <button
            onClick={() => ask(prompt)}
            disabled={!prompt.trim() || loading}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 shrink-0 text-slate-400" />
          <p className="text-[10px] text-slate-400">
            AI suggestions only — you confirm all changes.{" "}
            <Link href={sectionLink("/property-manager/automations/ai-builder")} className="text-violet-500 underline">
              Full AI Builder →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
