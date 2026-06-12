export type ContactPrimaryType =
  | "landlord" | "tenant" | "post_tenant" | "applicant" | "guarantor"
  | "supplier" | "agent" | "local_authority" | "housing_association"
  | "legal" | "accountant" | "insurer" | "utility_provider" | "broadband"
  | "cleaning" | "maintenance" | "emergency_contractor" | "investor"
  | "affiliate" | "other"

export type ContactEntityType = "person" | "organisation"

export type ContactHealth = "healthy" | "watch" | "follow_up" | "risk" | "inactive" | "needs_data"

export type PortalStatus = "not_created" | "created" | "email_sent" | "opened" | "active" | "expired" | "revoked" | "completed"

export interface ContactMeta {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  contact_type: ContactPrimaryType
  status: "active" | "inactive" | "archived"
  city: string | null
  postcode: string | null
  tags: string[] | null
  avatar_url: string | null
  arrears?: number
  linked_properties?: number
  active_tenancies?: number
  last_contacted?: string | null
  next_follow_up?: string | null
  health?: ContactHealth
  portal_status?: PortalStatus | null
}

export interface SupplierProfile {
  contact_id: string
  service_categories: string[]
  coverage_postcodes: string[]
  coverage_radius: number | null
  hourly_rate: number | null
  callout_fee: number | null
  emergency_available: boolean
  preferred_supplier: boolean
  backup_supplier: boolean
  insurance_expiry: string | null
  compliance_status: "valid" | "expiring_soon" | "expired" | "unknown"
  average_response_time: number | null
  jobs_completed: number
  internal_rating: number | null
}

export const CONTACT_TYPE_LABELS: Record<ContactPrimaryType, string> = {
  landlord: "Landlord", tenant: "Tenant", post_tenant: "Past Tenant",
  applicant: "Applicant", guarantor: "Guarantor", supplier: "Supplier",
  agent: "Agent", local_authority: "Local Authority", housing_association: "Housing Association",
  legal: "Solicitor / Legal", accountant: "Accountant", insurer: "Insurer",
  utility_provider: "Utility Provider", broadband: "Broadband / Telecoms",
  cleaning: "Cleaner", maintenance: "Maintenance", emergency_contractor: "Emergency Contractor",
  investor: "Investor", affiliate: "Affiliate", other: "Other",
}

export const CONTACT_TYPE_COLOURS: Record<ContactPrimaryType, { bg: string; text: string; border: string }> = {
  tenant:               { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  post_tenant:          { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200" },
  landlord:             { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  applicant:            { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200" },
  guarantor:            { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  supplier:             { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  agent:                { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  local_authority:      { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200" },
  housing_association:  { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200" },
  legal:                { bg: "bg-slate-50",   text: "text-slate-700",   border: "border-slate-200" },
  accountant:           { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  insurer:              { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
  utility_provider:     { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  broadband:            { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  cleaning:             { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  maintenance:          { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  emergency_contractor: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  investor:             { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200" },
  affiliate:            { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200" },
  other:                { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200" },
}

export const HEALTH_CONFIG: Record<ContactHealth, { label: string; colour: string; dot: string }> = {
  healthy:    { label: "Healthy",    colour: "text-emerald-600", dot: "bg-emerald-500" },
  watch:      { label: "Watch",      colour: "text-amber-600",   dot: "bg-amber-500" },
  follow_up:  { label: "Follow-up",  colour: "text-blue-600",    dot: "bg-blue-500" },
  risk:       { label: "At Risk",    colour: "text-red-600",     dot: "bg-red-500" },
  inactive:   { label: "Inactive",   colour: "text-slate-500",   dot: "bg-slate-400" },
  needs_data: { label: "Needs Data", colour: "text-violet-600",  dot: "bg-violet-500" },
}

export const SUPPLIER_SERVICES = [
  "Plumbing","Electrical","Gas / Heating","Cleaning","Gardening","Handyman",
  "Locksmith","Pest Control","Waste Removal","Broadband / Telecoms","Utilities",
  "Inventory Clerk","Inspection","Compliance","Decorator","Builder","Emergency Repairs","Other",
]
