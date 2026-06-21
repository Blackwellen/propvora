"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Users, Truck, Building2, Store, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { useIsBelowDesktop } from "@/components/mobile"
import {
  NetworkKpiCard,
  RelationshipStatusBadge,
  NetworkEmptyState,
  NetworkLockedState,
  fmtWhen,
} from "./primitives"
import { RELATIONSHIP_LABEL } from "@/lib/network/types"
import type {
  PartnerListResult,
  PartnerGroup,
  PartnerGroupKey,
  PartnerRelationship,
} from "@/lib/network/types"

interface Props {
  canView: boolean
  data: PartnerListResult
}

const GROUP_ICON: Record<PartnerGroupKey, typeof Users> = {
  suppliers: Truck,
  customers: Users,
  marketplace: Store,
  operators: Building2,
}

export function PartnerNetworkClient({ canView, data }: Props) {
  const isMobile = useIsBelowDesktop()
  const [groupFilter, setGroupFilter] = useState<PartnerGroupKey | "all">("all")

  // Hooks must run unconditionally — derive everything before any early return.
  const { summary, groups } = data
  const hasAny = summary.totalPartners > 0

  const visibleGroups = useMemo(
    () => (groupFilter === "all" ? groups : groups.filter((g) => g.key === groupFilter)),
    [groups, groupFilter]
  )

  const filterChips: { key: PartnerGroupKey | "all"; label: string }[] = useMemo(() => {
    const chips: { key: PartnerGroupKey | "all"; label: string }[] = [
      { key: "all", label: "All" },
    ]
    for (const g of groups) chips.push({ key: g.key, label: g.label })
    return chips
  }, [groups])

  const header = (
    <SectionHeader
      title="Partner network"
      subtitle="Operators, suppliers, customers and marketplace counterparties your workspace works with — derived from real recorded activity."
      actions={
        <Link
          href="/property-manager/network/activity"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Activity className="h-4 w-4" />
          Activity feed
        </Link>
      }
    />
  )

  if (!canView) {
    return (
      <DashboardContainer>
        {header}
        <div className="mt-6">
          <NetworkLockedState message="Your partner network shows the suppliers, customers and marketplace counterparties your workspace interacts with." />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      {header}

      {/* KPI strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <NetworkKpiCard label="Total partners" value={summary.totalPartners} />
        <NetworkKpiCard label="Suppliers" value={summary.suppliers} />
        <NetworkKpiCard label="Customers" value={summary.customers} />
        <NetworkKpiCard
          label="Marketplace"
          value={summary.marketplaceCounterparties}
          hint="Buyers + sellers"
        />
        <NetworkKpiCard label="Interactions" value={summary.totalInteractions} />
      </div>

      {!hasAny ? (
        <div className="mt-6">
          <NetworkEmptyState
            title="No partners yet"
            body="As soon as you connect a supplier, take a booking, or transact on the marketplace, the counterparties will appear here automatically."
          />
        </div>
      ) : (
        <>
          {/* Group filter chips */}
          {filterChips.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {filterChips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setGroupFilter(c.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                    groupFilter === c.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-8">
            {visibleGroups.map((g) => (
              <GroupBlock key={g.key} group={g} mobile={isMobile} />
            ))}
          </div>
        </>
      )}
    </DashboardContainer>
  )
}

function GroupBlock({ group, mobile }: { group: PartnerGroup; mobile: boolean }) {
  const Icon = GROUP_ICON[group.key]
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <h2 className="text-[15px] font-semibold text-slate-900">{group.label}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-500">
          {group.partners.length}
        </span>
      </div>

      {mobile ? (
        <div className="space-y-2.5">
          {group.partners.map((p) => (
            <PartnerCard key={p.id} partner={p} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[12px] font-medium text-slate-500">
                <th className="px-4 py-2.5">Partner</th>
                <th className="px-4 py-2.5">Relationship</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Interactions</th>
                <th className="px-4 py-2.5">First seen</th>
                <th className="px-4 py-2.5">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {group.partners.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{partnerName(p)}</p>
                    {p.partnerType && (
                      <p className="text-[12px] capitalize text-slate-400">{p.partnerType}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {RELATIONSHIP_LABEL[p.relationshipType]}
                  </td>
                  <td className="px-4 py-3">
                    <RelationshipStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {p.interactionCount}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtWhen(p.firstInteractionAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{fmtWhen(p.lastInteractionAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </section>
  )
}

function PartnerCard({ partner }: { partner: PartnerRelationship }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{partnerName(partner)}</p>
          <p className="text-[12.5px] text-slate-500">
            {RELATIONSHIP_LABEL[partner.relationshipType]}
          </p>
        </div>
        <RelationshipStatusBadge status={partner.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[12.5px] text-slate-500">
        <span>{partner.interactionCount} interactions</span>
        <span>Last {fmtWhen(partner.lastInteractionAt)}</span>
      </div>
    </div>
  )
}

function partnerName(p: PartnerRelationship): string {
  if (p.partnerName) return p.partnerName
  return `Partner ${p.partnerWorkspaceId.slice(0, 8)}`
}
