"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { useWorkspace } from "@/providers/AuthProvider"
import { useCreateUnit } from "@/hooks/useUnits"
import { useProperties } from "@/hooks/useProperties"
import {
  ChevronLeft, ChevronRight, Check, Home, PoundSterling, Eye, Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"

interface UnitWizardData {
  property_id: string
  unit_name: string
  unit_type: string
  floor: number
  bedrooms: number
  bathrooms: number
  floor_area_sqm: number
  target_rent: number
  status: string
  notes: string
}

const UNIT_TYPES = [
  { key: "room",   label: "Room" },
  { key: "en_suite", label: "En-suite" },
  { key: "studio", label: "Studio" },
  { key: "flat",   label: "Flat / Apartment" },
  { key: "suite",  label: "Suite" },
  { key: "office", label: "Office" },
  { key: "other",  label: "Other" },
]

const STATUSES = [
  { key: "vacant",      label: "Vacant" },
  { key: "reserved",    label: "Reserved" },
  { key: "under_works", label: "Under Works" },
]

const STEPS = [
  { number: 1, label: "Property", icon: Building2 },
  { number: 2, label: "Details",  icon: Home },
  { number: 3, label: "Rent",     icon: PoundSterling },
  { number: 4, label: "Review",   icon: Eye },
]

const defaultData: UnitWizardData = {
  property_id: "",
  unit_name: "",
  unit_type: "room",
  floor: 1,
  bedrooms: 1,
  bathrooms: 1,
  floor_area_sqm: 0,
  target_rent: 0,
  status: "vacant",
  notes: "",
}

/* ------------------------------------------------------------------ */
/* Steps                                                                 */
/* ------------------------------------------------------------------ */
function StepProperty({ data, onChange, properties }: {
  data: UnitWizardData
  onChange: (d: Partial<UnitWizardData>) => void
  properties: { id: string; name: string; address_line1?: string | null }[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Which property does this unit belong to?</p>
      <div className="flex flex-col gap-2">
        {properties.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-3 border-2 border-dashed border-slate-200 rounded-2xl">
            <Building2 className="w-8 h-8 text-slate-200" />
            <p className="text-sm text-slate-500">No properties yet</p>
            <Button variant="soft" size="sm" asChild>
              <Link href="/property-manager/portfolio/properties/new">Add a property first</Link>
            </Button>
          </div>
        ) : (
          properties.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ property_id: p.id })}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                data.property_id === p.id
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                {p.address_line1 && <p className="text-xs text-slate-500 truncate">{p.address_line1}</p>}
              </div>
              {data.property_id === p.id && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function StepDetails({ data, onChange }: { data: UnitWizardData; onChange: (d: Partial<UnitWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit / Room name <span className="text-red-500">*</span></label>
        <input
          type="text"
          placeholder="e.g. Room 1, Studio A, Flat 2"
          value={data.unit_name}
          onChange={(e) => onChange({ unit_name: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Unit type <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {UNIT_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ unit_type: t.key })}
              className={cn(
                "px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                data.unit_type === t.key
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              )}
            >
              {data.unit_type === t.key && <Check className="w-3 h-3 inline mr-1" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { key: "bedrooms", label: "Bedrooms", min: 1, max: 20 },
          { key: "bathrooms", label: "Bathrooms", min: 1, max: 10 },
          { key: "floor", label: "Floor", min: -2, max: 50 },
          { key: "floor_area_sqm", label: "Floor area (m²)", min: 0, max: 9999 },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
            <input
              type="number"
              min={f.min}
              max={f.max}
              value={(data as unknown as Record<string, unknown>)[f.key] as number}
              onChange={(e) => onChange({ [f.key]: Number(e.target.value) })}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Initial status</label>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => onChange({ status: s.key })}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                data.status === s.key ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepRent({ data, onChange }: { data: UnitWizardData; onChange: (d: Partial<UnitWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Target monthly rent (£)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">£</span>
          <input
            type="number"
            min={0}
            placeholder="500"
            value={data.target_rent || ""}
            onChange={(e) => onChange({ target_rent: Number(e.target.value) })}
            className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
        </div>
      </div>

      {data.target_rent > 0 && (
        <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
          <PoundSterling className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Target: £{data.target_rent.toLocaleString()}/mo</p>
            <p className="text-xs text-emerald-600">£{(data.target_rent * 12).toLocaleString()}/yr · £{(data.target_rent / 4.33).toFixed(0)}/wk</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
        <textarea
          rows={3}
          placeholder="Add any notes about this unit…"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all resize-none"
        />
      </div>
    </div>
  )
}

function StepReview({ data, propertyName }: { data: UnitWizardData; propertyName: string }) {
  const rows = [
    { label: "Property",     value: propertyName || "—" },
    { label: "Unit name",    value: data.unit_name || "—" },
    { label: "Type",         value: UNIT_TYPES.find((t) => t.key === data.unit_type)?.label ?? "—" },
    { label: "Floor",        value: String(data.floor) },
    { label: "Bedrooms",     value: String(data.bedrooms) },
    { label: "Bathrooms",    value: String(data.bathrooms) },
    { label: "Floor area",   value: data.floor_area_sqm ? `${data.floor_area_sqm} m²` : "—" },
    { label: "Target rent",  value: data.target_rent ? `£${data.target_rent.toLocaleString()}/mo` : "—" },
    { label: "Status",       value: STATUSES.find((s) => s.key === data.status)?.label ?? "Vacant" },
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
export default function NewUnitPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: rawProperties } = useProperties(workspace?.id)
  const { mutateAsync: createUnit } = useCreateUnit()

  const [step, setStep] = useState(1)
  const [data, setData] = useState<UnitWizardData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const properties = rawProperties ?? []
  const selectedProperty = properties.find((p) => p.id === data.property_id)

  function handleChange(updates: Partial<UnitWizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  function canAdvance() {
    if (step === 1) return data.property_id !== ""
    if (step === 2) return data.unit_name.trim() !== "" && data.unit_type !== ""
    return true
  }

  async function handleSubmit() {
    if (saving) return // guard against double-submit
    setSaving(true)
    setSaveError(null)
    try {
      const unit = await createUnit({
        workspace_id: workspace!.id,
        property_id: data.property_id,
        unit_name: data.unit_name,
        unit_type: data.unit_type,
        floor: data.floor,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        floor_area_sqm: data.floor_area_sqm || undefined,
        target_rent: data.target_rent || undefined,
        status: data.status,
        notes: data.notes.trim() || undefined,
      })
      router.push(`/property-manager/portfolio/units/${unit.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create unit")
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Mobile top bar */}
      <MobileTopBar
        title="Add Unit / Room"
        subtitle={`Step ${step} of ${STEPS.length} — ${STEPS[step - 1].label}`}
        showBack
        backHref="/property-manager/portfolio/units"
      />

      <div className="hidden md:block mb-6">
        <Link href="/property-manager/portfolio/units" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />Back to Units
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Unit / Room</h1>
        <p className="text-sm text-slate-500 mt-1">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.number}>
            <button
              onClick={() => step > s.number && setStep(s.number)}
              className={cn("flex flex-col items-center gap-1 min-w-[52px]", s.number < step && "cursor-pointer")}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                s.number === step ? "bg-[#2563EB] text-white shadow-md shadow-blue-200"
                : s.number < step ? "bg-[#10B981] text-white"
                : "bg-slate-100 text-slate-400"
              )}>
                {s.number < step ? <Check className="w-3.5 h-3.5" /> : s.number}
              </div>
              <span className={cn("text-xs whitespace-nowrap", s.number === step ? "text-[#2563EB] font-semibold" : s.number < step ? "text-[#10B981]" : "text-slate-400")}>
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 min-w-[8px] rounded-full transition-all", s.number < step ? "bg-[#10B981]" : "bg-slate-100")} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-slate-900 mb-1">{STEPS[step - 1].label}</h2>
        <div className="border-b border-slate-100 mb-5" />
        {step === 1 && <StepProperty data={data} onChange={handleChange} properties={properties} />}
        {step === 2 && <StepDetails data={data} onChange={handleChange} />}
        {step === 3 && <StepRent data={data} onChange={handleChange} />}
        {step === 4 && <StepReview data={data} propertyName={selectedProperty?.name ?? ""} />}
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
            <Check className="w-4 h-4" />Create unit
          </Button>
        )}
      </div>
    </div>
  )
}
