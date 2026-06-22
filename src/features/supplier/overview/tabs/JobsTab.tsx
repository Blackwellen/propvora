"use client"

import { useState } from "react"
import LocationMap from "@/components/maps/LocationMap"
import Link from "next/link"
import {
  Wrench, Clock, AlertTriangle, Upload, Wallet, LayoutGrid, Table2, GitBranch,
  Map as MapIcon, Columns3, MapPin, Navigation, Phone, KeyRound, CheckCircle2,
  Circle, Send, MessageSquare, FileCheck2, ShieldCheck, X, Play,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import {
  KpiRow, Panel, ViewToggle, Pill, OverviewLink, useToast,
  OverviewSkeleton, OverviewError, OverviewEmpty,
  type OverviewKpi, type Accent, type ViewOption,
} from "../ui/primitives"
import { SupplierBarChart } from "@/components/supplier-workspace/charts"
import { clockTime, dueIn } from "../ui/util"
import { useJobsData } from "../data/hooks"
import type { JobRow } from "../data/types"

const VIEWS: ViewOption[] = [
  { key: "cards", label: "Cards", icon: LayoutGrid },
  { key: "table", label: "Table", icon: Table2 },
  { key: "timeline", label: "Timeline", icon: GitBranch },
  { key: "map", label: "Map", icon: MapIcon },
  { key: "kanban", label: "Kanban", icon: Columns3 },
]

const STATUS_ACCENT: Record<string, Accent> = {
  scheduled: "sky", en_route: "blue", in_progress: "blue", awaiting_signoff: "violet", at_risk: "red",
}
const PRIORITY_ACCENT: Record<string, Accent> = { low: "slate", normal: "sky", high: "amber" }
const INVOICE_ACCENT: Record<string, Accent> = { none: "slate", draft: "amber", sent: "blue", paid: "emerald" }

export function JobsTab() {
  const { data, loading, error, reload } = useJobsData()
  const { toast } = useToast()
  const [view, setView] = useState("cards")
  const [selected, setSelected] = useState<JobRow | null>(null)

  if (loading) return <OverviewSkeleton />
  if (error && !data) return <OverviewError onRetry={reload} />
  if (!data) return null

  const k = data.kpis
  const kpis: OverviewKpi[] = [
    { id: "active", label: "Active jobs", value: k.activeJobs, icon: Wrench, accent: "blue" },
    { id: "due", label: "Due today", value: k.dueToday, icon: Clock, accent: "amber" },
    { id: "risk", label: "At risk", value: k.atRisk, icon: AlertTriangle, accent: "red" },
    { id: "ev", label: "Evidence missing", value: k.evidenceMissing, icon: Upload, accent: "violet" },
    { id: "escrow", label: "Escrow waiting", value: formatPence(k.escrowWaitingPence, "GBP"), icon: Wallet, accent: "emerald" },
  ]

  return (
    <div className="space-y-5">
      <KpiRow kpis={kpis} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Job board</h2>
        <ViewToggle options={VIEWS} active={view} onChange={setView} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          {data.rows.length === 0 ? (
            <Panel><OverviewEmpty title="No active jobs" description="Accepted quotes become jobs you can track here." /></Panel>
          ) : view === "table" ? (
            <TableView rows={data.rows} onSelect={setSelected} selectedId={selected?.id} />
          ) : view === "timeline" ? (
            <TimelineView rows={data.rows} onSelect={setSelected} selectedId={selected?.id} />
          ) : view === "map" ? (
            <MapView rows={data.rows} onSelect={setSelected} selectedId={selected?.id} />
          ) : view === "kanban" ? (
            <KanbanView rows={data.rows} onSelect={setSelected} selectedId={selected?.id} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.rows.map((j) => <JobCard key={j.id} j={j} onSelect={setSelected} selected={selected?.id === j.id} />)}
            </div>
          )}

          {/* Selected job detail */}
          {selected && <JobDetail j={selected} onClose={() => setSelected(null)} toast={toast} />}
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          <Panel title="Earnings by service" icon={Wallet}>
            {data.earningsByService.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-2">No earnings yet.</p>
            ) : (
              <SupplierBarChart data={data.earningsByService} height={160} format={(v) => formatPence(v, "GBP")} />
            )}
          </Panel>

          <Panel title="Recent invoices" icon={FileCheck2} action={<OverviewLink href="/supplier?tab=earnings" label="All" />}>
            {data.recentInvoices.length === 0 && (
              <p className="text-[12px] text-slate-400 py-1">No invoices yet.</p>
            )}
            <ul className="divide-y divide-slate-100">
              {data.recentInvoices.map((iv) => (
                <li key={iv.id} className="flex items-center gap-2 py-2.5">
                  <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-slate-800 truncate">{iv.number}</span><span className="block text-[11px] text-slate-400 truncate">{iv.customer}</span></span>
                  <Pill accent={INVOICE_ACCENT[iv.status]}>{iv.status}</Pill>
                  <span className="text-sm font-bold text-slate-900 shrink-0">{formatPence(iv.amountPence, iv.currency)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Quick actions">
            <div className="grid grid-cols-2 gap-2.5">
              <QuickBtn label="Upload evidence" icon={Upload} onClick={() => toast("Evidence uploader coming soon", "info")} />
              <QuickBtn label="Create invoice" icon={FileCheck2} onClick={() => toast("Invoice composer coming soon", "info")} />
              <Link href="/supplier/messages" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-center"><span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-blue-600" /></span><span className="text-[11px] font-medium text-slate-700">Messages</span></Link>
              <Link href="/supplier/schedule" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-center"><span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Clock className="w-4 h-4 text-blue-600" /></span><span className="text-[11px] font-medium text-slate-700">Schedule</span></Link>
            </div>
          </Panel>

          <Panel title="Compliance status" icon={ShieldCheck} action={<OverviewLink href="/supplier?tab=compliance" label="All" />}>
            {data.complianceStatus.length === 0 && (
              <p className="text-[12px] text-slate-400">No compliance documents yet.</p>
            )}
            <ul className="space-y-2">
              {data.complianceStatus.map((c) => (
                <li key={c.document} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{c.document}</span>
                  <Pill accent={c.state === "verified" ? "emerald" : c.state === "expiring" ? "amber" : "red"}>{c.state}</Pill>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function QuickBtn({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-center">
      <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Icon className="w-4 h-4 text-blue-600" /></span>
      <span className="text-[11px] font-medium text-slate-700">{label}</span>
    </button>
  )
}

function SlaClock({ iso }: { iso: string }) {
  const due = dueIn(iso)
  return <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${due.overdue ? "text-red-600" : "text-slate-500"}`}><Clock className="w-3 h-3" /> {due.label}</span>
}

function JobCard({ j, onSelect, selected }: { j: JobRow; onSelect: (j: JobRow) => void; selected: boolean }) {
  const evGap = j.evidenceProvided < j.evidenceRequired
  return (
    <button type="button" onClick={() => onSelect(j)} className={`text-left bg-white border rounded-[18px] shadow-sm p-4 transition-all hover:shadow-md ${selected ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{j.title}</p>
          <p className="text-[12px] text-slate-400 truncate">{j.customer} · {j.jobRef}</p>
        </div>
        <Pill accent={STATUS_ACCENT[j.status]}>{j.status.replace("_", " ")}</Pill>
      </div>
      <p className="mt-2 text-[12px] text-slate-500 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {j.address}</p>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-600">{clockTime(j.appointmentAt)}</span>
        <SlaClock iso={j.slaDueAt} />
        <span className={`text-[11px] font-semibold ${evGap ? "text-amber-600" : "text-emerald-600"}`}>Evidence {j.evidenceProvided}/{j.evidenceRequired}</span>
        <Pill accent={PRIORITY_ACCENT[j.priority]}>{j.priority}</Pill>
      </div>
    </button>
  )
}

function TableView({ rows, onSelect, selectedId }: { rows: JobRow[]; onSelect: (j: JobRow) => void; selectedId?: string }) {
  return (
    <Panel pad={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
            <th className="px-4 py-3 font-semibold">Job</th><th className="px-4 py-3 font-semibold">Appt</th><th className="px-4 py-3 font-semibold">SLA</th><th className="px-4 py-3 font-semibold">Evidence</th><th className="px-4 py-3 font-semibold">Invoice</th><th className="px-4 py-3 font-semibold">Status</th>
          </tr></thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.id} onClick={() => onSelect(j)} className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${selectedId === j.id ? "bg-blue-50/50" : ""}`}>
                <td className="px-4 py-3"><span className="font-semibold text-slate-800">{j.title}</span><span className="block text-[11px] text-slate-400">{j.customer}</span></td>
                <td className="px-4 py-3 text-slate-600">{clockTime(j.appointmentAt)}</td>
                <td className="px-4 py-3"><SlaClock iso={j.slaDueAt} /></td>
                <td className="px-4 py-3 text-slate-600">{j.evidenceProvided}/{j.evidenceRequired}</td>
                <td className="px-4 py-3"><Pill accent={INVOICE_ACCENT[j.invoiceStatus]}>{j.invoiceStatus}</Pill></td>
                <td className="px-4 py-3"><Pill accent={STATUS_ACCENT[j.status]}>{j.status.replace("_", " ")}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function TimelineView({ rows, onSelect, selectedId }: { rows: JobRow[]; onSelect: (j: JobRow) => void; selectedId?: string }) {
  const sorted = [...rows].sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime())
  return (
    <Panel>
      <ol className="relative pl-5">
        <span className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-100" aria-hidden />
        {sorted.map((j) => (
          <li key={j.id} className="relative pb-4 last:pb-0">
            <span className={`absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${j.status === "at_risk" ? "bg-red-500" : "bg-blue-500"}`} />
            <button onClick={() => onSelect(j)} className={`w-full text-left rounded-xl -mx-2 px-2 py-1.5 hover:bg-slate-50 ${selectedId === j.id ? "bg-blue-50/50" : ""}`}>
              <span className="text-[12px] font-bold text-slate-500">{clockTime(j.appointmentAt)}</span>
              <span className="block text-sm font-semibold text-slate-800">{j.title}</span>
              <span className="block text-[11px] text-slate-400">{j.customer} · {j.address}</span>
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

function MapView({ rows, onSelect, selectedId }: { rows: JobRow[]; onSelect: (j: JobRow) => void; selectedId?: string }) {
  return (
    <Panel pad={false} className="overflow-hidden">
      <LocationMap
        markers={rows.map((j) => ({ id: j.id, address: j.address, label: j.title, sublabel: j.address }))}
        height={256}
        selectedId={selectedId}
        onSelect={(id) => { const j = rows.find((r) => r.id === id); if (j) onSelect(j) }}
      />
      <ul className="divide-y divide-slate-100">
        {rows.map((j) => (
          <li key={j.id}><button onClick={() => onSelect(j)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 ${selectedId === j.id ? "bg-blue-50/50" : ""}`}>
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">{j.distanceMiles}</span>
            <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-slate-800 truncate">{j.title}</span><span className="block text-[11px] text-slate-400 truncate">{j.address}</span></span>
            <span className="text-[11px] text-slate-500 shrink-0">{clockTime(j.appointmentAt)}</span>
          </button></li>
        ))}
      </ul>
    </Panel>
  )
}

function KanbanView({ rows, onSelect, selectedId }: { rows: JobRow[]; onSelect: (j: JobRow) => void; selectedId?: string }) {
  const cols: { key: JobRow["status"]; title: string; accent: Accent }[] = [
    { key: "scheduled", title: "Scheduled", accent: "sky" },
    { key: "en_route", title: "En route", accent: "blue" },
    { key: "in_progress", title: "In progress", accent: "blue" },
    { key: "awaiting_signoff", title: "Sign-off", accent: "violet" },
    { key: "at_risk", title: "At risk", accent: "red" },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cols.map((c) => {
        const items = rows.filter((r) => r.status === c.key)
        return (
          <div key={c.key} className="bg-slate-50 border border-slate-200 rounded-[18px] p-2.5">
            <div className="flex items-center justify-between px-1 mb-2"><span className="text-[12px] font-semibold text-slate-700">{c.title}</span><Pill accent={c.accent}>{items.length}</Pill></div>
            <div className="space-y-2">
              {items.map((j) => (
                <button key={j.id} onClick={() => onSelect(j)} className={`w-full text-left bg-white border rounded-xl p-2.5 hover:shadow-sm ${selectedId === j.id ? "border-blue-400" : "border-slate-200"}`}>
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{j.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{j.customer}</p>
                </button>
              ))}
              {items.length === 0 && <p className="text-[11px] text-slate-300 px-1 py-2">None</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JobDetail({ j, onClose, toast }: { j: JobRow; onClose: () => void; toast: (m: string, t?: "info" | "success" | "warn") => void }) {
  return (
    <Panel pad={false} className="overflow-hidden">
      <div className="flex items-start justify-between gap-2 px-5 pt-5 pb-3 border-b border-slate-100">
        <div className="min-w-0"><h3 className="text-base font-semibold text-slate-900 truncate">{j.title}</h3><p className="text-[12px] text-slate-400">{j.customer} · {j.jobRef}</p></div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Route & ETA</p>
            <div className="h-28 rounded-xl bg-[linear-gradient(135deg,#f1f5f9_25%,#e2e8f0_25%,#e2e8f0_50%,#f1f5f9_50%,#f1f5f9_75%,#e2e8f0_75%)] bg-[length:18px_18px] border border-slate-200 flex items-center justify-center">
              <span className="text-[11px] text-slate-500 inline-flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> {j.distanceMiles} mi · ETA {j.etaMinutes}m</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1 flex items-center gap-1"><KeyRound className="w-3 h-3" /> Access & instructions</p>
            <p className="text-sm text-slate-600">{j.accessInstructions}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Customer contact</p>
            <p className="text-sm font-semibold text-slate-800">{j.contactName}</p>
            <a href={`tel:${j.contactPhone}`} className="text-[12px] font-medium text-blue-600 inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {j.contactPhone}</a>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Evidence checklist</p>
            <ul className="space-y-1.5">
              {j.evidenceChecklist.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  {e.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 shrink-0" />}
                  <span className={e.done ? "text-slate-500 line-through" : "text-slate-700"}>{e.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => toast("Job started (demo)", "success")} className="inline-flex items-center justify-center gap-1.5 bg-[#2563EB] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1d4ed8]"><Play className="w-4 h-4" /> Start job</button>
            <button onClick={() => toast("Evidence uploader coming soon", "info")} className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-50"><Upload className="w-4 h-4" /> Upload evidence</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => toast("Opening conversation (demo)", "info")} className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-[12px] font-semibold hover:bg-slate-50"><MessageSquare className="w-3.5 h-3.5" /> Message</button>
              <button onClick={() => toast("Sign-off requested (demo)", "success")} className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-[12px] font-semibold hover:bg-slate-50"><Send className="w-3.5 h-3.5" /> Sign-off</button>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
