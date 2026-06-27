"use client"

import React, { createContext, useContext } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancy, useUpdateTenancy, useDeleteTenancy, useTenancyArrears } from "@/hooks/useTenancies"
import { useContact } from "@/hooks/useContacts"
import { useProperty } from "@/hooks/useProperties"
import { useUnit } from "@/hooks/useUnits"
import { useI18nTabs } from "@/lib/i18n/use-country-tabs"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobileTabs from "@/components/mobile/MobileTabs"
import {
  Building2, Home, ChevronRight, ChevronLeft,
  Plus, XCircle, RefreshCw, Trash2,
} from "lucide-react"
import type { TenancyDisplay } from "@/components/portfolio/tenancy-detail/shared"

/* ── Shared context so tab pages can access t + save ── */
interface TenancyDetailCtx {
  tenancyId: string
  t: TenancyDisplay | null
  save: (field: string, value: unknown) => Promise<void>
}
const Ctx = createContext<TenancyDetailCtx | null>(null)
export function useTenancyDetailCtx() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useTenancyDetailCtx must be used inside TenancyDetailLayout")
  return c
}

export default function TenancyDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const tenancyId = params.id as string
  const { workspace } = useWorkspace()

  const tabs = useI18nTabs("tenancy_detail")
  const { data: tenancy, isLoading } = useTenancy(workspace?.id, tenancyId)
  const { data: tenantContact } = useContact(workspace?.id, tenancy?.tenant_contact_id ?? undefined)
  const { data: property } = useProperty(workspace?.id, tenancy?.property_id)
  const { data: unit } = useUnit(workspace?.id, tenancy?.unit_id ?? undefined)
  const { data: payHealth } = useTenancyArrears(workspace?.id, tenancyId)
  const updateTenancy = useUpdateTenancy()
  const deleteTenancy = useDeleteTenancy()

  const lastSeg = pathname.split("/").pop() ?? ""
  const activeTab = tabs.find(t => t.key === lastSeg)?.key ?? "overview"
  const isEdit = pathname.endsWith("/edit")

  async function save(field: string, value: unknown) {
    if (!workspace?.id) return
    await updateTenancy.mutateAsync({ id: tenancyId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  // Build display object for context (used by tab pages via context)
  const tenantName = tenantContact?.full_name ?? (tenancy?.tenant_contact_id ? "Tenant" : "Unassigned tenant")
  const t: TenancyDisplay | null = tenancy ? {
    id: tenancy.id,
    tenantName,
    tenantRole: "Primary Tenant",
    tenantPhone: tenantContact?.phone ?? "",
    tenantEmail: tenantContact?.email ?? "",
    tenantAvatarInitials: (tenantContact?.full_name ?? tenancy.reference ?? tenancy.id).slice(0, 2).toUpperCase(),
    address: [property?.address_line1, property?.city, property?.postcode].filter(Boolean).join(", "),
    property: property?.name ?? "Property",
    propertyId: tenancy.property_id,
    unit: unit?.unit_name ?? (tenancy.unit_id ? "Unit" : "Whole property"),
    unitId: tenancy.unit_id ?? null,
    unitSize: unit?.floor_area_sqm != null ? `${unit.floor_area_sqm}m²` : "Not recorded",
    leaseStart: tenancy.start_date,
    leaseEnd: tenancy.end_date ?? "Periodic",
    leaseTerm: tenancy.tenancy_type ?? "AST",
    rent: tenancy.rent_amount,
    deposit: tenancy.deposit_amount ?? 0,
    depositScheme: tenancy.deposit_scheme ?? "—",
    depositCertNo: tenancy.deposit_reference ?? "—",
    depositProtectedOn: tenancy.start_date,
    depositExpiry: tenancy.end_date ?? "—",
    paymentDay: "1st of each month",
    paymentMethod: "Bank Transfer",
    tenancyType: (tenancy.tenancy_type ?? "AST").toUpperCase(),
    tenancyTypeRaw: tenancy.tenancy_type ?? null,
    rentFrequency: tenancy.rent_frequency ?? "monthly",
    depositHeldBy: tenancy.deposit_held_by ?? null,
    notes: tenancy.notes ?? null,
    status: tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1),
    rawStatus: tenancy.status,
    arrears: payHealth?.arrears ?? 0,
    onTimeRate: payHealth?.onTimeRate ?? 100,
    totalPaid6m: payHealth?.totalPaid6m ?? 0,
    totalDue6m: payHealth?.totalDue6m ?? (tenancy.rent_amount * 6),
  } : null

  if (isEdit) return <Ctx.Provider value={{ tenancyId, t, save }}>{children}</Ctx.Provider>

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[var(--brand)] animate-spin" />
          <p className="text-sm text-slate-500">Loading tenancy...</p>
        </div>
      </div>
    )
  }

  if (!tenancy || !t) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Home className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-700">Tenancy not found</p>
            <p className="text-[13px] text-slate-500 mt-1">This tenancy doesn&apos;t exist or you don&apos;t have access to it.</p>
          </div>
          <Link href="/property-manager/portfolio/tenancies" className="text-[13px] font-semibold text-[var(--brand)] hover:underline flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Tenancies
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ tenancyId, t, save }}>
      <div className="min-h-screen bg-slate-50/40">
        <MobileTopBar
          title={t.tenantName}
          subtitle={`${t.property}, ${t.unit}`}
          showBack
          backHref="/property-manager/portfolio/tenancies"
          primaryAction={{
            label: "New tenancy",
            icon: Plus,
            href: t.propertyId
              ? `/property-manager/portfolio/tenancies/new?propertyId=${t.propertyId}`
              : "/property-manager/portfolio/tenancies/new",
          }}
          overflowActions={[
            ...(tenancy.property_id ? [{ label: "View property", icon: Building2, href: `/property-manager/portfolio/properties/${tenancy.property_id}` }] : []),
            ...(tenancy.unit_id ? [{ label: "View unit", icon: Home, href: `/property-manager/portfolio/units/${tenancy.unit_id}` }] : []),
            { label: "End tenancy", icon: XCircle, destructive: true, onClick: () => save("status", "ended") },
          ]}
        />

        <div className="px-4 md:px-6 pb-6 pt-4">
          {/* Breadcrumb — desktop only */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm mb-3">
            <Link href="/property-manager/portfolio" className="text-slate-500 hover:text-slate-700 transition-colors">Portfolio</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/property-manager/portfolio/tenancies" className="text-slate-500 hover:text-slate-700 transition-colors">Tenancies</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-medium">{t.tenantName}</span>
          </nav>

          {/* Page header — desktop only */}
          <div className="hidden md:flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tenancy Lifecycle, Payments &amp; Deposit</h1>
              <p className="text-sm text-slate-500 mt-0.5">{t.tenantName} — {t.property}, {t.unit}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ConfirmDialog
                title="Delete this tenancy?"
                description="This will permanently delete the tenancy record. This cannot be undone."
                confirmLabel="Delete tenancy"
                onConfirm={async () => {
                  await deleteTenancy.mutateAsync({ id: tenancyId, workspaceId: workspace!.id })
                  router.push("/property-manager/portfolio/tenancies")
                }}
              >
                {(openDelete) => (
                  <ActionMenu
                    items={[
                      { label: "View property", icon: Building2, onClick: () => tenancy.property_id && router.push(`/property-manager/portfolio/properties/${tenancy.property_id}`) },
                      { label: "View unit", icon: Home, onClick: () => tenancy.unit_id && router.push(`/property-manager/portfolio/units/${tenancy.unit_id}`) },
                      { label: "End tenancy", icon: XCircle, variant: "danger", onClick: () => save("status", "ended") },
                      { label: "Delete tenancy", icon: Trash2, variant: "danger", onClick: openDelete },
                    ]}
                  />
                )}
              </ConfirmDialog>
              <Link
                href={t.propertyId
                  ? `/property-manager/portfolio/tenancies/new?propertyId=${t.propertyId}`
                  : "/property-manager/portfolio/tenancies/new"}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--brand)] rounded-xl px-4 py-2 hover:bg-[var(--brand-strong)] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Tenancy
              </Link>
            </div>
          </div>

          {/* Desktop tab strip — Link-based, i18n labels */}
          <div className="hidden md:flex items-center gap-0 border-b border-slate-200 mb-0 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={`/property-manager/portfolio/tenancies/${tenancyId}/${tab.key}`}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                  activeTab === tab.key
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
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
              onChange={(id) => router.push(`/property-manager/portfolio/tenancies/${tenancyId}/${id}`)}
              aria-label="Tenancy sections"
            />
          </div>

          {children}
        </div>
      </div>
    </Ctx.Provider>
  )
}
