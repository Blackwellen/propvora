"use client"

import React from "react"
import { PoundSterling, Wrench, FileText, Star, Activity } from "lucide-react"
import { Card, fmtDate, type ActivityRow } from "./shared"

export function ActivityTab({ events, loaded }: { events: ActivityRow[]; loaded: boolean }) {
  // Group by calendar day
  const grouped: Record<string, ActivityRow[]> = {}
  for (const e of events) {
    const key = fmtDate(e.created_at)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  }

  const typeIcon = (type: string | null) => {
    const t = (type ?? "").toLowerCase()
    if (t.includes("payment") || t.includes("money") || t.includes("invoice")) return <PoundSterling size={13} />
    if (t.includes("job") || t.includes("task") || t.includes("work") || t.includes("maintenance")) return <Wrench size={13} />
    if (t.includes("document") || t.includes("file")) return <FileText size={13} />
    if (t.includes("note")) return <Star size={13} />
    return <Activity size={13} />
  }

  if (events.length === 0) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Activity size={26} className="text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">{loaded ? "No activity yet" : "Loading activity…"}</p>
          <p className="text-[12px] text-slate-500 mt-1">Actions taken on this property and its units, tenancies and work will appear here.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">{date}</p>
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white bg-[var(--brand)]">
                  {typeIcon(item.entity_type ?? item.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-800">{item.description ?? item.action ?? "Activity"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500">{new Date(item.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    {item.entity_type && (<><span className="text-slate-300">·</span><span className="text-[11px] text-slate-500 font-medium capitalize">{item.entity_type}</span></>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
