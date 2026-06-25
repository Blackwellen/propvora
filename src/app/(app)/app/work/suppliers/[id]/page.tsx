"use client"

import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Briefcase,
  Clock,
  ExternalLink,
  Plus,
  Send,
  LayoutGrid,
  Star,
  Receipt,
  TrendingUp,
  Pencil,
  Ban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { MobileTopBar, MobileTabs } from "@/components/mobile"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useUpdateContact } from "@/hooks/useContacts"
import { useSupplierJobs } from "@/hooks/useJobs"
import { useSupplier } from "@/features/suppliers/useSuppliers"
import { SupplierRatingPanel } from "@/components/suppliers/SupplierRatingPanel"
import { SupplierPreferencePanel } from "@/components/suppliers/SupplierPreferencePanel"
import { useSupplierPreference } from "@/lib/suppliers/ratings"
import { useTabParam } from "@/features/work/useTabParam"
import type { UpdateContact } from "@/types/database"
import {
  OverviewTabContent,
  JobsTabContent,
  MoneyTabContent,
  DocumentsTabContent,
  ActivityTabContent,
  PerformanceTabContent,
  QuickActionsCard,
  ComplianceSummaryCard,
} from "@/features/work/suppliers/SupplierDetailTabs"

const DETAIL_TABS = [
  "Overview",
  "Jobs",
  "Quotes",
  "Invoices",
  "Compliance",
  "Documents",
  "Performance",
  "Activity",
] as const

type DetailTab = (typeof DETAIL_TABS)[number]

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const [activeTab, setActiveTab] = useTabParam<DetailTab>(DETAIL_TABS, "Overview")

  const { supplier, isSeed, loading } = useSupplier(workspaceId, id)
  const { data: jobs = [] } = useSupplierJobs(workspaceId, isSeed ? undefined : id)
  const { data: preference } = useSupplierPreference(workspaceId, isSeed ? undefined : id, !isSeed)
  const updateContact = useUpdateContact()

  async function handleSaveField(
    field: "full_name" | "company_name" | "city" | "postcode" | "notes" | "email" | "phone" | "status",
    val: string
  ) {
    if (!workspaceId || isSeed) return
    // full_name & status are non-nullable columns; everything else may be cleared to null.
    const nonNullable = field === "status" || field === "full_name"
    const trimmed = val.trim()
    if (field === "full_name" && trimmed === "") return // don't allow blanking the name
    const value = nonNullable ? val : trimmed === "" ? null : val
    await updateContact.mutateAsync({ id, workspaceId, payload: { [field]: value } as UpdateContact })
  }

  // Supplier "type"/trade is stored as a tag (the first non-system tag). Saving it
  // replaces that tag while preserving system tags like "preferred"/"portal_access".
  async function handleSaveTrade(val: string) {
    if (!supplier || !workspaceId || isSeed) return
    const preserved = supplier.tags.filter((t) => t === "preferred" || t === "portal_access")
    const trade = val.trim().toLowerCase()
    const nextTags = trade ? [...preserved, trade] : preserved
    await updateContact.mutateAsync({ id, workspaceId, payload: { tags: nextTags } })
  }

  function togglePreferred() {
    if (!supplier || supplier.isSeed || !workspaceId) return
    const nextTags = supplier.preferred
      ? supplier.tags.filter((t) => t !== "preferred")
      : [...supplier.tags, "preferred"]
    updateContact.mutate({ id, workspaceId, payload: { tags: nextTags } })
  }

  if (loading && !supplier) {
    return (
      <div className="space-y-5">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-32 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="space-y-5">
        <Link href="/property-manager/work/suppliers/preferred" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />Back to Suppliers
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <p className="text-base font-semibold text-slate-900 mb-1">Supplier not found</p>
          <p className="text-sm text-slate-500">This supplier may have been removed.</p>
        </div>
      </div>
    )
  }

  const KPI_ITEMS = [
    { label: "Active Jobs", value: String(jobs.filter((j) => !["complete", "closed", "invoiced"].includes(j.status)).length), icon: Briefcase, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Total Jobs", value: String(jobs.length), icon: LayoutGrid, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Invoiced", value: `£${jobs.reduce((sum, j) => sum + (j.invoiced_amount ?? 0), 0).toLocaleString()}`, icon: Receipt, bg: "bg-violet-50", color: "text-violet-600" },
    // No live telemetry source for these yet — show honest "—" rather than fabricated metrics.
    { label: "Avg Response", value: "—", icon: Clock, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "SLA Performance", value: "—", icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Compliance", value: "—", icon: ShieldCheck, bg: "bg-blue-50", color: "text-blue-600" },
  ]

  return (
    <div className="space-y-5">
      {/* Mobile top bar */}
      <MobileTopBar
        title={supplier.name}
        subtitle={supplier.trade}
        showBack
        backHref="/property-manager/work/suppliers/preferred"
        primaryAction={{ label: "New job", icon: Plus, onClick: () => router.push(`/property-manager/work/jobs/new?supplierId=${id}`) }}
        overflowActions={[
          { label: "View contact", icon: Pencil, href: `/property-manager/contacts/${id}` },
          { label: "New task", icon: Send, onClick: () => router.push(`/property-manager/work/tasks/new?supplierId=${id}`) },
          { label: supplier.preferred ? "Remove from Preferred" : "Mark Preferred", icon: Star, onClick: togglePreferred },
          { label: "View all jobs", icon: LayoutGrid, onClick: () => router.push(`/property-manager/work/jobs?supplierId=${id}`) },
        ]}
      />

      <Link href="/property-manager/work/suppliers/preferred" className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" />Back to Suppliers
      </Link>

      <div className="hidden md:block">
      <PageHeader
        title={supplier.name}
        description="Supplier profile, performance, and relationship management"
        actions={
          <>
            <Link
              href={`/property-manager/contacts/${id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />View Contact
            </Link>
            <button
              onClick={() => router.push(`/property-manager/work/tasks/new?supplierId=${id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Send className="w-4 h-4" />New Task
            </button>
            <button
              onClick={() => router.push(`/property-manager/work/jobs/new?supplierId=${id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors"
            >
              <Plus className="w-4 h-4" />New Job
            </button>
            <ActionMenu
              items={[
                { label: supplier.preferred ? "Remove from Preferred" : "Mark Preferred", icon: Star, onClick: togglePreferred, disabled: supplier.isSeed },
                { label: "View Contact Record", icon: ExternalLink, onClick: () => router.push(`/property-manager/contacts/${id}`) },
                { label: "View All Jobs", icon: LayoutGrid, onClick: () => router.push(`/property-manager/work/jobs?supplierId=${id}`) },
              ]}
            />
          </>
        }
      />
      </div>

      {/* Hero */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5 flex-wrap">
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 relative", supplier.avatarBg)}>
            {supplier.initials}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{supplier.name}</h1>
              {(preference?.preferred || supplier.preferred) && !preference?.blocked && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-semibold text-amber-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Preferred
                </span>
              )}
              {preference?.blocked && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-[11px] font-semibold text-red-700">
                  <Ban className="w-3.5 h-3.5" /> Blocked
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Supplier
              </span>
              {isSeed && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold">Demo data</span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-3">{supplier.category}</p>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-medium">{supplier.trade}</span>
              {supplier.tags
                .filter((t) => t !== "preferred")
                .map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-medium capitalize">{t}</span>
                ))}
            </div>
            <div className="flex items-center gap-6 flex-wrap text-sm text-slate-600">
              {supplier.email && <span className="flex items-center gap-1.5 text-[12.5px]"><Mail className="w-3.5 h-3.5 text-slate-400" />{supplier.email}</span>}
              {supplier.phone && <span className="flex items-center gap-1.5 text-[12.5px]"><Phone className="w-3.5 h-3.5 text-slate-400" />{supplier.phone}</span>}
              <span className="flex items-center gap-1.5 text-[12.5px]"><MapPin className="w-3.5 h-3.5 text-slate-400" />{supplier.location}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 text-right">
            <div>
              <p className="text-[10px] text-slate-400 mb-0.5">Status</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700 capitalize">
                <CheckCircle2 className="w-3 h-3" />{supplier.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip (live job-derived) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_ITEMS.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", kpi.bg)}>
                <Icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 truncate">{kpi.value}</p>
                <p className="text-[11px] font-medium text-slate-600">{kpi.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="md:hidden">
        <MobileTabs
          tabs={DETAIL_TABS.map((t) => ({ id: t, label: t }))}
          value={activeTab}
          onChange={(id) => setActiveTab(id as DetailTab)}
          aria-label="Supplier sections"
        />
      </div>
      <div className="hidden md:block border-b border-slate-200 bg-white rounded-t-xl">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                activeTab === tab ? "border-[#2563EB] text-[#2563EB] font-semibold" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5 items-start flex-col lg:flex-row">
        <div className="flex-1 min-w-0 w-full">
          {activeTab === "Overview" ? (
            <OverviewTabContent supplier={supplier} jobs={jobs} onSaveField={handleSaveField} onSaveTrade={handleSaveTrade} />
          ) : activeTab === "Jobs" ? (
            <JobsTabContent supplier={supplier} jobs={jobs} />
          ) : activeTab === "Quotes" ? (
            <MoneyTabContent supplier={supplier} jobs={jobs} mode="quotes" />
          ) : activeTab === "Invoices" ? (
            <MoneyTabContent supplier={supplier} jobs={jobs} mode="invoices" />
          ) : activeTab === "Compliance" ? (
            <DocumentsTabContent workspaceId={workspaceId} supplierId={supplier.isSeed ? undefined : id} complianceOnly />
          ) : activeTab === "Documents" ? (
            <DocumentsTabContent workspaceId={workspaceId} supplierId={supplier.isSeed ? undefined : id} />
          ) : activeTab === "Performance" ? (
            <PerformanceTabContent jobs={jobs} />
          ) : (
            <ActivityTabContent workspaceId={workspaceId} supplierId={supplier.isSeed ? undefined : id} />
          )}
        </div>
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <SupplierRatingPanel
            workspaceId={workspaceId}
            supplierContactId={supplier.isSeed ? undefined : id}
            disabled={supplier.isSeed}
          />
          <SupplierPreferencePanel
            workspaceId={workspaceId}
            supplierContactId={supplier.isSeed ? undefined : id}
            disabled={supplier.isSeed}
          />
          <QuickActionsCard supplierId={id} />
          <ComplianceSummaryCard
            workspaceId={workspaceId}
            supplierId={supplier.isSeed ? undefined : id}
            onViewCompliance={() => setActiveTab("Compliance")}
          />
        </div>
      </div>
    </div>
  )
}
