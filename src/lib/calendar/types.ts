export type CalendarEventSource =
  | "manual_event" | "task" | "job" | "supplier_booking" | "prebooked_work"
  | "tenancy" | "move_in" | "move_out" | "invoice_due" | "bill_due"
  | "planned_invoice_send" | "arrears_chase" | "deposit_return"
  | "landlord_offer_expiry" | "planning_review" | "planning_conversion"
  | "document_expiry" | "compliance_deadline" | "contact_follow_up"
  | "viewing" | "debt_review" | "affiliate_payout_review"
  | "system_reminder" | "ai_suggested"

export type CalendarEventStatus =
  | "draft" | "scheduled" | "confirmed" | "tentative" | "waiting"
  | "overdue" | "completed" | "cancelled" | "archived"

export type CalendarRiskLevel = "low" | "normal" | "important" | "urgent" | "critical"

export type CalendarEventType =
  | "manual_event" | "task_reminder" | "job_schedule" | "supplier_booking"
  | "viewing" | "inspection" | "contact_follow_up" | "money_reminder"
  | "planning_review" | "document_compliance_deadline" | "other"

export type CalendarLayer =
  | "work" | "supplier_bookings" | "prebooked_work" | "portfolio"
  | "planning" | "money" | "contacts" | "compliance" | "manual" | "ai"

export type SupplierBookingStatus =
  | "draft" | "email_sent" | "awaiting_supplier" | "accepted"
  | "rejected" | "reschedule_requested" | "confirmed" | "expired" | "cancelled"

export type RecurrenceFrequency =
  | "one_off" | "daily" | "weekly" | "fortnightly" | "monthly"
  | "quarterly" | "six_monthly" | "annual" | "custom"

export type CalendarView =
  | "overview" | "month" | "week" | "day" | "agenda"
  | "schedule" | "timeline" | "gantt" | "board"

// Config maps
export const EVENT_SOURCE_CONFIG: Record<CalendarEventSource, { label: string; colour: string; bg: string }> = {
  manual_event:          { label: "Manual Event",          colour: "#2563EB", bg: "#EFF6FF" },
  task:                  { label: "Task",                  colour: "#2563EB", bg: "#EFF6FF" },
  job:                   { label: "Job",                   colour: "#2563EB", bg: "#EFF6FF" },
  supplier_booking:      { label: "Supplier Booking",      colour: "#D97706", bg: "#FFFBEB" },
  prebooked_work:        { label: "Prebooked Work",        colour: "#7C3AED", bg: "#F5F3FF" },
  tenancy:               { label: "Tenancy",               colour: "#059669", bg: "#ECFDF5" },
  move_in:               { label: "Move In",               colour: "#059669", bg: "#ECFDF5" },
  move_out:              { label: "Move Out",              colour: "#DC2626", bg: "#FEF2F2" },
  invoice_due:           { label: "Invoice Due",           colour: "#D97706", bg: "#FFFBEB" },
  bill_due:              { label: "Bill Due",              colour: "#D97706", bg: "#FFFBEB" },
  planned_invoice_send:  { label: "Planned Invoice Send",  colour: "#2563EB", bg: "#EFF6FF" },
  arrears_chase:         { label: "Arrears Chase",         colour: "#DC2626", bg: "#FEF2F2" },
  deposit_return:        { label: "Deposit Return",        colour: "#059669", bg: "#ECFDF5" },
  landlord_offer_expiry: { label: "Offer Expiry",          colour: "#DC2626", bg: "#FEF2F2" },
  planning_review:       { label: "Planning Review",       colour: "#7C3AED", bg: "#F5F3FF" },
  planning_conversion:   { label: "Planning Conversion",   colour: "#7C3AED", bg: "#F5F3FF" },
  document_expiry:       { label: "Document Expiry",       colour: "#D97706", bg: "#FFFBEB" },
  compliance_deadline:   { label: "Compliance Deadline",   colour: "#DC2626", bg: "#FEF2F2" },
  contact_follow_up:     { label: "Contact Follow-up",     colour: "#2563EB", bg: "#EFF6FF" },
  viewing:               { label: "Viewing",               colour: "#059669", bg: "#ECFDF5" },
  debt_review:           { label: "Debt Review",           colour: "#7C3AED", bg: "#F5F3FF" },
  affiliate_payout_review: { label: "Affiliate Payout",   colour: "#7C3AED", bg: "#F5F3FF" },
  system_reminder:       { label: "System Reminder",       colour: "#64748B", bg: "#F8FAFC" },
  ai_suggested:          { label: "AI Suggested",          colour: "#7C3AED", bg: "#F5F3FF" },
}

export const RISK_CONFIG: Record<CalendarRiskLevel, { label: string; colour: string; bg: string }> = {
  low:       { label: "Low",       colour: "#64748B", bg: "#F8FAFC" },
  normal:    { label: "Normal",    colour: "#2563EB", bg: "#EFF6FF" },
  important: { label: "Important", colour: "#D97706", bg: "#FFFBEB" },
  urgent:    { label: "Urgent",    colour: "#DC2626", bg: "#FEF2F2" },
  critical:  { label: "Critical",  colour: "#7F1D1D", bg: "#FEF2F2" },
}

export const EVENT_STATUS_CONFIG: Record<CalendarEventStatus, { label: string; colour: string; bg: string }> = {
  draft:     { label: "Draft",     colour: "#64748B", bg: "#F8FAFC" },
  scheduled: { label: "Scheduled", colour: "#2563EB", bg: "#EFF6FF" },
  confirmed: { label: "Confirmed", colour: "#059669", bg: "#ECFDF5" },
  tentative: { label: "Tentative", colour: "#D97706", bg: "#FFFBEB" },
  waiting:   { label: "Waiting",   colour: "#D97706", bg: "#FFFBEB" },
  overdue:   { label: "Overdue",   colour: "#DC2626", bg: "#FEF2F2" },
  completed: { label: "Completed", colour: "#059669", bg: "#ECFDF5" },
  cancelled: { label: "Cancelled", colour: "#64748B", bg: "#F8FAFC" },
  archived:  { label: "Archived",  colour: "#64748B", bg: "#F8FAFC" },
}

export const SUPPLIER_BOOKING_STATUS_CONFIG: Record<SupplierBookingStatus, { label: string; colour: string; bg: string }> = {
  draft:                { label: "Draft",                colour: "#64748B", bg: "#F8FAFC" },
  email_sent:           { label: "Email Sent",           colour: "#2563EB", bg: "#EFF6FF" },
  awaiting_supplier:    { label: "Awaiting Supplier",    colour: "#D97706", bg: "#FFFBEB" },
  accepted:             { label: "Accepted",             colour: "#059669", bg: "#ECFDF5" },
  rejected:             { label: "Rejected",             colour: "#DC2626", bg: "#FEF2F2" },
  reschedule_requested: { label: "Reschedule Requested", colour: "#D97706", bg: "#FFFBEB" },
  confirmed:            { label: "Confirmed",            colour: "#059669", bg: "#ECFDF5" },
  expired:              { label: "Expired",              colour: "#64748B", bg: "#F8FAFC" },
  cancelled:            { label: "Cancelled",            colour: "#64748B", bg: "#F8FAFC" },
}

export const LAYER_CONFIG: Record<CalendarLayer, { label: string; colour: string; icon: string }> = {
  work:              { label: "Work",              colour: "#2563EB", icon: "Briefcase" },
  supplier_bookings: { label: "Supplier Bookings", colour: "#D97706", icon: "Truck" },
  prebooked_work:    { label: "Prebooked Work",    colour: "#7C3AED", icon: "RefreshCw" },
  portfolio:         { label: "Portfolio",         colour: "#059669", icon: "Building2" },
  planning:          { label: "Planning",          colour: "#7C3AED", icon: "Map" },
  money:             { label: "Money",             colour: "#2563EB", icon: "Wallet" },
  contacts:          { label: "Contacts",          colour: "#059669", icon: "Users" },
  compliance:        { label: "Compliance",        colour: "#DC2626", icon: "Shield" },
  manual:            { label: "Manual",            colour: "#64748B", icon: "Calendar" },
  ai:                { label: "AI Suggested",      colour: "#7C3AED", icon: "Sparkles" },
}

export interface CalendarEvent {
  id: string
  workspaceId: string
  title: string
  description?: string
  eventType: CalendarEventType
  sourceType: CalendarEventSource
  sourceId?: string
  status: CalendarEventStatus
  riskLevel: CalendarRiskLevel
  startAt: string
  endAt: string
  allDay: boolean
  timezone?: string
  location?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  tenancyId?: string
  contactId?: string
  contactName?: string
  assigneeId?: string
  assigneeName?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  layer: CalendarLayer
  metadata?: Record<string, unknown>
}
