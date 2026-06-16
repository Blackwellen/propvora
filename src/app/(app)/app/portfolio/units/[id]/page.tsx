"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { useContacts } from "@/hooks/useContacts"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { InlineEditField, InlineEditSelect } from "@/components/editing"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobileTabs from "@/components/mobile/MobileTabs"
import {
  Building2, Home, Users, Activity, ChevronRight, ChevronLeft,
  Plus, MapPin, Wrench, RefreshCw, Archive, Trash2,
} from "lucide-react"
import { useUnitComplianceItems, useActivityLog, StatusPill, type IncomeChartPoint } from "@/components/portfolio/unit-detail/shared"
import { UnitOverviewTab } from "@/components/portfolio/unit-detail/UnitOverviewTab"
import { UnitTenancyTab } from "@/components/portfolio/unit-detail/UnitTenancyTab"
import { UnitDocumentsTab } from "@/components/portfolio/unit-detail/UnitDocumentsTab"
import { UnitTimelineTab } from "@/components/portfolio/unit-detail/UnitTimelineTab"
import { UnitActivityTab } from "@/components/portfolio/unit-detail/UnitActivityTab"
import { UnitFinanceTab } from "@/components/portfolio/unit-detail/UnitFinanceTab"
import { UnitSpecificationsTab } from "@/components/portfolio/unit-detail/UnitSpecificationsTab"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "tenancy", label: "Tenancy" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "Timeline" },
  { id: "activity", label: "Activity" },
  { id: "finance", label: "Finance" },
  { id: "specifications", label: "Specifications" },
]

export default function UnitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.id as string
  const { workspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState("overview")

  const { data: unit, isLoading } = useUnit(workspace?.id, unitId)
  const { data: tenancies = [] } = useTenancies(workspace?.id)
  const { data: contacts = [] } = useContacts(workspace?.id)
  const { items: complianceItems, loaded: complianceLoaded } = useUnitComplianceItems(workspace?.id, unitId)
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  const unitTenancies = tenancies.filter((t) => t.unit_id === unitId)
  const tenancy = unitTenancies.find((t) => t.status === "active") ?? unitTenancies[0] ?? null
  const tenant = tenancy?.tenant_contact_id
    ? contacts.find((c) => c.id === tenancy.tenant_contact_id) ?? null
    : null

  const activityIds = [unitId, ...(tenancy ? [tenancy.id] : [])]
  const { events: activityEvents, loaded: activityLoaded } = useActivityLog(workspace?.id, activityIds)

  async function save(field: string, value: unknown) {
    if (!workspace?.id || !unit) return
    await updateUnit.mutateAsync({ id: unitId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  // Live chart data
  const [incomeChart, setIncomeChart] = useState<IncomeChartPoint[]>([])

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient();
    (async () => {
      try {
        const { data: txData, error: txErr } = await supabase
          .from("money_transactions")
          .select("amount, occurred_on, direction")
          .eq("workspace_id", workspace.id)
          .eq("unit_id", unitId)
          .eq("direction", "in")
          .order("occurred_on", { ascending: true })
        if (!txErr && txData && txData.length > 0) {
          const byMonth: Record<string, { income: number; expenses: number }> = {}
          for (const row of txData as Array<{ amount: number; occurred_on: string; direction: string }>) {
            const d = new Date(row.occurred_on)
            if (isNaN(d.getTime())) continue
            const key = d.toLocaleString("en-GB", { month: "short" })
            if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0 }
            byMonth[key].income += Number(row.amount) || 0
          }
          setIncomeChart(Object.entries(byMonth).slice(-6).map(([month, v]) => ({ month, income: v.income, expenses: v.expenses })))
        }
      } catch { /* table may not exist — leave empty arrays */ }
    })()
  }, [workspace?.id, unitId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
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
            <p className="text-[13px] text-slate-500 mt-1">This unit doesn't exist or you don't have access to it.</p>
          </div>
          <Link href="/app/portfolio/units" className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Units
          </Link>
        </div>
      </div>
    )
  }

  const displayUnit = unit

  const tabContent: Record<string, React.ReactNode> = {
    overview: <UnitOverviewTab unit={displayUnit} tenancy={tenancy} tenant={tenant} onSave={save} />,
    tenancy: <UnitTenancyTab unitId={unitId} tenancy={tenancy} tenant={tenant} />,
    documents: <UnitDocumentsTab unitId={unitId} />,
    timeline: <UnitTimelineTab events={activityEvents} loaded={activityLoaded} />,
    activity: <UnitActivityTab events={activityEvents} loaded={activityLoaded} />,
    finance: <UnitFinanceTab incomeChart={incomeChart} tenancy={tenancy} unit={displayUnit} />,
    specifications: <UnitSpecificationsTab unit={displayUnit} complianceItems={complianceItems} complianceLoaded={complianceLoaded} onSave={save} />,
  }

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* Mobile top bar */}
      <MobileTopBar
        title={displayUnit.unit_name}
        subtitle={displayUnit.unit_type ?? "Unit"}
        showBack
        backHref="/app/portfolio/units"
        primaryAction={{ label: "New tenancy", icon: Plus, href: `/app/portfolio/tenancies/new?unitId=${unitId}` }}
        overflowActions={[
          ...(displayUnit.property_id ? [{ label: "View parent property", icon: Building2, href: `/app/portfolio/properties/${displayUnit.property_id}` }] : []),
          { label: "View work", icon: Wrench, href: `/app/work?unitId=${unitId}` },
          { label: "Archive unit", icon: Archive, onClick: () => save("status", "reserved") },
        ]}
      />

      {/* Page Header — hidden on phones */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <Link href="/app/portfolio" className="hover:text-blue-600 font-medium">Portfolio</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/app/portfolio/properties" className="hover:text-blue-600 font-medium">Properties</Link>
            {displayUnit.property_id && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <Link href={`/app/portfolio/properties/${displayUnit.property_id}`} className="hover:text-blue-600 font-medium">Property</Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-800 font-semibold">{displayUnit.unit_name}</span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Link href={`/app/portfolio/tenancies/new?unitId=${unitId}`} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New Tenancy
            </Link>
            <button
              onClick={() => setActiveTab("activity")}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              title="View activity"
            >
              <Activity className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8">
        {/* Entity Hero Row */}
        <div className="flex items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <InlineEditField
                value={displayUnit.unit_name}
                onSave={(v) => save("unit_name", v)}
                label="Unit name"
                displayClassName="text-[20px] font-bold text-slate-900"
              />
              <span className="inline-flex items-center gap-1">
                {displayUnit.status === "occupied" && <StatusPill label="Occupied" color="emerald" />}
                {displayUnit.status === "vacant" && <StatusPill label="Vacant" color="amber" />}
                {displayUnit.status === "reserved" && <StatusPill label="Reserved" color="blue" />}
                {displayUnit.status === "under_works" && <StatusPill label="Under Works" color="slate" />}
                <InlineEditSelect
                  value={displayUnit.status}
                  onSave={(v) => save("status", v)}
                  transition={(v) => save("status", v)}
                  label="Status"
                  options={[
                    { value: "occupied", label: "Occupied" },
                    { value: "vacant", label: "Vacant" },
                    { value: "under_works", label: "Under Works" },
                    { value: "reserved", label: "Reserved" },
                  ]}
                  displayClassName="sr-only"
                />
              </span>
            </div>
            <div className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3" />
              {displayUnit.unit_type ?? "Unit"}{displayUnit.property_id ? (
                <Link href={`/app/portfolio/properties/${displayUnit.property_id}`} className="text-blue-600 hover:underline ml-1">
                  · View Property
                </Link>
              ) : ""}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ConfirmDialog
              title="Delete this unit?"
              description="This will permanently delete the unit and all linked data. This cannot be undone."
              confirmLabel="Delete unit"
              onConfirm={async () => {
                await deleteUnit.mutateAsync({ id: unitId, workspaceId: workspace!.id, propertyId: displayUnit.property_id })
                router.push("/app/portfolio/units")
              }}
            >
              {(openDelete) => (
                <ActionMenu
                  items={[
                    { label: "View parent property", icon: Building2, onClick: () => router.push(`/app/portfolio/properties/${displayUnit.property_id}`) },
                    { label: "Create tenancy", icon: Users, onClick: () => router.push(`/app/portfolio/tenancies/new?unitId=${unitId}`) },
                    { label: "View work", icon: Wrench, onClick: () => router.push(`/app/work?unitId=${unitId}`) },
                    { label: "Archive unit", icon: Archive, onClick: () => save("status", "reserved") },
                    { label: "Delete unit", icon: Trash2, variant: "danger", onClick: openDelete },
                  ]}
                />
              )}
            </ConfirmDialog>
          </div>
        </div>

        {/* Tab Bar — desktop */}
        <div className="hidden md:flex items-center gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab strip — mobile */}
        <div className="md:hidden mb-4">
          <MobileTabs
            tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
            value={activeTab}
            onChange={setActiveTab}
            aria-label="Unit sections"
          />
        </div>

        {/* Tab Content */}
        <div>
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  )
}
