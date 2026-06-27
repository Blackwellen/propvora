"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  ArrowLeft, Banknote, Ban, FileQuestion, Flag, SplitSquareHorizontal,
  CheckCircle2, Clock,
} from "lucide-react"
import { useEscrowDetail } from "../data/hooks"
import { DetailTabs } from "./DetailTabs"
import { StatusBadge, toneForEscrowState, toneForEvidence, humanise, ConfirmModal } from "./ui"

type Tab = "overview" | "milestones" | "evidence" | "release" | "disputes" | "timeline"
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "milestones", label: "Milestones" },
  { key: "evidence", label: "Evidence" },
  { key: "release", label: "Release" },
  { key: "disputes", label: "Disputes" },
  { key: "timeline", label: "Timeline" },
]

export function OrderEscrowDetailView({ escrowId }: { escrowId: string }) {
  const { escrow, payoutSplits, releaseConditions, activity, milestones, loading } = useEscrowDetail(escrowId)
  const [tab, setTab] = useState<Tab>("overview")
  const [confirm, setConfirm] = useState<null | { kind: string }>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading escrow…</div>
  if (!escrow) return (
    <div className="p-10 text-center text-sm text-slate-400">
      <p className="font-medium text-slate-600 mb-1">Escrow record not found</p>
      <p>This escrow may have been removed or the link may be incorrect.</p>
    </div>
  )

  const evidenceMissing = escrow.evidenceStatus === "missing" || escrow.evidenceStatus === "partial"
  const releaseBlocked = evidenceMissing || escrow.hasDispute

  return (
    <div className="flex flex-col gap-5 px-4 md:px-6 py-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>}

      <Link href="/property-manager/work/orders?tab=escrow" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to escrow
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-xl font-bold text-slate-900">{escrow.escrowId}</h1><StatusBadge tone={toneForEscrowState(escrow.escrowState)}>{humanise(escrow.escrowState)}</StatusBadge></div>
          <p className="text-sm text-slate-500 mt-1">{escrow.orderRef} · {escrow.propertyLabel} · {escrow.supplierName}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <HBtn icon={Ban} label="Hold funds" onClick={() => setConfirm({ kind: "hold" })} />
          <HBtn icon={FileQuestion} label="Request more evidence" onClick={() => setConfirm({ kind: "evidence" })} />
          <HBtn icon={SplitSquareHorizontal} label="Release partially" onClick={() => setConfirm({ kind: "partial" })} />
          <HBtn icon={Flag} label="Raise dispute" tone="red" onClick={() => setConfirm({ kind: "dispute" })} />
          <button onClick={() => setConfirm({ kind: "release" })} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-2 text-sm font-semibold">
            <Banknote className="w-4 h-4" /> Release full amount
          </button>
        </div>
      </div>

      <DetailTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Escrow">
            <KV label="Total held" value={formatPence(escrow.totalHeldPence)} />
            <KV label="Funded" value={formatPence(escrow.fundedAmountPence)} />
            <KV label="Release date" value={escrow.releaseDate ? new Date(escrow.releaseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
            <div className="flex items-center justify-between text-sm mt-1"><span className="text-slate-500">Evidence</span><StatusBadge tone={toneForEvidence(escrow.evidenceStatus)}>{humanise(escrow.evidenceStatus)}</StatusBadge></div>
          </Card>
          <Card title="Payout split">{payoutSplits.map(s => <KV key={s.id} label={s.label} value={formatPence(s.amountPence)} />)}</Card>
          <Card title="Milestone progress">
            <p className="text-2xl font-bold text-slate-900">{escrow.milestoneProgress}%</p>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-2"><div className="h-full bg-[var(--brand)] rounded-full" style={{ width: `${escrow.milestoneProgress}%` }} /></div>
            <p className="text-xs text-slate-500 mt-2">{escrow.milestoneLabel}</p>
          </Card>
        </div>
      )}

      {tab === "milestones" && (
        <Card title="Milestones">
          <div className="space-y-3">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                {m.status === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : m.status === "in_progress" ? <Clock className="w-5 h-5 text-[var(--brand)]" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                <p className="text-sm font-medium text-slate-800 flex-1">{m.label}</p>
                {m.amountPence ? <span className="text-sm font-semibold text-slate-700">{formatPence(m.amountPence)}</span> : null}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "evidence" && (
        <Card title="Submitted evidence">
          {evidenceMissing && escrow.evidenceStatus === "missing" ? (
            <p className="text-sm text-slate-500 py-6 text-center">No evidence submitted yet. <button onClick={() => showToast("Evidence requested")} className="text-[var(--brand)] font-semibold">Request evidence</button></p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="text-slate-600">before-kitchen.jpg</span><StatusBadge tone="emerald">Approved</StatusBadge></div>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-600">during-pipe.jpg</span><StatusBadge tone="amber">Pending</StatusBadge></div>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-600">completion-cert.pdf</span><StatusBadge tone="amber">Pending</StatusBadge></div>
            </div>
          )}
        </Card>
      )}

      {tab === "release" && (
        <Card title="Release conditions">
          <div className="space-y-2 mb-4">
            {releaseConditions.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                {c.met ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                <span className={cn(c.met ? "text-slate-700" : "text-slate-500")}>{c.label}</span>
                {c.required && <span className="text-[10px] text-slate-400">required</span>}
              </div>
            ))}
          </div>
          {releaseBlocked && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 font-medium mb-3">
              {escrow.hasDispute ? "Release frozen — a dispute is open." : "Release blocked — evidence required."}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirm({ kind: "release" })} disabled={releaseBlocked} className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">Release full amount</button>
            <button onClick={() => setConfirm({ kind: "partial" })} className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">Release partially</button>
          </div>
        </Card>
      )}

      {tab === "disputes" && (
        <Card title="Disputes">
          {escrow.hasDispute ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-semibold text-red-700">Open dispute</p><p className="text-xs text-red-600 mt-1">Release is frozen until this dispute is resolved.</p></div>
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No disputes on this escrow. <button onClick={() => setConfirm({ kind: "dispute" })} className="text-red-600 font-semibold">Raise dispute</button></p>
          )}
        </Card>
      )}

      {tab === "timeline" && (
        <Card title="Activity timeline">
          <div className="flex flex-col divide-y divide-slate-100">
            {activity.map(a => (
              <div key={a.id} className="py-2.5 flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] mt-1.5" /><div><p className="text-sm text-slate-700">{a.text}</p><p className="text-xs text-slate-400">{a.actor} · {a.at}</p></div></div>
            ))}
          </div>
        </Card>
      )}

      {confirm && (
        <ConfirmModal
          title={titleFor(confirm.kind)}
          message={msgFor(confirm.kind, escrow.escrowId, escrow.totalHeldPence)}
          confirmLabel={titleFor(confirm.kind)}
          tone={confirm.kind === "release" || confirm.kind === "partial" ? "emerald" : confirm.kind === "dispute" ? "red" : "amber"}
          requireReason={confirm.kind === "partial" || confirm.kind === "hold" || confirm.kind === "dispute"}
          blocked={(confirm.kind === "release") && releaseBlocked}
          blockedMessage={escrow.hasDispute ? "Release is frozen while a dispute is open." : "Release is blocked until evidence has been submitted and approved."}
          onConfirm={() => { setConfirm(null); showToast(`${titleFor(confirm.kind)} — done`) }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function titleFor(k: string) { return { hold: "Hold funds", evidence: "Request more evidence", partial: "Release partially", dispute: "Raise dispute", release: "Release full amount" }[k] ?? "Confirm" }
function msgFor(k: string, id: string, amt: number) {
  if (k === "release") return `Release the full ${formatPence(amt)} held in ${id}.`
  if (k === "partial") return `Release part of the ${formatPence(amt)} held in ${id}. A reason is required.`
  if (k === "hold") return `Hold the funds in ${id}. A reason is required.`
  if (k === "dispute") return `Raise a dispute on ${id}. This freezes release.`
  return `Request more evidence for ${id}.`
}

function HBtn({ icon: Icon, label, onClick, tone = "slate" }: { icon: typeof Banknote; label: string; onClick: () => void; tone?: "slate" | "red" }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold border transition-colors",
      tone === "red" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5"><h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>{children}</div>
}
function KV({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-sm py-0.5"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-800">{value}</span></div>
}
