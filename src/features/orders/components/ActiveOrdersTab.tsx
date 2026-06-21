"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  Briefcase, Clock, Loader2, AlertTriangle, Search, MessageSquare,
  Image as ImageIcon, Flag, CalendarClock, XCircle, ExternalLink, Phone, Mail, Star,
} from "lucide-react"
import { useOrders, useOrdersKpis } from "../data/hooks"
import {
  KpiCard, StatusBadge, toneForSla, toneForEvidence, toneForMilestone,
  humanise, ConfirmModal, PagerFooter, SourcePill, Select,
} from "./ui"
import type { OrderRow } from "../data/types"

const ORDER_TYPES = ["Boiler service", "Gas safety cert", "Plumbing repair", "Electrical check", "Deep clean"]

export function ActiveOrdersTab() {
  const { data: orders, loading, source } = useOrders()
  const kpis = useOrdersKpis(orders)

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [milestoneFilter, setMilestoneFilter] = useState("")
  const [slaFilter, setSlaFilter] = useState("")
  const [riskFilter, setRiskFilter] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<null | { kind: string }>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  const suppliers = useMemo(() => Array.from(new Set(orders.map(o => o.supplierName))), [orders])

  const filtered = useMemo(() => orders.filter(o => {
    if (search && !`${o.orderRef} ${o.propertyLabel} ${o.supplierName} ${o.orderType}`.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter && o.orderType !== typeFilter) return false
    if (supplierFilter && o.supplierName !== supplierFilter) return false
    if (milestoneFilter && o.milestoneStatus !== milestoneFilter) return false
    if (slaFilter && o.slaStatus !== slaFilter) return false
    if (riskFilter && o.risk !== riskFilter) return false
    return true
  }), [orders, search, typeFilter, supplierFilter, milestoneFilter, slaFilter, riskFilter])

  const selected = orders.find(o => o.id === selectedId) ?? null

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Briefcase} iconBg="bg-blue-50" iconColor="text-blue-600" value={kpis.active} label="Active orders" sub="Live" subColor="text-slate-400" />
        <KpiCard icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" value={kpis.awaitingAcceptance} label="Awaiting acceptance" sub="Needs supplier" subColor="text-amber-600" />
        <KpiCard icon={Loader2} iconBg="bg-violet-50" iconColor="text-violet-600" value={kpis.inProgress} label="In progress" sub="On site / working" subColor="text-violet-600" />
        <KpiCard icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" value={kpis.atRisk} label="At risk" sub={kpis.atRisk > 0 ? "Attention" : "All clear"} subColor={kpis.atRisk > 0 ? "text-red-500" : "text-emerald-600"} />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search orders, properties, suppliers…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select value={typeFilter} onChange={setTypeFilter} placeholder="All order types" options={ORDER_TYPES} />
          <Select value={supplierFilter} onChange={setSupplierFilter} placeholder="All suppliers" options={suppliers} />
          <Select value={milestoneFilter} onChange={setMilestoneFilter} placeholder="Milestone" options={["not_started", "in_progress", "awaiting_evidence", "review", "completed"]} humaniseOpt />
          <Select value={slaFilter} onChange={setSlaFilter} placeholder="SLA" options={["on_track", "due_soon", "at_risk", "breached"]} humaniseOpt />
          <Select value={riskFilter} onChange={setRiskFilter} placeholder="Risk" options={["low", "medium", "high"]} humaniseOpt />
          <SourcePill source={source} />
        </div>
      </div>

      {/* Table + detail panel */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Property / Location</th>
                  <th className="px-4 py-3 font-semibold">Order type</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Scheduled</th>
                  <th className="px-4 py-3 font-semibold">Escrow</th>
                  <th className="px-4 py-3 font-semibold">Milestone</th>
                  <th className="px-4 py-3 font-semibold">Evidence</th>
                  <th className="px-4 py-3 font-semibold">SLA</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50"><td colSpan={10} className="px-4 py-4"><div className="h-5 bg-slate-50 rounded animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">No orders match your filters.</td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id} onClick={() => setSelectedId(o.id)}
                    className={cn("border-b border-slate-50 cursor-pointer hover:bg-slate-50", selectedId === o.id && "bg-blue-50/40")}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{o.orderRef}</td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{o.propertyLabel}</p><p className="text-xs text-slate-500">{o.location}</p></td>
                    <td className="px-4 py-3 text-slate-600">{o.orderType}</td>
                    <td className="px-4 py-3 text-slate-600">{o.supplierName}</td>
                    <td className="px-4 py-3 text-slate-600">{o.scheduledDate ? new Date(o.scheduledDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatPence(o.escrowAmountPence)}</td>
                    <td className="px-4 py-3"><StatusBadge tone={toneForMilestone(o.milestoneStatus)}>{humanise(o.milestoneStatus)}</StatusBadge></td>
                    <td className="px-4 py-3"><StatusBadge tone={toneForEvidence(o.evidenceStatus)}>{humanise(o.evidenceStatus)}</StatusBadge></td>
                    <td className="px-4 py-3"><StatusBadge tone={toneForSla(o.slaStatus)}>{humanise(o.slaStatus)}</StatusBadge></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/property-manager/work/orders/${o.orderRef}`} onClick={e => e.stopPropagation()}
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] inline-flex items-center gap-1">
                        Open <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PagerFooter shown={filtered.length} total={orders.length} />
        </div>

        {/* Detail panel */}
        <div className="w-full xl:w-80 shrink-0">
          {selected ? (
            <OrderDetailPanel order={selected} onAction={kind => setConfirm({ kind })} />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
              <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">Select an order</p>
              <p className="text-xs text-slate-400 mt-1">Click a row to see details, escrow, evidence and quick actions.</p>
            </div>
          )}
        </div>
      </div>

      {confirm && selected && (
        <ConfirmModal
          title={confirmTitle(confirm.kind)}
          message={confirmMessage(confirm.kind, selected)}
          confirmLabel={confirmTitle(confirm.kind)}
          tone={confirm.kind === "cancel" || confirm.kind === "dispute" ? "red" : "blue"}
          requireReason={confirm.kind === "dispute" || confirm.kind === "cancel"}
          onConfirm={() => { setConfirm(null); showToast(`${confirmTitle(confirm.kind)} — done`) }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function confirmTitle(kind: string) {
  return { dispute: "Raise dispute", reschedule: "Reschedule", cancel: "Cancel order", message: "Message supplier", evidence: "View evidence" }[kind] ?? "Confirm"
}
function confirmMessage(kind: string, o: OrderRow) {
  if (kind === "cancel") return `Cancelling ${o.orderRef} will halt the order. Escrow of ${formatPence(o.escrowAmountPence)} will be returned subject to the cancellation policy.`
  if (kind === "dispute") return `Raise a dispute on ${o.orderRef}. This freezes any escrow release until resolved.`
  if (kind === "reschedule") return `Reschedule ${o.orderRef} with ${o.supplierName}.`
  return `Proceed with this action on ${o.orderRef}?`
}

function OrderDetailPanel({ order, onAction }: { order: OrderRow; onAction: (k: string) => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{order.orderRef}</h3>
          <StatusBadge tone={toneForMilestone(order.milestoneStatus)}>{humanise(order.milestoneStatus)}</StatusBadge>
        </div>
        <p className="text-xs text-slate-500 mt-1">{order.propertyLabel} · {order.location}</p>
        <p className="text-xs text-slate-500">{order.orderType}</p>
      </div>

      {/* Supplier card */}
      <div className="p-5 border-b border-slate-100">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Supplier</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold">{order.supplierInitials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{order.supplierName}</p>
            {order.supplierRating && <p className="text-xs text-amber-600 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{order.supplierRating}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-3 text-xs text-slate-500">
          {order.supplierPhone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{order.supplierPhone}</span>}
          {order.supplierEmail && <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{order.supplierEmail}</span>}
        </div>
      </div>

      {/* Escrow breakdown */}
      <div className="p-5 border-b border-slate-100">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Escrow</p>
        <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Held</span><span className="font-semibold text-slate-800">{formatPence(order.escrowAmountPence)}</span></div>
        <div className="flex items-center justify-between text-sm mt-1"><span className="text-slate-500">Funded</span><span className="font-semibold text-slate-800">{formatPence(order.fundedAmountPence)}</span></div>
        <div className="flex items-center justify-between text-sm mt-1"><span className="text-slate-500">State</span><StatusBadge tone="blue">{humanise(order.escrowState ?? "held")}</StatusBadge></div>
      </div>

      {/* Quick actions */}
      <div className="p-5">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-3">Quick actions</p>
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn icon={MessageSquare} label="Message" onClick={() => onAction("message")} />
          <ActionBtn icon={ImageIcon} label="Evidence" onClick={() => onAction("evidence")} />
          <ActionBtn icon={Flag} label="Raise dispute" onClick={() => onAction("dispute")} tone="red" />
          <ActionBtn icon={CalendarClock} label="Reschedule" onClick={() => onAction("reschedule")} />
          <ActionBtn icon={XCircle} label="Cancel" onClick={() => onAction("cancel")} tone="red" />
          <Link href={`/property-manager/work/orders/${order.orderRef}`} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100">
            <ExternalLink className="w-3.5 h-3.5" /> Open order
          </Link>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, onClick, tone = "slate" }: { icon: typeof MessageSquare; label: string; onClick: () => void; tone?: "slate" | "red" }) {
  return (
    <button onClick={onClick}
      className={cn("flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors",
        tone === "red" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  )
}
