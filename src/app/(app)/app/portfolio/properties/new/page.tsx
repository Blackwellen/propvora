"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { PLANNING_PROFILES } from "@/lib/planning/profiles"
import { PROPERTY_TYPE_GROUPS, getPropertyTypeOption, templateForPropertyType } from "@/lib/constants/propertyTypes"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  Home,
  Layers,
  MapPin,
  DollarSign,
  Users,
  FileText,
  Upload,
  Eye,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */
interface Unit {
  id: string
  name: string
  type: string
  targetRent: number
}

interface PropertyWizardData {
  // Step 1
  name: string
  propertyType: string
  status: string
  // Step 2
  addressLine1: string
  addressLine2: string
  city: string
  county: string
  postcode: string
  // Step 3
  operationProfile: string
  // Step 4
  bedrooms: number
  bathrooms: number
  floorArea: number
  yearBuilt: number
  // Step 5
  purchasePrice: number
  currentValue: number
  monthlyMortgage: number
  targetRent: number
  // Step 6
  units: Unit[]
  // Step 7
  landlordContactId: string
  agentContactId: string
  // Step 8
  documents: string[]
}

// Live `properties.status` enum = active|void|off_market|archived.
const STATUSES = [
  { key: "active", label: "Active" },
  { key: "void", label: "Void" },
  { key: "off_market", label: "Off Market" },
]

const STEPS = [
  { number: 1, label: "Basics", icon: Building2 },
  { number: 2, label: "Address", icon: MapPin },
  { number: 3, label: "Profile", icon: Layers },
  { number: 4, label: "Physical", icon: Home },
  { number: 5, label: "Financials", icon: DollarSign },
  { number: 6, label: "Units", icon: Layers },
  { number: 7, label: "Contacts", icon: Users },
  { number: 8, label: "Documents", icon: Upload },
  { number: 9, label: "Review", icon: Eye },
]

const defaultData: PropertyWizardData = {
  name: "",
  propertyType: "",
  status: "active",
  addressLine1: "",
  addressLine2: "",
  city: "",
  county: "",
  postcode: "",
  operationProfile: "",
  bedrooms: 3,
  bathrooms: 1,
  floorArea: 0,
  yearBuilt: 2000,
  purchasePrice: 0,
  currentValue: 0,
  monthlyMortgage: 0,
  targetRent: 0,
  units: [],
  landlordContactId: "",
  agentContactId: "",
  documents: [],
}

/* ------------------------------------------------------------------ */
/* Step components                                                       */
/* ------------------------------------------------------------------ */
function StepBasics({ data, onChange }: { data: PropertyWizardData; onChange: (d: Partial<PropertyWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Property Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          placeholder="e.g. Brunswick Road HMO"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Property Type <span className="text-red-500">*</span></label>
        <div className="relative">
          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={data.propertyType}
            onChange={(e) => onChange({ propertyType: e.target.value })}
            className="w-full h-10 pl-9 pr-8 rounded-lg border border-[#E2E8F0] bg-white text-slate-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
          >
            <option value="">Select a property type…</option>
            {PROPERTY_TYPE_GROUPS.map((grp) => (
              <optgroup key={grp.group} label={grp.group}>
                {grp.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => onChange({ status: s.key })}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150",
                data.status === s.key
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E2E8F0] text-slate-600 hover:border-slate-300"
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

function StepAddress({ data, onChange }: { data: PropertyWizardData; onChange: (d: Partial<PropertyWizardData>) => void }) {
  const fields = [
    { key: "addressLine1", label: "Address line 1", placeholder: "12 Brunswick Road", required: true },
    { key: "addressLine2", label: "Address line 2", placeholder: "Flat 3 (optional)" },
    { key: "city", label: "Town / City", placeholder: "Nottingham", required: true },
    { key: "county", label: "County", placeholder: "Nottinghamshire" },
    { key: "postcode", label: "Postcode", placeholder: "NG1 4EX", required: true },
  ]
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            placeholder={field.placeholder}
            value={(data as unknown as Record<string, unknown>)[field.key] as string}
            onChange={(e) => onChange({ [field.key]: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
          />
        </div>
      ))}
    </div>
  )
}

function StepProfile({ data, onChange }: { data: PropertyWizardData; onChange: (d: Partial<PropertyWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">Select how this property will be operated.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PLANNING_PROFILES.map((profile) => (
          <button
            key={profile.key}
            onClick={() => onChange({ operationProfile: profile.key })}
            className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150",
              data.operationProfile === profile.key
                ? "border-2 bg-white shadow-sm"
                : "border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50"
            )}
            style={data.operationProfile === profile.key ? { borderColor: profile.colour } : {}}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: `${profile.colour}15` }}
            >
              <span className="text-sm font-bold" style={{ color: profile.colour }}>
                {profile.label.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-slate-900">{profile.label}</p>
                {data.operationProfile === profile.key && (
                  <Check className="w-3.5 h-3.5" style={{ color: profile.colour }} />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{profile.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepPhysical({ data, onChange }: { data: PropertyWizardData; onChange: (d: Partial<PropertyWizardData>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        { key: "bedrooms", label: "Bedrooms", min: 1, max: 50 },
        { key: "bathrooms", label: "Bathrooms", min: 1, max: 20 },
        { key: "floorArea", label: "Floor Area (m²)", min: 0, max: 9999 },
        { key: "yearBuilt", label: "Year Built", min: 1800, max: new Date().getFullYear() },
      ].map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
          <input
            type="number"
            min={field.min}
            max={field.max}
            value={(data as unknown as Record<string, unknown>)[field.key] as number}
            onChange={(e) => onChange({ [field.key]: Number(e.target.value) })}
            className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
          />
        </div>
      ))}
    </div>
  )
}

function StepFinancials({ data, onChange }: { data: PropertyWizardData; onChange: (d: Partial<PropertyWizardData>) => void }) {
  const fields = [
    { key: "purchasePrice", label: "Purchase Price (£)", placeholder: "185000" },
    { key: "currentValue", label: "Current Value (£)", placeholder: "210000" },
    { key: "monthlyMortgage", label: "Monthly Mortgage (£)", placeholder: "750" },
    { key: "targetRent", label: "Target Monthly Rent (£)", placeholder: "2800" },
  ]
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input
              type="number"
              min={0}
              placeholder={field.placeholder}
              value={(data as unknown as Record<string, unknown>)[field.key] as number || ""}
              onChange={(e) => onChange({ [field.key]: Number(e.target.value) })}
              className="w-full h-10 pl-7 pr-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function StepUnits({ data, onChange }: { data: PropertyWizardData; onChange: (d: Partial<PropertyWizardData>) => void }) {
  function addUnit() {
    onChange({
      units: [...data.units, { id: Date.now().toString(), name: `Room ${data.units.length + 1}`, type: "Room", targetRent: 500 }]
    })
  }
  function removeUnit(id: string) {
    onChange({ units: data.units.filter((u) => u.id !== id) })
  }
  function updateUnit(id: string, updates: Partial<Unit>) {
    onChange({ units: data.units.map((u) => u.id === id ? { ...u, ...updates } : u) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Add rooms/units for HMO or multi-unit properties.</p>
        <Button variant="outline" size="sm" onClick={addUnit}>
          <Plus className="w-4 h-4" />
          Add unit
        </Button>
      </div>

      {data.units.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-dashed border-slate-200 rounded-2xl text-center">
          <Layers className="w-8 h-8 text-slate-200" />
          <p className="text-sm text-slate-400">No units added yet</p>
          <Button variant="soft" size="sm" onClick={addUnit}>
            <Plus className="w-4 h-4" />
            Add first unit
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.units.map((unit) => (
            <div key={unit.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-slate-50">
              <input
                type="text"
                value={unit.name}
                onChange={(e) => updateUnit(unit.id, { name: e.target.value })}
                className="flex-1 h-8 px-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="Room name"
              />
              <select
                value={unit.type}
                onChange={(e) => updateUnit(unit.id, { type: e.target.value })}
                className="h-8 px-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-700 focus:outline-none cursor-pointer"
              >
                <option>Room</option>
                <option>En-suite</option>
                <option>Studio</option>
                <option>1-bed flat</option>
              </select>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">£</span>
                <input
                  type="number"
                  value={unit.targetRent}
                  onChange={(e) => updateUnit(unit.id, { targetRent: Number(e.target.value) })}
                  className="w-24 h-8 pl-5 pr-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  placeholder="500"
                />
              </div>
              <button onClick={() => removeUnit(unit.id)} className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg">
            <span className="text-sm text-slate-600">Total target rent</span>
            <span className="text-sm font-semibold text-[#10B981]">
              £{data.units.reduce((s, u) => s + u.targetRent, 0).toLocaleString()}/mo
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function StepContacts({ data, onChange }: { data: PropertyWizardData; onChange: (d: Partial<PropertyWizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-500">Link contacts to this property (optional at this stage).</p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Landlord / Owner</label>
        <input
          type="text"
          placeholder="Search contacts or enter name..."
          value={data.landlordContactId}
          onChange={(e) => onChange({ landlordContactId: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Managing Agent</label>
        <input
          type="text"
          placeholder="Search contacts or enter name..."
          value={data.agentContactId}
          onChange={(e) => onChange({ agentContactId: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
        />
      </div>
      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-[#2563EB]">
        You can add and manage contacts fully from the Contacts section.
      </div>
    </div>
  )
}

function StepDocuments() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Upload property documents (optional at this stage).</p>
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-[#2563EB]/50 hover:bg-blue-50/30 transition-all cursor-pointer">
        <Upload className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Drop files here or click to upload</p>
        <p className="text-xs text-slate-400 mt-1">EPC, Gas Safety, EICR, Tenancy agreements, etc.</p>
        <Button variant="soft" size="sm" className="mt-4">Browse files</Button>
      </div>
      <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500">
        Supported: PDF, Word, Excel, JPEG, PNG — Max 20MB per file
      </div>
    </div>
  )
}

function StepReview({ data }: { data: PropertyWizardData }) {
  const selectedProfile = PLANNING_PROFILES.find((p) => p.key === data.operationProfile)
  const rows = [
    { label: "Name", value: data.name || "—" },
    { label: "Type", value: getPropertyTypeOption(data.propertyType)?.label || "—" },
    { label: "Status", value: data.status || "—" },
    { label: "Address", value: [data.addressLine1, data.city, data.postcode].filter(Boolean).join(", ") || "—" },
    { label: "Operation Profile", value: selectedProfile?.label || "—" },
    { label: "Bedrooms", value: String(data.bedrooms) },
    { label: "Bathrooms", value: String(data.bathrooms) },
    { label: "Purchase Price", value: data.purchasePrice ? `£${data.purchasePrice.toLocaleString()}` : "—" },
    { label: "Current Value", value: data.currentValue ? `£${data.currentValue.toLocaleString()}` : "—" },
    { label: "Target Rent", value: data.targetRent ? `£${data.targetRent.toLocaleString()}/mo` : "—" },
    { label: "Units", value: data.units.length > 0 ? `${data.units.length} units` : "None" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-2xl overflow-hidden border border-[#E2E8F0]">
        {rows.map((row, i) => (
          <div key={row.label} className={cn("flex items-center justify-between px-4 py-3 text-sm", i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
            <span className="text-slate-500">{row.label}</span>
            <span className="font-medium text-slate-900 text-right max-w-[240px] truncate">{row.value}</span>
          </div>
        ))}
      </div>
      {data.units.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Units</p>
          <div className="flex flex-col gap-1.5">
            {data.units.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-[#E2E8F0] text-sm">
                <span className="text-slate-700">{u.name} ({u.type})</span>
                <span className="font-medium text-[#10B981]">£{u.targetRent}/mo</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Wizard page                                                           */
/* ------------------------------------------------------------------ */
export default function NewPropertyPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<PropertyWizardData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleChange(updates: Partial<PropertyWizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  function canAdvance() {
    if (step === 1) return data.name.trim() !== "" && data.propertyType !== ""
    if (step === 2) return data.addressLine1.trim() !== "" && data.city.trim() !== "" && data.postcode.trim() !== ""
    return true
  }

  async function handleSubmit() {
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const workspaceId = workspace?.id
      const { data: created, error } = await supabase
        .from("properties")
        .insert({
          workspace_id: workspaceId,
          // Live column is `nickname` (not `name`).
          nickname: data.name,
          // Dwelling type is stored in the free-text `category` column; the DB
          // `template` enum is derived from it (mapping never invents enum values).
          category: data.propertyType || null,
          template: templateForPropertyType(data.propertyType),
          status: data.status,
          address_line1: data.addressLine1,
          address_line2: data.addressLine2 || null,
          city: data.city,
          county: data.county || null,
          postcode: data.postcode,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          floor_area_sqm: data.floorArea || null,
          year_built: data.yearBuilt || null,
          purchase_price: data.purchasePrice || null,
          current_value: data.currentValue || null,
          target_rent_pcm: data.targetRent || null,
        })
        .select()
        .single()
      if (error) throw error

      // Insert units if any — into the canonical `units` table the app reads
      // (label/rent_amount/status), not the vestigial property_units.
      if (data.units.length > 0 && created) {
        const { error: unitsError } = await supabase.from("units").insert(
          data.units.map((u) => ({
            property_id: created.id,
            workspace_id: workspaceId,
            label: u.name,
            rent_amount: u.targetRent || null,
            rent_period: "monthly",
            status: "available",
          }))
        )
        if (unitsError) throw unitsError
      }

      router.push(`/app/portfolio/properties/${created.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save property"
      setSaveError(message)
      setSaving(false)
    }
  }

  const stepComponents: Record<number, React.ReactNode> = {
    1: <StepBasics data={data} onChange={handleChange} />,
    2: <StepAddress data={data} onChange={handleChange} />,
    3: <StepProfile data={data} onChange={handleChange} />,
    4: <StepPhysical data={data} onChange={handleChange} />,
    5: <StepFinancials data={data} onChange={handleChange} />,
    6: <StepUnits data={data} onChange={handleChange} />,
    7: <StepContacts data={data} onChange={handleChange} />,
    8: <StepDocuments />,
    9: <StepReview data={data} />,
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/app/portfolio/properties" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />
          Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Property</h1>
        <p className="text-sm text-slate-500 mt-1">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.number}>
            <button
              onClick={() => step > s.number && setStep(s.number)}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[52px] transition-all duration-150",
                s.number < step && "cursor-pointer"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                s.number === step
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-200"
                  : s.number < step
                  ? "bg-[#10B981] text-white"
                  : "bg-slate-100 text-slate-400"
              )}>
                {s.number < step ? <Check className="w-3.5 h-3.5" /> : s.number}
              </div>
              <span className={cn(
                "text-xs whitespace-nowrap",
                s.number === step ? "text-[#2563EB] font-semibold" : s.number < step ? "text-[#10B981]" : "text-slate-400"
              )}>
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 min-w-[8px] rounded-full transition-all",
                s.number < step ? "bg-[#10B981]" : "bg-slate-100"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">{STEPS[step - 1].label}</h2>
        <div className="border-b border-slate-100 mb-5" />
        {stepComponents[step]}
      </div>

      {/* Navigation */}
      {saveError && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {saveError}
        </div>
      )}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="md"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        {step < STEPS.length ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="success"
            size="md"
            loading={saving}
            onClick={handleSubmit}
          >
            <Check className="w-4 h-4" />
            Create property
          </Button>
        )}
      </div>
    </div>
  )
}
