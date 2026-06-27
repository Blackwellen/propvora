"use client"

/* ──────────────────────────────────────────────────────────────────────────
   TeamServiceSLAs — manifest image 13 (Team Services: SLAs + Assignment Rules).
   Service categories with team assignment rules, SLAs, rate cards by area,
   emergency premiums, min charges and required qualifications. Actions stubbed.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import { Clock, Users, Wrench, ShieldCheck, Plus, ChevronRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { moneyPence } from "@/components/supplier-workspace/format"

interface ServiceSLA {
  id: string
  name: string
  trade: string
  responseSlaMins: number
  completionSlaHours: number
  minChargePence: number
  emergencyPremiumPct: number
  assignmentRule: string
  requiredQual: string | null
  breaches30d: number
}

// Honest empty — no live service-SLA loader exists yet. Add SLA rules to populate.
const SERVICES: ServiceSLA[] = []

export function TeamServiceSLAs() {
  const [toast, setToast] = useState<string | null>(null)
  const [selId, setSelId] = useState<string | null>(null)
  const selected: ServiceSLA | null = SERVICES.find((s) => s.id === selId) ?? SERVICES[0] ?? null

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <Mini label="Services" value={String(SERVICES.length)} tone="slate" />
          <Mini label="SLA breaches (30d)" value={String(SERVICES.reduce((s, x) => s + x.breaches30d, 0))} tone="amber" />
          <Mini label="With emergency premium" value={String(SERVICES.filter((s) => s.emergencyPremiumPct > 0).length)} tone="blue" />
        </div>
        <SupplierButton onClick={() => setToast("New SLA rule started.")}><Plus className="w-4 h-4" /> Add SLA rule</SupplierButton>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <SupplierCard className="p-0 overflow-hidden min-w-0">
          {SERVICES.length === 0 ? (
            <div className="p-10 text-center"><Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No SLA rules yet</p><p className="text-xs text-slate-400 mt-1">Add SLA and assignment rules for your services.</p></div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><Th>Service</Th><Th>Response SLA</Th><Th>Completion</Th><Th>Min charge</Th><Th>Emergency</Th><Th>Breaches</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {SERVICES.map((s) => (
                  <tr key={s.id} onClick={() => setSelId(s.id)} className={cn("hover:bg-slate-50/60 cursor-pointer", selected?.id === s.id && "bg-[var(--brand-soft)]/40")}>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-800">{s.name}</p><p className="text-[11px] text-slate-400">{s.trade}</p></td>
                    <td className="px-4 py-3 text-slate-600">{s.responseSlaMins < 60 ? `${s.responseSlaMins}m` : `${Math.round(s.responseSlaMins / 60)}h`}</td>
                    <td className="px-4 py-3 text-slate-600">{s.completionSlaHours}h</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{moneyPence(s.minChargePence)}</td>
                    <td className="px-4 py-3">{s.emergencyPremiumPct > 0 ? <span className="text-amber-600 font-semibold">+{s.emergencyPremiumPct}%</span> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3">{s.breaches30d > 0 ? <span className="text-red-600 font-semibold">{s.breaches30d}</span> : <span className="text-emerald-600 font-semibold">0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </SupplierCard>

        <SupplierCard className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Service rules</p>
          {selected ? (
          <>
          <h2 className="text-base font-semibold text-slate-900 mt-1">{selected.name}</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <RuleRow icon={Clock} k="Response SLA" v={`${selected.responseSlaMins < 60 ? `${selected.responseSlaMins}m` : `${Math.round(selected.responseSlaMins / 60)}h`}`} />
            <RuleRow icon={Users} k="Assignment" v={selected.assignmentRule} />
            <RuleRow icon={Wrench} k="Trade" v={selected.trade} />
            <RuleRow icon={ShieldCheck} k="Required qual" v={selected.requiredQual ?? "None"} />
            <RuleRow icon={Zap} k="Emergency premium" v={selected.emergencyPremiumPct > 0 ? `+${selected.emergencyPremiumPct}%` : "None"} />
          </dl>
          <div className="mt-4 space-y-1.5">
            <SupplierButton className="w-full justify-center" onClick={() => setToast("Assignment rule updated.")}><Users className="w-4 h-4" /> Set assignment rule</SupplierButton>
            <SupplierButton variant="outline" className="w-full justify-center" onClick={() => setToast("Opening customer preview…")}>Preview customer rules <ChevronRight className="w-4 h-4" /></SupplierButton>
          </div>
          </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4 mt-1">Select a service to view its rules.</p>
          )}
        </SupplierCard>
      </div>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</th> }
function Mini({ label, value, tone }: { label: string; value: string; tone: "blue" | "amber" | "slate" }) {
  const c = tone === "blue" ? "text-[var(--brand)]" : tone === "amber" ? "text-amber-600" : "text-slate-900"
  return <SupplierCard className="p-3.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><p className={cn("text-lg font-bold mt-1", c)}>{value}</p></SupplierCard>
}
function RuleRow({ icon: Icon, k, v }: { icon: typeof Clock; k: string; v: string }) {
  return <div className="flex items-start gap-2"><Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /><div className="flex-1 min-w-0"><dt className="text-[11px] text-slate-400">{k}</dt><dd className="text-sm font-medium text-slate-800">{v}</dd></div></div>
}
