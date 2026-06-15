"use client"

import React, { useState } from "react"
import Link from "next/link"
import { AlertTriangle, Building2, CheckCircle2, KeyRound, Sparkles, Star, Zap } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { setProviderEnabled, setModelEnabled, setDefaultModel } from "./actions"
import type { ProviderRow, ModelRow, UsageByWorkspaceRow } from "./data"

interface Props {
  providers: ProviderRow[]
  models: ModelRow[]
  usage: UsageByWorkspaceRow[]
  totals: { requests: number; tokensIn: number; tokensOut: number; costPence: number }
  windowDays: number
}

const TH = "text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"
const THR = "text-right text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"

function fmt(n: number) {
  return n.toLocaleString("en-GB")
}
function fmtCost(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        on ? "bg-[#2563EB]" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

export default function AiModelsClient({ providers, models, usage, totals, windowDays }: Props) {
  const [prov, setProv] = useState(providers)
  const [mods, setMods] = useState(models)
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  async function toggleProvider(id: string, next: boolean) {
    setMsg(null)
    setProv((p) => p.map((x) => (x.id === id ? { ...x, enabled: next } : x)))
    const res = await setProviderEnabled(id, next)
    if (!res.ok) {
      setProv((p) => p.map((x) => (x.id === id ? { ...x, enabled: !next } : x)))
      setMsg({ kind: "err", text: res.error ?? "Failed to update provider" })
    } else setMsg({ kind: "ok", text: "Provider updated." })
  }

  async function toggleModel(id: string, next: boolean) {
    setMsg(null)
    setMods((m) => m.map((x) => (x.id === id ? { ...x, enabled: next } : x)))
    const res = await setModelEnabled(id, next)
    if (!res.ok) {
      setMods((m) => m.map((x) => (x.id === id ? { ...x, enabled: !next } : x)))
      setMsg({ kind: "err", text: res.error ?? "Failed to update model" })
    } else setMsg({ kind: "ok", text: "Model updated." })
  }

  async function makeDefault(id: string) {
    setMsg(null)
    const prev = mods
    setMods((m) => m.map((x) => ({ ...x, isDefault: x.id === id, enabled: x.id === id ? true : x.enabled })))
    const res = await setDefaultModel(id)
    if (!res.ok) {
      setMods(prev)
      setMsg({ kind: "err", text: res.error ?? "Failed to set default" })
    } else setMsg({ kind: "ok", text: "Default model set." })
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div
          className={`flex items-start gap-2 p-2.5 rounded-lg border text-[11px] ${
            msg.kind === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {msg.kind === "err" ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI strip — usage over the window */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="px-4 py-3">
          <p className="text-[11px] text-slate-500">Requests ({windowDays}d)</p>
          <p className="text-lg font-bold text-slate-900 leading-tight">{fmt(totals.requests)}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] text-slate-500">Tokens in</p>
          <p className="text-lg font-bold text-slate-900 leading-tight">{fmt(totals.tokensIn)}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] text-slate-500">Tokens out</p>
          <p className="text-lg font-bold text-slate-900 leading-tight">{fmt(totals.tokensOut)}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] text-slate-500">Est. cost</p>
          <p className="text-lg font-bold text-slate-900 leading-tight">{fmtCost(totals.costPence)}</p>
        </Card>
      </div>

      {/* Providers */}
      <Card noPadding>
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-semibold text-slate-900">Providers</h2>
        </div>
        <div className="divide-y divide-[#F1F5F9]">
          {prov.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{p.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{p.slug}</span>
                  {p.keyPresent ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                      <KeyRound className="w-2.5 h-2.5" /> Key set
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                      <KeyRound className="w-2.5 h-2.5" /> No key in env
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {p.baseUrl ?? "Default endpoint"} · key env <code className="font-mono">{p.apiKeyEnv ?? "—"}</code>
                </p>
              </div>
              <Toggle on={p.enabled} onClick={() => toggleProvider(p.id, !p.enabled)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Models */}
      <Card noPadding>
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-semibold text-slate-900">Models</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50">
                <th className={TH}>Model</th>
                <th className={TH}>Provider</th>
                <th className={THR}>In £/1k tok</th>
                <th className={THR}>Out £/1k tok</th>
                <th className={TH}>Default</th>
                <th className={TH}>Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {mods.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2">
                    <span className="text-xs font-medium text-slate-800">{m.label}</span>
                    <span className="block text-[10px] font-mono text-slate-400">{m.modelId}</span>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-600">{m.providerName}</td>
                  <td className="px-3 py-2 text-right text-[11px] text-slate-700 tabular-nums">
                    £{(m.inputCostPencePer1k / 100).toFixed(5)}
                  </td>
                  <td className="px-3 py-2 text-right text-[11px] text-slate-700 tabular-nums">
                    £{(m.outputCostPencePer1k / 100).toFixed(5)}
                  </td>
                  <td className="px-3 py-2">
                    {m.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563EB] bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                        <Star className="w-2.5 h-2.5 fill-[#2563EB]" /> Default
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeDefault(m.id)}
                        className="text-[10px] font-medium text-slate-500 hover:text-[#2563EB] underline underline-offset-2"
                      >
                        Set default
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Toggle
                      on={m.enabled}
                      disabled={m.isDefault}
                      onClick={() => toggleModel(m.id, !m.enabled)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-[#E2E8F0]">
          <span className="text-[11px] text-slate-400">
            The default model can&apos;t be disabled. Disabling a provider stops the gateway dispatching to all its
            models (it falls back to the next enabled model).
          </span>
        </div>
      </Card>

      {/* Usage by workspace */}
      <Card noPadding>
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-semibold text-slate-900">Usage by workspace ({windowDays}d)</h2>
        </div>
        {usage.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500 font-medium">No AI usage recorded in this window</p>
            <p className="text-xs text-slate-400 mt-1">
              Usage is metered into <code className="font-mono">ai_usage_events</code> as workspaces use AI.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50">
                  <th className={TH}>Workspace</th>
                  <th className={THR}>Requests</th>
                  <th className={THR}>Tokens in</th>
                  <th className={THR}>Tokens out</th>
                  <th className={THR}>Est. cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {usage.map((r) => (
                  <tr key={r.workspaceId} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/workspaces/${r.workspaceId}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-[#2563EB]"
                      >
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{r.workspaceName}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-slate-700 tabular-nums">{fmt(r.requests)}</td>
                    <td className="px-3 py-2 text-right text-[11px] text-slate-700 tabular-nums">{fmt(r.tokensIn)}</td>
                    <td className="px-3 py-2 text-right text-[11px] text-slate-700 tabular-nums">{fmt(r.tokensOut)}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-medium text-slate-800 tabular-nums">
                      {fmtCost(r.costPence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
