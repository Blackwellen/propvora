"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  Calendar,
  Cpu,
  Users,
  Download,
  ChevronRight,
  Eye,
  Copy,
  CheckCircle,
  MessageSquare,
  FileText,
  CheckSquare,
  Globe,
  DollarSign,
  AlertTriangle,
  Settings,
  Bell,
  XCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"
import { MoneyTabNav, MoneyKpiCard, MoneyPageHeader } from "@/components/money"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobilePageHeader from "@/components/mobile/MobilePageHeader"
import { cn } from "@/lib/utils"
import { useMoneyActivity, type MoneyActivityRow } from "@/hooks/useMoneyData"
import { useWorkspace } from "@/providers/AuthProvider"

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type FilterKey =
  | "all"
  | "payments"
  | "messages"
  | "documents"
  | "tasks"
  | "portal"
  | "alerts"
  | "system"

interface ActivityRow {
  time: string
  dotColor: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  avatarInitials: string
  avatarBg: string
  contactName: string
  contactType: string
  contactTypeBg: string
  eventTitle: string
  description: string
  chip?: string
  chipBg?: string
  amount?: string
  amountColor?: string
  filter: FilterKey
}

interface MostActiveContact {
  rank: number
  initials: string
  initialsColor: string
  name: string
  type: string
  typeBg: string
  count: number
  trendUp: boolean
  trendPct: string
}

interface DonutSegment {
  label: string
  pct: number
  color: string
}

interface AttentionItem {
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  label: string
  count: number
}

// â”€â”€â”€ Static data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "payments", label: "Payments" },
  { key: "messages", label: "Messages" },
  { key: "documents", label: "Documents" },
  { key: "tasks", label: "Tasks" },
  { key: "portal", label: "Portal" },
  { key: "alerts", label: "Alerts" },
  { key: "system", label: "System" },
]

function mapActivityRow(r: MoneyActivityRow): ActivityRow {
  const isIncome = r.event_type === "income_received"
  const isExpense = r.event_type === "expense_paid"
  const meta = r.metadata as Record<string, unknown> | null
  const amount = meta?.amount as number | undefined
  const amountStr = amount != null ? `${isExpense ? "-" : "+"}£${(amount / 100).toFixed(2)}` : undefined
  return {
    time: new Date(r.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    dotColor: isIncome ? "bg-emerald-500" : isExpense ? "bg-red-400" : "bg-slate-400",
    iconBg: isIncome ? "bg-emerald-50" : isExpense ? "bg-red-50" : "bg-slate-100",
    iconColor: isIncome ? "text-emerald-600" : isExpense ? "text-red-500" : "text-slate-500",
    icon: isIncome ? <ArrowDownLeft className="w-4 h-4" /> : isExpense ? <ArrowUpRight className="w-4 h-4" /> : <Activity className="w-4 h-4" />,
    avatarInitials: (r.performed_by ?? "SY").slice(0, 2).toUpperCase(),
    avatarBg: "bg-slate-200 text-slate-600",
    contactName: r.performed_by ?? "System",
    contactType: r.performed_by ? "User" : "Auto",
    contactTypeBg: r.performed_by ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500",
    eventTitle: r.description || (isIncome ? "Income received" : isExpense ? "Expense paid" : r.event_type.replace(/_/g, " ")),
    description: r.entity_type,
    chip: r.event_type.replace(/_/g, " "),
    chipBg: isIncome ? "bg-emerald-50 text-emerald-700" : isExpense ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600",
    amount: amountStr,
    amountColor: isIncome ? "text-emerald-600" : "text-red-500",
    filter: isIncome || isExpense ? "payments" : "system",
  }
}

const MOST_ACTIVE: MostActiveContact[] = []

const DONUT_SEGMENTS: DonutSegment[] = []

const ATTENTION_ITEMS: AttentionItem[] = []

// Bar chart day heights for activity summary
const WEEK_BARS = [
  { day: "Mon", height: 0 },
  { day: "Tue", height: 0 },
  { day: "Wed", height: 0 },
  { day: "Thu", height: 0 },
  { day: "Fri", height: 0 },
  { day: "Sat", height: 0 },
  { day: "Sun", height: 0 },
]
const WEEK_MAX = 1

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DonutChart({
  segments,
  center,
}: {
  segments: DonutSegment[]
  center: string
}) {
  let cumulative = 0
  const slices = segments.map((seg) => {
    const start = cumulative
    cumulative += seg.pct
    return { ...seg, start }
  })
  const gradient = slices
    .map((s) => `${s.color} ${s.start}% ${s.start + s.pct}%`)
    .join(", ")

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
        <div
          className="w-full h-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-white rounded-full flex items-center justify-center"
            style={{ width: 54, height: 54 }}
          >
            <span className="text-base font-bold text-slate-900">{center}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: seg.color }}
            />
            <span className="text-slate-600 flex-1 truncate">{seg.label}</span>
            <span className="text-slate-500 text-[11px]">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [showSystemEvents, setShowSystemEvents] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { workspace } = useWorkspace()
  const { data: activityData = [], isLoading } = useMoneyActivity(workspace?.id)

  const activityRows = useMemo(() => activityData.map(mapActivityRow), [activityData])

  // Derived KPIs from real data
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const eventsToday = activityData.filter(r => new Date(r.created_at).getTime() >= todayStart).length
  const eventsWeek = activityData.filter(r => new Date(r.created_at).getTime() >= weekStart).length
  const eventsMonth = activityData.filter(r => new Date(r.created_at).getTime() >= monthStart).length
  const systemActions = activityData.filter(r => !r.performed_by).length
  const userActions = activityData.filter(r => !!r.performed_by).length

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredRows = activityRows.filter((row) => {
    if (!showSystemEvents && row.filter === "system") return false
    if (activeFilter !== "all" && row.filter !== activeFilter) return false
    if (
      searchQuery &&
      !row.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !row.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <MobileTopBar
        title="Activity"
        subtitle="Financial events & audit"
        primaryAction={{ label: "Export Activity", icon: Download, onClick: () => showToast("Exporting activity...") }}
      />
      <MoneyTabNav />

      <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full">
        {/* Header */}
        <div className="hidden md:block">
        <MoneyPageHeader
          breadcrumb="Activity"
          title="Financial Activity"
          subtitle="All financial events, system actions and audit changes."
          actions={
            <button
              onClick={() => showToast("Exporting activity...")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Activity
            </button>
          }
        />
        </div>

        {/* Mobile header â€” search */}
        <MobilePageHeader hideTitle
          title="Financial Activity"
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search activityâ€¦"
        />

        {/* KPI Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MoneyKpiCard
            label="Events Today"
            value={isLoading ? "—" : String(eventsToday)}
            subtitle={`${eventsMonth} this month`}
            icon={<Activity className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MoneyKpiCard
            label="This Week"
            value={isLoading ? "—" : String(eventsWeek)}
            subtitle="Last 7 days"
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <MoneyKpiCard
            label="System Actions"
            value={isLoading ? "—" : String(systemActions)}
            subtitle="Automated events"
            icon={<Cpu className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <MoneyKpiCard
            label="User Actions"
            value={isLoading ? "—" : String(userActions)}
            subtitle="Manual actions"
            icon={<Users className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT ~65% */}
          <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">
            {/* Filter row */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {FILTER_CHIPS.map((chip) => (
                    <button
                      key={chip.key}
                      onClick={() => setActiveFilter(chip.key)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                        activeFilter === chip.key
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="hidden md:flex items-center gap-2 ml-auto flex-wrap">
                  {/* Search */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search activity..."
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />

                  {/* User filter */}
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    All Users
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </button>

                  {/* Property filter */}
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    All Properties
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </button>

                  {/* System events toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs text-slate-600">
                      Show system events
                    </span>
                    <button
                      role="switch"
                      aria-checked={showSystemEvents}
                      onClick={() => setShowSystemEvents((v) => !v)}
                      className={cn(
                        "relative w-9 h-5 rounded-full transition-colors focus:outline-none",
                        showSystemEvents ? "bg-blue-600" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                          showSystemEvents ? "translate-x-4" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  Today
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Rows */}
              <div className="flex flex-col divide-y divide-slate-50">
                {filteredRows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3 hover:bg-slate-50/50 transition-colors rounded-xl px-2 -mx-2 group"
                  >
                    {/* Time */}
                    <span className="text-xs text-slate-500 w-12 shrink-0 text-right">
                      {row.time}
                    </span>

                    {/* Dot */}
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        row.dotColor
                      )}
                    />

                    {/* Icon circle */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        row.iconBg,
                        row.iconColor
                      )}
                    >
                      {row.icon}
                    </div>

                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        row.avatarBg
                      )}
                    >
                      {row.avatarInitials}
                    </div>

                    {/* Contact + event */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800">
                          {row.contactName}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            row.contactTypeBg
                          )}
                        >
                          {row.contactType}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 leading-tight">
                        {row.eventTitle}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {row.description}
                      </p>
                    </div>

                    {/* Right side: chip + amount */}
                    <div className="flex items-center gap-2 shrink-0">
                      {row.amount && (
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            row.amountColor
                          )}
                        >
                          {row.amount}
                        </span>
                      )}
                      {row.chip && (
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            row.chipBg
                          )}
                        >
                          {row.chip}
                        </span>
                      )}
                      <ActionMenu
                        items={[
                          { label: "View Details", icon: Eye, onClick: () => showToast(`${row.eventTitle} â€” ${row.description}`) },
                          { label: "Copy Description", icon: Copy, onClick: () => { navigator.clipboard?.writeText(`${row.eventTitle} â€” ${row.description}`); showToast("Copied to clipboard") } },
                        ]}
                      />
                    </div>
                  </div>
                ))}

                {filteredRows.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Financial activity will appear here once transactions are recorded.
                  </div>
                )}
              </div>

              {/* Load more */}
              <div className="mt-5 flex justify-center">
                <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Load more activity
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT ~35% */}
          <div className="flex flex-col gap-4 w-full lg:w-80 xl:w-96 shrink-0">
            {/* A. Activity Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Activity Summary
              </h3>
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Today</span>
                  <span className="font-semibold text-slate-900">{isLoading ? "—" : eventsToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">This week</span>
                  <span className="font-semibold text-slate-900">{isLoading ? "—" : eventsWeek}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">This month</span>
                  <span className="font-semibold text-slate-900">{isLoading ? "—" : eventsMonth}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total loaded</span>
                  <span className="font-semibold text-slate-900">{isLoading ? "—" : activityData.length}</span>
                </div>
              </div>

              {/* 7-bar week chart */}
              <div className="flex items-end gap-1.5 h-12">
                {WEEK_BARS.map((bar) => (
                  <div
                    key={bar.day}
                    className="flex flex-col items-center flex-1"
                    style={{ justifyContent: "flex-end" }}
                  >
                    <div
                      className="w-full bg-blue-500 rounded-t-sm"
                      style={{
                        height: `${(bar.height / WEEK_MAX) * 44}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex mt-1">
                {WEEK_BARS.map((bar) => (
                  <span
                    key={bar.day}
                    className="text-[9px] text-slate-500 flex-1 text-center"
                  >
                    {bar.day}
                  </span>
                ))}
              </div>
            </div>

            {/* B. Most Active Contacts */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Most Active Contacts
                </h3>
                <button className="text-xs text-blue-600 hover:underline">
                  View all â†’
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {MOST_ACTIVE.length === 0 && <p className="text-xs text-slate-400 py-2">Contact activity data will appear here once transactions are recorded.</p>}
                {MOST_ACTIVE.map((c) => (
                  <div key={c.rank} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4 text-center shrink-0">
                      {c.rank}
                    </span>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        c.initialsColor
                      )}
                    >
                      {c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {c.name}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          c.typeBg
                        )}
                      >
                        {c.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-slate-900">
                        {c.count}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          c.trendUp ? "text-emerald-600" : "text-red-500"
                        )}
                      >
                        {c.trendPct}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* C. Event Types Donut */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Event Types
                </h3>
                <span className="text-xs text-slate-500">This Month</span>
              </div>
              {DONUT_SEGMENTS.length === 0
                ? <p className="text-xs text-slate-400 py-4">Event type breakdown requires live activity data.</p>
                : <DonutChart segments={DONUT_SEGMENTS} center="—" />
              }
            </div>

            {/* D. Attention Indicators */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Attention Needed
                </h3>
                <Bell className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex flex-col gap-3">
                {ATTENTION_ITEMS.length === 0 && <p className="text-xs text-slate-400 py-2">Attention indicators will appear here once activity data is available.</p>}
                {ATTENTION_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        item.iconBg,
                        item.iconColor
                      )}
                    >
                      {item.icon}
                    </div>
                    <span className="flex-1 text-sm text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  View all alerts â†’
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Download className="w-4 h-4 text-slate-400" />
          {toastMessage}
        </div>
      )}
    </div>
  )
}






