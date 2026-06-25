"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import {
  Settings,
  MessageSquare,
  FileText,
  Edit2,
  Handshake,
  BarChart2,
  Send,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace, useAuth } from "@/providers/AuthProvider"
import type { PlanningActivity } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Action type config ────────────────────────────────────────────────────────

interface ActionTypeCfg {
  label: string
  icon: React.ReactNode
  chipCls: string
  filterKey: ActivityFilter
}

type ActivityFilter = "All" | "Updates" | "Comments" | "Documents" | "Plan Edits" | "Offers" | "Scenarios"

function getActionTypeCfg(actionType: string): ActionTypeCfg {
  switch (actionType) {
    case "plan_updated":
    case "plan_update":
      return { label: "Plan updated", icon: <Settings className="w-3.5 h-3.5" />, chipCls: "bg-blue-100 text-blue-700", filterKey: "Updates" }
    case "comment_added":
    case "comment":
      return { label: "Comment added", icon: <MessageSquare className="w-3.5 h-3.5" />, chipCls: "bg-violet-100 text-violet-700", filterKey: "Comments" }
    case "document_uploaded":
    case "document":
      return { label: "Document uploaded", icon: <FileText className="w-3.5 h-3.5" />, chipCls: "bg-emerald-100 text-emerald-700", filterKey: "Documents" }
    case "plan_edited":
    case "edit":
      return { label: "Plan edited", icon: <Edit2 className="w-3.5 h-3.5" />, chipCls: "bg-amber-100 text-amber-700", filterKey: "Plan Edits" }
    case "offer_changed":
    case "offer":
      return { label: "Offer changed", icon: <Handshake className="w-3.5 h-3.5" />, chipCls: "bg-orange-100 text-orange-700", filterKey: "Offers" }
    case "scenario_run":
    case "scenario":
      return { label: "Scenario run", icon: <BarChart2 className="w-3.5 h-3.5" />, chipCls: "bg-indigo-100 text-indigo-700", filterKey: "Scenarios" }
    default:
      return { label: "Activity", icon: <Settings className="w-3.5 h-3.5" />, chipCls: "bg-slate-100 text-slate-600", filterKey: "Updates" }
  }
}

// ── Avatar initials ───────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  if (!name) return (
    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">?</div>
  )
  const parts = name.trim().split(" ")
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
  const colors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-400", "bg-indigo-500"]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

// ── Display activity shape ────────────────────────────────────────────────────

interface DisplayActivity {
  id: string
  group: string
  time: string
  action_type: string
  actor: string
  title: string
  description?: string
}

const FILTER_TABS: ActivityFilter[] = ["All", "Updates", "Comments", "Documents", "Plan Edits", "Offers", "Scenarios"]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const params = useParams()
  const id = params.id as string
  const { workspace } = useWorkspace()
  const { user } = useAuth()

  const [activity, setActivity] = useState<PlanningActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ActivityFilter>("All")
  const [comment, setComment] = useState("")
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Current user display name + initials (no hardcoded avatar).
  const meName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "You"
  const meInitials = meName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?"

  useEffect(() => {
    if (!id || !workspace?.id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from("planning_activity")
        .select("*")
        .eq("planning_set_id", id)
        .eq("workspace_id", workspace!.id)
        .order("created_at", { ascending: false })
        .limit(50)
      // Table is RLS-scoped to workspace members; on any error degrade to empty.
      setActivity(error ? [] : ((data ?? []) as PlanningActivity[]))
      setLoading(false)
    }
    load()
  }, [id, workspace?.id])

  async function handlePostComment() {
    if (!comment.trim() || !id || !workspace?.id) return
    setPosting(true)
    setPostError(null)
    const supabase = createClient()
    // workspace_id is NOT NULL and gates the RLS policy; actor_id attributes the
    // comment to the current user. Omitting either fails the insert (was a silent
    // dead action before this fix).
    const { data, error } = await supabase.from("planning_activity").insert({
      workspace_id: workspace.id,
      planning_set_id: id,
      action: "comment_added",
      detail: comment.trim(),
      user_id: user?.id ?? null,
    }).select().single()
    setPosting(false)
    if (error || !data) {
      setPostError("Couldn't post your comment. Please try again.")
      return
    }
    setActivity((prev) => [data as PlanningActivity, ...prev])
    setComment("")
  }

  // Build display activity list from real rows only
  const displayActivity: DisplayActivity[] = activity.map((a) => ({
    id: a.id,
    group: (() => {
      const d = new Date(a.created_at)
      const now = new Date()
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
      if (diff === 0) return "Today"
      if (diff === 1) return "Yesterday"
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    })(),
    time: new Date(a.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    action_type: a.action,
    actor: a.user_id ? (a.user_id === user?.id ? meName : "Team member") : "System",
    title: getActionTypeCfg(a.action).label,
    description: a.detail ?? undefined,
  }))

  // Filter
  const filteredActivity = filter === "All"
    ? displayActivity
    : displayActivity.filter((a) => getActionTypeCfg(a.action_type).filterKey === filter)

  // Group by date
  const groups = filteredActivity.reduce<Record<string, DisplayActivity[]>>((acc, a) => {
    if (!acc[a.group]) acc[a.group] = []
    acc[a.group].push(a)
    return acc
  }, {})

  const GROUP_ORDER = ["Today", "Yesterday", ...Object.keys(groups).filter((g) => g !== "Today" && g !== "Yesterday")]
  const orderedGroups = GROUP_ORDER.filter((g) => groups[g]?.length > 0)

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">Activity</h2>
        </div>
      </div>

      {/* ── Filter Tabs ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 pb-0">
        {FILTER_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              filter === t
                ? "border-[#7C3AED] text-[#7C3AED]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Comment Input ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
            {meInitials}
          </div>
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-9">
            <input
              ref={inputRef}
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handlePostComment() }}
              placeholder="Add a comment or note..."
              className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handlePostComment}
            disabled={!comment.trim() || posting}
            className="h-9 w-9 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center hover:bg-violet-700 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        {postError && <p className="text-[11px] text-red-600 mt-2 ml-9">{postError}</p>}
      </div>

      {/* ── Timeline Feed ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {orderedGroups.map((group) => (
            <div key={group}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{group}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Events */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {(groups[group] ?? []).map((event, i) => {
                  const cfg = getActionTypeCfg(event.action_type)
                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-3 px-5 py-3.5 ${i < (groups[group]?.length ?? 0) - 1 ? "border-b border-slate-50" : ""} hover:bg-slate-50 transition-colors`}
                    >
                      {/* Time */}
                      <span className="text-[10px] text-slate-400 font-mono w-10 flex-shrink-0 pt-0.5">{event.time}</span>

                      {/* Icon chip */}
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.chipCls}`}>
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold text-slate-900">{event.title}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${cfg.chipCls}`}>
                            {cfg.filterKey}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">{event.description}</p>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar name={event.actor} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredActivity.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Settings className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No activity yet</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Edits, comments, document uploads and offer changes for this planning set will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
