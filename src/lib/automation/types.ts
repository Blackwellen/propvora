// Smart Rules — shared types for the automation engine.
// These mirror the smart_rules / smart_rule_runs / smart_rule_actions tables
// (migration 20260615030000_smart_rules.sql).

export type TriggerType =
  // --- Existing triggers ---
  | "compliance_due_soon"
  | "compliance_overdue"
  | "tenancy_ending"
  | "rent_overdue"
  | "planning_offer_sent"
  | "planning_offer_expiring"
  | "job_completed"
  | "licence_expiring"
  // --- Tenancy lifecycle ---
  | "tenancy_started"
  | "tenancy_expired"
  | "lease_renewal_approaching"
  | "move_out_approaching"
  | "void_period_started"
  | "void_period_long"
  // --- Rent & payments ---
  | "rent_due_soon"
  | "rent_payment_received"
  | "payment_failed"
  | "arrears_threshold_reached"
  // --- Maintenance & jobs ---
  | "maintenance_request_submitted"
  | "maintenance_request_overdue"
  | "job_overdue"
  | "quote_received"
  | "quote_expiring"
  | "invoice_overdue"
  | "inspection_due"
  | "inspection_overdue"
  | "contractor_not_reviewed"
  // --- Compliance & certificates ---
  | "gas_cert_expiring"
  | "eicr_expiring"
  | "epc_expiring"
  | "right_to_rent_due"
  | "insurance_expiring"
  | "deposit_unprotected"
  | "deposit_return_overdue"
  // --- Communications & portal ---
  | "portal_message_unanswered"
  | "complaint_received"
  | "document_expiring"
  // --- Portfolio events ---
  | "property_added"
  | "unit_vacant"
  | "hmo_room_vacant"
  | "booking_checkin_tomorrow"
  | "booking_checkout_today"
  | "booking_cancelled"
  // --- Planning / lettings ---
  | "viewing_not_booked"
  | "offer_accepted"
  | "referencing_overdue"

export type ActionType =
  // --- Existing actions ---
  | "create_task"
  | "create_notification"
  | "draft_message"
  | "flag_record"
  | "create_calendar_reminder"
  // --- New actions ---
  | "send_portal_message"
  | "assign_task"
  | "create_inspection"
  | "create_compliance_item"
  | "escalate"
  | "add_note"
  | "update_unit_status"
  | "request_quote"
  | "send_webhook"
  | "generate_document"
  | "archive_record"
  | "create_landlord_report"

export type RunStatus =
  | "pending_review"
  | "approved"
  | "executed"
  | "skipped"
  | "failed"

export type ActionStatus = "pending" | "executed" | "skipped" | "failed"

export interface SmartRule {
  id: string
  workspace_id: string
  name: string
  description: string | null
  enabled: boolean
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  condition_config: Record<string, unknown>
  action_type: ActionType
  action_config: Record<string, unknown>
  review_required: boolean
  template_id: string | null
  last_evaluated_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SmartRuleRun {
  id: string
  rule_id: string
  workspace_id: string
  triggered_at: string
  status: RunStatus
  context: RunContext
  error: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface SmartRuleAction {
  id: string
  run_id: string
  workspace_id: string
  action_type: ActionType
  payload: Record<string, unknown>
  status: ActionStatus
  executed_at: string | null
  result: Record<string, unknown> | null
  created_at: string
}

/**
 * A normalised description of the record a rule matched against. Stored on the
 * run so the review inbox can render a human-readable summary without re-querying.
 */
export interface RunContext {
  /** Stable de-dupe key: rule_id + entity so we don't re-fire on the same record. */
  dedupe_key: string
  /** Logical entity table, e.g. "compliance_items", "tenancies". */
  entity_type: string
  /** The matched record id. */
  entity_id: string
  /** Optional property this relates to, for linking. */
  property_id?: string | null
  /** Human title for the inbox (e.g. "Gas Safety Certificate due in 14 days"). */
  summary: string
  /** Extra structured facts (due dates, amounts, days remaining). */
  facts: Record<string, unknown>
}

/** A candidate match produced by a trigger evaluator before a run row exists. */
export interface TriggerMatch {
  entity_type: string
  entity_id: string
  property_id?: string | null
  summary: string
  facts: Record<string, unknown>
}
