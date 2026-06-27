"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Wand2, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { aiBuild, createDraftDefinition, type CompileResultDTO } from "./api"

const EXAMPLES = [
  "When a gas safety certificate is within 30 days of expiry, create a high-priority renewal task.",
  "If rent is 5 days overdue, draft a polite chase message for me to review before sending.",
  "When a supplier marks a job complete, request completion evidence and notify me.",
  "Before serving any legal notice, route it to a human reviewer first.",
]

export default function AiBuilderClient() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<{ name: string; description: string; graph: { nodes: unknown[]; edges: unknown[] }; compile?: CompileResultDTO; notes?: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // AI cost pre-flight: the "Draft automation" button runs an LLM call, so it
  // must show an estimate + explicit confirm before spending credits (per the
  // AI-action rule). `automation.build` = 3 credits in the credit ledger.
  const [showPreflight, setShowPreflight] = useState(false)

  async function build() {
    if (!prompt.trim()) return
    setLoading(true); setError(null); setDraft(null)
    try {
      const res = await aiBuild({ workspaceId, prompt })
      if (res.ok && res.graph) setDraft({ name: res.name ?? "Drafted automation", description: res.description ?? "", graph: res.graph, compile: res.compile, notes: res.notes })
      else setError(res.error ?? "Couldn't draft that. Try rephrasing.")
    } catch { setError("Couldn't reach the AI builder.") } finally { setLoading(false) }
  }

  async function saveDraft() {
    if (!draft) return
    setSaving(true); setError(null)
    try {
      // Save a DISABLED draft definition; the node graph is then editable on the canvas.
      const node0 = (draft.graph.nodes as Array<Record<string, unknown>>).find((n) => String(n.node_type ?? "").length > 0)
      const triggerType = node0 ? mapTriggerType(String(node0.node_type)) : "compliance_due_soon"
      const res = await createDraftDefinition({
        workspaceId,
        definition: {
          name: draft.name, description: draft.description,
          trigger_type: triggerType, trigger_config: {},
          conditions: [], action_type: "create_notification",
          action_config: { title: draft.name, body: draft.description, severity: "info" },
          review_required: true, enabled: false,
        },
      })
      if (res.ok && res.id) router.push(`/property-manager/automations/canvas/${res.id}`)
      else setError(res.error ?? "Couldn't save the draft.")
    } catch { setError("Couldn't save the draft.") } finally { setSaving(false) }
  }

  const errs = draft?.compile?.issues.filter((i) => i.level === "error") ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
        <p className="text-sm text-violet-800"><span className="font-semibold">Drafts only.</span> The AI proposes a node graph from the real catalogue. Nothing is saved, enabled, or run until you review it — and high-risk steps always require approval.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Describe what you want to automate</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="e.g. When a tenancy is ending in 60 days, create a renewal decision task." className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => { if (prompt.trim()) setShowPreflight(true) }} disabled={loading || !prompt.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} {loading ? "Drafting…" : "Draft automation"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => <button key={ex} onClick={() => setPrompt(ex)} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-200">{ex.slice(0, 42)}…</button>)}
        </div>
      </div>

      {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</div>}

      {draft && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" /><h3 className="text-sm font-semibold text-slate-900">{draft.name}</h3></div>
          <p className="mt-1 text-sm text-slate-500">{draft.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{draft.graph.nodes.length} nodes</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{draft.graph.edges.length} edges</span>
            {draft.compile && (draft.compile.ok
              ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> compiles</span>
              : <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-700"><AlertTriangle className="h-3 w-3" /> {errs.length} issue(s)</span>)}
            {draft.compile?.plan?.hasApprovalGate && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">approval gate</span>}
          </div>

          <ul className="mt-3 space-y-1">
            {(draft.graph.nodes as Array<Record<string, unknown>>).map((n, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                <span className="font-mono text-[10px] text-slate-400">{String(n.node_type)}</span>
                <span className="font-medium">{String(n.label ?? "")}</span>
              </li>
            ))}
          </ul>

          {draft.notes && draft.notes.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              {draft.notes.map((n, i) => <p key={i}>• {n}</p>)}
            </div>
          )}

          <button onClick={saveDraft} disabled={saving} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Save as draft &amp; open canvas
          </button>
        </div>
      )}

      {/* AI cost pre-flight — estimate → confirm → execute (BLK-006). */}
      {showPreflight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setShowPreflight(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100"><Wand2 className="h-[18px] w-[18px] text-violet-600" /></div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Draft with AI</h2>
                <p className="mt-0.5 text-[12px] text-slate-500">Generative automation builder</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-[12px] leading-relaxed text-slate-600">
              The AI will read your description and propose an automation node graph from the real catalogue. Nothing is saved, enabled, or run — you review the draft before anything happens.
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px]">
              <span className="text-amber-800">Estimated cost</span>
              <span className="font-semibold text-amber-900">~3 AI credits (≈ £0.01)</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setShowPreflight(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => { setShowPreflight(false); void build() }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-[13px] font-semibold text-white hover:bg-violet-700"
              >
                <Sparkles className="h-3.5 w-3.5" /> Draft automation (~3 credits)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Map a node trigger type → the catalogue TriggerType the v2 definition stores.
function mapTriggerType(nodeType: string): string {
  if (nodeType.startsWith("compliance")) return "compliance_due_soon"
  if (nodeType.startsWith("invoice")) return "rent_overdue"
  if (nodeType.startsWith("supplier")) return "job_completed"
  if (nodeType.startsWith("booking")) return "job_completed"
  if (nodeType.startsWith("legal")) return "compliance_overdue"
  return "compliance_due_soon"
}
