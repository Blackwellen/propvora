"use client"

import Link from "next/link"
import { CalendarDays, Eye, Wrench, Users, MessageSquare } from "lucide-react"
import type { HomeEvent } from "../types"

interface HomeUpcomingCardProps {
  events: HomeEvent[]
}

type EventType = "inspection" | "tenancy" | "meeting" | "maintenance" | string

function EventTypeBadge({ type }: { type: EventType }) {
  const styles: Record<string, string> = {
    inspection: "bg-[var(--brand-soft)] text-[var(--brand)]",
    tenancy: "bg-emerald-50 text-emerald-700",
    meeting: "bg-violet-50 text-violet-700",
    maintenance: "bg-orange-50 text-orange-700",
    default: "bg-slate-100 text-slate-600",
  }
  const labels: Record<string, string> = {
    inspection: "Inspection",
    tenancy: "Tenancy",
    meeting: "Meeting",
    maintenance: "Maintenance",
    event: "Event",
  }
  const cls = styles[type] ?? styles.default
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium flex-shrink-0 ${cls}`}>
      {labels[type] ?? "Event"}
    </span>
  )
}

function EventIcon({ type }: { type: EventType }) {
  const icons: Record<string, typeof CalendarDays> = {
    inspection: Eye,
    tenancy: Users,
    meeting: MessageSquare,
    maintenance: Wrench,
  }
  const Icon = icons[type] ?? CalendarDays
  const bgs: Record<string, string> = {
    inspection: "bg-[var(--brand-soft)] text-[var(--brand)]",
    tenancy: "bg-emerald-50 text-emerald-600",
    meeting: "bg-violet-50 text-violet-600",
    maintenance: "bg-orange-50 text-orange-600",
    default: "bg-slate-50 text-slate-500",
  }
  const cls = bgs[type] ?? bgs.default
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
      <Icon style={{ width: 14, height: 14 }} />
    </div>
  )
}

export function HomeUpcomingCard({ events }: HomeUpcomingCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-900">Upcoming</h3>
        <Link href="/property-manager/calendar" className="text-[12px] font-medium text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
          Calendar →
        </Link>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-6">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
              <CalendarDays className="text-slate-300" style={{ width: 20, height: 20 }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-slate-600">No upcoming events</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Schedule events in your calendar</p>
            </div>
            <Link href="/property-manager/calendar" className="text-[12px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
              Open calendar →
            </Link>
          </div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={event.href ?? `/property-manager/calendar/events/${event.id}`}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <EventIcon type={event.eventType ?? "default"} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-slate-800 truncate group-hover:text-[var(--brand)] transition-colors">
                  {event.title}
                </p>
                <p className="text-[11px] text-slate-400">{event.subtitle}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="text-center bg-slate-50 rounded-lg px-2 py-1 min-w-[36px]">
                  <p className="text-[12px] font-bold text-slate-800 leading-tight">{event.day}</p>
                  <p className="text-[9px] text-slate-400 uppercase">{event.month}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {events.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <Link href="/property-manager/calendar" className="text-[12px] font-medium text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
            View full calendar →
          </Link>
        </div>
      )}
    </div>
  )
}
