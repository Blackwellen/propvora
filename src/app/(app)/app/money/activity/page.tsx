"use client"

import { useState } from "react"
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
} from "lucide-react"
import { MoneyTabNav, MoneyKpiCard, MoneyPageHeader } from "@/components/money"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Static data ──────────────────────────────────────────────────────────────

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

const ACTIVITY_ROWS: ActivityRow[] = [
  {
    time: "11:42",
    dotColor: "bg-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: <CheckCircle className="w-4 h-4" />,
    avatarInitials: "JO",
    avatarBg: "bg-blue-100 text-blue-700",
    contactName: "James Okafor",
    contactType: "Tenant",
    contactTypeBg: "bg-blue-100 text-blue-700",
    eventTitle: "Payment received",
    description: "£850.00 rent payment for 5 The Oaks",
    chip: "Completed ✓",
    chipBg: "bg-emerald-100 text-emerald-700",
    amount: "+£850.00",
    amountColor: "text-emerald-600",
    filter: "payments",
  },
  {
    time: "11:15",
    dotColor: "bg-blue-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: <MessageSquare className="w-4 h-4" />,
    avatarInitials: "SM",
    avatarBg: "bg-emerald-100 text-emerald-700",
    contactName: "Sarah Mitchell",
    contactType: "Landlord",
    contactTypeBg: "bg-violet-100 text-violet-700",
    eventTitle: "Message sent",
    description: "Re: Service charge adjustment for May 2026",
    chip: "Email",
    chipBg: "bg-blue-100 text-blue-700",
    filter: "messages",
  },
  {
    time: "10:38",
    dotColor: "bg-violet-500",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    icon: <FileText className="w-4 h-4" />,
    avatarInitials: "EP",
    avatarBg: "bg-violet-100 text-violet-700",
    contactName: "Emily Patel",
    contactType: "Applicant",
    contactTypeBg: "bg-slate-100 text-slate-600",
    eventTitle: "Document uploaded",
    description: "Right to Rent check – Passport (exp. 2034)",
    chip: "Right to Rent",
    chipBg: "bg-violet-100 text-violet-700",
    filter: "documents",
  },
  {
    time: "09:55",
    dotColor: "bg-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    icon: <CheckSquare className="w-4 h-4" />,
    avatarInitials: "CB",
    avatarBg: "bg-amber-100 text-amber-700",
    contactName: "Connor Bradley",
    contactType: "Applicant",
    contactTypeBg: "bg-slate-100 text-slate-600",
    eventTitle: "Task completed",
    description: "Reference check completed",
    chip: "Reference",
    chipBg: "bg-amber-100 text-amber-700",
    filter: "tasks",
  },
  {
    time: "09:55",
    dotColor: "bg-teal-500",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    icon: <Globe className="w-4 h-4" />,
    avatarInitials: "PS",
    avatarBg: "bg-teal-100 text-teal-700",
    contactName: "Priya Shah",
    contactType: "Tenant",
    contactTypeBg: "bg-blue-100 text-blue-700",
    eventTitle: "Portal login",
    description: "Successful login from Chrome on Windows",
    chip: "Web",
    chipBg: "bg-teal-100 text-teal-700",
    filter: "portal",
  },
  {
    time: "09:12",
    dotColor: "bg-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: <DollarSign className="w-4 h-4" />,
    avatarInitials: "KW",
    avatarBg: "bg-orange-100 text-orange-700",
    contactName: "Kevin Walsh",
    contactType: "Supplier",
    contactTypeBg: "bg-orange-100 text-orange-700",
    eventTitle: "Invoice paid",
    description: "INV-0082 payment for £1,245.00 cleared",
    chip: "Paid ✓",
    chipBg: "bg-emerald-100 text-emerald-700",
    amount: "+£1,245.00",
    amountColor: "text-emerald-600",
    filter: "payments",
  },
  {
    time: "08:30",
    dotColor: "bg-red-500",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    icon: <AlertTriangle className="w-4 h-4" />,
    avatarInitials: "JT",
    avatarBg: "bg-red-100 text-red-700",
    contactName: "James Taylor",
    contactType: "Tenant",
    contactTypeBg: "bg-blue-100 text-blue-700",
    eventTitle: "Arrears escalated",
    description: "Case opened: 64 days overdue, high risk",
    chip: "High Risk",
    chipBg: "bg-red-100 text-red-700",
    filter: "alerts",
  },
  {
    time: "07:55",
    dotColor: "bg-slate-400",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    icon: <Settings className="w-4 h-4" />,
    avatarInitials: "⚙",
    avatarBg: "bg-slate-100 text-slate-600",
    contactName: "System",
    contactType: "System",
    contactTypeBg: "bg-slate-100 text-slate-500",
    eventTitle: "Reconciliation run",
    description: "47 transactions matched, 12 remain open",
    chip: "System",
    chipBg: "bg-slate-100 text-slate-500",
    filter: "system",
  },
]

const MOST_ACTIVE: MostActiveContact[] = [
  {
    rank: 1,
    initials: "JO",
    initialsColor: "bg-blue-100 text-blue-700",
    name: "James Okafor",
    type: "Tenant",
    typeBg: "bg-blue-100 text-blue-700",
    count: 26,
    trendUp: true,
    trendPct: "↑12%",
  },
  {
    rank: 2,
    initials: "SM",
    initialsColor: "bg-emerald-100 text-emerald-700",
    name: "Sarah Mitchell",
    type: "Landlord",
    typeBg: "bg-violet-100 text-violet-700",
    count: 22,
    trendUp: true,
    trendPct: "↑8%",
  },
  {
    rank: 3,
    initials: "KW",
    initialsColor: "bg-orange-100 text-orange-700",
    name: "Kevin Walsh",
    type: "Supplier",
    typeBg: "bg-orange-100 text-orange-700",
    count: 18,
    trendUp: false,
    trendPct: "↓3%",
  },
  {
    rank: 4,
    initials: "EP",
    initialsColor: "bg-violet-100 text-violet-700",
    name: "Emily Patel",
    type: "Applicant",
    typeBg: "bg-slate-100 text-slate-600",
    count: 16,
    trendUp: true,
    trendPct: "↑21%",
  },
  {
    rank: 5,
    initials: "CB",
    initialsColor: "bg-amber-100 text-amber-700",
    name: "Connor Bradley",
    type: "Applicant",
    typeBg: "bg-slate-100 text-slate-600",
    count: 14,
    trendUp: true,
    trendPct: "↑5%",
  },
]

const DONUT_SEGMENTS: DonutSegment[] = [
  { label: "Payments", pct: 21.8, color: "#2563EB" },
  { label: "Messages", pct: 33.1, color: "#10B981" },
  { label: "Documents", pct: 14.5, color: "#7C3AED" },
  { label: "Tasks", pct: 10.9, color: "#F59E0B" },
  { label: "Portal", pct: 12.5, color: "#14B8A6" },
  { label: "Alerts", pct: 4.4, color: "#EF4444" },
  { label: "System", pct: 2.8, color: "#94A3B8" },
]

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Overdue tasks",
    count: 7,
  },
  {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Unread messages",
    count: 12,
  },
  {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    icon: <XCircle className="w-4 h-4" />,
    label: "Failed payments",
    count: 3,
  },
  {
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    icon: <Clock className="w-4 h-4" />,
    label: "Expiring documents",
    count: 5,
  },
]

// Bar chart day heights for activity summary
const WEEK_BARS = [
  { day: "Mon", height: 22 },
  { day: "Tue", height: 34 },
  { day: "Wed", height: 28 },
  { day: "Thu", height: 41 },
  { day: "Fri", height: 38 },
  { day: "Sat", height: 44 },
  { day: "Sun", height: 29 },
]
const WEEK_MAX = 44

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [showSystemEvents, setShowSystemEvents] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredRows = ACTIVITY_ROWS.filter((row) => {
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
      <MoneyTabNav />

      <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full">
        {/* Header */}
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

        {/* KPI Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MoneyKpiCard
            label="Events Today"
            value="48"
            trend="↑ +12 vs yesterday"
            trendUp
            icon={<Activity className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MoneyKpiCard
            label="This Week"
            value="162"
            trend="↑ +8.3%"
            trendUp
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <MoneyKpiCard
            label="System Actions"
            value="89"
            subtitle="automated events"
            icon={<Cpu className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <MoneyKpiCard
            label="User Actions"
            value="159"
            subtitle="8 team members"
            icon={<Users className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>

        {/* Main layout */}
        <div className="flex gap-6 items-start">
          {/* LEFT ~65% */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">
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

                <div className="flex items-center gap-2 ml-auto flex-wrap">
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
                  Today — 10 June 2026
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
                          { label: "View Details", icon: Eye, onClick: () => showToast(`${row.eventTitle} — ${row.description}`) },
                          { label: "Copy Description", icon: Copy, onClick: () => { navigator.clipboard?.writeText(`${row.eventTitle} — ${row.description}`); showToast("Copied to clipboard") } },
                        ]}
                      />
                    </div>
                  </div>
                ))}

                {filteredRows.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    No activity matches your filters.
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
          <div className="flex flex-col gap-4 w-80 xl:w-96 shrink-0">
            {/* A. Activity Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Activity Summary
              </h3>
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Today</span>
                  <span className="font-semibold text-slate-900">48 events</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">This week</span>
                  <span className="font-semibold text-slate-900">
                    162 events
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">This month</span>
                  <span className="font-semibold text-slate-900">
                    248 events
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">vs last month</span>
                  <span className="font-semibold text-emerald-600">↑ 18.3%</span>
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
                  View all →
                </button>
              </div>
              <div className="flex flex-col gap-3">
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
              <DonutChart segments={DONUT_SEGMENTS} center="248" />
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
                  View all alerts →
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
