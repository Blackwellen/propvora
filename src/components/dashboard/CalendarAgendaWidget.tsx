"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import {
  Calendar,
  ArrowRight,
  Wrench,
  Users,
  FileText,
  AlertCircle,
  Key,
  Building2,
} from "lucide-react"

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: "inspection" | "maintenance" | "viewing" | "meeting" | "renewal" | "compliance" | "other"
}

const typeConfig = {
  inspection: { icon: Building2, color: "text-[#2563EB]", bg: "bg-blue-50", label: "Inspection" },
  maintenance: { icon: Wrench, color: "text-[#F59E0B]", bg: "bg-amber-50", label: "Maintenance" },
  viewing: { icon: Key, color: "text-[#10B981]", bg: "bg-emerald-50", label: "Viewing" },
  meeting: { icon: Users, color: "text-[#7C3AED]", bg: "bg-violet-50", label: "Meeting" },
  renewal: { icon: FileText, color: "text-[#0EA5E9]", bg: "bg-sky-50", label: "Renewal" },
  compliance: { icon: AlertCircle, color: "text-[#EF4444]", bg: "bg-red-50", label: "Compliance" },
  other: { icon: Calendar, color: "text-slate-500", bg: "bg-slate-50", label: "Other" },
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow"
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

export function CalendarAgendaWidget({ events }: { events: CalendarEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Upcoming</h3>
          <p className="text-xs text-slate-500">Next 7 days</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <Calendar className="w-8 h-8 text-slate-200" />
          <p className="text-sm text-slate-400">Nothing scheduled</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.slice(0, 6).map((event) => {
            const config = typeConfig[event.type]
            const Icon = config.icon
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors duration-150"
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
                  <p className="text-xs text-slate-400">{config.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-slate-600">{formatEventDate(event.date)}</p>
                  {event.time && <p className="text-xs text-slate-400">{event.time}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <Button variant="ghost" size="sm" asChild className="w-full justify-center text-[#2563EB] hover:bg-blue-50">
          <Link href="/app/calendar">
            View calendar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
