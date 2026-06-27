'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  X, MessageSquare, ExternalLink, Upload, Gavel, FileCheck2,
  Send, FolderOpen, ShieldAlert,
} from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { Dispute } from '../data/types'
import { REASON_LABELS } from '../data/types'
import {
  StageStepper, StatusBadge, PriorityBadge, fmtDate, fmtDateTime,
  ConfirmModal, StubDrawer, useActionFeedback, FeedbackToast,
} from './ui'

export default function DisputeDetailPanel({
  dispute,
  onClose,
}: {
  dispute: Dispute | null
  onClose: () => void
}) {
  const [drawer, setDrawer] = useState<string | null>(null)
  const [confirmRequest, setConfirmRequest] = useState(false)
  const { msg, fire } = useActionFeedback()

  if (!dispute) {
    return (
      <div className="w-[360px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto hidden xl:flex items-center justify-center">
        <p className="text-slate-400 text-sm text-center px-6">
          Select a dispute to view its stage, evidence, timeline and actions.
        </p>
      </div>
    )
  }

  const wfBase = `/property-manager/bookings/disputes/${dispute.id}`

  return (
    <div className="w-[360px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto hidden xl:flex flex-col">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-900">{dispute.reference}</span>
          <StatusBadge status={dispute.status} />
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* identity */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span>Booking <Link href={`/property-manager/bookings/${dispute.booking_id}`} className="text-[var(--brand)] hover:underline">{dispute.booking_reference}</Link></span>
          {dispute.order_reference && <span>· Order {dispute.order_reference}</span>}
          <PriorityBadge priority={dispute.priority} />
        </div>

        {/* guest / property */}
        <div className="flex items-start gap-3">
          <img
            src={dispute.guest_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(dispute.guest_name)}&size=40`}
            alt={dispute.guest_name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{dispute.guest_name}</p>
            <p className="text-xs text-slate-500 truncate">{dispute.guest_email}</p>
            {dispute.supplier_name && <p className="text-xs text-slate-500">Supplier: {dispute.supplier_name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {dispute.property_image && (
            <img src={dispute.property_image} alt={dispute.property_name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">{dispute.property_name}</p>
            <p className="text-xs text-slate-400">{dispute.property_location}</p>
          </div>
        </div>

        {/* stepper */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Stage</p>
          <StageStepper current={dispute.stage} orientation="vertical" />
        </div>

        {/* issue */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Issue</p>
          <p className="text-sm font-medium text-slate-800">{dispute.issue_summary}</p>
          <p className="text-xs text-slate-500 mt-1">{REASON_LABELS[dispute.reason]}</p>
        </div>

        {/* money */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Money label="Disputed" value={formatPence(dispute.amount_disputed_pence, dispute.currency)} />
          <Money label="Escrow held" value={formatPence(dispute.escrow_held_pence, dispute.currency)} />
          <Money label="Requested refund" value={formatPence(dispute.requested_refund_pence, dispute.currency)} />
          <Money label="Currency" value={dispute.currency} />
        </div>

        {/* evidence */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Evidence ({dispute.evidence.length})</p>
          <ul className="space-y-1.5">
            {dispute.evidence.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-700 truncate">{e.title}</span>
                <span className="text-slate-400 shrink-0">{e.side === 'host' ? 'Host' : 'Other'}</span>
              </li>
            ))}
            {dispute.evidence.length === 0 && <li className="text-xs text-slate-400">No evidence submitted yet.</li>}
          </ul>
        </div>

        {/* timeline */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Timeline</p>
          <ol className="space-y-2.5">
            {dispute.timeline.slice(-5).reverse().map((t) => (
              <li key={t.id} className="flex gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--brand)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800">{t.label}</p>
                  <p className="text-[11px] text-slate-400">{t.actor} · {fmtDateTime(t.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* actions */}
        <div className="space-y-2 pt-1">
          <Link
            href={`${wfBase}/evidence`}
            className="w-full flex items-center justify-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3 py-2 text-sm font-medium hover:bg-[var(--brand-strong)] transition-colors"
          >
            <Upload className="w-4 h-4" /> Submit evidence
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link href={`${wfBase}/resolution`} className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Gavel className="w-4 h-4" /> Propose
            </Link>
            <Link href={`${wfBase}/resolution`} className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <FileCheck2 className="w-4 h-4" /> Decision
            </Link>
            <button onClick={() => setConfirmRequest(true)} className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <ShieldAlert className="w-4 h-4" /> Request
            </button>
            <button onClick={() => setDrawer('message')} className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          </div>
          <Link href={wfBase} className="w-full flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <FolderOpen className="w-4 h-4" /> Open full dispute
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/property-manager/bookings/${dispute.booking_id}`} className="flex items-center justify-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] px-3 py-2">
              View booking <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button onClick={() => fire('Opening linked order…')} className="flex items-center justify-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] px-3 py-2">
              View order <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">Opened {fmtDate(dispute.opened_at)} · Updated {fmtDate(dispute.updated_at)}</p>
      </div>

      <ConfirmModal
        open={confirmRequest}
        title="Request evidence"
        message={`Send an evidence request to the parties on ${dispute.reference}? They will be notified and the dispute moves to awaiting evidence.`}
        confirmLabel="Send request"
        tone="primary"
        onConfirm={() => fire('Evidence request sent')}
        onClose={() => setConfirmRequest(false)}
      />
      <StubDrawer open={drawer === 'message'} title="Message guest / supplier" onClose={() => setDrawer(null)}>
        <label className="block text-xs font-medium text-slate-600 mb-1">Recipient</label>
        <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3">
          <option>{dispute.guest_name} (guest)</option>
          {dispute.supplier_name && <option>{dispute.supplier_name} (supplier)</option>}
        </select>
        <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
        <textarea rows={4} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Type a message…" />
        <button onClick={() => { fire('Message sent'); setDrawer(null) }} className="mt-3 inline-flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-[var(--brand-strong)]">
          <Send className="w-4 h-4" /> Send message
        </button>
      </StubDrawer>
      <FeedbackToast msg={msg} />
    </div>
  )
}

function Money({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  )
}
