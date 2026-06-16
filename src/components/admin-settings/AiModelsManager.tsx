"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Star, Plus, Pencil, Trash2, Check, X, AlertTriangle, Power } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { NativeSelect, Field } from "@/components/admin-wizard/AdminWizard"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { setProviderEnabled, setModelEnabled, setDefaultModel } from "@/app/(admin)/admin/ai-models/actions"
import { createAiModel, updateAiModel, deleteAiModel } from "@/lib/admin/mutations"
import type { ProviderRow, ModelRow } from "@/app/(admin)/admin/ai-models/data"

function Banner({ kind, msg }: { kind: "ok" | "err"; msg: string }) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-[12px] ${kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      {kind === "err" && <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}<span>{msg}</span>
    </div>
  )
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-pressed={on}
      className={`w-10 h-[22px] rounded-full transition-colors relative shrink-0 disabled:opacity-50 ${on ? "bg-[#10B981]" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  )
}

export default function AiModelsManager({
  providers, models, available,
}: {
  providers: ProviderRow[]
  models: ModelRow[]
  available: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  // Create model dialog
  const [addOpen, setAddOpen] = useState(false)
  const [newProvider, setNewProvider] = useState(providers[0]?.id ?? "")
  const [newModelId, setNewModelId] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [newIn, setNewIn] = useState("0")
  const [newOut, setNewOut] = useState("0")
  const [saving, setSaving] = useState(false)

  // Edit model dialog
  const [editModel, setEditModel] = useState<ModelRow | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [editIn, setEditIn] = useState("0")
  const [editOut, setEditOut] = useState("0")

  function notify(res: { ok: boolean; error?: string }, ok: string) {
    if (!res.ok) { setMsg({ kind: "err", msg: res.error ?? "Failed" }); return false }
    setMsg({ kind: "ok", msg: ok })
    startTransition(() => router.refresh())
    return true
  }

  async function toggleProvider(p: ProviderRow) {
    notify(await setProviderEnabled(p.id, !p.enabled), `Provider ${p.enabled ? "disabled" : "enabled"}.`)
  }
  async function toggleModel(m: ModelRow) {
    notify(await setModelEnabled(m.id, !m.enabled), `Model ${m.enabled ? "disabled" : "enabled"}.`)
  }
  async function makeDefault(m: ModelRow) {
    notify(await setDefaultModel(m.id), `"${m.label}" is now the default model.`)
  }

  async function createModel() {
    setSaving(true)
    const res = await createAiModel({
      providerId: newProvider,
      modelId: newModelId,
      label: newLabel,
      inputCostPencePer1k: Number(newIn) || 0,
      outputCostPencePer1k: Number(newOut) || 0,
      enabled: true,
    })
    setSaving(false)
    if (notify(res, "Model added.")) {
      setAddOpen(false); setNewModelId(""); setNewLabel(""); setNewIn("0"); setNewOut("0")
    }
  }

  function openEdit(m: ModelRow) {
    setEditModel(m); setEditLabel(m.label)
    setEditIn(String(m.inputCostPencePer1k)); setEditOut(String(m.outputCostPencePer1k))
  }
  async function saveEdit() {
    if (!editModel) return
    setSaving(true)
    const res = await updateAiModel(editModel.id, {
      label: editLabel,
      inputCostPencePer1k: Number(editIn) || 0,
      outputCostPencePer1k: Number(editOut) || 0,
    })
    setSaving(false)
    if (notify(res, "Model updated.")) setEditModel(null)
  }

  if (!available) {
    return (
      <Card className="py-10 text-center">
        <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">AI gateway tables not provisioned</p>
        <p className="text-xs text-slate-400 mt-1">Run the AI gateway migration to manage providers and models here.</p>
      </Card>
    )
  }

  const modelsByProvider = providers.map((p) => ({ provider: p, models: models.filter((m) => m.providerId === p.id) }))

  return (
    <div className="space-y-4">
      {msg && <Banner kind={msg.kind} msg={msg.msg} />}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Enable providers/models, set the default, and manage the model catalogue. Keys come from server env only.</p>
        <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 shrink-0">
          <Plus className="w-4 h-4" /> Add Model
        </button>
      </div>

      {modelsByProvider.map(({ provider, models: pm }) => (
        <Card key={provider.id} noPadding>
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-[#7C3AED]" /></div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{provider.name}</p>
                <p className="text-[11px] text-slate-400">
                  {provider.apiKeyEnv ?? "no key env"} · {provider.keyPresent ? <span className="text-emerald-600">key present</span> : <span className="text-amber-600">key missing</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400">{provider.enabled ? "Enabled" : "Disabled"}</span>
              <Toggle on={provider.enabled} onClick={() => toggleProvider(provider)} />
            </div>
          </div>
          {pm.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-5">No models for this provider yet.</p>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {pm.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{m.label}</p>
                      {m.isDefault && <Badge variant="ai" size="sm"><Star className="w-3 h-3" /> Default</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{m.modelId} · in {m.inputCostPencePer1k}p/1k · out {m.outputCostPencePer1k}p/1k</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!m.isDefault && (
                      <button onClick={() => makeDefault(m)} title="Set as default" className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#7C3AED] hover:bg-[#F5F3FF] flex items-center justify-center"><Star className="w-3.5 h-3.5" /></button>
                    )}
                    <button onClick={() => toggleModel(m)} title={m.enabled ? "Disable" : "Enable"} className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.enabled ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}><Power className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEdit(m)} title="Edit" className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-[#EFF6FF] flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                    <ConfirmDialog title={`Delete "${m.label}"?`} description="The model is removed from the catalogue. Usage history is retained." confirmLabel="Delete model" confirmVariant="danger" onConfirm={async () => { notify(await deleteAiModel(m.id), "Model deleted.") }}>
                      {(open) => <button onClick={open} title="Delete" className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </ConfirmDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* Add model dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent size="md">
          <DialogHeader><DialogTitle>Add Model</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Provider" required><NativeSelect value={newProvider} onChange={setNewProvider} options={providers.map((p) => ({ value: p.id, label: p.name }))} /></Field>
            <Field label="Model ID" required hint="The provider's model identifier, e.g. kimi-k2 or gpt-4o-mini."><Input value={newModelId} onChange={(e) => setNewModelId(e.target.value)} placeholder="kimi-k2" /></Field>
            <Field label="Display label" required><Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Kimi K2" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Input cost (p/1k)"><Input type="number" value={newIn} onChange={(e) => setNewIn(e.target.value)} /></Field>
              <Field label="Output cost (p/1k)"><Input type="number" value={newOut} onChange={(e) => setNewOut(e.target.value)} /></Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setAddOpen(false)} className="h-9 px-4 rounded-lg border border-[#E2E8F0] text-[13px] font-medium text-slate-600 hover:bg-slate-50"><X className="w-4 h-4 inline -mt-0.5" /> Cancel</button>
              <button onClick={createModel} disabled={saving || !newModelId.trim() || !newLabel.trim()} className="h-9 px-4 rounded-lg bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 disabled:opacity-50"><Check className="w-4 h-4 inline -mt-0.5" /> Add Model</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit model dialog */}
      <Dialog open={!!editModel} onOpenChange={(o) => !o && setEditModel(null)}>
        <DialogContent size="md">
          <DialogHeader><DialogTitle>Edit Model</DialogTitle></DialogHeader>
          {editModel && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-mono">{editModel.modelId}</p>
              <Field label="Display label"><Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Input cost (p/1k)"><Input type="number" value={editIn} onChange={(e) => setEditIn(e.target.value)} /></Field>
                <Field label="Output cost (p/1k)"><Input type="number" value={editOut} onChange={(e) => setEditOut(e.target.value)} /></Field>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditModel(null)} className="h-9 px-4 rounded-lg border border-[#E2E8F0] text-[13px] font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={saveEdit} disabled={saving} className="h-9 px-4 rounded-lg bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4fd7] disabled:opacity-50">Save</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
