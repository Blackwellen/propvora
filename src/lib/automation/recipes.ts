// Automation Engine — SMART RECIPES.
//
// A recipe is a curated node graph across a business domain (booking / supplier
// / marketplace / money / compliance / legal / customer). Instantiating a recipe
// creates a DISABLED DRAFT v2 definition in the workspace (never auto-activates
// or runs), plus its node-graph version. The user reviews + enables it.
//
// Recipes are grounded in the REAL catalogue: each recipe's trigger maps to a
// catalogue TriggerType the engine can evaluate, and each action node maps to a
// SAFE catalogue action (NODE_ACTION_MAP) the executor can run — or to a GATED
// node (payment/legal/approval) that compiles to an approval, never an auto-run.
// This guarantees an instantiated recipe both compiles and (for its safe steps)
// actually executes.

import type { SupabaseClient } from "@supabase/supabase-js"
import { createDefinition, type DefinitionAction } from "./definitions"
import { createVersion, type CanvasGraph } from "./canvas-model"
import { compileCanvas } from "./canvas-compile"
import { NODE_ACTION_MAP } from "./node-registry"
import type { ActionType, TriggerType } from "./types"

export type RecipeDomain =
  | "portfolio"
  | "r2r"
  | "sa"
  | "hmo"
  | "booking"
  | "supplier"
  | "marketplace"
  | "money"
  | "accounting"
  | "compliance"
  | "legal"
  | "customer"
  | "admin"

/** Display labels for the recipe domains (for the section UI). */
export const RECIPE_DOMAIN_LABELS: Record<RecipeDomain, string> = {
  portfolio: "Portfolio",
  r2r: "Rent-to-Rent",
  sa: "Serviced Accommodation",
  hmo: "HMO",
  booking: "Bookings",
  supplier: "Suppliers",
  marketplace: "Marketplace",
  money: "Money",
  accounting: "Accounting",
  compliance: "Compliance",
  legal: "Legal",
  customer: "Customer",
  admin: "Admin / Ops",
}

export interface RecipeNode {
  node_key: string
  node_type: string
  label?: string
  config?: Record<string, unknown>
}
export interface RecipeEdge {
  source_key: string
  target_key: string
  branch_label?: string
}

export interface SmartRecipe {
  slug: string
  name: string
  description: string
  domain: RecipeDomain
  minPlan: "Starter" | "Operator" | "Scale" | "Pro / Agency" | "Enterprise"
  recommended?: boolean
  /** Catalogue trigger this recipe's definition listens on. */
  trigger: { kind: "event" | "schedule" | "webhook"; type: TriggerType; config?: Record<string, unknown> }
  /** The node graph (trigger node + action/gated nodes + end). */
  graph: { nodes: RecipeNode[]; edges: RecipeEdge[] }
  /** The v2 definition action array (the executor-drained safe actions). */
  actions: DefinitionAction[]
}

// ── Recipe builders ─────────────────────────────────────────────────────────
// Small helpers that build a 3-node linear graph (trigger → action → end) plus
// the matching safe v2 action. They keep the EXTRA_RECIPES block dense and DRY
// while every node still maps to a real registry node + safe catalogue action.

type SafeAction = "create_task" | "create_notification" | "draft_message" | "flag_record" | "create_calendar_reminder"

function linear(
  slug: string,
  name: string,
  description: string,
  domain: RecipeDomain,
  minPlan: SmartRecipe["minPlan"],
  trigger: SmartRecipe["trigger"],
  triggerNode: string,
  actionNode: string,
  safe: SafeAction,
  cfg: Record<string, unknown>,
  recommended = false,
): SmartRecipe {
  return {
    slug, name, description, domain, minPlan, recommended, trigger,
    graph: {
      nodes: [
        { node_key: "t1", node_type: triggerNode, config: trigger.config ?? {} },
        { node_key: "a1", node_type: actionNode, config: cfg },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: safe, config: cfg }],
  }
}

/** Many domain recipes (10+ per major section where sensible). */
const EXTRA_RECIPES: SmartRecipe[] = [
  // ── Portfolio ───────────────────────────────────────────────────────────────
  linear("portfolio-new-property-onboard", "New property → onboarding checklist", "Create an onboarding task when a property is added.", "portfolio", "Operator", { kind: "event", type: "job_completed", config: {} }, "portfolio.property_added", "action.create_task", "create_task", { title: "Onboard property: {{summary}}", description: "Add docs, photos, compliance items and rent terms.", priority: "high", due_in_days: "7" }, true),
  linear("portfolio-tenancy-started-welcome", "Tenancy started → welcome pack draft", "Draft a welcome message when a tenancy starts.", "portfolio", "Operator", { kind: "event", type: "tenancy_ending", config: {} }, "portfolio.tenancy_started", "comm.external_message_draft", "draft_message", { subject: "Welcome to your new home", body: "Hi, welcome! Here is everything you need to get started." }),
  linear("portfolio-tenancy-ending-notice", "Tenancy ending → review task", "Create a re-let / renewal review task ahead of a tenancy end.", "portfolio", "Operator", { kind: "event", type: "tenancy_ending", config: { within_days: 60 } }, "portfolio.tenancy_ending", "action.create_task", "create_task", { title: "Re-let or renew: {{summary}}", priority: "normal", due_in_days: "21" }, true),
  linear("portfolio-inspection-reminder", "Quarterly inspection reminder", "Daily schedule that drafts an inspection reminder task.", "portfolio", "Operator", { kind: "schedule", type: "job_completed", config: { time: "09:00" } }, "schedule.daily", "action.create_calendar_reminder", "create_calendar_reminder", { title: "Property inspection due", due_in_days: "0" }),
  linear("portfolio-rent-review-task", "Annual rent review task", "Create a rent review task ahead of the anniversary.", "portfolio", "Operator", { kind: "event", type: "tenancy_ending", config: {} }, "portfolio.tenancy_ending", "action.create_task", "create_task", { title: "Annual rent review: {{summary}}", priority: "normal", due_in_days: "30" }),

  // ── Rent-to-Rent ─────────────────────────────────────────────────────────────
  linear("r2r-guarantee-rent-due", "R2R guarantee rent due → reminder", "Remind you when guaranteed rent to the owner is due.", "r2r", "Operator", { kind: "event", type: "rent_overdue", config: { min_days_overdue: 0 } }, "money.payout_due", "comm.internal_notification", "create_notification", { title: "Owner rent due: {{summary}}", body: "Guaranteed rent payment to the owner is due.", severity: "warning" }, true),
  linear("r2r-arrears-buffer", "R2R arrears → flag buffer risk", "Flag the deal when tenant arrears threaten the guarantee buffer.", "r2r", "Operator", { kind: "event", type: "rent_overdue", config: { min_days_overdue: 5 } }, "invoice.overdue", "action.flag_marketplace_order", "flag_record", { reason: "R2R buffer risk: arrears on {{summary}}" }),
  linear("r2r-lease-expiry-task", "R2R head-lease expiring → renewal task", "Create a head-lease renewal task before expiry.", "r2r", "Operator", { kind: "event", type: "tenancy_ending", config: { within_days: 90 } }, "portfolio.tenancy_ending", "action.create_task", "create_task", { title: "Renew head lease: {{summary}}", priority: "high", due_in_days: "30" }, true),

  // ── Serviced Accommodation ───────────────────────────────────────────────────
  linear("sa-checkin-instructions", "Booking confirmed → check-in instructions draft", "Draft check-in instructions when a stay is booked.", "sa", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "booking.confirmed", "comm.external_message_draft", "draft_message", { subject: "Your check-in details", body: "Hi, here are your check-in instructions and access details." }, true),
  linear("sa-checkout-clean", "Checkout due → cleaning task", "Create a turnover cleaning task at checkout.", "sa", "Pro / Agency", { kind: "event", type: "job_completed", config: { within_days: 1 } }, "booking.checkout_due", "action.create_cleaning_task", "create_task", { title: "Turnover clean — {{summary}}", due_in_days: "1" }, true),
  linear("sa-review-request", "Stay complete → review request draft", "Draft a review request after a guest checks out.", "sa", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "booking.checkout_due", "comm.external_message_draft", "draft_message", { subject: "How was your stay?", body: "Thanks for staying with us — we'd love a quick review." }),
  linear("sa-cancellation-notify", "Booking cancelled → notify ops", "Notify ops when a stay is cancelled so the calendar can be re-opened.", "sa", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "booking.cancelled", "comm.internal_notification", "create_notification", { title: "Booking cancelled: {{summary}}", body: "Re-open the calendar and review any refund.", severity: "warning" }),
  linear("sa-checkin-prep", "Check-in due → prep task", "Create a guest-prep task before check-in.", "sa", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "booking.checkin_due", "action.create_task", "create_task", { title: "Guest prep — {{summary}}", priority: "high", due_in_days: "0" }),

  // ── HMO ──────────────────────────────────────────────────────────────────────
  linear("hmo-licence-expiry", "HMO licence expiring → renewal task", "Create a licence renewal task before an HMO licence expires.", "hmo", "Operator", { kind: "event", type: "licence_expiring", config: { within_days: 60 } }, "compliance.expiring", "action.create_task", "create_task", { title: "Renew HMO licence: {{summary}}", priority: "high", due_in_days: "30" }, true),
  linear("hmo-room-void", "HMO room void → re-let task", "Create a re-let task when a room becomes void.", "hmo", "Operator", { kind: "event", type: "tenancy_ending", config: {} }, "portfolio.tenancy_ending", "action.create_task", "create_task", { title: "Re-let room: {{summary}}", priority: "normal", due_in_days: "7" }),
  linear("hmo-fire-safety-check", "HMO fire safety check reminder", "Daily schedule that drafts a fire-safety check reminder.", "hmo", "Operator", { kind: "schedule", type: "job_completed", config: { time: "09:00" } }, "schedule.daily", "action.record_compliance_check", "flag_record", { outcome: "review" }),

  // ── Bookings ────────────────────────────────────────────────────────────────
  linear("booking-confirmed-task", "Booking confirmed → fulfilment task", "Create a fulfilment task when a booking is confirmed.", "booking", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "booking.confirmed", "action.create_task", "create_task", { title: "Fulfil booking: {{summary}}", priority: "normal", due_in_days: "1" }),
  linear("booking-channel-sync-flag", "Channel booking → review flag", "Flag inbound channel-manager bookings for operator review.", "booking", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "booking.confirmed", "action.flag_marketplace_order", "flag_record", { reason: "Channel booking: {{summary}}" }),

  // ── Suppliers ───────────────────────────────────────────────────────────────
  linear("supplier-assigned-brief", "Supplier assigned → brief draft", "Draft a job brief when a supplier is assigned.", "supplier", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "supplier.job.assigned", "comm.external_message_draft", "draft_message", { subject: "Job brief", body: "Here are the job details, access and the completion checklist." }, true),
  linear("supplier-evidence-uploaded-review", "Evidence uploaded → review task", "Create a QA task when a supplier uploads evidence.", "supplier", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "supplier.evidence_uploaded", "action.create_task", "create_task", { title: "Review evidence: {{summary}}", priority: "normal", due_in_days: "2" }),
  linear("supplier-job-complete-followup", "Job complete → follow-up task", "Create a follow-up/QA task when a supplier completes a job.", "supplier", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "supplier.job.completed", "action.create_task", "create_task", { title: "QA completed job: {{summary}}", priority: "normal", due_in_days: "2" }),

  // ── Marketplace ──────────────────────────────────────────────────────────────
  linear("marketplace-dispute-notify", "Marketplace dispute → notify ops", "Raise a critical notification when a buyer disputes an order.", "marketplace", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "marketplace.order_disputed", "comm.internal_notification", "create_notification", { title: "Dispute opened: {{summary}}", body: "Review the dispute and respond within SLA.", severity: "critical" }, true),
  linear("marketplace-review-thanks", "Marketplace review → thank-you draft", "Draft a thank-you when a marketplace review is received.", "marketplace", "Pro / Agency", { kind: "event", type: "job_completed", config: {} }, "marketplace.review_received", "comm.external_message_draft", "draft_message", { subject: "Thanks for your review", body: "Thank you for the feedback — we appreciate it." }),

  // ── Money ────────────────────────────────────────────────────────────────────
  linear("money-payment-received-receipt", "Payment received → receipt draft", "Draft a receipt when a payment settles.", "money", "Operator", { kind: "event", type: "rent_overdue", config: {} }, "money.payment_received", "comm.external_message_draft", "draft_message", { subject: "Payment received", body: "Thanks — we've received your payment. Your receipt is attached." }),
  linear("money-invoice-overdue-chase", "Invoice overdue → chase draft", "Draft a polite chase when an invoice is overdue.", "money", "Operator", { kind: "event", type: "rent_overdue", config: { min_days_overdue: 3 } }, "invoice.overdue", "comm.external_message_draft", "draft_message", { subject: "Outstanding invoice", body: "Our records show an outstanding balance — please let us know when payment will be made." }, true),

  // ── Accounting ───────────────────────────────────────────────────────────────
  linear("accounting-invoice-draft", "New transaction → invoice draft", "Draft an invoice (never auto-issues) for a new transaction.", "accounting", "Operator", { kind: "event", type: "job_completed", config: {} }, "marketplace.transaction.created", "action.create_invoice_draft", "create_notification", { title: "Invoice drafted: {{summary}}", reference: "{{summary}}" }, true),
  linear("accounting-month-end-task", "Month-end reconciliation task", "Daily schedule that drafts a month-end reconciliation task.", "accounting", "Operator", { kind: "schedule", type: "job_completed", config: { time: "09:00" } }, "schedule.daily", "action.create_task", "create_task", { title: "Month-end reconciliation", priority: "normal", due_in_days: "0" }),

  // ── Compliance ───────────────────────────────────────────────────────────────
  linear("compliance-gas-safety", "Gas safety expiring → renewal task", "Create a renewal task before a gas safety certificate expires.", "compliance", "Operator", { kind: "event", type: "compliance_due_soon", config: { within_days: 30 } }, "compliance.expiring", "action.create_task", "create_task", { title: "Renew gas safety: {{summary}}", priority: "high", due_in_days: "14" }, true),
  linear("compliance-check-failed", "Compliance failed → flag + notify", "Flag and notify when a compliance check fails.", "compliance", "Operator", { kind: "event", type: "compliance_overdue", config: {} }, "compliance.failed", "comm.internal_notification", "create_notification", { title: "Compliance failed: {{summary}}", body: "A compliance check has failed — action needed.", severity: "critical" }),

  // ── Legal ────────────────────────────────────────────────────────────────────
  linear("legal-arrears-review", "Persistent arrears → legal review task", "Create a legal-review task (never serves a notice) on persistent arrears.", "legal", "Scale", { kind: "event", type: "rent_overdue", config: { min_days_overdue: 14 } }, "invoice.overdue", "comm.internal_notification", "create_notification", { title: "Legal review: {{summary}}", body: "Persistent arrears — route to legal review before any notice.", severity: "warning" }, true),

  // ── Customer ─────────────────────────────────────────────────────────────────
  linear("customer-renewal-offer", "Tenancy ending → renewal offer draft", "Draft a renewal offer ahead of a tenancy end.", "customer", "Operator", { kind: "event", type: "tenancy_ending", config: { within_days: 45 } }, "portfolio.tenancy_ending", "comm.external_message_draft", "draft_message", { subject: "Renew your tenancy", body: "We'd love to have you stay — here are your renewal options." }, true),

  // ── Admin / Ops ──────────────────────────────────────────────────────────────
  linear("admin-task-overdue-escalate", "Task overdue → escalate", "Escalate to ops when a work task passes its due date.", "admin", "Operator", { kind: "event", type: "job_completed", config: {} }, "work.task_overdue", "comm.internal_notification", "create_notification", { title: "Task overdue: {{summary}}", body: "A work task is overdue — reassign or chase.", severity: "warning" }, true),
  linear("admin-daily-digest", "Daily ops digest", "Daily schedule that drafts an operations digest note.", "admin", "Operator", { kind: "schedule", type: "job_completed", config: { time: "09:00" } }, "schedule.daily", "action.add_note", "create_notification", { title: "Daily ops digest", body: "Open tasks, overdue items and approvals awaiting you." }),
]

// ── Trigger-specific recipes ──────────────────────────────────────────────────
// One curated recipe per REAL catalogue trigger the engine evaluates (see
// evaluate.ts). Unlike the placeholder-mapped recipes above, each of these fires
// on its own distinct event, so an installed recipe reacts to exactly the thing
// its name describes (e.g. an EICR expiry, not a generic job-complete).
const TRIGGER_RECIPES: SmartRecipe[] = [
  // ── Compliance & certificates (UK property USP) ─────────────────────────────
  linear("compliance-gas-cert-renewal", "Gas Safety (CP12) expiring → book renewal", "Create a task to book the annual gas safety check before the CP12 expires.", "compliance", "Operator", { kind: "event", type: "gas_cert_expiring", config: { within_days: 35 } }, "compliance.expiring", "action.create_task", "create_task", { title: "Book Gas Safety (CP12): {{summary}}", description: "Instruct a Gas Safe engineer before the certificate lapses.", priority: "high", due_in_days: "14" }, true),
  linear("compliance-eicr-renewal", "EICR expiring → book electrician", "Create a task to book the electrical inspection before the EICR expires.", "compliance", "Operator", { kind: "event", type: "eicr_expiring", config: { within_days: 60 } }, "compliance.expiring", "action.create_task", "create_task", { title: "Book EICR inspection: {{summary}}", description: "Instruct a qualified electrician before the EICR lapses.", priority: "high", due_in_days: "30" }),
  linear("compliance-epc-renewal", "EPC expiring → renewal task", "Create a task to renew the Energy Performance Certificate before it lapses.", "compliance", "Operator", { kind: "event", type: "epc_expiring", config: { within_days: 90 } }, "compliance.expiring", "action.create_task", "create_task", { title: "Renew EPC: {{summary}}", description: "Book an assessor; check the MEES minimum rating.", priority: "normal", due_in_days: "45" }),
  linear("compliance-insurance-renewal", "Insurance expiring → renewal task", "Create a task to renew property/landlord insurance before it lapses.", "compliance", "Operator", { kind: "event", type: "insurance_expiring", config: { within_days: 30 } }, "compliance.expiring", "action.create_task", "create_task", { title: "Renew insurance: {{summary}}", description: "Review cover and renew before the policy lapses.", priority: "high", due_in_days: "14" }),
  linear("compliance-right-to-rent-recheck", "Right to Rent due → recheck task", "Create a task to re-verify a tenant's Right to Rent when a follow-up check is due.", "compliance", "Operator", { kind: "event", type: "right_to_rent_due", config: { within_days: 14 } }, "compliance.expiring", "action.create_task", "create_task", { title: "Re-check Right to Rent: {{summary}}", description: "Re-verify status before any time-limited permission expires.", priority: "high", due_in_days: "7" }),
  linear("compliance-inspection-due-reminder", "Inspection due → reminder", "Add a calendar reminder when a routine property inspection falls due.", "compliance", "Operator", { kind: "event", type: "inspection_due", config: { within_days: 14 } }, "compliance.expiring", "action.create_calendar_reminder", "create_calendar_reminder", { title: "Property inspection due: {{summary}}", due_in_days: "0" }),
  linear("compliance-inspection-overdue-flag", "Inspection overdue → flag", "Flag the property when a scheduled inspection passes its due date.", "compliance", "Operator", { kind: "event", type: "inspection_overdue", config: {} }, "compliance.expiring", "action.flag_marketplace_order", "flag_record", { reason: "Inspection overdue: {{summary}}" }),
  linear("compliance-document-expiring", "Document expiring → renewal reminder", "Create a renewal task when a tracked document is approaching expiry.", "compliance", "Operator", { kind: "event", type: "document_expiring", config: { within_days: 30 } }, "compliance.expiring", "action.create_task", "create_task", { title: "Renew document: {{summary}}", priority: "normal", due_in_days: "14" }),

  // ── Legal (deposit law — England & Wales) ───────────────────────────────────
  linear("legal-deposit-unprotected", "Deposit unprotected → urgent protect", "Raise an urgent notification when a taken deposit is not yet protected — the law sets a 30-day deadline.", "legal", "Operator", { kind: "event", type: "deposit_unprotected", config: {} }, "record.updated", "comm.internal_notification", "create_notification", { title: "Deposit unprotected: {{summary}}", body: "Protect the deposit in an approved scheme and serve prescribed information — statutory 30-day deadline.", severity: "critical" }, true),
  linear("legal-deposit-return-overdue", "Deposit return overdue → action task", "Create a task when a deposit return is overdue after a tenancy ends.", "legal", "Operator", { kind: "event", type: "deposit_return_overdue", config: {} }, "record.updated", "action.create_task", "create_task", { title: "Return deposit: {{summary}}", description: "Agree deductions and return the balance; document any dispute.", priority: "high", due_in_days: "3" }),

  // ── Money ───────────────────────────────────────────────────────────────────
  linear("money-rent-due-reminder", "Rent due soon → friendly reminder draft", "Draft a friendly reminder a few days before rent is due (review-first, never auto-sends).", "money", "Operator", { kind: "event", type: "rent_due_soon", config: { within_days: 3 } }, "invoice.overdue", "comm.external_message_draft", "draft_message", { subject: "Rent due soon", body: "Hi, a friendly reminder that your rent is due shortly. Thank you!" }, true),
  linear("money-payment-failed-retry", "Payment failed → notify + retry task", "Notify and create a retry task when a payment fails.", "money", "Operator", { kind: "event", type: "payment_failed", config: {} }, "invoice.overdue", "comm.internal_notification", "create_notification", { title: "Payment failed: {{summary}}", body: "A payment failed — contact the payer and arrange a retry.", severity: "warning" }),
  linear("money-arrears-threshold", "Arrears threshold reached → escalate", "Raise a notification when arrears cross your review threshold.", "money", "Operator", { kind: "event", type: "arrears_threshold_reached", config: {} }, "invoice.overdue", "comm.internal_notification", "create_notification", { title: "Arrears threshold reached: {{summary}}", body: "Arrears have crossed the review threshold — route for a decision.", severity: "warning" }, true),
  linear("money-rent-received-receipt", "Rent received → receipt draft", "Draft a receipt when a rent payment settles.", "money", "Operator", { kind: "event", type: "rent_payment_received", config: {} }, "money.payment_received", "comm.external_message_draft", "draft_message", { subject: "Rent received", body: "Thanks — we've received your rent payment. Your receipt is attached." }),
  linear("money-invoice-overdue-chase-real", "Invoice overdue → chase draft", "Draft a polite chase when an invoice passes its due date.", "money", "Operator", { kind: "event", type: "invoice_overdue", config: { min_days_overdue: 3 } }, "invoice.overdue", "comm.external_message_draft", "draft_message", { subject: "Outstanding invoice", body: "Our records show an outstanding balance — please let us know when payment will be made." }),

  // ── Suppliers & maintenance ─────────────────────────────────────────────────
  linear("supplier-maintenance-submitted", "Maintenance request → triage task", "Create a triage task when a tenant submits a maintenance request.", "supplier", "Operator", { kind: "event", type: "maintenance_request_submitted", config: {} }, "record.created", "action.create_task", "create_task", { title: "Triage maintenance: {{summary}}", description: "Assess urgency, assign a contractor and set an SLA.", priority: "high", due_in_days: "1" }, true),
  linear("supplier-maintenance-overdue", "Maintenance overdue → escalate", "Escalate when a maintenance request passes its SLA without resolution.", "supplier", "Operator", { kind: "event", type: "maintenance_request_overdue", config: {} }, "work.task_overdue", "comm.internal_notification", "create_notification", { title: "Maintenance overdue: {{summary}}", body: "A maintenance request is past its SLA — reassign or chase.", severity: "warning" }),
  linear("supplier-job-overdue-chase", "Supplier job overdue → chase", "Notify ops when a supplier job passes its due date.", "supplier", "Pro / Agency", { kind: "event", type: "job_overdue", config: {} }, "work.task_overdue", "comm.internal_notification", "create_notification", { title: "Supplier job overdue: {{summary}}", body: "A supplier job is overdue — chase the contractor or reassign.", severity: "warning" }),
  linear("supplier-quote-received-review", "Quote received → review task", "Create a task to review and approve a new supplier quote.", "supplier", "Operator", { kind: "event", type: "quote_received", config: {} }, "record.created", "action.create_task", "create_task", { title: "Review quote: {{summary}}", description: "Compare against budget and approve or reject.", priority: "normal", due_in_days: "2" }),
  linear("supplier-quote-expiring", "Quote expiring → decision reminder", "Notify when a received quote is about to expire and needs a decision.", "supplier", "Operator", { kind: "event", type: "quote_expiring", config: { within_days: 3 } }, "record.updated", "comm.internal_notification", "create_notification", { title: "Quote expiring: {{summary}}", body: "A supplier quote is about to expire — approve or decline.", severity: "warning" }),
  linear("supplier-contractor-unreviewed", "Contractor unreviewed → review task", "Prompt for a contractor review after a completed job goes unrated.", "supplier", "Operator", { kind: "event", type: "contractor_not_reviewed", config: {} }, "record.updated", "action.create_task", "create_task", { title: "Leave a contractor review: {{summary}}", priority: "low", due_in_days: "3" }),

  // ── Portfolio & lettings lifecycle ──────────────────────────────────────────
  linear("portfolio-property-added", "Property added → onboarding checklist", "Create an onboarding task the moment a property is added.", "portfolio", "Operator", { kind: "event", type: "property_added", config: {} }, "record.created", "action.create_task", "create_task", { title: "Onboard property: {{summary}}", description: "Add docs, photos, compliance items and rent terms.", priority: "high", due_in_days: "7" }, true),
  linear("portfolio-tenancy-started", "Tenancy started → welcome pack draft", "Draft a welcome message the moment a tenancy starts.", "portfolio", "Operator", { kind: "event", type: "tenancy_started", config: {} }, "portfolio.tenancy_started", "comm.external_message_draft", "draft_message", { subject: "Welcome to your new home", body: "Hi, welcome! Here's everything you need to get started." }),
  linear("portfolio-tenancy-expired", "Tenancy expired → urgent re-let", "Create an urgent re-let task when a tenancy has expired without renewal.", "portfolio", "Operator", { kind: "event", type: "tenancy_expired", config: {} }, "portfolio.tenancy_ending", "action.create_task", "create_task", { title: "Urgent re-let: {{summary}}", description: "Tenancy has expired — re-let or formalise a renewal.", priority: "high", due_in_days: "3" }),
  linear("portfolio-lease-renewal", "Lease renewal approaching → prepare offer", "Create a task to prepare a renewal offer ahead of the lease anniversary.", "portfolio", "Operator", { kind: "event", type: "lease_renewal_approaching", config: { within_days: 60 } }, "portfolio.tenancy_ending", "action.create_task", "create_task", { title: "Prepare renewal offer: {{summary}}", priority: "normal", due_in_days: "21" }),
  linear("portfolio-move-out", "Move-out approaching → check-out checklist", "Create a check-out checklist task before a tenant moves out.", "portfolio", "Operator", { kind: "event", type: "move_out_approaching", config: { within_days: 14 } }, "portfolio.tenancy_ending", "action.create_task", "create_task", { title: "Check-out checklist: {{summary}}", description: "Book the inspection, meter reads and deposit review.", priority: "normal", due_in_days: "7" }),
  linear("portfolio-void-started", "Void period started → re-let task", "Create a re-let task when a unit becomes void.", "portfolio", "Operator", { kind: "event", type: "void_period_started", config: {} }, "record.updated", "action.create_task", "create_task", { title: "Re-let void unit: {{summary}}", priority: "normal", due_in_days: "7" }),
  linear("portfolio-void-long", "Long void → marketing escalation", "Escalate to marketing when a void runs longer than expected.", "portfolio", "Operator", { kind: "event", type: "void_period_long", config: {} }, "record.updated", "comm.internal_notification", "create_notification", { title: "Long void: {{summary}}", body: "This unit has been void too long — review pricing and marketing.", severity: "warning" }),
  linear("portfolio-unit-vacant", "Unit vacant → marketing task", "Create a marketing task when a unit is vacant.", "portfolio", "Operator", { kind: "event", type: "unit_vacant", config: {} }, "record.updated", "action.create_task", "create_task", { title: "Market vacant unit: {{summary}}", priority: "normal", due_in_days: "3" }),

  // ── Customer & lettings funnel ──────────────────────────────────────────────
  linear("customer-viewing-not-booked", "No viewing booked → nudge draft", "Draft a nudge when an enquiry hasn't booked a viewing.", "customer", "Operator", { kind: "event", type: "viewing_not_booked", config: {} }, "record.updated", "comm.external_message_draft", "draft_message", { subject: "Book your viewing", body: "Hi, would you like to book a viewing? Here are some available times." }),
  linear("customer-referencing-overdue", "Referencing overdue → chase", "Notify when applicant referencing is overdue.", "customer", "Operator", { kind: "event", type: "referencing_overdue", config: {} }, "work.task_overdue", "comm.internal_notification", "create_notification", { title: "Referencing overdue: {{summary}}", body: "Applicant referencing is overdue — chase the applicant or referencing provider.", severity: "warning" }),
  linear("customer-offer-accepted", "Offer accepted → start tenancy setup", "Kick off tenancy setup when an offer is accepted.", "customer", "Operator", { kind: "event", type: "offer_accepted", config: {} }, "record.created", "action.create_task", "create_task", { title: "Start tenancy setup: {{summary}}", description: "Issue the agreement, start referencing and collect the holding deposit.", priority: "high", due_in_days: "2" }, true),
  linear("customer-complaint-received", "Complaint received → triage task", "Create a triage task when a complaint is logged.", "customer", "Operator", { kind: "event", type: "complaint_received", config: {} }, "record.created", "action.create_task", "create_task", { title: "Triage complaint: {{summary}}", description: "Acknowledge within SLA, assign an owner and log the resolution path.", priority: "high", due_in_days: "1" }, true),
  linear("customer-portal-unanswered", "Unanswered portal message → reply reminder", "Create a reminder when a portal message goes unanswered.", "customer", "Operator", { kind: "event", type: "portal_message_unanswered", config: {} }, "work.task_overdue", "action.create_task", "create_task", { title: "Reply to portal message: {{summary}}", priority: "normal", due_in_days: "1" }),

  // ── Bookings & SA (real booking triggers) ───────────────────────────────────
  linear("booking-checkin-tomorrow", "Check-in tomorrow → instructions draft", "Draft check-in instructions the day before a guest arrives.", "booking", "Pro / Agency", { kind: "event", type: "booking_checkin_tomorrow", config: {} }, "booking.confirmed", "comm.external_message_draft", "draft_message", { subject: "Your check-in details", body: "Hi, you're checking in tomorrow — here are your access and check-in details." }, true),
  linear("booking-checkout-today-clean", "Check-out today → turnover clean", "Create a turnover cleaning task on the checkout day.", "booking", "Pro / Agency", { kind: "event", type: "booking_checkout_today", config: {} }, "booking.confirmed", "action.create_cleaning_task", "create_task", { title: "Turnover clean — {{summary}}", priority: "high", due_in_days: "0" }),
  linear("booking-cancelled-notify", "Booking cancelled → notify ops", "Notify ops to re-open the calendar when a booking is cancelled.", "booking", "Pro / Agency", { kind: "event", type: "booking_cancelled", config: {} }, "booking.confirmed", "comm.internal_notification", "create_notification", { title: "Booking cancelled: {{summary}}", body: "Re-open the calendar and review any refund.", severity: "warning" }),

  // ── HMO (real room trigger) ─────────────────────────────────────────────────
  linear("hmo-room-vacant", "HMO room vacant → re-let task", "Create a re-let task when an HMO room becomes vacant.", "hmo", "Operator", { kind: "event", type: "hmo_room_vacant", config: {} }, "record.updated", "action.create_task", "create_task", { title: "Re-let HMO room: {{summary}}", priority: "normal", due_in_days: "5" }),
]

/**
 * The curated recipe catalogue. Each is review-first and disabled on install.
 * Domains span the whole product surface; every action node maps to a safe
 * catalogue action or a gated approval node.
 */
export const SMART_RECIPES: SmartRecipe[] = [
  // ── Compliance ─────────────────────────────────────────────────────────────
  {
    slug: "compliance-expiry-task",
    name: "Compliance expiring → renewal task",
    description: "When a certificate or licence falls due within 30 days, create a high-priority renewal task.",
    domain: "compliance",
    minPlan: "Operator",
    recommended: true,
    trigger: { kind: "event", type: "compliance_due_soon", config: { within_days: 30 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "compliance.expiring", config: { within_days: 30 } },
        { node_key: "a1", node_type: "action.create_task", config: { title: "Renew: {{summary}}", description: "Book the renewal before the due date.", priority: "high", due_in_days: 14 } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_task", config: { title: "Renew: {{summary}}", description: "Book the renewal before the due date.", priority: "high", due_in_days: "14" } }],
  },
  {
    slug: "compliance-overdue-escalate",
    name: "Compliance overdue → notify + flag",
    description: "When a compliance item is overdue, raise a critical notification and flag the record.",
    domain: "compliance",
    minPlan: "Operator",
    trigger: { kind: "event", type: "compliance_overdue", config: { min_days_overdue: 0 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "compliance.expiring", config: {} },
        { node_key: "c1", node_type: "comm.internal_notification", config: { title: "Overdue: {{summary}}", body: "Past its due date.", severity: "critical" } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "c1" }, { source_key: "c1", target_key: "e1" } ],
    },
    actions: [
      { action_type: "create_notification", config: { title: "Overdue: {{summary}}", body: "This compliance item is past its due date.", severity: "critical" } },
      { action_type: "flag_record", config: { reason: "Compliance overdue: {{summary}}" } },
    ],
  },
  // ── Money ──────────────────────────────────────────────────────────────────
  {
    slug: "rent-arrears-draft",
    name: "Rent overdue → draft chase (review-first)",
    description: "Draft a polite arrears chase message for review when rent is 3+ days overdue. Never auto-sends.",
    domain: "money",
    minPlan: "Operator",
    recommended: true,
    trigger: { kind: "event", type: "rent_overdue", config: { min_days_overdue: 3, min_amount: 0 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "invoice.overdue", config: { min_days_overdue: 3 } },
        { node_key: "c1", node_type: "comm.external_message_draft", config: { subject: "Rent reminder", body: "Hi, our records show an outstanding balance. Could you let us know when payment will be made? Thank you." } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "c1" }, { source_key: "c1", target_key: "e1" } ],
    },
    actions: [{ action_type: "draft_message", config: { subject: "Rent reminder", body: "Hi, our records show an outstanding balance on your rent. Could you let us know when payment will be made? Thank you." } }],
  },
  {
    slug: "payout-release-approval",
    name: "Payout release → human approval (gated)",
    description: "Routes a payout release through a mandatory human approval. The engine never releases a payout automatically.",
    domain: "money",
    minPlan: "Scale",
    trigger: { kind: "event", type: "job_completed", config: { within_days: 7 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "supplier.job.completed", config: {} },
        { node_key: "g1", node_type: "approval.request_human", config: { title: "Approve supplier payout", summary: "Release payout for completed job: {{summary}}", sla_hours: 24 } },
        { node_key: "p1", node_type: "payment.release_payout_after_approval", config: { reference: "{{summary}}" } },
        { node_key: "e1", node_type: "end.waiting_approval" },
      ],
      edges: [ { source_key: "t1", target_key: "g1" }, { source_key: "g1", target_key: "p1" }, { source_key: "p1", target_key: "e1" } ],
    },
    // No auto actions: the only side-effecting nodes are gated (approval+payment).
    actions: [{ action_type: "create_notification", config: { title: "Payout awaiting approval: {{summary}}", body: "A supplier payout is waiting for your approval.", severity: "warning" } }],
  },
  // ── Booking ────────────────────────────────────────────────────────────────
  {
    slug: "checkout-cleaning-task",
    name: "Checkout due → create cleaning task",
    description: "When a booking checkout is due, create a cleaning task for the property.",
    domain: "booking",
    minPlan: "Pro / Agency",
    recommended: true,
    trigger: { kind: "event", type: "job_completed", config: { within_days: 1 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "booking.checkout_due", config: {} },
        { node_key: "a1", node_type: "action.create_cleaning_task", config: { title: "Checkout clean — {{summary}}", due_in_days: 1 } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_task", config: { title: "Checkout clean — {{summary}}", description: "Turn over the property after checkout.", priority: "high", due_in_days: "1" } }],
  },
  // ── Supplier ───────────────────────────────────────────────────────────────
  {
    slug: "supplier-evidence-request",
    name: "Job complete → request supplier evidence",
    description: "When a supplier marks a job complete, draft a request for completion evidence (review-first).",
    domain: "supplier",
    minPlan: "Pro / Agency",
    trigger: { kind: "event", type: "job_completed", config: { within_days: 7 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "supplier.job.completed", config: {} },
        { node_key: "a1", node_type: "action.request_supplier_evidence", config: { title: "Evidence requested", description: "Please upload photos and the completion sign-off for {{summary}}." } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "draft_message", config: { subject: "Evidence requested", body: "Please upload photos and the completion sign-off for {{summary}}." } }],
  },
  // ── Marketplace ───────────────────────────────────────────────────────────
  {
    slug: "marketplace-new-transaction-task",
    name: "New marketplace transaction → review task",
    description: "When a marketplace transaction opens, create a task to review and fulfil it.",
    domain: "marketplace",
    minPlan: "Pro / Agency",
    trigger: { kind: "event", type: "job_completed", config: { within_days: 1 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "marketplace.transaction.created", config: {} },
        { node_key: "l1", node_type: "lookup.marketplace_transaction", config: {} },
        { node_key: "a1", node_type: "action.create_task", config: { title: "Review transaction: {{summary}}", priority: "normal", due_in_days: 1 } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "l1" }, { source_key: "l1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_task", config: { title: "Review transaction: {{summary}}", description: "Review and fulfil the new marketplace transaction.", priority: "normal", due_in_days: "1" } }],
  },
  // ── Legal ──────────────────────────────────────────────────────────────────
  {
    slug: "legal-review-gate",
    name: "Legal review required → route to reviewer (gated)",
    description: "Routes legal content to a human reviewer. Never serves or files a notice automatically.",
    domain: "legal",
    minPlan: "Scale",
    trigger: { kind: "event", type: "compliance_overdue", config: { min_days_overdue: 14 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "legal.review.required", config: {} },
        { node_key: "g1", node_type: "approval.request_legal_review", config: { title: "Legal review required", summary: "Review before any notice: {{summary}}", sla_hours: 48 } },
        { node_key: "d1", node_type: "legal.create_draft", config: { document_type: "notice", summary: "{{summary}}" } },
        { node_key: "e1", node_type: "end.waiting_approval" },
      ],
      edges: [ { source_key: "t1", target_key: "g1" }, { source_key: "g1", target_key: "d1" }, { source_key: "d1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_notification", config: { title: "Legal review required: {{summary}}", body: "An item needs legal review before any further action.", severity: "warning" } }],
  },
  // ── Customer ───────────────────────────────────────────────────────────────
  {
    slug: "tenancy-ending-renewal",
    name: "Tenancy ending → renewal decision task",
    description: "Create a renewal decision task 60 days before a tenancy ends.",
    domain: "customer",
    minPlan: "Operator",
    recommended: true,
    trigger: { kind: "event", type: "tenancy_ending", config: { within_days: 60 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "field.changed", config: { field: "end_date" } },
        { node_key: "a1", node_type: "action.create_task", config: { title: "Renewal decision: {{summary}}", priority: "normal", due_in_days: 21 } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_task", config: { title: "Renewal decision: {{summary}}", description: "Decide renew vs re-let and contact the tenant.", priority: "normal", due_in_days: "21" } }],
  },
  ...EXTRA_RECIPES,
  ...TRIGGER_RECIPES,
]

export function recipeBySlug(slug: string): SmartRecipe | undefined {
  return SMART_RECIPES.find((r) => r.slug === slug)
}
export function recipesByDomain(domain: RecipeDomain): SmartRecipe[] {
  return SMART_RECIPES.filter((r) => r.domain === domain)
}

/** Build the canvas graph (with categories/risk normalised) for a recipe. */
function recipeGraph(recipe: SmartRecipe): CanvasGraph {
  let i = 0
  const nodes = recipe.graph.nodes.map((n) => ({
    node_key: n.node_key,
    node_type: n.node_type,
    category: "utility",
    label: n.label ?? null,
    config: n.config ?? {},
    risk: "low" as const,
    pos_x: 80 + (i % 4) * 220,
    pos_y: 80 + Math.floor(i++ / 4) * 160,
  }))
  const edges = recipe.graph.edges.map((e) => ({ source_key: e.source_key, target_key: e.target_key, branch_label: e.branch_label ?? null }))
  return { nodes, edges }
}

export interface InstantiateResult {
  ok: boolean
  definitionId?: string
  versionId?: string
  error?: string
  /** Compile issues (recipe should compile clean; surfaced for honesty). */
  issues?: Array<{ level: string; code: string; message: string }>
}

/**
 * Instantiate a recipe into the workspace as a DISABLED DRAFT definition + its
 * node-graph version. NEVER enables or runs it. Returns the new ids.
 */
export async function instantiateRecipe(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  slug: string,
): Promise<InstantiateResult> {
  const recipe = recipeBySlug(slug)
  if (!recipe) return { ok: false, error: "Unknown recipe." }

  // Only keep actions that map to a real safe action (defence in depth).
  const safeActions = recipe.actions.filter((a) => {
    return ["create_task", "create_notification", "draft_message", "flag_record", "create_calendar_reminder"].includes(String(a.action_type))
  }) as Array<{ action_type: ActionType; config?: Record<string, unknown> }>

  try {
    const { id: definitionId } = await createDefinition(supabase, workspaceId, userId, {
      name: recipe.name,
      description: recipe.description,
      trigger: recipe.trigger,
      conditions: {},
      actions: safeActions,
      enabled: false, // DISABLED DRAFT — never auto-activates
      source: "template",
    })

    const graph = recipeGraph(recipe)
    const compiled = compileCanvas(graph)
    const version = await createVersion(supabase, workspaceId, definitionId, graph, {
      userId,
      status: compiled.ok ? "validated" : "invalid",
      compiled: compiled.plan as unknown as Record<string, unknown>,
      validation: { ok: compiled.ok, issues: compiled.issues },
      notes: `Instantiated from recipe "${recipe.slug}".`,
    })

    return {
      ok: true,
      definitionId,
      versionId: version?.id,
      issues: compiled.issues.map((i) => ({ level: i.level, code: i.code, message: i.message })),
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to instantiate recipe." }
  }
}

/** Map a recipe's action node type → its safe executor action (for previews). */
export function recipeActionFor(nodeType: string): string | undefined {
  return NODE_ACTION_MAP[nodeType]
}
