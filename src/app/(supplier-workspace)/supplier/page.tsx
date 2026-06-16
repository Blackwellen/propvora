"use client"

import Link from "next/link"
import {
  FileText,
  Wrench,
  Star,
  Wallet,
  ArrowUpRight,
  ClipboardList,
  Store,
  ShieldCheck,
  Sparkles,
  CalendarClock,
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
  toneForStatus,
  humaniseStatus,
  type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { money, dayMonth, ratingStars } from "@/components/supplier-workspace/format"
import type {
  SupplierProfile,
  SupplierQuoteRequest,
  SupplierJob,
  SupplierEarningsSummary,
} from "@/components/supplier-workspace/types"

const QUICK_ACTIONS = [
  { label: "View quotes", href: "/supplier/quotes", icon: FileText, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Manage jobs", href: "/supplier/jobs", icon: Wrench, bg: "bg-emerald-50", color: "text-emerald-600" },
  { label: "Edit profile", href: "/supplier/profile", icon: ClipboardList, bg: "bg-violet-50", color: "text-violet-600" },
  { label: "Marketplace", href: "/supplier/marketplace", icon: Store, bg: "bg-amber-50", color: "text-amber-600" },
]

export default function SupplierDashboardPage() {
  const profile = useSupplierApi<SupplierProfile>(useSupplierApiUrl("/api/supplier/profile"), {
    select: (j) => (j as { profile?: SupplierProfile }).profile ?? (j as SupplierProfile),
  })
  const quotes = useSupplierApi<SupplierQuoteRequest[]>(
    useSupplierApiUrl("/api/supplier/quotes", { side: "supplier" }),
    {
      select: (j) => (j as { items?: SupplierQuoteRequest[]; quotes?: SupplierQuoteRequest[]; data?: SupplierQuoteRequest[] }).items ??
        (j as { quotes?: SupplierQuoteRequest[] }).quotes ??
        (j as { data?: SupplierQuoteRequest[] }).data ?? (Array.isArray(j) ? (j as SupplierQuoteRequest[]) : []),
    }
  )
  const jobs = useSupplierApi<SupplierJob[]>(
    useSupplierApiUrl("/api/supplier/jobs", { side: "supplier" }),
    {
      select: (j) => (j as { items?: SupplierJob[]; jobs?: SupplierJob[]; data?: SupplierJob[] }).items ??
        (j as { jobs?: SupplierJob[] }).jobs ??
        (j as { data?: SupplierJob[] }).data ?? (Array.isArray(j) ? (j as SupplierJob[]) : []),
    }
  )
  const earnings = useSupplierApi<SupplierEarningsSummary>(useSupplierApiUrl("/api/supplier/jobs/earnings"), {
    select: (j) => (j as { summary?: SupplierEarningsSummary }).summary ?? (j as SupplierEarningsSummary),
  })

  const openQuotes = (quotes.data ?? []).filter(
    (q) => !["accepted", "declined", "cancelled", "expired", "closed"].includes((q.status ?? "").toLowerCase())
  )
  const activeJobs = (jobs.data ?? []).filter(
    (j) => !["closed", "cancelled", "completed", "paid", "refunded"].includes((j.status ?? "").toLowerCase())
  )
  const rating = profile.data?.average_rating
  const reviewsCount = profile.data?.reviews_count ?? 0
  const totalEarned = earnings.data?.total_earned
  const currency = earnings.data?.currency ?? "GBP"

  const kpis: SupplierKpi[] = [
    {
      icon: FileText, iconBg: "bg-blue-50", iconColor: "text-blue-600",
      value: openQuotes.length, label: "Open quotes",
      sub: openQuotes.length > 0 ? "Awaiting your response" : "All caught up",
      subColor: openQuotes.length > 0 ? "text-amber-600" : "text-emerald-600",
      href: "/supplier/quotes",
    },
    {
      icon: Wrench, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      value: activeJobs.length, label: "Active jobs",
      sub: "In progress & scheduled", subColor: "text-slate-500",
      href: "/supplier/jobs",
    },
    {
      icon: Star, iconBg: "bg-amber-50", iconColor: "text-amber-600",
      value: rating != null ? rating.toFixed(1) : "—", label: "Rating",
      sub: reviewsCount > 0 ? `${reviewsCount} review${reviewsCount === 1 ? "" : "s"}` : "No reviews yet",
      subColor: "text-slate-500",
      href: "/supplier/reviews",
    },
    {
      icon: Wallet, iconBg: "bg-violet-50", iconColor: "text-violet-600",
      value: totalEarned != null ? money(totalEarned, currency) : "—", label: "Earnings",
      sub: earnings.data?.indicative ? "Indicative" : "Lifetime", subColor: "text-slate-500",
      href: "/supplier/earnings",
    },
  ]

  const businessName = profile.data?.business_name || profile.data?.trading_name

  return (
    <div className="space-y-5">
      <MobileTopBar title="Dashboard" subtitle={businessName ?? "Supplier workspace"} />

      <SupplierPageHeader
        title="Dashboard"
        subtitle={businessName ? `Welcome back, ${businessName}` : "Your supplier workspace at a glance"}
        actions={
          <Link
            href="/supplier/profile"
            className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Improve profile
          </Link>
        }
      />

      <SupplierKpiStrip kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Incoming quote requests */}
        <SupplierCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-slate-900">Incoming quote requests</h2>
            <SupplierViewLink href="/supplier/quotes" label="View all" />
          </div>
          {quotes.loading ? (
            <SupplierLoadingState rows={3} />
          ) : openQuotes.length === 0 ? (
            <SupplierEmptyState
              icon={FileText}
              title="No open requests"
              description="When a property manager invites you to quote, the request lands here. Keep your profile and coverage areas up to date to receive more."
              action={<SupplierViewLink href="/supplier/profile" label="Review your profile" />}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {openQuotes.slice(0, 5).map((q, i) => (
                <li key={q.id ?? i} className="py-3 first:pt-0 last:pb-0">
                  <Link href="/supplier/quotes" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {q.category ? humaniseStatus(q.category) : q.reference ?? "Quote request"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {q.property_label ?? "Property"}
                        {q.budget_max ? ` · up to ${money(q.budget_max)}` : ""}
                      </p>
                    </div>
                    {q.status && (
                      <SupplierStatusBadge tone={toneForStatus(q.status)}>{humaniseStatus(q.status)}</SupplierStatusBadge>
                    )}
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SupplierCard>

        {/* Quick actions + verification */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Quick actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg}`}>
                      <Icon className={`w-5 h-5 ${a.color}`} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 text-center leading-tight">{a.label}</span>
                  </Link>
                )
              })}
            </div>
          </SupplierCard>

          <SupplierCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">Trust & verification</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Identity", status: profile.data?.id_verification_status },
                { label: "Insurance", status: profile.data?.insurance_status },
                { label: "Licences", status: profile.data?.licence_status },
              ].map((row) => {
                const s = (row.status ?? "not_started").toLowerCase()
                const verified = /verified|approved|active/.test(s)
                return (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{row.label}</span>
                    <SupplierStatusBadge tone={verified ? "emerald" : "slate"}>
                      {humaniseStatus(row.status ?? "Not started")}
                    </SupplierStatusBadge>
                  </div>
                )
              })}
            </div>
            <Link href="/supplier/onboarding" className="mt-4 inline-flex text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
              Complete onboarding →
            </Link>
          </SupplierCard>
        </div>
      </div>

      {/* Upcoming jobs */}
      <SupplierCard className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Upcoming jobs</h2>
          </div>
          <SupplierViewLink href="/supplier/jobs" label="View all" />
        </div>
        {jobs.loading ? (
          <SupplierLoadingState rows={3} />
        ) : activeJobs.length === 0 ? (
          <SupplierEmptyState
            icon={Wrench}
            title="No active jobs"
            description="Accepted quotes become jobs you can schedule, track and complete. Your upcoming work will appear here."
          />
        ) : (
          <ul className="space-y-2.5">
            {activeJobs.slice(0, 5).map((j, i) => (
              <li key={j.id ?? i}>
                <Link
                  href={j.id ? `/supplier/jobs/${j.id}` : "/supplier/jobs"}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 shrink-0 rounded-lg bg-blue-50 px-1 py-1.5 text-center">
                    <p className="text-[9px] font-bold text-blue-600 leading-none">{dayMonth(j.scheduled_date)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{j.title ?? j.reference ?? "Job"}</p>
                    <p className="text-xs text-slate-500 truncate">{j.property_label ?? "Property"}</p>
                  </div>
                  {j.status && <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SupplierCard>

      {rating != null && (
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="text-amber-500">{ratingStars(rating)}</span>
          Based on {reviewsCount} verified review{reviewsCount === 1 ? "" : "s"} from completed jobs.
        </p>
      )}
    </div>
  )
}
