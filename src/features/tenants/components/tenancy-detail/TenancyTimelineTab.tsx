import React from "react"
import { Activity } from "lucide-react"
import { TenancySectionCard } from "./TenancySectionCard"

interface ActivityRow {
  id: string
  action: string | null
  description: string | null
  created_at: string
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

interface TenancyTimelineTabProps {
  events: ActivityRow[]
  loaded: boolean
}

export function TenancyTimelineTab({ events, loaded }: TenancyTimelineTabProps) {
  if (events.length === 0) {
    return (
      <div className="mt-4">
        <TenancySectionCard className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-600">
              {loaded ? "No timeline events yet" : "Loading timeline…"}
            </p>
            <p className="text-[12px] text-slate-500 mt-1">Lifecycle events for this tenancy will appear here.</p>
          </div>
        </TenancySectionCard>
      </div>
    )
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <TenancySectionCard className="p-6">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
          <div className="flex flex-col gap-0">
            {events.map((ev) => (
              <div key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white bg-blue-500">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="flex-1 pt-1 pb-0.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-900">{ev.action ?? "Activity"}</span>
                    <span className="text-xs text-slate-500 tabular-nums">{fmtDate(ev.created_at)}</span>
                  </div>
                  {ev.description && <p className="text-sm text-slate-600">{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </TenancySectionCard>
    </div>
  )
}
