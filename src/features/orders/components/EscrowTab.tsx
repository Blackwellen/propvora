"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  ShieldCheck, Clock, ImageOff, AlertTriangle, ChevronDown, ChevronRight,
  Banknote, Ban, Flag, FileQuestion, ExternalLink, CheckCircle2,
} from "lucide-react"
import { useOrderEscrows, useOrderEscrowKpis } from "../data/hooks"
import { KpiCard, StatusBadge, toneForEvidence, toneForEscrowState, humanise, ConfirmModal, PagerFooter, SourcePill } from "./ui"
import type { EscrowRow } from "../data/types"

function evidenceOk(e: EscrowRow) { return e.evidenceStatus === "submitted" || e.evidenceStatus === "approved" }
function daysUntil(d: string | null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
}

export function EscrowTab() {
  const { data: escrows, loading, source } = useOrderEscrows()
  const kpis = useOrderEscrowKpis(escrows)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<null | { kind: string; row: EscrowRow }>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={ShieldCheck} iconBg="bg-blue-50" iconColor="text-blue-600" value={formatPence(kpis.fundsHeldPence)} label="Funds held" />
        <KpiCard icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" value={kpis.releasingSoon} label="Releasing soon" sub="Next 3 days" subColor="text-amber-600" />
        <KpiCard icon={ImageOff} iconBg="bg-violet-50" iconColor="text-violet-600" value={kpis.evidencePending} label="Evidence pending" />
        <KpiCard icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" value={kpis.atRisk} label="Escrow at risk" sub={kpis.atRisk > 0 ? "Disputed" : "All clear"} subColor={kpis.atRisk > 0 ? "text-red-500" : "text-emerald-600"} />
      </div>

      <div className="flex justify-end"><SourcePill source={source} /></div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold w-8"></th>
                <th className="px-4 py-3 font-semibold">Escrow ID</th>
                <th className="px-4 py-3 font-semibold">Order ref</th>
                <th className="px-4 py-3 font-semibold">Property</th>
                <th className="px-4 py-3 font-semibold">Supplier</th>
                <th className="px-4 py-3 font-semibold">Total held</th>
                <th className="px-4 py-3 font-semibold">Funded</th>
                <th className="px-4 py-3 font-semibold">Release</th>
                <th className="px-4 py-3 font-semibold">Milestone</th>
                <th className="px-4 py-3 font-semibold">Evidence</th>
                <th className="px-4 py-3 font-semibold">Dispute</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={12} className="px-4 py-4"><div className="h-5 bg-slate-50 rounded animate-pulse" /></td></tr>)
              ) : escrows.map(e => {
                const isOpen = expanded === e.id
                const blocked = !evidenceOk(e)
                const dleft = daysUntil(e.releaseDate)
                return (
                  <React.Fragment key={e.id}>
                    <tr className={cn("border-b border-slate-50 hover:bg-slate-50", isOpen && "bg-blue-50/30")}>
                      <td className="px-4 py-3">
                        <button aria-label="Expand" onClick={() => setExpanded(isOpen ? null : e.id)} className="text-slate-400 hover:text-slate-600">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{e.escrowId}</td>
                      <td className="px-4 py-3 text-slate-600">{e.orderRef}</td>
                      <td className="px-4 py-3 text-slate-600">{e.propertyLabel}</td>
                      <td className="px-4 py-3 text-slate-600">{e.supplierName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatPence(e.totalHeldPence)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatPence(e.fundedAmountPence)}</td>
                      <td className="px-4 py-3 text-slate-600">{e.releaseDate ? new Date(e.releaseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}</td>
                      <td className="px-4 py-3"><StatusBadge tone={toneForEscrowState(e.escrowState)}>{humanise(e.escrowState)}</StatusBadge></td>
                      <td className="px-4 py-3"><StatusBadge tone={toneForEvidence(e.evidenceStatus)}>{humanise(e.evidenceStatus)}</StatusBadge></td>
                      <td className="px-4 py-3">{e.hasDispute ? <StatusBadge tone="red">Open</StatusBadge> : <span className="text-xs text-slate-400">None</span>}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setConfirm({ kind: "release", row: e })}
                          className={cn("text-xs font-semibold inline-flex items-center gap-1", blocked || e.hasDispute ? "text-slate-300 cursor-not-allowed" : "text-emerald-600 hover:text-emerald-700")}>
                          <Banknote className="w-3.5 h-3.5" /> Release
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={12} className="px-6 py-5">
                          <EscrowExpanded row={e} blocked={blocked} onAction={kind => setConfirm({ kind, row: e })} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <PagerFooter shown={escrows.length} total={escrows.length} />
      </div>

      {confirm && (
        <ConfirmModal
          title={titleFor(confirm.kind)}
          message={messageFor(confirm.kind, confirm.row)}
          confirmLabel={titleFor(confirm.kind)}
          tone={confirm.kind === "release" ? "emerald" : confirm.kind === "hold" || confirm.kind === "issue" ? "amber" : "blue"}
          requireReason={confirm.kind === "hold" || confirm.kind === "issue"}
          blocked={confirm.kind === "release" && (!evidenceOk(confirm.row) || confirm.row.hasDispute)}
          blockedMessage={confirm.row.hasDispute ? "Release is frozen while a dispute is open." : "Release is blocked until evidence has been submitted and approved."}
          onConfirm={() => { setConfirm(null); showToast(`${titleFor(confirm.kind)} — done`) }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function titleFor(k: string) {
  return { release: "Release funds", hold: "Reject / hold release", issue: "Raise issue", evidence: "Request evidence", viewEvidence: "View all evidence" }[k] ?? "Confirm"
}
function messageFor(k: string, e: EscrowRow) {
  if (k === "release") return `Release ${formatPence(e.totalHeldPence)} held for ${e.orderRef} to ${e.supplierName}.`
  if (k === "hold") return `Hold the release for ${e.escrowId}. Funds remain in escrow.`
  if (k === "issue") return `Raise an issue against ${e.escrowId}. This may freeze the release.`
  return `Request evidence from ${e.supplierName} for ${e.orderRef}.`
}

function EscrowExpanded({ row, blocked, onAction }: { row: EscrowRow; blocked: boolean; onAction: (k: string) => void }) {
  const dleft = daysUntil(row.releaseDate)
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {/* Countdown + progress */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Release countdown</p>
        <p className="text-2xl font-bold text-slate-900">{dleft != null ? `${Math.max(dleft, 0)}d` : "—"}</p>
        <p className="text-xs text-slate-500">{row.releaseDate ? new Date(row.releaseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No date set"}</p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Milestone</span><span className="font-semibold text-slate-700">{row.milestoneProgress}%</span></div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.milestoneProgress}%` }} /></div>
        </div>
      </div>

      {/* Payout split */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Payout split</p>
        <p className="text-[11px] text-slate-400">Payout breakdown is generated on release. Confirm milestones and evidence to unlock.</p>
      </div>

      {/* Release conditions */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Release conditions</p>
        <p className="text-[11px] text-slate-400">Release conditions are set per escrow agreement and appear once the order is accepted by the supplier.</p>
      </div>

      {/* Actions */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Actions</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => onAction("release")} disabled={blocked || row.hasDispute}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50">
            <Banknote className="w-3.5 h-3.5" /> Release funds
          </button>
          {blocked && <p className="text-[11px] text-red-500 font-medium">Blocked: evidence required</p>}
          <button onClick={() => onAction("hold")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white"><Ban className="w-3.5 h-3.5" /> Reject / hold</button>
          <button onClick={() => onAction("issue")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white"><Flag className="w-3.5 h-3.5" /> Raise issue</button>
          <button onClick={() => onAction("evidence")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white"><FileQuestion className="w-3.5 h-3.5" /> Request evidence</button>
          <Link href={`/property-manager/work/orders/escrow/${row.escrowId}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"><ExternalLink className="w-3.5 h-3.5" /> View all evidence</Link>
        </div>
      </div>
    </div>
  )
}
