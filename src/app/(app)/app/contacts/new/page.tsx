"use client"

import React, { useState, useCallback, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import {
  UserCheck,
  Home,
  Wrench,
  Users,
  UserPlus,
  History,
  ShieldCheck,
  Landmark,
  Scale,
  Calculator,
  Shield,
  TrendingUp,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Tag,
  X,
  AlertCircle,
  Loader2,
  FileText,
  Upload,
  ToggleLeft,
  ToggleRight,
  Pencil,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"
import { SUPPLIER_CATEGORY_GROUPS } from "@/lib/constants/supplierCategories"
import { useCreateContact } from "@/hooks/useContacts"
import { useWorkspace } from "@/providers/AuthProvider"
import type { ContactType, InsertContact } from "@/types/database"

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityType = "person" | "organisation"

type PreferredContact = "email" | "phone" | "whatsapp" | "post"

interface TagItem {
  id: string
  label: string
}

interface DocumentSlot {
  name: string
  file: File | null
  expiry: string
}

interface WizardState {
  // Step 1
  contactType: ContactType | null
  entityType: EntityType

  // Step 2
  firstName: string
  lastName: string
  preferredName: string
  organisationName: string
  primaryContactName: string
  notes: string
  tags: TagItem[]

  // Step 3
  email: string
  phone: string
  secondaryPhone: string
  website: string
  addressLine1: string
  city: string
  postcode: string
  country: string
  preferredContact: PreferredContact

  // Step 4
  linkedProperties: string[]
  linkedTenancy: string
  linkedPlanningSet: string

  // Step 5 – supplier
  supplierServices: string[]
  coveragePostcodes: string
  hourlyRate: string
  calloutFee: string
  emergencyAvailable: boolean
  preferredSupplier: boolean
  insuranceExpiry: string

  // Step 5 – applicant
  enquirySource: string
  budgetMin: string
  budgetMax: string
  desiredMoveDate: string
  preferredArea: string
  preferredPropertyTypes: string[]
  applicantNotes: string

  // Step 5 – tenant
  currentRent: string
  moveInDate: string
  moveOutDate: string
  numOccupants: string
  emergencyContactName: string
  emergencyContactPhone: string

  // Step 5 – landlord
  landlordPreferredComms: string
  responsibilityNotes: string
  interestedInPlanning: boolean
  numPropertiesOwned: string

  // Step 5 – professional
  serviceSpecialisation: string
  companyRegistration: string
  professionalBody: string
  renewalDate: string

  // Step 5 – generic
  additionalNotes: string

  // Step 6
  documents: DocumentSlot[]

  // Step 7
  portalAccessEnabled: boolean
  portalExpiry: string
  portalEmail: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTACT_TYPE_OPTIONS: {
  value: ContactType
  label: string
  icon: React.ElementType
  desc: string
  colour: string
}[] = [
  { value: "tenant", label: "Tenant", icon: UserCheck, desc: "Renting a property from you", colour: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { value: "landlord", label: "Landlord", icon: Home, desc: "Property owner you manage for", colour: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "supplier", label: "Supplier / Contractor", icon: Wrench, desc: "Tradesperson, contractor or vendor", colour: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "agent", label: "Agent", icon: Users, desc: "Letting or estate agent", colour: "border-violet-200 bg-violet-50 text-violet-700" },
  { value: "applicant", label: "Applicant", icon: UserPlus, desc: "Prospective tenant or enquiry", colour: "border-sky-200 bg-sky-50 text-sky-700" },
  { value: "post_tenant", label: "Past Tenant", icon: History, desc: "Previously rented from you", colour: "border-slate-200 bg-slate-50 text-slate-600" },
  { value: "guarantor", label: "Guarantor", icon: ShieldCheck, desc: "Guaranteeing a tenant's obligations", colour: "border-purple-200 bg-purple-50 text-purple-700" },
  { value: "local_authority", label: "Local Authority", icon: Landmark, desc: "Council or government body", colour: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  { value: "legal", label: "Solicitor / Legal", icon: Scale, desc: "Solicitor, barrister or legal adviser", colour: "border-slate-200 bg-slate-50 text-slate-700" },
  { value: "accountant", label: "Accountant", icon: Calculator, desc: "Accountant, bookkeeper or tax adviser", colour: "border-teal-200 bg-teal-50 text-teal-700" },
  { value: "insurer", label: "Insurer", icon: Shield, desc: "Insurance provider", colour: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  { value: "investor", label: "Investor", icon: TrendingUp, desc: "Property investor or backer", colour: "border-green-200 bg-green-50 text-green-700" },
  { value: "other", label: "Other", icon: User, desc: "Other contact type", colour: "border-slate-200 bg-slate-50 text-slate-600" },
]

const ENQUIRY_SOURCES = [
  "Website", "Rightmove", "Zoopla", "OpenRent", "Referral",
  "Phone Enquiry", "Walk-in", "Social Media", "Other",
]

const PREFERRED_PROPERTY_TYPES = ["Flat", "House", "HMO Room", "Studio", "Other"]

const PORTAL_EXPIRY_OPTIONS = [
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "after_job", label: "After Job Completion" },
  { value: "never", label: "Never Expires" },
]

const STEP_NAMES = [
  "Contact Type",
  "Details",
  "Communication",
  "Relationship Links",
  "Type-Specific",
  "Documents",
  "Portal Access",
  "Review & Create",
]

const STEP_TIPS: Record<number, string> = {
  1: "Selecting the right type ensures you see the most relevant fields and documents for this contact.",
  2: "A clear display name helps your team instantly recognise this contact across Propvora.",
  3: "Adding multiple contact methods improves response rates and keeps your data complete.",
  4: "Linking contacts to properties and tenancies now saves time later — you can always do it after saving.",
  5: "These details are unique to this contact type and help you track obligations and service scope.",
  6: "Uploading key documents now keeps everything in one place and triggers expiry reminders automatically.",
  7: "Supplier portal access lets contractors submit quotes and upload certificates without needing full system access.",
  8: "Review everything before saving. You can jump back to any section to make changes.",
}

function getDocumentSlots(contactType: ContactType | null): DocumentSlot[] {
  if (!contactType) return []
  const slotNames: Record<string, string[]> = {
    tenant: ["Tenancy Agreement", "Photo ID", "Right to Rent"],
    post_tenant: ["Tenancy Agreement", "Photo ID"],
    landlord: ["Proof of Ownership", "Photo ID", "Management Agreement"],
    supplier: ["Public Liability Insurance", "Gas Safe Certificate", "Electrical Certificate", "Photo ID"],
    guarantor: ["Guarantor Agreement", "Proof of Address", "Photo ID"],
    legal: ["Engagement Letter", "Professional Indemnity Insurance"],
    accountant: ["Engagement Letter", "Professional Indemnity Insurance"],
    insurer: ["Policy Document", "Certificate of Insurance"],
  }
  const names = slotNames[contactType] ?? ["Supporting Document"]
  return names.map((name) => ({ name, file: null, expiry: "" }))
}

// ─── Default State ─────────────────────────────────────────────────────────────

const defaultState: WizardState = {
  contactType: null,
  entityType: "person",
  firstName: "",
  lastName: "",
  preferredName: "",
  organisationName: "",
  primaryContactName: "",
  notes: "",
  tags: [],
  email: "",
  phone: "",
  secondaryPhone: "",
  website: "",
  addressLine1: "",
  city: "",
  postcode: "",
  country: "United Kingdom",
  preferredContact: "email",
  linkedProperties: [],
  linkedTenancy: "",
  linkedPlanningSet: "",
  supplierServices: [],
  coveragePostcodes: "",
  hourlyRate: "",
  calloutFee: "",
  emergencyAvailable: false,
  preferredSupplier: false,
  insuranceExpiry: "",
  enquirySource: "",
  budgetMin: "",
  budgetMax: "",
  desiredMoveDate: "",
  preferredArea: "",
  preferredPropertyTypes: [],
  applicantNotes: "",
  currentRent: "",
  moveInDate: "",
  moveOutDate: "",
  numOccupants: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  landlordPreferredComms: "",
  responsibilityNotes: "",
  interestedInPlanning: false,
  numPropertiesOwned: "",
  serviceSpecialisation: "",
  companyRegistration: "",
  professionalBody: "",
  renewalDate: "",
  additionalNotes: "",
  documents: [],
  portalAccessEnabled: false,
  portalExpiry: "7d",
  portalEmail: "",
}

// ─── Shared field components ──────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  prefix,
  hint,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  type?: string
  prefix?: string
  hint?: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-500 text-sm select-none pointer-events-none">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={[
            "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            prefix ? "pl-7" : "",
            error ? "border-red-400" : "border-slate-200",
          ].join(" ")}
        />
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ToggleSwitch({
  label,
  checked,
  onChange,
  description,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  description?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="mt-0.5 flex-shrink-0"
        aria-pressed={checked}
      >
        {checked ? (
          <div style={{ color: "#2563EB" }}><ToggleRight className="w-8 h-8" /></div>
        ) : (
          <div style={{ color: "#94a3b8" }}><ToggleLeft className="w-8 h-8" /></div>
        )}
      </button>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
    </div>
  )
}

function ChipGrid({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-medium border transition",
              active
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300",
            ].join(" ")}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function GroupedChipGrid({
  groups,
  selected,
  onChange,
}: {
  groups: { group: string; options: string[] }[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  }
  return (
    <div className="flex flex-col gap-3">
      {groups.map((grp) => (
        <div key={grp.group} className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{grp.group}</p>
          <div className="flex flex-wrap gap-2">
            {grp.options.map((opt) => {
              const active = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={[
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                    active
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-blue-300",
                  ].join(" ")}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Steps ─────────────────────────────────────────────────────────────────────

function Step1TypeSelector({
  state,
  setState,
  errors,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  errors: string[]
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Contact Type</h2>
        <p className="text-sm text-slate-500">What kind of contact are you adding?</p>
      </div>

      {errors.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <div style={{ color: "#ef4444" }}><AlertCircle className="w-4 h-4" /></div>
          <p className="text-sm text-red-600">{errors[0]}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {CONTACT_TYPE_OPTIONS.map(({ value, label, icon: Icon, desc, colour }) => {
          const selected = state.contactType === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setState((s) => ({ ...s, contactType: value }))}
              className={[
                "flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition",
                selected
                  ? "ring-2 ring-blue-500 border-blue-400 bg-blue-50"
                  : `${colour} hover:opacity-90`,
              ].join(" ")}
            >
              <Icon className="w-5 h-5" />
              <div>
                <p className="text-xs font-semibold leading-tight">{label}</p>
                <p className="text-[10px] leading-snug opacity-70 mt-0.5">{desc}</p>
              </div>
              {selected && (
                <div className="self-end ml-auto mt-auto">
                  <div style={{ color: "#2563EB" }}><Check className="w-3.5 h-3.5" /></div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Entity type</p>
        <div className="flex gap-3">
          {(["person", "organisation"] as EntityType[]).map((et) => (
            <button
              key={et}
              type="button"
              onClick={() => setState((s) => ({ ...s, entityType: et }))}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition",
                state.entityType === et
                  ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500"
                  : "border-slate-200 text-slate-600 hover:border-blue-300",
              ].join(" ")}
            >
              {et === "person" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              {et === "person" ? "Person" : "Organisation"}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step2Details({
  state,
  setState,
  errors,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  errors: string[]
}) {
  const [tagInput, setTagInput] = useState("")

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (state.tags.find((t) => t.label.toLowerCase() === trimmed.toLowerCase())) return
    setState((s) => ({ ...s, tags: [...s.tags, { id: crypto.randomUUID(), label: trimmed }] }))
    setTagInput("")
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addTag() }
  }

  const removeTag = (id: string) => setState((s) => ({ ...s, tags: s.tags.filter((t) => t.id !== id) }))

  const displayName =
    state.entityType === "organisation"
      ? state.organisationName || "Organisation name"
      : [state.firstName, state.lastName].filter(Boolean).join(" ") || "Full name"

  const errorFor = (field: string) => errors.find((e) => e.toLowerCase().startsWith(field.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Contact Details</h2>
        <p className="text-sm text-slate-500">Enter the basic information for this contact.</p>
      </div>

      {state.entityType === "person" ? (
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="First Name"
            value={state.firstName}
            onChange={(v) => setState((s) => ({ ...s, firstName: v }))}
            required
            placeholder="e.g. Kevin"
            error={errorFor("First name")}
          />
          <InputField
            label="Last Name"
            value={state.lastName}
            onChange={(v) => setState((s) => ({ ...s, lastName: v }))}
            required
            placeholder="e.g. Thompson"
            error={errorFor("Last name")}
          />
          <div className="col-span-2">
            <InputField
              label="Preferred Name"
              value={state.preferredName}
              onChange={(v) => setState((s) => ({ ...s, preferredName: v }))}
              placeholder="Optional nickname or preferred name"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <InputField
            label="Organisation Name"
            value={state.organisationName}
            onChange={(v) => setState((s) => ({ ...s, organisationName: v }))}
            required
            placeholder="e.g. Acme Property Services Ltd"
            error={errorFor("Organisation name")}
          />
          <InputField
            label="Primary Contact Name"
            value={state.primaryContactName}
            onChange={(v) => setState((s) => ({ ...s, primaryContactName: v }))}
            placeholder="Main point of contact (optional)"
          />
        </div>
      )}

      <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-400 mb-0.5">Display name preview</p>
        <p className="text-sm font-semibold text-slate-800">{displayName}</p>
      </div>

      <TextareaField
        label="Notes"
        value={state.notes}
        onChange={(v) => setState((s) => ({ ...s, notes: v }))}
        placeholder="Any internal notes about this contact…"
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {state.tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5"
            >
              {tag.label}
              <button type="button" onClick={() => removeTag(tag.id)} className="ml-0.5 hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag and press Enter…"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Tag className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400">Press Enter or click the tag icon to add</p>
      </div>
    </div>
  )
}

function Step3Communication({
  state,
  setState,
  errors,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  errors: string[]
}) {
  const showWebsite =
    state.entityType === "organisation" ||
    state.contactType === "supplier" ||
    state.contactType === "legal" ||
    state.contactType === "accountant"

  const assembledAddress = [state.addressLine1, state.city, state.postcode, state.country]
    .filter(Boolean)
    .join(", ")

  const preferredOptions: { value: PreferredContact; label: string }[] = [
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "post", label: "Post" },
  ]

  const errorFor = (field: string) => errors.find((e) => e.toLowerCase().startsWith(field.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Communication</h2>
        <p className="text-sm text-slate-500">How should you reach this contact?</p>
      </div>

      <InputField
        label="Email Address"
        value={state.email}
        onChange={(v) => setState((s) => ({ ...s, email: v }))}
        required
        type="email"
        placeholder="contact@example.com"
        error={errorFor("Email")}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Primary Phone"
          value={state.phone}
          onChange={(v) => setState((s) => ({ ...s, phone: v }))}
          placeholder="+44 7700 900000"
          type="tel"
        />
        <InputField
          label="Secondary Phone"
          value={state.secondaryPhone}
          onChange={(v) => setState((s) => ({ ...s, secondaryPhone: v }))}
          placeholder="Optional"
          type="tel"
        />
      </div>

      {showWebsite && (
        <InputField
          label="Website"
          value={state.website}
          onChange={(v) => setState((s) => ({ ...s, website: v }))}
          placeholder="https://example.com"
          type="url"
        />
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Address</p>
        <InputField
          label="Address Line 1"
          value={state.addressLine1}
          onChange={(v) => setState((s) => ({ ...s, addressLine1: v }))}
          placeholder="Street address"
        />
        <div className="grid grid-cols-3 gap-3">
          <InputField
            label="City"
            value={state.city}
            onChange={(v) => setState((s) => ({ ...s, city: v }))}
            placeholder="London"
          />
          <InputField
            label="Postcode"
            value={state.postcode}
            onChange={(v) => setState((s) => ({ ...s, postcode: v }))}
            placeholder="SW1A 1AA"
          />
          <InputField
            label="Country"
            value={state.country}
            onChange={(v) => setState((s) => ({ ...s, country: v }))}
            placeholder="United Kingdom"
          />
        </div>
      </div>

      {assembledAddress && (
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
          <div style={{ color: "#64748b" }}><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /></div>
          <p className="text-sm text-slate-600">{assembledAddress}</p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Preferred Contact Method</p>
        <div className="flex gap-2 flex-wrap">
          {preferredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setState((s) => ({ ...s, preferredContact: opt.value }))}
              className={[
                "px-4 py-1.5 rounded-full text-sm font-medium border transition",
                state.preferredContact === opt.value
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-slate-200 text-slate-600 hover:border-blue-300",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step4RelationshipLinks({
  state,
  setState,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
}) {
  const showTenancy = ["tenant", "post_tenant", "guarantor"].includes(state.contactType ?? "")
  const showPlanning = ["landlord", "investor"].includes(state.contactType ?? "")

  // setState is accepted for future wiring; referenced to avoid lint warning
  void setState

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Relationship Links</h2>
        <p className="text-sm text-slate-500">Connect this contact to properties or records in your workspace.</p>
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 flex items-center gap-2">
        <div style={{ color: "#64748b" }}><AlertCircle className="w-4 h-4" /></div>
        <p className="text-xs text-slate-500">You can link records after saving too — no need to do it now.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Link to Properties</label>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2">
          <Home className="w-4 h-4" />
          0 properties in demo workspace
        </div>
      </div>

      {showTenancy && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Link to Tenancy</label>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            0 tenancies in demo workspace
          </div>
        </div>
      )}

      {showPlanning && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Link to Planning Set</label>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            0 planning sets in demo workspace
          </div>
        </div>
      )}
    </div>
  )
}

function Step5TypeSpecific({
  state,
  setState,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
}) {
  const ct = state.contactType

  if (ct === "supplier") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Supplier Details</h2>
          <p className="text-sm text-slate-500">Scope and rates for this supplier or contractor.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Service Categories</label>
          <GroupedChipGrid
            groups={SUPPLIER_CATEGORY_GROUPS}
            selected={state.supplierServices}
            onChange={(v) => setState((s) => ({ ...s, supplierServices: v }))}
          />
        </div>

        <InputField
          label="Coverage Postcodes"
          value={state.coveragePostcodes}
          onChange={(v) => setState((s) => ({ ...s, coveragePostcodes: v }))}
          placeholder="SW1, E1, N1 (comma-separated)"
          hint="Enter postcodes this supplier covers"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Hourly Rate"
            value={state.hourlyRate}
            onChange={(v) => setState((s) => ({ ...s, hourlyRate: v }))}
            placeholder="0.00"
            prefix="£"
            type="number"
          />
          <InputField
            label="Callout Fee"
            value={state.calloutFee}
            onChange={(v) => setState((s) => ({ ...s, calloutFee: v }))}
            placeholder="0.00"
            prefix="£"
            type="number"
          />
        </div>

        <InputField
          label="Insurance Expiry Date"
          value={state.insuranceExpiry}
          onChange={(v) => setState((s) => ({ ...s, insuranceExpiry: v }))}
          type="date"
        />

        <div className="space-y-3">
          <ToggleSwitch
            label="Available for Emergencies"
            checked={state.emergencyAvailable}
            onChange={(v) => setState((s) => ({ ...s, emergencyAvailable: v }))}
            description="This supplier can be called out for urgent jobs"
          />
          <ToggleSwitch
            label="Mark as Preferred Supplier"
            checked={state.preferredSupplier}
            onChange={(v) => setState((s) => ({ ...s, preferredSupplier: v }))}
            description="Pin to top of supplier search results"
          />
        </div>
      </div>
    )
  }

  if (ct === "applicant") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Applicant Details</h2>
          <p className="text-sm text-slate-500">Track this applicant's requirements and source.</p>
        </div>

        <SelectField
          label="Enquiry Source"
          value={state.enquirySource}
          onChange={(v) => setState((s) => ({ ...s, enquirySource: v }))}
          options={ENQUIRY_SOURCES.map((x) => ({ value: x, label: x }))}
          placeholder="Select source…"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Budget Min (£/mo)"
            value={state.budgetMin}
            onChange={(v) => setState((s) => ({ ...s, budgetMin: v }))}
            prefix="£"
            type="number"
            placeholder="0"
          />
          <InputField
            label="Budget Max (£/mo)"
            value={state.budgetMax}
            onChange={(v) => setState((s) => ({ ...s, budgetMax: v }))}
            prefix="£"
            type="number"
            placeholder="0"
          />
        </div>

        <InputField
          label="Desired Move Date"
          value={state.desiredMoveDate}
          onChange={(v) => setState((s) => ({ ...s, desiredMoveDate: v }))}
          type="date"
        />

        <InputField
          label="Preferred Area"
          value={state.preferredArea}
          onChange={(v) => setState((s) => ({ ...s, preferredArea: v }))}
          placeholder="e.g. East London, Manchester City Centre"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Preferred Property Types</label>
          <ChipGrid
            options={PREFERRED_PROPERTY_TYPES}
            selected={state.preferredPropertyTypes}
            onChange={(v) => setState((s) => ({ ...s, preferredPropertyTypes: v }))}
          />
        </div>

        <TextareaField
          label="Requirements Notes"
          value={state.applicantNotes}
          onChange={(v) => setState((s) => ({ ...s, applicantNotes: v }))}
          placeholder="Any specific requirements or preferences…"
        />
      </div>
    )
  }

  if (ct === "tenant") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Tenant Details</h2>
          <p className="text-sm text-slate-500">Rental and occupancy information for this tenant.</p>
        </div>

        <InputField
          label="Current Rent (£/mo)"
          value={state.currentRent}
          onChange={(v) => setState((s) => ({ ...s, currentRent: v }))}
          prefix="£"
          type="number"
          placeholder="0"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Move-in Date"
            value={state.moveInDate}
            onChange={(v) => setState((s) => ({ ...s, moveInDate: v }))}
            type="date"
          />
          <InputField
            label="Move-out Date"
            value={state.moveOutDate}
            onChange={(v) => setState((s) => ({ ...s, moveOutDate: v }))}
            type="date"
          />
        </div>

        <InputField
          label="Number of Occupants"
          value={state.numOccupants}
          onChange={(v) => setState((s) => ({ ...s, numOccupants: v }))}
          type="number"
          placeholder="1"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Emergency Contact Name"
            value={state.emergencyContactName}
            onChange={(v) => setState((s) => ({ ...s, emergencyContactName: v }))}
            placeholder="Full name"
          />
          <InputField
            label="Emergency Contact Phone"
            value={state.emergencyContactPhone}
            onChange={(v) => setState((s) => ({ ...s, emergencyContactPhone: v }))}
            placeholder="+44 7700 900000"
            type="tel"
          />
        </div>
      </div>
    )
  }

  if (ct === "landlord") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Landlord Details</h2>
          <p className="text-sm text-slate-500">Management preferences for this landlord.</p>
        </div>

        <SelectField
          label="Preferred Communication"
          value={state.landlordPreferredComms}
          onChange={(v) => setState((s) => ({ ...s, landlordPreferredComms: v }))}
          options={["Email", "Phone", "WhatsApp", "Post", "Any"].map((x) => ({ value: x, label: x }))}
          placeholder="Select preference…"
        />

        <TextareaField
          label="Responsibility Notes"
          value={state.responsibilityNotes}
          onChange={(v) => setState((s) => ({ ...s, responsibilityNotes: v }))}
          placeholder="e.g. Handles all minor maintenance under £200"
        />

        <InputField
          label="Number of Properties Owned"
          value={state.numPropertiesOwned}
          onChange={(v) => setState((s) => ({ ...s, numPropertiesOwned: v }))}
          placeholder="e.g. 3"
        />

        <ToggleSwitch
          label="Interested in Planning / Rent-to-Rent"
          checked={state.interestedInPlanning}
          onChange={(v) => setState((s) => ({ ...s, interestedInPlanning: v }))}
          description="Flag this landlord for planning set opportunities"
        />
      </div>
    )
  }

  if (ct === "legal" || ct === "accountant" || ct === "insurer") {
    const typeLabel = ct === "legal" ? "Legal" : ct === "accountant" ? "Accountant" : "Insurer"
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{typeLabel} Details</h2>
          <p className="text-sm text-slate-500">Professional details for this contact.</p>
        </div>

        <InputField
          label="Service Type / Specialisation"
          value={state.serviceSpecialisation}
          onChange={(v) => setState((s) => ({ ...s, serviceSpecialisation: v }))}
          placeholder="e.g. Residential conveyancing, BTL tax returns"
        />

        <InputField
          label="Company Registration"
          value={state.companyRegistration}
          onChange={(v) => setState((s) => ({ ...s, companyRegistration: v }))}
          placeholder="Optional"
        />

        <InputField
          label="Professional Body / Registration Number"
          value={state.professionalBody}
          onChange={(v) => setState((s) => ({ ...s, professionalBody: v }))}
          placeholder="e.g. SRA, ICAEW, FCA"
        />

        <InputField
          label="Renewal / Review Date"
          value={state.renewalDate}
          onChange={(v) => setState((s) => ({ ...s, renewalDate: v }))}
          type="date"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Additional Details</h2>
        <p className="text-sm text-slate-500">Any extra information for this contact.</p>
      </div>
      <TextareaField
        label="Additional Notes"
        value={state.additionalNotes}
        onChange={(v) => setState((s) => ({ ...s, additionalNotes: v }))}
        placeholder="Any relevant information for this contact…"
        rows={5}
      />
    </div>
  )
}

function Step6Documents({
  state,
  setState,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
}) {
  const updateDoc = (index: number, field: keyof DocumentSlot, value: string | File | null) => {
    setState((s) => {
      const docs = [...s.documents]
      docs[index] = { ...docs[index], [field]: value }
      return { ...s, documents: docs }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Documents</h2>
        <p className="text-sm text-slate-500">Upload relevant documents for this contact. You can do this after saving too.</p>
      </div>

      {state.documents.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
          <div style={{ color: "#cbd5e1" }} className="flex justify-center mb-2">
            <FileText className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-400">No document slots defined for this contact type.</p>
        </div>
      )}

      {state.documents.map((doc, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{doc.name}</p>
            {doc.file && (
              <div style={{ color: "#22c55e" }}><Check className="w-4 h-4" /></div>
            )}
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Upload file</label>
              <label className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50 transition">
                <div style={{ color: "#94a3b8" }}><Upload className="w-4 h-4" /></div>
                <span className="text-xs text-slate-500 truncate">
                  {doc.file ? doc.file.name : "Choose file…"}
                </span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => updateDoc(i, "file", e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Expiry date</label>
              <input
                type="date"
                value={doc.expiry}
                onChange={(e) => updateDoc(i, "expiry", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-400">
        You can upload documents after saving this contact from the contact detail page.
      </p>
    </div>
  )
}

function Step7PortalAccess({
  state,
  setState,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
}) {
  const contactName =
    state.entityType === "organisation"
      ? state.organisationName || "This contact"
      : [state.firstName, state.preferredName || state.lastName].filter(Boolean).join(" ") || "This contact"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Portal Access</h2>
        <p className="text-sm text-slate-500">Optionally grant this contact a secure portal link.</p>
      </div>

      <ToggleSwitch
        label="Enable supplier portal access"
        checked={state.portalAccessEnabled}
        onChange={(v) => setState((s) => ({ ...s, portalAccessEnabled: v }))}
        description="Contact will receive a secure link to submit quotes, upload documents and respond to job requests"
      />

      {state.portalAccessEnabled && (
        <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <SelectField
            label="Link Expiry"
            value={state.portalExpiry}
            onChange={(v) => setState((s) => ({ ...s, portalExpiry: v }))}
            options={PORTAL_EXPIRY_OPTIONS}
          />

          {state.portalExpiry === "never" && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <div style={{ color: "#f59e0b" }}><AlertCircle className="w-4 h-4 mt-0.5" /></div>
              <p className="text-xs text-amber-700">
                Never-expiring links are a security risk. We recommend setting an expiry date.
              </p>
            </div>
          )}

          <InputField
            label="Send Link To (email)"
            value={state.portalEmail || state.email}
            onChange={(v) => setState((s) => ({ ...s, portalEmail: v }))}
            type="email"
            placeholder="contact@example.com"
          />

          <div className="rounded-lg bg-white border border-blue-200 px-3 py-2.5">
            <p className="text-xs text-slate-400 mb-1">Preview message</p>
            <p className="text-sm text-slate-600">
              {contactName} will receive a secure link to submit quotes, upload documents and respond to job requests.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Step8Review({
  state,
  onJumpTo,
}: {
  state: WizardState
  onJumpTo: (step: number) => void
}) {
  const typeLabel = CONTACT_TYPE_OPTIONS.find((c) => c.value === state.contactType)?.label ?? state.contactType
  const displayName =
    state.entityType === "organisation"
      ? state.organisationName
      : [state.firstName, state.lastName].filter(Boolean).join(" ")

  const Section = ({
    title,
    step,
    children,
  }: {
    title: string
    step: number
    children: React.ReactNode
  }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <button
          type="button"
          onClick={() => onJumpTo(step)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>
      {children}
    </div>
  )

  const Row = ({ label, value }: { label: string; value: string | undefined | null }) =>
    value ? (
      <div className="flex gap-2 text-sm">
        <span className="text-slate-400 min-w-[130px] flex-shrink-0">{label}</span>
        <span className="text-slate-800 break-all">{value}</span>
      </div>
    ) : null

  const assembledAddress = [state.addressLine1, state.city, state.postcode, state.country]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Review & Create</h2>
        <p className="text-sm text-slate-500">Review the details below before creating the contact.</p>
      </div>

      <Section title="Contact Type" step={1}>
        <Row label="Type" value={typeLabel ?? undefined} />
        <Row label="Entity" value={state.entityType === "organisation" ? "Organisation" : "Person"} />
      </Section>

      <Section title="Details" step={2}>
        <Row label="Name" value={displayName} />
        {state.entityType === "person" && <Row label="Preferred Name" value={state.preferredName} />}
        {state.entityType === "organisation" && <Row label="Primary Contact" value={state.primaryContactName} />}
        <Row label="Notes" value={state.notes} />
        {state.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {state.tags.map((t) => (
              <span key={t.id} className="rounded-full bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                {t.label}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Communication" step={3}>
        <Row label="Email" value={state.email} />
        <Row label="Phone" value={state.phone} />
        <Row label="Secondary Phone" value={state.secondaryPhone} />
        <Row label="Website" value={state.website} />
        <Row label="Address" value={assembledAddress} />
        <Row label="Preferred Contact" value={state.preferredContact} />
      </Section>

      <Section title="Portal Access" step={7}>
        <Row label="Portal Enabled" value={state.portalAccessEnabled ? "Yes" : "No"} />
        {state.portalAccessEnabled && (
          <Row
            label="Link Expiry"
            value={PORTAL_EXPIRY_OPTIONS.find((o) => o.value === state.portalExpiry)?.label}
          />
        )}
      </Section>
    </div>
  )
}

// ─── Summary Rail ─────────────────────────────────────────────────────────────

function SummaryRail({
  state,
  currentStep,
}: {
  state: WizardState
  currentStep: number
}) {
  const typeOption = CONTACT_TYPE_OPTIONS.find((c) => c.value === state.contactType)
  const displayName =
    state.entityType === "organisation"
      ? state.organisationName
      : [state.firstName, state.lastName].filter(Boolean).join(" ")

  return (
    <div className="w-[280px] flex-shrink-0 sticky top-[60px] self-start space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Summary</p>
        </div>
        <div className="px-4 py-3 space-y-3">
          {typeOption ? (
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${typeOption.colour}`}>
              <typeOption.icon className="w-3 h-3" />
              {typeOption.label}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No type selected</p>
          )}

          {displayName ? (
            <p className="text-sm font-semibold text-slate-800">{displayName}</p>
          ) : (
            <p className="text-xs text-slate-300 italic">Name will appear here</p>
          )}

          {state.email && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mail className="w-3 h-3" />
              <span className="truncate">{state.email}</span>
            </div>
          )}

          {state.phone && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="w-3 h-3" />
              {state.phone}
            </div>
          )}

          {state.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {state.tags.map((t) => (
                <span key={t.id} className="rounded-full bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5">
                  {t.label}
                </span>
              ))}
            </div>
          )}

          {state.entityType === "organisation" && state.primaryContactName && (
            <p className="text-xs text-slate-400">Contact: {state.primaryContactName}</p>
          )}

          {state.contactType === "supplier" && state.supplierServices.length > 0 && (
            <p className="text-xs text-slate-400">
              Services: {state.supplierServices.slice(0, 3).join(", ")}
              {state.supplierServices.length > 3 && ` +${state.supplierServices.length - 3} more`}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-blue-700">Tip</p>
        <p className="text-xs text-blue-600 leading-relaxed">{STEP_TIPS[currentStep]}</p>
      </div>
    </div>
  )
}

// ─── Stepper Rail ─────────────────────────────────────────────────────────────

function StepperRail({
  currentStep,
  completedSteps,
}: {
  currentStep: number
  completedSteps: Set<number>
}) {
  return (
    <div className="w-[240px] flex-shrink-0 sticky top-[60px] self-start">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Steps</p>
        <ol className="space-y-0">
          {STEP_NAMES.map((name, i) => {
            const stepNum = i + 1
            const isActive = stepNum === currentStep
            const isDone = completedSteps.has(stepNum)

            return (
              <li key={stepNum} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0",
                      isDone
                        ? "border-blue-600 bg-blue-600 text-white"
                        : isActive
                        ? "border-blue-600 bg-white text-blue-600"
                        : "border-slate-200 bg-slate-50 text-slate-400",
                    ].join(" ")}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  {i < STEP_NAMES.length - 1 && (
                    <div
                      className={["w-px flex-1 my-1", isDone ? "bg-blue-300" : "bg-slate-200"].join(" ")}
                      style={{ minHeight: 20 }}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className={[
                      "text-sm leading-tight mt-1",
                      isActive
                        ? "font-semibold text-blue-700"
                        : isDone
                        ? "font-medium text-slate-700"
                        : "text-slate-400",
                    ].join(" ")}
                  >
                    {name}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NewContactPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const createContact = useCreateContact()

  const [step, setStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<string[]>([])
  const [state, setState] = useState<WizardState>({ ...defaultState })
  const [succeeded, setSucceeded] = useState(false)
  const [createdContact, setCreatedContact] = useState<{ id: string; name: string; type: string } | null>(null)

  // Auto-populate document slots when contactType changes
  const handleSetState: React.Dispatch<React.SetStateAction<WizardState>> = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        if (next.contactType !== prev.contactType) {
          next.documents = getDocumentSlots(next.contactType)
        }
        return next
      })
    },
    []
  )

  const validate = (s: number): string[] => {
    const errs: string[] = []
    if (s === 1 && !state.contactType) {
      errs.push("Please select a contact type before continuing")
    }
    if (s === 2) {
      if (state.entityType === "person") {
        if (!state.firstName.trim()) errs.push("First name is required")
        if (!state.lastName.trim()) errs.push("Last name is required")
      } else {
        if (!state.organisationName.trim()) errs.push("Organisation name is required")
      }
    }
    if (s === 3) {
      if (!state.email.trim()) errs.push("Email is required")
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) errs.push("Email address is not valid")
    }
    return errs
  }

  const handleNext = () => {
    const errs = validate(step)
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setCompletedSteps((prev) => new Set(prev).add(step))
    setStep((s) => Math.min(s + 1, 8))
  }

  const handleBack = () => {
    setErrors([])
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleSkip = () => {
    setErrors([])
    setCompletedSteps((prev) => new Set(prev).add(step))
    setStep((s) => Math.min(s + 1, 8))
  }

  const handleJumpTo = (targetStep: number) => {
    setErrors([])
    setStep(targetStep)
  }

  const handleCreate = async () => {
    if (!workspace) return

    const fullName =
      state.entityType === "organisation"
        ? state.organisationName.trim()
        : [state.firstName, state.lastName].filter(Boolean).join(" ").trim()

    const typeLabel =
      CONTACT_TYPE_OPTIONS.find((c) => c.value === state.contactType)?.label ?? "Contact"

    const payload: InsertContact = {
      workspace_id: workspace.id,
      contact_type: state.contactType ?? "other",
      full_name: fullName || "Unnamed Contact",
      email: state.email.trim() || null,
      phone: state.phone.trim() || null,
      company_name:
        state.entityType === "organisation" ? state.organisationName.trim() || null : null,
      address_line1: state.addressLine1.trim() || null,
      city: state.city.trim() || null,
      postcode: state.postcode.trim() || null,
      notes: state.notes.trim() || null,
      // Persist selected supplier service categories alongside tags so they
      // surface in the supplier service column/filter/detail (deriveSupplierCategories
      // reads category/subcategory/tags). Without this they'd be lost on save.
      tags: (() => {
        const merged = [
          ...state.tags.map((t) => t.label),
          ...(state.contactType === "supplier" ? state.supplierServices : []),
        ].filter((v, i, a) => v && a.indexOf(v) === i)
        return merged.length > 0 ? merged : null
      })(),
      status: "active",
      is_demo: false,
    }

    try {
      const result = await createContact.mutateAsync(payload)
      setCreatedContact({ id: result.id, name: fullName || "New Contact", type: typeLabel })
      setSucceeded(true)
    } catch {
      setErrors(["Failed to create contact. Please check your connection and try again."])
    }
  }

  const handleReset = () => {
    setSucceeded(false)
    setCreatedContact(null)
    setState({ ...defaultState })
    setStep(1)
    setCompletedSteps(new Set())
    setErrors([])
  }

  // ─── Success screen ───────────────────────────────────────────────────────────
  if (succeeded && createdContact) {
    return (
      <div className="space-y-0">
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <div style={{ color: "#22c55e" }}><CheckCircle2 className="w-9 h-9" /></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Contact created!</h1>
              <p className="text-slate-500 mt-1 text-sm">
                {createdContact.name} has been added as a {createdContact.type}.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => router.push(`/app/contacts/${createdContact.id}`)}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm transition"
              >
                View Contact
              </button>
              <button
                onClick={handleReset}
                className="w-full rounded-xl border border-slate-200 text-slate-700 font-medium py-2.5 text-sm hover:bg-slate-50 transition"
              >
                Add Another
              </button>
              <button
                onClick={() => router.push("/app/contacts")}
                className="w-full rounded-xl border border-slate-200 text-slate-500 font-medium py-2.5 text-sm hover:bg-slate-50 transition"
              >
                Back to Contacts
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const skippableSteps = new Set([4, 6, 7])

  return (
    <div className="space-y-0">
      {/* Top breadcrumb bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white border-b border-slate-100 px-6 py-3.5">
        <button
          onClick={() => router.push("/app/contacts")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Contacts
        </button>
        <div style={{ color: "#e2e8f0" }}><ChevronRight className="w-4 h-4" /></div>
        <span className="text-sm font-semibold text-slate-800">New Contact</span>
        <span className="ml-auto text-xs text-slate-400">
          Step {step} of {STEP_NAMES.length}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex gap-6 px-6 py-6 max-w-[1200px] mx-auto">
        {/* Left stepper */}
        <StepperRail currentStep={step} completedSteps={completedSteps} />

        {/* Center step card */}
        <div className="flex-1 min-w-0">
          {!workspace && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div style={{ color: "#f59e0b" }}><AlertCircle className="w-4 h-4" /></div>
              <p className="text-sm text-amber-700">
                Connect a workspace to save contacts.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-6">
              {step === 1 && (
                <Step1TypeSelector
                  state={state}
                  setState={handleSetState}
                  errors={errors}
                />
              )}
              {step === 2 && (
                <Step2Details state={state} setState={setState} errors={errors} />
              )}
              {step === 3 && (
                <Step3Communication state={state} setState={setState} errors={errors} />
              )}
              {step === 4 && (
                <Step4RelationshipLinks state={state} setState={setState} />
              )}
              {step === 5 && (
                <Step5TypeSpecific state={state} setState={setState} />
              )}
              {step === 6 && (
                <Step6Documents state={state} setState={setState} />
              )}
              {step === 7 && (
                <Step7PortalAccess state={state} setState={setState} />
              )}
              {step === 8 && (
                <Step8Review state={state} onJumpTo={handleJumpTo} />
              )}
            </div>

            {/* Footer nav */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {skippableSteps.has(step) && step < 8 && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 transition"
                  >
                    Skip
                  </button>
                )}

                {step < 8 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm font-semibold transition"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!workspace || createContact.isPending}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 text-sm font-semibold transition"
                  >
                    {createContact.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {createContact.isPending ? "Creating…" : "Create Contact"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Inline error banner (steps 2+) */}
          {errors.length > 0 && step !== 1 && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <div style={{ color: "#ef4444" }} className="mt-0.5 flex-shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <ul className="text-sm text-red-600 space-y-0.5 list-disc list-inside">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Right summary rail */}
        <SummaryRail state={state} currentStep={step} />
      </div>
    </div>
  )
}
