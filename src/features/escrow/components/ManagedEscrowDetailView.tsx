"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  ArrowLeft, Banknote, Ban, FileQuestion, Flag, CheckCircle2, Clock, Paperclip,
} from "lucide-react"
import { useManagedEscrowDetail } from "../data/hooks"
import {
  StatusBadge, toneForEscrowState, toneForEvidence, humanise, ConfirmModal,
} from "@/features/orders/components/ui"
import { DetailTabs } from "@/features/orders/components/DetailTabs"

type View = "overview" | "evidence" | "release" | "dispute"
const TABS: { key: View; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "evidence", label: "Evidence" },
  { key: "release", label: "Release" },
  { key: "dispute", label: "Disputes" },
]

export function ManagedEscrowDetailView({ escrowId, initialView = "overview" }: { escrowId: string; initialView?: View }) {
  const { escrow, evidence, milestones, conditions, timeline, splits, loading } = useManagedEscrowDetail(escrowId)
  const [view, setView] = useState<View>(initialView)
  const [confirm, setConfirm] = useState<null | { kind: string }>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading escrow…</div>
  if (!escrow) return (
    <div className="p-10 text-center">
      <Banknote className="w-8 h-8 text-slate-200 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-600 mb-1">Escrow not found</p>
      <p className="text-[12.5px] text-slate-400 mb-4">This escrow may have been removed or the link may be incorrect.</p>
      <Link href="/property-manager/money/escrow" className="text-[12.5px] text-[#2563EB] hover:underline">← Back to escrow</Link>
    </div>
  )

  const releaseBlocked = escrow.evidenceStatus === "missing" || escrow.evidenceStatus === "partial" || escrow.hasDispute

  return (
    <div className="flex flex-col gap-5 px-4 md:px-6 py-5 bg-slate-50 min-h-screen">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>}

      <Link href="/property-manager/money/escrow" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to escrow
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-xl font-bold text-slate-900">{escrow.escrowId}</h1><StatusBadge tone={toneForEscrowState(escrow.stage)}>{humanise(escrow.stage)}</StatusBadge></div>
          <p className="text-sm text-slate-500 mt-1">{escrow.reference} · {escrow.propertyLabel} · {escrow.counterparty}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <HBtn icon={Ban} label="Hold funds" onClick={() => setConfirm({ kind: "hold" })} />
          <HBtn icon={FileQuestion} label="Request evidence" onClick={() => setConfirm({ kind: "evidence" })} />
          <HBtn icon={Flag} label="Raise dispute" tone="red" onClick={() => setConfirm({ kind: "dispute" })} />
          <button onClick={() => setConfirm({ kind: "release" })} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-2 text-sm font-semibold"><Banknote className="w-4 h-4" /> Release funds</button>
        </div>
      </div>

      <DetailTabs tabs={TABS} active={view} onChange={setView} />

      {view === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Escrow details">
            <KV label="Total held" value={formatPence(escrow.amountHeldPence)} />
            <KV label="Funded" value={formatPence(escrow.fundedAmountPence)} />
            <KV label="Release rule" value={escrow.releaseRule} />
            <KV label="Release date" value={escrow.releaseDate ? new Date(escrow.releaseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
          </Card>
          <Card title="Payout split">{splits.map(s => <KV key={s.id} label={s.label} value={formatPence(s.amountPence)} />)}</Card>
          <Card title="Milestone checklist">
            <div className="space-y-2">
              {milestones.map(m => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  {m.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-slate-300" />}
                  <span className={cn(m.done ? "text-slate-700" : "text-slate-500")}>{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="lg:col-span-3">
            <Card title="Timeline">
              <div className="flex flex-col divide-y divide-slate-100">
                {timeline.map(t => (
                  <div key={t.id} className="py-2.5 flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" /><div><p className="text-sm text-slate-700">{t.fromState ? `${humanise(t.fromState)} → ` : ""}{humanise(t.toState)}{t.reason ? ` — ${t.reason}` : ""}</p><p className="text-xs text-slate-400">{t.actor} · {t.at}</p></div></div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {view === "evidence" && (
        <Card title="Evidence">
          {escrow.evidenceStatus === "missing" ? (
            <p className="text-sm text-slate-500 py-6 text-center">No evidence submitted yet. <button onClick={() => showToast("Evidence requested")} className="text-[#2563EB] font-semibold">Request evidence</button></p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {evidence.map(ev => (
                <div key={ev.id} className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-slate-400" /><p className="text-xs font-medium text-slate-700 truncate">{ev.name}</p></div>
                  <div className="flex items-center justify-between mt-2"><StatusBadge tone="slate">{ev.phase}</StatusBadge>{ev.approved ? <StatusBadge tone="emerald">Approved</StatusBadge> : <StatusBadge tone="amber">Pending</StatusBadge>}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {view === "release" && (
        <Card title="Release conditions">
          <div className="space-y-2 mb-4">
            {conditions.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                {c.met ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                <span className={cn(c.met ? "text-slate-700" : "text-slate-500")}>{c.label}</span>
                {c.required && <span className="text-[10px] text-slate-400">required</span>}
              </div>
            ))}
          </div>
          {releaseBlocked && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 font-medium mb-3">
              {escrow.hasDispute ? "Release frozen — a dispute is open." : "Release blocked — evidence must be submitted and approved first."}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirm({ kind: "release" })} disabled={releaseBlocked} className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">Release full amount</button>
            <button onClick={() => setConfirm({ kind: "partial" })} className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">Release partially</button>
          </div>
        </Card>
      )}

      {view === "dispute" && (
        <Card title="Disputes">
          {escrow.hasDispute ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-semibold text-red-700">Open dispute</p><p className="text-xs text-red-600 mt-1">Release is frozen until resolved.</p></div>
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No disputes on this escrow. <button onClick={() => setConfirm({ kind: "dispute" })} className="text-red-600 font-semibold">Raise dispute</button></p>
          )}
        </Card>
      )}

      {confirm && (
        <ConfirmModal
          title={titleFor(confirm.kind)}
          message={msgFor(confirm.kind, escrow.escrowId, escrow.amountHeldPence)}
          confirmLabel={titleFor(confirm.kind)}
          tone={confirm.kind === "release" || confirm.kind === "partial" ? "emerald" : confirm.kind === "dispute" ? "red" : "amber"}
          requireReason={confirm.kind === "partial" || confirm.kind === "hold" || confirm.kind === "dispute"}
          blocked={confirm.kind === "release" && releaseBlocked}
          blockedMessage={escrow.hasDispute ? "Release is frozen while a dispute is open." : "Release is blocked until evidence has been submitted and approved."}
          onConfirm={() => { setConfirm(null); showToast(`${titleFor(confirm.kind)} — done`) }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function titleFor(k: string) { return { hold: "Hold funds", evidence: "Request evidence", dispute: "Raise dispute", release: "Release funds", partial: "Release partially" }[k] ?? "Confirm" }
function msgFor(k: string, id: string, amt: number) {
  if (k === "release") return `Release the full ${formatPence(amt)} held in ${id}.`
  if (k === "partial") return `Release part of the ${formatPence(amt)} held in ${id}. A reason is required.`
  if (k === "hold") return `Hold the funds in ${id}. A reason is required.`
  if (k === "dispute") return `Raise a dispute on ${id}. This freezes release.`
  return `Request evidence for ${id}.`
}

function HBtn({ icon: Icon, label, onClick, tone = "slate" }: { icon: typeof Banknote; label: string; onClick: () => void; tone?: "slate" | "red" }) {
  return <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold border", tone === "red" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}><Icon className="w-4 h-4" /> {label}</button>
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5"><h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>{children}</div>
}
function KV({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-sm py-0.5"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-800 text-right">{value}</span></div>
}
