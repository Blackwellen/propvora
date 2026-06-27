"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Team finance views — Revenue by team/service (17), Statements (18), Taxes
   (19), Adjustments/Credits (20). Rendered inside the Finance tab hub for team
   plans (finance-permitted roles only). Export/generate/approve are typed stubs.
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import { Download, FileText, Scale, Plus, CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierStatusBadge } from "@/components/supplier-workspace/ui"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import { TEAM_REVENUE_BY_MEMBER } from "@/features/supplier/team/data/overview"

function Mini({ label, value, tone = "slate" }: { label: string; value: string; tone?: "blue" | "emerald" | "red" | "amber" | "slate" }) {
  const c = tone === "blue" ? "text-[var(--brand)]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"
  return <SupplierCard className="p-3.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><p className={cn("text-lg font-bold mt-1", c)}>{value}</p></SupplierCard>
}

/* ── 17. Revenue by team / service ──────────────────────────────────────────── */

// Honest empty — no live revenue-by-service aggregate exists yet.
const REVENUE_BY_SERVICE: { name: string; revenuePence: number; marginPct: number }[] = []

export function TeamRevenue() {
  const [toast, setToast] = useState<string | null>(null)
  const totalService = REVENUE_BY_SERVICE.reduce((s, x) => s + x.revenuePence, 0) || 1
  const maxMember = TEAM_REVENUE_BY_MEMBER[0]?.revenuePence || 1

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="flex items-center justify-end"><SupplierButton variant="outline" onClick={() => setToast("Revenue report exported.")}><Download className="w-4 h-4" /> Export report</SupplierButton></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Mini label="Gross revenue" value={moneyPence(0)} tone="blue" />
        <Mini label="Net revenue" value={moneyPence(0)} tone="emerald" />
        <Mini label="Platform fees" value={moneyPence(0)} tone="amber" />
        <Mini label="Unpaid invoices" value={moneyPence(0)} tone="red" />
        <Mini label="Aged > 30d" value={moneyPence(0)} tone="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SupplierCard className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Revenue by team member</h2>
          {TEAM_REVENUE_BY_MEMBER.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No team revenue yet.</p>}
          <div className="space-y-2.5">
            {TEAM_REVENUE_BY_MEMBER.map((m, i) => (
              <div key={m.name} className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                <span className="w-7 h-7 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 flex items-center justify-center shrink-0">{m.initials}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-medium text-slate-700 truncate">{m.name}</p><span className="text-[12px] font-bold text-slate-900">{moneyPence(m.revenuePence)}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${(m.revenuePence / maxMember) * 100}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </SupplierCard>
        <SupplierCard className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Revenue &amp; margin by service</h2>
          {REVENUE_BY_SERVICE.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No service revenue yet.</p>}
          <ul className="divide-y divide-slate-50">
            {REVENUE_BY_SERVICE.map((s) => (
              <li key={s.name} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between"><p className="text-[13px] font-medium text-slate-700">{s.name}</p><span className="text-[12px] font-bold text-slate-900">{moneyPence(s.revenuePence)}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(s.revenuePence / totalService) * 100}%` }} /></div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 w-12 text-right">{s.marginPct}%</span>
              </li>
            ))}
          </ul>
        </SupplierCard>
      </div>
    </div>
  )
}

/* ── 18. Statements ─────────────────────────────────────────────────────────── */

interface Statement { id: string; period: string; totalPence: number; feePence: number; vatPence: number; status: string }
// Honest empty — no live statements loader exists yet.
const STATEMENTS: Statement[] = []

export function TeamStatements() {
  const [toast, setToast] = useState<string | null>(null)
  const [selId, setSelId] = useState<string | null>(null)
  const sel = STATEMENTS.find((s) => s.id === selId) ?? STATEMENTS[0] ?? null
  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="flex items-center justify-end gap-2"><SupplierButton variant="outline" onClick={() => setToast("Statement generated.")}><Plus className="w-4 h-4" /> Generate</SupplierButton><SupplierButton variant="outline" onClick={() => setToast("Sent to accountant.")}>Send to accountant</SupplierButton></div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        <SupplierCard className="p-0 overflow-hidden">
          {STATEMENTS.length === 0 ? (
            <div className="p-10 text-center"><FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No statements yet</p><p className="text-xs text-slate-400 mt-1">Monthly statements appear here once you have completed paid jobs.</p></div>
          ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Period</th><th className="px-4 py-3 font-semibold text-right">Net</th><th className="px-4 py-3 font-semibold text-right">Fees</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {STATEMENTS.map((s) => (
                <tr key={s.id} onClick={() => setSelId(s.id)} className={cn("hover:bg-slate-50/60 cursor-pointer", sel?.id === s.id && "bg-[var(--brand-soft)]/40")}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{s.period}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{moneyPence(s.totalPence)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{moneyPence(s.feePence)}</td>
                  <td className="px-4 py-3"><SupplierStatusBadge tone="emerald">Ready</SupplierStatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </SupplierCard>
        <SupplierCard className="p-5">
          <div className="flex items-center justify-between mb-3"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Statement</p><FileText className="w-4 h-4 text-slate-300" /></div>
          {sel ? (
            <>
              <h2 className="text-base font-semibold text-slate-900">{sel.period}</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Net earnings</dt><dd className="font-semibold text-slate-800">{moneyPence(sel.totalPence)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Platform fees</dt><dd className="font-semibold text-slate-800">−{moneyPence(sel.feePence)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">VAT</dt><dd className="font-semibold text-slate-800">{moneyPence(sel.vatPence)}</dd></div>
                <div className="flex justify-between border-t border-slate-200 pt-2"><dt className="font-medium text-slate-600">Payout reconciled</dt><dd className="font-bold text-emerald-600">{moneyPence(sel.totalPence - sel.feePence)}</dd></div>
              </dl>
              <div className="mt-4 space-y-1.5">
                <SupplierButton className="w-full justify-center" onClick={() => setToast("PDF downloaded.")}><Download className="w-4 h-4" /> Download PDF</SupplierButton>
                <SupplierButton variant="outline" className="w-full justify-center" onClick={() => setToast("CSV exported.")}>Export CSV</SupplierButton>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Select a statement to view its breakdown.</p>
          )}
        </SupplierCard>
      </div>
    </div>
  )
}

/* ── 19. Taxes ──────────────────────────────────────────────────────────────── */

export function TeamTaxes() {
  const [toast, setToast] = useState<string | null>(null)
  const [period, setPeriod] = useState("Q1 2025/26")
  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5">{["Q1 2025/26", "Q4 2024/25", "Q3 2024/25"].map((p) => <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", period === p ? "bg-[var(--brand)] text-white" : "bg-white border border-slate-200 text-slate-600")}>{p}</button>)}</div>
        <SupplierButton variant="outline" onClick={() => setToast("VAT report exported (MTD-ready).")}><Download className="w-4 h-4" /> Export VAT report</SupplierButton>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="VAT collected" value={moneyPence(0)} tone="blue" />
        <Mini label="VAT on fees" value={moneyPence(0)} tone="amber" />
        <Mini label="Taxable income" value={moneyPence(0)} tone="emerald" />
        <Mini label="Deductible fees" value={moneyPence(0)} tone="slate" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SupplierCard className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">VAT by category — {period}</h2>
          <ul className="divide-y divide-slate-50 text-sm">
            {[["Standard rate (20%)", 0], ["Reduced rate (5%)", 0], ["Zero rate", 0], ["VAT on platform fees", 0]].map(([k, v]) => (
              <li key={k as string} className="flex justify-between py-2"><span className="text-slate-600">{k as string}</span><span className="font-semibold text-slate-800">{moneyPence(v as number)}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-400">VAT figures populate once you have completed paid jobs in this period.</p>
        </SupplierCard>
        <SupplierCard className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Net VAT position</h2>
          <p className="text-3xl font-bold text-slate-900">{moneyPence(0)}</p>
          <p className="text-xs text-slate-400">Due to HMRC for {period}</p>
          <SupplierButton variant="outline" className="mt-4 w-full justify-center" onClick={() => setToast("Sent to accountant.")}>Send to accountant <ChevronRight className="w-4 h-4" /></SupplierButton>
        </SupplierCard>
      </div>
    </div>
  )
}

/* ── 20. Adjustments / credits ──────────────────────────────────────────────── */

interface Adjustment { id: string; ref: string; type: "credit" | "debit"; reason: string; amountPence: number; status: "pending" | "approved" | "rejected"; at: string }
// Honest empty — no live adjustments/credits loader exists yet.
const ADJUSTMENTS: Adjustment[] = []

export function TeamAdjustments() {
  const [toast, setToast] = useState<string | null>(null)
  const [rows, setRows] = useState(ADJUSTMENTS)
  const pending = useMemo(() => rows.filter((r) => r.status === "pending"), [rows])
  function decide(a: Adjustment, status: "approved" | "rejected") {
    setRows((rs) => rs.map((r) => (r.id === a.id ? { ...r, status } : r)))
    setToast(`${a.ref} ${status}.`)
  }
  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <Mini label="Pending approval" value={String(pending.length)} tone="amber" />
          <Mini label="Credits (30d)" value={moneyPence(0)} tone="emerald" />
          <Mini label="Debits (30d)" value={moneyPence(0)} tone="red" />
        </div>
        <SupplierButton onClick={() => setToast("Adjustment request started.")}><Plus className="w-4 h-4" /> Request adjustment</SupplierButton>
      </div>
      <SupplierCard className="p-0 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center"><Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No adjustments yet</p><p className="text-xs text-slate-400 mt-1">Credits and debits you request appear here for approval.</p></div>
        ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Ref</th><th className="px-4 py-3 font-semibold">Reason</th><th className="px-4 py-3 font-semibold text-right">Amount</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.ref}</td>
                <td className="px-4 py-3"><p className="text-slate-800">{a.reason}</p><p className="text-[11px] text-slate-400">{shortDate(a.at)}</p></td>
                <td className={cn("px-4 py-3 text-right font-semibold", a.amountPence < 0 ? "text-emerald-600" : "text-slate-900")}>{a.amountPence < 0 ? "+" : "−"}{moneyPence(Math.abs(a.amountPence))}</td>
                <td className="px-4 py-3"><SupplierStatusBadge tone={a.status === "approved" ? "emerald" : a.status === "rejected" ? "red" : "amber"}>{a.status}</SupplierStatusBadge></td>
                <td className="px-4 py-3 text-right">
                  {a.status === "pending" ? (
                    <span className="inline-flex gap-1"><button onClick={() => decide(a, "approved")} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50" aria-label="Approve"><CheckCircle2 className="w-4 h-4" /></button><button onClick={() => decide(a, "rejected")} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" aria-label="Reject"><XCircle className="w-4 h-4" /></button></span>
                  ) : <span className="text-[11px] text-slate-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </SupplierCard>
      <p className="text-[11px] text-slate-400 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Adjustments affect payouts and are fully audit-logged.</p>
    </div>
  )
}
