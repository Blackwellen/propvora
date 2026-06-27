"use client"

import { useState } from "react"
import LocationMap from "@/components/maps/LocationMap"
import {
  Inbox, Clock, TrendingUp, Target, HelpCircle, MapPin, LayoutGrid, List,
  Map as MapIcon, Columns3, Send, FileText, CalendarDays, Building2, X,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import {
  KpiRow, Panel, ScoreRing, ViewToggle, Pill, useToast,
  OverviewSkeleton, OverviewError, OverviewEmpty,
  type OverviewKpi, type Accent, type ViewOption,
} from "../ui/primitives"
import { shortDate, dueIn } from "../ui/util"
import { useRequestsData } from "../data/hooks"
import type { RequestRow } from "../data/types"

const VIEWS: ViewOption[] = [
  { key: "cards", label: "Cards", icon: LayoutGrid },
  { key: "list", label: "List", icon: List },
  { key: "map", label: "Map", icon: MapIcon },
  { key: "kanban", label: "Kanban", icon: Columns3 },
]

const URGENCY: Record<string, Accent> = { low: "slate", normal: "sky", high: "amber", emergency: "red" }

export function RequestsTab() {
  const { data, loading, error, reload } = useRequestsData()
  const { toast } = useToast()
  const [view, setView] = useState("cards")
  const [selected, setSelected] = useState<RequestRow | null>(null)

  if (loading) return <OverviewSkeleton />
  if (error && !data) return <OverviewError onRetry={reload} />
  if (!data) return null

  const k = data.kpis
  const cur = data.rows[0]?.currency ?? "GBP"

  const kpis: OverviewKpi[] = [
    { id: "open", label: "Open requests", value: k.openRequests, icon: Inbox, accent: "blue" },
    { id: "due", label: "Response due today", value: k.responseDueToday, sub: "Due within 24h", subAccent: "amber", icon: Clock, accent: "amber" },
    { id: "val", label: "Potential value", value: formatPence(k.potentialValuePence, cur), sub: "Total pipeline", icon: TrendingUp, accent: "emerald" },
    { id: "win", label: "Avg win chance", value: k.avgWinChancePct > 0 ? `${k.avgWinChancePct}%` : "—", icon: Target, accent: "violet" },
    { id: "q", label: "Questions awaiting", value: k.questionsAwaiting, sub: "Needs your input", icon: HelpCircle, accent: "sky" },
  ]

  return (
    <div className="space-y-5">
      <KpiRow kpis={kpis} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Opportunities</h2>
        <ViewToggle options={VIEWS} active={view} onChange={setView} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div>
          {data.rows.length === 0 ? (
            <Panel><OverviewEmpty title="No open requests" description="New quote requests in your service areas will appear here." /></Panel>
          ) : view === "kanban" ? (
            <KanbanView rows={data.rows} onSelect={setSelected} selectedId={selected?.id} />
          ) : view === "map" ? (
            <MapView rows={data.rows} onSelect={setSelected} selectedId={selected?.id} />
          ) : view === "list" ? (
            <ListView rows={data.rows} onSelect={setSelected} selectedId={selected?.id} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.rows.map((r) => <RequestCard key={r.id} r={r} onSelect={setSelected} selected={selected?.id === r.id} />)}
            </div>
          )}
        </div>

        {/* Right detail panel */}
        <aside>
          {selected ? (
            <DetailPanel r={selected} onClose={() => setSelected(null)} toast={toast} />
          ) : (
            <Panel>
              <div className="flex flex-col items-center text-center py-8">
                <span className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3"><FileText className="w-6 h-6" /></span>
                <p className="text-sm font-semibold text-slate-700">Select a request</p>
                <p className="text-[12px] text-slate-400 max-w-[220px] mt-1">Pick an opportunity to see the brief, budget and required documents.</p>
              </div>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  )
}

function WinRing({ pct }: { pct: number }) {
  const accent: Accent = pct >= 70 ? "emerald" : pct >= 50 ? "amber" : "slate"
  return <ScoreRing pct={pct} size={44} stroke={5} accent={accent} label={`${pct}`} />
}

function RequestCard({ r, onSelect, selected }: { r: RequestRow; onSelect: (r: RequestRow) => void; selected: boolean }) {
  const due = dueIn(r.responseDueAt)
  return (
    <button
      type="button"
      onClick={() => onSelect(r)}
      className={`text-left bg-white border rounded-[18px] shadow-sm p-4 transition-all hover:shadow-md ${selected ? "border-[var(--color-brand-400)] ring-2 ring-[var(--color-brand-100)]" : "border-slate-200 hover:border-slate-300"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-900 truncate">{r.property}</p>
            {r.isNew && <Pill accent="blue">New</Pill>}
          </div>
          <p className="text-[12px] text-slate-400 truncate flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.address}</p>
        </div>
        <WinRing pct={r.winChancePct} />
      </div>
      <p className="mt-2 text-sm font-medium text-slate-700">{r.service}</p>
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <Pill accent={URGENCY[r.urgency]}>{r.urgency}</Pill>
        <span className={`text-[11px] font-semibold ${due.overdue ? "text-red-600" : "text-slate-500"}`}>{due.label}</span>
        <span className="text-[11px] text-slate-400">· {r.distanceMiles} mi</span>
        <span className="ml-auto text-sm font-bold text-slate-900">{formatPence(r.estValuePence, r.currency)}</span>
      </div>
    </button>
  )
}

function ListView({ rows, onSelect, selectedId }: { rows: RequestRow[]; onSelect: (r: RequestRow) => void; selectedId?: string }) {
  return (
    <Panel pad={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Urgency</th>
              <th className="px-4 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 font-semibold text-right">Value</th>
              <th className="px-4 py-3 font-semibold text-right">Win</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const due = dueIn(r.responseDueAt)
              return (
                <tr key={r.id} onClick={() => onSelect(r)} className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${selectedId === r.id ? "bg-[var(--brand-soft)]/50" : ""}`}>
                  <td className="px-4 py-3"><span className="font-semibold text-slate-800">{r.property}</span><span className="block text-[11px] text-slate-400">{r.address}</span></td>
                  <td className="px-4 py-3 text-slate-600">{r.service}</td>
                  <td className="px-4 py-3"><Pill accent={URGENCY[r.urgency]}>{r.urgency}</Pill></td>
                  <td className={`px-4 py-3 font-medium ${due.overdue ? "text-red-600" : "text-slate-500"}`}>{due.label}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatPence(r.estValuePence, r.currency)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">{r.winChancePct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function KanbanView({ rows, onSelect, selectedId }: { rows: RequestRow[]; onSelect: (r: RequestRow) => void; selectedId?: string }) {
  const cols: { key: RequestRow["urgency"]; title: string; accent: Accent }[] = [
    { key: "emergency", title: "Emergency", accent: "red" },
    { key: "high", title: "High", accent: "amber" },
    { key: "normal", title: "Normal", accent: "sky" },
    { key: "low", title: "Low", accent: "slate" },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cols.map((c) => {
        const items = rows.filter((r) => r.urgency === c.key)
        return (
          <div key={c.key} className="bg-slate-50 border border-slate-200 rounded-[18px] p-2.5">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[12px] font-semibold text-slate-700">{c.title}</span>
              <Pill accent={c.accent}>{items.length}</Pill>
            </div>
            <div className="space-y-2">
              {items.map((r) => (
                <button key={r.id} onClick={() => onSelect(r)} className={`w-full text-left bg-white border rounded-xl p-2.5 hover:shadow-sm ${selectedId === r.id ? "border-[var(--color-brand-400)]" : "border-slate-200"}`}>
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{r.property}</p>
                  <p className="text-[11px] text-slate-400 truncate">{r.service}</p>
                  <p className="mt-1 text-[12px] font-bold text-slate-900">{formatPence(r.estValuePence, r.currency)}</p>
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

function MapView({ rows, onSelect, selectedId }: { rows: RequestRow[]; onSelect: (r: RequestRow) => void; selectedId?: string }) {
  return (
    <Panel pad={false} className="overflow-hidden">
      <LocationMap
        markers={rows.map((r) => ({ id: r.id, address: r.address, label: r.property, sublabel: r.address }))}
        height={288}
        selectedId={selectedId}
        onSelect={(id) => { const r = rows.find((x) => x.id === id); if (r) onSelect(r) }}
      />
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.id}>
            <button onClick={() => onSelect(r)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 ${selectedId === r.id ? "bg-[var(--brand-soft)]/50" : ""}`}>
              <span className="w-6 h-6 rounded-full bg-[var(--color-brand-100)] text-[var(--brand)] text-[11px] font-bold flex items-center justify-center shrink-0">{r.distanceMiles}</span>
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-slate-800 truncate">{r.property}</span><span className="block text-[11px] text-slate-400 truncate">{r.service}</span></span>
              <span className="text-sm font-bold text-slate-900 shrink-0">{formatPence(r.estValuePence, r.currency)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function DetailPanel({ r, onClose, toast }: { r: RequestRow; onClose: () => void; toast: (m: string, t?: "info" | "success" | "warn") => void }) {
  return (
    <Panel pad={false} className="overflow-hidden sticky top-4">
      <div className="flex items-start justify-between gap-2 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5"><h3 className="text-base font-semibold text-slate-900 truncate">{r.property}</h3>{r.isNew && <Pill accent="blue">New</Pill>}</div>
          <p className="text-[12px] text-slate-400">{r.service}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
      </div>
      <div className="px-5 pb-5 space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Issue summary</p>
          <p className="text-sm text-slate-600">{r.summary}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field icon={TrendingUp} label="Budget range" value={`${formatPence(r.budgetMinPence, r.currency)} – ${formatPence(r.budgetMaxPence, r.currency)}`} />
          <Field icon={CalendarDays} label="Preferred date" value={shortDate(r.preferredDate)} />
          <Field icon={MapPin} label="Distance" value={`${r.distanceMiles} mi`} />
          <Field icon={Building2} label="Requester" value={r.requesterCompany} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Required documents</p>
          <div className="flex flex-wrap gap-1.5">{r.requiredDocuments.map((d) => <Pill key={d} accent="slate">{d}</Pill>)}</div>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={() => toast("Quote composer opening soon", "info")} className="inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[var(--brand-strong)]">
            <Send className="w-4 h-4" /> Send quote
          </button>
          <button onClick={() => toast("Question sent to requester (demo)", "success")} className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
            <HelpCircle className="w-4 h-4" /> Ask a question
          </button>
          <button onClick={() => toast("More actions: save, share, decline (TODO backend)", "info")} className="text-[12px] font-medium text-slate-500 hover:text-slate-700 py-1">More actions</button>
        </div>
      </div>
    </Panel>
  )
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-2.5">
      <p className="text-[11px] text-slate-400 flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
      <p className="text-[13px] font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
  )
}
