'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, Pencil, Banknote, ArrowUpRight, BellRing, Download, Lock, Info,
} from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { Dispute } from '../../data/types'
import WorkflowGuard from '../WorkflowGuard'
import DisputeWorkflowLayout from '../DisputeWorkflowLayout'
import { SectionCard, ConfirmModal, useActionFeedback, FeedbackToast, StubDrawer, fmtDate } from '../ui'

export default function ResolutionStage({ disputeId }: { disputeId: string }) {
  return (
    <WorkflowGuard disputeId={disputeId}>
      {(d, source) => <ResolutionInner dispute={d} source={source} />}
    </WorkflowGuard>
  )
}

function ResolutionInner({ dispute, source }: { dispute: Dispute; source: 'live' | 'seed' }) {
  const router = useRouter()
  const base = `/property-manager/bookings/disputes/${dispute.id}`
  const { msg, fire } = useActionFeedback()
  const [drawer, setDrawer] = useState<string | null>(null)
  const [confirmRelease, setConfirmRelease] = useState(false)
  const [confirmEscalate, setConfirmEscalate] = useState(false)

  const p = dispute.proposal
  // Local acceptance/approval state so the gate is interactive.
  const [hostAccepted, setHostAccepted] = useState(p?.accepted_by_host ?? false)
  const [counterAccepted, setCounterAccepted] = useState(p?.accepted_by_counterparty ?? false)
  const [managerApproved, setManagerApproved] = useState(p?.manager_approved ?? false)
  const [released, setReleased] = useState(dispute.stage === 'closed')

  // ── GATE: funds may only be released when BOTH parties accept AND a
  // manager approval is on record (and not already released).
  const canRelease = hostAccepted && counterAccepted && managerApproved && !released

  if (!p) {
    return (
      <DisputeWorkflowLayout dispute={dispute} stage="resolution" source={source} title="Resolution" subtitle="No proposal yet.">
        <SectionCard title="No resolution proposed">
          <p className="text-sm text-slate-500">Return to review to record a recommended outcome before proposing a settlement.</p>
          <button onClick={() => router.push(`${base}/review`)} className="mt-3 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Back to review</button>
        </SectionCard>
      </DisputeWorkflowLayout>
    )
  }

  return (
    <DisputeWorkflowLayout
      dispute={dispute}
      stage="resolution"
      source={source}
      title="Resolution"
      subtitle="Confirm the settlement, capture acceptances and release escrowed funds."
      rightRail={
        <SectionCard title="Acceptance status">
          <ul className="space-y-2.5">
            <AcceptRow label="Host accepted" checked={hostAccepted} onToggle={() => setHostAccepted((v) => !v)} />
            <AcceptRow label={`${dispute.supplier_name ? 'Supplier' : 'Guest'} accepted`} checked={counterAccepted} onToggle={() => setCounterAccepted((v) => !v)} />
            <AcceptRow label="Manager approval" checked={managerApproved} onToggle={() => setManagerApproved((v) => !v)} />
          </ul>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">Funds can only be released once both parties have accepted and a manager has approved.</p>
          </div>
        </SectionCard>
      }
    >
      {/* cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniCard label="Proposed payout" value={formatPence(p.payout_to_host_pence, dispute.currency)} tone="blue" />
        <MiniCard label="Refund amount" value={formatPence(p.refund_pence, dispute.currency)} tone="emerald" />
        <MiniCard label="Resolution SLA" value={fmtDate(p.sla_due)} tone="amber" small />
        <MiniCard label="Escrow release" value={formatPence(dispute.escrow_held_pence, dispute.currency)} tone="violet" />
      </div>

      <SectionCard title="Settlement summary">
        <p className="text-sm text-slate-600">{p.rationale}</p>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Payout breakdown & escrow allocation">
          <ul className="space-y-2">
            {p.allocations.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{a.label} <span className="text-xs text-slate-400 capitalize">→ {a.to}</span></span>
                <span className="font-medium text-slate-900">{formatPence(a.pence, dispute.currency)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between text-sm border-t border-slate-100 pt-2 font-semibold">
              <span>Total escrow held</span>
              <span>{formatPence(dispute.escrow_held_pence, dispute.currency)}</span>
            </li>
          </ul>
        </SectionCard>
        <SectionCard title="Release schedule">
          <ul className="space-y-2">
            {p.release_schedule.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-slate-700">{r.label}</p>
                  <p className="text-[11px] text-slate-400">{fmtDate(r.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">{formatPence(r.pence, dispute.currency)}</p>
                  <span className={`text-[11px] capitalize ${r.status === 'released' ? 'text-emerald-600' : r.status === 'scheduled' ? 'text-[var(--brand)]' : 'text-slate-400'}`}>{r.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Decision rationale & attachments">
        <textarea rows={3} defaultValue={p.rationale} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        <label className="mt-3 inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
          <Download className="w-4 h-4 rotate-180" /> Attach document
          <input type="file" className="hidden" onChange={() => fire('Attachment added')} />
        </label>
      </SectionCard>

      {/* actions — Release funds is GATED */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { setHostAccepted(true); setCounterAccepted(true); fire('Resolution accepted by parties') }} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Check className="w-4 h-4" /> Accept resolution
        </button>
        <button onClick={() => setDrawer('amend')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Pencil className="w-4 h-4" /> Amend proposal
        </button>

        <button
          onClick={() => canRelease && setConfirmRelease(true)}
          disabled={!canRelease}
          title={canRelease ? 'Release escrowed funds' : 'Requires both acceptances and manager approval'}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
            canRelease
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {canRelease ? <Banknote className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {released ? 'Funds released' : 'Release funds'}
        </button>

        <button onClick={() => setConfirmEscalate(true)} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50">
          <ArrowUpRight className="w-4 h-4" /> Escalate
        </button>
        <button onClick={() => fire('Parties notified')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <BellRing className="w-4 h-4" /> Notify parties
        </button>
        <button onClick={() => fire('Exporting case file…')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Download className="w-4 h-4" /> Export case
        </button>
      </div>

      {!canRelease && !released && (
        <p className="text-xs text-amber-700 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Release funds is locked until both parties accept and a manager approves (toggle in Acceptance status).
        </p>
      )}

      <ConfirmModal
        open={confirmRelease}
        title="Release escrowed funds"
        message={`Release ${formatPence(dispute.escrow_held_pence, dispute.currency)} from escrow per the agreed settlement? This pays out the allocations and cannot be reversed.`}
        confirmLabel="Release funds"
        tone="danger"
        onConfirm={() => { setReleased(true); fire('Funds released'); router.push(`${base}/closed`) }}
        onClose={() => setConfirmRelease(false)}
      />
      <ConfirmModal
        open={confirmEscalate}
        title="Escalate dispute"
        message={`Escalate ${dispute.reference} to a senior adjudicator? The current proposal is paused pending senior review.`}
        confirmLabel="Escalate"
        tone="primary"
        onConfirm={() => fire('Dispute escalated')}
        onClose={() => setConfirmEscalate(false)}
      />
      <StubDrawer open={drawer === 'amend'} title="Amend proposal" onClose={() => setDrawer(null)}>
        <label className="block text-xs font-medium text-slate-600 mb-1">Refund amount (major units)</label>
        <input defaultValue={(p.refund_pence / 100).toFixed(2)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3" />
        <label className="block text-xs font-medium text-slate-600 mb-1">Rationale</label>
        <textarea rows={4} defaultValue={p.rationale} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        <button onClick={() => { fire('Proposal amended — re-acceptance required'); setHostAccepted(false); setCounterAccepted(false); setDrawer(null) }} className="mt-3 bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-[var(--brand-strong)]">Save amendment</button>
      </StubDrawer>
      <FeedbackToast msg={msg} />
    </DisputeWorkflowLayout>
  )
}

function AcceptRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <li>
      <button onClick={onToggle} className="flex items-center gap-2.5 text-sm w-full text-left">
        <span className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors ${checked ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
          {checked && <Check className="h-3 w-3" />}
        </span>
        <span className={checked ? 'text-slate-700' : 'text-slate-500'}>{label}</span>
      </button>
    </li>
  )
}

const TONES: Record<string, string> = {
  blue: 'text-[var(--brand)] bg-[var(--brand-soft)]',
  amber: 'text-amber-700 bg-amber-50',
  violet: 'text-violet-700 bg-violet-50',
  emerald: 'text-emerald-700 bg-emerald-50',
}
function MiniCard({ label, value, tone, small }: { label: string; value: string; tone: string; small?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${TONES[tone]}`}>{label}</span>
      <p className={`font-bold text-slate-900 mt-2 ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  )
}
