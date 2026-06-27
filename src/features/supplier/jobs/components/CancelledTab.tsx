"use client"

import React, { useMemo, useState } from "react"
import {
  XCircle, Table2, LayoutGrid, PieChart, GitBranch, Banknote, User, RefreshCw,
  MessageSquare, Gavel, Archive, TrendingDown, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  SupplierCard, SupplierEmptyState, SupplierStatusBadge, SupplierButton, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher } from "@/components/supplier-workspace/views"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierJob } from "../data/types"
import { StatRow, PanelSection, MiniDonut, BarBreakdown, useToast, ToastHost } from "./primitives"

type ViewId = "table" | "cards" | "analytics" | "timeline"

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export function CancelledTab({ jobs }: { jobs: SupplierJob[] }) {
  const [view, setView] = useState<ViewId>("table")
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id ?? null)
  const { toasts, push } = useToast()

  const selected = useMemo(() => jobs.find((j) => j.id === selectedId) ?? jobs[0] ?? null, [jobs, selectedId])

  const kpis: SupplierKpi[] = useMemo(() => {
    const lost = jobs.reduce((a, j) => a + (j.cancellation?.lostEarningsPence ?? 0), 0)
    const byCustomer = jobs.filter((j) => j.cancellation?.cancelledBy === "customer").length
    const bySupplier = jobs.filter((j) => j.cancellation?.cancelledBy === "supplier").length
    const reschedulable = jobs.filter((j) => j.cancellation?.rescheduleEligibleUntil && new Date(j.cancellation.rescheduleEligibleUntil).getTime() > Date.now()).length
    return [
      { label: "Cancelled jobs", value: jobs.length, icon: XCircle },
      { label: "Lost value", value: formatPence(lost), icon: TrendingDown },
      { label: "Customer cancels", value: byCustomer, icon: User },
      { label: "Your cancels", value: bySupplier, icon: User },
      { label: "Reschedule eligible", value: reschedulable, icon: RefreshCw },
    ]
  }, [jobs])

  const byCounts = useMemo(() => {
    const c = { customer: 0, supplier: 0, platform: 0 }
    for (const j of jobs) {
      const b = j.cancellation?.cancelledBy
      if (b) c[b]++
    }
    return c
  }, [jobs])

  const reasonSegments = useMemo(() => {
    const map = new Map<string, number>()
    for (const j of jobs) {
      const r = j.cancellation?.reason ?? "Other"
      const key = r.length > 28 ? r.slice(0, 28) + "…" : r
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    const palette = ["#2563EB", "#D97706", "#DC2626", "#7C3AED", "#059669"]
    return Array.from(map.entries()).map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }))
  }, [jobs])

  if (jobs.length === 0) {
    return (
      <SupplierCard className="p-2">
        <SupplierEmptyState icon={XCircle} title="No cancellations" description="Cancelled jobs, their reasons and any fees or reschedule options appear here." />
      </SupplierCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <SupplierCard key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</span>
              {k.icon && <k.icon className="w-4 h-4 text-slate-400" />}
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">{k.value}</p>
          </SupplierCard>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Cancellations</p>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "table", label: "Table", icon: Table2 },
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "analytics", label: "Reasons", icon: PieChart },
            { key: "timeline", label: "Timeline", icon: GitBranch },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="min-w-0">
          {view === "analytics" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SupplierCard className="p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Reason breakdown</p>
                <MiniDonut segments={reasonSegments} />
              </SupplierCard>
              <SupplierCard className="p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Cancelled by</p>
                <BarBreakdown
                  bars={[
                    { label: "Customer", value: byCounts.customer, total: jobs.length, color: "#2563EB" },
                    { label: "Supplier", value: byCounts.supplier, total: jobs.length, color: "#D97706" },
                    { label: "Platform", value: byCounts.platform, total: jobs.length, color: "#7C3AED" },
                  ]}
                />
              </SupplierCard>
            </div>
          ) : view === "timeline" ? (
            <SupplierCard className="p-4">
              <div className="space-y-4">
                {[...jobs].sort((a, b) => new Date(b.cancellation?.cancelledAt ?? 0).getTime() - new Date(a.cancellation?.cancelledAt ?? 0).getTime()).map((j) => (
                  <button key={j.id} onClick={() => setSelectedId(j.id)} className="flex gap-3 w-full text-left">
                    <div className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1.5" />
                      <span className="w-px flex-1 bg-slate-200" />
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-semibold text-slate-800">{j.title}</p>
                      <p className="text-xs text-slate-500">{j.cancellation?.reason}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{shortDate(j.cancellation?.cancelledAt)} · by {j.cancellation?.cancelledBy}</p>
                    </div>
                  </button>
                ))}
              </div>
            </SupplierCard>
          ) : view === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobs.map((j) => (
                <button key={j.id} onClick={() => setSelectedId(j.id)} className="text-left">
                  <SupplierCard className={cn("p-4 h-full transition-all hover:shadow-md", selected?.id === j.id ? "ring-2 ring-[var(--brand)]/40" : "")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                        <p className="text-xs text-slate-500">{j.customerName}</p>
                      </div>
                      <SupplierStatusBadge tone={j.cancellation?.cancelledBy === "customer" ? "blue" : j.cancellation?.cancelledBy === "supplier" ? "amber" : "violet"}>
                        {j.cancellation?.cancelledBy === "customer" ? "Customer" : j.cancellation?.cancelledBy === "supplier" ? "You" : "Platform"}
                      </SupplierStatusBadge>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{j.cancellation?.reason}</p>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{shortDate(j.cancellation?.cancelledAt)}</span>
                      <span className="font-medium text-red-600">− {formatPence(j.cancellation?.lostEarningsPence ?? 0)}</span>
                    </div>
                  </SupplierCard>
                </button>
              ))}
            </div>
          ) : (
            <SupplierCard className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                    <Th>Job</Th><Th>Cancelled on</Th><Th>By</Th><Th>Reason</Th><Th>Fee</Th><Th>Reschedule</Th><Th>Lost</Th><Th>Score</Th><Th>Dispute</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j) => {
                    const c = j.cancellation
                    const eligible = c?.rescheduleEligibleUntil && new Date(c.rescheduleEligibleUntil).getTime() > Date.now()
                    return (
                      <tr key={j.id} onClick={() => setSelectedId(j.id)} className={cn("cursor-pointer hover:bg-slate-50/60", selected?.id === j.id ? "bg-[var(--brand-soft)]/40" : "")}>
                        <Td><p className="font-semibold text-slate-800">{j.title}</p><p className="text-xs text-slate-400">{j.ref}</p></Td>
                        <Td className="text-xs text-slate-600">{shortDate(c?.cancelledAt)}</Td>
                        <Td><SupplierStatusBadge tone={c?.cancelledBy === "customer" ? "blue" : c?.cancelledBy === "supplier" ? "amber" : "violet"}>{c?.cancelledBy === "customer" ? "Customer" : c?.cancelledBy === "supplier" ? "You" : "Platform"}</SupplierStatusBadge></Td>
                        <Td className="text-xs text-slate-600 max-w-[200px] truncate">{c?.reason}</Td>
                        <Td className="text-xs">{!c?.feePence ? <span className="text-emerald-600 font-semibold">Waived</span> : <span className="text-slate-700">{formatPence(c.feePence)}</span>}</Td>
                        <Td className="text-xs">{eligible ? <span className="text-emerald-600">Until {shortDate(c?.rescheduleEligibleUntil)}</span> : <span className="text-slate-400">Not eligible</span>}</Td>
                        <Td className="text-xs font-medium text-red-600">− {formatPence(c?.lostEarningsPence ?? 0)}</Td>
                        <Td className="text-xs">{c?.scoreImpact ? <span className="text-red-600 font-semibold">{c.scoreImpact} pts</span> : <span className="text-slate-400">0</span>}</Td>
                        <Td><SupplierStatusBadge tone={c?.disputeRisk === "high" ? "red" : c?.disputeRisk === "medium" ? "amber" : "emerald"}>{(c?.disputeRisk ?? "low")[0].toUpperCase() + (c?.disputeRisk ?? "low").slice(1)}</SupplierStatusBadge></Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </SupplierCard>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <SupplierCard className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Reason breakdown</p>
            <MiniDonut segments={reasonSegments} size={104} />
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Cancelled by</p>
              <BarBreakdown
                bars={[
                  { label: "Customer", value: byCounts.customer, total: jobs.length, color: "#2563EB" },
                  { label: "Supplier", value: byCounts.supplier, total: jobs.length, color: "#D97706" },
                  { label: "Platform", value: byCounts.platform, total: jobs.length, color: "#7C3AED" },
                ]}
              />
            </div>
          </SupplierCard>

          {selected && selected.cancellation && (
            <SupplierCard className="p-4 lg:sticky lg:top-4 self-start space-y-4 h-max">
              <div>
                <p className="text-sm font-bold text-slate-900">{selected.title}</p>
                <p className="text-xs text-slate-400">{selected.ref} · {selected.customerName}</p>
              </div>

              <PanelSection title="Cancellation details">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-0.5">
                  <StatRow label="Cancelled by" value={selected.cancellation.cancelledBy === "customer" ? "Customer" : selected.cancellation.cancelledBy === "supplier" ? "You" : "Platform"} />
                  <StatRow label="On" value={shortDate(selected.cancellation.cancelledAt)} />
                  <StatRow label="Fee" value={!selected.cancellation.feePence ? "Waived" : formatPence(selected.cancellation.feePence)} sub={selected.cancellation.feePolicy ?? undefined} />
                  <StatRow label="Lost earnings" value={<span className="text-red-600">− {formatPence(selected.cancellation.lostEarningsPence)}</span>} />
                  <StatRow label="Score impact" value={selected.cancellation.scoreImpact ? `${selected.cancellation.scoreImpact} pts` : "0"} />
                </div>
                <p className="text-xs text-slate-600 mt-2">{selected.cancellation.reason}</p>
              </PanelSection>

              <PanelSection title="Audit trail">
                <div className="space-y-2">
                  {selected.audit.map((a, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-slate-400 shrink-0">{shortDate(a.at)}</span>
                      <Banknote className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                      <span className="text-slate-600">{a.label}</span>
                    </div>
                  ))}
                </div>
              </PanelSection>

              <div className="grid grid-cols-2 gap-2">
                <SupplierButton size="sm" variant="outline" onClick={() => push("blue", "Cancelled job opened. (TODO)")}><ExternalLink className="w-3.5 h-3.5" /> View job</SupplierButton>
                <SupplierButton
                  size="sm"
                  disabled={!(selected.cancellation.rescheduleEligibleUntil && new Date(selected.cancellation.rescheduleEligibleUntil).getTime() > Date.now())}
                  onClick={() => push("emerald", "Reschedule drafted. (TODO)")}
                ><RefreshCw className="w-3.5 h-3.5" /> Reschedule</SupplierButton>
                <SupplierButton size="sm" variant="outline" onClick={() => push("blue", "Message thread opened. (TODO)")}><MessageSquare className="w-3.5 h-3.5" /> Message</SupplierButton>
                <SupplierButton
                  size="sm"
                  variant="outline"
                  disabled={daysSince(selected.cancellation.cancelledAt) > 7}
                  onClick={() => push("amber", daysSince(selected.cancellation!.cancelledAt) > 7 ? "Appeal window closed." : "Appeal opened. (TODO)")}
                ><Gavel className="w-3.5 h-3.5" /> Appeal</SupplierButton>
                <SupplierButton size="sm" variant="ghost" className="col-span-2" onClick={() => push("blue", "Job archived. (TODO)")}><Archive className="w-3.5 h-3.5" /> Archive</SupplierButton>
              </div>
            </SupplierCard>
          )}
        </div>
      </div>

      <ToastHost toasts={toasts} />
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>
}
