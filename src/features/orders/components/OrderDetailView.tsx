"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  ArrowLeft, MessageSquare, Image as ImageIcon, Flag, CalendarClock, XCircle,
  Banknote, Star, CheckCircle2, Clock, Paperclip,
} from "lucide-react"
import { useOrderDetail } from "../data/hooks"
import { DetailTabs } from "./DetailTabs"
import { StatusBadge, toneForMilestone, toneForEscrowState, humanise, ConfirmModal } from "./ui"

type Tab = "overview" | "milestones" | "evidence" | "communications" | "escrow" | "notes"
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "milestones", label: "Milestones" },
  { key: "evidence", label: "Evidence" },
  { key: "communications", label: "Communications" },
  { key: "escrow", label: "Escrow" },
  { key: "notes", label: "Notes" },
]

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { order, attachments, activity, milestones, payoutSplits, loading } = useOrderDetail(orderId)
  const [tab, setTab] = useState<Tab>("overview")
  const [confirm, setConfirm] = useState<null | { kind: string }>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading order…</div>
  if (!order) return (
    <div className="p-10 text-center text-sm text-slate-400">
      <p className="font-medium text-slate-600 mb-1">Order not found</p>
      <p>This order may have been removed or the link may be incorrect.</p>
    </div>
  )

  const evidenceMissing = order.evidenceStatus === "missing"

  return (
    <div className="flex flex-col gap-5 px-4 md:px-6 py-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>}

      <Link href="/property-manager/work/orders?tab=active" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{order.orderRef}</h1>
            <StatusBadge tone={toneForMilestone(order.milestoneStatus)}>{humanise(order.milestoneStatus)}</StatusBadge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{order.propertyLabel} · {order.location} · {order.orderType}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <HeaderBtn icon={MessageSquare} label="Message supplier" onClick={() => showToast("Message opened")} />
          <HeaderBtn icon={ImageIcon} label="View evidence" onClick={() => setTab("evidence")} />
          <HeaderBtn icon={CalendarClock} label="Reschedule" onClick={() => setConfirm({ kind: "reschedule" })} />
          <HeaderBtn icon={Flag} label="Raise dispute" tone="red" onClick={() => setConfirm({ kind: "dispute" })} />
          <HeaderBtn icon={XCircle} label="Cancel" tone="red" onClick={() => setConfirm({ kind: "cancel" })} />
          <button onClick={() => setConfirm({ kind: "release" })}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-2 text-sm font-semibold">
            <Banknote className="w-4 h-4" /> Release funds
          </button>
        </div>
      </div>

      <DetailTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Order details">
            <KV label="Scheduled" value={order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
            <KV label="Order type" value={order.orderType} />
            <KV label="SLA" value={humanise(order.slaStatus)} />
            <KV label="Risk" value={humanise(order.risk)} />
          </Card>
          <Card title="Supplier">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">{order.supplierInitials}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{order.supplierName}</p>
                {order.supplierRating && <p className="text-xs text-amber-600 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{order.supplierRating}</p>}
              </div>
            </div>
            <KV label="Phone" value={order.supplierPhone ?? "—"} />
            <KV label="Email" value={order.supplierEmail ?? "—"} />
          </Card>
          <Card title="Escrow breakdown">
            <KV label="Held" value={formatPence(order.escrowAmountPence)} />
            <KV label="Funded" value={formatPence(order.fundedAmountPence)} />
            <div className="flex items-center justify-between text-sm mt-1"><span className="text-slate-500">State</span><StatusBadge tone={toneForEscrowState(order.escrowState ?? "held")}>{humanise(order.escrowState ?? "held")}</StatusBadge></div>
          </Card>
        </div>
      )}

      {tab === "milestones" && (
        <Card title="Milestones">
          <div className="space-y-3">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                {m.status === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : m.status === "in_progress" ? <Clock className="w-5 h-5 text-[var(--brand)]" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                <div className="flex-1"><p className="text-sm font-medium text-slate-800">{m.label}</p>{m.due && <p className="text-xs text-slate-500">Due {new Date(m.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>}</div>
                {m.amountPence ? <span className="text-sm font-semibold text-slate-700">{formatPence(m.amountPence)}</span> : null}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "evidence" && (
        <Card title="Evidence">
          {evidenceMissing ? (
            <div className="flex flex-col items-center py-8 text-center"><ImageIcon className="w-8 h-8 text-slate-200 mb-2" /><p className="text-sm text-slate-500">No evidence submitted yet.</p><button onClick={() => showToast("Evidence requested")} className="mt-3 text-xs font-semibold text-[var(--brand)]">Request evidence</button></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.map(a => (
                <div key={a.id} className="border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0"><p className="text-xs font-medium text-slate-700 truncate">{a.name}</p><p className="text-[11px] text-slate-400">{a.kind} · {a.sizeLabel}</p></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "communications" && (
        <Card title="Communications">
          <div className="flex flex-col divide-y divide-slate-100">
            {activity.filter(a => a.kind === "note" || a.kind === "status").map(a => (
              <div key={a.id} className="py-3 flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="flex-1"><p className="text-sm text-slate-700">{a.text}</p><p className="text-xs text-slate-400">{a.actor} · {a.at}</p></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "escrow" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Payout split">
            {payoutSplits.map(s => <KV key={s.id} label={s.label} value={formatPence(s.amountPence)} />)}
          </Card>
          <Card title="Activity timeline">
            <div className="flex flex-col divide-y divide-slate-100">
              {activity.map(a => (
                <div key={a.id} className="py-2.5 flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] mt-1.5" /><div><p className="text-sm text-slate-700">{a.text}</p><p className="text-xs text-slate-400">{a.actor} · {a.at}</p></div></div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "notes" && (
        <Card title="Notes">
          <textarea rows={5} placeholder="Add an internal note…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none" />
          <button onClick={() => showToast("Note saved")} className="mt-3 px-3.5 py-2 rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white text-sm font-semibold">Save note</button>
        </Card>
      )}

      {confirm && (
        <ConfirmModal
          title={titleFor(confirm.kind)}
          message={msgFor(confirm.kind, order.orderRef, order.escrowAmountPence)}
          confirmLabel={titleFor(confirm.kind)}
          tone={confirm.kind === "release" ? "emerald" : confirm.kind === "cancel" || confirm.kind === "dispute" ? "red" : "blue"}
          requireReason={confirm.kind === "dispute" || confirm.kind === "cancel"}
          blocked={confirm.kind === "release" && evidenceMissing}
          blockedMessage="Release is blocked until evidence has been submitted and approved."
          onConfirm={() => { setConfirm(null); showToast(`${titleFor(confirm.kind)} — done`) }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function titleFor(k: string) { return { reschedule: "Reschedule", dispute: "Raise dispute", cancel: "Cancel order", release: "Release funds" }[k] ?? "Confirm" }
function msgFor(k: string, ref: string, amt: number) {
  if (k === "release") return `Release ${formatPence(amt)} held for ${ref} to the supplier.`
  if (k === "cancel") return `Cancel ${ref}? Escrow will be returned subject to the cancellation policy.`
  if (k === "dispute") return `Raise a dispute on ${ref}. This freezes escrow release until resolved.`
  return `Reschedule ${ref}?`
}

function HeaderBtn({ icon: Icon, label, onClick, tone = "slate" }: { icon: typeof MessageSquare; label: string; onClick: () => void; tone?: "slate" | "red" }) {
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
