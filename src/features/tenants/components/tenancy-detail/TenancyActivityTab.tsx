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

interface TenancyActivityTabProps {
  events: ActivityRow[]
  loaded: boolean
}

export function TenancyActivityTab({ events, loaded }: TenancyActivityTabProps) {
  if (events.length === 0) {
    return (
      <div className="mt-4">
        <TenancySectionCard className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-600">
              {loaded ? "No activity yet" : "Loading activity…"}
            </p>
            <p className="text-[12px] text-slate-500 mt-1">Actions taken on this tenancy will appear here.</p>
          </div>
        </TenancySectionCard>
      </div>
    )
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <TenancySectionCard className="p-6">
        <div className="flex flex-col gap-0">
          {events.map((a, i) => (
            <div key={a.id} className="flex gap-4 pb-5 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1 bg-blue-500" />
                {i < events.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{a.action ?? "Activity"}</span>
                    {a.description && <span className="text-sm text-slate-600 ml-2">— {a.description}</span>}
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmtDate(a.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TenancySectionCard>
    </div>
  )
}
