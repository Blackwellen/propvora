"use client"
import React, { useState } from "react"
import {
  Plus,
  LayoutGrid,
  List,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

/* ─── Types ───────────────────────────────────────────────────── */
type ProspectStatus =
  | "New"
  | "Contacted"
  | "Viewing Scheduled"
  | "Viewing Done"
  | "Referencing"
  | "Offered"
  | "Accepted"

interface Prospect {
  id: string
  initials: string
  name: string
  email: string
  phone: string
  property: string
  source: string
  status: ProspectStatus
  moveInDate: string
  budget: string
  daysInPipeline: number
  timeInStage: string
}

/* ─── Mock data ───────────────────────────────────────────────── */
const PROSPECTS: Prospect[] = []

const PIPELINE_COLUMNS: { status: ProspectStatus; color: string }[] = [
  { status: "New",               color: "slate"  },
  { status: "Contacted",         color: "blue"   },
  { status: "Viewing Scheduled", color: "indigo" },
  { status: "Viewing Done",      color: "purple" },
  { status: "Referencing",       color: "amber"  },
  { status: "Offered",           color: "orange" },
  { status: "Accepted",          color: "green"  },
]

const STATUS_FILTERS: ProspectStatus[] = [
  "New", "Contacted", "Viewing Scheduled", "Viewing Done", "Referencing", "Offered", "Accepted",
]

const sourceColor: Record<string, string> = {
  Rightmove: "bg-red-50 text-red-700 border-red-200",
  Zoopla:    "bg-purple-50 text-purple-700 border-purple-200",
  Direct:    "bg-blue-50 text-blue-700 border-blue-200",
  Referral:  "bg-green-50 text-green-700 border-green-200",
  OTM:       "bg-orange-50 text-orange-700 border-orange-200",
}

const columnHeaderBg: Record<string, string> = {
  slate:  "bg-slate-50 text-slate-700 border-slate-200",
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  green:  "bg-green-50 text-green-700 border-green-200",
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
]

/* ─── Page ────────────────────────────────────────────────────── */
export default function ProspectsPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban")
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "All">("All")

  const filtered = statusFilter === "All" ? PROSPECTS : PROSPECTS.filter((p) => p.status === statusFilter)

  /* Row → card mapping for the mobile list (table view). */
  const prospectCardMapping: MobileCardMapping<Prospect> = {
    getKey: (p) => p.id,
    title: (p) => p.name,
    subtitle: (p) => p.property,
    leading: (p) => {
      const idx = PROSPECTS.findIndex((x) => x.id === p.id)
      return (
        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0", avatarColors[idx % avatarColors.length])}>
          {p.initials}
        </div>
      )
    },
    badge: (p) => (
      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
        {p.status}
      </span>
    ),
    fields: [
      { label: "Source", render: (p) => p.source },
      { label: "Move-in", render: (p) => p.moveInDate },
      { label: "Budget", render: (p) => p.budget },
      { label: "Days", render: (p) => `${p.daysInPipeline}d` },
    ],
  }

  return (
    <>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Prospects"
        subtitle={`${PROSPECTS.length} in pipeline`}
        showBack
        backHref="/property-manager/portfolio/leasing"
        primaryAction={{ label: "Add prospect", icon: Plus, onClick: () => {} }}
        overflowActions={[
          { label: view === "kanban" ? "Table view" : "Kanban view", icon: view === "kanban" ? List : LayoutGrid, onClick: () => setView(view === "kanban" ? "table" : "kanban") },
        ]}
      />

      {/* Page header — hidden on phones */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Prospects</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">{PROSPECTS.length} active prospects in pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("kanban")}
                className={cn("px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors", view === "kanban" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kanban
              </button>
              <button
                onClick={() => setView("table")}
                className={cn("px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors", view === "table" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50")}
              >
                <List className="w-3.5 h-3.5" />
                Table
              </button>
            </div>
            <button className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add Prospect
            </button>
          </div>
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setStatusFilter("All")}
            className={cn("text-xs font-medium px-3 py-1 rounded-full border whitespace-nowrap transition-colors", statusFilter === "All" ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
          >
            All ({PROSPECTS.length})
          </button>
          {STATUS_FILTERS.map((s) => {
            const count = PROSPECTS.filter((p) => p.status === s).length
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn("text-xs font-medium px-3 py-1 rounded-full border whitespace-nowrap transition-colors", statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
              >
                {s} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile filter row */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => setStatusFilter("All")}
          className={cn("text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-colors", statusFilter === "All" ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600")}
        >
          All ({PROSPECTS.length})
        </button>
        {STATUS_FILTERS.map((s) => {
          const count = PROSPECTS.filter((p) => p.status === s).length
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn("text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-colors", statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600")}
            >
              {s} ({count})
            </button>
          )
        })}
      </div>

      <div className="py-6 px-4 md:px-0">
        {view === "kanban" ? (
          /* Kanban */
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-3 min-w-max pb-2">
              {PIPELINE_COLUMNS.map((col) => {
                const colProspects = PROSPECTS.filter((p) => p.status === col.status)
                return (
                  <div key={col.status} className="w-52 shrink-0">
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border mb-2 text-[12px] font-semibold", columnHeaderBg[col.color])}>
                      <span className="truncate">{col.status}</span>
                      <span className="ml-auto font-bold text-[11px]">{colProspects.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colProspects.length === 0 && (
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                          <p className="text-[11px] text-slate-500">Empty</p>
                        </div>
                      )}
                      {colProspects.map((p, idx) => (
                        <div
                          key={p.id}
                          className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", avatarColors[idx % avatarColors.length])}>
                              {p.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-slate-800 truncate">{p.name}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">{p.property}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className={cn("border px-1.5 py-0.5 rounded text-[10px] font-medium", sourceColor[p.source] ?? "bg-slate-50 text-slate-500 border-slate-200")}>
                              {p.source}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-500 ml-auto">
                              <Clock className="w-2.5 h-2.5" />{p.timeInStage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Table */
          <ResponsiveTable rows={filtered} mobile={prospectCardMapping}>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Property</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Move-in</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Budget</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Days</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-[12px] text-slate-400">
                      No prospects yet. Add a vacancy to start tracking enquiries.
                    </td>
                  </tr>
                )}
                {filtered.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", avatarColors[idx % avatarColors.length])}>
                          {p.initials}
                        </div>
                        <span className="text-[12px] font-semibold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] text-slate-600">{p.email}</p>
                      <p className="text-[11px] text-slate-500">{p.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600 max-w-[160px] truncate">{p.property}</td>
                    <td className="px-4 py-3">
                      <span className={cn("border px-2 py-0.5 rounded-full text-[10px] font-medium", sourceColor[p.source] ?? "bg-slate-50 text-slate-500 border-slate-200")}>
                        {p.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">{p.moveInDate}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">{p.budget}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">{p.daysInPipeline}d</td>
                    <td className="px-4 py-3">
                      <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          </ResponsiveTable>
        )}
      </div>
    </>
  )
}

