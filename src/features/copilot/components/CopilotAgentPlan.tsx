"use client"

import { useState } from "react"
import { Check, Loader2, ListChecks, X, Mail, ChevronDown } from "lucide-react"
import type { AgentPlanSpec } from "../types"

// ============================================================================
// Agent plan — renders a multi-step plan (a batch of proposed record.update
// actions) with per-action status and an "Approve all" button. Each action is
// executed via /api/ai/tool (permission → credit → audit). Nothing runs until
// the user approves — the agent only PROPOSES.
// ============================================================================

type St = "idle" | "running" | "done" | "failed"

export default function CopilotAgentPlan({ spec }: { spec: AgentPlanSpec }) {
  const [states, setStates] = useState<Record<number, St>>({})
  const [running, setRunning] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState<Record<number, boolean>>({})

  async function runOne(i: number): Promise<boolean> {
    setStates((p) => ({ ...p, [i]: "running" }))
    try {
      const res = await fetch("/api/ai/tool", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: spec.actions[i].tool, args: spec.actions[i].args, workspaceId: spec.workspaceId, chatId: spec.chatId, approved: true }),
      })
      const ok = res.ok && (await res.json().catch(() => ({})))?.status === "succeeded"
      setStates((p) => ({ ...p, [i]: ok ? "done" : "failed" }))
      return ok
    } catch {
      setStates((p) => ({ ...p, [i]: "failed" }))
      return false
    }
  }

  async function approveAll() {
    setRunning(true)
    for (let i = 0; i < spec.actions.length; i++) if (states[i] !== "done") await runOne(i)
    setRunning(false)
  }

  if (dismissed) return <p className="text-[11px] text-slate-400 px-1">Plan dismissed.</p>
  const doneCount = Object.values(states).filter((s) => s === "done").length

  return (
    <div className="w-full max-w-[480px] rounded-xl border border-violet-200 bg-violet-50/50 px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <ListChecks className="h-3.5 w-3.5 text-violet-600" />
        <span className="text-[11px] font-[700] uppercase tracking-wide text-violet-700">Agent plan · {spec.actions.length} step{spec.actions.length === 1 ? "" : "s"}</span>
      </div>
      <div className="space-y-1 mb-2.5 max-h-44 overflow-y-auto">
        {spec.actions.map((a, i) => {
          const st = states[i] ?? "idle"
          const isEmail = a.tool === "comms.email.draft"
          const subject = isEmail ? String(a.args.subject ?? "") : ""
          const body = isEmail ? String(a.args.body ?? "") : ""
          const to = isEmail ? String(a.args.to ?? "") : ""
          const isOpen = !!open[i]
          return (
            <div key={i} className="rounded-lg bg-white border border-slate-100">
              <button
                type="button"
                onClick={() => isEmail && setOpen((p) => ({ ...p, [i]: !p[i] }))}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left ${isEmail ? "cursor-pointer hover:bg-slate-50/60" : "cursor-default"}`}
              >
                <span className="flex h-4 w-4 items-center justify-center shrink-0">
                  {st === "running" ? <Loader2 className="h-3 w-3 animate-spin text-violet-500" /> : st === "done" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : st === "failed" ? <X className="h-3.5 w-3.5 text-red-500" /> : isEmail ? <Mail className="h-3.5 w-3.5 text-violet-500" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                </span>
                <span className="text-[11.5px] text-slate-700 truncate flex-1">{a.label}</span>
                {isEmail && <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
              </button>
              {isEmail && isOpen && (
                <div className="border-t border-slate-100 px-2.5 py-2 space-y-1">
                  {to && <p className="text-[10.5px] text-slate-400"><span className="font-[600] text-slate-500">To:</span> {to}</p>}
                  {subject && <p className="text-[11px] text-slate-600"><span className="font-[600] text-slate-500">Subject:</span> {subject}</p>}
                  {body && <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed">{body}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={approveAll} disabled={running || doneCount === spec.actions.length}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[12px] font-[600] text-white hover:bg-violet-700 disabled:opacity-50">
          {running ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running… ({doneCount}/{spec.actions.length})</> : doneCount === spec.actions.length ? <><Check className="h-3.5 w-3.5" /> All done</> : <><Check className="h-3.5 w-3.5" /> Approve all ({spec.actions.length})</>}
        </button>
        {!running && doneCount < spec.actions.length && (
          <button onClick={() => setDismissed(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-[600] text-slate-500 hover:bg-slate-50">
            <X className="h-3.5 w-3.5" /> Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
