'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search, AlertCircle, Clock, Flame, Wallet, Eye, ArrowRight, TrendingUp,
} from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import { cn } from '@/lib/utils'
import { useDisputes } from '../data/hooks'
import {
  DISPUTE_STAGES, REASON_LABELS, PRIORITY_LABELS,
  type DisputePriority, type DisputeReason, type DisputeStageKey,
} from '../data/types'
import {
  StatusBadge, PriorityBadge, TableSkeleton, EmptyState, ErrorState,
  PermissionDeniedState, SourceBadge, fmtDate,
} from './ui'
import DisputeDetailPanel from './DisputeDetailPanel'

export default function DisputesView() {
  const { data, loading, error, source, reload } = useDisputes()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [property, setProperty] = useState('all')
  const [reason, setReason] = useState<DisputeReason | 'all'>('all')
  const [stage, setStage] = useState<DisputeStageKey | 'all'>('all')
  const [priority, setPriority] = useState<DisputePriority | 'all'>('all')

  const properties = useMemo(
    () => Array.from(new Set(data.map((d) => d.property_name))).sort(),
    [data],
  )

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (search) {
        const q = search.toLowerCase()
        const hay = [
          d.reference, d.booking_reference, d.order_reference, d.guest_name,
          d.supplier_name, d.property_name,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (property !== 'all' && d.property_name !== property) return false
      if (reason !== 'all' && d.reason !== reason) return false
      if (stage !== 'all' && d.stage !== stage) return false
      if (priority !== 'all' && d.priority !== priority) return false
      return true
    })
  }, [data, search, property, reason, stage, priority])

  const kpis = useMemo(() => {
    const open = data.filter((d) => d.status !== 'closed' && d.status !== 'resolved').length
    const awaiting = data.filter((d) => d.status === 'awaiting_evidence').length
    const highRisk = data.filter((d) => d.priority === 'high' || d.priority === 'critical').length
    const atRisk = data
      .filter((d) => d.status !== 'closed' && d.status !== 'resolved')
      .reduce((s, d) => s + d.amount_disputed_pence, 0)
    return { open, awaiting, highRisk, atRisk }
  }, [data])

  const selected = data.find((d) => d.id === selectedId) ?? null
  const clearAll = () => {
    setSearch(''); setProperty('all'); setReason('all'); setStage('all'); setPriority('all')
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto min-w-0 px-6 py-6">
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Disputes</h1>
              <SourceBadge source={source} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Triage and resolve booking and supplier disputes through a structured, evidence-based workflow.
            </p>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <KpiCard label="Open disputes" value={String(kpis.open)} subtitle="Active cases" icon={AlertCircle} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KpiCard label="Awaiting evidence" value={String(kpis.awaiting)} subtitle="Pending submissions" icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
          <KpiCard label="High-risk disputes" value={String(kpis.highRisk)} subtitle="High / critical priority" icon={Flame} iconBg="bg-red-50" iconColor="text-red-600" />
          <KpiCard label="Total value at risk" value={formatPence(kpis.atRisk)} subtitle="Across open cases" icon={Wallet} iconBg="bg-violet-50" iconColor="text-violet-600" />
        </div>

        {/* filters */}
        <div className="mt-6 flex gap-2 items-center flex-wrap">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, booking ref, guest, supplier, property…"
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={property} onChange={(e) => setProperty(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]">
            <option value="all">All properties</option>
            {properties.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={reason} onChange={(e) => setReason(e.target.value as DisputeReason | 'all')} className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]">
            <option value="all">All dispute reasons</option>
            {(Object.keys(REASON_LABELS) as DisputeReason[]).map((r) => <option key={r} value={r}>{REASON_LABELS[r]}</option>)}
          </select>
          <select value={stage} onChange={(e) => setStage(e.target.value as DisputeStageKey | 'all')} className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]">
            <option value="all">All stages</option>
            {DISPUTE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as DisputePriority | 'all')} className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]">
            <option value="all">All priorities</option>
            {(Object.keys(PRIORITY_LABELS) as DisputePriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
            <span>Date range</span>
          </div>
          <button onClick={clearAll} className="text-sm text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap">
            Clear all
          </button>
        </div>

        {/* body states */}
        <div className="mt-4">
          {loading ? (
            <TableSkeleton />
          ) : error === 'permission-denied' ? (
            <PermissionDeniedState />
          ) : error ? (
            <ErrorState message="We couldn’t load disputes." onRetry={reload} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={data.length === 0 ? 'No disputes yet' : 'No matching disputes'}
              message={data.length === 0
                ? 'When a guest or host raises an issue against a booking, it will appear here.'
                : 'Try adjusting or clearing your filters.'}
              action={data.length > 0 ? (
                <button onClick={clearAll} className="text-sm text-blue-600 hover:text-blue-700">Clear all filters</button>
              ) : undefined}
            />
          ) : (
            <DisputesTable rows={filtered} selectedId={selectedId} onSelect={(id) => setSelectedId((p) => p === id ? null : id)} />
          )}
        </div>
      </div>

      <DisputeDetailPanel dispute={selected} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function KpiCard({
  label, value, subtitle, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string; subtitle: string
  icon: React.ComponentType<{ className?: string }>; iconBg: string; iconColor: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  )
}

function DisputesTable({
  rows, selectedId, onSelect,
}: {
  rows: ReturnType<typeof useDisputes>['data']
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const stageLabel = (k: DisputeStageKey) => DISPUTE_STAGES.find((s) => s.key === k)?.label ?? k
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <Th>Dispute ID</Th>
              <Th>Booking / Order</Th>
              <Th>Guest / Supplier</Th>
              <Th>Property</Th>
              <Th className="text-right">Amount disputed</Th>
              <Th>Reason</Th>
              <Th>Opened</Th>
              <Th>Priority</Th>
              <Th className="text-center">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((d) => {
              const isSelected = selectedId === d.id
              return (
                <tr
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className={cn('cursor-pointer hover:bg-slate-50 transition-colors', isSelected && 'bg-sky-50 border-l-2 border-l-blue-600')}
                >
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-900">{d.reference}</p>
                    <div className="mt-0.5"><StatusBadge status={d.status} /></div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-slate-800">{d.booking_reference}</p>
                    <p className="text-xs text-slate-400">{d.order_reference ?? '—'} · {stageLabel(d.stage)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <img src={d.guest_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.guest_name)}&size=32`} alt={d.guest_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{d.guest_name}</p>
                        <p className="text-xs text-slate-400 truncate">{d.supplier_name ?? 'Direct guest'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-slate-700">{d.property_name}</p>
                    <p className="text-xs text-slate-400">{d.property_location}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatPence(d.amount_disputed_pence, d.currency)}</p>
                    <p className="text-xs text-slate-400">Escrow {formatPence(d.escrow_held_pence, d.currency)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-slate-700">{REASON_LABELS[d.reason]}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-slate-600">{fmtDate(d.opened_at)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={d.priority} />
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onSelect(d.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link href={`/property-manager/bookings/disputes/${d.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Open dispute">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-100">
        <p className="text-sm text-slate-500">Showing 1 to {rows.length} of {rows.length} disputes</p>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg text-sm font-medium bg-blue-600 text-white">1</button>
        </div>
        <select className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>10 / page</option>
          <option>25 / page</option>
          <option>50 / page</option>
        </select>
      </div>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider', className)}>
      {children}
    </th>
  )
}

export { TrendingUp }
