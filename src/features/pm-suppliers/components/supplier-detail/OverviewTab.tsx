"use client"

import React from "react"
import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import nextDynamic from "next/dynamic"
import { InlineEditField, InlineEditSelect, InlineEditTextarea } from "@/components/editing"
import type { SupplierView } from "@/features/suppliers/useSuppliers"
import { JobsTab } from "./JobsTab"
import type { Job } from "@/types/database"

// ─── Lazy map (client-only) ───────────────────────────────────────────────────

const LocationMap = nextDynamic(() => import("@/components/maps/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-xl bg-slate-100 animate-pulse" />,
})

// ─── Status options ───────────────────────────────────────────────────────────

const CONTACT_STATUS_OPTIONS = [
  { value: "active",   label: "Active"   },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
]

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateEmail(v: string): string | null {
  if (!v.trim()) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "Enter a valid email address"
}
function validatePhone(v: string): string | null {
  if (!v.trim()) return null
  return /^[+]?[\d\s()-]{7,}$/.test(v.trim()) ? null : "Enter a valid phone number"
}

// ─── Editable field row ───────────────────────────────────────────────────────

interface EditableRowProps {
  label: string
  value: string | null
  onSave: (val: string) => Promise<void>
  type?: "text" | "textarea" | "select" | "email" | "phone"
  options?: { value: string; label: string }[]
  disabled?: boolean
  placeholder?: string
  validate?: (val: string) => string | null
}

function EditableRow({ label, value, onSave, type = "text", options, disabled, placeholder = "—", validate }: EditableRowProps) {
  const readOnlyReason = disabled ? "This supplier record is read-only." : undefined
  const common = { value, label, placeholder, readOnly: disabled, readOnlyReason, onSave }
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

// ─── Props ────────────────────────────────────────────────────────────────────

export type SaveableField = "full_name" | "company_name" | "city" | "postcode" | "notes" | "email" | "phone" | "status"

export interface OverviewTabProps {
  supplier: SupplierView
  jobs: Job[]
  onSaveField: (field: SaveableField, val: string) => Promise<void>
  onSaveTrade: (val: string) => Promise<void>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OverviewTab({ supplier, jobs, onSaveField, onSaveTrade }: OverviewTabProps) {
  const editable = !supplier.isSeed
  const [cityPart, postcodePart] = supplier.location === "—" ? ["", ""] : supplier.location.split(",").map((s) => s.trim())

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Company profile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Company Profile</h3>
          <EditableRow label="Name"          value={supplier.name}    onSave={(v) => onSaveField("full_name", v)}     disabled={!editable} />
          <EditableRow label="Company"       value={supplier.company} onSave={(v) => onSaveField("company_name", v)} disabled={!editable} />
          <EditableRow label="Supplier Type" value={supplier.trade}   onSave={onSaveTrade}                           disabled={!editable} placeholder="General Supplier" />
          <EditableRow label="Email"         value={supplier.email}   onSave={(v) => onSaveField("email", v)} type="email" validate={validateEmail} disabled={!editable} />
          <EditableRow label="Phone"         value={supplier.phone}   onSave={(v) => onSaveField("phone", v)} type="phone" validate={validatePhone} disabled={!editable} />
          <EditableRow label="City"          value={cityPart || null} onSave={(v) => onSaveField("city", v)}      disabled={!editable} />
          <EditableRow label="Postcode"      value={postcodePart || null} onSave={(v) => onSaveField("postcode", v)} disabled={!editable} />
          <EditableRow label="Status"        value={supplier.status}  onSave={(v) => onSaveField("status", v)} type="select" options={CONTACT_STATUS_OPTIONS} disabled={!editable} />
          <EditableRow label="Notes"         value={supplier.notes}   onSave={(v) => onSaveField("notes", v)} type="textarea" disabled={!editable} />
        </div>

        {/* Primary contact */}
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

        {/* Map */}
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
            <div className="h-44 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 mb-3">
              <MapPin className="w-6 h-6 text-slate-300" />
              <p className="text-[12px] font-medium text-slate-400">No base location set</p>
              <p className="text-[11px] text-slate-400">Add a city and postcode to the Company Profile</p>
            </div>
          )}
        </div>
      </div>

      {/* Compact job history */}
      <JobsTab supplier={supplier} jobs={jobs} compact />
    </div>
  )
}
