"use client"

import React from "react"
import Link from "next/link"
import nextDynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Receipt,
  TrendingUp,
  Plus,
  Send,
  LayoutGrid,
  Star,
  AlertTriangle,
  ShieldCheck,
  Activity,
  CheckCircle,
  FileCheck2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { InlineEditField, InlineEditSelect, InlineEditTextarea } from "@/components/editing"
import type { SupplierView } from "@/features/suppliers/useSuppliers"
import { useSupplierDocuments, useContactActivity } from "@/features/suppliers/useSupplierTabs"
import type { Job } from "@/types/database"

// OpenStreetMap (Leaflet) — client-only, premium-styled.
const LocationMap = nextDynamic(() => import("@/components/maps/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-xl bg-slate-100 animate-pulse" />,
})

const CONTACT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
]

export function validateSupplierEmail(v: string): string | null {
  if (!v.trim()) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "Enter a valid email address"
}
export function validateSupplierPhone(v: string): string | null {
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

export function OverviewTabContent({
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
                <span className="px-1.5 py-0.5 bg-[var(--brand-soft)] text-[var(--brand)] text-[10px] font-semibold rounded-full border border-[var(--color-brand-100)]">Primary</span>
              </div>
              <p className="text-[12px] text-slate-500">{supplier.trade}</p>
            </div>
          </div>
          {supplier.email && (
            <div className="flex items-center gap-2.5 mb-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`mailto:${supplier.email}`} className="text-[12.5px] text-[var(--brand)] hover:underline truncate">{supplier.email}</a>
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
            href={`/property-manager/contacts/${supplier.id}`}
            className="block w-full mt-3 py-2 border border-slate-200 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
          >
            View Contact Record
          </Link>
        </div>

        {/* Location */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Location</h3>
          {supplier.location && supplier.location !== "—" ? (
            <>
              <div className="overflow-hidden rounded-xl mb-3">
                <LocationMap
                  height={176}
                  zoom={12}
                  markers={[
                    {
                      id: supplier.id,
                      address: `${supplier.location}, UK`,
                      label: supplier.name,
                      sublabel: supplier.location,
                    },
                  ]}
                />
              </div>
              <div className="flex items-center gap-2 text-[12px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{supplier.location}</span>
              </div>
            </>
          ) : (
            <div className="h-44 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
              <MapPin className="w-6 h-6 text-slate-300" />
              <p className="text-[12px] font-medium text-slate-400">No base location set</p>
              <p className="text-[11px] text-slate-400">Add a city and postcode to the Company Profile</p>
            </div>
          )}
        </div>
      </div>

      {/* Job history (live) */}
      <JobsTabContent supplier={supplier} jobs={jobs} compact />
    </div>
  )
}

export function statusColor(status: string) {
  switch (status) {
    case "complete":
      return "bg-emerald-50 text-emerald-700 border-emerald-100"
    case "in_progress":
    case "scheduled":
      return "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]"
    case "closed":
    case "invoiced":
      return "bg-slate-100 text-slate-500 border-slate-200"
    default:
      return "bg-amber-50 text-amber-700 border-amber-100"
  }
}

export function JobsTabContent({ supplier, jobs, compact }: { supplier: SupplierView; jobs: Job[]; compact?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Job History <span className="text-slate-400 font-normal ml-1">({jobs.length})</span>
        </h3>
        <Link
          href={`/property-manager/work/jobs/new?supplierId=${supplier.id}`}
          className="flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] hover:underline"
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
            href={`/property-manager/work/jobs/new?supplierId=${supplier.id}`}
            className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"
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
                    <Link href={`/property-manager/work/jobs/${j.id}`} className="text-[13px] font-semibold text-slate-800 hover:text-[var(--brand)]">
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

export function MoneyTabContent({ supplier, jobs, mode }: { supplier: SupplierView; jobs: Job[]; mode: "quotes" | "invoices" }) {
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
            { label: "Average", value: `£${avg.toLocaleString()}`, color: "text-[var(--brand)]" },
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
            {React.createElement(titleIcon, { className: "w-4 h-4 text-[var(--brand)]" })}
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
                      <Link href={`/property-manager/work/jobs/${j.id}`} className="text-[13px] font-semibold text-slate-800 hover:text-[var(--brand)]">{j.title}</Link>
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

function docExpiryState(expiry: string | null): { label: string; cls: string } | null {
  if (!expiry) return null
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return { label: "Expired", cls: "text-red-600 bg-red-50 border-red-100" }
  if (days <= 30) return { label: `Expires in ${days}d`, cls: "text-amber-600 bg-amber-50 border-amber-100" }
  return { label: `Valid · ${new Date(expiry).toLocaleDateString("en-GB")}`, cls: "text-emerald-600 bg-emerald-50 border-emerald-100" }
}

export function DocumentsTabContent({
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
          <FileCheck2 className="w-4 h-4 text-[var(--brand)]" />
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
              <div key={d.id} className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[var(--brand)]/40 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-soft)] to-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[var(--brand)]" />
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

export function ActivityTabContent({ workspaceId, supplierId }: { workspaceId: string | undefined; supplierId: string | undefined }) {
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
              <div className="absolute -left-[18px] w-3 h-3 rounded-full bg-[var(--brand)] border-2 border-white mt-1" />
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

export function PerformanceTabContent({ jobs }: { jobs: Job[] }) {
  const total = jobs.length
  const completed = jobs.filter((j) => ["complete", "invoiced", "closed"].includes(j.status)).length
  const active = jobs.filter((j) => !["complete", "invoiced", "closed"].includes(j.status)).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const totalQuoted = jobs.reduce((s, j) => s + Number(j.quoted_amount ?? 0), 0)
  const totalInvoiced = jobs.reduce((s, j) => s + Number(j.invoiced_amount ?? 0), 0)
  const avgJobValue = total > 0 ? Math.round((jobs.reduce((s, j) => s + Number(j.approved_amount ?? j.quoted_amount ?? 0), 0)) / total) : 0

  const stats: { label: string; value: string; icon: React.ElementType; bg: string; color: string }[] = [
    { label: "Total Jobs", value: String(total), icon: LayoutGrid, bg: "bg-[var(--brand-soft)]", color: "text-[var(--brand)]" },
    { label: "Completed", value: String(completed), icon: CheckCircle, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Active", value: String(active), icon: Briefcase, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Total Quoted", value: `£${totalQuoted.toLocaleString()}`, icon: FileText, bg: "bg-violet-50", color: "text-violet-600" },
    { label: "Total Invoiced", value: `£${totalInvoiced.toLocaleString()}`, icon: Receipt, bg: "bg-[var(--brand-soft)]", color: "text-[var(--brand)]" },
    { label: "Avg Job Value", value: total > 0 ? `£${avgJobValue.toLocaleString()}` : "—", icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
  ]

  // SVG gauge geometry (r=30 → circumference ≈ 188.5)
  const circ = 2 * Math.PI * 30
  const gaugeColor = completionRate >= 80 ? "#10B981" : completionRate >= 50 ? "#F59E0B" : "#EF4444"

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[var(--brand)]" />
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

export function QuickActionsCard({ supplierId }: { supplierId: string }) {
  const router = useRouter()
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => router.push(`/property-manager/work/jobs/new?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">New Job</span>
        </button>
        <button
          onClick={() => router.push(`/property-manager/work/tasks/new?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">New Task</span>
        </button>
        <button
          onClick={() => router.push(`/property-manager/work/jobs?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">View Jobs</span>
        </button>
        <Link
          href={`/property-manager/contacts/${supplierId}`}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Star className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">Contact</span>
        </Link>
      </div>
    </div>
  )
}

/**
 * Live compliance summary — reads the supplier's compliance documents and
 * surfaces real verified / expiring / expired counts. Replaces the previous
 * hard-coded stub card (which had a dead "Upload New Certificate" button).
 * The action routes to the Compliance tab where documents are managed.
 */
export function ComplianceSummaryCard({
  workspaceId,
  supplierId,
  onViewCompliance,
}: {
  workspaceId: string | undefined
  supplierId: string | undefined
  onViewCompliance: () => void
}) {
  const { data: docs = [], isLoading } = useSupplierDocuments(workspaceId, supplierId)
  const compliance = docs.filter((d) =>
    /insurance|certificate|registration|gas|electrical|compliance|dbs|liability|qualification/i.test(`${d.doc_type} ${d.name}`)
  )
  const verified = compliance.filter((d) => d.is_verified).length
  const expired = compliance.filter((d) => d.expiry_date && new Date(d.expiry_date).getTime() < Date.now()).length
  const expiringSoon = compliance.filter((d) => {
    if (!d.expiry_date) return false
    const days = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / 86_400_000)
    return days >= 0 && days <= 30
  }).length

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--brand)]" />
          <h3 className="text-sm font-semibold text-slate-900">Compliance Certificates</h3>
        </div>
        <button onClick={onViewCompliance} className="text-[12px] text-[var(--brand)] hover:underline">View all</button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-9 rounded-lg bg-slate-100 animate-pulse" />)}
        </div>
      ) : compliance.length === 0 ? (
        <p className="text-[12px] text-slate-400 mb-3">
          No compliance certificates on file yet. Upload insurance, registrations and safety documents from the Compliance tab to track this supplier&apos;s status.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-1">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-600 tabular-nums leading-none">{verified}</p>
            <p className="text-[10px] font-medium text-emerald-700 mt-1">Verified</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-2.5 text-center">
            <p className="text-lg font-bold text-amber-600 tabular-nums leading-none">{expiringSoon}</p>
            <p className="text-[10px] font-medium text-amber-700 mt-1">Due soon</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-2.5 text-center">
            <p className="text-lg font-bold text-red-600 tabular-nums leading-none">{expired}</p>
            <p className="text-[10px] font-medium text-red-700 mt-1">Expired</p>
          </div>
        </div>
      )}

      <button
        onClick={onViewCompliance}
        className="w-full mt-2 py-2 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
      >
        <FileCheck2 className="w-3.5 h-3.5" /> Manage compliance documents
      </button>
    </div>
  )
}
