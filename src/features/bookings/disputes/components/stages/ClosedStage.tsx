'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Download, RotateCcw, ExternalLink, FileText, Share2, Plus, Star, Check,
} from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { Dispute } from '../../data/types'
import { REASON_LABELS } from '../../data/types'
import WorkflowGuard from '../WorkflowGuard'
import DisputeWorkflowLayout from '../DisputeWorkflowLayout'
import { SectionCard, ConfirmModal, useActionFeedback, FeedbackToast, StubDrawer, fmtDateTime, fmtDate } from '../ui'

export default function ClosedStage({ disputeId }: { disputeId: string }) {
  return (
    <WorkflowGuard disputeId={disputeId}>
      {(d, source) => <ClosedInner dispute={d} source={source} />}
    </WorkflowGuard>
  )
}

function ClosedInner({ dispute, source }: { dispute: Dispute; source: 'live' | 'seed' }) {
  const { msg, fire } = useActionFeedback()
  const [drawer, setDrawer] = useState<string | null>(null)
  const [confirmReopen, setConfirmReopen] = useState(false)

  const p = dispute.proposal
  const released = dispute.total_released_pence ?? p?.payout_to_host_pence ?? 0
  const resolutionTime = dispute.resolved_at
    ? `${Math.max(1, Math.round((new Date(dispute.resolved_at).getTime() - new Date(dispute.opened_at).getTime()) / 86400000))} days`
    : '—'

  return (
    <DisputeWorkflowLayout
      dispute={dispute}
      stage="closed"
      source={source}
      title="Finalisation"
      subtitle="Case closed. Download the evidence bundle, review the final outcome and log any follow-ups."
      rightRail={
        <SectionCard title="Ratings impact">
          <div className="flex items-center gap-2">
            <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
            ))}</div>
            <span className="text-sm text-slate-600">No adverse rating change</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">The outcome was logged to host and {dispute.supplier_name ? 'supplier' : 'guest'} reliability scores.</p>
        </SectionCard>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniCard label="Final outcome" value={(dispute.recommended_outcome ?? 'resolved').replace(/_/g, ' ')} tone="emerald" small />
        <MiniCard label="Total released" value={formatPence(released, dispute.currency)} tone="blue" />
        <MiniCard label="Resolution time" value={resolutionTime} tone="violet" small />
        <MiniCard label="Refund issued" value={formatPence(p?.refund_pence ?? 0, dispute.currency)} tone="amber" />
      </div>

      <SectionCard title="Case summary & final outcome">
        <p className="text-sm text-slate-600">{dispute.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Kv label="Reason" value={REASON_LABELS[dispute.reason]} />
          <Kv label="Closed" value={fmtDate(dispute.resolved_at ?? dispute.updated_at)} />
          <Kv label="Disputed" value={formatPence(dispute.amount_disputed_pence, dispute.currency)} />
          <Kv label="Released" value={formatPence(released, dispute.currency)} />
        </div>
        {p?.rationale && <p className="mt-3 text-sm text-slate-600 border-t border-slate-100 pt-3"><span className="font-medium text-slate-800">Decision: </span>{p.rationale}</p>}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Evidence bundle & documents">
          <ul className="space-y-2">
            {dispute.evidence.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-700 truncate">{e.title}</span>
                <button onClick={() => fire('Downloading…')} className="ml-auto text-xs text-blue-600 hover:text-blue-700">Download</button>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Comms history">
          <ul className="space-y-3">
            {dispute.messages.map((m) => (
              <li key={m.id}>
                <p className="text-xs font-medium text-slate-700">{m.author} <span className="text-slate-400 font-normal">· {fmtDateTime(m.sent_at)}</span></p>
                <p className="text-sm text-slate-600">{m.body}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Follow-up tasks">
        <ul className="space-y-2">
          {['Update host on outcome', 'Log supplier coaching note', 'Reconcile escrow ledger'].map((t, i) => (
            <li key={t} className="flex items-center gap-2.5 text-sm">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                {i === 0 && <Check className="h-3 w-3" />}
              </span>
              <span className="text-slate-700">{t}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => setDrawer('task')} className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
          <Plus className="w-4 h-4" /> Add follow-up task
        </button>
      </SectionCard>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => fire('Preparing case bundle…')} className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-blue-700">
          <Download className="w-4 h-4" /> Download bundle
        </button>
        <button onClick={() => fire('Downloading final decision…')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <FileText className="w-4 h-4" /> Download final decision
        </button>
        <button onClick={() => setDrawer('share')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Share2 className="w-4 h-4" /> Share summary
        </button>
        <Link href={`/property-manager/bookings/${dispute.booking_id}`} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          View linked booking <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button onClick={() => fire('Opening linked order…')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          View linked order <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setConfirmReopen(true)} className="ml-auto inline-flex items-center gap-1.5 border border-amber-200 text-amber-700 rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-amber-50">
          <RotateCcw className="w-4 h-4" /> Reopen case
        </button>
      </div>

      <ConfirmModal
        open={confirmReopen}
        title="Reopen case"
        message={`Reopen ${dispute.reference}? This moves the dispute back to review and notifies both parties. Released funds are not automatically recalled.`}
        confirmLabel="Reopen case"
        tone="primary"
        onConfirm={() => fire('Case reopened')}
        onClose={() => setConfirmReopen(false)}
      />
      <StubDrawer open={drawer === 'task'} title="Add follow-up task" onClose={() => setDrawer(null)}>
        <input placeholder="Task title" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3" />
        <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        <button onClick={() => { fire('Follow-up task added'); setDrawer(null) }} className="mt-3 bg-blue-600 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-blue-700">Add task</button>
      </StubDrawer>
      <StubDrawer open={drawer === 'share'} title="Share case summary" onClose={() => setDrawer(null)}>
        <input placeholder="Recipient email" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3" />
        <button onClick={() => { fire('Summary shared'); setDrawer(null) }} className="mt-1 bg-blue-600 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-blue-700">Share</button>
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
      <p className={`font-bold text-slate-900 mt-2 capitalize ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  )
}
