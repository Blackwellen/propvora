"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Inbox,
  Wrench,
  Wallet,
  ShieldCheck,
  Star,
  CalendarClock,
  ArrowUpRight,
  FileText,
  Package,
  MapPin,
  ReceiptText,
  AlertTriangle,
  TrendingUp,
  Send,
  ThumbsDown,
  Upload,
  PlusCircle,
  BarChart2,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierKpiStrip,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierViewLink,
  SupplierStatusBadge,
  SupplierBanner,
  SupplierButton,
  SupplierDrawer,
  SupplierField,
  supplierInputClass,
  supplierTextareaClass,
  toneForStatus,
  humaniseStatus,
  type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence, dayMonth, timeAgo } from "@/components/supplier-workspace/format"
import { SupplierAreaChart, SupplierBarChart, Donut, type DonutSlice } from "@/components/supplier-workspace/charts"
import type {
  SupplierDashboardKpis,
  SupplierAssignmentRow,
  SupplierCalendarEntry,
  SupplierRecentLead,
} from "@/components/supplier-workspace/types"

interface DashboardEnvelope {
  kpis: SupplierDashboardKpis
  activeJobs: SupplierAssignmentRow[]
  calendarEntries: SupplierCalendarEntry[]
  recentLeads: SupplierRecentLead[]
}

interface AnalyticsEnvelope {
  jobsOverTime: { label: string; value: number }[]
  earningsOverTime: { label: string; value: number }[]
  statusMix: { name: string; value: number; color: string }[]
  completionRatePct: number
  totalJobs: number
}

const QUICK_ACTIONS = [
  { label: "New quote", href: "/supplier/quotes", icon: PlusCircle, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Calendar", href: "/supplier/calendar", icon: CalendarClock, bg: "bg-violet-50", color: "text-violet-600" },
  { label: "Upload insurance", href: "/supplier/insurance", icon: Upload, bg: "bg-emerald-50", color: "text-emerald-600" },
  { label: "Packages", href: "/supplier/packages", icon: Package, bg: "bg-amber-50", color: "text-amber-600" },
  { label: "Coverage", href: "/supplier/coverage", icon: MapPin, bg: "bg-sky-50", color: "text-sky-600" },
  { label: "Earnings", href: "/supplier/earnings", icon: BarChart2, bg: "bg-rose-50", color: "text-rose-600" },
]

// Next 7 days array for the calendar strip.
function buildDayStrip() {
  const days: { iso: string; label: string; short: string }[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-GB", { weekday: "short" })
    const short = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    days.push({ iso, label, short })
  }
  return days
}

export default function SupplierDashboardPage() {
  const dash = useSupplierApi<DashboardEnvelope>(useSupplierApiUrl("/api/supplier/dashboard"), {
    select: (j) => j as DashboardEnvelope,
  })
  const analytics = useSupplierApi<AnalyticsEnvelope>(useSupplierApiUrl("/api/supplier/analytics"), {
    select: (j) => j as AnalyticsEnvelope,
  })

  const [quoting, setQuoting] = useState<SupplierRecentLead | null>(null)
  const [decliningLead, setDecliningLead] = useState<SupplierRecentLead | null>(null)
  const [quoteAmount, setQuoteAmount] = useState("")
  const [quoteNote, setQuoteNote] = useState("")
  const [declineReason, setDeclineReason] = useState("")
  const [actionBusy, setActionBusy] = useState(false)
  const [actionBanner, setActionBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const k = dash.data?.kpis
  const activeJobs = dash.data?.activeJobs ?? []
  const calendarEntries = dash.data?.calendarEntries ?? []
  const recentLeads = dash.data?.recentLeads ?? []
  const currency = k?.currency ?? "GBP"
  const a = analytics.data
  const statusSlices: DonutSlice[] = (a?.statusMix ?? []).map((s) => ({ name: s.name, value: s.value, color: s.color }))
  const dayStrip = buildDayStrip()

  const kpis: SupplierKpi[] = [
    {
      icon: Inbox, iconBg: "bg-blue-50", iconColor: "text-blue-600",
      value: k?.openLeads ?? "—", label: "Open leads",
      sub: (k?.openLeads ?? 0) > 0 ? "Awaiting your response" : "All caught up",
      subColor: (k?.openLeads ?? 0) > 0 ? "text-amber-600" : "text-emerald-600",
      href: "/supplier/leads",
    },
    {
      icon: Wrench, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      value: k?.activeJobs ?? "—", label: "Active jobs",
      sub: (k?.unscheduledJobs ?? 0) > 0 ? `${k?.unscheduledJobs} to schedule` : "All scheduled",
      subColor: (k?.unscheduledJobs ?? 0) > 0 ? "text-amber-600" : "text-slate-500",
      href: "/supplier/jobs",
    },
    {
      icon: TrendingUp, iconBg: "bg-rose-50", iconColor: "text-rose-600",
      value: k ? moneyPence(k.monthlyEarningsPence, currency) : "—", label: "This month",
      sub: "Paid invoices MTD", subColor: "text-slate-500",
      href: "/supplier/earnings",
    },
    {
      icon: Star, iconBg: "bg-amber-50", iconColor: "text-amber-500",
      value: k?.avgReviewScore != null ? k.avgReviewScore.toFixed(1) : "—", label: "Avg. rating",
      sub: k?.responseRatePct != null ? `${k.responseRatePct}% response rate` : "—",
      subColor: (k?.responseRatePct ?? 100) >= 80 ? "text-emerald-600" : "text-amber-600",
      href: "/supplier/reviews",
    },
    {
      icon: Wallet, iconBg: "bg-violet-50", iconColor: "text-violet-600",
      value: k ? moneyPence(k.payoutsPendingPence, currency) : "—", label: "Payouts pending",
      sub: k ? `${moneyPence(k.payoutsPaidPence, currency)} paid` : "—", subColor: "text-slate-500",
      href: "/supplier/payouts",
    },
    {
      icon: ShieldCheck, iconBg: "bg-sky-50", iconColor: "text-sky-600",
      value: k ? `L${k.verificationLevel}` : "—", label: "Verification",
      sub: k?.verificationLabel ?? "—", subColor: (k?.verificationLevel ?? 0) >= 3 ? "text-emerald-600" : "text-slate-500",
      href: "/supplier/verification",
    },
  ]

  async function submitQuote() {
    if (!quoting?.quoteId) return
    const pounds = Number(quoteAmount)
    if (!Number.isFinite(pounds) || pounds <= 0) {
      setActionBanner({ tone: "red", msg: "Enter a valid amount." })
      return
    }
    setActionBusy(true)
    try {
      const res = await fetch(`/api/supplier/quotes/${quoting.quoteId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "submit", amountPence: Math.round(pounds * 100), description: quoteNote || undefined }),
      })
      if (!res.ok) {
        setActionBanner({ tone: "red", msg: "Couldn't submit the quote." })
        return
      }
      setQuoting(null); setQuoteAmount(""); setQuoteNote("")
      setActionBanner({ tone: "emerald", msg: "Quote submitted to the property manager." })
      dash.refresh()
    } catch {
      setActionBanner({ tone: "red", msg: "Network error — please try again." })
    } finally { setActionBusy(false) }
  }

  async function submitDecline() {
    if (!decliningLead?.quoteId) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/supplier/quotes/${decliningLead.quoteId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "decline", reason: declineReason || undefined }),
      })
      if (!res.ok) {
        setActionBanner({ tone: "red", msg: "Couldn't decline the lead." })
        return
      }
      setDecliningLead(null); setDeclineReason("")
      setActionBanner({ tone: "emerald", msg: "Lead declined." })
      dash.refresh()
    } catch {
      setActionBanner({ tone: "red", msg: "Network error — please try again." })
    } finally { setActionBusy(false) }
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Dashboard" subtitle="Supplier workspace" />

      <SupplierPageHeader
        title="Dashboard"
        subtitle="Your supplier workspace at a glance"
        actions={
          <Link
            href="/supplier/leads"
            className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
          >
            <Inbox className="w-4 h-4" /> View leads
          </Link>
        }
      />

      {/* Compliance nudges */}
      {k?.insuranceExpiringSoon && (
        <SupplierBanner tone="amber">
          Your insurance evidence is expiring soon. <Link href="/supplier/insurance" className="font-semibold underline">Review insurance →</Link>
        </SupplierBanner>
      )}
      {k && !k.hasValidInsurance && k.verificationLevel >= 3 && (
        <SupplierBanner tone="blue">
          Add insurance evidence to unlock higher-risk jobs. <Link href="/supplier/insurance" className="font-semibold underline">Add evidence →</Link>
        </SupplierBanner>
      )}
      {k?.licenceExpiringSoon && (
        <SupplierBanner tone="amber">
          A required licence is expiring soon. <Link href="/supplier/verification" className="font-semibold underline">Review licences →</Link>
        </SupplierBanner>
      )}

      {actionBanner && (
        <SupplierBanner tone={actionBanner.tone} onDismiss={() => setActionBanner(null)}>{actionBanner.msg}</SupplierBanner>
      )}

      {/* KPI row — 6 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const inner = (
            <>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
              <div className="mt-2.5">
                <p className="text-xl font-bold text-slate-900 leading-none">{kpi.value}</p>
                <p className="mt-1 text-[12px] font-medium text-slate-600 leading-tight">{kpi.label}</p>
                {kpi.sub && <p className={`mt-0.5 text-[11px] font-semibold ${kpi.subColor ?? "text-slate-400"}`}>{kpi.sub}</p>}
              </div>
            </>
          )
          const base = "bg-white border border-slate-200 rounded-2xl shadow-sm p-3.5 transition-all"
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href} className={`${base} hover:border-slate-300 hover:shadow-md block`}>{inner}</Link>
          ) : (
            <div key={kpi.label} className={base}>{inner}</div>
          )
        })}
      </div>

      {/* Calendar strip — next 7 days */}
      <SupplierCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Next 7 days</h2>
          </div>
          <SupplierViewLink href="/supplier/calendar" label="Full calendar" />
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {dayStrip.map((day) => {
            const entries = calendarEntries.filter((e) => e.date === day.iso)
            const isToday = day.iso === new Date().toISOString().slice(0, 10)
            return (
              <div
                key={day.iso}
                className={`rounded-xl border p-1.5 min-h-[68px] flex flex-col gap-1 ${isToday ? "border-blue-200 bg-blue-50/40" : "border-slate-100 bg-white"}`}
              >
                <p className={`text-[10px] font-bold uppercase leading-none ${isToday ? "text-[#2563EB]" : "text-slate-400"}`}>{day.label}</p>
                <p className={`text-[9px] leading-none ${isToday ? "text-blue-500" : "text-slate-300"}`}>{day.short}</p>
                <div className="mt-auto space-y-0.5">
                  {entries.length === 0 && (
                    <p className="text-[9px] text-slate-200">—</p>
                  )}
                  {entries.slice(0, 2).map((e, i) => (
                    <Link
                      key={i}
                      href={e.href}
                      className="block rounded px-1 py-0.5 bg-blue-100 text-[9px] font-semibold text-blue-700 truncate hover:bg-blue-200"
                    >
                      {e.label}
                    </Link>
                  ))}
                  {entries.length > 2 && (
                    <p className="text-[9px] text-slate-400">+{entries.length - 2} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </SupplierCard>

      {/* Charts — every series derived from real workspace records. */}
      {!analytics.notReady && (a?.totalJobs ?? 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SupplierCard className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-slate-900">Jobs over time</h2>
              <span className="text-xs text-slate-400">Last 8 weeks</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">New job assignments per week</p>
            <SupplierBarChart data={a?.jobsOverTime ?? []} height={200} />
          </SupplierCard>

          <SupplierCard className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Job status mix</h2>
            <p className="text-[11px] text-slate-400 mb-3">{a?.completionRatePct ?? 0}% completion rate</p>
            <div className="flex items-center gap-4">
              <div className="w-[120px] h-[120px] shrink-0">
                <Donut data={statusSlices} />
              </div>
              <ul className="flex-1 min-w-0 space-y-1.5">
                {statusSlices.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-slate-600 truncate">{s.name}</span>
                    <span className="ml-auto font-semibold text-slate-800">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SupplierCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Recent leads feed with quick actions */}
        <SupplierCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Recent leads</h2>
            </div>
            <SupplierViewLink href="/supplier/leads" label="View all" />
          </div>
          {dash.loading ? (
            <SupplierLoadingState rows={3} />
          ) : recentLeads.length === 0 ? (
            <SupplierEmptyState
              icon={Inbox}
              title="No leads yet"
              description="Quote requests and enquiries from property managers appear here."
              action={<SupplierViewLink href="/supplier/services" label="Update your services" />}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentLeads.map((lead) => {
                const isRequest = lead.source === "quote_request"
                const canQuote = isRequest && (lead.status ?? "").toLowerCase() === "requested"
                const canDecline = isRequest && canQuote
                return (
                  <li key={lead.id} className="py-3 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isRequest ? "bg-violet-50" : "bg-blue-50"}`}>
                      {isRequest ? <FileText className="w-4 h-4 text-violet-600" /> : <Inbox className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{lead.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <SupplierStatusBadge tone={toneForStatus(lead.status)}>{humaniseStatus(lead.status)}</SupplierStatusBadge>
                        {lead.amountPence != null && (
                          <span className="text-[11px] font-semibold text-slate-600">{moneyPence(lead.amountPence, lead.currency ?? "GBP")}</span>
                        )}
                        <span className="text-[11px] text-slate-400">{timeAgo(lead.createdAt)}</span>
                      </div>
                    </div>
                    {canQuote && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setQuoting(lead); setActionBanner(null) }}
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-[#2563EB] text-white text-[11px] font-semibold hover:bg-[#1d4ed8]"
                          title="Send a quote"
                        >
                          <Send className="w-3 h-3" /> Quote
                        </button>
                        {canDecline && (
                          <button
                            onClick={() => { setDecliningLead(lead); setActionBanner(null) }}
                            className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-white border border-slate-200 text-slate-500 text-[11px] font-semibold hover:bg-slate-50"
                            title="Decline this lead"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </SupplierCard>

        {/* Quick actions + money + trust */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Quick actions</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.bg}`}>
                      <Icon className={`w-4 h-4 ${a.color}`} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 text-center leading-tight">{a.label}</span>
                  </Link>
                )
              })}
            </div>
          </SupplierCard>

          <SupplierCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900">Money</h2>
              <SupplierViewLink href="/supplier/invoices" label="Invoices" />
            </div>
            <div className="space-y-2.5">
              <Row label="Outstanding invoices" value={k ? moneyPence(k.invoicesOutstandingPence, k.invoicesCurrency) : "—"} />
              <Row label="Payouts pending" value={k ? moneyPence(k.payoutsPendingPence, currency) : "—"} />
              <Row label="Paid out (lifetime)" value={k ? moneyPence(k.payoutsPaidPence, currency) : "—"} valueClass="text-emerald-600" />
              <Row label="Completed jobs" value={k ? String(k.completedJobs) : "—"} />
            </div>
          </SupplierCard>

          <SupplierCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <h2 className="text-base font-semibold text-slate-900">Compliance</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Verification level</span>
                <SupplierStatusBadge tone={(k?.verificationLevel ?? 0) >= 3 ? "emerald" : "slate"}>
                  L{k?.verificationLevel ?? 0} · {k?.verificationLabel ?? "Unverified"}
                </SupplierStatusBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Insurance</span>
                <SupplierStatusBadge tone={k?.hasValidInsurance ? "emerald" : k?.insuranceExpiringSoon ? "amber" : "slate"}>
                  {k?.hasValidInsurance ? "Evidence reviewed" : "Not reviewed"}
                </SupplierStatusBadge>
              </div>
              {k?.avgReviewScore != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Rating</span>
                  <span className="text-sm font-semibold text-amber-500">★ {k.avgReviewScore.toFixed(1)}</span>
                </div>
              )}
            </div>
            <Link href="/supplier/verification" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
              <ShieldCheck className="w-3.5 h-3.5" /> Manage verification →
            </Link>
          </SupplierCard>
        </div>
      </div>

      {/* Active jobs */}
      <SupplierCard className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Active jobs</h2>
          </div>
          <SupplierViewLink href="/supplier/jobs" label="View all" />
        </div>
        {dash.loading ? (
          <SupplierLoadingState rows={3} />
        ) : activeJobs.length === 0 ? (
          <SupplierEmptyState
            icon={Wrench}
            title="No active jobs"
            description="Accepted quotes become jobs you can schedule, track and complete. Your live work appears here."
            action={<SupplierViewLink href="/supplier/leads" label="Find new leads" />}
          />
        ) : (
          <ul className="space-y-2.5">
            {activeJobs.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/supplier/jobs/${j.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 shrink-0 rounded-lg bg-blue-50 px-1 py-1.5 text-center">
                    <p className="text-[9px] font-bold text-blue-600 leading-none">{dayMonth(j.scheduled_for ?? j.created_at)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">Job {j.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500 truncate">{j.scheduled_for ? "Scheduled" : "Awaiting schedule"}</p>
                  </div>
                  <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SupplierCard>

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        Every figure above is derived from your real workspace records — nothing is estimated.
      </p>

      {/* Quote drawer */}
      <SupplierDrawer
        open={!!quoting}
        onClose={() => setQuoting(null)}
        title="Send a quote"
        footer={
          <>
            <SupplierButton variant="secondary" onClick={() => setQuoting(null)}>Cancel</SupplierButton>
            <SupplierButton onClick={submitQuote} loading={actionBusy}>Submit quote</SupplierButton>
          </>
        }
      >
        <p className="text-sm text-slate-500 mb-4">{quoting?.title}</p>
        <SupplierField label="Your price (GBP)" required hint="Inclusive of materials and labour.">
          <input className={supplierInputClass} inputMode="decimal" placeholder="0.00" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
        </SupplierField>
        <SupplierField label="Note (optional)" hint="Scope, assumptions, lead time, etc.">
          <textarea className={supplierTextareaClass} value={quoteNote} onChange={(e) => setQuoteNote(e.target.value)} />
        </SupplierField>
      </SupplierDrawer>

      {/* Decline drawer */}
      <SupplierDrawer
        open={!!decliningLead}
        onClose={() => setDecliningLead(null)}
        title="Decline lead"
        footer={
          <>
            <SupplierButton variant="secondary" onClick={() => setDecliningLead(null)}>Cancel</SupplierButton>
            <SupplierButton onClick={submitDecline} loading={actionBusy}>Confirm decline</SupplierButton>
          </>
        }
      >
        <p className="text-sm text-slate-500 mb-4">{decliningLead?.title}</p>
        <SupplierField label="Reason (optional)" hint="Helps property managers understand your availability.">
          <textarea className={supplierTextareaClass} value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="e.g. Outside my coverage area, fully booked for this period…" />
        </SupplierField>
      </SupplierDrawer>
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${valueClass ?? "text-slate-900"}`}>{value}</span>
    </div>
  )
}
