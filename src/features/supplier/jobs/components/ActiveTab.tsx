"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  Wrench, Table2, LayoutGrid, Columns3, Map as MapIcon, Play, MapPin, Upload,
  StickyNote, MessageSquare, CheckCircle2, ChevronRight, Clock, ShieldCheck, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  SupplierCard, SupplierKpiStrip, SupplierEmptyState, SupplierStatusBadge, SupplierButton,
  type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher, SupplierKanban, type KanbanColumn } from "@/components/supplier-workspace/views"
import { shortDate, timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierJob } from "../data/types"
import { evidenceReceivedCount } from "../data/types"
import {
  ProgressRing, CountPill, StatRow, ChecklistItem, StaticMap, PanelSection, useToast, ToastHost,
} from "./primitives"

type ViewId = "cards" | "table" | "kanban" | "map"

const KANBAN_COLS: KanbanColumn[] = [
  { key: "assigned", label: "New", accent: "text-slate-600", dot: "bg-slate-400" },
  { key: "accepted", label: "Accepted", accent: "text-[var(--brand)]", dot: "bg-[var(--brand)]" },
  { key: "in_progress", label: "In progress", accent: "text-sky-600", dot: "bg-sky-500" },
]

function slaLabel(job: SupplierJob): { text: string; tone: "emerald" | "amber" | "red" } {
  if (!job.slaDueAt) return { text: "No SLA", tone: "emerald" }
  const diff = new Date(job.slaDueAt).getTime() - Date.now()
  if (diff < 0) {
    const h = Math.round(-diff / 3_600_000)
    return { text: `Overdue ${h}h`, tone: "red" }
  }
  const h = Math.round(diff / 3_600_000)
  return { text: h <= 4 ? `${h}h left` : `${Math.round(h / 24)}d left`, tone: h <= 4 ? "amber" : "emerald" }
}

export function ActiveTab({ jobs }: { jobs: SupplierJob[] }) {
  const [view, setView] = useState<ViewId>("table")
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id ?? null)
  const { toasts, push } = useToast()
  const [noteDraft, setNoteDraft] = useState("")
  const [msgDraft, setMsgDraft] = useState("")

  const selected = useMemo(
    () => jobs.find((j) => j.id === selectedId) ?? jobs[0] ?? null,
    [jobs, selectedId]
  )

  const kpis: SupplierKpi[] = useMemo(() => {
    const dueToday = jobs.filter((j) => j.appointmentAt && new Date(j.appointmentAt).toDateString() === new Date().toDateString()).length
    const inProgress = jobs.filter((j) => j.status === "in_progress").length
    const atRisk = jobs.filter((j) => !j.onTrack).length
    const escrow = jobs.reduce((a, j) => a + (j.escrowStatus === "held" ? j.escrowPence : 0), 0)
    return [
      { label: "Active jobs", value: jobs.length, icon: Wrench },
      { label: "Due today", value: dueToday, icon: Clock },
      { label: "In progress", value: inProgress, icon: Play },
      { label: "At risk", value: atRisk, icon: AlertTriangle, subColor: atRisk > 0 ? "text-red-600" : undefined },
      { label: "Escrow held", value: formatPence(escrow), icon: ShieldCheck },
    ]
  }, [jobs])

  if (jobs.length === 0) {
    return (
      <SupplierCard className="p-2">
        <SupplierEmptyState
          icon={Wrench}
          title="No active jobs"
          description="Jobs you're currently working appear here. Accept and start a scheduled job to see it on the board."
        />
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
            <p className={cn("text-xl font-bold mt-1", k.subColor ?? "text-slate-900")}>{k.value}</p>
          </SupplierCard>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Job board</p>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "table", label: "Table", icon: Table2 },
            { key: "kanban", label: "Kanban", icon: Columns3 },
            { key: "map", label: "Map", icon: MapIcon },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* ── Left: the board view ── */}
        <div className="min-w-0">
          {view === "kanban" ? (
            <SupplierKanban<SupplierJob>
              columns={KANBAN_COLS}
              items={jobs}
              getColumn={(j) => j.status}
              getKey={(j) => j.id}
              renderCard={(j) => (
                <button onClick={() => setSelectedId(j.id)} className="block w-full text-left">
                  <p className="text-sm font-semibold text-slate-800">{j.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{j.customerName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-400">{shortDate(j.appointmentAt)}</span>
                    <ProgressRing value={j.progressPct} size={26} stroke={3} tone={j.onTrack ? "emerald" : "amber"} label="" />
                  </div>
                </button>
              )}
            />
          ) : view === "map" ? (
            <SupplierCard className="p-4">
              <StaticMap
                label="Active jobs route"
                className="h-[360px]"
                markers={jobs.map((j) => ({
                  id: j.id,
                  address: `${j.address.line1}, ${j.address.postcode}`,
                  label: j.address.line1,
                  sublabel: j.address.postcode,
                  color: j.onTrack ? "#2563EB" : "#F59E0B",
                }))}
              />
              <div className="mt-3 space-y-1.5">
                {jobs.map((j) => (
                  <button key={j.id} onClick={() => setSelectedId(j.id)} className="flex items-center gap-2 w-full text-left text-sm hover:bg-slate-50 rounded-lg px-2 py-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--brand)]" />
                    <span className="font-medium text-slate-700">{j.address.line1}, {j.address.postcode}</span>
                    <span className="ml-auto text-xs text-slate-400">{shortDate(j.appointmentAt)}</span>
                  </button>
                ))}
              </div>
            </SupplierCard>
          ) : view === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobs.map((j) => {
                const sla = slaLabel(j)
                return (
                  <button key={j.id} onClick={() => setSelectedId(j.id)} className="text-left">
                    <SupplierCard className={cn("p-4 h-full transition-all hover:shadow-md", selected?.id === j.id ? "ring-2 ring-[var(--brand)]/40" : "")}>
                      <div className="flex items-start justify-between gap-2">
                        <ProgressRing value={j.progressPct} tone={j.onTrack ? "emerald" : "amber"} />
                        <SupplierStatusBadge tone={j.onTrack ? "emerald" : "amber"}>
                          {j.status === "in_progress" ? "In progress" : j.onTrack ? "On track" : "At risk"}
                        </SupplierStatusBadge>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">{j.title}</p>
                      <p className="text-xs text-slate-500">{j.customerName}</p>
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <span className="text-slate-500">SLA <span className={cn("font-semibold", sla.tone === "red" ? "text-red-600" : sla.tone === "amber" ? "text-amber-600" : "text-emerald-600")}>{sla.text}</span></span>
                        <span className="text-slate-500 text-right">{formatPence(j.pricePence)}</span>
                      </div>
                    </SupplierCard>
                  </button>
                )
              })}
            </div>
          ) : (
            <SupplierCard className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                    <Th>Job</Th><Th>Status</Th><Th>SLA</Th><Th>Appointment</Th><Th>Route</Th>
                    <Th>Price</Th><Th>Escrow</Th><Th>Evidence</Th><Th>Materials</Th><Th>Risk</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j) => {
                    const sla = slaLabel(j)
                    return (
                      <tr
                        key={j.id}
                        onClick={() => setSelectedId(j.id)}
                        className={cn("cursor-pointer transition-colors hover:bg-slate-50/60", selected?.id === j.id ? "bg-[var(--brand-soft)]/40" : "")}
                      >
                        <Td>
                          <p className="font-semibold text-slate-800">{j.title}</p>
                          <p className="text-xs text-slate-400">{j.ref} · {j.customerName}</p>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <ProgressRing value={j.progressPct} size={28} stroke={3} tone={j.onTrack ? "emerald" : "amber"} label="" />
                            <span className="text-xs font-medium text-slate-600">{j.status === "in_progress" ? "In progress" : j.onTrack ? "On track" : "At risk"}</span>
                          </div>
                        </Td>
                        <Td><span className={cn("text-xs font-semibold", sla.tone === "red" ? "text-red-600" : sla.tone === "amber" ? "text-amber-600" : "text-emerald-600")}>{sla.text}</span></Td>
                        <Td className="text-slate-600 text-xs">{shortDate(j.appointmentAt)}</Td>
                        <Td className="text-slate-600 text-xs">{j.routePosition ? `${j.routePosition} of ${j.routeTotal}` : "—"}</Td>
                        <Td className="text-slate-700 font-medium text-xs">{formatPence(j.pricePence)}</Td>
                        <Td><SupplierStatusBadge tone={j.escrowStatus === "paid" ? "emerald" : "amber"}>{j.escrowStatus === "paid" ? "Paid" : "Held"}</SupplierStatusBadge></Td>
                        <Td><CountPill done={evidenceReceivedCount(j)} total={j.evidence.length} tone="blue" /></Td>
                        <Td><CountPill done={j.materials.filter((m) => m.status === "ready" || m.status === "used").length} total={j.materials.length} tone="slate" /></Td>
                        <Td><SupplierStatusBadge tone={j.onTrack ? "emerald" : "red"}>{j.onTrack ? "Low" : "High"}</SupplierStatusBadge></Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </SupplierCard>
          )}
        </div>

        {/* ── Right: detail panel ── */}
        {selected && (
          <SupplierCard className="p-4 lg:sticky lg:top-4 self-start space-y-4 h-max">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{selected.title}</p>
                <SupplierStatusBadge tone={selected.onTrack ? "emerald" : "amber"}>{selected.status === "in_progress" ? "In progress" : selected.onTrack ? "On track" : "At risk"}</SupplierStatusBadge>
              </div>
              <p className="text-xs text-slate-400">{selected.ref} · {selected.service}</p>
            </div>

            <PanelSection title="Customer & appointment">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-0.5">
                <StatRow label="Customer" value={selected.customerName} />
                <StatRow label="Appointment" value={shortDate(selected.appointmentAt)} sub={selected.appointmentAt ? new Date(selected.appointmentAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : undefined} />
                <StatRow label="Route" value={selected.routePosition ? `${selected.routePosition} of ${selected.routeTotal}` : "—"} />
              </div>
            </PanelSection>

            <PanelSection title="Property access">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-0.5">
                <StatRow label="Address" value={`${selected.address.line1}, ${selected.address.postcode}`} />
                {selected.keySafeCode && <StatRow label="Key safe" value={<span className="font-mono">{selected.keySafeCode}</span>} />}
                {selected.accessNotes && <p className="text-xs text-slate-500 pt-1">{selected.accessNotes}</p>}
              </div>
            </PanelSection>

            <PanelSection title="Start your work">
              <div className="flex gap-2">
                <SupplierButton size="sm" className="flex-1" onClick={() => push("blue", "Job started — clock running. (TODO: persist start)")}>
                  <Play className="w-3.5 h-3.5" /> Start job
                </SupplierButton>
                <SupplierButton size="sm" variant="outline" className="flex-1" onClick={() => push("emerald", "Marked on site. (TODO: persist on-site)")}>
                  <MapPin className="w-3.5 h-3.5" /> Mark on site
                </SupplierButton>
              </div>
            </PanelSection>

            <PanelSection title="Required evidence">
              <div className="rounded-xl border border-slate-100 px-3 py-1">
                {selected.evidence.map((e) => <ChecklistItem key={e.key} label={e.label} done={e.received} />)}
              </div>
            </PanelSection>

            <PanelSection title="Recent messages">
              <div className="space-y-2">
                {selected.messages.length === 0 ? (
                  <p className="text-xs text-slate-400">No messages yet.</p>
                ) : selected.messages.slice(-3).map((m) => (
                  <div key={m.id} className={cn("rounded-xl px-3 py-2 text-xs", m.direction === "outbound" ? "bg-[var(--brand-soft)] text-[var(--brand-strong)] ml-6" : "bg-slate-50 text-slate-700 mr-6")}>
                    <p>{m.body}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{m.authorName} · {timeAgo(m.createdAt)}</p>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <input value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)} placeholder="Message customer…" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                  <SupplierButton size="sm" onClick={() => { if (msgDraft.trim()) { push("emerald", "Message sent. (TODO: persist)"); setMsgDraft("") } }}>Send</SupplierButton>
                </div>
              </div>
            </PanelSection>

            <PanelSection title="Notes">
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add an on-site note…" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
              <SupplierButton size="sm" variant="outline" className="w-full" onClick={() => { if (noteDraft.trim()) { push("emerald", "Note added. (TODO: persist)"); setNoteDraft("") } }}>
                <StickyNote className="w-3.5 h-3.5" /> Add note
              </SupplierButton>
            </PanelSection>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link href={`/supplier/jobs/${selected.id}`} className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand-strong)]">
                Open job <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => push("blue", "Evidence uploader opened. (TODO)")} className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
                <Upload className="w-3.5 h-3.5" /> Upload evidence
              </button>
              <button onClick={() => push("blue", "Opening message thread. (TODO)")} className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
              <button onClick={() => push("emerald", "Sign-off requested. (TODO)")} className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
                <CheckCircle2 className="w-3.5 h-3.5" /> Request sign-off
              </button>
            </div>
          </SupplierCard>
        )}
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
