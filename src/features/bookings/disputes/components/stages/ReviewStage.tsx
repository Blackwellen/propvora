'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, MessageSquare, ArrowRight, Calculator, Check, AlertTriangle,
} from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { Dispute, ResolutionOutcome } from '../../data/types'
import { REASON_LABELS } from '../../data/types'
import WorkflowGuard from '../WorkflowGuard'
import DisputeWorkflowLayout from '../DisputeWorkflowLayout'
import { SectionCard, fmtDateTime, useActionFeedback, FeedbackToast, StubDrawer } from '../ui'

const OUTCOME_LABELS: Record<ResolutionOutcome, string> = {
  full_refund: 'Full refund to guest',
  partial_refund: 'Partial refund',
  no_refund: 'No refund',
  split: 'Split settlement',
  release_to_host: 'Release to host',
  pending: 'Pending decision',
}

export default function ReviewStage({ disputeId }: { disputeId: string }) {
  return (
    <WorkflowGuard disputeId={disputeId}>
      {(d, source) => <ReviewInner dispute={d} source={source} />}
    </WorkflowGuard>
  )
}

function ReviewInner({ dispute, source }: { dispute: Dispute; source: 'live' | 'seed' }) {
  const router = useRouter()
  const base = `/property-manager/bookings/disputes/${dispute.id}`
  const { msg, fire } = useActionFeedback()
  const [drawer, setDrawer] = useState<string | null>(null)
  const evidenceComplete = dispute.evidence.length >= 4
  const outcome = dispute.recommended_outcome ?? 'pending'

  return (
    <DisputeWorkflowLayout
      dispute={dispute}
      stage="review"
      source={source}
      title="Review"
      subtitle="Assess the evidence against policy and record a recommended outcome before resolution."
      rightRail={
        <>
          <SectionCard title="Risk flags">
            {(dispute.risk_flags?.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">No risk flags raised.</p>
            ) : (
              <ul className="space-y-2">
                {dispute.risk_flags!.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          <SectionCard title="Comms log">
            <ul className="space-y-3">
              {dispute.messages.map((m) => (
                <li key={m.id}>
                  <p className="text-xs font-medium text-slate-700">{m.author} <span className="text-slate-400 font-normal">· {m.author_role}</span></p>
                  <p className="text-sm text-slate-600">{m.body}</p>
                  <p className="text-[11px] text-slate-400">{fmtDateTime(m.sent_at)}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      }
    >
      {/* cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniCard label="In review" value="Yes" tone="violet" />
        <MiniCard label="Evidence complete" value={evidenceComplete ? 'Complete' : 'Pending'} tone={evidenceComplete ? 'emerald' : 'amber'} />
        <MiniCard label="Recommended outcome" value={OUTCOME_LABELS[outcome]} tone="blue" small />
        <MiniCard label="Escrow held" value={formatPence(dispute.escrow_held_pence, dispute.currency)} tone="emerald" />
      </div>

      <SectionCard title="Case summary">
        <p className="text-sm text-slate-600">{dispute.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Kv label="Reason" value={REASON_LABELS[dispute.reason]} />
          <Kv label="Claimant" value={dispute.claimant_side} />
          <Kv label="Disputed" value={formatPence(dispute.amount_disputed_pence, dispute.currency)} />
          <Kv label="Requested refund" value={formatPence(dispute.requested_refund_pence, dispute.currency)} />
        </div>
      </SectionCard>

      <SectionCard title="Evidence checklist">
        <ul className="space-y-2">
          {dispute.evidence.map((e) => (
            <li key={e.id} className="flex items-center gap-2.5 text-sm">
              <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="h-3 w-3" /></span>
              <span className="text-slate-700">{e.title}</span>
              <span className="text-xs text-slate-400 ml-auto">{e.side === 'host' ? 'Host' : 'Counterparty'}</span>
            </li>
          ))}
          {dispute.evidence.length === 0 && <li className="text-sm text-slate-400">No evidence on file.</li>}
        </ul>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Recommended outcome & findings">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Recommended outcome</label>
          <select defaultValue={outcome} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3">
            {Object.entries(OUTCOME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Findings</label>
          <textarea rows={4} defaultValue={dispute.proposal?.rationale ?? ''} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Summarise your assessment…" />
        </SectionCard>
        <SectionCard title="Policy references & adjudicator notes">
          <ul className="space-y-2 mb-3">
            {dispute.policy_refs.map((p) => (
              <li key={p.id} className="text-sm">
                <span className="font-medium text-slate-800">{p.code}</span> — <span className="text-slate-600">{p.title}</span>
                {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
              </li>
            ))}
          </ul>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Adjudicator notes</label>
          <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Internal notes (not shared with parties)…" />
        </SectionCard>
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => fire('Review notes saved')} className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-blue-700">
          <Save className="w-4 h-4" /> Save review notes
        </button>
        <button onClick={() => setDrawer('clarify')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <MessageSquare className="w-4 h-4" /> Request clarification
        </button>
        <button onClick={() => setDrawer('calc')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Calculator className="w-4 h-4" /> View calculation
        </button>
        <button onClick={() => router.push(`${base}/resolution`)} className="ml-auto inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-slate-800">
          Send to resolution <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <StubDrawer open={drawer === 'clarify'} title="Request clarification" onClose={() => setDrawer(null)}>
        <textarea rows={4} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="What clarification do you need?" />
        <button onClick={() => { fire('Clarification requested'); setDrawer(null) }} className="mt-3 bg-blue-600 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-blue-700">Send request</button>
      </StubDrawer>
      <StubDrawer open={drawer === 'calc'} title="Settlement calculation" onClose={() => setDrawer(null)}>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between"><span className="text-slate-500">Disputed amount</span><span>{formatPence(dispute.amount_disputed_pence, dispute.currency)}</span></li>
          <li className="flex justify-between"><span className="text-slate-500">Escrow held</span><span>{formatPence(dispute.escrow_held_pence, dispute.currency)}</span></li>
          <li className="flex justify-between"><span className="text-slate-500">Proposed refund</span><span>{formatPence(dispute.proposal?.refund_pence ?? 0, dispute.currency)}</span></li>
          <li className="flex justify-between font-semibold border-t border-slate-100 pt-2"><span>Released to host</span><span>{formatPence(dispute.proposal?.payout_to_host_pence ?? 0, dispute.currency)}</span></li>
        </ul>
      </StubDrawer>
      <FeedbackToast msg={msg} />
    </DisputeWorkflowLayout>
  )
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">{value}</p>
    </div>
  )
}

const TONES: Record<string, string> = {
  blue: 'text-blue-700 bg-blue-50',
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
