"use client"

import React, { createContext, useContext } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/useUnits"
import { useI18nTabs } from "@/lib/i18n/use-country-tabs"
import { cn } from "@/lib/utils"
import { InlineEditField, InlineEditSelect } from "@/components/editing"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobileTabs from "@/components/mobile/MobileTabs"
import { StatusPill } from "@/components/portfolio/unit-detail/shared"
import {
  Building2, Home, Users, Activity, ChevronRight, ChevronLeft,
  Plus, MapPin, Wrench, Archive, Trash2, RefreshCw,
} from "lucide-react"

/* ── Shared context so tab pages can call save ── */
interface UnitDetailCtx { unitId: string; save: (field: string, value: unknown) => Promise<void> }
const Ctx = createContext<UnitDetailCtx | null>(null)
export function useUnitDetailCtx() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useUnitDetailCtx must be used inside UnitDetailLayout")
  return c
}

export default function UnitDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const unitId = params.id as string
  const { workspace } = useWorkspace()

  const tabs = useI18nTabs("unit_detail")
  const { data: unit, isLoading } = useUnit(workspace?.id, unitId)
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  // Resolve active tab from last URL segment — fall back to "overview"
  const lastSeg = pathname.split("/").pop() ?? ""
  const activeTab = tabs.find(t => t.key === lastSeg)?.key ?? "overview"

  // Skip the tab shell for edit pages
  const isEdit = pathname.endsWith("/edit")

  async function save(field: string, value: unknown) {
    if (!workspace?.id || !unit) return
    await updateUnit.mutateAsync({ id: unitId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  if (isEdit) return <Ctx.Provider value={{ unitId, save }}>{children}</Ctx.Provider>

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[var(--brand)] animate-spin" />
          <p className="text-sm text-slate-500">Loading unit…</p>
        </div>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Home className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-700">Unit not found</p>
            <p className="text-[13px] text-slate-500 mt-1">This unit doesn&apos;t exist or you don&apos;t have access to it.</p>
          </div>
          <Link href="/property-manager/portfolio/units" className="text-[13px] font-semibold text-[var(--brand)] hover:underline flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Units
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ unitId, save }}>
      <div className="min-h-screen bg-slate-50/40">
        <MobileTopBar
          title={unit.unit_name}
          subtitle={unit.unit_type ?? "Unit"}
          showBack
          backHref="/property-manager/portfolio/units"
          primaryAction={{ label: "New tenancy", icon: Plus, href: `/property-manager/portfolio/tenancies/new?unitId=${unitId}` }}
          overflowActions={[
            ...(unit.property_id ? [{ label: "View parent property", icon: Building2, href: `/property-manager/portfolio/properties/${unit.property_id}` }] : []),
            { label: "View work", icon: Wrench, href: `/property-manager/work?unitId=${unitId}` },
            { label: "Archive unit", icon: Archive, onClick: () => save("status", "offline") },
          ]}
        />

        {/* Sticky header — desktop only */}
        <div className="hidden md:block bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <Link href="/property-manager/portfolio" className="hover:text-[var(--brand)] font-medium">Portfolio</Link>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <Link href="/property-manager/portfolio/properties" className="hover:text-[var(--brand)] font-medium">Properties</Link>
              {unit.property_id && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <Link href={`/property-manager/portfolio/properties/${unit.property_id}`} className="hover:text-[var(--brand)] font-medium">Property</Link>
                </>
              )}
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-800 font-semibold">{unit.unit_name}</span>
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href={`/property-manager/portfolio/tenancies/new?unitId=${unitId}`}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand)] text-white rounded-xl text-[12px] font-semibold hover:bg-[var(--brand-strong)] transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> New Tenancy
              </Link>
              <Link
                href={`/property-manager/portfolio/units/${unitId}/activity`}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                title="View activity"
              >
                <Activity className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 pb-8">
          {/* Entity hero row */}
          <div className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-100)] flex items-center justify-center flex-shrink-0">
              <Home className="w-6 h-6 text-[var(--brand)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <InlineEditField
                  value={unit.unit_name}
                  onSave={(v) => save("unit_name", v)}
                  label="Unit name"
                  displayClassName="text-[20px] font-bold text-slate-900"
                />
                <span className="inline-flex items-center gap-1">
                  {unit.status === "occupied" && <StatusPill label="Occupied" color="emerald" />}
                  {unit.status === "available" && <StatusPill label="Vacant" color="amber" />}
                  {unit.status === "offline" && <StatusPill label="Offline" color="blue" />}
                  {unit.status === "maintenance" && <StatusPill label="Under works" color="slate" />}
                  <InlineEditSelect
                    value={unit.status}
                    onSave={(v) => save("status", v)}
                    transition={(v) => save("status", v)}
                    label="Status"
                    options={[
                      { value: "occupied", label: "Occupied" },
                      { value: "available", label: "Vacant" },
                      { value: "maintenance", label: "Under works" },
                      { value: "offline", label: "Offline" },
                    ]}
                    displayClassName="sr-only"
                  />
                </span>
              </div>
              <div className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3" />
                {unit.unit_type ?? "Unit"}
                {unit.property_id && (
                  <Link href={`/property-manager/portfolio/properties/${unit.property_id}`} className="text-[var(--brand)] hover:underline ml-1">
                    · View Property
                  </Link>
                )}
              </div>
            </div>
            <div className="ml-auto">
              <ConfirmDialog
                title="Delete this unit?"
                description="This will permanently delete the unit and all linked data. This cannot be undone."
                confirmLabel="Delete unit"
                onConfirm={async () => {
                  await deleteUnit.mutateAsync({ id: unitId, workspaceId: workspace!.id, propertyId: unit.property_id })
                  router.push("/property-manager/portfolio/units")
                }}
              >
                {(openDelete) => (
                  <ActionMenu
                    items={[
                      { label: "View parent property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${unit.property_id}`) },
                      { label: "Create tenancy", icon: Users, onClick: () => router.push(`/property-manager/portfolio/tenancies/new?unitId=${unitId}`) },
                      { label: "View work", icon: Wrench, onClick: () => router.push(`/property-manager/work?unitId=${unitId}`) },
                      { label: "Archive unit", icon: Archive, onClick: () => save("status", "offline") },
                      { label: "Delete unit", icon: Trash2, variant: "danger", onClick: openDelete },
                    ]}
                  />
                )}
              </ConfirmDialog>
            </div>
          </div>

          {/* Desktop tab strip — Link-based, i18n labels */}
          <div className="hidden md:flex items-center gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={`/property-manager/portfolio/units/${unitId}/${tab.key}`}
                className={cn(
                  "px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Mobile tab strip */}
          <div className="md:hidden mb-4">
            <MobileTabs
              tabs={tabs.map(t => ({ id: t.key, label: t.label }))}
              value={activeTab}
              onChange={(id) => router.push(`/property-manager/portfolio/units/${unitId}/${id}`)}
              aria-label="Unit sections"
            />
          </div>

          {children}
        </div>
      </div>
    </Ctx.Provider>
  )
}
