// Shared types for the contact detail component tree

export type ContactType = "tenant" | "landlord" | "supplier" | "applicant" | "agent" | "legal" | "other"
export type HealthStatus = "healthy" | "risk" | "follow_up" | "needs_data"

export interface InvoiceRecord { ref: string; amount: number; status: string; date: string }
export interface ActivityRecord { action: string; time: string; type: string }
export interface JobRecord { title: string; status: string; date: string; cost: number; property: string }

export interface TenancyInfo {
  property: string; unit: string; rent: number; deposit: number
  start: string; end: string; status: string; deposit_scheme: string; guarantor: string | null
}
export interface EnquiryInfo {
  source: string; budget_min: number; budget_max: number; move_date: string
  preferred_area: string; preferred_type: string; status: string
}
export interface SupplierInfo {
  service_categories: string[]; coverage_postcodes: string[]
  hourly_rate: number; callout_fee: number; emergency_available: boolean
  preferred_supplier: boolean; backup_supplier: boolean; insurance_expiry: string
  compliance_status: string; average_response_time: number; jobs_completed: number
  internal_rating: number
}
export interface PlanningSet { name: string; status: string; created: string }
export interface LandlordOffer { ref: string; property: string; status: string; amount: number }

export interface ContactDetail {
  id: string; full_name: string; email: string; phone: string
  contact_type: ContactType; status: string; company_name: string | null
  city: string; postcode: string; address_line1: string | null
  tags: string[]; arrears: number; linked_properties: number; active_tenancies: number
  last_contacted: string | null; next_follow_up: string | null; health: HealthStatus
  portal_status: string | null; notes: string | null
  service_categories?: string[]
  tenancy?: TenancyInfo; invoices?: InvoiceRecord[]; activity?: ActivityRecord[]
  properties?: string[]; planning_sets?: PlanningSet[]; landlord_offers?: LandlordOffer[]
  enquiry?: EnquiryInfo; supplier?: SupplierInfo; jobs?: JobRecord[]
}

export type ContactSaveFn = (field: string, value: string) => Promise<void>
