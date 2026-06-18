"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { MoneyTabNav } from "@/components/money"
import { MobileTopBar } from "@/components/mobile"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import {
  ShieldCheck, Clock, ShieldAlert, Timer, ImageOff, Search, ExternalLink,
  Banknote, Ban, Flag, FileQuestion, CheckCircle2,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts"
import {
  useManagedEscrows, useManagedEscrowKpis, useEscrowCashflow, useEscrowProjection,
} from "@/features/escrow/data/hooks"
import { SEED_E_TIMELINE } from "@/features/escrow/data/seed"
import {
  KpiCard, StatusBadge, toneForEscrowState, toneForEvidence, toneForRisk, humanise,
  ConfirmModal, PagerFooter, SourcePill, Select,
} from "@/features/orders/components/ui"
import type { ManagedEscrowRow } from "@/features/escrow/data/types"

export default function MoneyEscrowPage() {
  const { data: escrows, loading, source } = useManagedEscrows()
  const kpis = useManagedEscrowKpis(escrows)
  const { data: cashflow } = useEscrowCashflow()
  const { data: projection } = useEscrowProjection()

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [stageFilter, setStageFilter] = useState("")
  const [riskFilter, setRiskFilter] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<null | { kind: string; row: ManagedEscrowRow }>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  const filtered = useMemo(() => escrows.filter(e => {
    if (search && !`${e.escrowId} ${e.reference} ${e.counterparty} ${e.propertyLabel}`.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter && e.linkedType !== typeFilter) return false
    if (stageFilter && e.stage !== stageFilter) return false
    if (riskFilter && e.risk !== riskFilter) return false
    return true
  }), [escrows, search, typeFilter, stageFilter, riskFilter])

  const selected = escrows.find(e => e.id === selectedId) ?? null

  const cashflowData = cashflow.map(c => ({ month: c.month, Inflow: c.inflowPence / 100, Released: c.releasedPence / 100 }))
  const projectionData = projection.map(p => ({ date: p.date, Projected: p.projectedReleasePence / 100 }))

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>}

      <MobileTopBar title="Escrow" subtitle="Funds held & releases" />

      <DashboardContainer className="px-4 md:px-6 py-6 flex flex-col gap-6">
        <div className="hidden md:block">
          <SectionHeader
            title="Escrow Management"
            subtitle="Funds held in escrow across service orders and bookings — countdowns, evidence and controlled release."
            tabs={<MoneyTabNav />}
          />
        </div>
        <div className="md:hidden -mx-4"><MoneyTabNav /></div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon={ShieldCheck} iconBg="bg-blue-50" iconColor="text-blue-600" value={formatPence(kpis.totalInEscrowPence)} label="Total in escrow" />
          <KpiCard icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" value={kpis.releaseDueSoon} label="Release due soon" sub="Next 3 days" subColor="text-amber-600" />
          <KpiCard icon={ShieldAlert} iconBg="bg-red-50" iconColor="text-red-600" value={formatPence(kpis.disputedEscrowPence)} label="Disputed escrow" />
          <KpiCard icon={Timer} iconBg="bg-violet-50" iconColor="text-violet-600" value={`${kpis.avgHoldDays}d`} label="Average hold time" />
          <KpiCard icon={ImageOff} iconBg="bg-slate-100" iconColor="text-slate-500" value={kpis.awaitingEvidence} label="Awaiting evidence" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Escrow cashflow</h2>
            <p className="text-xs text-slate-500 mb-4">Funds taken into escrow vs released, by month</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cashflowData} margin={{ left: -10, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} formatter={(v) => formatPence(Number(v) * 100)} />
                <Bar dataKey="Inflow" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="Released" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Projected releases</h2>
            <p className="text-xs text-slate-500 mb-4">Cumulative funds scheduled to release</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={projectionData} margin={{ left: -10, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} formatter={(v) => formatPence(Number(v) * 100)} />
                <Line type="monotone" dataKey="Projected" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search escrow, reference, party, property…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <Select value={typeFilter} onChange={setTypeFilter} placeholder="All linked types" options={["service_order", "booking"]} humaniseOpt />
            <Select value={stageFilter} onChange={setStageFilter} placeholder="All stages" options={["funded", "held", "evidence_pending", "review_pending", "ready_to_release", "disputed"]} humaniseOpt />
            <Select value={riskFilter} onChange={setRiskFilter} placeholder="Risk" options={["low", "medium", "high"]} humaniseOpt />
            <SourcePill source={source} />
          </div>
        </div>

        {/* Table + panel */}
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Escrow ID</th>
                    <th className="px-4 py-3 font-semibold">Linked</th>
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Guest / Supplier</th>
                    <th className="px-4 py-3 font-semibold">Property</th>
                    <th className="px-4 py-3 font-semibold">Held</th>
                    <th className="px-4 py-3 font-semibold">Countdown</th>
                    <th className="px-4 py-3 font-semibold">Stage</th>
                    <th className="px-4 py-3 font-semibold">Evidence</th>
                    <th className="px-4 py-3 font-semibold">Rule</th>
                    <th className="px-4 py-3 font-semibold">Risk</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={12} className="px-4 py-4"><div className="h-5 bg-slate-50 rounded animate-pulse" /></td></tr>)
                    : filtered.length === 0 ? <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">No escrow records match your filters.</td></tr>
                    : filtered.map(e => {
                      const dleft = e.releaseDate ? Math.max(Math.ceil((new Date(e.releaseDate).getTime() - Date.now()) / 86_400_000), 0) : null
                      return (
                        <tr key={e.id} onClick={() => setSelectedId(e.id)} className={cn("border-b border-slate-50 cursor-pointer hover:bg-slate-50", selectedId === e.id && "bg-blue-50/40")}>
                          <td className="px-4 py-3 font-semibold text-slate-800">{e.escrowId}</td>
                          <td className="px-4 py-3"><StatusBadge tone={e.linkedType === "booking" ? "violet" : "blue"}>{humanise(e.linkedType)}</StatusBadge></td>
                          <td className="px-4 py-3 text-slate-600">{e.reference}</td>
                          <td className="px-4 py-3 text-slate-600">{e.counterparty}</td>
                          <td className="px-4 py-3 text-slate-600">{e.propertyLabel}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{formatPence(e.amountHeldPence)}</td>
                          <td className="px-4 py-3 text-slate-600">{dleft != null ? `${dleft}d` : "—"}</td>
                          <td className="px-4 py-3"><StatusBadge tone={toneForEscrowState(e.stage)}>{humanise(e.stage)}</StatusBadge></td>
                          <td className="px-4 py-3"><StatusBadge tone={toneForEvidence(e.evidenceStatus)}>{humanise(e.evidenceStatus)}</StatusBadge></td>
                          <td className="px-4 py-3 text-xs text-slate-500">{e.releaseRule}</td>
                          <td className="px-4 py-3"><StatusBadge tone={toneForRisk(e.risk)}>{humanise(e.risk)}</StatusBadge></td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/app/money/escrow/${e.escrowId}`} onClick={ev => ev.stopPropagation()} className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] inline-flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></Link>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <PagerFooter shown={filtered.length} total={escrows.length} />
          </div>

          {/* Right panel */}
          <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4">
            {selected ? (
              <EscrowPanel row={selected} onAction={kind => setConfirm({ kind, row: selected })} />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
                <ShieldCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">Select an escrow record</p>
                <p className="text-xs text-slate-400 mt-1">Countdown, stage, evidence, release conditions and actions.</p>
              </div>
            )}

            {/* Activity feed */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Escrow activity</h3>
              <div className="flex flex-col divide-y divide-slate-100">
                {SEED_E_TIMELINE.map(t => (
                  <div key={t.id} className="py-2.5 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                    <div><p className="text-xs text-slate-700">{t.fromState ? `${humanise(t.fromState)} → ` : ""}{humanise(t.toState)}</p><p className="text-[11px] text-slate-400">{t.actor} · {t.at}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardContainer>

      {confirm && (
        <ConfirmModal
          title={titleFor(confirm.kind)}
          message={msgFor(confirm.kind, confirm.row)}
          confirmLabel={titleFor(confirm.kind)}
          tone={confirm.kind === "release" ? "emerald" : confirm.kind === "hold" || confirm.kind === "dispute" ? "amber" : "blue"}
          requireReason={confirm.kind === "hold" || confirm.kind === "dispute"}
          blocked={confirm.kind === "release" && (confirm.row.evidenceStatus === "missing" || confirm.row.hasDispute)}
          blockedMessage={confirm.row.hasDispute ? "Release is frozen while a dispute is open." : "Release is blocked until evidence has been submitted and approved."}
          onConfirm={() => { setConfirm(null); showToast(`${titleFor(confirm.kind)} — done`) }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function titleFor(k: string) { return { release: "Release funds", hold: "Hold funds", dispute: "Raise dispute", evidence: "Request evidence" }[k] ?? "Confirm" }
function msgFor(k: string, e: ManagedEscrowRow) {
  if (k === "release") return `Release ${formatPence(e.amountHeldPence)} held in ${e.escrowId} (${e.reference}).`
  if (k === "hold") return `Hold funds in ${e.escrowId}. A reason is required for the audit log.`
  if (k === "dispute") return `Raise a dispute on ${e.escrowId}. This freezes release.`
  return `Request evidence for ${e.escrowId}.`
}

function EscrowPanel({ row, onAction }: { row: ManagedEscrowRow; onAction: (k: string) => void }) {
  const dleft = row.releaseDate ? Math.max(Math.ceil((new Date(row.releaseDate).getTime() - Date.now()) / 86_400_000), 0) : null
  const blocked = row.evidenceStatus === "missing" || row.hasDispute
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">{row.escrowId}</h3><StatusBadge tone={toneForEscrowState(row.stage)}>{humanise(row.stage)}</StatusBadge></div>
        <p className="text-xs text-slate-500 mt-1">{row.reference} · {row.propertyLabel}</p>
      </div>
      <div className="p-5 border-b border-slate-100 text-center">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">Countdown</p>
        <p className="text-3xl font-bold text-slate-900">{dleft != null ? `${dleft}d` : "—"}</p>
        <p className="text-xs text-slate-500">{row.releaseDate ? new Date(row.releaseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No date"}</p>
        <div className="mt-3"><div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Stage progress</span><span className="font-semibold text-slate-700">{row.milestoneProgress}%</span></div><div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.milestoneProgress}%` }} /></div></div>
      </div>
      <div className="p-5 border-b border-slate-100 space-y-1.5 text-sm">
        <div className="flex items-center justify-between"><span className="text-slate-500">Held</span><span className="font-semibold text-slate-800">{formatPence(row.amountHeldPence)}</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-500">Funded</span><span className="font-semibold text-slate-800">{formatPence(row.fundedAmountPence)}</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-500">Release rule</span><span className="font-medium text-slate-700 text-right text-xs">{row.releaseRule}</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-500">Evidence</span><StatusBadge tone={toneForEvidence(row.evidenceStatus)}>{humanise(row.evidenceStatus)}</StatusBadge></div>
        <div className="flex items-center justify-between"><span className="text-slate-500">Dispute</span>{row.hasDispute ? <StatusBadge tone="red">Open</StatusBadge> : <span className="text-xs text-slate-400">None</span>}</div>
      </div>
      <div className="p-5">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Release conditions</p>
        <div className="space-y-1.5 mb-4">
          <Cond met={row.milestoneProgress >= 80} label="Work substantially complete" />
          <Cond met={row.evidenceStatus === "approved"} label="Evidence approved" />
          <Cond met={!row.hasDispute} label="No open disputes" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onAction("release")} disabled={blocked} className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"><Banknote className="w-3.5 h-3.5" /> Release funds</button>
          {blocked && <p className="col-span-2 text-[11px] text-red-500 font-medium text-center">{row.hasDispute ? "Frozen — dispute open" : "Blocked — evidence required"}</p>}
          <ActBtn icon={Ban} label="Hold" onClick={() => onAction("hold")} />
          <ActBtn icon={FileQuestion} label="Evidence" onClick={() => onAction("evidence")} />
          <ActBtn icon={Flag} label="Dispute" onClick={() => onAction("dispute")} tone="red" />
          <Link href={`/app/money/escrow/${row.escrowId}`} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"><ExternalLink className="w-3.5 h-3.5" /> Open</Link>
        </div>
      </div>
    </div>
  )
}
function Cond({ met, label }: { met: boolean; label: string }) {
  return <div className="flex items-center gap-2 text-xs">{met ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}<span className="text-slate-600">{label}</span></div>
}
function ActBtn({ icon: Icon, label, onClick, tone = "slate" }: { icon: typeof Ban; label: string; onClick: () => void; tone?: "slate" | "red" }) {
  return <button onClick={onClick} className={cn("flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold", tone === "red" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 text-slate-700 hover:bg-slate-50")}><Icon className="w-3.5 h-3.5" /> {label}</button>
}
