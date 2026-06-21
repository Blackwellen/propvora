import React from "react"
import Link from "next/link"
import { Gauge, TrendingUp, ChevronRight } from "lucide-react"
import { AdminSectionCard } from "@/components/admin/ui"

function fmt(n: number | null): string {
  if (n === null) return "—"
  return n.toLocaleString("en-GB")
}
function fmtPence(n: number | null): string {
  if (n === null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format((n ?? 0) / 100)
}

interface PlatformHealthStats {
  workspacesActive: number | null
  workspacesSuspended: number | null
  activeOperators: number | null
  activeCustomers: number | null
}

interface PlatformFootprintStats {
  properties: number | null
  contacts: number | null
  tasks: number | null
  auditEvents: number | null
  mrrPence: number | null
}

interface Props {
  health: PlatformHealthStats
  footprint: PlatformFootprintStats
}

export function PlatformHealthPanel({ health, footprint }: Props) {
  const mrrUnknown = footprint.mrrPence === null || footprint.mrrPence === 0

  return (
    <>
      <AdminSectionCard title="Platform health" icon={Gauge}>
        <dl className="space-y-2.5">
          {[
            { label: "Active workspaces", value: fmt(health.workspacesActive) },
            { label: "Suspended", value: fmt(health.workspacesSuspended) },
            { label: "Operators", value: fmt(health.activeOperators) },
            { label: "Customers", value: fmt(health.activeCustomers) },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">{r.label}</dt>
              <dd className="text-[13px] font-semibold text-[#0B1B3F]">{r.value}</dd>
            </div>
          ))}
        </dl>
      </AdminSectionCard>

      <AdminSectionCard title="Platform footprint" icon={TrendingUp}>
        <dl className="space-y-2.5">
          {[
            { label: "Properties", value: fmt(footprint.properties), href: "/admin/portfolios" },
            { label: "Contacts", value: fmt(footprint.contacts), href: "/admin/work" },
            { label: "Tasks", value: fmt(footprint.tasks), href: "/admin/work" },
            { label: "Audit events", value: fmt(footprint.auditEvents), href: "/admin/audit-log" },
            { label: "MRR", value: mrrUnknown ? "—" : fmtPence(footprint.mrrPence), href: "/admin/subscriptions" },
          ].map((r) => (
            <Link key={r.label} href={r.href} className="flex items-center justify-between group">
              <dt className="text-[13px] text-slate-500 group-hover:text-slate-700">{r.label}</dt>
              <dd className="text-[13px] font-semibold text-[#0B1B3F] flex items-center gap-1">
                {r.value}
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
              </dd>
            </Link>
          ))}
        </dl>
      </AdminSectionCard>
    </>
  )
}
