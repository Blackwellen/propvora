"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Hammer, ArrowLeft, Tag, Banknote, Settings2, Pencil, ChevronRight, BarChart3 } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { InlineEditField } from "@/components/editing"
import {
  SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, SupplierButton, SupplierTabs, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { moneyPence } from "@/components/supplier-workspace/format"

interface ServiceRow {
  id: string
  name: string
  category: string | null
  description: string | null
  pricing_model: "hourly" | "fixed" | "quote_required"
  rate_pence: number | null
  callout_fee_pence: number | null
  active: boolean
  created_at?: string
}

const PRICING_LABEL: Record<string, string> = { hourly: "Per hour", fixed: "Fixed price", quote_required: "Quote required" }
const PRICING_OPTS = [
  { value: "quote_required", label: "Quote required" },
  { value: "hourly", label: "Per hour" },
  { value: "fixed", label: "Fixed price" },
]

export default function SupplierServiceDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { workspaceId } = useSupplierWorkspace()
  const { isTeam } = useSupplierPlan()
  const svc = useSupplierApi<ServiceRow[]>(
    useSupplierApiUrl("/api/supplier/services", { includeInactive: "1" }),
    { select: (j) => (j as { items?: ServiceRow[] }).items ?? [] }
  )
  const [tab, setTab] = useState<"overview" | "pricing" | "performance">("overview")

  const service = useMemo(() => (svc.data ?? []).find((s) => s.id === id) ?? null, [svc.data, id])

  async function patch(field: string, value: string | number | boolean) {
    if (!workspaceId) throw new Error("Workspace not ready.")
    const res = await fetch("/api/supplier/services", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, serviceId: id, [field]: value }),
    })
    if (!res.ok) throw new Error("Could not save.")
    svc.refresh()
  }

  async function toggleActive() {
    if (!service) return
    await patch("active", !service.active)
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title={service?.name ?? "Service"} subtitle="Service detail" />

      {/* Breadcrumb */}
      <nav className="hidden md:flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/supplier/services" className="hover:text-slate-600">Services</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{service?.name ?? "Service"}</span>
      </nav>

      {svc.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : !service ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Hammer}
            title="Service not found"
            description="This service may have been removed. Return to your catalogue to see what's live."
            action={<Link href="/supplier/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]"><ArrowLeft className="w-4 h-4" /> Back to services</Link>}
          />
        </SupplierCard>
      ) : (
        <>
          {/* Hero */}
          <SupplierCard className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Hammer className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900">{service.name}</h1>
                  <SupplierStatusBadge tone={service.active ? "emerald" : "slate"}>{service.active ? "Active" : "Inactive"}</SupplierStatusBadge>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {service.category && <SupplierStatusBadge tone="blue">{humaniseStatus(service.category)}</SupplierStatusBadge>}
                  <SupplierStatusBadge tone="violet">{PRICING_LABEL[service.pricing_model]}</SupplierStatusBadge>
                  {service.rate_pence != null && (
                    <span className="text-sm font-semibold text-slate-800">{moneyPence(service.rate_pence)}{service.pricing_model === "hourly" ? "/hr" : ""}</span>
                  )}
                </div>
              </div>
              <SupplierButton size="sm" variant="secondary" onClick={toggleActive}>
                {service.active ? "Deactivate" : "Activate"}
              </SupplierButton>
            </div>
          </SupplierCard>

          <SupplierTabs
            active={tab}
            onChange={(k) => setTab(k as typeof tab)}
            tabs={[
              { key: "overview", label: "Overview", icon: Tag },
              { key: "pricing", label: "Pricing & settings", icon: Settings2 },
              ...(isTeam ? [{ key: "performance", label: "SLA & performance", icon: BarChart3 }] : []),
            ]}
          />

          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SupplierCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Pencil className="w-4 h-4 text-slate-500" />
                  <h2 className="text-base font-semibold text-slate-900">Details</h2>
                </div>
                <dl className="space-y-3.5">
                  <DRow label="Name">
                    <InlineEditField label="name" value={service.name} onSave={(v) => patch("name", v)} useSheetOnMobile />
                  </DRow>
                  <DRow label="Category">
                    <InlineEditField label="category" value={service.category ?? ""} onSave={(v) => patch("category", v)} useSheetOnMobile placeholder="e.g. plumbing" />
                  </DRow>
                  <DRow label="Description" stacked>
                    <InlineEditField label="description" type="textarea" value={service.description ?? ""} onSave={(v) => patch("description", v)} useSheetOnMobile placeholder="What this service includes…" />
                  </DRow>
                </dl>
              </SupplierCard>

              <SupplierCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Banknote className="w-4 h-4 text-slate-500" />
                  <h2 className="text-base font-semibold text-slate-900">At a glance</h2>
                </div>
                <dl className="space-y-2.5 text-sm">
                  <GRow label="Pricing model" value={PRICING_LABEL[service.pricing_model]} />
                  <GRow label="Rate" value={service.rate_pence != null ? moneyPence(service.rate_pence) : "Quote on request"} />
                  <GRow label="Call-out fee" value={service.callout_fee_pence != null ? moneyPence(service.callout_fee_pence) : "None"} />
                  <GRow label="Status" value={service.active ? "Live in catalogue" : "Hidden"} />
                </dl>
              </SupplierCard>
            </div>
          )}

          {tab === "pricing" && (
            <SupplierCard className="p-5 max-w-xl">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Pricing & settings</h2>
              <dl className="space-y-3.5">
                <DRow label="Pricing model">
                  <InlineEditField label="pricing model" type="select" options={PRICING_OPTS} value={service.pricing_model} onSave={(v) => patch("pricing_model", v)} useSheetOnMobile />
                </DRow>
                <DRow label="Rate (pence)">
                  <InlineEditField label="rate" type="number" value={service.rate_pence ?? ""} onSave={(v) => patch("rate_pence", v ? Number(v) : 0)} useSheetOnMobile />
                </DRow>
                <DRow label="Call-out fee (pence)">
                  <InlineEditField label="callout fee" type="number" value={service.callout_fee_pence ?? ""} onSave={(v) => patch("callout_fee_pence", v ? Number(v) : 0)} useSheetOnMobile />
                </DRow>
              </dl>
              <p className="mt-4 text-xs text-slate-400">Rates are stored in integer pence. Customers see formatted currency.</p>
            </SupplierCard>
          )}

          {tab === "performance" && isTeam && (
            <div className="space-y-4">
              <SupplierCard className="p-8">
                <SupplierEmptyState
                  icon={BarChart3}
                  title="Per-service performance analytics"
                  description="SLA performance, first-time-fix rate and revenue per service will populate here once you have completed jobs linked to this service. Manage the compliance documents that qualify workers for this service from the Compliance section."
                  action={
                    <Link href="/supplier/compliance" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]">
                      Manage compliance documents <ChevronRight className="w-4 h-4" />
                    </Link>
                  }
                />
              </SupplierCard>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DRow({ label, children, stacked }: { label: string; children: React.ReactNode; stacked?: boolean }) {
  return (
    <div className={stacked ? "flex flex-col gap-1.5" : "flex items-start justify-between gap-3"}>
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd className={stacked ? "" : "text-right min-w-0"}>{children}</dd>
    </div>
  )
}
function GRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
  )
}
