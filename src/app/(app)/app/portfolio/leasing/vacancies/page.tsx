"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Download,
  BedDouble,
  Users,
  Clock,
  Eye,
  Pencil,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import MobileTopBar from "@/components/mobile/MobileTopBar"

/* ─── Types ───────────────────────────────────────────────────── */
type VacancyStatus = "Draft" | "Active" | "Under Offer" | "Let"

interface Portal {
  label: string
  short: string
  listed: boolean
}

interface Vacancy {
  id: string
  address: string
  type: string
  bedrooms: number | null
  furnished: string
  availableFrom: string
  rent: string
  status: VacancyStatus
  portals: Portal[]
  prospectCount: number
  daysListed: number
}

/* ─── Mock data ───────────────────────────────────────────────── */
const VACANCIES: Vacancy[] = []

const STATUS_FILTERS: { key: VacancyStatus | "All"; label: string }[] = [
  { key: "All",         label: "All" },
  { key: "Draft",       label: "Draft" },
  { key: "Active",      label: "Active" },
  { key: "Under Offer", label: "Under Offer" },
  { key: "Let",         label: "Let" },
]

const statusStyle: Record<VacancyStatus, string> = {
  "Draft":       "bg-slate-50 text-slate-700 border-slate-200",
  "Active":      "bg-blue-50 text-blue-700 border-blue-200",
  "Under Offer": "bg-amber-50 text-amber-700 border-amber-200",
  "Let":         "bg-green-50 text-green-700 border-green-200",
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function VacanciesPage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<VacancyStatus | "All">("All")

  const filtered = activeFilter === "All" ? VACANCIES : VACANCIES.filter((v) => v.status === activeFilter)

  return (
    <>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Vacancies"
        subtitle={`${VACANCIES.length} total vacancies`}
        showBack
        backHref="/property-manager/portfolio/leasing"
        primaryAction={{ label: "New vacancy", icon: Plus, onClick: () => {} }}
      />

      {/* Page header — hidden on phones */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Vacancies</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">{VACANCIES.length} total vacancies</p>
          </div>
          <button className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            New Vacancy
          </button>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 mt-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                "text-xs font-medium px-3 py-1 rounded-full border transition-colors",
                activeFilter === f.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-6 space-y-6 px-4 md:px-0">
        {/* Mobile filter row */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto -mx-1 px-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap shrink-0",
                activeFilter === f.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
            <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-[13px] font-medium text-slate-600">No vacancies yet</p>
            <p className="text-[12px] text-slate-400 mt-1">Create a vacancy to start listing properties and tracking prospects.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Top */}
              <div className="px-4 pt-4 pb-3 border-b border-slate-50 flex items-center justify-between">
                <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {v.type}
                </span>
                <span className={cn("border px-2 py-0.5 rounded-full text-[11px] font-medium", statusStyle[v.status])}>
                  {v.status}
                </span>
              </div>

              <div className="px-4 py-3">
                {/* Address */}
                <h3 className="text-[15px] font-bold text-slate-900 leading-tight">{v.address}</h3>

                {/* Key details */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {v.bedrooms !== null && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <BedDouble className="w-3.5 h-3.5" />{v.bedrooms} bed
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500">{v.furnished}</span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {v.availableFrom === "Now" ? <span className="text-green-600 font-medium">Available Now</span> : v.availableFrom}
                  </span>
                </div>

                {/* Rent */}
                <p className="text-xl font-bold text-blue-600 mt-2">{v.rent}</p>

                {/* Portal status */}
                <div className="flex items-center gap-2 mt-3">
                  {v.portals.map((portal) => (
                    <div key={portal.short} className={cn(
                      "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border",
                      portal.listed
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    )}>
                      {portal.listed
                        ? <CheckCircle2 className="w-2.5 h-2.5" />
                        : <XCircle className="w-2.5 h-2.5" />
                      }
                      {portal.short}
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    {v.prospectCount} prospect{v.prospectCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {v.daysListed} day{v.daysListed !== 1 ? "s" : ""} listed
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button className="flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  <button className="flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <div className="ml-auto">
                    <ActionMenu
                      align="right"
                      items={[
                        { label: "View listing", icon: Eye, onClick: () => {} },
                        { label: "Schedule viewing", icon: CalendarDays, onClick: () => {} },
                        { label: "Mark as let", icon: CheckCircle2, onClick: () => {} },
                        { label: "Remove listing", icon: Trash2, onClick: () => {}, variant: "danger" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Portal Export info card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-5">
          <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800">Portal Export</h3>
              <p className="text-[12px] text-slate-500 mt-1 max-w-2xl">
                Rightmove doesn&apos;t offer a direct API. Download property data feeds to upload to your portal dashboards.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" />
                Export Rightmove BLM
              </button>
              <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" />
                Export Zoopla RTDF
              </button>
              <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" />
                Export OnTheMarket XML
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
