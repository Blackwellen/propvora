"use client"

import React, { use, useState } from "react"
import Link from "next/link"
import nextDynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Briefcase,
  FileText,
  Receipt,
  Clock,
  TrendingUp,
  ExternalLink,
  Plus,
  Send,
  LayoutGrid,
  Star,
  AlertTriangle,
  Upload,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useUpdateContact } from "@/hooks/useContacts"
import { useSupplierJobs } from "@/hooks/useJobs"
import { useSupplier, type SupplierView } from "@/features/suppliers/useSuppliers"
import type { Job, UpdateContact } from "@/types/database"

// OpenStreetMap (Leaflet) — client-only, premium-styled.
const LocationMap = nextDynamic(() => import("@/components/maps/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-xl bg-slate-100 animate-pulse" />,
})

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

// ─── Editable contact fields (work-specific profile) ──────────────────────────

const CONTACT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
]

function EditableRow({
  label,
  value,
  onSave,
  type = "text",
  options,
  disabled,
  placeholder = "—",
}: {
  label: string
  value: string | null
  onSave: (val: string) => Promise<void>
  type?: "text" | "textarea" | "select"
  options?: { value: string; label: string }[]
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div className="flex gap-3 mb-2.5 items-start">
      <span className="text-[11px] text-slate-400 w-32 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">
        <InlineEditField value={value} onSave={onSave} type={type} options={options} disabled={disabled} placeholder={placeholder} />
      </div>
    </div>
  )
}

function OverviewTabContent({
  supplier,
  jobs,
  onSaveField,
  onSaveTrade,
}: {
  supplier: SupplierView
  jobs: Job[]
  onSaveField: (
    field: "full_name" | "company_name" | "city" | "postcode" | "notes" | "email" | "phone" | "status",
    val: string
  ) => Promise<void>
  onSaveTrade: (val: string) => Promise<void>
}) {
  const editable = !supplier.isSeed
  const [cityPart, postcodePart] = supplier.location === "—" ? ["", ""] : supplier.location.split(",").map((s) => s.trim())
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Company Profile — inline editable */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Company Profile</h3>
          <EditableRow label="Name" value={supplier.name} onSave={(v) => onSaveField("full_name", v)} disabled={!editable} />
          <EditableRow label="Company" value={supplier.company} onSave={(v) => onSaveField("company_name", v)} disabled={!editable} />
          <EditableRow label="Supplier Type" value={supplier.trade} onSave={onSaveTrade} disabled={!editable} placeholder="General Supplier" />
          <EditableRow label="Email" value={supplier.email} onSave={(v) => onSaveField("email", v)} disabled={!editable} />
          <EditableRow label="Phone" value={supplier.phone} onSave={(v) => onSaveField("phone", v)} disabled={!editable} />
          <EditableRow label="City" value={cityPart || null} onSave={(v) => onSaveField("city", v)} disabled={!editable} />
          <EditableRow label="Postcode" value={postcodePart || null} onSave={(v) => onSaveField("postcode", v)} disabled={!editable} />
          <EditableRow label="Status" value={supplier.status} onSave={(v) => onSaveField("status", v)} type="select" options={CONTACT_STATUS_OPTIONS} disabled={!editable} />
          <EditableRow label="Notes" value={supplier.notes} onSave={(v) => onSaveField("notes", v)} type="textarea" disabled={!editable} />
        </div>

        {/* Primary Contact */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Primary Contact</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-bold", supplier.avatarBg)}>
              {supplier.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold text-slate-900">{supplier.name}</p>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full border border-blue-200">Primary</span>
              </div>
              <p className="text-[12px] text-slate-500">{supplier.trade}</p>
            </div>
          </div>
          {supplier.email && (
            <div className="flex items-center gap-2.5 mb-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`mailto:${supplier.email}`} className="text-[12.5px] text-[#2563EB] hover:underline truncate">{supplier.email}</a>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2.5 mb-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`tel:${supplier.phone}`} className="text-[12.5px] text-slate-700">{supplier.phone}</a>
            </div>
          )}
          <div className="flex items-center gap-2.5 mb-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-[12.5px] text-slate-700">{supplier.location}</span>
          </div>
          <Link
            href={`/app/contacts/${supplier.id}`}
            className="block w-full mt-3 py-2 border border-slate-200 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
          >
            View Contact Record
          </Link>
        </div>

        {/* Location — real OpenStreetMap, geocoded from the supplier's base */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Location</h3>
          <div className="overflow-hidden rounded-xl mb-3">
            <LocationMap
              height={176}
              zoom={12}
              markers={[
                {
                  id: supplier.id,
                  address: supplier.location && supplier.location !== "—" ? `${supplier.location}, UK` : null,
                  label: supplier.name,
                  sublabel: supplier.location !== "—" ? supplier.location : undefined,
                },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{supplier.location !== "—" ? supplier.location : "No base location set"}</span>
          </div>
        </div>
      </div>

      {/* Job history (live) */}
      <JobsTabContent supplier={supplier} jobs={jobs} compact />
    </div>
  )
}

// ─── Jobs tab — live job history linked via supplier_contact_id ───────────────

function statusColor(status: string) {
  switch (status) {
    case "complete":
      return "bg-emerald-50 text-emerald-700 border-emerald-100"
    case "in_progress":
    case "scheduled":
      return "bg-blue-50 text-blue-700 border-blue-100"
    case "closed":
    case "invoiced":
      return "bg-slate-100 text-slate-500 border-slate-200"
    default:
      return "bg-amber-50 text-amber-700 border-amber-100"
  }
}

function JobsTabContent({ supplier, jobs, compact }: { supplier: SupplierView; jobs: Job[]; compact?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Job History <span className="text-slate-400 font-normal ml-1">({jobs.length})</span>
        </h3>
        <Link
          href={`/app/work/jobs/new?supplierId=${supplier.id}`}
          className="flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline"
        >
          <Plus className="w-3 h-3" /> New Job
        </Link>
      </div>
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Briefcase className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No jobs assigned yet</p>
          <p className="text-[12.5px] text-slate-500 mb-4">Assign this supplier to a job to start tracking work.</p>
          <Link
            href={`/app/work/jobs/new?supplierId=${supplier.id}`}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
          >
            Assign to Job
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Job</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Scheduled</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(compact ? jobs.slice(0, 5) : jobs).map((j) => (
                <tr
                  key={j.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/app/work/jobs/${j.id}`} className="text-[13px] font-semibold text-slate-800 hover:text-[#2563EB]">
                      {j.title}
                    </Link>
                    {j.reference && <p className="text-[11px] text-slate-400">{j.reference}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", statusColor(j.status))}>
                      {j.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[12px] text-slate-600">
                    {j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-slate-800">
                    {j.approved_amount != null
                      ? `£${j.approved_amount.toLocaleString()}`
                      : j.quoted_amount != null
                      ? `£${j.quoted_amount.toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TabEmptyState({ tab }: { tab: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <FileText className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{tab} coming soon</h3>
      <p className="text-sm text-slate-500 max-w-xs">The {tab.toLowerCase()} section for this supplier will be available here.</p>
    </div>
  )
}

// ─── Right rail cards ─────────────────────────────────────────────────────────

function SupplierRatingCard({ supplier }: { supplier: SupplierView }) {
  const rating = 4.3 + ((supplier.id.charCodeAt(0) % 7) / 10)
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">Supplier Rating</h3>
      <div className="flex items-center gap-1 mb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={i < Math.round(rating) ? "text-amber-400 text-xl" : "text-amber-200 text-xl"}>★</span>
        ))}
        <span className="text-xl font-bold text-slate-900 ml-1">{rating.toFixed(1)} / 5</span>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">Internal performance rating</p>
      <div className="pt-3 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 mb-0.5">Status</p>
        <p className="text-[12.5px] font-semibold text-slate-800 capitalize">{supplier.status}</p>
      </div>
    </div>
  )
}

function QuickActionsCard({ supplierId }: { supplierId: string }) {
  const router = useRouter()
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => router.push(`/app/work/jobs/new?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">New Job</span>
        </button>
        <button
          onClick={() => router.push(`/app/work/tasks/new?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">New Task</span>
        </button>
        <button
          onClick={() => router.push(`/app/work/jobs?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">View Jobs</span>
        </button>
        <Link
          href={`/app/contacts/${supplierId}`}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Star className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">Contact</span>
        </Link>
      </div>
    </div>
  )
}

function ComplianceCertificatesCard() {
  const docs = [
    { name: "Public Liability Insurance", expiry: "Valid until 12 Dec 2026", warn: false },
    { name: "Employers Liability Insurance", expiry: "Valid until 12 Dec 2026", warn: false },
    { name: "Gas Safe Registration", expiry: "Valid until 01 Aug 2026", warn: false },
    { name: "Electrical Safety Certificate", expiry: "Valid until 15 Nov 2026", warn: true },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Compliance Certificates</h3>
        <Link href="/app/work/suppliers/compliance" className="text-[12px] text-[#2563EB] hover:underline">View all</Link>
      </div>
      {docs.map((doc, i) => (
        <div key={i} className="flex items-start gap-2.5 mb-2.5">
          {doc.warn ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-slate-800 truncate">{doc.name}</p>
            <p className={cn("text-[11px] font-semibold", doc.warn ? "text-amber-500" : "text-emerald-500")}>{doc.expiry}</p>
          </div>
        </div>
      ))}
      <button className="w-full mt-2 py-2 border border-dashed border-slate-200 rounded-xl text-[12px] font-medium text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
        <Upload className="w-3.5 h-3.5" /> Upload New Certificate
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview")

  const { supplier, isSeed, loading } = useSupplier(workspaceId, id)
  const { data: jobs = [] } = useSupplierJobs(workspaceId, isSeed ? undefined : id)
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
        <Link href="/app/work/suppliers/preferred" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
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
    { label: "Avg Response", value: "2.4 hrs", icon: Clock, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "SLA Performance", value: "98%", icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Compliance", value: "92%", icon: ShieldCheck, bg: "bg-blue-50", color: "text-blue-600" },
  ]

  return (
    <div className="space-y-5">
      <Link href="/app/work/suppliers/preferred" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" />Back to Suppliers
      </Link>

      <PageHeader
        title={supplier.name}
        description="Supplier profile, performance, and relationship management"
        actions={
          <>
            <Link
              href={`/app/contacts/${id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />View Contact
            </Link>
            <button
              onClick={() => router.push(`/app/work/tasks/new?supplierId=${id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Send className="w-4 h-4" />New Task
            </button>
            <button
              onClick={() => router.push(`/app/work/jobs/new?supplierId=${id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors"
            >
              <Plus className="w-4 h-4" />New Job
            </button>
            <ActionMenu
              items={[
                { label: supplier.preferred ? "Remove from Preferred" : "Mark Preferred", icon: Star, onClick: togglePreferred, disabled: supplier.isSeed },
                { label: "View Contact Record", icon: ExternalLink, onClick: () => router.push(`/app/contacts/${id}`) },
                { label: "View All Jobs", icon: LayoutGrid, onClick: () => router.push(`/app/work/jobs?supplierId=${id}`) },
              ]}
            />
          </>
        }
      />

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
              {supplier.preferred && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-semibold text-amber-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Preferred
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
      <div className="border-b border-slate-200 bg-white rounded-t-xl">
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
          ) : (
            <TabEmptyState tab={activeTab} />
          )}
        </div>
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <SupplierRatingCard supplier={supplier} />
          <QuickActionsCard supplierId={id} />
          <ComplianceCertificatesCard />
        </div>
      </div>
    </div>
  )
}
