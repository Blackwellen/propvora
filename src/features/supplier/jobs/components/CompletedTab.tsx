"use client"

import React, { useMemo, useState } from "react"
import {
  CheckCircle2, Table2, LayoutGrid, Archive, Star, Banknote, Clock, Repeat,
  Download, FileText, ShieldCheck, RefreshCw, MessageSquarePlus, History, Image as ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  SupplierCard, SupplierEmptyState, SupplierStatusBadge, SupplierButton, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher } from "@/components/supplier-workspace/views"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierJob } from "../data/types"
import { payoutBreakdown } from "../data/types"
import { StatRow, PanelSection, useToast, ToastHost } from "./primitives"

type ViewId = "table" | "cards" | "archive" | "ratings"

function Stars({ rating }: { rating: number | null }) {
  const r = Math.round(rating ?? 0)
  return (
    <span className="inline-flex" aria-label={`${r} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("w-3.5 h-3.5", i < r ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
      ))}
    </span>
  )
}

export function CompletedTab({ jobs }: { jobs: SupplierJob[] }) {
  const [view, setView] = useState<ViewId>("table")
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id ?? null)
  const { toasts, push } = useToast()

  const selected = useMemo(() => jobs.find((j) => j.id === selectedId) ?? jobs[0] ?? null, [jobs, selectedId])

  const kpis: SupplierKpi[] = useMemo(() => {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const thisMonth = jobs.filter((j) => j.completedAt && new Date(j.completedAt) >= monthStart)
    const paidOut = jobs.filter((j) => j.payoutPaidAt).reduce((a, j) => a + payoutBreakdown(j).totalPayoutPence, 0)
    const durations = jobs.filter((j) => j.startedAt && j.completedAt).map((j) => (new Date(j.completedAt as string).getTime() - new Date(j.startedAt as string).getTime()) / 3_600_000)
    const avg = durations.length ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : 0
    const rated = jobs.filter((j) => j.rating != null).length
    const repeat = jobs.filter((j) => j.repeatCustomer).length
    return [
      { label: "Completed this month", value: thisMonth.length, icon: CheckCircle2 },
      { label: "Paid out", value: formatPence(paidOut), icon: Banknote },
      { label: "Avg completion", value: `${avg}h`, icon: Clock },
      { label: "Rated jobs", value: rated, icon: Star },
      { label: "Repeat customers", value: repeat, icon: Repeat },
    ]
  }, [jobs])

  if (jobs.length === 0) {
    return (
      <SupplierCard className="p-2">
        <SupplierEmptyState icon={CheckCircle2} title="No completed jobs yet" description="Your finished, paid-out work is archived here with ratings and completion packs." />
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
        <p className="text-sm font-semibold text-slate-700">Completed jobs</p>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "table", label: "Table", icon: Table2 },
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "archive", label: "Archive", icon: Archive },
            { key: "ratings", label: "Ratings", icon: Star },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="min-w-0">
          {view === "ratings" ? (
            <SupplierCard className="p-4 space-y-3">
              {jobs.filter((j) => j.rating != null).map((j) => (
                <button key={j.id} onClick={() => setSelectedId(j.id)} className="w-full text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{j.title}</p>
                    <Stars rating={j.rating} />
                  </div>
                  {j.reviewText && <p className="text-xs text-slate-500 mt-1 italic">“{j.reviewText}”</p>}
                  <p className="text-[11px] text-slate-400 mt-1">{j.customerName} · {shortDate(j.completedAt)}</p>
                </button>
              ))}
            </SupplierCard>
          ) : view === "archive" || view === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobs.map((j) => (
                <button key={j.id} onClick={() => setSelectedId(j.id)} className="text-left">
                  <SupplierCard className={cn("p-4 h-full transition-all hover:shadow-md", selected?.id === j.id ? "ring-2 ring-[var(--brand)]/40" : "")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                        <p className="text-xs text-slate-500">{j.customerName} · {j.service}</p>
                      </div>
                      <SupplierStatusBadge tone="emerald">{j.payoutPaidAt ? "Paid" : "Pending"}</SupplierStatusBadge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{shortDate(j.completedAt)}</span>
                      <Stars rating={j.rating} />
                      <span className="font-medium text-slate-700">{formatPence(j.pricePence)}</span>
                    </div>
                  </SupplierCard>
                </button>
              ))}
            </div>
          ) : (
            <SupplierCard className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                    <Th>Job</Th><Th>Customer</Th><Th>Completed</Th><Th>Service</Th><Th>Final cost</Th><Th>Payout</Th><Th>Invoice</Th><Th>Rating</Th><Th>Repeat</Th><Th>Pack</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j) => (
                    <tr key={j.id} onClick={() => setSelectedId(j.id)} className={cn("cursor-pointer hover:bg-slate-50/60", selected?.id === j.id ? "bg-[var(--brand-soft)]/40" : "")}>
                      <Td><p className="font-semibold text-slate-800">{j.title}</p><p className="text-xs text-slate-400">{j.ref}</p></Td>
                      <Td className="text-slate-600 text-xs">{j.customerName}</Td>
                      <Td className="text-slate-600 text-xs">{shortDate(j.completedAt)}</Td>
                      <Td className="text-slate-600 text-xs">{j.service}</Td>
                      <Td className="font-medium text-slate-700 text-xs">{formatPence(j.pricePence)}</Td>
                      <Td><SupplierStatusBadge tone="emerald">{j.payoutPaidAt ? `Paid ${shortDate(j.payoutPaidAt)}` : "Pending"}</SupplierStatusBadge></Td>
                      <Td><button onClick={(e) => { e.stopPropagation(); push("blue", "Invoice download started. (TODO)") }} className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand)]">Download</button></Td>
                      <Td><Stars rating={j.rating} /></Td>
                      <Td className="text-xs">{j.repeatCustomer ? <span className="text-emerald-600 font-semibold">Yes</span> : <span className="text-slate-400">No</span>}</Td>
                      <Td><button onClick={(e) => { e.stopPropagation(); push("blue", "Completion pack ready. (TODO)") }} className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand)]">Ready</button></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SupplierCard>
          )}
        </div>

        {/* Right panel */}
        {selected && (
          <SupplierCard className="p-4 lg:sticky lg:top-4 self-start space-y-4 h-max">
            <div>
              <p className="text-sm font-bold text-slate-900">{selected.title}</p>
              <p className="text-xs text-slate-400">{selected.ref} · {selected.customerName}</p>
            </div>

            <PanelSection title="Completion summary">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 space-y-1">
                <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Completed {shortDate(selected.completedAt)}</p>
                <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {selected.onTrack ? "On time · no issues" : "Completed with notes"}</p>
              </div>
            </PanelSection>

            <PanelSection title="Payout breakdown">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-0.5">
                {(() => {
                  const b = payoutBreakdown(selected)
                  return (
                    <>
                      <StatRow label="Final cost" value={formatPence(b.pricePence)} />
                      <StatRow label={`Platform fee (${selected.platformFeePct}%)`} value={`− ${formatPence(b.platformFeePence)}`} />
                      <StatRow label="Net" value={formatPence(b.netPence)} />
                      <StatRow label={`VAT (${selected.vatPct}%)`} value={`+ ${formatPence(b.vatPence)}`} />
                      <div className="border-t border-slate-200 mt-1 pt-1">
                        <StatRow label="Total payout" value={<span className="text-emerald-700">{formatPence(b.totalPayoutPence)}</span>} />
                      </div>
                    </>
                  )
                })()}
              </div>
            </PanelSection>

            {selected.rating != null && (
              <PanelSection title="Customer rating">
                <div className="rounded-xl border border-slate-100 p-3">
                  <Stars rating={selected.rating} />
                  {selected.reviewText && <p className="text-xs text-slate-600 mt-1.5 italic">“{selected.reviewText}”</p>}
                </div>
              </PanelSection>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Tile icon={FileText} label="Invoice" onClick={() => push("blue", "Invoice opened. (TODO)")} />
              <Tile icon={ImageIcon} label="Evidence" onClick={() => push("blue", "Evidence opened. (TODO)")} />
              <Tile icon={ShieldCheck} label="Warranty" onClick={() => push("blue", "Warranty opened. (TODO)")} />
              <Tile icon={Repeat} label="Repeat customer" onClick={() => push("blue", "Customer history opened. (TODO)")} />
            </div>

            {selected.rebookChance === "high" && (
              <div className="rounded-xl bg-violet-50 border border-violet-200 p-3">
                <p className="text-xs font-semibold text-violet-800">Rebook opportunity · High chance</p>
                <SupplierButton size="sm" className="w-full mt-2" onClick={() => push("emerald", "Rebook drafted. (TODO)")}>
                  <RefreshCw className="w-3.5 h-3.5" /> Rebook similar job
                </SupplierButton>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <SupplierButton size="sm" variant="outline" onClick={() => push("blue", "Completion pack opened. (TODO)")}><Archive className="w-3.5 h-3.5" /> View pack</SupplierButton>
              <SupplierButton size="sm" variant="outline" onClick={() => push("blue", "Invoice download started. (TODO)")}><Download className="w-3.5 h-3.5" /> Invoice</SupplierButton>
              <SupplierButton size="sm" variant="outline" onClick={() => push("emerald", "Review request sent. (TODO)")}><MessageSquarePlus className="w-3.5 h-3.5" /> Request review</SupplierButton>
              <SupplierButton size="sm" variant="outline" onClick={() => push("blue", "Follow-up added. (TODO)")}><History className="w-3.5 h-3.5" /> Follow-up</SupplierButton>
            </div>
          </SupplierCard>
        )}
      </div>

      <ToastHost toasts={toasts} />
    </div>
  )
}

function Tile({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition-colors">
      <Icon className="w-5 h-5 text-slate-500" />
      <span className="text-[11px] font-medium text-slate-600">{label}</span>
    </button>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>
}
