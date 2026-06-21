// Smart Rules — the trigger & action catalogues.
// These describe, for the UI and the engine, every trigger the engine can
// evaluate and every (safe, reversible) action it can propose.

import type { ActionType, TriggerType } from "./types"

export interface TriggerDef {
  type: TriggerType
  label: string
  description: string
  /** Source table the evaluator reads. */
  entity: string
  /** Config fields the rule builder collects (with sensible defaults). */
  configFields: Array<{
    key: string
    label: string
    kind: "number" | "text"
    default?: number | string
    suffix?: string
    help?: string
  }>
}

export interface ActionDef {
  type: ActionType
  label: string
  description: string
  /**
   * reversible = the action can be safely auto-executed if a rule explicitly
   * opts out of review. Everything in this catalogue is reversible/safe by
   * design — there are NO destructive auto-actions.
   */
  reversible: true
  configFields: Array<{
    key: string
    label: string
    kind: "text" | "textarea"
    default?: string
    help?: string
    /** Tokens like {{summary}} that get interpolated from the run context. */
    supportsTokens?: boolean
  }>
}

export const TRIGGER_CATALOGUE: TriggerDef[] = [
  // ── Original triggers ──────────────────────────────────────────────────────
  {
    type: "compliance_due_soon",
    label: "Compliance item due soon",
    description: "A certificate or compliance item (Gas, EICR, EPC…) falls due within N days.",
    entity: "compliance_items",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 30, suffix: "days", help: "Fire when the due date is within this many days." },
    ],
  },
  {
    type: "compliance_overdue",
    label: "Compliance item overdue",
    description: "A compliance item is past its due date and not yet completed.",
    entity: "compliance_items",
    configFields: [
      { key: "min_days_overdue", label: "Min days overdue", kind: "number", default: 0, suffix: "days" },
    ],
  },
  {
    type: "tenancy_ending",
    label: "Tenancy ending",
    description: "An active tenancy's end date is within N days (renewal / re-let prompt).",
    entity: "tenancies",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 60, suffix: "days" },
    ],
  },
  {
    type: "rent_overdue",
    label: "Rent overdue (arrears)",
    description: "A rent schedule line is past its due date and not fully paid.",
    entity: "rent_schedules",
    configFields: [
      { key: "min_days_overdue", label: "Min days overdue", kind: "number", default: 1, suffix: "days" },
      { key: "min_amount", label: "Min outstanding", kind: "number", default: 0, suffix: "£" },
    ],
  },
  {
    type: "planning_offer_sent",
    label: "Landlord offer sent",
    description: "A planning landlord offer has been sent and is awaiting a response.",
    entity: "planning_landlord_offers",
    configFields: [
      { key: "stale_after_days", label: "Chase after", kind: "number", default: 7, suffix: "days", help: "Fire when an offer has been awaiting a response for this long." },
    ],
  },
  {
    type: "planning_offer_expiring",
    label: "Landlord offer expiring",
    description: "A sent landlord offer is approaching its validity window with no response.",
    entity: "planning_landlord_offers",
    configFields: [
      { key: "expire_after_days", label: "Expires after", kind: "number", default: 14, suffix: "days" },
    ],
  },
  {
    type: "job_completed",
    label: "Job marked complete",
    description: "A maintenance job has just been completed (e.g. prompt invoice / inspection follow-up).",
    entity: "jobs",
    configFields: [
      { key: "within_days", label: "Completed within", kind: "number", default: 7, suffix: "days", help: "Only consider jobs completed in the last N days." },
    ],
  },
  {
    type: "licence_expiring",
    label: "HMO/EPC licence expiring",
    description: "An HMO licence's expiry date is within N days.",
    entity: "hmo_licences",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 90, suffix: "days" },
    ],
  },

  // ── Tenancy lifecycle ──────────────────────────────────────────────────────
  {
    type: "tenancy_started",
    label: "Tenancy started (move-in day)",
    description: "The tenancy start date has reached today — the tenant is moving in.",
    entity: "tenancies",
    configFields: [],
  },
  {
    type: "tenancy_expired",
    label: "Tenancy expired (still active)",
    description: "An active tenancy has passed its end date but has not been marked as ended.",
    entity: "tenancies",
    configFields: [],
  },
  {
    type: "lease_renewal_approaching",
    label: "Lease renewal approaching",
    description: "Renewal decision point — tenancy end is within N days.",
    entity: "tenancies",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 90, suffix: "days" },
    ],
  },
  {
    type: "move_out_approaching",
    label: "Move-out approaching",
    description: "Tenant checkout date is within N days.",
    entity: "tenancies",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 14, suffix: "days" },
    ],
  },
  {
    type: "void_period_started",
    label: "Void period started",
    description: "A unit has just become vacant today.",
    entity: "units",
    configFields: [],
  },
  {
    type: "void_period_long",
    label: "Void period too long",
    description: "A unit has been vacant for more than N days without being let.",
    entity: "units",
    configFields: [
      { key: "min_days", label: "Minimum void days", kind: "number", default: 30, suffix: "days" },
    ],
  },

  // ── Rent & payments ────────────────────────────────────────────────────────
  {
    type: "rent_due_soon",
    label: "Rent due soon (pre-arrears nudge)",
    description: "Rent is due within N days — send a reminder before it becomes overdue.",
    entity: "rent_schedules",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 3, suffix: "days" },
    ],
  },
  {
    type: "rent_payment_received",
    label: "Rent payment received",
    description: "A rent schedule line has been marked as paid.",
    entity: "rent_schedules",
    configFields: [
      { key: "within_days", label: "Within last", kind: "number", default: 1, suffix: "days" },
    ],
  },
  {
    type: "payment_failed",
    label: "Payment failed",
    description: "A rent payment attempt has failed or a standing order has lapsed.",
    entity: "rent_schedules",
    configFields: [],
  },
  {
    type: "arrears_threshold_reached",
    label: "Arrears threshold exceeded",
    description: "Total outstanding rent across unpaid lines exceeds £N for a tenancy.",
    entity: "rent_schedules",
    configFields: [
      { key: "min_amount", label: "Arrears threshold", kind: "number", default: 500, suffix: "£" },
    ],
  },

  // ── Maintenance & jobs ─────────────────────────────────────────────────────
  {
    type: "maintenance_request_submitted",
    label: "Maintenance request submitted",
    description: "A new maintenance job has been created (open, unassigned).",
    entity: "jobs",
    configFields: [
      { key: "within_days", label: "Created within last", kind: "number", default: 1, suffix: "days" },
    ],
  },
  {
    type: "maintenance_request_overdue",
    label: "Maintenance request unassigned too long",
    description: "A maintenance request has been open without assignment for N+ days.",
    entity: "jobs",
    configFields: [
      { key: "min_days_unassigned", label: "Min days unassigned", kind: "number", default: 3, suffix: "days" },
    ],
  },
  {
    type: "job_overdue",
    label: "Job overdue",
    description: "A job is past its due date and not yet completed or cancelled.",
    entity: "jobs",
    configFields: [],
  },
  {
    type: "quote_received",
    label: "Supplier quote received",
    description: "A supplier has submitted a new quote for review.",
    entity: "supplier_quotes",
    configFields: [
      { key: "within_hours", label: "Within last", kind: "number", default: 24, suffix: "hours" },
    ],
  },
  {
    type: "quote_expiring",
    label: "Supplier quote expiring",
    description: "A pending supplier quote is approaching its valid_until date.",
    entity: "supplier_quotes",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 3, suffix: "days" },
    ],
  },
  {
    type: "invoice_overdue",
    label: "Supplier invoice overdue",
    description: "A supplier invoice has passed its payment terms date and is unpaid.",
    entity: "supplier_invoices",
    configFields: [
      { key: "min_days_overdue", label: "Min days overdue", kind: "number", default: 7, suffix: "days" },
    ],
  },
  {
    type: "inspection_due",
    label: "Inspection due",
    description: "A scheduled inspection is within N days.",
    entity: "inspections",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 14, suffix: "days" },
    ],
  },
  {
    type: "inspection_overdue",
    label: "Inspection overdue",
    description: "A scheduled inspection date has passed and the inspection is not completed.",
    entity: "inspections",
    configFields: [],
  },
  {
    type: "contractor_not_reviewed",
    label: "Contractor not reviewed",
    description: "A completed job has no contractor review after N days.",
    entity: "jobs",
    configFields: [
      { key: "min_days_since_completion", label: "Days since completion", kind: "number", default: 7, suffix: "days" },
    ],
  },

  // ── Compliance & certificates ──────────────────────────────────────────────
  {
    type: "gas_cert_expiring",
    label: "Gas Safety Certificate expiring",
    description: "A Gas Safety Certificate is due for renewal within N days.",
    entity: "compliance_items",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 60, suffix: "days" },
    ],
  },
  {
    type: "eicr_expiring",
    label: "EICR / Electrical cert expiring",
    description: "An Electrical Installation Condition Report is due within N days.",
    entity: "compliance_items",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 60, suffix: "days" },
    ],
  },
  {
    type: "epc_expiring",
    label: "EPC expiring",
    description: "An Energy Performance Certificate is due to expire within N days.",
    entity: "compliance_items",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 180, suffix: "days" },
    ],
  },
  {
    type: "right_to_rent_due",
    label: "Right to Rent check due",
    description: "A Right to Rent check renewal is due within N days.",
    entity: "compliance_items",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 30, suffix: "days" },
    ],
  },
  {
    type: "insurance_expiring",
    label: "Insurance expiring",
    description: "Building or contents insurance is due to expire within N days.",
    entity: "compliance_items",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 60, suffix: "days" },
    ],
  },
  {
    type: "deposit_unprotected",
    label: "Deposit unprotected",
    description: "A new tenancy has a deposit that hasn't been registered with a scheme after N days.",
    entity: "tenancies",
    configFields: [
      { key: "after_days", label: "After move-in days", kind: "number", default: 30, suffix: "days", help: "Alert if deposit is unprotected this many days after tenancy start." },
    ],
  },
  {
    type: "deposit_return_overdue",
    label: "Deposit return overdue",
    description: "A tenancy has ended but the deposit has not been returned after N days.",
    entity: "tenancies",
    configFields: [
      { key: "after_days", label: "Days after move-out", kind: "number", default: 10, suffix: "days" },
    ],
  },

  // ── Communications & portal ───────────────────────────────────────────────
  {
    type: "portal_message_unanswered",
    label: "Tenant portal message unanswered",
    description: "A tenant message has gone unread for N+ days.",
    entity: "portal_messages",
    configFields: [
      { key: "min_days_unanswered", label: "Min days unanswered", kind: "number", default: 3, suffix: "days" },
    ],
  },
  {
    type: "complaint_received",
    label: "Complaint received",
    description: "A tenant complaint has been submitted via the portal.",
    entity: "complaints",
    configFields: [
      { key: "within_days", label: "Received within last", kind: "number", default: 1, suffix: "days" },
    ],
  },
  {
    type: "document_expiring",
    label: "Document expiring",
    description: "A document with an expiry date is due to expire within N days.",
    entity: "documents",
    configFields: [
      { key: "within_days", label: "Days ahead", kind: "number", default: 30, suffix: "days" },
    ],
  },

  // ── Portfolio events ───────────────────────────────────────────────────────
  {
    type: "property_added",
    label: "New property onboarded",
    description: "A new property has been added to the workspace.",
    entity: "properties",
    configFields: [
      { key: "within_days", label: "Added within last", kind: "number", default: 1, suffix: "days" },
    ],
  },
  {
    type: "unit_vacant",
    label: "Unit is vacant",
    description: "A unit is currently marked as vacant.",
    entity: "units",
    configFields: [],
  },
  {
    type: "hmo_room_vacant",
    label: "HMO room vacant",
    description: "An HMO room has become available.",
    entity: "units",
    configFields: [],
  },
  {
    type: "booking_checkin_tomorrow",
    label: "Stay booking check-in tomorrow",
    description: "A confirmed stay booking has a check-in date of tomorrow.",
    entity: "stay_bookings",
    configFields: [],
  },
  {
    type: "booking_checkout_today",
    label: "Stay booking checkout today",
    description: "A confirmed stay booking has a checkout date of today.",
    entity: "stay_bookings",
    configFields: [],
  },
  {
    type: "booking_cancelled",
    label: "Booking cancelled",
    description: "A confirmed stay booking has been cancelled.",
    entity: "stay_bookings",
    configFields: [
      { key: "within_days", label: "Cancelled within last", kind: "number", default: 1, suffix: "days" },
    ],
  },

  // ── Planning / lettings ────────────────────────────────────────────────────
  {
    type: "viewing_not_booked",
    label: "Vacant unit — no viewing booked",
    description: "A unit has been vacant for N+ days with no upcoming viewings scheduled.",
    entity: "units",
    configFields: [
      { key: "min_days_vacant", label: "Min days vacant", kind: "number", default: 7, suffix: "days" },
    ],
  },
  {
    type: "offer_accepted",
    label: "Rental offer accepted",
    description: "A rental offer has been accepted — trigger referencing / tenancy setup workflow.",
    entity: "rental_offers",
    configFields: [
      { key: "within_days", label: "Accepted within last", kind: "number", default: 1, suffix: "days" },
    ],
  },
  {
    type: "referencing_overdue",
    label: "Referencing overdue",
    description: "A tenancy application's referencing check has not been completed within N days.",
    entity: "tenancy_applications",
    configFields: [
      { key: "min_days", label: "Min days since application", kind: "number", default: 5, suffix: "days" },
    ],
  },
]

export const ACTION_CATALOGUE: ActionDef[] = [
  // ── Original actions ────────────────────────────────────────────────────────
  {
    type: "create_task",
    label: "Create a task",
    description: "Adds a to-do to the Work board so a human follows up.",
    reversible: true,
    configFields: [
      { key: "title", label: "Task title", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "description", label: "Description", kind: "textarea", default: "Created by Smart Rule.", supportsTokens: true },
      { key: "priority", label: "Priority", kind: "text", default: "normal", help: "low | normal | high | urgent" },
      { key: "due_in_days", label: "Due in (days)", kind: "text", default: "7" },
    ],
  },
  {
    type: "create_notification",
    label: "Create a notification",
    description: "Posts an in-app notification to the rule owner. Reversible (dismissable).",
    reversible: true,
    configFields: [
      { key: "title", label: "Title", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "body", label: "Body", kind: "textarea", default: "", supportsTokens: true },
      { key: "severity", label: "Severity", kind: "text", default: "info", help: "info | warning | critical" },
    ],
  },
  {
    type: "draft_message",
    label: "Draft a message / email",
    description: "Prepares a DRAFT message for review. Never auto-sends.",
    reversible: true,
    configFields: [
      { key: "subject", label: "Subject", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "body", label: "Draft body", kind: "textarea", default: "", supportsTokens: true },
    ],
  },
  {
    type: "flag_record",
    label: "Flag the record",
    description: "Raises an attention flag (notification + audit) against the matched record.",
    reversible: true,
    configFields: [
      { key: "reason", label: "Flag reason", kind: "text", default: "{{summary}}", supportsTokens: true },
    ],
  },
  {
    type: "create_calendar_reminder",
    label: "Create a calendar reminder",
    description: "Adds a reminder task with a due date so it surfaces on the calendar.",
    reversible: true,
    configFields: [
      { key: "title", label: "Reminder title", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "remind_in_days", label: "Remind in (days)", kind: "text", default: "1" },
    ],
  },

  // ── New actions ────────────────────────────────────────────────────────────
  {
    type: "send_portal_message",
    label: "Send portal message (draft)",
    description: "Creates a draft message via the tenant portal for review before sending.",
    reversible: true,
    configFields: [
      { key: "subject", label: "Subject", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "body", label: "Message body", kind: "textarea", default: "", supportsTokens: true },
    ],
  },
  {
    type: "assign_task",
    label: "Assign task to team member",
    description: "Creates a task and assigns it to a specific team member.",
    reversible: true,
    configFields: [
      { key: "title", label: "Task title", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "description", label: "Description", kind: "textarea", default: "", supportsTokens: true },
      { key: "priority", label: "Priority", kind: "text", default: "normal", help: "low | normal | high | urgent" },
      { key: "due_in_days", label: "Due in (days)", kind: "text", default: "7" },
      { key: "assignee_id", label: "Assignee user ID", kind: "text", default: "", help: "Leave blank to assign to rule creator." },
    ],
  },
  {
    type: "create_inspection",
    label: "Schedule an inspection",
    description: "Creates a new scheduled inspection record for the property.",
    reversible: true,
    configFields: [
      { key: "schedule_in_days", label: "Schedule in (days)", kind: "text", default: "7" },
      { key: "kind", label: "Inspection type", kind: "text", default: "routine", help: "routine | move_in | move_out | emergency" },
      { key: "notes", label: "Notes", kind: "textarea", default: "", supportsTokens: true },
    ],
  },
  {
    type: "create_compliance_item",
    label: "Create compliance item",
    description: "Adds a new compliance checklist item for the property.",
    reversible: true,
    configFields: [
      { key: "title", label: "Item title", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "kind", label: "Compliance kind", kind: "text", default: "general" },
      { key: "due_in_days", label: "Due in (days)", kind: "text", default: "30" },
      { key: "notes", label: "Notes", kind: "textarea", default: "" },
    ],
  },
  {
    type: "escalate",
    label: "Escalate (critical notification)",
    description: "Sends a critical-severity escalation notification to the account owner.",
    reversible: true,
    configFields: [
      { key: "title", label: "Escalation title", kind: "text", default: "ESCALATION: {{summary}}", supportsTokens: true },
      { key: "body", label: "Details", kind: "textarea", default: "{{summary}}", supportsTokens: true },
    ],
  },
  {
    type: "add_note",
    label: "Add a note to the record",
    description: "Appends an annotation/note to the matched record for audit purposes.",
    reversible: true,
    configFields: [
      { key: "body", label: "Note body", kind: "textarea", default: "{{summary}}", supportsTokens: true },
    ],
  },
  {
    type: "update_unit_status",
    label: "Update unit status",
    description: "Changes a unit's status (e.g. vacant → listed) to trigger downstream workflows.",
    reversible: true,
    configFields: [
      { key: "new_status", label: "New status", kind: "text", default: "listed", help: "vacant | listed | let | maintenance" },
    ],
  },
  {
    type: "request_quote",
    label: "Request supplier quote",
    description: "Creates an open quote request on the supplier marketplace.",
    reversible: true,
    configFields: [
      { key: "title", label: "Quote title", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "description", label: "Description", kind: "textarea", default: "", supportsTokens: true },
      { key: "budget", label: "Budget (£)", kind: "text", default: "0" },
    ],
  },
  {
    type: "send_webhook",
    label: "Send webhook",
    description: "POSTs a JSON payload to an external HTTPS URL for third-party integrations.",
    reversible: true,
    configFields: [
      { key: "url", label: "Webhook URL (https://)", kind: "text", default: "", help: "Must be a valid https:// URL." },
    ],
  },
  {
    type: "generate_document",
    label: "Generate document from template",
    description: "Queues a document for generation from a template (creates a pending_documents row).",
    reversible: true,
    configFields: [
      { key: "template_id", label: "Template ID", kind: "text", default: "" },
      { key: "notes", label: "Notes", kind: "textarea", default: "" },
    ],
  },
  {
    type: "archive_record",
    label: "Archive the record",
    description: "Soft-archives the matched record and creates an audit notification for review.",
    reversible: true,
    configFields: [
      { key: "reason", label: "Archive reason", kind: "text", default: "Archived by automation", supportsTokens: true },
    ],
  },
  {
    type: "create_landlord_report",
    label: "Create landlord summary report",
    description: "Creates a summary report record for the landlord's portal view.",
    reversible: true,
    configFields: [
      { key: "title", label: "Report title", kind: "text", default: "{{summary}}", supportsTokens: true },
      { key: "notes", label: "Notes", kind: "textarea", default: "", supportsTokens: true },
    ],
  },
]

export function triggerDef(type: string): TriggerDef | undefined {
  return TRIGGER_CATALOGUE.find((t) => t.type === type)
}
export function actionDef(type: string): ActionDef | undefined {
  return ACTION_CATALOGUE.find((a) => a.type === type)
}

export function triggerLabel(type: string): string {
  return triggerDef(type)?.label ?? type
}
export function actionLabel(type: string): string {
  return actionDef(type)?.label ?? type
}
