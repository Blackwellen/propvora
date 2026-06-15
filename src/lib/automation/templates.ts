// Smart Rules — starter template library. Each template is a ready-made rule
// a user can install in one click. They map onto the trigger/action catalogues.

import type { ActionType, TriggerType } from "./types"

export interface RuleTemplate {
  template_id: string
  name: string
  description: string
  category: "Compliance" | "Tenancy" | "Finance" | "Planning" | "Maintenance"
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  condition_config: Record<string, unknown>
  action_type: ActionType
  action_config: Record<string, unknown>
  /** Recommended default; user can still toggle review off for safe actions. */
  review_required: boolean
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    template_id: "gas-cert-due-30",
    name: "Gas safety due in 30 days → task",
    description: "When a compliance item is due within 30 days, create a task to book the renewal.",
    category: "Compliance",
    trigger_type: "compliance_due_soon",
    trigger_config: { within_days: 30 },
    condition_config: {},
    action_type: "create_task",
    action_config: { title: "Renew: {{summary}}", description: "Book the renewal before the due date.", priority: "high", due_in_days: "14" },
    review_required: true,
  },
  {
    template_id: "compliance-overdue-flag",
    name: "Compliance overdue → flag + notify",
    description: "When a compliance item is overdue, flag the record and notify the owner.",
    category: "Compliance",
    trigger_type: "compliance_overdue",
    trigger_config: { min_days_overdue: 0 },
    condition_config: {},
    action_type: "create_notification",
    action_config: { title: "Overdue: {{summary}}", body: "This compliance item is past its due date.", severity: "critical" },
    review_required: true,
  },
  {
    template_id: "tenancy-ending-60",
    name: "Tenancy ending in 60 days → renewal task",
    description: "Create a renewal/re-let task when an active tenancy is within 60 days of ending.",
    category: "Tenancy",
    trigger_type: "tenancy_ending",
    trigger_config: { within_days: 60 },
    condition_config: {},
    action_type: "create_task",
    action_config: { title: "Renewal decision: {{summary}}", description: "Decide renew vs re-let and contact the tenant.", priority: "normal", due_in_days: "21" },
    review_required: true,
  },
  {
    template_id: "rent-arrears-chase",
    name: "Rent overdue → draft chase message",
    description: "When a rent line is overdue, draft a polite chase message for review (never auto-sent).",
    category: "Finance",
    trigger_type: "rent_overdue",
    trigger_config: { min_days_overdue: 3, min_amount: 0 },
    condition_config: {},
    action_type: "draft_message",
    action_config: { subject: "Rent reminder", body: "Hi, our records show an outstanding balance on your rent. Could you let us know when payment will be made? Thank you." },
    review_required: true,
  },
  {
    template_id: "offer-chase-7",
    name: "Landlord offer unanswered 7 days → task",
    description: "Chase a landlord offer that has been awaiting a response for a week.",
    category: "Planning",
    trigger_type: "planning_offer_sent",
    trigger_config: { stale_after_days: 7 },
    condition_config: {},
    action_type: "create_task",
    action_config: { title: "Chase landlord offer: {{summary}}", description: "Follow up on the outstanding offer.", priority: "normal", due_in_days: "2" },
    review_required: true,
  },
  {
    template_id: "job-complete-followup",
    name: "Job complete → invoice/inspection reminder",
    description: "When a job is marked complete, create a reminder to invoice and inspect.",
    category: "Maintenance",
    trigger_type: "job_completed",
    trigger_config: { within_days: 7 },
    condition_config: {},
    action_type: "create_calendar_reminder",
    action_config: { title: "Post-job follow-up: {{summary}}", remind_in_days: "1" },
    review_required: true,
  },
  {
    template_id: "licence-expiring-90",
    name: "HMO licence expiring in 90 days → task",
    description: "Create a renewal task when an HMO licence is within 90 days of expiry.",
    category: "Compliance",
    trigger_type: "licence_expiring",
    trigger_config: { within_days: 90 },
    condition_config: {},
    action_type: "create_task",
    action_config: { title: "Renew HMO licence: {{summary}}", description: "Begin the licence renewal process.", priority: "high", due_in_days: "30" },
    review_required: true,
  },
]
