"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { useWorkspace } from "@/providers/AuthProvider"
import { useCreateTenancy } from "@/hooks/useTenancies"
import { useProperties } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import {
  ChevronLeft, ChevronRight, Check, Building2, User, Calendar,
  PoundSterling, FileText, Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TenancyWizardData {
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

// Live `tenancies.rent_period` CHECK = weekly|monthly|nightly.
const RENT_FREQUENCIES = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "nightly", label: "Nightly" },
]

const DEPOSIT_HOLDERS = [
  { key: "scheme", label: "Tenancy Deposit Scheme" },
  { key: "landlord", label: "Landlord held" },
  { key: "agent", label: "Agent held" },
]

const TENANCY_TYPES = [
  { key: "ast", label: "AST (Assured Shorthold)" },
  { key: "periodic", label: "Periodic" },
  { key: "hmo_room", label: "HMO Room Agreement" },
  { key: "contractual", label: "Contractual" },
  { key: "lodger", label: "Lodger Agreement" },
  { key: "commercial", label: "Commercial Lease" },
]

const STEPS = [
  { number: 1, label: "Property",  icon: Building2    },
  { number: 2, label: "Tenant",    icon: User         },
  { number: 3, label: "Dates",     icon: Calendar     },
  { number: 4, label: "Financials",icon: PoundSterling },
  { number: 5, label: "Documents", icon: FileText     },
  { number: 6, label: "Review",    icon: Eye          },
]

const defaultData: TenancyWizardData = {
  property_id: "",
  unit_id: "",
  tenant_name: "",
  tenant_email: "",
  tenant_phone: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  rent_amount: 0,
  rent_frequency: "monthly",
  deposit_amount: 0,
  deposit_held_by: "scheme",
  deposit_scheme: "",
  tenancy_type: "ast",
  notes: "",
}

/* ------------------------------------------------------------------ */
/* Steps                                                                 */
/* ------------------------------------------------------------------ */
function StepProperty({ data, onChange, properties, units }: {
  data: TenancyWizardData
  onChange: (d: Partial<TenancyWizardData>) => void
  properties: { id: string; name: string; address_line1?: string | null }[]
  units: { id: string; property_id: string; unit_name: string; status: string }[]
}) {
  const propertyUnits = units.filter((u) => u.property_id === data.property_id && u.status !== "occupied")

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Property <span className="text-red-500">*</span></label>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {properties.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
              No properties — <Link href="/app/portfolio/properties/new" className="text-[#2563EB] underline">add one first</Link>
            </div>
          ) : (
            properties.map((p) => (
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
                  {p.address_line1 && <p className="text-xs text-slate-400 truncate">{p.address_line1}</p>}
                </div>
                {data.property_id === p.id && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
              </button>
            ))
          )}
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

function StepTenant({ data, onChange }: { data: TenancyWizardData; onChange: (d: Partial<TenancyWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Enter tenant details. You can link a full contact profile later.</p>
      {[
        { key: "tenant_name", label: "Tenant name", placeholder: "e.g. James Wilson", required: true, type: "text" },
        { key: "tenant_email", label: "Email address", placeholder: "james@email.com", type: "email" },
        { key: "tenant_phone", label: "Phone number", placeholder: "07700 900 123", type: "tel" },
      ].map((f) => (
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

function StepDates({ data, onChange }: { data: TenancyWizardData; onChange: (d: Partial<TenancyWizardData>) => void }) {
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
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Start date <span className="text-red-500">*</span></label>
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
          <p className="text-xs text-slate-400 mt-1">Leave blank for periodic</p>
        </div>
      </div>
    </div>
  )
}

function StepFinancials({ data, onChange }: { data: TenancyWizardData; onChange: (d: Partial<TenancyWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Rent amount (£) <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input
              type="number"
              min={0}
              placeholder="550"
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input
              type="number"
              min={0}
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
            type="text"
            placeholder="e.g. DPS-12345678"
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
          rows={2}
          placeholder="Any additional notes…"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all resize-none"
        />
      </div>
    </div>
  )
}

function StepDocuments() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Upload tenancy documents (optional — you can do this from the tenancy detail page).</p>
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/20 transition-all cursor-pointer">
        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Drop files here or click to upload</p>
        <p className="text-xs text-slate-400 mt-1">Tenancy agreement, deposit protection, move-in photos…</p>
        <Button variant="soft" size="sm" className="mt-4">Browse files</Button>
      </div>
      <div className="p-3 rounded-xl bg-blue-50 text-xs text-[#2563EB]">
        Document upload will be available after the tenancy is created.
      </div>
    </div>
  )
}

function StepReview({ data, propertyName, unitName }: { data: TenancyWizardData; propertyName: string; unitName: string }) {
  const rows = [
    { label: "Property",      value: propertyName || "—" },
    { label: "Unit",          value: unitName || "Whole property" },
    { label: "Tenant",        value: data.tenant_name || "—" },
    { label: "Start date",    value: data.start_date ? new Date(data.start_date).toLocaleDateString("en-GB") : "—" },
    { label: "End date",      value: data.end_date ? new Date(data.end_date).toLocaleDateString("en-GB") : "Periodic" },
    { label: "Rent",          value: data.rent_amount ? `£${data.rent_amount.toLocaleString()}/${data.rent_frequency}` : "—" },
    { label: "Deposit",       value: data.deposit_amount ? `£${data.deposit_amount.toLocaleString()}` : "—" },
    { label: "Deposit held",  value: DEPOSIT_HOLDERS.find((h) => h.key === data.deposit_held_by)?.label ?? "—" },
    { label: "Tenancy type",  value: TENANCY_TYPES.find((t) => t.key === data.tenancy_type)?.label ?? "—" },
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

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */
export default function NewTenancyPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: rawProperties } = useProperties(workspace?.id)
  const { data: rawUnits } = useUnits(workspace?.id)
  const { mutateAsync: createTenancy } = useCreateTenancy()

  const [step, setStep] = useState(1)
  const [data, setData] = useState<TenancyWizardData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const properties = rawProperties ?? []
  const units = useMemo(() => (rawUnits ?? []).map((u) => ({
    id: u.id,
    property_id: u.property_id,
    unit_name: u.unit_name,
    status: u.status,
  })), [rawUnits])

  const selectedProperty = properties.find((p) => p.id === data.property_id)
  const selectedUnit = units.find((u) => u.id === data.unit_id)

  function handleChange(updates: Partial<TenancyWizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  function canAdvance() {
    if (step === 1) return data.property_id !== ""
    if (step === 2) return data.tenant_name.trim() !== ""
    if (step === 3) return data.start_date !== ""
    if (step === 4) return data.rent_amount > 0
    return true
  }

  async function handleSubmit() {
    setSaving(true)
    setSaveError(null)
    try {
      const tenancy = await createTenancy({
        workspace_id: workspace!.id,
        property_id: data.property_id,
        unit_id: data.unit_id || undefined,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        rent_amount: data.rent_amount,
        rent_frequency: data.rent_frequency,
        deposit_amount: data.deposit_amount || undefined,
        deposit_held_by: data.deposit_held_by,
        deposit_scheme: data.deposit_scheme || undefined,
        tenancy_type: data.tenancy_type,
        notes: data.notes || undefined,
        status: "active",
      })
      router.push(`/app/portfolio/tenancies/${tenancy.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create tenancy")
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/app/portfolio/tenancies" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />Back to Tenancies
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Create Tenancy</h1>
        <p className="text-sm text-slate-500 mt-1">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.number}>
            <button
              onClick={() => step > s.number && setStep(s.number)}
              className={cn("flex flex-col items-center gap-1 min-w-[44px]", s.number < step && "cursor-pointer")}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                s.number === step ? "bg-[#2563EB] text-white shadow-md shadow-blue-200"
                : s.number < step ? "bg-[#10B981] text-white"
                : "bg-slate-100 text-slate-400"
              )}>
                {s.number < step ? <Check className="w-3.5 h-3.5" /> : s.number}
              </div>
              <span className={cn("text-[10px] whitespace-nowrap", s.number === step ? "text-[#2563EB] font-semibold" : s.number < step ? "text-[#10B981]" : "text-slate-400")}>
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 min-w-[6px] rounded-full transition-all", s.number < step ? "bg-[#10B981]" : "bg-slate-100")} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-slate-900 mb-1">{STEPS[step - 1].label}</h2>
        <div className="border-b border-slate-100 mb-5" />
        {step === 1 && <StepProperty data={data} onChange={handleChange} properties={properties} units={units} />}
        {step === 2 && <StepTenant data={data} onChange={handleChange} />}
        {step === 3 && <StepDates data={data} onChange={handleChange} />}
        {step === 4 && <StepFinancials data={data} onChange={handleChange} />}
        {step === 5 && <StepDocuments />}
        {step === 6 && <StepReview data={data} propertyName={selectedProperty?.name ?? ""} unitName={selectedUnit?.unit_name ?? ""} />}
      </div>

      {saveError && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{saveError}</div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="md" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ChevronLeft className="w-4 h-4" />Back
        </Button>
        {step < STEPS.length ? (
          <Button variant="primary" size="md" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
            Continue<ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="success" size="md" loading={saving} onClick={handleSubmit} disabled={!workspace}>
            <Check className="w-4 h-4" />Create tenancy
          </Button>
        )}
      </div>
    </div>
  )
}
