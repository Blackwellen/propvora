"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Team compliance views — Expiry Tracker (21), Accreditations (22), Team Checks
   (23). Rendered inside the Compliance tab hub for team plans. Compliance
   documents are private unless approved for public badge display. Actions stub.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import {
  ShieldCheck, Award, Users, CheckCircle2, Circle, AlertTriangle, Upload, Plus, Ban, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierStatusBadge } from "@/components/supplier-workspace/ui"
import { shortDate, daysUntil } from "@/components/supplier-workspace/format"

function Mini({ label, value, tone = "slate" }: { label: string; value: string; tone?: "blue" | "emerald" | "red" | "amber" | "slate" }) {
  const c = tone === "blue" ? "text-[#2563EB]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"
  return <SupplierCard className="p-3.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><p className={cn("text-lg font-bold mt-1", c)}>{value}</p></SupplierCard>
}
/* ── 21. Expiry tracker ─────────────────────────────────────────────────────── */
interface ExpiryItem { id: string; name: string; kind: "Insurance" | "Licence" | "Qualification" | "Document" | "Accreditation"; owner: string; expiresAt: string; blocksService: string | null }
const EXPIRY: ExpiryItem[] = []
export function TeamExpiryTracker() {
  const [toast, setToast] = useState<string | null>(null)
  const overdue = EXPIRY.filter((e) => (daysUntil(e.expiresAt) ?? 0) < 0).length
  const soon = EXPIRY.filter((e) => { const d = daysUntil(e.expiresAt) ?? 999; return d >= 0 && d <= 30 }).length
  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Expired" value={String(overdue)} tone="red" />
        <Mini label="Due ≤ 30 days" value={String(soon)} tone="amber" />
        <Mini label="Blocked services" value={String(EXPIRY.filter((e) => e.blocksService).length)} tone="red" />
        <Mini label="Items tracked" value={String(EXPIRY.length)} tone="emerald" />
      </div>
      <SupplierCard className="p-0 overflow-hidden">
        {EXPIRY.length === 0 ? (
          <div className="p-10 text-center"><ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No compliance items tracked</p><p className="text-xs text-slate-400 mt-1">Add insurance, licences and documents to track their expiry.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Item</th><th className="px-4 py-3 font-semibold">Owner</th><th className="px-4 py-3 font-semibold">Expiry</th><th className="px-4 py-3 font-semibold">Impact</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {EXPIRY.map((e) => { const d = daysUntil(e.expiresAt) ?? 0; const tone = d < 0 ? "red" : d <= 30 ? "amber" : "emerald"; return (
                <tr key={e.id}>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-800">{e.name}</p><p className="text-[11px] text-slate-400">{e.kind}</p></td>
                  <td className="px-4 py-3 text-slate-600">{e.owner}</td>
                  <td className="px-4 py-3"><span className={cn("text-xs font-semibold", tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-600")}>{d < 0 ? `Expired ${shortDate(e.expiresAt)}` : `${d}d · ${shortDate(e.expiresAt)}`}</span></td>
                  <td className="px-4 py-3">{e.blocksService ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"><Ban className="w-3 h-3" />{e.blocksService}</span> : <span className="text-[11px] text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-right"><SupplierButton size="sm" variant={d < 0 ? "primary" : "outline"} onClick={() => setToast(`Renewing ${e.name}…`)}><Upload className="w-3.5 h-3.5" /> Renew</SupplierButton></td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </SupplierCard>
    </div>
  )
}

/* ── 22. Accreditations ─────────────────────────────────────────────────────── */
interface Accred { id: string; name: string; body: string; expiresAt: string; status: "verified" | "pending_review" | "expired"; linkedServices: number; publicBadge: boolean }
const ACCREDS: Accred[] = []
export function TeamAccreditations() {
  const [toast, setToast] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <Mini label="Accreditations" value={String(ACCREDS.length)} tone="slate" />
          <Mini label="Verified" value={String(ACCREDS.filter((a) => a.status === "verified").length)} tone="emerald" />
          <Mini label="Public badges" value={String(ACCREDS.filter((a) => a.publicBadge).length)} tone="blue" />
        </div>
        <SupplierButton onClick={() => setToast("Add accreditation started.")}><Plus className="w-4 h-4" /> Add accreditation</SupplierButton>
      </div>
      {ACCREDS.length === 0 ? (
        <SupplierCard className="p-10 text-center">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No accreditations added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add your Gas Safe, CHAS, TrustMark and other accreditations here.</p>
        </SupplierCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACCREDS.map((a) => (
            <SupplierCard key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", a.status === "verified" ? "bg-emerald-50 text-emerald-600" : a.status === "expired" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}><Award className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{a.name}</p><SupplierStatusBadge tone={a.status === "verified" ? "emerald" : a.status === "expired" ? "red" : "amber"}>{a.status === "verified" ? "Verified" : a.status === "expired" ? "Expired" : "Pending"}</SupplierStatusBadge></div>
                  <p className="text-xs text-slate-400">{a.body} · {a.linkedServices} services · exp {shortDate(a.expiresAt)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {a.publicBadge && <span className="text-[11px] font-semibold text-blue-600 inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Public badge</span>}
                    <button onClick={() => setToast(`Opening ${a.name}…`)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-0.5">Manage <ChevronRight className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            </SupplierCard>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 23. Team checks ────────────────────────────────────────────────────────── */
interface WorkerCheck { id: string; name: string; initials: string; trade: string; gasSafe: boolean; dbs: boolean; rightToWork: boolean; training: boolean; blocked: string | null; expiresSoon: boolean }
const CHECKS: WorkerCheck[] = []
export function TeamChecks() {
  const [toast, setToast] = useState<string | null>(null)
  const [sel, setSel] = useState<WorkerCheck | null>(null)
  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Workers" value={String(CHECKS.length)} tone="slate" />
        <Mini label="Fully compliant" value={String(CHECKS.filter((c) => c.gasSafe || (c.dbs && c.rightToWork && c.training)).length)} tone="emerald" />
        <Mini label="Blocked" value={String(CHECKS.filter((c) => c.blocked).length)} tone="red" />
        <Mini label="Expiring soon" value={String(CHECKS.filter((c) => c.expiresSoon).length)} tone="amber" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <SupplierCard className="p-0 overflow-hidden min-w-0">
          {CHECKS.length === 0 ? (
            <div className="p-10 text-center"><Users className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No workers added yet</p><p className="text-xs text-slate-400 mt-1">Add team members to track their compliance checks.</p></div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Worker</th><th className="px-4 py-3 font-semibold text-center">Gas Safe</th><th className="px-4 py-3 font-semibold text-center">DBS</th><th className="px-4 py-3 font-semibold text-center">RTW</th><th className="px-4 py-3 font-semibold text-center">Training</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {CHECKS.map((c) => (
                  <tr key={c.id} onClick={() => setSel(c)} className={cn("hover:bg-slate-50/60 cursor-pointer", sel?.id === c.id && "bg-blue-50/40")}>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 flex items-center justify-center">{c.initials}</span><span><p className="font-semibold text-slate-800">{c.name}</p><p className="text-[11px] text-slate-400">{c.trade}</p></span></span></td>
                    <td className="px-4 py-3 text-center"><Cell ok={c.gasSafe} /></td>
                    <td className="px-4 py-3 text-center"><Cell ok={c.dbs} /></td>
                    <td className="px-4 py-3 text-center"><Cell ok={c.rightToWork} /></td>
                    <td className="px-4 py-3 text-center"><Cell ok={c.training} /></td>
                    <td className="px-4 py-3">{c.blocked ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"><Ban className="w-3 h-3" />{c.blocked}</span> : <span className="text-[11px] font-semibold text-emerald-600">Eligible</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </SupplierCard>
        <SupplierCard className="p-5">
          {sel ? (
            <>
              <div className="flex items-center gap-2 mb-2"><span className="w-9 h-9 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 flex items-center justify-center">{sel.initials}</span><div><p className="text-sm font-semibold text-slate-900">{sel.name}</p><p className="text-[11px] text-slate-400">{sel.trade}</p></div></div>
              {sel.blocked && <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Blocked from {sel.blocked} — missing checks.</div>}
              <div className="space-y-1.5">
                <SupplierButton className="w-full justify-center" onClick={() => setToast("Add check started.")}><Upload className="w-4 h-4" /> Add worker check</SupplierButton>
                <SupplierButton variant="outline" className="w-full justify-center" onClick={() => setToast("Training assigned.")}><Users className="w-4 h-4" /> Assign training</SupplierButton>
                {sel.blocked ? (
                  <SupplierButton variant="ghost" className="w-full justify-center" onClick={() => setToast(`${sel.name} unblocked.`)}><CheckCircle2 className="w-4 h-4" /> Unblock worker</SupplierButton>
                ) : (
                  <SupplierButton variant="ghost" className="w-full justify-center" onClick={() => setToast(`${sel.name} blocked.`)}><Ban className="w-4 h-4" /> Block worker</SupplierButton>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Select a worker to view details.</p>
          )}
        </SupplierCard>
      </div>
    </div>
  )
}

function Cell({ ok }: { ok: boolean }) { return ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" /> : <Circle className="w-4 h-4 text-slate-300 inline" /> }
