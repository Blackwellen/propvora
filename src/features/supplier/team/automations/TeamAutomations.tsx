"use client"

/* ──────────────────────────────────────────────────────────────────────────
   TeamAutomations — manifest image 28 (Team Automations: Rules / Templates /
   Logs / Approvals). Includes the review-first safety banner; customer/
   platform/payment/public-facing automations are gated behind approval and
   never bypass Propvora review-first safety. Actions are typed stubs.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import {
  Workflow, ShieldCheck, Play, Pause, Plus, AlertTriangle, CheckCircle2, FileText, Activity, Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierStatusBadge } from "@/components/supplier-workspace/ui"
import { timeAgo } from "@/components/supplier-workspace/format"

type Tab = "rules" | "templates" | "logs" | "approvals"

interface Rule { id: string; name: string; trigger: string; status: "active" | "paused"; approvalRequired: boolean; customerImpacting: boolean; runs7d: number; errors: number }
const RULES: Rule[] = []
const TEMPLATES = [
  { id: "t1", name: "Auto-assign jobs by trade/area", desc: "Route new jobs to the nearest qualified worker.", customerImpacting: false },
  { id: "t2", name: "Notify team on new request", desc: "Ping the team channel when an RFQ lands.", customerImpacting: false },
  { id: "t3", name: "Customer completion message", desc: "Send a thank-you + review request after sign-off.", customerImpacting: true },
  { id: "t4", name: "SLA breach warning", desc: "Internal alert when a job is near its SLA.", customerImpacting: false },
]
const LOGS: { id: string; rule: string; at: string; status: "ok" | "error"; detail: string }[] = []
const APPROVALS: { id: string; name: string; reason: string; requestedBy: string; at: string }[] = []

export function TeamAutomations() {
  const [tab, setTab] = useState<Tab>("rules")
  const [toast, setToast] = useState<string | null>(null)
  const [rules, setRules] = useState(RULES)

  function toggle(r: Rule) {
    setRules((rs) => rs.map((x) => x.id === r.id ? { ...x, status: x.status === "active" ? "paused" : "active" } : x))
    setToast(`${r.name} ${r.status === "active" ? "paused" : "activated"}.`)
  }

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div><h1 className="text-xl font-semibold text-slate-900">Team Automations</h1><p className="text-sm text-slate-500">Automate routing, reminders and alerts — safely.</p></div>
        <SupplierButton onClick={() => setToast("New rule started.")}><Plus className="w-4 h-4" /> Create rule</SupplierButton>
      </div>

      {/* Review-first safety banner */}
      <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div><p className="text-sm font-semibold text-blue-900">Review-first safety</p><p className="text-xs text-blue-700">Automations that touch customers, payments, the platform or public listings require approval and never bypass Propvora review-first safety.</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([["rules", "Rules", Workflow], ["templates", "Templates", FileText], ["logs", "Logs", Activity], ["approvals", "Approvals", CheckCircle2]] as const).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium -mb-px border-b-2", tab === k ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-700")}>
            <Icon className="w-4 h-4" />{l}{k === "approvals" && APPROVALS.length > 0 && <span className="ml-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full px-1.5">{APPROVALS.length}</span>}
          </button>
        ))}
      </div>

      {tab === "rules" && (
        <div className="space-y-2">
          {rules.length === 0 && (
            <SupplierCard className="p-10 text-center"><Workflow className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No automation rules yet</p><p className="text-xs text-slate-400 mt-1">Create your first rule to automate repetitive tasks.</p></SupplierCard>
          )}
          {rules.map((r) => (
            <SupplierCard key={r.id} className="p-4 flex items-center gap-3">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", r.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}><Workflow className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold text-slate-800">{r.name}</p>{r.customerImpacting && <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-full px-1.5 py-0.5 inline-flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />Customer-facing</span>}{r.approvalRequired && <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-full px-1.5 py-0.5">Approval</span>}</div>
                <p className="text-[11px] text-slate-400">{r.trigger} · {r.runs7d} runs (7d){r.errors > 0 ? ` · ${r.errors} error` : ""}</p>
              </div>
              <SupplierStatusBadge tone={r.status === "active" ? "emerald" : "slate"}>{r.status}</SupplierStatusBadge>
              <button onClick={() => toggle(r)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Toggle">{r.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
            </SupplierCard>
          ))}
        </div>
      )}

      {tab === "templates" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <SupplierCard key={t.id} className="p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">{t.name}</p>{t.customerImpacting && <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-full px-1.5 py-0.5">Approval</span>}</div>
              <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
              <SupplierButton size="sm" variant="outline" className="mt-3" onClick={() => setToast(`Using template: ${t.name}`)}><Plus className="w-3.5 h-3.5" /> Use template</SupplierButton>
            </SupplierCard>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <SupplierCard className="p-0 overflow-hidden">
          {LOGS.length === 0 ? (
            <div className="p-10 text-center"><Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No logs yet</p><p className="text-xs text-slate-400 mt-1">Automation run logs will appear here.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Rule</th><th className="px-4 py-3 font-semibold">Detail</th><th className="px-4 py-3 font-semibold">When</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {LOGS.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{l.rule}</td>
                    <td className="px-4 py-3 text-slate-600">{l.detail}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(l.at)}</td>
                    <td className="px-4 py-3">{l.status === "ok" ? <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />OK</span> : <span className="text-[11px] font-semibold text-red-600 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Error</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SupplierCard>
      )}

      {tab === "approvals" && (
        <div className="space-y-2">
          {APPROVALS.length === 0 ? (
            <SupplierCard className="p-10 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No approvals pending</p></SupplierCard>
          ) : APPROVALS.map((a) => (
            <SupplierCard key={a.id} className="p-4 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800">{a.name}</p><p className="text-[11px] text-slate-400">{a.reason} · requested by {a.requestedBy} · {timeAgo(a.at)}</p></div>
              <SupplierButton size="sm" onClick={() => setToast(`Approved: ${a.name}`)}><CheckCircle2 className="w-3.5 h-3.5" /> Approve</SupplierButton>
              <SupplierButton size="sm" variant="ghost" onClick={() => setToast(`Rejected: ${a.name}`)}>Reject</SupplierButton>
            </SupplierCard>
          ))}
        </div>
      )}
    </div>
  )
}
