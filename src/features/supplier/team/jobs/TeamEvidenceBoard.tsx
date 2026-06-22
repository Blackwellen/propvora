"use client"

/* ──────────────────────────────────────────────────────────────────────────
   TeamEvidenceBoard — manifest image 10 (Team Jobs: Evidence + Awaiting
   Sign-off).

   Jobs awaiting evidence / customer sign-off, worker responsible, evidence
   completeness, before/after + certificate status, payout-blocked flag,
   customer-reminder status and evidence quality score. Plan-gated, reached via
   /supplier/jobs?tab=evidence. Remind/approve actions are typed stubs.
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Images, CheckCircle2, Circle, AlertTriangle, BellRing, ChevronRight, Gauge, PenLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { EVIDENCE_JOBS, type EvidenceJob } from "@/features/supplier/team/data/jobs"

export function TeamEvidenceBoard() {
  const [toast, setToast] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "awaiting_evidence" | "awaiting_signoff">("all")
  const [selId, setSelId] = useState<string | null>(null)
  const selected: EvidenceJob | null = EVIDENCE_JOBS.find((j) => j.id === selId) ?? EVIDENCE_JOBS[0] ?? null

  const rows = useMemo(() => (filter === "all" ? EVIDENCE_JOBS : EVIDENCE_JOBS.filter((j) => j.stage === filter)), [filter])
  const awaitingEvidence = EVIDENCE_JOBS.filter((j) => j.stage === "awaiting_evidence").length
  const awaitingSignoff = EVIDENCE_JOBS.filter((j) => j.stage === "awaiting_signoff").length
  const payoutBlocked = EVIDENCE_JOBS.filter((j) => j.payoutBlocked).length

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Awaiting evidence" value={String(awaitingEvidence)} tone="amber" />
        <Mini label="Awaiting sign-off" value={String(awaitingSignoff)} tone="blue" />
        <Mini label="Payout blocked" value={String(payoutBlocked)} tone="red" />
        <Mini label="Avg quality" value="—" tone="emerald" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5">
        {([["all", "All"], ["awaiting_evidence", "Awaiting evidence"], ["awaiting_signoff", "Awaiting sign-off"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", filter === k ? "bg-[#2563EB] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Evidence table */}
        <SupplierCard className="p-0 overflow-hidden min-w-0">
          {rows.length === 0 ? (
            <div className="p-10 text-center"><Images className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No evidence outstanding</p><p className="text-xs text-slate-400 mt-1">Jobs awaiting evidence or customer sign-off appear here.</p></div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><Th>Job</Th><Th>Worker</Th><Th>Completeness</Th><Th>Before/After/Cert</Th><Th>Quality</Th><Th>Status</Th><Th /></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((j) => (
                  <tr key={j.id} onClick={() => setSelId(j.id)} className={cn("hover:bg-slate-50/60 cursor-pointer", selected?.id === j.id && "bg-blue-50/40")}>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-800">{j.title}</p><p className="text-[11px] text-slate-400">{j.ref}</p></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 flex items-center justify-center">{j.workerInitials}</span><span className="text-slate-600 text-xs">{j.worker.split(" ")[0]}</span></span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={cn("h-full rounded-full", j.completenessPct === 100 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${j.completenessPct}%` }} /></div><span className="text-[11px] text-slate-400">{j.completenessPct}%</span></div></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Dot ok={j.beforeOk} /><Dot ok={j.afterOk} /><Dot ok={j.certOk} /></div></td>
                    <td className="px-4 py-3 text-slate-600">{j.qualityScore ?? "—"}</td>
                    <td className="px-4 py-3">{j.payoutBlocked ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertTriangle className="w-3 h-3" /> Payout blocked</span> : <span className="text-[11px] font-semibold text-emerald-600">Ready</span>}</td>
                    <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </SupplierCard>

        {/* Detail panel */}
        <SupplierCard className="p-5">
          {selected ? (
          <>
          <div className="flex items-center justify-between mb-1"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{selected.stage === "awaiting_evidence" ? "Awaiting evidence" : "Awaiting sign-off"}</p>{selected.qualityScore != null && <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Gauge className="w-3.5 h-3.5" />{selected.qualityScore}</span>}</div>
          <h2 className="text-base font-semibold text-slate-900">{selected.title}</h2>
          <p className="text-xs text-slate-400">{selected.ref} · {selected.worker}</p>

          <div className="mt-4 space-y-2.5">
            <Req ok={selected.beforeOk} label="Before photos" />
            <Req ok={selected.afterOk} label="After photos" />
            <Req ok={selected.certOk} label="Certificate / sign-off doc" />
          </div>

          {selected.payoutBlocked && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Payout is blocked until evidence is complete.</div>
          )}

          <div className="mt-4 space-y-1.5">
            <Link href={`/supplier/jobs/${selected.ref}/evidence`} className="block"><SupplierButton className="w-full justify-center"><Images className="w-4 h-4" /> Open evidence</SupplierButton></Link>
            {selected.stage === "awaiting_signoff" ? (
              <Link href={`/supplier/jobs/${selected.ref}/sign-off`} className="block"><SupplierButton variant="outline" className="w-full justify-center"><PenLine className="w-4 h-4" /> Request sign-off</SupplierButton></Link>
            ) : (
              <SupplierButton variant="outline" className="w-full justify-center" onClick={() => setToast(`Reminder sent to ${selected.worker}.`)}><BellRing className="w-4 h-4" /> Remind {selected.worker.split(" ")[0]}</SupplierButton>
            )}
            <SupplierButton variant="ghost" className="w-full justify-center" onClick={() => setToast("Evidence approved.")} disabled={selected.payoutBlocked}><CheckCircle2 className="w-4 h-4" /> Approve evidence</SupplierButton>
          </div>
          </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Select a job to review its evidence.</p>
          )}
        </SupplierCard>
      </div>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</th>
}
function Dot({ ok }: { ok: boolean }) {
  return ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />
}
function Req({ ok, label }: { ok: boolean; label: string }) {
  return <div className="flex items-center gap-2 text-sm">{ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-300" />}<span className={ok ? "text-slate-600" : "text-slate-800 font-medium"}>{label}</span></div>
}
function Mini({ label, value, tone }: { label: string; value: string; tone: "blue" | "emerald" | "red" | "amber" }) {
  const c = tone === "blue" ? "text-[#2563EB]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-amber-600"
  return (
    <SupplierCard className="p-3.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <p className={cn("text-xl font-bold mt-1", c)}>{value}</p>
    </SupplierCard>
  )
}
