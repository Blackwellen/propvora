import React from "react"
import Link from "next/link"
import { Building2, Check, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

export const RENT_FREQUENCIES = [
  { key: "weekly",  label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "nightly", label: "Nightly" },
]

export const DEPOSIT_HOLDERS = [
  { key: "scheme",   label: "Tenancy Deposit Scheme" },
  { key: "landlord", label: "Landlord held" },
  { key: "agent",    label: "Agent held" },
]

export const TENANCY_TYPES = [
  { key: "ast",          label: "AST (Assured Shorthold)" },
  { key: "periodic",     label: "Periodic" },
  { key: "hmo_room",     label: "HMO Room Agreement" },
  { key: "contractual",  label: "Contractual" },
  { key: "lodger",       label: "Lodger Agreement" },
  { key: "commercial",   label: "Commercial Lease" },
]

export interface TenancyWizardData {
  property_id: string
  unit_id: string
  tenant_name: string
  tenant_email: string
  tenant_phone: string
  start_date: string
  end_date: string
  rent_amount: number
  rent_frequency: string
  deposit_amount: number
  deposit_held_by: string
  deposit_scheme: string
  tenancy_type: string
  notes: string
}

/* ── Step 1: Property ── */
interface StepPropertyProps {
  data: TenancyWizardData
  onChange: (d: Partial<TenancyWizardData>) => void
  properties: { id: string; name: string; address_line1?: string | null }[]
  units: { id: string; property_id: string; unit_name: string; status: string }[]
}

export function StepProperty({ data, onChange, properties, units }: StepPropertyProps) {
  const propertyUnits = units.filter((u) => u.property_id === data.property_id && u.status !== "occupied")
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Property <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {properties.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
              No properties — <Link href="/property-manager/portfolio/properties/new" className="text-[#2563EB] underline">add one first</Link>
            </div>
          ) : properties.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ property_id: p.id, unit_id: "" })}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                data.property_id === p.id ? "border-[#2563EB] bg-blue-50" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <Building2 className={cn("w-4 h-4 shrink-0", data.property_id === p.id ? "text-[#2563EB]" : "text-slate-400")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                {p.address_line1 && <p className="text-xs text-slate-500 truncate">{p.address_line1}</p>}
              </div>
              {data.property_id === p.id && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
            </button>
          ))}
        </div>
      </div>
      {data.property_id && propertyUnits.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Unit / Room (optional)</label>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onChange({ unit_id: "" })}
              className={cn(
                "px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                !data.unit_id ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              Whole property (no specific unit)
            </button>
            {propertyUnits.map((u) => (
              <button
                key={u.id}
                onClick={() => onChange({ unit_id: u.id })}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                  data.unit_id === u.id ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {u.unit_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Step 2: Tenant ── */
export function StepTenant({ data, onChange }: { data: TenancyWizardData; onChange: (d: Partial<TenancyWizardData>) => void }) {
  const fields = [
    { key: "tenant_name",  label: "Tenant name",    placeholder: "e.g. James Wilson", required: true,  type: "text" },
    { key: "tenant_email", label: "Email address",  placeholder: "james@email.com",   required: false, type: "email" },
    { key: "tenant_phone", label: "Phone number",   placeholder: "07700 900 123",     required: false, type: "tel" },
  ] as const
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Enter tenant details. You can link a full contact profile later.</p>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {f.label}{f.required && <span className="text-red-500"> *</span>}
          </label>
          <input
            type={f.type}
            placeholder={f.placeholder}
            value={(data as unknown as Record<string, string>)[f.key]}
            onChange={(e) => onChange({ [f.key]: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
        </div>
      ))}
    </div>
  )
}

/* ── Step 3: Dates ── */
export function StepDates({ data, onChange }: { data: TenancyWizardData; onChange: (d: Partial<TenancyWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tenancy type</label>
        <div className="grid grid-cols-2 gap-2">
          {TENANCY_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ tenancy_type: t.key })}
              className={cn(
                "px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                data.tenancy_type === t.key ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700 hover:border-slate-300"
              )}
            >
              {data.tenancy_type === t.key && <Check className="w-3 h-3 inline mr-1" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Start date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={data.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">End date</label>
          <input
            type="date"
            value={data.end_date}
            min={data.start_date}
            onChange={(e) => onChange({ end_date: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
          <p className="text-xs text-slate-500 mt-1">Leave blank for periodic</p>
        </div>
      </div>
    </div>
  )
}

/* ── Step 4: Financials ── */
export function StepFinancials({ data, onChange }: { data: TenancyWizardData; onChange: (d: Partial<TenancyWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Rent amount (£) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">£</span>
            <input
              type="number" min={0} placeholder="550"
              value={data.rent_amount || ""}
              onChange={(e) => onChange({ rent_amount: Number(e.target.value) })}
              className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Rent frequency</label>
          <select
            value={data.rent_frequency}
            onChange={(e) => onChange({ rent_frequency: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all bg-white"
          >
            {RENT_FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit amount (£)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">£</span>
            <input
              type="number" min={0}
              value={data.deposit_amount || ""}
              onChange={(e) => onChange({ deposit_amount: Number(e.target.value) })}
              className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit held by</label>
          <select
            value={data.deposit_held_by}
            onChange={(e) => onChange({ deposit_held_by: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all bg-white"
          >
            {DEPOSIT_HOLDERS.map((h) => <option key={h.key} value={h.key}>{h.label}</option>)}
          </select>
        </div>
      </div>
      {data.deposit_held_by === "scheme" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Scheme reference</label>
          <input
            type="text" placeholder="e.g. DPS-12345678"
            value={data.deposit_scheme}
            onChange={(e) => onChange({ deposit_scheme: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
        </div>
      )}
      {data.rent_amount > 0 && (
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-emerald-800">£{data.rent_amount.toLocaleString()}/{data.rent_frequency}</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Deposit: £{(data.deposit_amount || 0).toLocaleString()} · {DEPOSIT_HOLDERS.find((h) => h.key === data.deposit_held_by)?.label}
          </p>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
        <textarea
          rows={2} placeholder="Any additional notes…"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all resize-none"
        />
      </div>
    </div>
  )
}

/* ── Step 5: Documents ── */
export function StepDocuments() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Upload tenancy documents (optional — you can do this from the tenancy detail page).</p>
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/20 transition-all cursor-pointer">
        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Drop files here or click to upload</p>
        <p className="text-xs text-slate-500 mt-1">Tenancy agreement, deposit protection, move-in photos…</p>
        <Button variant="soft" size="sm" className="mt-4">Browse files</Button>
      </div>
      <div className="p-3 rounded-xl bg-blue-50 text-xs text-[#2563EB]">
        Document upload will be available after the tenancy is created.
      </div>
    </div>
  )
}

/* ── Step 6: Review ── */
interface StepReviewProps {
  data: TenancyWizardData
  propertyName: string
  unitName: string
}

export function StepReview({ data, propertyName, unitName }: StepReviewProps) {
  const rows = [
    { label: "Property",     value: propertyName || "—" },
    { label: "Unit",         value: unitName || "Whole property" },
    { label: "Tenant",       value: data.tenant_name || "—" },
    { label: "Start date",   value: data.start_date ? new Date(data.start_date).toLocaleDateString("en-GB") : "—" },
    { label: "End date",     value: data.end_date ? new Date(data.end_date).toLocaleDateString("en-GB") : "Periodic" },
    { label: "Rent",         value: data.rent_amount ? `£${data.rent_amount.toLocaleString()}/${data.rent_frequency}` : "—" },
    { label: "Deposit",      value: data.deposit_amount ? `£${data.deposit_amount.toLocaleString()}` : "—" },
    { label: "Deposit held", value: DEPOSIT_HOLDERS.find((h) => h.key === data.deposit_held_by)?.label ?? "—" },
    { label: "Tenancy type", value: TENANCY_TYPES.find((t) => t.key === data.tenancy_type)?.label ?? "—" },
  ]
  return (
    <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      {rows.map((row, i) => (
        <div key={row.label} className={cn("flex items-center justify-between px-4 py-3 text-sm", i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
          <span className="text-slate-500">{row.label}</span>
          <span className="font-medium text-slate-900">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
