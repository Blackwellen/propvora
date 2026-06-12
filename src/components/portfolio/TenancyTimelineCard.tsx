"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight,
  CalendarCheck, Key, Home, FileText, RotateCcw, LogOut, Bell,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export type StageState = "completed" | "current" | "upcoming" | "overdue" | "pending"

export interface TenancyStage {
  key: string
  label: string
  date?: string | null
  state: StageState
  action?: string
  actionHref?: string
  icon?: React.ElementType
}

export interface TenancyTimelineCardData {
  id: string
  tenant_name?: string
  tenant_avatar?: string | null
  property_name?: string
  unit_name?: string
  stages: TenancyStage[]
  current_rent?: number
  reminder_text?: string
}

/* ------------------------------------------------------------------ */
/* Default stages builder (call with real tenancy data)               */
/* ------------------------------------------------------------------ */
export function buildTimelineStages(tenancy: {
  status: string
  start_date?: string | null
  end_date?: string | null
  notice_date?: string | null
  move_in_date?: string | null
  approved_date?: string | null
  inspection_date?: string | null
  renewal_date?: string | null
}): TenancyStage[] {
  const now = Date.now()

  function state(dateStr: string | null | undefined, isCurrentFn?: () => boolean): StageState {
    if (!dateStr) return "pending"
    const d = new Date(dateStr).getTime()
    if (d < now) return "completed"
    if (isCurrentFn?.()) return "current"
    return "upcoming"
  }

  return [
    {
      key: "application",
      label: "Application",
      date: tenancy.approved_date ?? null,
      state: tenancy.approved_date ? "completed" : tenancy.status === "pending" ? "current" : "upcoming",
      icon: FileText,
    },
    {
      key: "approved",
      label: "Approved",
      date: tenancy.approved_date ?? null,
      state: tenancy.approved_date ? "completed" : "upcoming",
      icon: CheckCircle2,
    },
    {
      key: "move_in",
      label: "Move-in",
      date: tenancy.move_in_date ?? tenancy.start_date ?? null,
      state: state(tenancy.move_in_date ?? tenancy.start_date),
      icon: Key,
    },
    {
      key: "rent_due",
      label: "Rent Due",
      date: null,
      state: tenancy.status === "active" ? "current" : "upcoming",
      icon: CalendarCheck,
      action: "Send reminder",
    },
    {
      key: "inspection",
      label: "Inspection",
      date: tenancy.inspection_date ?? null,
      state: tenancy.inspection_date
        ? (new Date(tenancy.inspection_date).getTime() < now ? "completed" : "upcoming")
        : "pending",
      icon: Home,
    },
    {
      key: "renewal",
      label: "Renewal",
      date: tenancy.renewal_date ?? null,
      state: tenancy.renewal_date
        ? (new Date(tenancy.renewal_date).getTime() < now - 30 * 86400000 ? "overdue" : "upcoming")
        : "pending",
      icon: RotateCcw,
    },
    {
      key: "end_of_term",
      label: "End of Term",
      date: tenancy.end_date ?? null,
      state: tenancy.end_date
        ? (new Date(tenancy.end_date).getTime() < now ? "completed" : "upcoming")
        : "upcoming",
      icon: LogOut,
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Stage dot                                                            */
/* ------------------------------------------------------------------ */
const STAGE_STYLE: Record<StageState, {
  dot: string; line: string; labelClass: string; dateClass: string
}> = {
  completed: {
    dot: "bg-[#2563EB] border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.15)]",
    line: "bg-[#2563EB]",
    labelClass: "text-slate-800 font-semibold",
    dateClass: "text-slate-500",
  },
  current: {
    dot: "bg-white border-[#2563EB] border-2 shadow-[0_0_0_3px_rgba(37,99,235,0.2)]",
    line: "bg-slate-200",
    labelClass: "text-[#2563EB] font-bold",
    dateClass: "text-[#2563EB]",
  },
  upcoming: {
    dot: "bg-white border-slate-300",
    line: "bg-slate-200",
    labelClass: "text-slate-500 font-medium",
    dateClass: "text-slate-400",
  },
  overdue: {
    dot: "bg-red-500 border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
    line: "bg-red-200",
    labelClass: "text-red-700 font-semibold",
    dateClass: "text-red-500",
  },
  pending: {
    dot: "bg-slate-100 border-slate-200",
    line: "bg-slate-100",
    labelClass: "text-slate-400 font-medium",
    dateClass: "text-slate-300",
  },
}

/* ------------------------------------------------------------------ */
/* TenancyTimelineCard                                                 */
/* ------------------------------------------------------------------ */
export function TenancyTimelineCard({ data }: { data: TenancyTimelineCardData }) {
  const stages = data.stages

  return (
    <article className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {data.tenant_name && (
            <p className="text-[13.5px] font-bold text-slate-900 truncate">{data.tenant_name}</p>
          )}
          {(data.property_name || data.unit_name) && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {data.property_name}{data.unit_name ? ` · ${data.unit_name}` : ""}
            </p>
          )}
        </div>
        {data.current_rent != null && (
          <div className="text-right shrink-0">
            <p className="text-[15px] font-black text-slate-900">
              {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(data.current_rent)}
            </p>
            <p className="text-[10px] text-slate-400">/mo</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex items-start gap-0 min-w-max">
          {stages.map((stage, i) => {
            const style = STAGE_STYLE[stage.state]
            const Icon = stage.icon
            const isLast = i === stages.length - 1

            return (
              <div key={stage.key} className="flex items-center">
                {/* Stage node */}
                <div className="flex flex-col items-center gap-1.5 w-20">
                  {/* Dot */}
                  <div className={cn(
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                    style.dot
                  )}>
                    {stage.state === "completed" && Icon
                      ? <Icon className="w-3.5 h-3.5 text-white" />
                      : stage.state === "overdue"
                      ? <AlertTriangle className="w-3 h-3 text-white" />
                      : stage.state === "current"
                      ? <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      : <Circle className="w-2.5 h-2.5 text-slate-300" />
                    }
                  </div>

                  {/* Label */}
                  <p className={cn("text-[10.5px] text-center leading-tight", style.labelClass)}>
                    {stage.label}
                  </p>

                  {/* Date */}
                  {stage.date && (
                    <p className={cn("text-[9.5px] text-center leading-tight", style.dateClass)}>
                      {new Date(stage.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  )}

                  {/* Action */}
                  {stage.action && stage.state === "current" && (
                    <button className="text-[9px] font-semibold text-white bg-[#2563EB] px-1.5 py-0.5 rounded-md hover:bg-[#1d4ed8] transition-colors whitespace-nowrap">
                      {stage.action}
                    </button>
                  )}
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className={cn("h-0.5 w-8 -mt-8 mx-0.5 rounded-full transition-all", style.line)} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer reminder */}
      {data.reminder_text && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <Bell className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
            <p className="text-[11px] text-[#1d4ed8] font-medium">{data.reminder_text}</p>
            {data.id && (
              <Link href={`/app/portfolio/tenancies/${data.id}`}
                className="ml-auto text-[10.5px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5">
                View <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
