"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  Users,
  Clock,
  FileText,
  CheckCircle2,
  Receipt,
  Zap,
  Download,
  Star,
  Search,
  Shield,
  TrendingUp,
  UserPlus,
  FilePlus,
  MessageSquare,
  Store,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  BadgeCheck,
  MapPin,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { SuppliersHubTabNav } from "@/components/suppliers/SuppliersHubTabNav"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useSuppliers } from "@/features/suppliers/useSuppliers"

// ─── Static seed data ─────────────────────────────────────────────────────────

const PERF_METRICS = [
  { label: "On-Time Response", value: 98, color: "bg-emerald-500" },
  { label: "Job Completion",   value: 95, color: "bg-blue-500"    },
  { label: "SLA Compliance",   value: 96, color: "bg-violet-500"  },
  { label: "Quality Score",    value: 94, color: "bg-amber-500"   },
]

const COMPLIANCE_DATA = [
  { name: "Compliant",       value: 149, pct: 96,  fill: "#10b981" },
  { name: "Expiring Soon",   value: 4,   pct: 2.5, fill: "#f59e0b" },
  { name: "Non-Compliant",   value: 3,   pct: 1.5, fill: "#ef4444" },
]

const QUICK_ACTIONS = [
  { icon: UserPlus,     label: "Add Supplier",   href: "/app/contacts/new?type=supplier" },
  { icon: FilePlus,     label: "Create Job",     href: "/app/work/jobs/new"              },
  { icon: MessageSquare,label: "Create Task",    href: "/app/work/tasks/new"             },
  { icon: BookUser,     label: "Directory",      href: "/app/suppliers/directory"        },
  { icon: Shield,       label: "Compliance",     href: "/app/suppliers/compliance"       },
  { icon: TrendingUp,   label: "Performance",    href: "/app/suppliers/performance"      },
  { icon: ExternalLink, label: "All Contacts",   href: "/app/contacts"                   },
  { icon: Store,        label: "Marketplace",    href: "/app/marketplace/suppliers"      },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BookUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <circle cx="12" cy="8" r="2" />
      <path d="M15 13a3 3 0 1 0-6 0" />
    </svg>
  )
}

function PerformanceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-slate-600">{label}</span>
        <span className="text-[12px] font-bold text-slate-800">{value}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-100">
        <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SuppliersHubPage() {
  const workspaceId = useWorkspaceId()
  const { suppliers, isSeed } = useSuppliers(workspaceId)
  const [search, setSearch] = useState("")

  const preferred = useMemo(() => suppliers.filter((s) => s.preferred), [suppliers])
  const recentlyActive = useMemo(() => suppliers.slice(0, 5), [suppliers])

  const KPIS = [
    { label: "Total Suppliers",      value: String(suppliers.length), sub: `${preferred.length} preferred`,  icon: Users,        bg: "bg-blue-50",    color: "text-blue-600"    },
    { label: "Pending Requests",     value: "18",                     sub: "5 urgent",                       icon: Clock,        bg: "bg-amber-50",   color: "text-amber-600"   },
    { label: "Quotes Received",      value: "64",                     sub: "+12 this week",                  icon: FileText,     bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "SLA Compliance",       value: "96%",                    sub: "+4% vs last month",              icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Outstanding Invoices", value: "£42,560",                sub: "12 invoices",                    icon: Receipt,      bg: "bg-violet-50",  color: "text-violet-600"  },
    { label: "Avg Response Time",    value: "2.4 hrs",                sub: "Industry avg: 2.8 hrs",          icon: Zap,          bg: "bg-blue-50",    color: "text-blue-600"    },
  ]

  function exportCsv() {
    const rows = suppliers.map((s) => [s.id, s.name, s.trade, s.location].map((v) => `"${v}"`).join(","))
    const csv = ["ID,Name,Trade,Location", ...rows].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "suppliers.csv"
    a.click()
  }

  return (
    <div className="space-y-5">
      {/* Mobile top bar */}
      <MobileTopBar
        title="Suppliers"
        subtitle="Supplier hub"
        primaryAction={{ label: "Add supplier", icon: UserPlus, href: "/app/contacts/new?type=supplier" }}
        overflowActions={[
          { label: "Create job",     icon: FilePlus,  href: "/app/work/jobs/new"              },
          { label: "Marketplace",    icon: Store,     href: "/app/marketplace/suppliers"      },
          { label: "Export",         icon: Download,  onClick: exportCsv                      },
        ]}
      />

      {/* Desktop header */}
      <div className="hidden md:block">
        <PageHeader
          title="Suppliers"
          description="Your supplier network, compliance and performance in one place"
          actions={
            <>
              <Link
                href="/app/contacts/new?type=supplier"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Supplier
              </Link>
              <Link
                href="/app/marketplace/suppliers"
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                Marketplace
              </Link>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </>
          }
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">{kpi.label}</p>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", kpi.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", kpi.color)} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 leading-none mb-1">{kpi.value}</p>
              <p className="text-[11px] text-slate-500">{kpi.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Tab nav */}
      <SuppliersHubTabNav />

      {/* Quick actions */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 py-3 px-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600 leading-tight">{action.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Main grid: recent suppliers + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: recent/active suppliers */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-slate-800">Your Suppliers</h2>
            <Link href="/app/suppliers/directory" className="flex items-center gap-1 text-[12px] text-[#2563EB] hover:underline font-medium">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white"
            />
          </div>

          <div className="space-y-2">
            {recentlyActive
              .filter((s) => {
                const q = search.trim().toLowerCase()
                return !q || s.name.toLowerCase().includes(q) || s.trade.toLowerCase().includes(q)
              })
              .map((s) => {
                const rating = 4.3 + ((s.id.charCodeAt(0) % 7) / 10)
                return (
                  <Link
                    key={s.id}
                    href={`/app/work/suppliers/${s.id}`}
                    className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-sm transition-all"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0", s.avatarBg)}>
                      {s.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13.5px] font-semibold text-slate-900 truncate">{s.name}</span>
                        {s.preferred && <BadgeCheck className="w-4 h-4 text-[#2563EB] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-[11.5px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{s.trade}</span>
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{s.location}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-0.5 justify-end mb-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[12px] font-semibold text-slate-700">{rating.toFixed(1)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                    </div>
                  </Link>
                )
              })}
            {suppliers.length === 0 && (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-slate-700 mb-1">No suppliers yet</p>
                <p className="text-[12.5px] text-slate-500 mb-4">Add your first supplier to start tracking your network.</p>
                <Link
                  href="/app/contacts/new?type=supplier"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Supplier
                </Link>
              </div>
            )}
          </div>

          {suppliers.length > 5 && (
            <Link
              href="/app/suppliers/directory"
              className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              View full directory <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Compliance donut */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-slate-800">Compliance Status</h3>
              <Link href="/app/suppliers/compliance" className="text-[11px] text-[#2563EB] hover:underline font-medium">View all</Link>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={COMPLIANCE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {COMPLIANCE_DATA.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [`${val} suppliers`]}
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {COMPLIANCE_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance snapshot */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-slate-800">Performance</h3>
              <Link href="/app/suppliers/performance" className="text-[11px] text-[#2563EB] hover:underline font-medium">View all</Link>
            </div>
            <div className="space-y-3">
              {PERF_METRICS.map((m) => (
                <PerformanceBar key={m.label} label={m.label} value={m.value} color={m.color} />
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-[12.5px] font-semibold text-amber-800">Attention needed</span>
            </div>
            <div className="text-[12px] text-amber-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>4 docs expiring soon</span>
                <Link href="/app/suppliers/compliance" className="font-medium hover:underline">Review</Link>
              </div>
              <div className="flex items-center justify-between">
                <span>3 non-compliant suppliers</span>
                <Link href="/app/suppliers/compliance" className="font-medium hover:underline">Review</Link>
              </div>
              <div className="flex items-center justify-between">
                <span>18 pending quote requests</span>
                <Link href="/app/suppliers/directory" className="font-medium hover:underline">View</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
