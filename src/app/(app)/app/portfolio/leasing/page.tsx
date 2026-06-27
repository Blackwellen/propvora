"use client"
import React from "react"
import {
  Home,
  Users,
  Calendar,
  FileText,
  TrendingDown,
  Plus,
  CalendarDays,
  Clock,
} from "lucide-react"
import MobileTopBar from "@/components/mobile/MobileTopBar"

/* ─── Types ───────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: "blue" | "green" | "amber" | "orange"
}

interface VacancyCard {
  id: string
  address: string
  rent: string
  daysListed: number
  prospectCount: number
}

interface KanbanColumn {
  status: string
  color: string
  cards: VacancyCard[]
}

interface Prospect {
  id: string
  initials: string
  name: string
  property: string
  status: string
  statusColor: string
  source: string
  timeAgo: string
}

interface Viewing {
  id: string
  time: string
  property: string
  prospect: string
}

/* ─── Mock data ───────────────────────────────────────────────── */
const KANBAN_COLUMNS: KanbanColumn[] = [
  { status: "Draft",       color: "slate",  cards: [] },
  { status: "Active",      color: "blue",   cards: [] },
  { status: "Under Offer", color: "amber",  cards: [] },
  { status: "Let",         color: "green",  cards: [] },
]

const RECENT_PROSPECTS: Prospect[] = []

const TODAYS_VIEWINGS: Viewing[] = []

/* ─── Sub-components ──────────────────────────────────────────── */
const colorMap: Record<string, string> = {
  blue:   "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",
  green:  "bg-green-50 text-green-700 border-green-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  slate:  "bg-slate-50 text-slate-700 border-slate-200",
  red:    "bg-red-50 text-red-700 border-red-200",
}

const iconColorMap: Record<string, string> = {
  blue:   "bg-[var(--brand-soft)] text-[var(--brand)]",
  green:  "bg-green-50 text-green-600",
  amber:  "bg-amber-50 text-amber-600",
  orange: "bg-orange-50 text-orange-600",
}

function KpiCard({ label, value, icon: Icon, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      </div>
    </div>
  )
}

const columnHeaderColor: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  blue:  "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-green-50 text-green-700 border-green-200",
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function LeasingOverviewPage() {
  return (
    <>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Leasing Pipeline"
        subtitle="Vacancies, prospects & agreements"
        primaryAction={{ label: "New vacancy", icon: Plus, href: "/property-manager/portfolio/leasing/vacancies" }}
        overflowActions={[
          { label: "View calendar", icon: CalendarDays, href: "/property-manager/portfolio/leasing/viewings" },
        ]}
      />

      {/* Page header — hidden on phones */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Leasing Pipeline</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Track vacancies, prospects, and agreements in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
            <CalendarDays className="w-3.5 h-3.5" />
            View Calendar
          </button>
          <button className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            New Vacancy
          </button>
        </div>
      </div>

      <div className="py-6 space-y-6 px-4 md:px-0">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="Active Vacancies"              value="—" icon={Home}          color="blue"   />
          <KpiCard label="Active Prospects"              value="—" icon={Users}         color="green"  />
          <KpiCard label="Viewings This Week"            value="—" icon={Calendar}      color="amber"  />
          <KpiCard label="Agreements Pending Signature"  value="—" icon={FileText}      color="orange" />
          <KpiCard label="Average Days to Let"           value="—" icon={TrendingDown}  color="green"  />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Vacancy Kanban — col 1-5 */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-800">Vacancy Board</h2>
              <span className="text-[11px] text-slate-500">{KANBAN_COLUMNS.reduce((n, c) => n + c.cards.length, 0)} active</span>
            </div>
            <div className="p-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex gap-3 min-w-max">
                {KANBAN_COLUMNS.map((col) => (
                  <div key={col.status} className="w-44 shrink-0">
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border mb-2 ${columnHeaderColor[col.color]}`}>
                      <span className="text-[11px] font-semibold">{col.status}</span>
                      <span className="ml-auto text-[10px] font-bold">{col.cards.length}</span>
                    </div>
                    <div className="space-y-2">
                      {col.cards.length === 0 && (
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center">
                          <p className="text-[11px] text-slate-500">No vacancies</p>
                        </div>
                      )}
                      {col.cards.map((card) => (
                        <div
                          key={card.id}
                          className="bg-white border border-slate-200 rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <p className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">{card.address}</p>
                          <p className="text-[13px] font-bold text-[var(--brand)] mt-1">{card.rent}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock className="w-2.5 h-2.5" />{card.daysListed}d
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Users className="w-2.5 h-2.5" />{card.prospectCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Prospects — col 6-9 */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-800">Recent Prospects</h2>
              <a href="/property-manager/portfolio/leasing/prospects" className="text-[11px] text-[var(--brand)] hover:underline">View all</a>
            </div>
            <div className="divide-y divide-slate-50">
              {RECENT_PROSPECTS.length === 0 && (
                <p className="px-4 py-6 text-[12px] text-slate-400 text-center">No prospects yet. Add vacancies to start receiving enquiries.</p>
              )}
              {RECENT_PROSPECTS.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-brand-100)] text-[var(--brand)] flex items-center justify-center text-[11px] font-bold shrink-0">
                    {p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800">{p.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{p.property}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`border px-2 py-0.5 rounded-full text-[10px] font-medium ${colorMap[p.statusColor]}`}>
                        {p.status}
                      </span>
                      <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {p.source}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">{p.timeAgo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Viewings — col 10-12 */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-800">Today&apos;s Viewings</h2>
              <span className="text-[11px] text-slate-500">{TODAYS_VIEWINGS.length} today</span>
            </div>
            <div className="divide-y divide-slate-50">
              {TODAYS_VIEWINGS.length === 0 && (
                <p className="px-4 py-6 text-[12px] text-slate-400 text-center">No viewings scheduled today.</p>
              )}
              {TODAYS_VIEWINGS.map((v) => (
                <div key={v.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--brand)] bg-[var(--brand-soft)] px-2 py-0.5 rounded-md shrink-0">{v.time}</span>
                  </div>
                  <p className="text-[12px] font-medium text-slate-800 mt-1.5 leading-tight">{v.property}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{v.prospect}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-slate-100">
              <a href="/property-manager/portfolio/leasing/viewings" className="text-[11px] text-[var(--brand)] hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Add viewing
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

