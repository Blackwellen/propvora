"use client"

import { useMemo, useState } from "react"
import {
  CreditCard, PoundSterling, CalendarClock, ShieldCheck, Download, Filter, ArrowUpRight,
  ArrowDownLeft, Building2, FileText, LifeBuoy, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PortalCard, PortalSectionCard, PortalKpiStrip, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact, type PortalKpi,
} from "@/components/portals/portal-ui"

export interface LedgerRow {
  id: string
  created_at: string | null
  description: string | null
  category: string | null
  direction: string
  amount: number | null
  currency: string | null
  status: string | null
  period?: string | null
}

function money(n: number | null | undefined, ccy = "GBP") {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: ccy, minimumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n)
}
function fmtDate(iso: string | null) { if (!iso) return "—"; const d = new Date(iso); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }

const TABS = ["All", "Rent", "Credits", "Charges", "Deposit", "Receipts"] as const

export default function PortalPaymentsClient({
  rows, base, rentPcm, depositHeld, nextDue,
}: {
  rows: LedgerRow[]; base: string; rentPcm: number | null; depositHeld: number | null; nextDue: string | null
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All")

  const totalPaid = useMemo(() => rows.filter((r) => r.direction === "in").reduce((s, r) => s + (r.amount ?? 0), 0), [rows])
  const filtered = useMemo(() => {
    if (tab === "All") return rows
    if (tab === "Rent") return rows.filter((r) => (r.category ?? "").toLowerCase().includes("rent"))
    if (tab === "Credits") return rows.filter((r) => r.direction === "in")
    if (tab === "Charges") return rows.filter((r) => r.direction === "out")
    if (tab === "Deposit") return rows.filter((r) => (r.category ?? "").toLowerCase().includes("deposit"))
    return rows // Receipts
  }, [rows, tab])

  // Running balance (oldest→newest)
  const withBalance = useMemo(() => {
    const asc = [...filtered].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))
    let bal = 0
    const map = new Map<string, number>()
    for (const r of asc) { bal += (r.direction === "in" ? 1 : -1) * (r.amount ?? 0); map.set(r.id, bal) }
    return [...filtered].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).map((r) => ({ ...r, balance: map.get(r.id) ?? 0 }))
  }, [filtered])

  const kpis: PortalKpi[] = [
    { label: "Next payment due", value: rentPcm != null ? money(rentPcm) : "—", sub: nextDue ? fmtDate(nextDue) : "—", icon: CreditCard, tone: "blue" },
    { label: "Monthly rent", value: rentPcm != null ? money(rentPcm) : "—", icon: PoundSterling, tone: "slate" },
    { label: "Total paid this year", value: money(totalPaid), sub: "Received", icon: CheckCircle2, tone: "emerald" },
    { label: "Account status", value: "Up to date", icon: ShieldCheck, tone: "emerald" },
    { label: "Deposit held", value: depositHeld != null ? money(depositHeld) : "—", sub: "Protected", icon: ShieldCheck, tone: "violet" },
  ]

  return (
    <div className="space-y-5">
      <PortalKpiStrip kpis={kpis} cols={5} />

      {/* Method + next scheduled */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PortalSectionCard title="Payment method" icon={CreditCard}>
          <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center"><Building2 className="w-5 h-5" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Standing order / bank transfer</p><p className="text-xs text-slate-400">Set up with your manager</p></div></div>
        </PortalSectionCard>
        <PortalSectionCard title="Next scheduled payment" icon={CalendarClock}>
          <div className="flex items-center justify-between"><PortalFact icon={PoundSterling} label="Amount" value={rentPcm != null ? money(rentPcm) : "—"} /><PortalFact icon={CalendarClock} label="Due" value={nextDue ? fmtDate(nextDue) : "—"} /></div>
        </PortalSectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Ledger */}
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 bg-white border border-[#E2EAF6] rounded-xl p-1">{TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("h-8 px-3 rounded-lg text-xs font-semibold transition-colors", tab === t ? "bg-[#2563EB] text-white" : "text-slate-500 hover:bg-slate-50")}>{t}</button>
            ))}</div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#E2EAF6] bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50"><Filter className="w-4 h-4" /> Filter</button>
              <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#E2EAF6] bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50"><Download className="w-4 h-4" /> Export</button>
            </div>
          </div>

          <PortalCard className="overflow-hidden">
            {withBalance.length === 0 ? (
              <PortalEmptyState icon={CreditCard} title="No payments recorded" description="Your rent ledger will appear here once payments are recorded." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]">
                    <th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#F1F5FB]">
                    {withBalance.map((r) => {
                      const incoming = r.direction === "in"
                      return (
                        <tr key={r.id} className="hover:bg-[#FAFCFF]">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", incoming ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500")}>{incoming ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}</span><span className="font-medium text-[#071B4D] truncate max-w-[200px]">{r.description ?? (incoming ? "Rent received" : "Charge")}</span></div></td>
                          <td className="px-4 py-3 text-slate-500 capitalize">{r.category?.replace(/_/g, " ") ?? "Rent"}</td>
                          <td className={cn("px-4 py-3 text-right font-semibold", incoming ? "text-emerald-600" : "text-slate-900")}>{incoming ? "+" : "−"}{money(r.amount, r.currency ?? "GBP")}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{money(r.balance)}</td>
                          <td className="px-4 py-3"><StatusChip tone={incoming ? "emerald" : "slate"} dot>{incoming ? "Received" : "Charged"}</StatusChip></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </PortalCard>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <PortalSectionCard title="Upcoming rent schedule" icon={CalendarClock}>
            <ul className="space-y-2 text-sm">{nextDue && rentPcm != null ? [0, 1, 2].map((i) => { const d = new Date(nextDue); d.setMonth(d.getMonth() + i); return (
              <li key={i} className="flex items-center justify-between"><span className="text-slate-500">{d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span><span className="font-semibold text-[#071B4D]">{money(rentPcm)}</span></li>
            )}) : <li className="text-xs text-slate-400">No schedule set.</li>}</ul>
          </PortalSectionCard>
          <PortalSectionCard title="Recent statements" icon={FileText} viewAllHref={`${base}/documents`}>
            <PortalButtonLink href={`${base}/documents`} variant="ghost" icon={Download} className="w-full justify-center">Download statement</PortalButtonLink>
          </PortalSectionCard>
          <PortalSectionCard title="Payment support" icon={LifeBuoy}>
            <p className="text-xs text-slate-500 mb-3">Questions about a payment? Message your manager.</p>
            <PortalButtonLink href={`${base}/messages`} variant="primary" className="w-full justify-center">Message manager</PortalButtonLink>
          </PortalSectionCard>
          <PortalCard className="p-4"><div className="flex items-start gap-2.5"><span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Deposit protected</p><p className="text-xs text-slate-400 mt-0.5">{depositHeld != null ? money(depositHeld) : "Your deposit"} held in a government scheme.</p></div></div></PortalCard>
        </div>
      </div>
    </div>
  )
}
