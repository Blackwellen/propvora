import { Gauge, TrendingUp, ChevronRight } from "lucide-react"
import Link from "next/link"
import { AdminSectionCard } from "@/components/admin/ui"

interface PlatformStats {
  workspacesActive: number | null
  workspacesSuspended: number | null
}

interface ExtendedStats {
  activeOperators: number | null
  activeCustomers: number | null
  mrrPence: number | null
  platformGmvPence: number | null
}

interface Props {
  stats: PlatformStats
  extStats: ExtendedStats
  propertiesCount: number | null
  contactsCount: number | null
  tasksCount: number | null
  auditEventsCount: number | null
}

function fmt(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("en-GB")
}

function fmtPence(n: number | null): string {
  if (n === null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n / 100)
}

export function AdminPlatformHealthWidget({ stats, extStats, propertiesCount, contactsCount, tasksCount, auditEventsCount }: Props) {
  const mrrUnknown = extStats.mrrPence === null || extStats.mrrPence === 0
  return (
    <>
      <AdminSectionCard title="Platform health" icon={Gauge}>
        <dl className="space-y-2.5">
          {[
            { label: "Active workspaces", value: fmt(stats.workspacesActive), tone: "emerald" as const },
            { label: "Suspended", value: fmt(stats.workspacesSuspended), tone: "red" as const },
            { label: "Operators", value: fmt(extStats.activeOperators), tone: "blue" as const },
            { label: "Customers", value: fmt(extStats.activeCustomers), tone: "sky" as const },
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
            { label: "Properties", value: fmt(propertiesCount), href: "/admin/portfolios" },
            { label: "Contacts", value: fmt(contactsCount), href: "/admin/work" },
            { label: "Tasks", value: fmt(tasksCount), href: "/admin/work" },
            { label: "Audit events", value: fmt(auditEventsCount), href: "/admin/audit-log" },
            { label: "MRR", value: mrrUnknown ? "—" : fmtPence(extStats.mrrPence), href: "/admin/subscriptions" },
          ].map((r) => (
            <Link key={r.label} href={r.href} className="flex items-center justify-between group">
              <dt className="text-[13px] text-slate-500 group-hover:text-slate-700">{r.label}</dt>
              <dd className="text-[13px] font-semibold text-[#0B1B3F] flex items-center gap-1">
                {r.value}<ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
              </dd>
            </Link>
          ))}
        </dl>
      </AdminSectionCard>
    </>
  )
}
