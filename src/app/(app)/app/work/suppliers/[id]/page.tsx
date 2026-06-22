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
import { MobileTopBar, MobileTabs } from "@/components/mobile"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { InlineEditField, InlineEditSelect, InlineEditTextarea } from "@/components/editing"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useUpdateContact } from "@/hooks/useContacts"
import { useSupplierJobs } from "@/hooks/useJobs"
import { useSupplier, type SupplierView } from "@/features/suppliers/useSuppliers"
import { SupplierRatingPanel } from "@/components/suppliers/SupplierRatingPanel"
import { SupplierPreferencePanel } from "@/components/suppliers/SupplierPreferencePanel"
import { useSupplierPreference } from "@/lib/suppliers/ratings"
import { useSupplierDocuments, useContactActivity } from "@/features/suppliers/useSupplierTabs"
import { Ban, Activity, CheckCircle, FileCheck2 } from "lucide-react"
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

function validateSupplierEmail(v: string): string | null {
  if (!v.trim()) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "Enter a valid email address"
}
function validateSupplierPhone(v: string): string | null {
  if (!v.trim()) return null
  return /^[+]?[\d\s()-]{7,}$/.test(v.trim()) ? null : "Enter a valid phone number"
}

function EditableRow({
  label,
  value,
  onSave,
  type = "text",
  options,
  disabled,
  placeholder = "—",
  validate,
}: {
  label: string
  value: string | null
  onSave: (val: string) => Promise<void>
  type?: "text" | "textarea" | "select" | "email" | "phone"
  options?: { value: string; label: string }[]
  disabled?: boolean
  placeholder?: string
  validate?: (val: string) => string | null
}) {
  const readOnlyReason = disabled ? "This supplier record is read-only." : undefined
  const common = {
    value,
    label,
    placeholder,
    readOnly: disabled,
    readOnlyReason,
    onSave,
  }
  return (
    <div className="flex gap-3 mb-2.5 items-start">
      <span className="text-[11px] text-slate-400 w-32 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">
        {type === "textarea" ? (
          <InlineEditTextarea {...common} />
        ) : type === "select" ? (
          <InlineEditSelect {...common} options={options} />
        ) : (
          <InlineEditField {...common} type={type} validate={validate} />
        )}
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
          <EditableRow label="Email" value={supplier.email} onSave={(v) => onSaveField("email", v)} type="email" validate={validateSupplierEmail} disabled={!editable} />
          <EditableRow label="Phone" value={supplier.phone} onSave={(v) => onSaveField("phone", v)} type="phone" validate={validateSupplierPhone} disabled={!editable} />
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

// ─── Quotes / Invoices tab — derived from the supplier's live jobs ────────────

function MoneyTabContent({ supplier, jobs, mode }: { supplier: SupplierView; jobs: Job[]; mode: "quotes" | "invoices" }) {
  const rows = mode === "quotes"
    ? jobs.filter((j) => j.quoted_amount != null || j.approved_amount != null)
    : jobs.filter((j) => j.invoiced_amount != null && Number(j.invoiced_amount) > 0)

  const total = rows.reduce((s, j) => {
    const v = mode === "quotes" ? (j.approved_amount ?? j.quoted_amount ?? 0) : (j.invoiced_amount ?? 0)
    return s + Number(v)
  }, 0)

  const title = mode === "quotes" ? "Quotes" : "Invoices"
  const emptyCopy = mode === "quotes"
    ? "No quotes recorded against this supplier's jobs yet."
    : "No invoices recorded against this supplier's jobs yet."
  const avg = rows.length > 0 ? Math.round(total / rows.length) : 0
  const titleIcon = mode === "quotes" ? FileText : Receipt

  return (
    <div className="space-y-4">
      {/* Mini KPI strip — live, derived from the supplier's jobs */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: title, value: String(rows.length), color: "text-slate-900" },
            { label: "Total Value", value: `£${total.toLocaleString()}`, color: "text-emerald-600" },
            { label: "Average", value: `£${avg.toLocaleString()}`, color: "text-[#2563EB]" },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-medium text-slate-500">{k.label}</p>
              <p className={cn("text-xl font-bold tabular-nums mt-1", k.color)}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(titleIcon, { className: "w-4 h-4 text-[#2563EB]" })}
            <h3 className="text-sm font-semibold text-slate-900">
              {title} <span className="text-slate-400 font-normal ml-1">({rows.length})</span>
            </h3>
          </div>
          {rows.length > 0 && (
            <span className="text-[12px] font-semibold text-slate-700 tabular-nums">Total £{total.toLocaleString()}</span>
          )}
        </div>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Receipt className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No {title.toLowerCase()} yet</p>
          <p className="text-[12.5px] text-slate-500">{emptyCopy}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Job</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => {
                const amount = mode === "quotes" ? (j.approved_amount ?? j.quoted_amount ?? 0) : (j.invoiced_amount ?? 0)
                return (
                  <tr key={j.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/work/jobs/${j.id}`} className="text-[13px] font-semibold text-slate-800 hover:text-[#2563EB]">{j.title}</Link>
                      {j.reference && <p className="text-[11px] text-slate-400">{j.reference}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", statusColor(j.status))}>{j.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[12px] text-slate-600">
                      {j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-slate-800 tabular-nums">£{Number(amount).toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  )
}

// ─── Documents / Compliance tab — live supplier_documents ─────────────────────

function docExpiryState(expiry: string | null): { label: string; cls: string } | null {
  if (!expiry) return null
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return { label: "Expired", cls: "text-red-600 bg-red-50 border-red-100" }
  if (days <= 30) return { label: `Expires in ${days}d`, cls: "text-amber-600 bg-amber-50 border-amber-100" }
  return { label: `Valid · ${new Date(expiry).toLocaleDateString("en-GB")}`, cls: "text-emerald-600 bg-emerald-50 border-emerald-100" }
}

function DocumentsTabContent({
  workspaceId,
  supplierId,
  complianceOnly,
}: {
  workspaceId: string | undefined
  supplierId: string | undefined
  complianceOnly?: boolean
}) {
  const { data: docs = [], isLoading } = useSupplierDocuments(workspaceId, supplierId)
  const filtered = complianceOnly
    ? docs.filter((d) => /insurance|certificate|registration|gas|electrical|compliance|dbs|liability|qualification/i.test(`${d.doc_type} ${d.name}`))
    : docs
  const title = complianceOnly ? "Compliance Documents" : "Documents"

  // Live status counts for the mini strip.
  const verifiedCount = filtered.filter((d) => d.is_verified).length
  const expiredCount = filtered.filter((d) => d.expiry_date && new Date(d.expiry_date).getTime() < Date.now()).length

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-semibold text-slate-900">
            {title} <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h3>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> {verifiedCount} verified
            </span>
            {expiredCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> {expiredCount} expired
              </span>
            )}
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-[88px] rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <FileCheck2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No {title.toLowerCase()} on file</p>
          <p className="text-[12.5px] text-slate-500">Verified certificates and documents for this supplier will appear here.</p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((d) => {
            const exp = docExpiryState(d.expiry_date)
            return (
              <div key={d.id} className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#2563EB]/40 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{d.name}</p>
                    {d.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 capitalize mt-0.5">{d.doc_type.replace(/_/g, " ")}</p>
                  {d.notes && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{d.notes}</p>}
                  {exp && (
                    <span className={cn("inline-flex mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border", exp.cls)}>{exp.label}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Activity tab — live contact_activity for this supplier contact ───────────

function ActivityTabContent({ workspaceId, supplierId }: { workspaceId: string | undefined; supplierId: string | undefined }) {
  const { data: events = [], isLoading } = useContactActivity(workspaceId, supplierId)
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
      </div>
      {isLoading ? (
        <div className="p-5 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No activity yet</p>
          <p className="text-[12.5px] text-slate-500">Logged actions and notes for this supplier will appear here.</p>
        </div>
      ) : (
        <div className="relative px-5 py-4 pl-8 before:absolute before:left-[22px] before:top-5 before:bottom-5 before:w-0.5 before:bg-slate-100">
          {events.map((ev) => (
            <div key={ev.id} className="relative mb-4 last:mb-0">
              <div className="absolute -left-[18px] w-3 h-3 rounded-full bg-[#2563EB] border-2 border-white mt-1" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">{ev.title}</p>
                  {ev.description && <p className="text-[12px] text-slate-600 mt-0.5">{ev.description}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{ev.activity_type.replace(/_/g, " ")}</p>
                </div>
                <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                  {new Date(ev.created_at).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Performance tab — live job-derived supplier metrics ──────────────────────

function PerformanceTabContent({ jobs }: { jobs: Job[] }) {
  const total = jobs.length
  const completed = jobs.filter((j) => ["complete", "invoiced", "closed"].includes(j.status)).length
  const active = jobs.filter((j) => !["complete", "invoiced", "closed"].includes(j.status)).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const totalQuoted = jobs.reduce((s, j) => s + Number(j.quoted_amount ?? 0), 0)
  const totalInvoiced = jobs.reduce((s, j) => s + Number(j.invoiced_amount ?? 0), 0)
  const avgJobValue = total > 0 ? Math.round((jobs.reduce((s, j) => s + Number(j.approved_amount ?? j.quoted_amount ?? 0), 0)) / total) : 0

  const stats: { label: string; value: string; icon: React.ElementType; bg: string; color: string }[] = [
    { label: "Total Jobs", value: String(total), icon: LayoutGrid, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Completed", value: String(completed), icon: CheckCircle, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Active", value: String(active), icon: Briefcase, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Total Quoted", value: `£${totalQuoted.toLocaleString()}`, icon: FileText, bg: "bg-violet-50", color: "text-violet-600" },
    { label: "Total Invoiced", value: `£${totalInvoiced.toLocaleString()}`, icon: Receipt, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Avg Job Value", value: total > 0 ? `£${avgJobValue.toLocaleString()}` : "—", icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
  ]

  // SVG gauge geometry (r=30 → circumference ≈ 188.5)
  const circ = 2 * Math.PI * 30
  const gaugeColor = completionRate >= 80 ? "#10B981" : completionRate >= 50 ? "#F59E0B" : "#EF4444"

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#2563EB]" />
        <h3 className="text-sm font-semibold text-slate-900">Performance Summary</h3>
      </div>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No performance data yet</p>
          <p className="text-[12.5px] text-slate-500">Assign jobs to this supplier to build a performance picture.</p>
        </div>
      ) : (
        <>
          {/* Gauge + completion summary */}
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="relative w-[120px] h-[120px] shrink-0">
              <svg className="w-[120px] h-[120px] -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                <circle
                  cx="36" cy="36" r="30" fill="none"
                  stroke={gaugeColor} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${(completionRate / 100) * circ} ${circ}`}
                  className="transition-all duration-700 motion-reduce:transition-none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[26px] font-bold text-slate-900 tabular-nums leading-none">{completionRate}%</span>
                <span className="text-[10px] font-medium text-slate-400 mt-1">complete</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3 w-full">
              {[
                { label: "Completed", value: String(completed), color: "text-emerald-600" },
                { label: "Active", value: String(active), color: "text-amber-600" },
                { label: "Total", value: String(total), color: "text-slate-900" },
              ].map((m) => (
                <div key={m.label} className="text-center sm:text-left">
                  <p className={cn("text-[22px] font-bold tabular-nums leading-tight", m.color)}>{m.value}</p>
                  <p className="text-[11px] font-medium text-slate-500">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-xl border border-slate-100 bg-white p-3.5 flex items-start gap-3 hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                    <Icon className={cn("w-4.5 h-4.5", s.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[18px] font-bold text-slate-900 tabular-nums leading-tight truncate">{s.value}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-4">Derived from this supplier&apos;s live job records.</p>
        </>
      )}
    </div>
  )
}

// ─── Right rail cards ─────────────────────────────────────────────────────────

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
        backHref="/app/work/suppliers/preferred"
        primaryAction={{ label: "New job", icon: Plus, onClick: () => router.push(`/app/work/jobs/new?supplierId=${id}`) }}
        overflowActions={[
          { label: "View contact", icon: Pencil, href: `/app/contacts/${id}` },
          { label: "New task", icon: Send, onClick: () => router.push(`/app/work/tasks/new?supplierId=${id}`) },
          { label: supplier.preferred ? "Remove from Preferred" : "Mark Preferred", icon: Star, onClick: togglePreferred },
          { label: "View all jobs", icon: LayoutGrid, onClick: () => router.push(`/app/work/jobs?supplierId=${id}`) },
        ]}
      />

      <Link href="/app/work/suppliers/preferred" className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" />Back to Suppliers
      </Link>

      <div className="hidden md:block">
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
          <ComplianceCertificatesCard />
        </div>
      </div>
    </div>
  )
}
