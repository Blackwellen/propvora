"use client"

import { useEffect, useState, useCallback } from "react"
import { Sparkles, Shield, Brain, Trash2, Check, Loader2, Gauge } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"

// ============================================================================
// Real Copilot settings panels — credits, autonomy (7-level permissions) and
// memory. Rendered inside the canonical workspace-settings/ai page (they replace
// the old billing-stub credits block). Each fetches its own RLS-scoped data.
// ============================================================================

const CLASS_LABEL: Record<string, string> = { conversation: "Conversation", action: "Actions", intelligence: "Intelligence", monitoring: "Monitoring" }
const CLASS_HELP: Record<string, string> = {
  conversation: "Chat, reads, retrieval — high volume, low cost.",
  action: "Writes, edits, drafted emails, automation runs.",
  intelligence: "Web/market data, document AI and agent runs.",
  monitoring: "Background monitor cycles.",
}

interface Balance { class: string; allowance: number | null; used: number; remaining: number | null }
interface PermLevel { level: number; name: string; description: string }

function Card({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center gap-2 mb-1">{icon}<h3 className="text-[14px] font-bold text-slate-900">{title}</h3></div>
      {desc && <p className="text-[12px] text-slate-500 mb-4">{desc}</p>}
      {children}
    </div>
  )
}

export function CopilotCreditsPanel() {
  const { workspace } = useWorkspace()
  const [data, setData] = useState<{ balances: Balance[]; creditValueGbp: number } | null>(null)
  useEffect(() => {
    if (!workspace?.id) return
    fetch(`/api/ai/credits?workspaceId=${workspace.id}`).then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {})
  }, [workspace?.id])

  return (
    <Card icon={<Sparkles className="h-4 w-4 text-violet-600" />} title="AI Credits & Usage" desc="Live credit balances this month, by class. Top up with the AI Pro add-on or a credit pack.">
      {!data ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.balances.map((b) => {
              const unlimited = b.allowance == null
              const pct = unlimited || !b.allowance ? 0 : Math.min(100, (b.used / b.allowance) * 100)
              return (
                <div key={b.class} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-[600] text-slate-700">{CLASS_LABEL[b.class] ?? b.class}</span>
                    <span className="text-[11px] font-[700] text-slate-600">{unlimited ? "Unlimited" : `${b.used} / ${b.allowance}`}</span>
                  </div>
                  {!unlimited && (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${pct >= 100 ? "bg-amber-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <p className="mt-1.5 text-[10.5px] text-slate-400">{CLASS_HELP[b.class]}</p>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[10.5px] text-slate-400">1 credit ≈ £{data.creditValueGbp?.toFixed(2) ?? "0.02"}.</p>
        </>
      )}
    </Card>
  )
}

export function CopilotAutonomyPanel() {
  const { workspace } = useWorkspace()
  const wid = workspace?.id
  const [perm, setPerm] = useState<{ effectiveLevel: number; planMaxLevel: number; canEdit: boolean; levels: PermLevel[] } | null>(null)
  const [pending, setPending] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!wid) return
    fetch(`/api/ai/permissions?workspaceId=${wid}`).then((r) => (r.ok ? r.json() : null)).then((p) => { if (p) { setPerm(p); setPending(p.effectiveLevel) } }).catch(() => {})
  }, [wid])

  async function save() {
    if (!wid || pending == null) return
    setSaving(true)
    try {
      const res = await fetch("/api/ai/permissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: wid, level: pending }) })
      if (res.ok) { const d = await res.json(); setPerm((p) => (p ? { ...p, effectiveLevel: d.effectiveLevel } : p)) }
    } finally { setSaving(false) }
  }

  return (
    <Card icon={<Shield className="h-4 w-4 text-blue-600" />} title="AI autonomy" desc={`How much the Copilot can do on its own. Your plan allows up to level ${perm?.planMaxLevel ?? 0}.`}>
      {!perm ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
      ) : (
        <div className="space-y-1.5">
          {perm.levels.map((lvl) => {
            const over = lvl.level > perm.planMaxLevel
            const selected = pending === lvl.level
            return (
              <button key={lvl.level} type="button" disabled={over || !perm.canEdit} onClick={() => setPending(lvl.level)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"} ${over ? "opacity-40 cursor-not-allowed" : ""}`}>
                <Gauge className={`h-4 w-4 mt-0.5 shrink-0 ${selected ? "text-blue-600" : "text-slate-400"}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-[700] text-slate-800">L{lvl.level} · {lvl.name}</span>
                    {over && <span className="text-[10px] font-[600] text-amber-600">Upgrade required</span>}
                  </div>
                  <p className="text-[11px] text-slate-500">{lvl.description}</p>
                </div>
              </button>
            )
          })}
          {perm.canEdit ? (
            <div className="pt-2">
              <button type="button" onClick={save} disabled={saving || pending === perm.effectiveLevel}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[12.5px] font-[600] text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save autonomy level
              </button>
            </div>
          ) : (
            <p className="pt-2 text-[11px] text-slate-400">Only workspace owners and admins can change AI autonomy.</p>
          )}
        </div>
      )}
    </Card>
  )
}

export function CopilotMemoryPanel() {
  const { workspace } = useWorkspace()
  const wid = workspace?.id
  const [mem, setMem] = useState<{ workspace: { key: string; value: unknown }[]; user: { key: string; value: unknown }[] } | null>(null)

  const load = useCallback(() => {
    if (!wid) return
    fetch(`/api/ai/memory?workspaceId=${wid}`).then((r) => (r.ok ? r.json() : null)).then(setMem).catch(() => {})
  }, [wid])
  useEffect(() => { load() }, [load])

  async function forget(scope: "workspace" | "user", key: string) {
    if (!wid) return
    await fetch("/api/ai/memory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: wid, scope, key }) })
    load()
  }
  const fmt = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v))

  return (
    <Card icon={<Brain className="h-4 w-4 text-emerald-600" />} title="What the Copilot remembers" desc="Durable facts it has learned. Remove anything you don't want it to keep.">
      {!mem ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
      ) : mem.workspace.length === 0 && mem.user.length === 0 ? (
        <p className="text-[12px] text-slate-400">Nothing remembered yet.</p>
      ) : (
        <div className="space-y-1.5">
          {mem.workspace.map((f) => <MemoryRow key={`w-${f.key}`} k={f.key} v={fmt(f.value)} badge="Workspace" onForget={() => forget("workspace", f.key)} />)}
          {mem.user.map((f) => <MemoryRow key={`u-${f.key}`} k={f.key} v={fmt(f.value)} badge="You" onForget={() => forget("user", f.key)} />)}
        </div>
      )}
    </Card>
  )
}

function MemoryRow({ k, v, badge, onForget }: { k: string; v: string; badge: string; onForget: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-[700] uppercase tracking-wide text-slate-400">{badge}</span>
          <span className="text-[12px] font-[600] text-slate-700 truncate">{k}</span>
        </div>
        <p className="text-[11px] text-slate-500 truncate">{v}</p>
      </div>
      <button type="button" onClick={onForget} title="Forget this" className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
