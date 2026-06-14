"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  Calendar,
  List,
  LayoutGrid,
  Map,
  GanttChart,
  Database,
  MoreHorizontal,
  AlertTriangle,
  Clock,
  Download,
  Sparkles,
  Briefcase,
  Receipt,
  TrendingDown,
  MessageSquare,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Filter,
  Activity,
  Loader2,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { WorkStatusBadge } from "@/components/work/WorkStatusBadge"
import { WorkPriorityBadge } from "@/components/work/WorkPriorityBadge"
import { WorkEmptyState } from "@/components/work/WorkEmptyState"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { useJobs, useUpdateJob, useDeleteJob } from "@/hooks/useJobs"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { SavedViewsMenu } from "@/components/list/SavedViewsMenu"
import { useCreateSavedView } from "@/hooks/useSavedViews"
import { openCopilot } from "@/lib/copilot/open"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { Eye, Edit2, CheckCircle2, Trash2 } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DemoJob {
  id: string
  title: string
  priority: string
  property: string
  block: string
  supplier: string
  engineer: string
  engineerInitials: string
  team: string
  scheduledStart: string
  scheduledEnd: string
  dueDate: string
  status: string
  category?: string
  sla: number
  slaColor: string
  quoteValue: string
  invoiceStatus: string
  attachments: number
  notes: number
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
const DEMO_JOBS: DemoJob[] = [
  { id: "JOB-2024-1048", title: "Boiler Annual Service", priority: "high", property: "14 Grove St", block: "Block A", supplier: "HeatPro Ltd", engineer: "Alan Carter", engineerInitials: "AC", team: "Team 1", scheduledStart: "16 May, 09:00", scheduledEnd: "16 May, 17:00", dueDate: "16 May, 17:00", status: "scheduled", sla: 100, slaColor: "emerald", quoteValue: "£650", invoiceStatus: "Not Invoiced", attachments: 2, notes: 1 },
  { id: "JOB-2024-1047", title: "Gas Safety Certificate", priority: "urgent", property: "Manor Flat 3B", block: "Block A", supplier: "Gas Safe Co", engineer: "Sarah Malik", engineerInitials: "SM", team: "Team 2", scheduledStart: "16 May, 11:00", scheduledEnd: "16 May, 15:00", dueDate: "16 May, 15:00", status: "overdue", sla: 85, slaColor: "amber", quoteValue: "£120", invoiceStatus: "Overdue", attachments: 1, notes: 2 },
  { id: "JOB-2024-1046", title: "Bathroom Renovation", priority: "medium", property: "22 Oak Ave", block: "Flat 2", supplier: "BuildRight Ltd", engineer: "James Wood", engineerInitials: "JW", team: "Team 3", scheduledStart: "17 May, 10:00", scheduledEnd: "18 May, 17:00", dueDate: "18 May, 17:00", status: "in_progress", sla: 60, slaColor: "amber", quoteValue: "£2,850", invoiceStatus: "Part Invoiced", attachments: 4, notes: 1 },
  { id: "JOB-2024-1045", title: "Electrical Compliance Cert", priority: "medium", property: "5 Hillview Rd", block: "—", supplier: "ElecSure Ltd", engineer: "Daniel Brown", engineerInitials: "DB", team: "Team 1", scheduledStart: "17 May, 14:00", scheduledEnd: "19 May, 17:00", dueDate: "19 May, 17:00", status: "in_progress", sla: 40, slaColor: "amber", quoteValue: "£180", invoiceStatus: "Not Invoiced", attachments: 2, notes: 0 },
  { id: "JOB-2024-1044", title: "Kitchen Extraction Fan", priority: "low", property: "Manor Flat 2A", block: "—", supplier: "VentPro Services", engineer: "Alan Carter", engineerInitials: "AC", team: "Team 1", scheduledStart: "18 May, 09:30", scheduledEnd: "18 May, 12:00", dueDate: "18 May, 12:00", status: "scheduled", sla: 100, slaColor: "emerald", quoteValue: "£95", invoiceStatus: "Not Invoiced", attachments: 0, notes: 1 },
  { id: "JOB-2024-1043", title: "Lift Inspection", priority: "high", property: "12 Park Place", block: "—", supplier: "LiftCare Ltd", engineer: "Luke Harris", engineerInitials: "LH", team: "Team 4", scheduledStart: "18 May, 13:00", scheduledEnd: "19 May, 17:00", dueDate: "19 May, 17:00", status: "waiting", sla: 25, slaColor: "red", quoteValue: "£420", invoiceStatus: "Not Invoiced", attachments: 0, notes: 0 },
  { id: "JOB-2024-1042", title: "Door Entry System Repair", priority: "medium", property: "9 Cedar Court", block: "—", supplier: "SecureTech", engineer: "Sarah Malik", engineerInitials: "SM", team: "Team 2", scheduledStart: "19 May, 10:00", scheduledEnd: "20 May, 17:00", dueDate: "20 May, 17:00", status: "in_progress", sla: 55, slaColor: "amber", quoteValue: "£210", invoiceStatus: "Not Invoiced", attachments: 2, notes: 1 },
  { id: "JOB-2024-1041", title: "Painting & Touch Up", priority: "low", property: "31 Maple Rd", block: "—", supplier: "BrightFinish", engineer: "James Wood", engineerInitials: "JW", team: "Team 3", scheduledStart: "20 May, 09:00", scheduledEnd: "21 May, 17:00", dueDate: "21 May, 17:00", status: "scheduled", sla: 100, slaColor: "emerald", quoteValue: "£320", invoiceStatus: "Not Invoiced", attachments: 3, notes: 0 },
]

// ---------------------------------------------------------------------------
// Pipeline & cost data
// ---------------------------------------------------------------------------
const PIPELINE_DATA = [
  { name: "Scheduled", value: 7, color: "#3B82F6" },
  { name: "In Progress", value: 12, color: "#6366F1" },
  { name: "Waiting", value: 3, color: "#F59E0B" },
  { name: "Overdue", value: 4, color: "#EF4444" },
  { name: "Completed", value: 6, color: "#10B981" },
]

const COST_EXPOSURE_DATA = [
  { name: "Overdue", value: 1250, color: "#EF4444" },
  { name: "At Risk", value: 740, color: "#F59E0B" },
  { name: "Pending Quotes", value: 400, color: "#94A3B8" },
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
          <option key={o} value={o === "All" || o.includes("▾") ? "" : o}>{o}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Job status badge
// ---------------------------------------------------------------------------
function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: "bg-[#EFF6FF] text-[#2563EB]",
    in_progress: "bg-blue-50 text-blue-700",
    overdue: "bg-red-50 text-red-700",
    waiting: "bg-amber-50 text-amber-700",
    complete: "bg-emerald-50 text-emerald-700",
    invoiced: "bg-violet-50 text-violet-700",
  }
  const labels: Record<string, string> = {
    scheduled: "Scheduled",
    in_progress: "In Progress",
    overdue: "Overdue",
    waiting: "Waiting",
    complete: "Complete",
    invoiced: "Invoiced",
  }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", map[status] ?? "bg-slate-100 text-slate-600")}>
      {labels[status] ?? status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Invoice status badge
// ---------------------------------------------------------------------------
function InvoiceBadge({ status }: { status: string }) {
  if (status === "Overdue") return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{status}</span>
  if (status === "Part Invoiced") return <span className="text-xs font-semibold text-amber-600">{status}</span>
  return <span className="text-xs text-slate-400">{status}</span>
}

// ---------------------------------------------------------------------------
// KPI strip
// ---------------------------------------------------------------------------
function JobsKpiStrip({ jobs }: { jobs: DemoJob[] }) {
  const scheduledCount = jobs.filter(j => j.status === "scheduled").length
  const inProgressCount = jobs.filter(j => j.status === "in_progress").length
  const overdueCount = jobs.filter(j => j.status === "overdue").length
  const waitingCount = jobs.filter(j => j.status === "waiting").length
  const invoicePendingCount = jobs.filter(j => j.invoiceStatus === "Not Invoiced" || j.invoiceStatus === "none").length
  const costAtRiskCount = jobs.filter(j => j.status === "overdue" || j.status === "waiting").length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {[
        { label: "Scheduled Jobs", value: String(scheduledCount), sub: "Upcoming this week", color: "text-[#2563EB]", bg: "bg-blue-50", icon: Calendar },
        { label: "In Progress", value: String(inProgressCount), sub: "Currently active", color: "text-[#2563EB]", bg: "bg-blue-50", icon: Briefcase },
        { label: "Overdue", value: String(overdueCount), sub: "Past due date", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
        { label: "Waiting Supplier", value: String(waitingCount), sub: "Pending response", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
        { label: "Invoice Pending", value: String(invoicePendingCount), sub: "Awaiting invoice", color: "text-violet-600", bg: "bg-violet-50", icon: Receipt },
        { label: "Cost at Risk", value: String(costAtRiskCount), sub: "Jobs at risk", color: "text-red-600", bg: "bg-red-50", icon: TrendingDown },
      ].map(k => {
        const Icon = k.icon
        return (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", k.bg)}>
              <Icon className={cn("w-4 h-4", k.color)} />
            </div>
            <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{k.label}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bottom panels
// ---------------------------------------------------------------------------
function TodaySchedulePanel({ jobs }: { jobs: DemoJob[] }) {
  const todayStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  const items = jobs.filter(j => j.scheduledStart.startsWith(todayStr))
  // Fall back to first 3 jobs if none match today (demo mode)
  const displayItems = items.length > 0 ? items : jobs.slice(0, 3)
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Today&apos;s Schedule</h3>
      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <p className="text-[12px] text-slate-400">No jobs scheduled for today.</p>
        ) : displayItems.map(item => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="text-[11px] text-slate-400 w-14 shrink-0 mt-0.5">
              {item.scheduledStart.includes(", ") ? item.scheduledStart.split(", ")[1] : item.scheduledStart}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-slate-900 truncate">{item.title}</p>
              <p className="text-[11px] text-slate-400">{item.property} · {item.supplier}</p>
            </div>
            <JobStatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

function JobPipelinePanel({ jobs }: { jobs: DemoJob[] }) {
  const pipelineData = useMemo(() => {
    if (jobs.length === 0) return PIPELINE_DATA
    const counts: Record<string, number> = {}
    jobs.forEach(j => { counts[j.status] = (counts[j.status] ?? 0) + 1 })
    return [
      { name: "Scheduled", value: counts["scheduled"] ?? 0, color: "#3B82F6" },
      { name: "In Progress", value: counts["in_progress"] ?? 0, color: "#6366F1" },
      { name: "Waiting", value: counts["waiting"] ?? 0, color: "#F59E0B" },
      { name: "Overdue", value: counts["overdue"] ?? 0, color: "#EF4444" },
      { name: "Complete", value: counts["complete"] ?? 0, color: "#10B981" },
    ]
  }, [jobs])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Job Pipeline</h3>
        <span className="text-[11px] text-slate-400">{jobs.length} Total Jobs</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={pipelineData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }}
            cursor={{ fill: "#f8fafc" }}
          />
          <Bar dataKey="value" radius={4} name="Jobs">
            {pipelineData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function CostExposurePanel({ jobs }: { jobs: DemoJob[] }) {
  const costData = useMemo(() => {
    if (jobs.length === 0) return COST_EXPOSURE_DATA
    // Parse quoted amounts for cost exposure
    const parseAmount = (v: string) => {
      const n = parseFloat(v.replace(/[^0-9.]/g, ""))
      return isNaN(n) ? 0 : n
    }
    const overdue = jobs.filter(j => j.status === "overdue").reduce((s, j) => s + parseAmount(j.quoteValue), 0)
    const atRisk = jobs.filter(j => j.status === "waiting").reduce((s, j) => s + parseAmount(j.quoteValue), 0)
    const pending = jobs.filter(j => j.quoteValue === "—" || j.quoteValue === "").length * 100
    return [
      { name: "Overdue", value: overdue, color: "#EF4444" },
      { name: "At Risk", value: atRisk, color: "#F59E0B" },
      { name: "Pending Quotes", value: pending, color: "#94A3B8" },
    ]
  }, [jobs])

  const totalAtRisk = costData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Cost Exposure</h3>
      <div className="flex justify-center mb-3">
        <div className="relative">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={costData} cx={55} cy={55} innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                {costData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs font-bold text-slate-900">£{totalAtRisk.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500">At Risk</p>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {costData.map(d => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className="text-[11px] text-slate-600">{d.name}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-700">£{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentUpdatesPanel() {
  const updates = [
    { initials: "AC", name: "Alan Carter", action: "Updated boiler service checklist", time: "2h ago" },
    { initials: "SM", name: "Sarah Malik", action: "Gas safety cert — invoice overdue", time: "4h ago" },
    { initials: "JW", name: "James Wood", action: "Bathroom reno progress: 60% done", time: "5h ago" },
    { initials: "SY", name: "System", action: "3 jobs scheduled for tomorrow", time: "6h ago" },
    { initials: "DB", name: "Daniel Brown", action: "EICR cert started — access confirmed", time: "1d ago" },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Recent Updates</h3>
        <Activity className="w-4 h-4 text-slate-400" />
      </div>
      <div className="space-y-3">
        {updates.map((u, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[9px] text-white font-bold shrink-0">
              {u.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-slate-700"><span className="font-semibold">{u.name}</span> — {u.action}</p>
              <p className="text-[10px] text-slate-400">{u.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// View type buttons
// ---------------------------------------------------------------------------
const JOB_VIEW_TYPES = [
  { key: "list", label: "List", icon: List },
  { key: "card", label: "Card", icon: LayoutGrid },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "map", label: "Map", icon: Map },
  { key: "gantt", label: "Board", icon: GanttChart },
  { key: "data", label: "Data", icon: Database },
]

// ---------------------------------------------------------------------------
// Job card — shared by the Card grid and Board views
// ---------------------------------------------------------------------------
function JobCard({ job, compact = false }: { job: DemoJob; compact?: boolean }) {
  return (
    <Link
      href={`/app/work/jobs/${job.id}`}
      className="block bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-sm hover:border-slate-300 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <WorkPriorityBadge priority={job.priority} showLabel={false} />
          <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
        </div>
        {!compact && <WorkStatusBadge status={job.status} />}
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
        {job.category && <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">{job.category}</span>}
        {job.property && job.property !== "—" && <span className="truncate max-w-[140px]">{job.property}</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] text-white font-bold">
            {job.engineerInitials}
          </div>
          <span className="text-[11px] text-slate-500 truncate max-w-[90px]">{job.engineer}</span>
        </div>
        {job.quoteValue && job.quoteValue !== "—" && (
          <span className="text-[11px] font-semibold text-slate-700">{job.quoteValue}</span>
        )}
      </div>
    </Link>
  )
}

const JOB_BOARD_COLUMNS: { key: string; label: string }[] = [
  { key: "new", label: "New" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In Progress" },
  { key: "complete", label: "Complete" },
  { key: "cancelled", label: "Cancelled" },
]

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function JobsPage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { data: jobsData, isLoading } = useJobs(workspaceId)
  const updateJob = useUpdateJob()
  const deleteJob = useDeleteJob()
  const createSavedView = useCreateSavedView()
  const usingLive = !!(jobsData && jobsData.length > 0)
  const [bulkBusy, setBulkBusy] = useState(false)

  const [activeView, setActiveView] = useState("list")
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)

  const liveOrDemo: DemoJob[] = useMemo(() => {
    if (jobsData && jobsData.length > 0) {
      return jobsData.map(j => ({
        id: j.id,
        title: j.title,
        priority: j.priority ?? "medium",
        property: j.property_id ?? "—",
        block: "—",
        supplier: "—",
        engineer: j.assigned_to ?? "Unassigned",
        engineerInitials: (j.assigned_to ?? "?").slice(0, 2).toUpperCase(),
        team: "—",
        scheduledStart: j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", 09:00" : "—",
        scheduledEnd: j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", 17:00" : "—",
        dueDate: j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        status: j.status ?? "new",
        category: j.category ?? "General",
        sla: 80,
        slaColor: "amber",
        quoteValue: j.quoted_amount ? `£${Number(j.quoted_amount).toLocaleString()}` : "—",
        invoiceStatus: j.invoiced_amount && Number(j.invoiced_amount) > 0 ? "Invoiced" : "Not Invoiced",
        attachments: 0,
        notes: 0,
      }))
    }
    return DEMO_JOBS
  }, [jobsData])

  const propertyOptions = useMemo(
    () => ["All", ...Array.from(new Set(liveOrDemo.map(j => j.property).filter(p => p && p !== "—")))],
    [liveOrDemo]
  )
  const categoryOptions = useMemo(
    () => ["All", ...Array.from(new Set(liveOrDemo.map(j => j.category).filter((c): c is string => !!c)))],
    [liveOrDemo]
  )

  const displayJobs = useMemo(() => {
    let list = liveOrDemo
    if (search) list = list.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.property.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) list = list.filter(j => j.status === statusFilter)
    if (priorityFilter) list = list.filter(j => j.priority === priorityFilter)
    if (propertyFilter) list = list.filter(j => j.property === propertyFilter)
    if (categoryFilter) list = list.filter(j => j.category === categoryFilter)
    return list
  }, [liveOrDemo, search, statusFilter, priorityFilter, propertyFilter, categoryFilter])

  function handleDelete() {
    if (!pendingDelete || !workspaceId) return
    deleteJob.mutate({ id: pendingDelete.id, workspaceId })
    setPendingDelete(null)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedIds(e.target.checked ? displayJobs.map(j => j.id) : [])
  }

  // ── Saved Views ───────────────────────────────────────────────────────────
  interface JobViewConfig extends Record<string, unknown> {
    search: string; statusFilter: string; priorityFilter: string
    propertyFilter: string; categoryFilter: string; activeView: string
  }
  const viewConfig: JobViewConfig = {
    search, statusFilter, priorityFilter, propertyFilter, categoryFilter, activeView,
  }
  function applyView(c: JobViewConfig) {
    setSearch(c.search ?? "")
    setStatusFilter(c.statusFilter ?? "")
    setPriorityFilter(c.priorityFilter ?? "")
    setPropertyFilter(c.propertyFilter ?? "")
    setCategoryFilter(c.categoryFilter ?? "")
    if (c.activeView) setActiveView(c.activeView)
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  async function bulkSetStatus(status: string) {
    if (!workspaceId || selectedIds.length === 0 || !usingLive) return
    setBulkBusy(true)
    try {
      await Promise.all(
        selectedIds.map((id) =>
          updateJob.mutateAsync({ id, workspaceId, payload: { status } as never })
        )
      )
      setSelectedIds([])
    } catch {
      /* hook rolls back optimistic cache on error */
    } finally {
      setBulkBusy(false)
    }
  }
  function exportSelected() {
    const chosen = displayJobs.filter((j) => selectedIds.includes(j.id))
    const rows = chosen.map((j) =>
      [j.id, j.title, j.status, j.priority, j.property, j.dueDate]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = ["ID,Title,Status,Priority,Property,Due Date", ...rows].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }))
    a.download = "jobs-selected.csv"
    a.click()
  }

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Work orders and service delivery</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/app/work/jobs/new"
            className="h-8 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Job
          </Link>
          <Link
            href="/app/work/ppm"
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Calendar className="w-3.5 h-3.5" /> Schedule Visit
          </Link>
          <Link
            href="/app/work/suppliers"
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            Request Quote
          </Link>
          <SavedViewsMenu
            workspaceId={workspaceId}
            entity="jobs"
            currentConfig={viewConfig}
            onApply={applyView}
          />
          <button
            onClick={() => {
              const rows = displayJobs.map(j => [j.id, j.title, j.status, j.priority, j.property, j.dueDate].join(","))
              const csv = ["ID,Title,Status,Priority,Property,Due Date", ...rows].join("\n")
              const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "jobs.csv"; a.click()
            }}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => openCopilot({ prompt: "Summarise my open jobs and flag any at risk of an SLA breach." })}
            className="h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <JobsKpiStrip jobs={liveOrDemo} />

      {/* WorkTabNav */}
      <WorkTabNav />

      {/* View type buttons + filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {JOB_VIEW_TYPES.map(vt => {
            const Icon = vt.icon
            return (
              <button
                key={vt.key}
                onClick={() => setActiveView(vt.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-all",
                  activeView === vt.key
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
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown
          label="Priority"
          options={["All", "urgent", "high", "medium", "low"]}
          value={priorityFilter}
          onChange={setPriorityFilter}
        />
        <FilterDropdown
          label="Status"
          options={["All", "scheduled", "in_progress", "waiting", "overdue", "complete", "invoiced"]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterDropdown
          label="Property"
          options={propertyOptions}
          value={propertyFilter}
          onChange={setPropertyFilter}
        />
        <FilterDropdown
          label="Job Type"
          options={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
        <div className="relative">
          <select className="border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[12.5px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50 appearance-none cursor-pointer">
            <option>This Week</option>
            <option>This Month</option>
            <option>All Time</option>
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <button className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50">
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
      </div>

      {/* Main table */}
      {activeView === "list" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Table top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="rounded" onChange={handleSelectAll} checked={selectedIds.length === displayJobs.length && displayJobs.length > 0} />
              {selectedIds.length > 0 ? (
                <>
                  <span className="text-sm font-medium text-[#2563EB]">{selectedIds.length} jobs selected</span>
                  <div className="w-px h-4 bg-slate-200" />
                  {usingLive ? (
                    <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#2563EB]">
                      Set status
                      <select
                        disabled={bulkBusy}
                        value=""
                        onChange={(e) => { if (e.target.value) bulkSetStatus(e.target.value) }}
                        className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[12.5px] text-slate-700 disabled:opacity-50"
                      >
                        <option value="" disabled>Choose…</option>
                        {["new", "scheduled", "in_progress", "on_hold", "complete", "cancelled"].map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span className="text-[12px] text-slate-500">Bulk status changes apply to live jobs</span>
                  )}
                  {bulkBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />}
                  <button onClick={exportSelected} className="text-[12.5px] font-medium text-[#2563EB] hover:underline flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Export Selected
                  </button>
                  <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-slate-600">✕</button>
                </>
              ) : null}
            </div>
            <span className="text-xs text-slate-500">Showing {displayJobs.length} of {displayJobs.length} jobs</span>
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                  <div className="w-4 h-4 rounded bg-slate-200 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="h-3 bg-slate-200 rounded w-2/5" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/5" />
                  </div>
                  <div className="hidden md:block h-3 bg-slate-200 rounded w-20" />
                  <div className="h-5 bg-slate-100 rounded-full w-20" />
                </div>
              ))}
            </div>
          ) : displayJobs.length === 0 ? (
            <WorkEmptyState
              icon={Briefcase}
              title="No jobs found"
              description="No jobs match your current filters."
              ctaLabel="+ Create Job"
              ctaHref="/app/work/jobs/new"
            />
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-8 px-4 py-3"><input type="checkbox" /></th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">JOB / WORK ORDER</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">PRIORITY</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">PROPERTY</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">SUPPLIER</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">ENGINEER / TEAM</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">SCHEDULED</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">DUE DATE</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">STATUS</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">SLA</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">QUOTE</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">INVOICE</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">FILES</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {displayJobs.map(job => (
                  <tr
                    key={job.id}
                    className={cn(
                      "border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer",
                      selectedIds.includes(job.id) && "bg-blue-50/40"
                    )}
                  >
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(job.id)}
                        onChange={() => toggleSelect(job.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/app/work/jobs/${job.id}`} className="block hover:underline">
                        <p className="text-sm font-semibold text-slate-900 truncate max-w-[220px]">{job.title}</p>
                        <p className="text-[11px] text-slate-400">#{job.id}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <WorkPriorityBadge priority={job.priority} />
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-slate-600 truncate max-w-[130px]">{job.property}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-slate-600">{job.supplier}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                          {job.engineerInitials}
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">{job.engineer}</p>
                          <p className="text-[10px] text-slate-400">{job.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <div>
                        <p className="text-xs text-slate-600">{job.scheduledStart}</p>
                        <p className="text-[10px] text-slate-400">{job.scheduledEnd}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Calendar className="w-3 h-3" />
                        {job.dueDate}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500">{job.sla}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-200">
                          <div
                            className={cn("h-1.5 rounded-full", `bg-${job.slaColor}-500`)}
                            style={{ width: `${job.sla}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-sm font-medium text-slate-700">{job.quoteValue}</td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <InvoiceBadge status={job.invoiceStatus} />
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />{job.attachments}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{job.notes}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <ActionMenu
                        items={[
                          { label: "View job", icon: Eye, onClick: () => router.push(`/app/work/jobs/${job.id}`) },
                          { label: "Edit", icon: Edit2, onClick: () => router.push(`/app/work/jobs/${job.id}`) },
                          ...(!["complete", "invoiced", "closed"].includes(job.status)
                            ? [{ label: "Mark complete", icon: CheckCircle2, onClick: () => workspaceId && updateJob.mutate({ id: job.id, workspaceId, payload: { status: "complete", completed_date: new Date().toISOString() } }) }]
                            : []),
                          { label: "Delete", icon: Trash2, variant: "danger" as const, onClick: () => setPendingDelete({ id: job.id, title: job.title }) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Showing 1 to {displayJobs.length} of {displayJobs.length} jobs</p>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3].map(p => (
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
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card view */}
      {activeView === "card" && (
        displayJobs.length === 0 ? (
          <WorkEmptyState icon={Briefcase} title="No jobs found" description="Switch to List view or create a job." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {displayJobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )
      )}

      {/* Board (kanban) view — columns by status */}
      {activeView === "gantt" && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {JOB_BOARD_COLUMNS.map((col) => {
            const colJobs = displayJobs.filter((j) => j.status === col.key)
            return (
              <div key={col.key} className="w-72 shrink-0">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[12.5px] font-semibold text-slate-700">{col.label}</span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{colJobs.length}</span>
                </div>
                <div className="space-y-2 min-h-[60px] rounded-xl bg-slate-50/60 p-2">
                  {colJobs.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-4">No jobs</p>
                  ) : (
                    colJobs.map((job) => <JobCard key={job.id} job={job} compact />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Views still requiring scheduling/geo backends */}
      {(activeView === "calendar" || activeView === "map" || activeView === "data") && (
        <WorkEmptyState
          icon={Briefcase}
          title={`${JOB_VIEW_TYPES.find(v => v.key === activeView)?.label ?? "View"} coming soon`}
          description="Use List, Card or Board view to manage your jobs."
        />
      )}

      {/* Bottom panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <TodaySchedulePanel jobs={liveOrDemo} />
        <JobPipelinePanel jobs={liveOrDemo} />
        <CostExposurePanel jobs={liveOrDemo} />
        <RecentUpdatesPanel />
      </div>

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setPendingDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Delete job</h3>
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
