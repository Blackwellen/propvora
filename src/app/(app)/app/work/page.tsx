"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  Download,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  Receipt,
  Briefcase,
  Clock,
  TrendingDown,
  Calendar,
  BarChart3,
  UserPlus,
  FileText,
  Upload,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MobileTopBar } from "@/components/mobile"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { WorkKpiStrip, type WorkKpi } from "@/components/work/WorkKpiStrip"
import { useTasks } from "@/hooks/useTasks"
import { useJobs } from "@/hooks/useJobs"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { openCopilot } from "@/lib/copilot/open"
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

// ─── Seed fallbacks (shown when workspace has no data yet) ────────────────────

const SEED_KPIS = {
  openWork: 18, overdue: 4, waitingSupplier: 3, revenueBlocking: 2,
  invoicePending: 5, dueThisWeek: 12, scheduledJobs: 7, completionRate: 72,
}

const SEED_PIPELINE = [
  { name: "To Do",       value: 8,  color: "#94A3B8" },
  { name: "In Progress", value: 5,  color: "#2563EB" },
  { name: "Waiting",     value: 3,  color: "#F59E0B" },
  { name: "Blocked",     value: 2,  color: "#EF4444" },
  { name: "Done",        value: 15, color: "#10B981" },
]

const SEED_CHASE = [
  { title: "Gas Safety Certificate", property: "14 Grove St",  supplier: "Gas Safe Co",          status: "OVERDUE 3 DAYS", color: "red"   as const, initials: "GS" },
  { title: "Boiler Service",         property: "Manor Flat 3", supplier: "HeatPro Ltd",          status: "Due in 2 days",  color: "amber" as const, initials: "HP" },
  { title: "Plumbing repair",        property: "22 Oak Ave",   supplier: "Supplier not responded", status: "No response",  color: "red"   as const, initials: "PA" },
]

const SEED_UPCOMING = [
  { date: "JUN 16", title: "Boiler Annual Service",       property: "14 Grove St",      status: "Scheduled",  statusColor: "bg-blue-50 text-blue-700"       },
  { date: "JUN 17", title: "Gas Safety Inspection",       property: "Manor Flat 3B",    status: "Confirmed",  statusColor: "bg-emerald-50 text-emerald-700"  },
  { date: "JUN 19", title: "Electrical Safety Check",     property: "Victoria Terrace", status: "At Risk",    statusColor: "bg-amber-50 text-amber-700"      },
  { date: "JUN 21", title: "Plumbing Repair — Kitchen",   property: "22 Oak Ave",       status: "Unassigned", statusColor: "bg-slate-100 text-slate-600"     },
  { date: "JUN 22", title: "Possession Readiness Review", property: "Brunswick HMO",    status: "Legal",      statusColor: "bg-red-50 text-red-700"          },
]

const SEED_BLOCKED = [
  { title: "Legal Evidence Review",       property: "22 Oak Ave",       tag: "Legal",            tagColor: "bg-red-50 text-red-700" },
  { title: "Electrical compliance cert",  property: "Victoria Terrace", tag: "Waiting Supplier", tagColor: "bg-amber-50 text-amber-700" },
  { title: "Kitchen extraction fan",      property: "Manor Flat 2A",    tag: "Parts On Order",   tagColor: "bg-slate-100 text-slate-600" },
]

const SEED_ACTIVITY = [
  { icon: CheckCircle2,  bg: "bg-emerald-50", color: "text-emerald-600", text: "Boiler service marked complete at 14 Grove St",  initials: "JT", time: "2h ago" },
  { icon: ClipboardList, bg: "bg-blue-50",    color: "text-blue-600",    text: "New task created: Gas safety inspection",         initials: "MP", time: "4h ago" },
  { icon: MessageSquare, bg: "bg-violet-50",  color: "text-violet-600",  text: "Supplier HeatPro replied to quote request",       initials: "HP", time: "6h ago" },
  { icon: AlertTriangle, bg: "bg-amber-50",   color: "text-amber-600",   text: "Plumbing repair flagged overdue at 22 Oak Ave",   initials: "SA", time: "1d ago" },
  { icon: Briefcase,     bg: "bg-blue-50",    color: "text-blue-600",    text: "Job assigned to Gas Safe Co",                      initials: "GS", time: "1d ago" },
]

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Create Task",      href: "/app/work/tasks/new",   icon: ClipboardList, iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  { label: "Create Job",       href: "/app/work/jobs/new",    icon: Briefcase,     iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  { label: "Add Supplier",     href: "/app/work/suppliers",   icon: UserPlus,      iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { label: "Request Quote",    href: "/app/work/suppliers",   icon: FileText,      iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
  { label: "Log Issue",        href: "/app/work/tasks/new",   icon: AlertTriangle, iconBg: "bg-red-50",     iconColor: "text-red-600" },
  { label: "Upload Document",  href: "/app/work",             icon: Upload,        iconBg: "bg-slate-100",  iconColor: "text-slate-600" },
  { label: "View Calendar",    href: "/app/calendar",         icon: Calendar,      iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  { label: "AI Assistant",     href: "/app/work",             icon: Sparkles,      iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
]

const SUPPLIER_HEALTH = [
  { name: "On Time",  value: 82, color: "#10B981" },
  { name: "Late",     value: 12, color: "#F59E0B" },
  { name: "Overdue",  value: 6,  color: "#EF4444" },
]

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WorkPage() {
  const workspaceId = useWorkspaceId()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(workspaceId)
  const { data: jobs = [], isLoading: jobsLoading } = useJobs(workspaceId)

  const hasLiveData = tasks.length > 0 || jobs.length > 0

  // ─── Live KPI calculations ───────────────────────────────────────────────
  const kpiValues = useMemo(() => {
    if (!hasLiveData) return { openWork: 0, overdue: 0, waitingSupplier: 0, revenueBlocking: 0, invoicePending: 0, dueThisWeek: 0, scheduledJobs: 0, completionRate: 0 }
    const now = new Date()
    const weekAhead = new Date(now.getTime() + 7 * 86_400_000)

    const JOB_CLOSED = ["complete", "invoiced", "closed", "cancelled"]
    const isJobOpen = (s: string) => !JOB_CLOSED.includes(s)

    const openWork = tasks.filter(t => !["done", "cancelled", "archived"].includes(t.status)).length
                   + jobs.filter(j => isJobOpen(j.status)).length

    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < now && !["done", "cancelled"].includes(t.status)).length
                  + jobs.filter(j => j.scheduled_date && new Date(j.scheduled_date) < now && isJobOpen(j.status)).length

    const waitingSupplier = tasks.filter(t => t.status === "waiting").length
                           + jobs.filter(j => ["supplier_requested", "quote_received"].includes(j.status)).length

    const dueThisWeek = tasks.filter(t => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= weekAhead && !["done", "cancelled"].includes(t.status)).length
                       + jobs.filter(j => j.scheduled_date && new Date(j.scheduled_date) >= now && new Date(j.scheduled_date) <= weekAhead && isJobOpen(j.status)).length

    const scheduledJobs = jobs.filter(j => j.status === "scheduled").length

    const doneTasks = tasks.filter(t => t.status === "done").length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    return {
      openWork,
      overdue,
      waitingSupplier,
      revenueBlocking: 0,
      invoicePending: 0,
      dueThisWeek,
      scheduledJobs,
      completionRate,
    }
  }, [tasks, jobs, hasLiveData])

  // ─── Pipeline data ───────────────────────────────────────────────────────
  const pipelineData = useMemo(() => {
    if (!hasLiveData) return [
      { name: "To Do",       value: 0, color: "#94A3B8" },
      { name: "In Progress", value: 0, color: "#2563EB" },
      { name: "Waiting",     value: 0, color: "#F59E0B" },
      { name: "Blocked",     value: 0, color: "#EF4444" },
      { name: "Done",        value: 0, color: "#10B981" },
    ]
    return [
      { name: "To Do",       value: tasks.filter(t => t.status === "todo").length,        color: "#94A3B8" },
      { name: "In Progress", value: tasks.filter(t => t.status === "in_progress").length, color: "#2563EB" },
      { name: "Waiting",     value: tasks.filter(t => t.status === "waiting").length,     color: "#F59E0B" },
      { name: "Blocked",     value: tasks.filter(t => t.status === "blocked").length,     color: "#EF4444" },
      { name: "Done",        value: tasks.filter(t => t.status === "done").length,        color: "#10B981" },
    ]
  }, [tasks, hasLiveData])

  const pipelineTotal = pipelineData.reduce((s, d) => s + d.value, 0)

  // ─── Overdue / chase items ───────────────────────────────────────────────
  const chaseItems = useMemo(() => {
    if (!hasLiveData) return []
    const now = new Date()
    return tasks
      .filter(t => t.due_date && new Date(t.due_date) < now && !["done", "cancelled"].includes(t.status))
      .slice(0, 3)
      .map(t => {
        const diffDays = Math.ceil((now.getTime() - new Date(t.due_date!).getTime()) / 86_400_000)
        return {
          title: t.title,
          property: t.property_id ?? "—",
          supplier: "—",
          status: `OVERDUE ${diffDays} DAY${diffDays === 1 ? "" : "S"}`,
          color: "red" as const,
          initials: t.title.slice(0, 2).toUpperCase(),
        }
      })
  }, [tasks, hasLiveData])

  // ─── Upcoming tasks (due in 7 days) ─────────────────────────────────────
  const upcomingItems = useMemo(() => {
    if (!hasLiveData) return []
    const now = new Date()
    const weekAhead = new Date(now.getTime() + 7 * 86_400_000)
    return tasks
      .filter(t => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= weekAhead && !["done", "cancelled"].includes(t.status))
      .slice(0, 5)
      .map(t => {
        const d = new Date(t.due_date!)
        const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase()
        return {
          date: dateStr,
          title: t.title,
          property: t.property_id ?? "—",
          status: t.status === "in_progress" ? "In Progress" : t.status === "todo" ? "To Do" : "Waiting",
          statusColor: t.status === "in_progress" ? "bg-blue-50 text-blue-700" : t.status === "waiting" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600",
        }
      })
  }, [tasks, hasLiveData])

  // ─── Blocked items ───────────────────────────────────────────────────────
  const blockedItems = useMemo(() => {
    if (!hasLiveData) return []
    return tasks
      .filter(t => t.status === "blocked")
      .slice(0, 3)
      .map(t => ({
        title: t.title,
        property: t.property_id ?? "—",
        tag: "Blocked",
        tagColor: "bg-red-50 text-red-700",
      }))
  }, [tasks, hasLiveData])

  const displayBlocked = blockedItems

  // ─── Recent activity (most recently updated tasks/jobs) ──────────────────
  const activityItems = useMemo(() => {
    if (!hasLiveData) return []
    const events = [
      ...tasks.map(t => ({
        ts: t.updated_at ?? t.created_at,
        done: t.status === "done",
        text: t.status === "done" ? `Task completed: ${t.title}` : `Task updated: ${t.title}`,
        initials: t.title.slice(0, 2).toUpperCase(),
      })),
      ...jobs.map(j => ({
        ts: j.updated_at ?? j.created_at,
        done: ["complete", "completed"].includes(j.status),
        text: ["complete", "completed"].includes(j.status) ? `Job completed: ${j.title}` : `Job updated: ${j.title}`,
        initials: j.title.slice(0, 2).toUpperCase(),
      })),
    ]
      .filter(e => e.ts)
      .sort((a, b) => new Date(b.ts!).getTime() - new Date(a.ts!).getTime())
      .slice(0, 5)
    if (events.length === 0) return []
    return events.map(e => ({
      icon: e.done ? CheckCircle2 : ClipboardList,
      bg: e.done ? "bg-emerald-50" : "bg-blue-50",
      color: e.done ? "text-emerald-600" : "text-blue-600",
      text: e.text,
      initials: e.initials,
      time: timeAgo(e.ts!),
    }))
  }, [tasks, jobs, hasLiveData])

  // ─── Supplier response health (from supplier-linked jobs) ────────────────
  const supplierHealth = useMemo(() => {
    const supplierJobs = jobs.filter(j => j.supplier_contact_id)
    if (!hasLiveData || supplierJobs.length === 0) return []
    const now = new Date()
    const CLOSED = ["complete", "invoiced", "closed"]
    let onTime = 0, late = 0, overdue = 0
    for (const j of supplierJobs) {
      const done = CLOSED.includes(j.status)
      if (done) {
        if (j.completed_date && j.scheduled_date && new Date(j.completed_date) > new Date(j.scheduled_date)) late++
        else onTime++
      } else if (j.scheduled_date && new Date(j.scheduled_date) < now) {
        overdue++
      } else {
        onTime++
      }
    }
    const total = onTime + late + overdue || 1
    return [
      { name: "On Time", value: Math.round((onTime / total) * 100), color: "#10B981" },
      { name: "Late",    value: Math.round((late / total) * 100),   color: "#F59E0B" },
      { name: "Overdue", value: Math.round((overdue / total) * 100), color: "#EF4444" },
    ]
  }, [jobs, hasLiveData])

  // ─── Cost exposure (from open job amounts) ───────────────────────────────
  const costExposure = useMemo(() => {
    if (!hasLiveData || jobs.length === 0) return null
    const now = new Date()
    const weekAhead = new Date(now.getTime() + 7 * 86_400_000)
    const JOB_CLOSED = ["complete", "invoiced", "closed", "cancelled"]
    const amount = (j: typeof jobs[number]) => j.approved_amount ?? j.quoted_amount ?? 0
    let overdueCost = 0, atRiskCost = 0, pendingQuotes = 0
    for (const j of jobs) {
      if (JOB_CLOSED.includes(j.status)) continue
      if (["supplier_requested", "quote_received"].includes(j.status)) pendingQuotes += amount(j)
      else if (j.scheduled_date && new Date(j.scheduled_date) < now) overdueCost += amount(j)
      else if (j.scheduled_date && new Date(j.scheduled_date) <= weekAhead) atRiskCost += amount(j)
    }
    return { overdue: overdueCost, atRisk: atRiskCost, pending: pendingQuotes, total: overdueCost + atRiskCost + pendingQuotes }
  }, [jobs, hasLiveData])

  // ─── Build KPI strip ────────────────────────────────────────────────────
  const KPIS: WorkKpi[] = [
    { icon: Briefcase,     iconBg: "bg-blue-50",    iconColor: "text-blue-600",   value: kpiValues.openWork,       label: "Open Work",       sub: hasLiveData ? "Live count" : "Sample data",       subColor: hasLiveData ? "text-emerald-600" : "text-slate-400" },
    { icon: AlertTriangle, iconBg: "bg-red-50",     iconColor: "text-red-600",    value: kpiValues.overdue,        label: "Overdue",         sub: kpiValues.overdue > 0 ? `${kpiValues.overdue} critical` : "All on time", subColor: kpiValues.overdue > 0 ? "text-red-500" : "text-emerald-600" },
    { icon: Clock,         iconBg: "bg-amber-50",   iconColor: "text-amber-600",  value: kpiValues.waitingSupplier, label: "Waiting Supplier", sub: "Chase required",                               subColor: "text-amber-600" },
    { icon: TrendingDown,  iconBg: "bg-red-50",     iconColor: "text-red-600",    value: kpiValues.revenueBlocking, label: "Revenue Blocking", sub: "High urgency",                                subColor: "text-red-500" },
    { icon: Receipt,       iconBg: "bg-violet-50",  iconColor: "text-violet-600", value: kpiValues.invoicePending, label: "Invoice Pending",  sub: "Awaiting payment",                             subColor: "text-slate-500" },
    { icon: Calendar,      iconBg: "bg-blue-50",    iconColor: "text-blue-600",   value: kpiValues.dueThisWeek,    label: "Due This Week",    sub: "Next 7 days",                                  subColor: "text-amber-600" },
    { icon: Briefcase,     iconBg: "bg-emerald-50", iconColor: "text-emerald-600", value: kpiValues.scheduledJobs, label: "Scheduled Jobs",   sub: "Upcoming",                                    subColor: "text-slate-500" },
    { ring: true, ringColor: "#2563EB",             value: kpiValues.completionRate, label: "Completion Rate",     sub: hasLiveData ? "Tasks completed" : "Sample data",                          subColor: "text-emerald-600" },
  ]

  const isLoading = tasksLoading || jobsLoading

  // ─── CSV export of current work items ────────────────────────────────────
  const exportCsv = () => {
    const rows = [
      ["Type", "Title", "Status", "Priority", "Due/Scheduled", "Property"],
      ...tasks.map(t => ["Task", t.title, t.status, t.priority, t.due_date ?? "", t.property_id ?? ""]),
      ...jobs.map(j => ["Job", j.title, j.status, j.priority, j.scheduled_date ?? "", j.property_id ?? ""]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `work-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Mobile top bar + tab rail */}
      <MobileTopBar
        title="Work"
        subtitle="Operations command centre"
        primaryAction={{ label: "Create task", icon: Plus, href: "/app/work/tasks/new" }}
        overflowActions={[
          { label: "Create job", icon: Plus, href: "/app/work/jobs/new" },
          { label: "Export", icon: Download, onClick: exportCsv },
          { label: "Ask AI", icon: Sparkles, onClick: () => openCopilot({ prompt: "/summarise" }) },
        ]}
      />
      <div className="md:hidden -mx-4">
        <WorkTabNav />
      </div>

      {/* Page Header + tab rail (canonical order: title → tabs → content) */}
      <div className="hidden md:block">
      <SectionHeader
        title="Work"
        subtitle="Operations command centre"
        actions={
          <>
            <Link
              href="/app/work/tasks/new"
              className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Task
            </Link>
            <Link
              href="/app/work/jobs/new"
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Job
            </Link>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => openCopilot({ prompt: "/summarise" })}
              className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Ask AI
            </button>
          </>
        }
        tabs={<WorkTabNav />}
      />
      </div>

      {/* KPI Strip */}
      <WorkKpiStrip kpis={KPIS} />

      {/* Row 1: Pipeline | Chase Queue | Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.75fr_1.25fr] gap-4">
        {/* Work Pipeline */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Work Pipeline</h2>
            <Link
              href="/app/work/board"
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5"
            >
              View Board <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="h-[180px] bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                  cursor={{ fill: "#F8FAFC" }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {pipelineData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-slate-400" />
              {pipelineTotal} Total Items
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {kpiValues.completionRate}% Completion Rate
            </span>
          </div>
        </div>

        {/* Urgent Chase Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Urgent Chase Queue</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
              {chaseItems.length} Urgent
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {chaseItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No overdue items — great work!</p>
            ) : chaseItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    item.color === "red" ? "bg-red-500" : "bg-amber-400"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.property} · {item.supplier}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] font-semibold mt-0.5",
                      item.color === "red" ? "text-red-500" : "text-amber-500"
                    )}
                  >
                    {item.status}
                  </p>
                </div>
                <Link
                  href="/app/work/tasks"
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
                >
                  Chase <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Next 7 Days */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Next 7 Days</h2>
            <Link
              href="/app/calendar"
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5"
            >
              Calendar <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {upcomingItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nothing due in the next 7 days.</p>
            ) : upcomingItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-12 shrink-0 rounded-lg bg-blue-50 px-1 py-1 text-center">
                  <p className="text-[9px] font-bold text-blue-600 leading-none">{item.date}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{item.title}</p>
                  <p className="text-[10px] text-slate-500 truncate">{item.property}</p>
                </div>
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0", item.statusColor)}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Supplier Health | SLA Alerts | Blocked Items | Cost Exposure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supplier Response Health */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Supplier Response Health</h2>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={supplierHealth}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {supplierHealth.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 11 }}
                formatter={(val) => [`${val}%`]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {supplierHealth.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                </span>
                <span className="font-semibold text-slate-700">{s.value}%</span>
              </div>
            ))}
          </div>
          <Link
            href="/app/work/suppliers"
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
          >
            View Suppliers <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* SLA & Overdue Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">SLA & Overdue Alerts</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{kpiValues.overdue} Overdue</p>
                <p className="text-xs text-slate-500">Require immediate attention</p>
              </div>
              <Link href="/app/work/tasks" className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] shrink-0">
                View →
              </Link>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{kpiValues.dueThisWeek} Due This Week</p>
                <p className="text-xs text-slate-500">Next 7 days</p>
              </div>
              <Link href="/app/work/tasks" className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] shrink-0">
                View →
              </Link>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{kpiValues.scheduledJobs} Scheduled Jobs</p>
                <p className="text-xs text-slate-500">Upcoming</p>
              </div>
              <Link href="/app/calendar" className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] shrink-0">
                View →
              </Link>
            </div>
          </div>
        </div>

        {/* Blocked Items */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Blocked Items</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
              {displayBlocked.length} Blocked
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {displayBlocked.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.property}</p>
                  <span className={cn("inline-flex mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md", item.tagColor)}>
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/app/work/board"
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
          >
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Cost Exposure */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Cost Exposure</h2>
          <p className="text-3xl font-bold text-slate-900 mt-2 leading-none">{fmt(costExposure?.total ?? 8420)}</p>
          <p className="text-xs text-slate-500 mb-4">Potential Exposure</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                Overdue
              </span>
              <span className="font-semibold text-red-600">{fmt(costExposure?.overdue ?? 4250)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                At Risk
              </span>
              <span className="font-semibold text-amber-600">{fmt(costExposure?.atRisk ?? 2950)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                Pending Quotes
              </span>
              <span className="font-semibold text-blue-600">{fmt(costExposure?.pending ?? 1220)}</span>
            </div>
          </div>
          <Link
            href="/app/work/jobs"
            className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
          >
            View Financial Impact <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Row 3: Recent Activity | Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {activityItems.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      item.bg
                    )}
                  >
                    <Icon className={cn("w-4 h-4", item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">{item.text}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold text-white bg-slate-400 rounded-full w-5 h-5 flex items-center justify-center leading-none">
                      {item.initials.slice(0, 1)}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      action.iconBg
                    )}
                  >
                    <Icon className={cn("w-5 h-5", action.iconColor)} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                    {action.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
