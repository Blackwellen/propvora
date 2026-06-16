"use client"

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
  toneForStatus,
  humaniseStatus,
  type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence, dayMonth } from "@/components/supplier-workspace/format"
import type {
  SupplierDashboardKpis,
  SupplierAssignmentRow,
} from "@/components/supplier-workspace/types"

interface DashboardEnvelope {
  kpis: SupplierDashboardKpis
  activeJobs: SupplierAssignmentRow[]
}

const QUICK_ACTIONS = [
  { label: "Leads", href: "/supplier/leads", icon: Inbox, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Quotes", href: "/supplier/quotes", icon: FileText, bg: "bg-violet-50", color: "text-violet-600" },
  { label: "Services", href: "/supplier/services", icon: Wrench, bg: "bg-emerald-50", color: "text-emerald-600" },
  { label: "Packages", href: "/supplier/packages", icon: Package, bg: "bg-amber-50", color: "text-amber-600" },
  { label: "Coverage", href: "/supplier/coverage", icon: MapPin, bg: "bg-sky-50", color: "text-sky-600" },
  { label: "Invoices", href: "/supplier/invoices", icon: ReceiptText, bg: "bg-rose-50", color: "text-rose-600" },
]

export default function SupplierDashboardPage() {
  const dash = useSupplierApi<DashboardEnvelope>(useSupplierApiUrl("/api/supplier/dashboard"), {
    select: (j) => j as DashboardEnvelope,
  })

  const k = dash.data?.kpis
  const activeJobs = dash.data?.activeJobs ?? []
  const currency = k?.currency ?? "GBP"

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

      {/* Compliance nudges — only when real. */}
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

      <SupplierKpiStrip kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Upcoming / active jobs */}
        <SupplierCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-slate-500" />
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

        {/* Quick actions + money snapshot */}
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
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold text-slate-900">Trust</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Verification level</span>
              <SupplierStatusBadge tone={(k?.verificationLevel ?? 0) >= 3 ? "emerald" : "slate"}>
                L{k?.verificationLevel ?? 0} · {k?.verificationLabel ?? "Unverified"}
              </SupplierStatusBadge>
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-sm text-slate-600">Insurance</span>
              <SupplierStatusBadge tone={k?.hasValidInsurance ? "emerald" : k?.insuranceExpiringSoon ? "amber" : "slate"}>
                {k?.hasValidInsurance ? "Evidence reviewed" : "Not reviewed"}
              </SupplierStatusBadge>
            </div>
            <Link href="/supplier/verification" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
              <ShieldCheck className="w-3.5 h-3.5" /> Manage verification →
            </Link>
          </SupplierCard>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        Every figure above is derived from your real workspace records — nothing is estimated.
      </p>
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
