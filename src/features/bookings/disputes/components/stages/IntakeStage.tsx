'use client'

import { useRouter } from 'next/navigation'
import { Save, ShieldAlert, ArrowRight, Check } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { Dispute } from '../../data/types'
import { REASON_LABELS } from '../../data/types'
import WorkflowGuard from '../WorkflowGuard'
import DisputeWorkflowLayout from '../DisputeWorkflowLayout'
import { SectionCard, ConfirmModal, useActionFeedback, FeedbackToast } from '../ui'
import { useState } from 'react'

export default function IntakeStage({ disputeId }: { disputeId: string }) {
  return (
    <WorkflowGuard disputeId={disputeId}>
      {(d, source) => <IntakeInner dispute={d} source={source} />}
    </WorkflowGuard>
  )
}

function IntakeInner({ dispute, source }: { dispute: Dispute; source: 'live' | 'seed' }) {
  const router = useRouter()
  const base = `/property-manager/bookings/disputes/${dispute.id}`
  const { msg, fire } = useActionFeedback()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const cl = dispute.intake_checklist ?? {
    issue_details_captured: false, claimant_side_confirmed: false,
    linked_booking_verified: false, policy_reference_added: false,
  }

  return (
    <DisputeWorkflowLayout
      dispute={dispute}
      stage="intake"
      source={source}
      title="Intake"
      subtitle="Capture the claim, confirm the claimant and verify the linked booking before requesting evidence."
      rightRail={
        <SectionCard title="Intake checklist">
          <ul className="space-y-2.5">
            {[
              ['Issue details captured', cl.issue_details_captured],
              ['Claimant side confirmed', cl.claimant_side_confirmed],
              ['Linked booking verified', cl.linked_booking_verified],
              ['Policy reference added', cl.policy_reference_added],
            ].map(([label, done]) => (
              <li key={label as string} className="flex items-center gap-2.5 text-sm">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? <Check className="h-3 w-3" /> : ''}
                </span>
                <span className={done ? 'text-slate-700' : 'text-slate-500'}>{label as string}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      }
    >
      <SectionCard title="Claim details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Issue type">
            <select defaultValue={dispute.reason} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
              {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Claimant side">
            <select defaultValue={dispute.claimant_side} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <option value="host">Host</option>
              <option value="guest">Guest</option>
              <option value="supplier">Supplier</option>
            </select>
          </Field>
          <Field label="Short description" full>
            <textarea defaultValue={dispute.issue_summary} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </Field>
          <Field label="Amount disputed">
            <input defaultValue={(dispute.amount_disputed_pence / 100).toFixed(2)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            <p className="text-[11px] text-slate-400 mt-1">{formatPence(dispute.amount_disputed_pence, dispute.currency)}</p>
          </Field>
          <Field label="Currency">
            <select defaultValue={dispute.currency} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <option>GBP</option><option>EUR</option><option>USD</option>
            </select>
          </Field>
          <Field label="Linked booking / order">
            <input defaultValue={`${dispute.booking_reference} · ${dispute.order_reference ?? '—'}`} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </Field>
          <Field label="Policy reference">
            <input defaultValue={dispute.policy_reference ?? ''} placeholder="e.g. POL-DMG-04" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </Field>
        </div>
      </SectionCard>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => fire('Intake saved')} className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-[var(--brand-strong)]">
          <Save className="w-4 h-4" /> Save intake
        </button>
        <button onClick={() => fire('Evidence request sent')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ShieldAlert className="w-4 h-4" /> Request evidence
        </button>
        <button onClick={() => router.push(`${base}/evidence`)} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Continue to evidence <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={() => setConfirmCancel(true)} className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2">
          Cancel dispute
        </button>
      </div>

      <ConfirmModal
        open={confirmCancel}
        title="Cancel dispute"
        message={`Cancel ${dispute.reference}? This closes the case without a resolution and notifies both parties. This cannot be undone.`}
        confirmLabel="Cancel dispute"
        tone="danger"
        onConfirm={() => { fire('Dispute cancelled'); router.push('/property-manager/bookings/disputes') }}
        onClose={() => setConfirmCancel(false)}
      />
      <FeedbackToast msg={msg} />
    </DisputeWorkflowLayout>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
