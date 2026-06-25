"use client"

import type { ContactType } from "@/types/database"

export type EntityType = "person" | "organisation"
export type PreferredContact = "email" | "phone" | "whatsapp" | "post"

export interface TagItem {
  id: string
  label: string
}

export interface DocumentSlot {
  name: string
  file: File | null
  expiry: string
}

export interface WizardState {
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
  /** R2 storage key for the contact photo / organisation logo (persisted as avatar_url). */
  avatarKey: string | null

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

export const defaultState: WizardState = {
  contactType: null,
  entityType: "person",
  firstName: "",
  lastName: "",
  preferredName: "",
  organisationName: "",
  primaryContactName: "",
  notes: "",
  tags: [],
  avatarKey: null,
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

export const CONTACT_TYPE_OPTIONS_NEW: {
  value: ContactType
  label: string
  desc: string
  colour: string
}[] = [
  { value: "tenant", label: "Tenant", desc: "Renting a property from you", colour: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { value: "landlord", label: "Landlord", desc: "Property owner you manage for", colour: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "supplier", label: "Supplier / Contractor", desc: "Tradesperson, contractor or vendor", colour: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "agent", label: "Agent", desc: "Letting or estate agent", colour: "border-violet-200 bg-violet-50 text-violet-700" },
  { value: "applicant", label: "Applicant", desc: "Prospective tenant or enquiry", colour: "border-sky-200 bg-sky-50 text-sky-700" },
  { value: "post_tenant", label: "Past Tenant", desc: "Previously rented from you", colour: "border-slate-200 bg-slate-50 text-slate-600" },
  { value: "guarantor", label: "Guarantor", desc: "Guaranteeing a tenant's obligations", colour: "border-purple-200 bg-purple-50 text-purple-700" },
  { value: "local_authority", label: "Local Authority", desc: "Council or government body", colour: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  { value: "legal", label: "Solicitor / Legal", desc: "Solicitor, barrister or legal adviser", colour: "border-slate-200 bg-slate-50 text-slate-700" },
  { value: "accountant", label: "Accountant", desc: "Accountant, bookkeeper or tax adviser", colour: "border-teal-200 bg-teal-50 text-teal-700" },
  { value: "insurer", label: "Insurer", desc: "Insurance provider", colour: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  { value: "investor", label: "Investor", desc: "Property investor or backer", colour: "border-green-200 bg-green-50 text-green-700" },
  { value: "other", label: "Other", desc: "Other contact type", colour: "border-slate-200 bg-slate-50 text-slate-600" },
]

export const STEP_NAMES = [
  "Contact Type",
  "Details",
  "Communication",
  "Type-Specific",
  "Documents",
  "Portal Access",
  "Review & Create",
]

export const STEP_TIPS: Record<number, string> = {
  1: "Selecting the right type ensures you see the most relevant fields and documents for this contact.",
  2: "A clear display name helps your team instantly recognise this contact across Propvora.",
  3: "Adding multiple contact methods improves response rates and keeps your data complete.",
  4: "These details are unique to this contact type and help you track obligations and service scope.",
  5: "Uploading key documents now keeps everything in one place and triggers expiry reminders automatically.",
  6: "Supplier portal access lets contractors submit quotes and upload certificates without needing full system access.",
  7: "Review everything before saving. You can jump back to any section to make changes.",
}

export const PORTAL_EXPIRY_OPTIONS = [
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "after_job", label: "After Job Completion" },
  { value: "never", label: "Never Expires" },
]

/**
 * Build a wizard initial state from quick-add hand-off query params, e.g.
 * /property-manager/contacts/new?entity=person&type=tenant&firstName=Jane&...
 * Unknown / missing params fall back to the wizard defaults, so a bare /new
 * route still opens cleanly.
 */
export function stateFromParams(params: URLSearchParams): WizardState {
  const entity: EntityType = params.get("entity") === "organisation" ? "organisation" : "person"
  const rawType = params.get("type")
  const validTypes = new Set(CONTACT_TYPE_OPTIONS_NEW.map((o) => o.value as string))
  const contactType = (rawType && validTypes.has(rawType) ? rawType : null) as ContactType | null
  const state: WizardState = {
    ...defaultState,
    entityType: entity,
    contactType,
    firstName: params.get("firstName") ?? "",
    lastName: params.get("lastName") ?? "",
    organisationName: params.get("org") ?? "",
    email: params.get("email") ?? "",
    phone: params.get("phone") ?? "",
    city: params.get("city") ?? "",
    avatarKey: params.get("avatar") ?? null,
  }
  // Pre-populate the type-driven document slots so Step 6 reflects the type.
  state.documents = getDocumentSlots(contactType)
  return state
}

export function getDocumentSlots(contactType: ContactType | null): DocumentSlot[] {
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
