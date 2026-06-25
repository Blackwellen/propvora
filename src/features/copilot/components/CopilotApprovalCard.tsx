"use client"

import { useState } from "react"
import { Check, X, Loader2, Sparkles, AlertTriangle } from "lucide-react"
import type { ApprovalSpec } from "../types"

// ============================================================================
// Approval card — the pre-flight → confirm → execute → inline-result flow for a
// Copilot action. Nothing is created/sent until the user clicks Approve. On
// approve it POSTs the tool to /api/ai/tool (which re-checks permission + credits
// + audits server-side) and shows the outcome inline. Required by the AI-action
// workflow rule: every action shows what it does + its cost before running.
// ============================================================================

const TOOL_LABEL: Record<string, { verb: string; result: string }> = {
  "record.create": { verb: "Create this as a task in Work", result: "Task created" },
  "record.update": { verb: "Apply this update to the record", result: "Record updated" },
  "comms.email.draft": { verb: "Save this as an email draft", result: "Draft saved" },
  "doc.generate": { verb: "Generate this as a branded PDF in Documents", result: "Document generated" },
}

type Phase = "idle" | "running" | "done" | "error" | "dismissed"

export default function CopilotApprovalCard({ spec }: { spec: ApprovalSpec }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [message, setMessage] = useState<string>("")
  const label = TOOL_LABEL[spec.tool] ?? { verb: "Run this action", result: "Done" }

  async function approve() {
    setPhase("running")
    try {
      const res = await fetch("/api/ai/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: spec.tool,
          args: spec.args,
          workspaceId: spec.workspaceId,
          chatId: spec.chatId,
          approved: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.status === "succeeded") {
        setPhase("done")
        setMessage(label.result)
      } else {
        setPhase("error")
        setMessage(data.reason || data.error || "The action could not be completed.")
      }
    } catch {
      setPhase("error")
      setMessage("Connection lost. Please try again.")
    }
  }

  if (phase === "done") {
    return (
      <div className="w-full max-w-[480px] flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-[12px] font-[600] text-emerald-800">{message}</span>
      </div>
    )
  }

  if (phase === "dismissed") {
    return <p className="text-[11px] text-slate-400 px-1">Action dismissed.</p>
  }

  return (
    <div className="w-full max-w-[480px] rounded-xl border border-violet-200 bg-violet-50/60 px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
        <span className="text-[11px] font-[700] uppercase tracking-wide text-violet-700">
          Action needs your approval
        </span>
      </div>
      <p className="text-[12.5px] text-slate-700 leading-relaxed">{label.verb}.</p>
      <p className="text-[11px] text-slate-500 mt-0.5">
        Estimated cost: ~{spec.estimateCredits} credit{spec.estimateCredits === 1 ? "" : "s"}. Nothing happens until you approve.
      </p>

      {phase === "error" && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
          <span className="text-[11px] text-red-600">{message}</span>
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <button
          onClick={approve}
          disabled={phase === "running"}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[12px] font-[600] text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
        >
          {phase === "running" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" /> Approve &amp; run (~{spec.estimateCredits})
            </>
          )}
        </button>
        {phase !== "running" && (
          <button
            onClick={() => setPhase("dismissed")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-[600] text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
