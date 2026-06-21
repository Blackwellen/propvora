"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Store,
  CalendarRange,
  Truck,
  Banknote,
  ShieldAlert,
  BadgeCheck,
  Activity as ActivityIcon,
  ScrollText,
  Network,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { useIsBelowDesktop } from "@/components/mobile"
import { NetworkEmptyState, NetworkLockedState, SeverityDot, fmtRelative } from "./primitives"
import { ACTIVITY_MODULE_META } from "@/lib/network/types"
import type { ActivityResult, ActivityItem, ActivityModule } from "@/lib/network/types"

interface Props {
  canView: boolean
  data: ActivityResult
}

const MODULE_ICON: Record<ActivityModule, typeof Store> = {
  marketplace: Store,
  booking: CalendarRange,
  supplier: Truck,
  payout: Banknote,
  dispute: ShieldAlert,
  kyc: BadgeCheck,
  risk: ActivityIcon,
  audit: ScrollText,
}

export function ActivityFeedClient({ canView, data }: Props) {
  const isMobile = useIsBelowDesktop()
  const [activeModule, setActiveModule] = useState<ActivityModule | "all">("all")

  // Hooks must run unconditionally — derive everything before any early return.
  const modulesPresent = useMemo(() => {
    const set = new Set<ActivityModule>()
    for (const i of data.items) set.add(i.module)
    return Array.from(set)
  }, [data.items])

  const filtered = useMemo(
    () =>
      activeModule === "all"
        ? data.items
        : data.items.filter((i) => i.module === activeModule),
    [data.items, activeModule]
  )

  const chips: { key: ActivityModule | "all"; label: string }[] = useMemo(() => {
    const out: { key: ActivityModule | "all"; label: string }[] = [{ key: "all", label: "All" }]
    for (const m of modulesPresent) out.push({ key: m, label: ACTIVITY_MODULE_META[m].label })
    return out
  }, [modulesPresent])

  const header = (
    <SectionHeader
      breadcrumb={[{ label: "Network", href: "/property-manager/network" }, { label: "Activity" }]}
      title="Activity feed"
      subtitle="Every recorded event your workspace is a party to — across marketplace, bookings, suppliers, payments, identity, disputes and risk — in one timeline."
      actions={
        <Link
          href="/property-manager/network"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Network className="h-4 w-4" />
          Network
        </Link>
      }
    />
  )

  if (!canView) {
    return (
      <DashboardContainer>
        {header}
        <div className="mt-6">
          <NetworkLockedState message="Your unified activity feed merges events from every module your workspace touches." />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      {header}

      {data.items.length === 0 ? (
        <div className="mt-6">
          <NetworkEmptyState
            title="No activity yet"
            body="When you transact, take bookings, run supplier jobs, get paid out, or hit a verification or risk check, those events appear here in real time."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveModule(c.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  activeModule === c.key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {isMobile ? (
              <MobileTimeline items={filtered} />
            ) : (
              <DesktopTimeline items={filtered} />
            )}
          </div>
        </>
      )}
    </DashboardContainer>
  )
}

function DesktopTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="relative space-y-0 border-l border-slate-200 pl-0">
      {items.map((item) => {
        const Icon = MODULE_ICON[item.module]
        return (
          <li key={item.id} className="relative flex gap-4 pb-6 pl-6 last:pb-0">
            <span className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center">
              <SeverityDot severity={item.severity} />
            </span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Icon className="h-4.5 w-4.5 text-slate-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <time className="shrink-0 text-[12px] text-slate-400">
                  {fmtRelative(item.timestamp)}
                </time>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {ACTIVITY_MODULE_META[item.module].label}
                </span>
                {item.detail && <span className="truncate">{item.detail}</span>}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function MobileTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const Icon = MODULE_ICON[item.module]
        return (
          <div
            key={item.id}
            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Icon className="h-4.5 w-4.5 text-slate-600" />
              <span className="absolute -right-0.5 -top-0.5">
                <SeverityDot severity={item.severity} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] font-medium leading-snug text-slate-900">
                  {item.title}
                </p>
                <time className="shrink-0 text-[11.5px] text-slate-400">
                  {fmtRelative(item.timestamp)}
                </time>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-500">
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                  {ACTIVITY_MODULE_META[item.module].label}
                </span>
                {item.detail && <span className="truncate">{item.detail}</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
