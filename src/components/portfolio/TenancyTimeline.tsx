"use client"

import React from "react"
import {
  CheckCircle2, Circle, Clock, FileText, Home, DollarSign,
  ClipboardList, RotateCcw, XCircle, Bell, MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export type TimelineStageStatus = "completed" | "current" | "upcoming" | "overdue" | "pending"

export interface TimelineStage {
  id: string
  label: string
  date: string | null
  status: TimelineStageStatus
  icon?: React.ElementType
  detail?: string
}

interface TenancyTimelineProps {
  stages: TimelineStage[]
  currentStageDetail?: {
    label: string
    date: string
    message: string
    action?: { label: string; onClick?: () => void }
  }
  className?: string
}

/* ------------------------------------------------------------------ */
/* Default stage icons                                                  */
/* ------------------------------------------------------------------ */
const DEFAULT_ICONS: Record<string, React.ElementType> = {
  Application: FileText,
  Approved:    CheckCircle2,
  "Move-in":   Home,
  "Rent Due":  DollarSign,
  Inspection:  ClipboardList,
  Renewal:     RotateCcw,
  "End of Term": XCircle,
}

/* ------------------------------------------------------------------ */
/* Status node config                                                   */
/* ------------------------------------------------------------------ */
const NODE_CFG: Record<TimelineStageStatus, { ring: string; bg: string; icon: string; label: string; labelColor: string; dateColor: string }> = {
  completed: { ring: "border-emerald-500",  bg: "bg-emerald-500",  icon: "text-white",          label: "Completed", labelColor: "text-emerald-700",  dateColor: "text-emerald-600" },
  current:   { ring: "border-[#2563EB]",    bg: "bg-[#2563EB]",   icon: "text-white",          label: "Current",   labelColor: "text-[#2563EB]",    dateColor: "text-[#2563EB]" },
  upcoming:  { ring: "border-slate-300",    bg: "bg-white",       icon: "text-slate-300",      label: "Upcoming",  labelColor: "text-slate-400",    dateColor: "text-slate-400" },
  overdue:   { ring: "border-red-500",      bg: "bg-red-50",      icon: "text-red-500",        label: "Overdue",   labelColor: "text-red-700",      dateColor: "text-red-600" },
  pending:   { ring: "border-amber-400",    bg: "bg-amber-50",    icon: "text-amber-500",      label: "Pending",   labelColor: "text-amber-700",    dateColor: "text-amber-600" },
}

function fmtDate(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/* ------------------------------------------------------------------ */
/* Tenancy Timeline (reference section 5)                             */
/* ------------------------------------------------------------------ */
export function TenancyTimeline({ stages, currentStageDetail, className }: TenancyTimelineProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}>
      {/* ── Stage stepper ─────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start relative">
          {/* Connector line behind nodes */}
          <div className="absolute top-5 left-5 right-5 h-px bg-slate-200 z-0" />

          {stages.map((stage, i) => {
            const cfg = NODE_CFG[stage.status]
            const Icon = stage.icon ?? DEFAULT_ICONS[stage.label] ?? Circle
            const isLast = i === stages.length - 1

            return (
              <div
                key={stage.id}
                className={cn("flex flex-col items-center relative z-10 text-center", isLast ? "flex-none" : "flex-1")}
              >
                {/* Node circle */}
                <div className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all mb-2",
                  cfg.ring, cfg.bg,
                  stage.status === "current" && "shadow-lg shadow-blue-200 ring-4 ring-[#2563EB]/20",
                )}>
                  {stage.status === "completed" ? (
                    <CheckCircle2 className={cn("w-5 h-5", cfg.icon)} />
                  ) : stage.status === "overdue" ? (
                    <Clock className={cn("w-4.5 h-4.5", cfg.icon)} />
                  ) : (
                    <Icon className={cn("w-4 h-4", cfg.icon)} />
                  )}
                </div>

                {/* Label */}
                <p className={cn("text-[11px] font-bold leading-tight whitespace-nowrap", cfg.labelColor)}>
                  {stage.label}
                </p>

                {/* Date */}
                {stage.date && (
                  <p className={cn("text-[10px] mt-0.5", cfg.dateColor)}>
                    {fmtDate(stage.date)}
                  </p>
                )}

                {/* Status sub-label */}
                <p className="text-[10px] text-slate-300 mt-0.5 capitalize">{cfg.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Current stage detail card ─────────────────────────── */}
      {currentStageDetail && (
        <div className="mx-4 mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <p className="text-[13px] font-bold text-slate-900">{currentStageDetail.label}</p>
              <span className="text-[11px] text-slate-500">{fmtDate(currentStageDetail.date)}</span>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">{currentStageDetail.message}</p>
          </div>

          {currentStageDetail.action && (
            <button
              onClick={currentStageDetail.action.onClick}
              className="shrink-0 px-4 py-2 bg-[#2563EB] text-white text-[12px] font-bold rounded-xl hover:bg-[#1d4ed8] transition-colors shadow-sm"
            >
              {currentStageDetail.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Default tenancy stages builder                                       */
/* ------------------------------------------------------------------ */
export function buildTenancyStages(startDate: string, endDate: string | null): TimelineStage[] {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  const now = Date.now()

  const approved   = new Date(start); approved.setDate(approved.getDate() - 14)
  const moveIn     = new Date(start)
  const firstRent  = new Date(start); firstRent.setMonth(firstRent.getMonth() + 1)
  const inspection = new Date(start); inspection.setMonth(inspection.getMonth() + 3)
  const renewal    = end ? new Date(end.getTime() - 60 * 24 * 60 * 60 * 1000) : null

  function status(d: Date): TimelineStageStatus {
    if (d.getTime() < now - 86400000) return "completed"
    if (d.getTime() < now + 2 * 86400000) return "current"
    return "upcoming"
  }

  const stages: TimelineStage[] = [
    { id: "app",  label: "Application", date: approved.toISOString().slice(0, 10), status: "completed" },
    { id: "appr", label: "Approved",    date: approved.toISOString().slice(0, 10), status: "completed" },
    { id: "move", label: "Move-in",     date: moveIn.toISOString().slice(0, 10),   status: status(moveIn) },
    { id: "rent", label: "Rent Due",    date: firstRent.toISOString().slice(0, 10),status: status(firstRent) },
    { id: "insp", label: "Inspection",  date: inspection.toISOString().slice(0, 10),status: status(inspection) },
    { id: "renw", label: "Renewal",     date: renewal ? renewal.toISOString().slice(0, 10) : null, status: renewal ? status(renewal) : "upcoming" },
    { id: "end",  label: "End of Term", date: endDate ?? null, status: end ? (end.getTime() < now ? "completed" : "upcoming") : "upcoming" },
  ]

  return stages
}
