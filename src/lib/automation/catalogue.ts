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
]

export const ACTION_CATALOGUE: ActionDef[] = [
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
