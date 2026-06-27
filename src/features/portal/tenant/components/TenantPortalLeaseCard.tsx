import { Home, PoundSterling, CalendarClock, ShieldCheck, Download } from "lucide-react"
import { PortalCard, PortalFact, StatusChip, PortalButtonLink } from "@/components/portals/portal-ui"
import { formatMoney, formatDate, tenancyStatusMeta } from "@/lib/portal/format"
import type { PortalTone } from "@/components/portals/portal-ui"

interface Tenancy {
  status: string
  rent_amount: number | null
  rent_frequency: string | null
  deposit_amount: number | null
  start_date: string | null
  end_date: string | null
  reference?: string | null
}

interface TenantPortalLeaseCardProps {
  tenancy: Tenancy
  propertyLabel: string
  propertyAddress: string
  propertyImage: string | null
  nextDue: string | null
  dueIn: number | null
  base: string
}

function rentFreq(freq: string | null | undefined): string {
  return freq === "weekly"
    ? "per week"
    : freq === "quarterly"
      ? "per quarter"
      : freq === "annually"
        ? "per year"
        : "per month"
}

export function TenantPortalLeaseCard({
  tenancy,
  propertyLabel,
  propertyAddress,
  propertyImage,
  nextDue,
  dueIn,
  base,
}: TenantPortalLeaseCardProps) {
  const statusMeta = tenancyStatusMeta(tenancy.status)
  const statusTone: PortalTone = statusMeta.variant === "success" ? "emerald" : "blue"

  return (
    <PortalCard className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        <div className="relative h-44 lg:h-auto bg-gradient-to-br from-[#1E3A8A] to-[var(--brand)]">
          {propertyImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={propertyImage}
              alt={propertyLabel}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="w-12 h-12 text-white/40" />
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#071B4D]">{propertyLabel}</h2>
                <StatusChip tone={statusTone} dot>
                  {statusMeta.label} tenancy
                </StatusChip>
              </div>
              {propertyAddress && (
                <p className="text-xs text-slate-500 mt-0.5">{propertyAddress}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PortalButtonLink href={`${base}/documents`} icon={Download}>
                Download agreement
              </PortalButtonLink>
              <PortalButtonLink href={`${base}/tenancy`} variant="primary">
                View tenancy
              </PortalButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <PortalFact
              icon={PoundSterling}
              label="Rent"
              value={
                <>
                  {formatMoney(tenancy.rent_amount)}{" "}
                  <span className="text-[11px] font-normal text-slate-400">
                    {rentFreq(tenancy.rent_frequency)}
                  </span>
                </>
              }
            />
            {tenancy.deposit_amount != null && (
              <PortalFact
                icon={ShieldCheck}
                label="Deposit"
                value={formatMoney(tenancy.deposit_amount)}
              />
            )}
            <PortalFact
              icon={CalendarClock}
              label="Start date"
              value={formatDate(tenancy.start_date)}
            />
            {tenancy.end_date && (
              <PortalFact
                icon={CalendarClock}
                label="End date"
                value={formatDate(tenancy.end_date)}
              />
            )}
          </div>
          {nextDue && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#F4F8FF] border border-[#E1ECFF] px-4 py-2.5">
              <span className="text-sm text-slate-600">
                Next rent due{" "}
                <span className="font-semibold text-[#071B4D]">{formatDate(nextDue)}</span>
              </span>
              {dueIn != null && (
                <StatusChip tone={dueIn <= 7 ? "amber" : "blue"}>
                  {dueIn} day{dueIn === 1 ? "" : "s"}
                </StatusChip>
              )}
            </div>
          )}
        </div>
      </div>
    </PortalCard>
  )
}
