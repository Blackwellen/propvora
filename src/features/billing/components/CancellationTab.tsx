"use client"

import React, { useState } from "react"
import { ShieldX, Clock, Database, Gift, PauseCircle, LifeBuoy, CheckCircle2 } from "lucide-react"
import { useSubscription, useBillingRole } from "../data/hooks"
import { SEED_CANCELLATION_REASONS } from "../data/seed"
import { formatBillingDate } from "../data/calc"
import { useCancellationState } from "../data/cancellation-context"
import { BillingCard, Row, StatusBadge, BillingButton, PermissionNotice } from "./ui"
import ConfirmDialog from "@/components/account/ConfirmDialog"

export function CancellationTab() {
  const { data: sub } = useSubscription()
  const { canManageBilling } = useBillingRole()
  const { view, schedule, keep, claimRetention, retentionClaimed } = useCancellationState()

  const [started, setStarted] = useState(false)
  const [reason, setReason] = useState("")
  const [detail, setDetail] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [paused, setPaused] = useState(false)

  const accessUntil = sub.currentPeriodEnd
  const hasLiveSub = sub.id !== ""

  function confirmCancellation() {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setConfirmOpen(false)
      schedule({ reason, detail })
    }, 400)
  }

  if (view.scheduled) {
    return (
      <div className="space-y-6">
        <BillingCard title="Cancellation scheduled" icon={ShieldX}>
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 mb-4">
            <p className="text-[13px] text-amber-800 font-medium">Your subscription is scheduled to end at the end of your current term.</p>
            <p className="text-[12px] text-amber-700 mt-1">No data has been deleted. You keep full access until then.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <Row label="Status" value={<StatusBadge tone="amber">Scheduled</StatusBadge>} />
            <Row label="Access until" value={formatBillingDate(view.accessUntil)} />
            <Row label="Ends" value={formatBillingDate(view.effectiveAt)} />
            <Row label="Data retention" value={`${view.dataRetentionDays} days after end`} />
          </div>
          {!view.persisted && (
            <p className="text-[11.5px] text-slate-400 mt-3">This cancellation is recorded for this session. It is confirmed against Stripe once your subscription is connected.</p>
          )}
          <BillingButton variant="primary" className="mt-4" disabled={!canManageBilling} onClick={keep}>Keep my subscription</BillingButton>
        </BillingCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PermissionNotice canManage={canManageBilling} />

      <BillingCard title="Cancellation summary" icon={ShieldX} description="What happens if you cancel today.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 px-3.5 py-3">
            <Clock className="w-4 h-4 text-slate-500 mb-1.5" />
            <p className="text-[12px] text-slate-500">Ends</p>
            <p className="text-[13px] font-semibold text-slate-800">End of current term</p>
            <p className="text-[11.5px] text-slate-400">{formatBillingDate(accessUntil)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3.5 py-3">
            <CheckCircle2 className="w-4 h-4 text-slate-500 mb-1.5" />
            <p className="text-[12px] text-slate-500">Access until</p>
            <p className="text-[13px] font-semibold text-slate-800">{formatBillingDate(accessUntil)}</p>
            <p className="text-[11.5px] text-slate-400">Full access continues</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3.5 py-3">
            <Database className="w-4 h-4 text-slate-500 mb-1.5" />
            <p className="text-[12px] text-slate-500">Data retention</p>
            <p className="text-[13px] font-semibold text-slate-800">90 days</p>
            <p className="text-[11.5px] text-slate-400">Reactivate any time within</p>
          </div>
        </div>
      </BillingCard>

      {retentionClaimed ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-emerald-800 font-medium">
            {hasLiveSub
              ? "Thanks for staying. We have noted your retention offer; two months credit will be applied at your next annual renewal."
              : "Thanks for your interest. The 2-months-free retention credit applies to an active annual subscription and will be honoured once your plan is live."}
          </p>
        </div>
      ) : (
        <BillingCard title="Before you go" icon={Gift} description="A couple of options that might suit you better.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[13px] font-bold text-emerald-800">Enjoy 2 months free</p>
              <p className="text-[12px] text-emerald-700 mt-0.5">Stay on annual billing and we will credit two months at your next renewal.</p>
              <BillingButton variant="secondary" className="mt-3 border-emerald-600 text-emerald-700 hover:bg-emerald-100" disabled={!canManageBilling} onClick={claimRetention}>Claim retention offer</BillingButton>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5"><PauseCircle className="w-4 h-4 text-blue-600" /> Pause instead</p>
              <p className="text-[12px] text-slate-500 mt-0.5">Prefer a break? Email us to pause billing for up to 3 months and keep your data.</p>
              <BillingButton variant="ghost" className="mt-3" disabled={!canManageBilling} href="mailto:billing@propvora.com?subject=Pause%20my%20subscription" onClick={() => setPaused(true)}>Request a pause</BillingButton>
            </div>
          </div>
          {paused && (
            <p className="mt-3 text-[12px] text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">Your pause request email is ready. Our billing team will set up the pause window and confirm by email.</p>
          )}
        </BillingCard>
      )}

      <BillingCard title="Cancel subscription" icon={ShieldX}>
        {!started ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <BillingButton variant="danger" disabled={!canManageBilling} onClick={() => setStarted(true)}>Start cancellation</BillingButton>
            <BillingButton variant="ghost" icon={LifeBuoy} href="mailto:support@propvora.com?subject=Cancellation%20help">Contact support</BillingButton>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Reason for cancelling</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-slate-200 text-[13px] px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30">
                <option value="">Select a reason</option>
                {SEED_CANCELLATION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Anything else? (optional)</label>
              <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 text-[13px] px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30" placeholder="Tell us how we could have done better" />
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-[12px] text-amber-700">
              Cancelling schedules your plan to end on {formatBillingDate(accessUntil)}. Your data is retained for 90 days and nothing is deleted today.
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <BillingButton variant="danger" disabled={!canManageBilling || !reason} onClick={() => setConfirmOpen(true)}>Confirm cancellation</BillingButton>
              <BillingButton variant="ghost" onClick={() => setStarted(false)}>Keep my plan</BillingButton>
            </div>
          </div>
        )}
      </BillingCard>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm cancellation"
        description={`Your subscription will be scheduled to end on ${formatBillingDate(accessUntil)}. You keep full access until then and your data is retained for 90 days. This does not delete anything now.`}
        confirmLabel="Schedule cancellation"
        cancelLabel="Go back"
        tone="danger"
        busy={busy}
        onConfirm={confirmCancellation}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
