"use client"

// Natural-language composer: a describe-in-words box that calls /api/automations/nl
// to get a reviewable DRAFT. It NEVER saves or runs — it hands the draft back to
// the parent for editing + dry-run + explicit save.

import React, { useState } from "react"
import { Wand2, ArrowRight, AlertCircle, Info } from "lucide-react"
import { nlDraft, isApiError } from "./api"
import type { AutomationDefinition } from "./types"

const EXAMPLES = [
  "When a gas safety certificate is due within 30 days, create a high-priority task to book the renewal.",
  "If rent is overdue by more than 5 days, draft a polite chase message for me to review.",
  "When an HMO licence expires in 90 days, remind me to start the renewal.",
  "When a tenancy ends within 60 days, create a renewal decision task.",
]

interface Props {
  workspaceId?: string
  onDraft: (draft: AutomationDefinition, explanation: string, notes: string[]) => void
}

export default function NlComposer({ workspaceId, onDraft }: Props) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgrade, setUpgrade] = useState(false)
  const [notes, setNotes] = useState<string[]>([])

  async function generate() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setUpgrade(false)
    setNotes([])
    try {
      const res = await nlDraft(prompt.trim(), workspaceId)
      if (isApiError(res)) {
        setError(res.error)
        setUpgrade(Boolean(res.upgrade))
        return
      }
      if (!res.ok || !res.draft) {
        setError(res.error ?? "I couldn't draft that. Try naming the trigger and the action.")
        setNotes(res.notes ?? [])
        return
      }
      onDraft(res.draft, res.explanation ?? "", res.notes ?? [])
    } catch {
      setError("Something went wrong drafting your automation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white"><Wand2 className="h-4 w-4" /></span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Describe it in plain English</h2>
          <p className="text-xs text-slate-500">The assistant proposes a draft you review and edit — it never saves or runs anything.</p>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate() }}
        rows={3}
        placeholder="e.g. When a compliance certificate is due within 30 days, create a task to book the renewal."
        className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setPrompt(ex)}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-500 hover:border-slate-300 hover:bg-slate-50"
          >
            {ex.length > 48 ? ex.slice(0, 46) + "…" : ex}
          </button>
        ))}
      </div>

      {error && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${upgrade ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notes.length > 0 && (
        <div className="mt-2 space-y-1">
          {notes.map((n, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-slate-500"><Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /> {n}</div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">⌘/Ctrl + Enter to draft</p>
        <button
          onClick={generate}
          disabled={!prompt.trim() || loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Drafting…" : "Draft automation"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
