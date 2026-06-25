/**
 * Contact `metadata` jsonb helpers.
 *
 * The New Contact wizard's type-specific step (supplier / applicant / tenant /
 * landlord / professional) is persisted into `contacts.metadata` namespaced by
 * a `type_details` key, so it survives and can be surfaced on the contact detail
 * page. These helpers are the single source of truth for that shape — both the
 * wizard (write) and the detail page (read) go through here.
 */

import type { EnquiryInfo, SupplierInfo } from "@/components/contacts/contact-detail/types"

export interface TypeDetails {
  kind: "supplier" | "applicant" | "tenant" | "landlord" | "professional" | "other"
  [key: string]: unknown
}

const numOrNull = (v: string | undefined): number | null => {
  if (v == null || v.trim() === "") return null
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}

const strOrNull = (v: string | undefined): string | null => {
  const t = (v ?? "").trim()
  return t === "" ? null : t
}

const csvToList = (v: string | undefined): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

/**
 * Build the namespaced type-specific details from wizard state. Returns null
 * when the contact type has no meaningful extra data so we never write an empty
 * object (keeps `metadata` clean and lets the DB default apply).
 */
export function buildTypeDetails(state: {
  contactType: string | null
  supplierServices: string[]
  coveragePostcodes: string
  hourlyRate: string
  calloutFee: string
  emergencyAvailable: boolean
  preferredSupplier: boolean
  insuranceExpiry: string
  enquirySource: string
  budgetMin: string
  budgetMax: string
  desiredMoveDate: string
  preferredArea: string
  preferredPropertyTypes: string[]
  applicantNotes: string
  currentRent: string
  moveInDate: string
  moveOutDate: string
  numOccupants: string
  emergencyContactName: string
  emergencyContactPhone: string
  landlordPreferredComms: string
  responsibilityNotes: string
  interestedInPlanning: boolean
  numPropertiesOwned: string
  serviceSpecialisation: string
  companyRegistration: string
  professionalBody: string
  renewalDate: string
  additionalNotes: string
}): TypeDetails | null {
  const ct = state.contactType

  if (ct === "supplier") {
    const d: TypeDetails = { kind: "supplier" }
    if (state.supplierServices.length) d.service_categories = state.supplierServices
    const cov = csvToList(state.coveragePostcodes)
    if (cov.length) d.coverage_postcodes = cov
    if (numOrNull(state.hourlyRate) != null) d.hourly_rate = numOrNull(state.hourlyRate)
    if (numOrNull(state.calloutFee) != null) d.callout_fee = numOrNull(state.calloutFee)
    if (state.emergencyAvailable) d.emergency_available = true
    if (state.preferredSupplier) d.preferred_supplier = true
    if (strOrNull(state.insuranceExpiry)) d.insurance_expiry = strOrNull(state.insuranceExpiry)
    return Object.keys(d).length > 1 ? d : null
  }

  if (ct === "applicant") {
    const d: TypeDetails = { kind: "applicant" }
    if (strOrNull(state.enquirySource)) d.source = strOrNull(state.enquirySource)
    if (numOrNull(state.budgetMin) != null) d.budget_min = numOrNull(state.budgetMin)
    if (numOrNull(state.budgetMax) != null) d.budget_max = numOrNull(state.budgetMax)
    if (strOrNull(state.desiredMoveDate)) d.move_date = strOrNull(state.desiredMoveDate)
    if (strOrNull(state.preferredArea)) d.preferred_area = strOrNull(state.preferredArea)
    if (state.preferredPropertyTypes.length) d.preferred_property_types = state.preferredPropertyTypes
    if (strOrNull(state.applicantNotes)) d.notes = strOrNull(state.applicantNotes)
    return Object.keys(d).length > 1 ? d : null
  }

  if (ct === "tenant" || ct === "post_tenant") {
    const d: TypeDetails = { kind: "tenant" }
    if (numOrNull(state.currentRent) != null) d.current_rent = numOrNull(state.currentRent)
    if (strOrNull(state.moveInDate)) d.move_in_date = strOrNull(state.moveInDate)
    if (strOrNull(state.moveOutDate)) d.move_out_date = strOrNull(state.moveOutDate)
    if (numOrNull(state.numOccupants) != null) d.num_occupants = numOrNull(state.numOccupants)
    if (strOrNull(state.emergencyContactName)) d.emergency_contact_name = strOrNull(state.emergencyContactName)
    if (strOrNull(state.emergencyContactPhone)) d.emergency_contact_phone = strOrNull(state.emergencyContactPhone)
    return Object.keys(d).length > 1 ? d : null
  }

  if (ct === "landlord" || ct === "investor") {
    const d: TypeDetails = { kind: "landlord" }
    if (strOrNull(state.landlordPreferredComms)) d.preferred_comms = strOrNull(state.landlordPreferredComms)
    if (strOrNull(state.responsibilityNotes)) d.responsibility_notes = strOrNull(state.responsibilityNotes)
    if (numOrNull(state.numPropertiesOwned) != null) d.num_properties_owned = numOrNull(state.numPropertiesOwned)
    if (state.interestedInPlanning) d.interested_in_planning = true
    return Object.keys(d).length > 1 ? d : null
  }

  if (ct === "legal" || ct === "accountant" || ct === "insurer") {
    const d: TypeDetails = { kind: "professional" }
    if (strOrNull(state.serviceSpecialisation)) d.specialisation = strOrNull(state.serviceSpecialisation)
    if (strOrNull(state.companyRegistration)) d.company_registration = strOrNull(state.companyRegistration)
    if (strOrNull(state.professionalBody)) d.professional_body = strOrNull(state.professionalBody)
    if (strOrNull(state.renewalDate)) d.renewal_date = strOrNull(state.renewalDate)
    return Object.keys(d).length > 1 ? d : null
  }

  const note = strOrNull(state.additionalNotes)
  if (note) return { kind: "other", notes: note }
  return null
}

/** Read the namespaced type-details out of a contact's metadata jsonb. */
export function readTypeDetails(metadata: unknown): TypeDetails | null {
  if (!metadata || typeof metadata !== "object") return null
  const td = (metadata as Record<string, unknown>).type_details
  if (!td || typeof td !== "object") return null
  return td as TypeDetails
}

/** Map persisted supplier metadata to the detail page's SupplierInfo shape. */
export function metadataToSupplierInfo(metadata: unknown): SupplierInfo | undefined {
  const d = readTypeDetails(metadata)
  if (!d || d.kind !== "supplier") return undefined
  return {
    service_categories: (d.service_categories as string[]) ?? [],
    coverage_postcodes: (d.coverage_postcodes as string[]) ?? [],
    hourly_rate: (d.hourly_rate as number) ?? 0,
    callout_fee: (d.callout_fee as number) ?? 0,
    emergency_available: (d.emergency_available as boolean) ?? false,
    preferred_supplier: (d.preferred_supplier as boolean) ?? false,
    backup_supplier: false,
    insurance_expiry: (d.insurance_expiry as string) ?? "—",
    compliance_status: "unknown",
    average_response_time: 0,
    jobs_completed: 0,
    internal_rating: 0,
  }
}

/** Map persisted applicant metadata to the detail page's EnquiryInfo shape. */
export function metadataToEnquiryInfo(metadata: unknown): EnquiryInfo | undefined {
  const d = readTypeDetails(metadata)
  if (!d || d.kind !== "applicant") return undefined
  const types = (d.preferred_property_types as string[]) ?? []
  return {
    source: (d.source as string) ?? "—",
    budget_min: (d.budget_min as number) ?? 0,
    budget_max: (d.budget_max as number) ?? 0,
    move_date: (d.move_date as string) ?? "—",
    preferred_area: (d.preferred_area as string) ?? "—",
    preferred_type: types.length ? types.join(", ") : "—",
    status: "active",
  }
}

const LABELS: Record<string, string> = {
  current_rent: "Current Rent (£/mo)",
  move_in_date: "Move-in Date",
  move_out_date: "Move-out Date",
  num_occupants: "Occupants",
  emergency_contact_name: "Emergency Contact",
  emergency_contact_phone: "Emergency Phone",
  preferred_comms: "Preferred Comms",
  responsibility_notes: "Responsibility Notes",
  num_properties_owned: "Properties Owned",
  interested_in_planning: "Interested in Planning",
  specialisation: "Specialisation",
  company_registration: "Company Registration",
  professional_body: "Professional Body",
  renewal_date: "Renewal / Review Date",
  notes: "Notes",
}

/**
 * Generic label/value rows for surfacing any persisted type-details that don't
 * have a dedicated tab (tenant / landlord / professional / other). Excludes the
 * `kind` discriminator and types handled by bespoke tabs (supplier/applicant).
 */
export function typeDetailRows(metadata: unknown): { label: string; value: string }[] {
  const d = readTypeDetails(metadata)
  if (!d || d.kind === "supplier" || d.kind === "applicant") return []
  return Object.entries(d)
    .filter(([k, v]) => k !== "kind" && v != null && v !== "")
    .map(([k, v]) => ({
      label: LABELS[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: typeof v === "boolean" ? (v ? "Yes" : "No") : String(v),
    }))
}
