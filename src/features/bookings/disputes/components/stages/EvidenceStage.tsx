'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, MessageSquare, Download, ArrowRight, FileText, Image as ImageIcon,
  ClipboardList, FileCheck2, StickyNote, MessagesSquare, ShieldAlert,
} from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { Dispute, DisputeEvidence, EvidenceKind, PartySide } from '../../data/types'
import WorkflowGuard from '../WorkflowGuard'
import DisputeWorkflowLayout from '../DisputeWorkflowLayout'
import { SectionCard, fmtDateTime, daysRemaining, useActionFeedback, FeedbackToast, StubDrawer } from '../ui'

const KIND_META: Record<EvidenceKind, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  photo: { label: 'Photos', icon: ImageIcon },
  invoice: { label: 'Invoices', icon: FileText },
  chat_log: { label: 'Chat logs', icon: MessagesSquare },
  inspection_report: { label: 'Inspection reports', icon: ClipboardList },
  booking_terms: { label: 'Booking terms', icon: FileCheck2 },
  note: { label: 'Notes', icon: StickyNote },
}
const KIND_ORDER: EvidenceKind[] = ['photo', 'invoice', 'chat_log', 'inspection_report', 'booking_terms', 'note']

export default function EvidenceStage({ disputeId }: { disputeId: string }) {
  return (
    <WorkflowGuard disputeId={disputeId}>
      {(d, source) => <EvidenceInner dispute={d} source={source} />}
    </WorkflowGuard>
  )
}

function EvidenceInner({ dispute, source }: { dispute: Dispute; source: 'live' | 'seed' }) {
  const router = useRouter()
  const base = `/property-manager/bookings/disputes/${dispute.id}`
  const { msg, fire } = useActionFeedback()
  const [drawer, setDrawer] = useState<string | null>(null)

  const host = dispute.evidence.filter((e) => e.side === 'host')
  const other = dispute.evidence.filter((e) => e.side === 'counterparty')
  const missing = Math.max(0, 4 - Math.min(host.length, other.length))
  const days = daysRemaining(dispute.sla_due)
  const otherLabel = dispute.supplier_name ? 'Supplier' : 'Guest'

  return (
    <DisputeWorkflowLayout
      dispute={dispute}
      stage="evidence"
      source={source}
      title="Evidence"
      subtitle="Collect and compare evidence from both sides before moving the case to review."
    >
      {/* cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniCard label="Submitted" value={String(dispute.evidence.length)} tone="blue" />
        <MiniCard label="Missing" value={String(missing)} tone="amber" />
        <MiniCard label="Days remaining" value={days === null ? '—' : String(days)} tone="violet" />
        <MiniCard label="Escrow amount" value={formatPence(dispute.escrow_held_pence, dispute.currency)} tone="emerald" />
      </div>

      {/* comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EvidenceColumn title="Host" subtitle="Evidence submitted by the host" items={host} side="host" onUpload={() => fire('Upload ready — choose a file')} />
        <EvidenceColumn title={`${otherLabel} / Guest`} subtitle={`Evidence submitted by the ${otherLabel.toLowerCase()}`} items={other} side="counterparty" onUpload={() => fire('Upload ready — choose a file')} />
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer">
          <Upload className="w-4 h-4" /> Upload evidence
          <input type="file" className="hidden" multiple onChange={() => fire('File added to host evidence')} />
        </label>
        <button onClick={() => fire('Request for more info sent')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ShieldAlert className="w-4 h-4" /> Request more info
        </button>
        <button onClick={() => setDrawer('message')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <MessageSquare className="w-4 h-4" /> Message party
        </button>
        <button onClick={() => fire('Preparing evidence bundle…')} className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Download className="w-4 h-4" /> Download all
        </button>
        <button onClick={() => router.push(`${base}/review`)} className="ml-auto inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-slate-800">
          Continue to review <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <StubDrawer open={drawer === 'message'} title="Message party" onClose={() => setDrawer(null)}>
        <textarea rows={4} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Request specific evidence…" />
        <button onClick={() => { fire('Message sent'); setDrawer(null) }} className="mt-3 bg-blue-600 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-blue-700">Send</button>
      </StubDrawer>
      <FeedbackToast msg={msg} />
    </DisputeWorkflowLayout>
  )
}

function EvidenceColumn({
  title, subtitle, items, side, onUpload,
}: {
  title: string; subtitle: string; items: DisputeEvidence[]; side: PartySide; onUpload: () => void
}) {
  const grouped = KIND_ORDER.map((k) => ({ kind: k, items: items.filter((i) => i.kind === k) }))
  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      right={
        <label className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
          <Upload className="w-3.5 h-3.5" /> Upload
          <input type="file" className="hidden" multiple onChange={onUpload} />
        </label>
      }
    >
      <div className="space-y-4">
        {grouped.map(({ kind, items: g }) => {
          const { label, icon: Icon } = KIND_META[kind]
          return (
            <div key={kind}>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">{label}</p>
                <span className="text-[10px] text-slate-400">{g.length}</span>
              </div>
              {g.length === 0 ? (
                <p className="text-xs text-slate-400 pl-5">None submitted.</p>
              ) : (
                <ul className="space-y-1.5 pl-5">
                  {g.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 text-sm border border-slate-100 rounded-lg px-2.5 py-1.5 bg-slate-50/50">
                      <div className="min-w-0">
                        <p className="text-slate-700 truncate">{e.title}</p>
                        <p className="text-[11px] text-slate-400">{e.submitted_by} · {fmtDateTime(e.submitted_at)}{e.file_size_kb ? ` · ${e.file_size_kb} KB` : ''}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

const TONES: Record<string, string> = {
  blue: 'text-blue-700 bg-blue-50',
  amber: 'text-amber-700 bg-amber-50',
  violet: 'text-violet-700 bg-violet-50',
  emerald: 'text-emerald-700 bg-emerald-50',
}
function MiniCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${TONES[tone]}`}>{label}</span>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  )
}
