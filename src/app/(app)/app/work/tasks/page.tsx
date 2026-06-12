"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  List,
  LayoutGrid,
  Calendar,
  GanttChart,
  Map,
  Columns3,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Download,
  Sparkles,
  SlidersHorizontal,
  BookmarkPlus,
  Filter,
  CheckSquare,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTasks, useCompleteTask, useDeleteTask } from "@/hooks/useTasks"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { Eye, Edit2, CheckCircle2, Trash2 } from "lucide-react"
import { WorkStatusBadge } from "@/components/work/WorkStatusBadge"
import { WorkPriorityBadge } from "@/components/work/WorkPriorityBadge"
import { WorkEmptyState } from "@/components/work/WorkEmptyState"
import { WorkTabNav } from "@/components/work/WorkTabNav"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DemoTask {
  id: string
  title: string
  category: string
  property: string
  unit: string
  assigneeInitials: string
  assigneeName: string
  supplier: string
  supplierInitials: string
  dueDate: string
  sla: string
  status: string
  priority: string
  costImpact: string
  notes: number
  files: number
  overdue?: boolean
  dueToday?: boolean
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
const DEMO_TASKS: DemoTask[] = [
  { id: "T-1042", title: "Arrange EPC Assessment", category: "Compliance", property: "Manor Flat 3B", unit: "Flat 3B", assigneeInitials: "JT", assigneeName: "James T.", supplier: "Acme Certs", supplierInitials: "AC", dueDate: "Feb 15, 2024", sla: "-2d", status: "in_progress", priority: "high", costImpact: "£120", notes: 2, files: 1, overdue: true },
  { id: "T-1043", title: "Fix leaking tap Room 3", category: "Maintenance", property: "Brunswick HMO", unit: "Room 3", assigneeInitials: "SC", assigneeName: "Sarah C.", supplier: "PlumbLine Ltd", supplierInitials: "PL", dueDate: "Feb 20, 2024", sla: "0d", status: "in_progress", priority: "medium", costImpact: "£95", notes: 1, files: 2, dueToday: true },
  { id: "T-1044", title: "Arrears Evidence Pack — 22 Oak Ave", category: "Legal", property: "22 Oak Ave", unit: "—", assigneeInitials: "JT", assigneeName: "James T.", supplier: "—", supplierInitials: "—", dueDate: "Feb 10, 2024", sla: "-5d", status: "waiting", priority: "urgent", costImpact: "£0", notes: 0, files: 1, overdue: true },
  { id: "T-1045", title: "Annual boiler inspection", category: "Compliance", property: "14 Grove St", unit: "—", assigneeInitials: "LD", assigneeName: "Lisa D.", supplier: "HeatSafe Ltd", supplierInitials: "HS", dueDate: "Feb 28, 2024", sla: "+2d", status: "in_progress", priority: "medium", costImpact: "£180", notes: 2, files: 3 },
  { id: "T-1046", title: "Replace bathroom tiles", category: "Maintenance", property: "Victoria Terrace", unit: "Flat 2", assigneeInitials: "MK", assigneeName: "Mark K.", supplier: "Tiling Team", supplierInitials: "TT", dueDate: "Mar 15, 2024", sla: "+5d", status: "todo", priority: "medium", costImpact: "£450", notes: 0, files: 2 },
  { id: "T-1047", title: "Fire door inspection", category: "Compliance", property: "Manor Flat 2A", unit: "Flat 2A", assigneeInitials: "SC", assigneeName: "Sarah C.", supplier: "FireSafe Co", supplierInitials: "FS", dueDate: "Feb 25, 2024", sla: "0d", status: "waiting", priority: "high", costImpact: "£160", notes: 2, files: 1 },
  { id: "T-1048", title: "Paint corridor", category: "Repairs", property: "Brunswick HMO", unit: "Communal", assigneeInitials: "LD", assigneeName: "Lisa D.", supplier: "Bright Paints", supplierInitials: "BP", dueDate: "Mar 05, 2024", sla: "+3d", status: "todo", priority: "low", costImpact: "£320", notes: 1, files: 2 },
  { id: "T-1049", title: "EICR Electrical Test", category: "Compliance", property: "5 Park Lane", unit: "—", assigneeInitials: "MK", assigneeName: "Mark K.", supplier: "ElecCheck", supplierInitials: "EC", dueDate: "Mar 10, 2024", sla: "+8d", status: "todo", priority: "high", costImpact: "£180", notes: 0, files: 0 },
]

// ---------------------------------------------------------------------------
// KPI data (seeded, used when no real data yet)
// ---------------------------------------------------------------------------
const SEED_TASK_HEALTH_DATA = [
  { name: "Overdue", value: 18, color: "#EF4444" },
  { name: "Due Today", value: 9, color: "#F59E0B" },
  { name: "In Progress", value: 31, color: "#3B82F6" },
  { name: "To Do", value: 61, color: "#94A3B8" },
  { name: "Waiting Supplier", value: 23, color: "#8B5CF6" },
]

const WORKLOAD_DATA = [
  { name: "James T.", tasks: 24, completed: 18 },
  { name: "Sarah C.", tasks: 19, completed: 14 },
  { name: "Lisa D.", tasks: 15, completed: 11 },
  { name: "Mark K.", tasks: 12, completed: 9 },
]

const SPARKLINE_DATA = [
  { v: 40 }, { v: 45 }, { v: 42 }, { v: 55 }, { v: 60 }, { v: 58 }, { v: 72 },
]

// ---------------------------------------------------------------------------
// FilterDropdown
// ---------------------------------------------------------------------------
function FilterDropdown({ label, options, value, onChange }: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[12.5px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50 appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o} value={o === "All" ? "" : o}>{o}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// View type buttons
// ---------------------------------------------------------------------------
const VIEW_TYPES = [
  { key: "list", label: "List View", icon: List },
  { key: "card", label: "Card View", icon: LayoutGrid },
  { key: "kanban", label: "Kanban View", icon: Columns3 },
  { key: "calendar", label: "Calendar View", icon: Calendar },
  { key: "gantt", label: "Gantt View", icon: GanttChart },
  { key: "map", label: "Map View", icon: Map },
]

// ---------------------------------------------------------------------------
// KPI Strip
// ---------------------------------------------------------------------------
function KpiStrip({ tasks }: { tasks: DemoTask[] }) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86_400_000)

  const openCount = tasks.filter(t => !["done", "cancelled"].includes(t.status)).length
  const overdueCount = tasks.filter(t => t.overdue).length
  const dueTodayCount = tasks.filter(t => t.dueToday).length
  const waitingCount = tasks.filter(t => t.status === "waiting").length
  const blockedCount = tasks.filter(t => t.status === "blocked").length
  const doneCount = tasks.filter(t => t.status === "done").length
  const total = tasks.length
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const kpis = [
    { label: "Open Tasks",       value: String(openCount || "142"),     sub: "Active tasks",          color: "text-[#2563EB]",     bg: "bg-blue-50" },
    { label: "Overdue",          value: String(overdueCount || "18"),    sub: "Need immediate action", color: "text-red-600",       bg: "bg-red-50" },
    { label: "Due Today",        value: String(dueTodayCount || "9"),    sub: "Action required today", color: "text-amber-600",     bg: "bg-amber-50" },
    { label: "Waiting Supplier", value: String(waitingCount || "23"),    sub: "Pending response",      color: "text-violet-600",    bg: "bg-violet-50" },
    { label: "Blocked",          value: String(blockedCount || "7"),     sub: "Require resolution",    color: "text-red-600",       bg: "bg-red-50" },
    { label: "Completion Rate",  value: `${completionRate || 72}%`,      sub: "This month",            color: "text-emerald-600",   bg: "bg-emerald-50" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", k.bg)}>
            <CheckSquare className={cn("w-4 h-4", k.color)} />
          </div>
          <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{k.label}</p>
          <p className="text-[10px] text-slate-400">{k.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Task Health donut
// ---------------------------------------------------------------------------
function TaskHealthPanel({ tasks }: { tasks: DemoTask[] }) {
  const now = new Date()
  const healthData = tasks.length > 0 ? [
    { name: "Overdue",          value: tasks.filter(t => t.overdue).length,                   color: "#EF4444" },
    { name: "Due Today",        value: tasks.filter(t => t.dueToday).length,                  color: "#F59E0B" },
    { name: "In Progress",      value: tasks.filter(t => t.status === "in_progress").length,  color: "#3B82F6" },
    { name: "To Do",            value: tasks.filter(t => t.status === "todo").length,          color: "#94A3B8" },
    { name: "Waiting Supplier", value: tasks.filter(t => t.status === "waiting").length,      color: "#8B5CF6" },
  ].filter(d => d.value > 0) : SEED_TASK_HEALTH_DATA

  const total = tasks.length || 142

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Task Health</h3>
      <div className="flex justify-center">
        <div className="relative">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={healthData}
                cx={65}
                cy={65}
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {healthData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-base font-bold text-slate-900">{total}</p>
            <p className="text-[9px] text-slate-500">Total Tasks</p>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {healthData.map(d => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className="text-[11px] text-slate-600">{d.name}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-700">{d.value}</span>
          </div>
        ))}
      </div>
      <Link href="/app/work/tasks" className="mt-3 text-[11px] text-[#2563EB] hover:underline font-medium">View full breakdown →</Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Urgent Items panel
// ---------------------------------------------------------------------------
function UrgentItemsPanel({ tasks }: { tasks: DemoTask[] }) {
  const overdueCount  = tasks.length > 0 ? tasks.filter(t => t.overdue).length : 5
  const dueTodayCount = tasks.length > 0 ? tasks.filter(t => t.dueToday).length : 3
  const items = [
    { icon: AlertTriangle, color: "text-red-500",   bg: "bg-red-50",   count: overdueCount,  label: "Overdue tasks",  desc: "Past due date, action needed" },
    { icon: Clock,         color: "text-amber-500", bg: "bg-amber-50", count: dueTodayCount, label: "Due today",       desc: "Complete before end of day" },
    { icon: ShieldAlert,   color: "text-red-500",   bg: "bg-red-50",   count: 2,             label: "SLA breaches",   desc: "Contract SLA at risk" },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Urgent Items</h3>
      <div className="space-y-3">
        {items.map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                <Icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{item.count}</p>
                <p className="text-[11px] font-medium text-slate-700">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.desc}</p>
              </div>
              <Link href="/app/work/tasks" className="text-[10px] text-[#2563EB] hover:underline shrink-0 mt-1">View all →</Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Productivity Insights panel
// ---------------------------------------------------------------------------
function ProductivityInsightsPanel() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Productivity Insights</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-slate-600">Tasks completed</p>
            <span className="text-[11px] font-semibold text-emerald-600">+18%</span>
          </div>
          <ResponsiveContainer width="100%" height={32}>
            <LineChart data={SPARKLINE_DATA}>
              <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-slate-600">On-time completion</p>
            <span className="text-[11px] font-semibold text-[#2563EB]">78%</span>
          </div>
          <ResponsiveContainer width="100%" height={32}>
            <LineChart data={[{ v: 60 }, { v: 65 }, { v: 70 }, { v: 68 }, { v: 72 }, { v: 75 }, { v: 78 }]}>
              <Line type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Link href="/app/work/tasks" className="mt-3 text-[11px] text-[#2563EB] hover:underline font-medium">View full insights →</Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bottom: Upcoming Deadlines
// ---------------------------------------------------------------------------
const SEED_UPCOMING_DEADLINES = [
  { day: "15", month: "Feb", title: "Arrange EPC Assessment", property: "Manor Flat 3B · Flat 3B", chip: "Overdue", chipColor: "bg-red-50 text-red-600" },
  { day: "20", month: "Feb", title: "Fix leaking tap Room 3", property: "Brunswick HMO · Room 3", chip: "Due today", chipColor: "bg-amber-50 text-amber-600" },
  { day: "25", month: "Feb", title: "Fire door inspection", property: "Manor Flat 2A · Flat 2A", chip: "In 1 day", chipColor: "bg-blue-50 text-blue-600" },
  { day: "28", month: "Feb", title: "Annual boiler inspection", property: "14 Grove St", chip: "In 2 days", chipColor: "bg-slate-100 text-slate-600" },
]

function UpcomingDeadlinesPanel({ tasks }: { tasks: DemoTask[] }) {
  const items = useMemo(() => {
    const withDue = tasks.filter(t => t.dueDate && t.dueDate !== "—" && !["done", "cancelled"].includes(t.status))
    if (withDue.length === 0) return SEED_UPCOMING_DEADLINES
    const now = new Date()
    return withDue
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4)
      .map(t => {
        const due = new Date(t.dueDate)
        const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000)
        let chip = "Upcoming"
        let chipColor = "bg-slate-100 text-slate-600"
        if (diffDays < 0) { chip = "Overdue"; chipColor = "bg-red-50 text-red-600" }
        else if (diffDays === 0) { chip = "Due today"; chipColor = "bg-amber-50 text-amber-600" }
        else if (diffDays === 1) { chip = "Tomorrow"; chipColor = "bg-blue-50 text-blue-600" }
        else if (diffDays <= 7) { chip = `In ${diffDays}d`; chipColor = "bg-blue-50 text-blue-600" }
        return {
          day: String(due.getDate()),
          month: due.toLocaleDateString("en-GB", { month: "short" }),
          title: t.title,
          property: t.property,
          chip,
          chipColor,
        }
      })
  }, [tasks])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Upcoming Deadlines</h3>
        <Link href="/app/work/ppm" className="text-[11px] text-[#2563EB] hover:underline">View calendar →</Link>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.title} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0">
              <span className="text-base font-bold text-[#2563EB] leading-none">{item.day}</span>
              <span className="text-[9px] text-[#2563EB]/70">{item.month}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-slate-900 truncate">{item.title}</p>
              <p className="text-[11px] text-slate-400">{item.property}</p>
            </div>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", item.chipColor)}>{item.chip}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bottom: AI Suggestions
// ---------------------------------------------------------------------------
function AiSuggestionsPanel() {
  const suggestions = [
    { text: "3 similar overdue tasks — Consider assigning to available contractors", btn: "Review" },
    { text: "SLA at risk — 8 tasks may breach SLA in next 3 days", btn: "View" },
    { text: "Cost saving opportunity — Group 4 maintenance tasks to reduce costs", btn: "Review" },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" /> AI
          </span>
          <h3 className="text-sm font-semibold text-slate-900">AI Suggestions</h3>
        </div>
        <Link href="/app/work/tasks" className="text-[11px] text-[#2563EB] hover:underline">View all →</Link>
      </div>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/40 border border-violet-100">
            <p className="flex-1 text-[12px] text-slate-700">{s.text}</p>
            <button className="shrink-0 text-[11px] font-semibold text-violet-700 hover:underline">{s.btn}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bottom: Workload by Assignee
// ---------------------------------------------------------------------------
function WorkloadPanel({ tasks }: { tasks: DemoTask[] }) {
  const workloadData = useMemo(() => {
    if (tasks.length === 0) return WORKLOAD_DATA
    const map: Record<string, { total: number; completed: number }> = {}
    tasks.forEach(t => {
      const name = t.assigneeName && t.assigneeName !== "Unassigned" ? t.assigneeName.split(" ").map((p: string) => p[0]).join("").slice(0, 2) + " " + t.assigneeName.split(" ").slice(-1)[0].slice(0, 1) + "." : "Unassigned"
      if (!map[name]) map[name] = { total: 0, completed: 0 }
      map[name].total++
      if (t.status === "done") map[name].completed++
    })
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([name, v]) => ({ name, tasks: v.total, completed: v.completed }))
  }, [tasks])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Workload by Assignee</h3>
        <Link href="/app/work/tasks" className="text-[11px] text-[#2563EB] hover:underline">View team workload →</Link>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={workloadData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={56} />
          <Tooltip
            contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }}
            cursor={{ fill: "#f8fafc" }}
          />
          <Bar dataKey="tasks" fill="#DBEAFE" radius={4} name="Total" />
          <Bar dataKey="completed" fill="#2563EB" radius={4} name="Done" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function TasksPage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { data: tasksData, isLoading } = useTasks(workspaceId)
  const completeTask = useCompleteTask()
  const deleteTask = useDeleteTask()

  const [activeView, setActiveView] = useState<"list" | "card" | "kanban">("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)

  const liveOrDemo: DemoTask[] = useMemo(() => {
    if (tasksData && tasksData.length > 0) {
      return tasksData.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category ?? "General",
        property: t.property_id ?? "—",
        unit: "—",
        assigneeInitials: (t.assigned_to ?? "?").slice(0, 2).toUpperCase(),
        assigneeName: t.assigned_to ?? "Unassigned",
        supplier: "—",
        supplierInitials: "—",
        dueDate: t.due_date ?? "—",
        sla: "—",
        status: t.status,
        priority: t.priority,
        costImpact: "—",
        notes: 0,
        files: 0,
        overdue: t.due_date ? new Date(t.due_date) < new Date() && !["done", "cancelled"].includes(t.status) : false,
        dueToday: t.due_date ? new Date(t.due_date).toDateString() === new Date().toDateString() : false,
      }))
    }
    return DEMO_TASKS
  }, [tasksData])

  // Filter option lists derived from the live/demo dataset
  const propertyOptions = useMemo(
    () => ["All", ...Array.from(new Set(liveOrDemo.map(t => t.property).filter(p => p && p !== "—")))],
    [liveOrDemo]
  )
  const categoryOptions = useMemo(
    () => ["All", ...Array.from(new Set(liveOrDemo.map(t => t.category).filter(Boolean)))],
    [liveOrDemo]
  )

  const displayTasks = useMemo(() => {
    let list = liveOrDemo
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) list = list.filter(t => t.status === statusFilter)
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter)
    if (propertyFilter) list = list.filter(t => t.property === propertyFilter)
    if (categoryFilter) list = list.filter(t => t.category === categoryFilter)
    return list
  }, [liveOrDemo, search, statusFilter, priorityFilter, propertyFilter, categoryFilter])

  const hasFilters = !!(search || statusFilter || priorityFilter || propertyFilter || categoryFilter)

  function clearFilters() {
    setSearch("")
    setStatusFilter("")
    setPriorityFilter("")
    setPropertyFilter("")
    setCategoryFilter("")
  }

  function handleDelete() {
    if (!pendingDelete || !workspaceId) return
    deleteTask.mutate({ id: pendingDelete.id, workspaceId })
    setPendingDelete(null)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedIds(e.target.checked ? displayTasks.map(t => t.id) : [])
  }

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Work management workspace</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 h-8 w-44 rounded-lg border border-slate-200 bg-white text-[12.5px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50"
            />
          </div>
          <Link
            href="/app/work/tasks"
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            <BookmarkPlus className="w-3.5 h-3.5" /> Saved Views
          </Link>
          <button className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <Link
            href="/app/work/tasks/new"
            className="h-8 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Task
          </Link>
          <button
            onClick={() => setSelectedIds(displayTasks.map(t => t.id))}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            Bulk Update
          </button>
          <button
            onClick={() => {
              const rows = displayTasks.map(t => [t.id, t.title, t.status, t.priority, t.property, t.dueDate].join(","))
              const csv = ["ID,Title,Status,Priority,Property,Due Date", ...rows].join("\n")
              const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "tasks.csv"; a.click()
            }}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <Link
            href="/app/work"
            className="h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip tasks={liveOrDemo} />

      {/* WorkTabNav */}
      <WorkTabNav />

      {/* View type buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {VIEW_TYPES.map(vt => {
            const Icon = vt.icon
            const isActive = activeView === vt.key
            return (
              <button
                key={vt.key}
                onClick={() => setActiveView(vt.key as "list" | "card" | "kanban")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-all",
                  isActive
                    ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {vt.label}
              </button>
            )
          })}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 hover:bg-slate-50">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Customize Columns
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown
          label="Status"
          options={["All", "todo", "in_progress", "waiting", "blocked", "done", "cancelled"]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterDropdown
          label="Priority"
          options={["All", "urgent", "high", "medium", "low"]}
          value={priorityFilter}
          onChange={setPriorityFilter}
        />
        <FilterDropdown
          label="Property"
          options={propertyOptions}
          value={propertyFilter}
          onChange={setPropertyFilter}
        />
        <FilterDropdown
          label="Category"
          options={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
        {hasFilters && (
          <button onClick={clearFilters} className="text-[12.5px] font-medium text-[#2563EB] hover:underline px-2">Clear</button>
        )}
        <button className="ml-auto text-[12.5px] font-medium text-[#2563EB] hover:underline px-2">Save View</button>
      </div>

      {/* Main layout */}
      <div className="flex gap-5 items-start">

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Bulk action bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
              <span className="text-sm font-medium text-[#2563EB]">{selectedIds.length} tasks selected</span>
              <div className="w-px h-4 bg-[#BFDBFE]" />
              <button className="text-[12.5px] font-medium text-[#2563EB] hover:underline flex items-center gap-1">Bulk Update ▾</button>
              <button className="text-[12.5px] font-medium text-[#2563EB] hover:underline flex items-center gap-1">Change Status ▾</button>
              <button className="text-[12.5px] font-medium text-[#2563EB] hover:underline flex items-center gap-1">Assign To ▾</button>
              <button className="text-[12.5px] font-medium text-[#2563EB] hover:underline flex items-center gap-1">Export Selected</button>
              <button onClick={() => setSelectedIds([])} className="ml-auto text-slate-400 hover:text-slate-600">✕</button>
            </div>
          )}

          {/* Table */}
          {activeView === "list" && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded" onChange={handleSelectAll} checked={selectedIds.length === displayTasks.length && displayTasks.length > 0} />
                  {selectedIds.length > 0 && (
                    <span className="text-sm font-medium text-slate-700">{selectedIds.length} tasks selected</span>
                  )}
                </div>
                <span className="text-xs text-slate-500">Showing {displayTasks.length} of {displayTasks.length} tasks</span>
              </div>

              {isLoading ? (
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                      <div className="w-4 h-4 rounded bg-slate-200 shrink-0" />
                      <div className="w-3 h-3 rounded-full bg-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-3 bg-slate-200 rounded w-2/5" />
                        <div className="h-2.5 bg-slate-100 rounded w-1/5" />
                      </div>
                      <div className="hidden md:block h-3 bg-slate-200 rounded w-20" />
                      <div className="h-3 bg-slate-200 rounded w-16" />
                      <div className="h-5 bg-slate-100 rounded-full w-20" />
                    </div>
                  ))}
                </div>
              ) : displayTasks.length === 0 ? (
                <WorkEmptyState
                  icon={CheckSquare}
                  title="No tasks found"
                  description={hasFilters ? "No tasks match your current filters." : "Create your first task to get started."}
                  ctaLabel={hasFilters ? undefined : "+ Create Task"}
                  ctaHref={hasFilters ? undefined : "/app/work/tasks/new"}
                />
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="w-8 px-4 py-3"><input type="checkbox" /></th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-6">PRI</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">TASK</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">CATEGORY</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">PROPERTY</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">UNIT</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">ASSIGNEE</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">SUPPLIER</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">DUE DATE</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">SLA</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">STATUS</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">COST</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">NOTES</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTasks.map(task => (
                      <tr
                        key={task.id}
                        className={cn(
                          "border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer",
                          selectedIds.includes(task.id) && "bg-blue-50/40"
                        )}
                      >
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(task.id)}
                            onChange={() => toggleSelect(task.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <WorkPriorityBadge priority={task.priority} showLabel={false} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Link href={`/app/work/tasks/${task.id}`} className="block hover:underline">
                            <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{task.title}</p>
                            <p className="text-[11px] text-slate-400">#{task.id}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">{task.category}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-sm text-slate-600 truncate max-w-[130px]">{task.property}</td>
                        <td className="px-4 py-3.5 hidden xl:table-cell text-xs text-slate-500">{task.unit}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                              {task.assigneeInitials}
                            </div>
                            <span className="text-xs text-slate-600 hidden xl:block">{task.assigneeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden xl:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">
                              {task.supplierInitials}
                            </div>
                            <span className="text-xs text-slate-500 truncate max-w-[80px]">{task.supplier}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold",
                            task.overdue ? "bg-red-50 text-red-600" :
                            task.dueToday ? "bg-amber-50 text-amber-600" :
                            "text-slate-600"
                          )}>
                            <Calendar className="w-3 h-3" />
                            <span>{task.dueDate && task.dueDate !== "—" && !task.dueDate.includes(" ") ? new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : task.dueDate}</span>
                            {task.overdue && <span className="ml-0.5 text-[10px]">Overdue</span>}
                            {task.dueToday && <span className="ml-0.5 text-[10px]">Due today</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className={cn(
                            "text-xs font-semibold",
                            task.sla?.startsWith("-") ? "text-red-500" :
                            task.sla === "0d" ? "text-amber-500" :
                            "text-emerald-500"
                          )}>
                            {task.sla}
                          </span>
                        </td>
                        <td className="px-4 py-3.5"><WorkStatusBadge status={task.status} /></td>
                        <td className="px-4 py-3.5 hidden xl:table-cell text-sm font-medium text-slate-700">{task.costImpact}</td>
                        <td className="px-4 py-3.5 hidden xl:table-cell">
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{task.notes}</span>
                            <span className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />{task.files}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          <ActionMenu
                            items={[
                              { label: "View task", icon: Eye, onClick: () => router.push(`/app/work/tasks/${task.id}`) },
                              { label: "Edit", icon: Edit2, onClick: () => router.push(`/app/work/tasks/${task.id}`) },
                              ...(task.status !== "done"
                                ? [{ label: "Mark complete", icon: CheckCircle2, onClick: () => workspaceId && completeTask.mutate({ id: task.id, workspaceId }) }]
                                : []),
                              { label: "Delete", icon: Trash2, variant: "danger" as const, onClick: () => setPendingDelete({ id: task.id, title: task.title }) },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}

              {/* Pagination footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Showing 1 to {displayTasks.length} of {displayTasks.length} tasks</p>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[1, 2, 3, 4, 5, 6].map(p => (
                    <button
                      key={p}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                        p === 1 ? "bg-[#2563EB] text-white" : "hover:bg-slate-100 text-slate-600"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <span className="text-slate-400 px-1">...</span>
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <select className="border border-slate-200 rounded-lg px-2 py-1 text-xs">
                    <option>25 per page</option>
                    <option>50 per page</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Card view placeholder */}
          {activeView === "card" && (
            <WorkEmptyState
              icon={LayoutGrid}
              title="Card View"
              description="Card view coming soon. Switch to List view to see your tasks."
            />
          )}

          {/* Kanban view placeholder */}
          {activeView === "kanban" && (
            <WorkEmptyState
              icon={Columns3}
              title="Kanban View"
              description="Kanban view coming soon. Switch to List view to see your tasks."
            />
          )}

          {/* Bottom panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UpcomingDeadlinesPanel tasks={liveOrDemo} />
            <AiSuggestionsPanel />
            <WorkloadPanel tasks={liveOrDemo} />
          </div>
        </div>

        {/* Right insight column */}
        <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
          <TaskHealthPanel tasks={liveOrDemo} />
          <UrgentItemsPanel tasks={liveOrDemo} />
          <ProductivityInsightsPanel />
        </div>
      </div>

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setPendingDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Delete task</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to delete <span className="font-medium text-slate-700">{pendingDelete.title}</span>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setPendingDelete(null)} className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
