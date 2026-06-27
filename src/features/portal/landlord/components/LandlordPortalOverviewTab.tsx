import Link from "next/link"
import {
  Building2, PoundSterling, Wallet, TrendingUp, FileText, Wrench, MessageSquare, ChevronRight,
} from "lucide-react"
import {
  PortalSectionCard, PortalKpiStrip, StatusChip, PortalAlertBanner,
  PortalEmptyState, PortalButtonLink, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"
import { formatMoney, propertyStatusMeta } from "@/lib/portal/format"
import { AlertTriangle } from "lucide-react"

interface Property {
  id: string
  nickname: string | null
  address_line1: string | null
  city: string | null
  postcode: string | null
  status: string
  target_rent_pcm: number | null
}

interface Transaction {
  id: string
  direction: string | null
  amount: number | null
  currency: string | null
  description: string | null
  created_at: string | null
}

interface OverdueAlert {
  tenancyId: string
  propertyLabel: string
}

interface LandlordPortalOverviewTabProps {
  kpis: PortalKpi[]
  properties: Property[]
  transactions: Transaction[]
  overdueAlerts: OverdueAlert[]
  arrears: number
  rentRoll: number
  workspaceName: string
  base: string
}

function propLabel(p: Property): string {
  return p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
}

export function LandlordPortalOverviewTab({
  kpis,
  properties,
  transactions,
  overdueAlerts,
  arrears,
  rentRoll,
  workspaceName,
  base,
}: LandlordPortalOverviewTabProps) {
  return (
    <>
      {overdueAlerts.length > 0 && (
        <PortalAlertBanner
          tone="red"
          icon={AlertTriangle}
          title="Rent arrears require attention"
          action={
            <PortalButtonLink
              href={`${base}/payments`}
              variant="primary"
              className="bg-red-600 hover:bg-red-700 border-red-600"
            >
              View arrears
            </PortalButtonLink>
          }
        >
          <span className="font-semibold">{formatMoney(arrears)} overdue</span> ·{" "}
          {overdueAlerts.length} tenanc{overdueAlerts.length === 1 ? "y" : "ies"} overdue
        </PortalAlertBanner>
      )}

      <PortalKpiStrip kpis={kpis} cols={4} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard
            title="Your properties"
            icon={Building2}
            viewAllHref={`${base}/properties`}
          >
            {properties.length === 0 ? (
              <PortalEmptyState
                icon={Building2}
                title="No properties shared yet"
                description="When your manager links a property to you, it appears here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -m-1 p-1">
                {properties.slice(0, 6).map((p) => {
                  const meta = propertyStatusMeta(p.status)
                  const tone: PortalTone =
                    meta.variant === "success"
                      ? "emerald"
                      : meta.variant === "warning"
                        ? "amber"
                        : "slate"
                  return (
                    <Link
                      key={p.id}
                      href={`${base}/properties/${p.id}`}
                      className="block rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] p-3.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#071B4D] truncate">
                          {propLabel(p)}
                        </p>
                        <StatusChip tone={tone} dot>
                          {meta.label}
                        </StatusChip>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {[p.address_line1, p.city, p.postcode].filter(Boolean).join(", ")}
                      </p>
                      {p.target_rent_pcm != null && (
                        <p className="text-xs text-slate-500 mt-2">
                          Rent{" "}
                          <span className="font-semibold text-[#071B4D]">
                            {formatMoney(p.target_rent_pcm)}
                          </span>{" "}
                          pcm
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </PortalSectionCard>

          <PortalSectionCard
            title="Recent rent activity"
            icon={Wallet}
            viewAllHref={`${base}/payments`}
          >
            {transactions.length === 0 ? (
              <PortalEmptyState icon={Wallet} title="No rent activity yet" />
            ) : (
              <div className="divide-y divide-[#EEF3FB] -my-1.5">
                {transactions.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        t.direction === "in"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      <PoundSterling className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#071B4D] truncate">
                        {t.description ?? "Rent"}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        t.direction === "in" ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {t.direction === "in" ? "+" : "−"}
                      {formatMoney(t.amount, t.currency ?? "GBP")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </PortalSectionCard>
        </div>

        <div className="space-y-4">
          <PortalSectionCard title="Portfolio at a glance" icon={TrendingUp}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Occupancy</dt>
                <dd className="font-semibold text-[#071B4D]">
                  {properties.length
                    ? Math.round(
                        (properties.filter(
                          (p) => p.status === "active" || p.status === "occupied"
                        ).length /
                          properties.length) *
                          100
                      )
                    : 0}
                  %
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Rent roll (pcm)</dt>
                <dd className="font-semibold text-[#071B4D]">{formatMoney(rentRoll)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Arrears</dt>
                <dd className="font-semibold text-red-600">{formatMoney(arrears)}</dd>
              </div>
            </dl>
          </PortalSectionCard>

          <PortalSectionCard
            title="Shared documents"
            icon={FileText}
            viewAllHref={`${base}/documents`}
          >
            <PortalButtonLink
              href={`${base}/documents`}
              variant="ghost"
              className="w-full justify-center"
            >
              View documents
            </PortalButtonLink>
          </PortalSectionCard>

          <PortalSectionCard title="Quick actions" icon={ChevronRight}>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["Properties", `${base}/properties`, Building2],
                  ["Financials", `${base}/financials`, Wallet],
                  ["Maintenance", `${base}/maintenance`, Wrench],
                  ["Messages", `${base}/messages`, MessageSquare],
                ] as const
              ).map(([l, h, I]) => {
                const Icon = I as typeof Building2
                return (
                  <Link
                    key={l}
                    href={h}
                    className="flex items-center gap-2 rounded-xl border border-[#EEF3FB] hover:bg-[#F8FBFF] px-3 py-2.5 text-sm font-semibold text-[#071B4D]"
                  >
                    <Icon className="w-4 h-4 text-[var(--brand)]" />
                    {l}
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                  </Link>
                )
              })}
            </div>
          </PortalSectionCard>
        </div>
      </div>
    </>
  )
}
