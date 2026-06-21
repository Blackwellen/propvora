"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type ActivityItem = {
  id: string
  event: string
  detail: string
  time: string
  type: "login" | "profile" | "ai" | "settings" | "security"
  risk: "low" | "medium" | "high"
}

const TYPE_COLOURS: Record<ActivityItem["type"], string> = {
  login:    "#2563EB",
  profile:  "#059669",
  ai:       "#7C3AED",
  settings: "#D97706",
  security: "#DC2626",
}

const TYPE_LABELS: Record<ActivityItem["type"], string> = {
  login:    "Login",
  profile:  "Profile",
  ai:       "AI Action",
  settings: "Settings",
  security: "Security",
}

const ALL_TYPES = ["all", "login", "profile", "ai", "settings", "security"] as const
type FilterType = (typeof ALL_TYPES)[number]

export default function ActivityPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("audit_logs")
          .select("id, action, metadata, created_at")
          .order("created_at", { ascending: false })
          .limit(100)

        if (error && error.code !== "42P01") throw error

        if (data && data.length > 0) {
          setActivity(
            data.map((row) => ({
              id: row.id as string,
              event: (row.action as string) ?? "Action",
              detail: typeof row.metadata === "object" && row.metadata !== null
                ? ((row.metadata as Record<string, unknown>).detail as string) ?? ""
                : "",
              time: new Date(row.created_at as string).toLocaleString("en-GB", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              }),
              type: "settings" as const,
              risk: "low" as const,
            }))
          )
        }
      } catch {
        // silently show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = activity.filter(item => {
    const matchType = filter === "all" || item.type === filter
    const matchSearch =
      !search ||
      item.event.toLowerCase().includes(search.toLowerCase()) ||
      item.detail.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Activity</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Your login history, profile changes and AI actions
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activity…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
          />
        </div>
        {/* Type filter */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0 overflow-x-auto">
          {ALL_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize whitespace-nowrap transition-colors",
                filter === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t === "all" ? "All" : TYPE_LABELS[t as ActivityItem["type"]]}
            </button>
          ))}
        </div>
      </div>

      {/* Activity list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-slate-400">Loading activity…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-slate-400">
              {activity.length === 0 ? "No activity recorded yet" : "No activity matches your filter"}
            </p>
          </div>
        ) : (
          filtered.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5",
                i < filtered.length - 1 && "border-b border-slate-50"
              )}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_COLOURS[item.type] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-slate-800">{item.event}</p>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: TYPE_COLOURS[item.type] + "18",
                      color: TYPE_COLOURS[item.type],
                    }}
                  >
                    {TYPE_LABELS[item.type]}
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-400 mt-0.5 truncate">{item.detail}</p>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                {item.time}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="text-[11.5px] text-slate-400 mt-4 text-center">
        Showing the last 30 days of activity · Older activity is archived
      </p>
    </div>
  )
}
