import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Store,
  PoundSterling,
  TrendingUp,
  Tag,
  Gavel,
  Wallet,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { cn } from "@/lib/utils"
import { getAdminIdentity } from "@/lib/admin/guard"
import { getMarketplaceOverview, fmtPence } from "@/components/admin-marketplace/data"

export const dynamic = "force-dynamic"

/**
 * Platform-admin MARKETPLACE OVERSIGHT overview.
 *
 * Cross-tenant BY DESIGN — a platform admin oversees marketplace commerce across
 * every workspace. Access is gated by the (admin) layout AND re-checked here
 * server-side (fail-closed): a non-admin is redirected before any data loads.
 * All money is real, integer pence summed from marketplace_transactions / payouts.
 */
export default async function MarketplaceOverviewPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const o = await getMarketplaceOverview()

  const kpis: Array<{
    label: string
    value: string
    icon: React.ElementType
    colour: string
    bg: string
    href: string
    sub?: string
  }> = [
    {
      label: "GMV (gross)",
      value: fmtPence(o.gmvPence),
      icon: PoundSterling,
      colour: "text-[#2563EB]",
      bg: "bg-[#EFF6FF]",
      href: "/admin/marketplace/transactions",
      sub: `${o.totalTransactions ?? 0} transactions`,
    },
    {
      label: "Platform revenue",
      value: fmtPence(o.platformRevenuePence),
      icon: TrendingUp,
      colour: "text-[#059669]",
      bg: "bg-[#ECFDF5]",
      href: "/admin/marketplace/transactions",
      sub: "sum of platform fees",
    },
    {
      label: "Active listings",
      value: o.activeListings === null ? "—" : o.activeListings.toLocaleString("en-GB"),
      icon: Tag,
      colour: "text-[#7C3AED]",
      bg: "bg-[#F5F3FF]",
      href: "/admin/marketplace/transactions",
    },
    {
      label: "Open disputes",
      value: o.openDisputes === null ? "—" : o.openDisputes.toLocaleString("en-GB"),
      icon: Gavel,
      colour: "text-[#dc2626]",
      bg: "bg-[#FEF2F2]",
      href: "/admin/marketplace/disputes",
      sub: "open · under review · escalated",
    },
    {
      label: "Pending payouts",
      value: o.pendingPayouts === null ? "—" : o.pendingPayouts.toLocaleString("en-GB"),
      icon: Wallet,
      colour: "text-[#d97706]",
      bg: "bg-[#FFFBEB]",
      href: "/admin/marketplace/payouts",
      sub: fmtPence(o.pendingPayoutPence),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#2563EB]" /> Marketplace oversight
          </h1>
          <p className="text-xs text-slate-500">
            Live cross-workspace commerce overview · all amounts in GBP
          </p>
        </div>
      </div>

      {/* KPI row — all live, integer pence */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.label} href={kpi.href}>
              <Card className="p-3.5 hover:border-[#BFDBFE] hover:shadow-sm transition-all h-full">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", kpi.bg)}>
                  <Icon className={cn("w-4 h-4", kpi.colour)} />
                </div>
                <p className={cn("text-lg font-bold leading-none truncate", kpi.colour)}>{kpi.value}</p>
                <p className="text-[11px] font-medium text-slate-600 mt-1">{kpi.label}</p>
                {kpi.sub && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.sub}</p>}
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Honesty note */}
      <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          Figures are summed directly from live <code className="font-mono">marketplace_transactions</code> and{" "}
          <code className="font-mono">payouts</code> rows (integer pence, no estimation). Dispute resolution is an
          explicit, authorised admin action that is recorded in the audit log — never automatic.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/admin/marketplace/transactions", icon: PoundSterling, label: "Transactions", desc: "Cross-workspace monitor" },
          { href: "/admin/marketplace/disputes", icon: Gavel, label: "Disputes", desc: "Resolve the queue" },
          { href: "/admin/marketplace/payouts", icon: Wallet, label: "Payouts", desc: "Platform-wide monitor" },
          { href: "/admin/marketplace/workspaces", icon: Store, label: "Workspaces", desc: "Marketplace footprint" },
        ].map((l) => {
          const Icon = l.icon
          return (
            <Link key={l.href} href={l.href}>
              <Card className="p-4 hover:border-[#BFDBFE] hover:shadow-sm transition-all h-full group">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-3">
                    <Icon className="w-[18px] h-[18px] text-[#2563EB]" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] transition-colors" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{l.label}</p>
                <p className="text-[11px] text-slate-400">{l.desc}</p>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
