"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  Plus,
  RefreshCw,
  CheckCircle2,
  Search,
  FolderOpen,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard } from "@/components/planning/shared"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets } from "@/hooks/usePlanningsets"
import { ProfileTag } from "@/components/planning/shared"
import { cn } from "@/lib/utils"

type EventType = "created" | "updated" | "converted"

interface ActivityItem {
  id: string
  setId: string
  type: EventType
  title: string
  setTitle: string
  profile: string
  at: string
  group: "today" | "yesterday" | "earlier"
}

function getConfig(type: EventType): { Icon: React.ElementType; colour: string; label: string } {
  switch (type) {
    case "created": return { Icon: Plus, colour: "#10B981", label: "Created" }
    case "converted": return { Icon: CheckCircle2, colour: "#7C3AED", label: "Converted" }
    default: return { Icon: RefreshCw, colour: "#2563EB", label: "Updated" }
  }
}

function groupOf(iso: string): "today" | "yesterday" | "earlier" {
  const d = new Date(iso)
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const t = d.getTime()
  if (t >= startToday) return "today"
  if (t >= startToday - 86400000) return "yesterday"
  return "earlier"
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
}

const GROUP_LABELS: Record<string, string> = { today: "Today", yesterday: "Yesterday", earlier: "Earlier" }

export default function ActivityPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: sets = [], isLoading } = usePlanningSets(workspace?.id)
  const [search, setSearch] = useState("")

  // Derive events from live set timestamps
  const events = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = []
    for (const s of sets) {
      list.push({
        id: `${s.id}-created`,
        setId: s.id,
        type: "created",
        title: "Planning set created",
        setTitle: s.title,
        profile: s.operation_profile,
        at: s.created_at,
        group: groupOf(s.created_at),
      })
      // Only show an "updated" event if it's meaningfully after creation
      if (s.updated_at && new Date(s.updated_at).getTime() - new Date(s.created_at).getTime() > 60000) {
        list.push({
          id: `${s.id}-updated`,
          setId: s.id,
          type: s.status === "converted" ? "converted" : "updated",
          title: s.status === "converted" ? "Converted to property" : "Planning set updated",
          setTitle: s.title,
          profile: s.operation_profile,
          at: s.updated_at,
          group: groupOf(s.updated_at),
        })
      }
    }
    return list.sort((a, b) => b.at.localeCompare(a.at))
  }, [sets])

  const filtered = useMemo(
    () => events.filter((e) => !search || e.setTitle.toLowerCase().includes(search.toLowerCase()) || e.title.toLowerCase().includes(search.toLowerCase())),
    [events, search]
  )

  const todayCount = events.filter((e) => e.group === "today").length
  const createdCount = events.filter((e) => e.type === "created").length
  const updatedCount = events.filter((e) => e.type === "updated").length
  const convertedCount = events.filter((e) => e.type === "converted").length

  return (
    <PlanningPageShell
      title="Activity"
      subtitle="Planning events derived from your live planning sets."
    >
      {/* KPI Cards — live */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Events Today" value={isLoading ? "—" : String(todayCount)} icon={Activity} iconColour="#7C3AED" />
        <KpiCard label="Sets Created" value={isLoading ? "—" : String(createdCount)} icon={Plus} iconColour="#10B981" />
        <KpiCard label="Updates" value={isLoading ? "—" : String(updatedCount)} icon={RefreshCw} iconColour="#2563EB" />
        <KpiCard label="Conversions" value={isLoading ? "—" : String(convertedCount)} icon={CheckCircle2} iconColour="#F59E0B" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-5 bg-white rounded-2xl border border-slate-200 px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity by set name…"
            className="w-full h-8 pl-8 pr-3 rounded-xl bg-slate-50 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 border border-transparent focus:border-[#7C3AED]/30"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-[13px] text-slate-400">Loading activity…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-700">{events.length === 0 ? "No activity yet" : "No matching activity"}</p>
          <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm mx-auto">
            {events.length === 0 ? "Activity appears here as you create and update planning sets." : "Try a different search."}
          </p>
          {events.length === 0 && (
            <Link href="/property-manager/planning/wizard" className="inline-flex items-center gap-2 mt-4 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">New Planning Set</Link>
          )}
        </div>
      ) : (
        <div className="max-w-3xl">
          {(["today", "yesterday", "earlier"] as const).map((group) => {
            const items = filtered.filter((e) => e.group === group)
            if (items.length === 0) return null
            return (
              <div key={group} className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0" />
                  <p className="text-[13.5px] font-bold text-slate-800">{GROUP_LABELS[group]}</p>
                  <span className="text-[12px] text-slate-400">{items.length} event{items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const { Icon, colour } = getConfig(item.type)
                    return (
                      <button
                        key={item.id}
                        onClick={() => router.push(`/property-manager/planning/sets/${item.setId}/overview`)}
                        className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-100 px-5 py-4 hover:border-slate-200 hover:shadow-sm transition-all w-full text-left"
                      >
                        <div style={{ background: colour + "18" }} className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0")}>
                          <div style={{ color: colour }}><Icon className="w-4 h-4" /></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11.5px] text-[var(--brand)] font-medium truncate">{item.setTitle}</span>
                            <ProfileTag profileKey={item.profile} size="sm" />
                          </div>
                        </div>
                        <span className="text-[11.5px] text-slate-400 shrink-0">{timeLabel(item.at)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PlanningPageShell>
  )
}
