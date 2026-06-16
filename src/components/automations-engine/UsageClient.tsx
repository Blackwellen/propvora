"use client"

import React, { useEffect, useState } from "react"
import { Gauge, Zap, Webhook, Boxes, Loader2 } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { loadUsage } from "./api"

type Usage = { active: number; total: number; webhooks: number; runsUsed: number; runsLimit: number; runsRemaining: number; runsUnlimited: boolean }
type Limits = { plan: string; maxActive: number; maxRunsMonth: number; maxNodes: number; maxWebhooks: number; retentionDays: number; canvasAccess: string; aiAccess: string; nlAccess: string }

function Meter({ label, used, limit, icon: Icon, unlimited }: { label: string; used: number; limit: number; icon: React.ElementType; unlimited?: boolean }) {
  const pct = unlimited ? 0 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const tone = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><Icon className="h-3.5 w-3.5" /> {label}</span>
        <span className="text-xs text-slate-400">{unlimited ? "unlimited" : `${used} / ${limit}`}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{used.toLocaleString()}</div>
      {!unlimited && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${tone}`} style={{ width: `${pct}%` }} /></div>
      )}
    </div>
  )
}

export default function UsageClient() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [usage, setUsage] = useState<Usage | null>(null)
  const [limits, setLimits] = useState<Limits | null>(null)
  const [tier, setTier] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    loadUsage(workspaceId).then((r) => {
      if (r.ok && r.usage) { setUsage(r.usage as unknown as Usage); setLimits((r.limits ?? null) as unknown as Limits); setTier(r.tier ?? "") }
      else if (r.error) setErr(r.error)
    }).finally(() => setLoading(false))
  }, [workspaceId])

  if (loading) return <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />)}</div>
  if (err) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{err}</div>
  if (!usage || !limits) return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No usage data yet.</div>

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-slate-500" /><span className="text-sm font-semibold text-slate-900">Plan: {limits.plan}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{tier}</span></div>
        <p className="mt-1 text-xs text-slate-500">Real per-plan governance limits. Caps are enforced server-side in the executor; dry runs never count.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Meter label="Active automations" used={usage.active} limit={limits.maxActive} icon={Zap} />
        <Meter label="Runs this month" used={usage.runsUsed} limit={usage.runsLimit} icon={Boxes} unlimited={usage.runsUnlimited} />
        <Meter label="Webhooks" used={usage.webhooks} limit={limits.maxWebhooks} icon={Webhook} />
        <Meter label="Total definitions" used={usage.total} limit={limits.maxActive} icon={Boxes} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <tbody className="divide-y divide-slate-100">
            {[
              ["Max nodes per automation", String(limits.maxNodes)],
              ["Log retention", `${limits.retentionDays} days`],
              ["Canvas access", limits.canvasAccess],
              ["AI builder access", limits.aiAccess],
              ["Natural-language builder", limits.nlAccess],
              ["Monthly run cap", usage.runsUnlimited ? "Unlimited" : limits.maxRunsMonth.toLocaleString()],
            ].map(([k, v]) => (
              <tr key={k}><td className="px-4 py-2.5 text-slate-500">{k}</td><td className="px-4 py-2.5 text-right font-medium capitalize text-slate-800">{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
