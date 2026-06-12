// ============================================================
// Compliance module — pure types & config constants
// NO "use client" — safe for server components and migrations
// ============================================================

export type CertificateType =
  | "gas_safety" | "eicr" | "epc" | "fire_risk_assessment"
  | "smoke_alarm_record" | "co_alarm_record" | "legionella_risk"
  | "pat_test" | "asbestos_survey" | "hmo_licence" | "selective_licence"
  | "additional_licence" | "building_insurance" | "landlord_insurance"
  | "public_liability" | "contents_insurance" | "lift_loler"
  | "boiler_service" | "appliance_service" | "deposit_protection"
  | "right_to_rent" | "tenancy_agreement" | "inventory_checkin"
  | "checkout_report" | "other"

export type CertificateStatus =
  | "draft" | "pending" | "valid" | "expiring_soon" | "expired"
  | "renewal_scheduled" | "renewed" | "superseded" | "missing"
  | "not_required" | "archived"

export type InspectionType =
  | "routine" | "move_in" | "move_out" | "inventory"
  | "safety" | "maintenance" | "hmo_room" | "fire_safety"
  | "supplier_site_visit" | "compliance_review" | "document_review"
  | "pre_tenancy" | "post_tenancy" | "other"

export type InspectionStatus =
  | "draft" | "scheduled" | "due" | "overdue" | "completed"
  | "passed" | "failed" | "actions_required" | "follow_up_scheduled"
  | "cancelled" | "archived"

export type InspectionOutcome = "pass" | "fail" | "pass_with_actions" | "inconclusive" | "cancelled"

export type ComplianceDocumentType =
  | "certificate" | "inspection_evidence" | "insurance" | "licence"
  | "agreement" | "tenant_document" | "supplier_document"
  | "photo_evidence" | "pdf_evidence" | "compliance_note"
  | "email_evidence" | "other"

export type ComplianceDocumentStatus =
  | "draft" | "uploaded" | "needs_review" | "verified"
  | "rejected" | "expired" | "superseded" | "archived"

export type ComplianceRiskLevel = "healthy" | "watch" | "at_risk" | "critical" | "needs_data"

export type SupplierDocType =
  | "public_liability" | "professional_indemnity" | "gas_safe"
  | "niceic_electrical" | "waste_carrier" | "dbs_evidence"
  | "risk_assessment" | "method_statement" | "trade_certificate" | "other"

export type OperationProfile =
  | "long_term_let" | "rent_to_rent" | "hmo" | "student_let"
  | "serviced_accommodation" | "holiday_let" | "commercial"
  | "mixed_use" | "dev_flip" | "co_living"

// ============================================================
// Config maps
// ============================================================

export const CERTIFICATE_TYPE_CONFIG: Record<
  CertificateType,
  { label: string; renewalMonths: number; critical: boolean }
> = {
  gas_safety:           { label: "Gas Safety Certificate",        renewalMonths: 12,  critical: true },
  eicr:                 { label: "EICR / Electrical Safety",      renewalMonths: 60,  critical: true },
  epc:                  { label: "EPC",                           renewalMonths: 120, critical: true },
  fire_risk_assessment: { label: "Fire Risk Assessment",          renewalMonths: 12,  critical: true },
  smoke_alarm_record:   { label: "Smoke Alarm Record",            renewalMonths: 12,  critical: true },
  co_alarm_record:      { label: "CO Alarm Record",               renewalMonths: 12,  critical: true },
  legionella_risk:      { label: "Legionella Risk Assessment",    renewalMonths: 24,  critical: false },
  pat_test:             { label: "PAT Test",                      renewalMonths: 12,  critical: false },
  asbestos_survey:      { label: "Asbestos Survey",               renewalMonths: 0,   critical: false },
  hmo_licence:          { label: "HMO Licence",                   renewalMonths: 60,  critical: true },
  selective_licence:    { label: "Selective Licence",             renewalMonths: 60,  critical: true },
  additional_licence:   { label: "Additional Licence",            renewalMonths: 60,  critical: true },
  building_insurance:   { label: "Building Insurance",            renewalMonths: 12,  critical: true },
  landlord_insurance:   { label: "Landlord Insurance",            renewalMonths: 12,  critical: true },
  public_liability:     { label: "Public Liability Insurance",    renewalMonths: 12,  critical: false },
  contents_insurance:   { label: "Contents Insurance",            renewalMonths: 12,  critical: false },
  lift_loler:           { label: "Lift / LOLER Certificate",      renewalMonths: 12,  critical: true },
  boiler_service:       { label: "Boiler Service Record",         renewalMonths: 12,  critical: false },
  appliance_service:    { label: "Appliance Service Record",      renewalMonths: 12,  critical: false },
  deposit_protection:   { label: "Deposit Protection Evidence",   renewalMonths: 0,   critical: true },
  right_to_rent:        { label: "Right to Rent Evidence",        renewalMonths: 0,   critical: true },
  tenancy_agreement:    { label: "Tenancy Agreement",             renewalMonths: 0,   critical: true },
  inventory_checkin:    { label: "Inventory / Check-in Report",   renewalMonths: 0,   critical: false },
  checkout_report:      { label: "Checkout Report",               renewalMonths: 0,   critical: false },
  other:                { label: "Other",                         renewalMonths: 12,  critical: false },
}

export const CERTIFICATE_STATUS_CONFIG: Record<
  CertificateStatus,
  { label: string; colour: string; bg: string }
> = {
  draft:             { label: "Draft",             colour: "#64748B", bg: "#F8FAFC" },
  pending:           { label: "Pending",           colour: "#D97706", bg: "#FFFBEB" },
  valid:             { label: "Valid",             colour: "#059669", bg: "#ECFDF5" },
  expiring_soon:     { label: "Expiring Soon",     colour: "#D97706", bg: "#FFFBEB" },
  expired:           { label: "Expired",           colour: "#DC2626", bg: "#FEF2F2" },
  renewal_scheduled: { label: "Renewal Scheduled", colour: "#2563EB", bg: "#EFF6FF" },
  renewed:           { label: "Renewed",           colour: "#059669", bg: "#ECFDF5" },
  superseded:        { label: "Superseded",        colour: "#64748B", bg: "#F8FAFC" },
  missing:           { label: "Missing",           colour: "#DC2626", bg: "#FEF2F2" },
  not_required:      { label: "Not Required",      colour: "#64748B", bg: "#F8FAFC" },
  archived:          { label: "Archived",          colour: "#64748B", bg: "#F8FAFC" },
}

export const INSPECTION_STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; colour: string; bg: string }
> = {
  draft:               { label: "Draft",              colour: "#64748B", bg: "#F8FAFC" },
  scheduled:           { label: "Scheduled",          colour: "#2563EB", bg: "#EFF6FF" },
  due:                 { label: "Due",                colour: "#D97706", bg: "#FFFBEB" },
  overdue:             { label: "Overdue",            colour: "#DC2626", bg: "#FEF2F2" },
  completed:           { label: "Completed",          colour: "#059669", bg: "#ECFDF5" },
  passed:              { label: "Passed",             colour: "#059669", bg: "#ECFDF5" },
  failed:              { label: "Failed",             colour: "#DC2626", bg: "#FEF2F2" },
  actions_required:    { label: "Actions Required",   colour: "#D97706", bg: "#FFFBEB" },
  follow_up_scheduled: { label: "Follow-up Scheduled",colour: "#2563EB", bg: "#EFF6FF" },
  cancelled:           { label: "Cancelled",          colour: "#64748B", bg: "#F8FAFC" },
  archived:            { label: "Archived",           colour: "#64748B", bg: "#F8FAFC" },
}

export const DOCUMENT_STATUS_CONFIG: Record<
  ComplianceDocumentStatus,
  { label: string; colour: string; bg: string }
> = {
  draft:        { label: "Draft",        colour: "#64748B", bg: "#F8FAFC" },
  uploaded:     { label: "Uploaded",     colour: "#2563EB", bg: "#EFF6FF" },
  needs_review: { label: "Needs Review", colour: "#D97706", bg: "#FFFBEB" },
  verified:     { label: "Verified",     colour: "#059669", bg: "#ECFDF5" },
  rejected:     { label: "Rejected",     colour: "#DC2626", bg: "#FEF2F2" },
  expired:      { label: "Expired",      colour: "#DC2626", bg: "#FEF2F2" },
  superseded:   { label: "Superseded",   colour: "#64748B", bg: "#F8FAFC" },
  archived:     { label: "Archived",     colour: "#64748B", bg: "#F8FAFC" },
}

export const RISK_LEVEL_CONFIG: Record<
  ComplianceRiskLevel,
  { label: string; colour: string; bg: string }
> = {
  healthy:    { label: "Healthy",    colour: "#059669", bg: "#ECFDF5" },
  watch:      { label: "Watch",      colour: "#D97706", bg: "#FFFBEB" },
  at_risk:    { label: "At Risk",    colour: "#DC2626", bg: "#FEF2F2" },
  critical:   { label: "Critical",   colour: "#7F1D1D", bg: "#FEF2F2" },
  needs_data: { label: "Needs Data", colour: "#64748B", bg: "#F8FAFC" },
}

export const OPERATION_PROFILE_LABELS: Record<OperationProfile, string> = {
  long_term_let:          "Long-Term Let",
  rent_to_rent:           "Rent-to-Rent",
  hmo:                    "HMO",
  student_let:            "Student Let",
  serviced_accommodation: "Serviced Accommodation",
  holiday_let:            "Holiday Let",
  commercial:             "Commercial",
  mixed_use:              "Mixed Use",
  dev_flip:               "Dev / Flip",
  co_living:              "Co-Living",
}

// ============================================================
// Entity interfaces
// ============================================================

export interface ComplianceCertificate {
  id: string
  workspaceId: string
  certificateType: CertificateType
  propertyId?: string
  propertyName?: string
  unitId?: string
  tenancyId?: string
  supplierContactId?: string
  issuerContactId?: string
  issuerName?: string
  status: CertificateStatus
  issueDate?: string
  expiryDate?: string
  daysUntilExpiry?: number
  referenceNumber?: string
  documentId?: string
  riskLevel: ComplianceRiskLevel
  renewalTaskId?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface ComplianceInspection {
  id: string
  workspaceId: string
  inspectionType: InspectionType
  propertyId?: string
  propertyName?: string
  unitId?: string
  tenancyId?: string
  inspectorName?: string
  status: InspectionStatus
  scheduledAt?: string
  completedAt?: string
  outcome?: InspectionOutcome
  riskLevel: ComplianceRiskLevel
  findingsCount: number
  actionsRequired: number
  followUpDate?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}
