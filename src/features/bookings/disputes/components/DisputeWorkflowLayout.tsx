'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, FileClock } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { Dispute, DisputeStageKey } from '../data/types'
import { REASON_LABELS } from '../data/types'
import {
  StageStepper, StatusBadge, PriorityBadge, fmtDateTime, SourceBadge,
} from './ui'

const STAGE_ROUTE: Record<DisputeStageKey, string> = {
  intake: 'intake',
  evidence: 'evidence',
  review: 'review',
  resolution: 'resolution',
  closed: 'closed',
}

export default function DisputeWorkflowLayout({
  dispute,
  stage,
  source,
  title,
  subtitle,
  children,
  rightRail,
}: {
  dispute: Dispute
  stage: DisputeStageKey
  source: 'live' | 'seed'
  title: string
  subtitle?: string
  children: React.ReactNode
  rightRail?: React.ReactNode
}) {
  const router = useRouter()
  const base = `/property-manager/bookings/disputes/${dispute.id}`

  return (
    <div className="h-full overflow-y-auto bg-slate-50/40">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* breadcrumb + header */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/property-manager/bookings/disputes" className="hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Disputes
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{dispute.reference}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              <StatusBadge status={dispute.status} />
              <PriorityBadge priority={dispute.priority} />
              <SourceBadge source={source} />
            </div>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* stepper */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-5">
          <StageStepper
            current={stage}
            onStageClick={(key) => router.push(`${base}/${STAGE_ROUTE[key]}`)}
          />
        </div>

        {/* case summary strip */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Summary label="Disputed amount" value={formatPence(dispute.amount_disputed_pence, dispute.currency)} />
          <Summary label="Escrow held" value={formatPence(dispute.escrow_held_pence, dispute.currency)} />
          <Summary label="Requested refund" value={formatPence(dispute.requested_refund_pence, dispute.currency)} />
          <Summary label="Reason" value={REASON_LABELS[dispute.reason]} />
        </div>

        {/* main + right rail */}
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
          <div className="space-y-4 min-w-0">{children}</div>
          <div className="space-y-4">
            {rightRail}
            {/* case context */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Case</p>
              <div className="flex items-center gap-2.5 mb-3">
                <img src={dispute.guest_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(dispute.guest_name)}&size=40`} alt={dispute.guest_name} className="w-9 h-9 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{dispute.guest_name}</p>
                  <p className="text-xs text-slate-400 truncate">{dispute.supplier_name ?? 'Direct guest'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="truncate">{dispute.property_name}</span>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <Row label="Booking" value={<Link href={`/property-manager/bookings/${dispute.booking_id}`} className="text-[var(--brand)] hover:underline">{dispute.booking_reference}</Link>} />
                <Row label="Order" value={dispute.order_reference ?? '—'} />
                <Row label="Currency" value={dispute.currency} />
                {dispute.sla_due && <Row label="SLA due" value={fmtDateTime(dispute.sla_due)} />}
              </div>
            </div>

            {/* audit timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileClock className="w-4 h-4 text-slate-400" />
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Audit timeline</p>
              </div>
              <ol className="space-y-3">
                {dispute.timeline.slice().reverse().map((t) => (
                  <li key={t.id} className="flex gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--brand)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800">{t.label}</p>
                      {t.detail && <p className="text-[11px] text-slate-500">{t.detail}</p>}
                      <p className="text-[11px] text-slate-400">{t.actor} · {fmtDateTime(t.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-0.5 truncate">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 text-right">{value}</span>
    </div>
  )
}
