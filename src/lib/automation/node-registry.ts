export type AutomationRiskLevel = "low" | "medium" | "high" | "critical" | "restricted"

export type AutomationNodeGroup =
  | "Trigger"
  | "Condition"
  | "Branch"
  | "Delay"
  | "Lookup"
  | "AI"
  | "Action"
  | "Communication"
  | "Payment"
  | "Approval"
  | "Legal"
  | "Integration"
  | "Webhook/API"
  | "Utility"
  | "Error"
  | "End"

export interface AutomationNodeDefinition {
  type: string
  label: string
  group: AutomationNodeGroup
  scope: string
  risk: AutomationRiskLevel
  plan: "Starter" | "Operator" | "Scale" | "Pro / Agency" | "Enterprise"
  requiresApproval?: boolean
  blockedFromAutoRun?: boolean
  description: string
}

export interface AutomationNavItem {
  label: string
  href: string
  match: string[]
}

export const AUTOMATION_NAV_ITEMS: AutomationNavItem[] = [
  { label: "Overview", href: "/property-manager/automations/overview", match: ["/automations", "/automations/overview", "/automations/home"] },
  { label: "Recipes", href: "/property-manager/automations/recipes", match: ["/automations/recipes", "/automations/templates"] },
  { label: "My Automations", href: "/property-manager/automations/my-automations", match: ["/automations/my-automations"] },
  { label: "Canvas Builder", href: "/property-manager/automations/canvas", match: ["/automations/canvas", "/automations/builder"] },
  { label: "AI Builder", href: "/property-manager/automations/ai-builder", match: ["/automations/ai-builder"] },
  { label: "Runs & Logs", href: "/property-manager/automations/runs-logs", match: ["/automations/runs-logs", "/automations/runs"] },
  { label: "Review Inbox", href: "/property-manager/automations/approvals", match: ["/automations/approvals"] },
  { label: "Errors", href: "/property-manager/automations/errors", match: ["/automations/errors"] },
  { label: "Usage & Limits", href: "/property-manager/automations/usage-limits", match: ["/automations/usage-limits", "/automations/usage"] },
  { label: "Activity", href: "/property-manager/automations/activity", match: ["/automations/activity"] },
]

export const AUTOMATION_STATUSES = [
  "draft",
  "needs_review",
  "test_ready",
  "active",
  "paused",
  "failed",
  "archived",
  "disabled_by_plan",
  "disabled_by_admin",
  "disabled_by_error",
] as const

export const AUTOMATION_NODE_REGISTRY: AutomationNodeDefinition[] = [
  // ── TRIGGERS (record / portfolio / work / booking / marketplace / supplier /
  //    money / compliance / legal / AI / schedule / webhook) ──────────────────
  { type: "record.created", label: "Record Created", group: "Trigger", scope: "workspace", risk: "low", plan: "Starter", description: "Starts when a workspace record is created." },
  { type: "record.updated", label: "Record Updated", group: "Trigger", scope: "workspace", risk: "low", plan: "Starter", description: "Starts when any field on a watched record changes." },
  { type: "record.deleted", label: "Record Deleted", group: "Trigger", scope: "workspace", risk: "low", plan: "Operator", description: "Starts when a record is archived or deleted." },
  { type: "field.changed", label: "Field Changed", group: "Trigger", scope: "workspace", risk: "low", plan: "Starter", description: "Starts when a watched field changes value." },
  { type: "portfolio.property_added", label: "Property Added", group: "Trigger", scope: "portfolio", risk: "low", plan: "Operator", description: "Starts when a property is added to the portfolio." },
  { type: "portfolio.tenancy_started", label: "Tenancy Started", group: "Trigger", scope: "portfolio", risk: "medium", plan: "Operator", description: "Starts when a new tenancy begins." },
  { type: "portfolio.tenancy_ending", label: "Tenancy Ending", group: "Trigger", scope: "portfolio", risk: "medium", plan: "Operator", description: "Starts ahead of a tenancy end date." },
  { type: "work.task_created", label: "Task Created", group: "Trigger", scope: "work", risk: "low", plan: "Starter", description: "Starts when a work task is created." },
  { type: "work.task_overdue", label: "Task Overdue", group: "Trigger", scope: "work", risk: "medium", plan: "Operator", description: "Starts when a task passes its due date." },
  { type: "booking.confirmed", label: "Booking Confirmed", group: "Trigger", scope: "booking", risk: "medium", plan: "Pro / Agency", description: "Starts when a booking becomes confirmed." },
  { type: "booking.cancelled", label: "Booking Cancelled", group: "Trigger", scope: "booking", risk: "medium", plan: "Pro / Agency", description: "Starts when a booking is cancelled." },
  { type: "booking.checkin_due", label: "Check-in Due", group: "Trigger", scope: "booking", risk: "medium", plan: "Pro / Agency", description: "Starts before a booking check-in." },
  { type: "booking.checkout_due", label: "Checkout Due", group: "Trigger", scope: "booking", risk: "medium", plan: "Pro / Agency", description: "Starts before checkout based on local calendar rules." },
  { type: "marketplace.transaction.created", label: "Marketplace Transaction Created", group: "Trigger", scope: "marketplace_transaction", risk: "medium", plan: "Pro / Agency", description: "Starts when a marketplace order or transaction is opened." },
  { type: "marketplace.order_disputed", label: "Marketplace Order Disputed", group: "Trigger", scope: "marketplace_transaction", risk: "high", plan: "Pro / Agency", requiresApproval: true, description: "Starts when a buyer raises a marketplace dispute." },
  { type: "marketplace.review_received", label: "Marketplace Review Received", group: "Trigger", scope: "marketplace_transaction", risk: "low", plan: "Pro / Agency", description: "Starts when a marketplace review is posted." },
  { type: "supplier.job.assigned", label: "Supplier Job Assigned", group: "Trigger", scope: "supplier_job", risk: "low", plan: "Pro / Agency", description: "Starts when a supplier is assigned a job." },
  { type: "supplier.job.completed", label: "Supplier Job Completed", group: "Trigger", scope: "supplier_job", risk: "medium", plan: "Pro / Agency", description: "Starts when a supplier marks a job complete." },
  { type: "supplier.evidence_uploaded", label: "Supplier Evidence Uploaded", group: "Trigger", scope: "supplier_job", risk: "low", plan: "Pro / Agency", description: "Starts when a supplier uploads completion evidence." },
  { type: "invoice.overdue", label: "Invoice Overdue", group: "Trigger", scope: "accounting", risk: "medium", plan: "Operator", description: "Starts when an invoice crosses the overdue threshold." },
  { type: "money.payment_received", label: "Payment Received", group: "Trigger", scope: "accounting", risk: "low", plan: "Operator", description: "Starts when an inbound payment settles." },
  { type: "money.payout_due", label: "Payout Due", group: "Trigger", scope: "payment", risk: "high", plan: "Scale", requiresApproval: true, description: "Starts when a supplier or owner payout becomes due." },
  { type: "compliance.expiring", label: "Compliance Expiring", group: "Trigger", scope: "compliance", risk: "high", plan: "Operator", requiresApproval: true, description: "Starts before a certificate, licence, or safety item expires." },
  { type: "compliance.failed", label: "Compliance Check Failed", group: "Trigger", scope: "compliance", risk: "high", plan: "Operator", requiresApproval: true, description: "Starts when a compliance check is recorded as failed." },
  { type: "legal.review.required", label: "Legal Review Required", group: "Trigger", scope: "legal", risk: "critical", plan: "Scale", requiresApproval: true, description: "Starts review-first legal workflows." },
  { type: "ai.signal_detected", label: "AI Signal Detected", group: "Trigger", scope: "workspace", risk: "high", plan: "Scale", requiresApproval: true, description: "Starts when an AI monitor flags a risk or anomaly." },
  { type: "schedule.daily", label: "Daily Schedule", group: "Trigger", scope: "workspace", risk: "low", plan: "Operator", description: "Runs once per day at a set local time." },
  { type: "schedule.custom_cron", label: "Custom Cron", group: "Trigger", scope: "workspace", risk: "medium", plan: "Scale", description: "Runs on a configured cron schedule with caps." },
  { type: "webhook.incoming", label: "Incoming Webhook", group: "Webhook/API", scope: "workspace", risk: "medium", plan: "Scale", description: "Accepts signed inbound events from an external system." },
  // ── CONDITIONS (basic / entity / safety / context) ──────────────────────────
  { type: "condition.if_else", label: "If / Else", group: "Condition", scope: "workspace", risk: "low", plan: "Starter", description: "Routes records based on a true or false expression." },
  { type: "condition.field_compare", label: "Compare Fields", group: "Condition", scope: "workspace", risk: "low", plan: "Starter", description: "Compares two record fields or a field to a constant." },
  { type: "condition.entity_state", label: "Entity In State", group: "Condition", scope: "workspace", risk: "low", plan: "Operator", description: "Continues only when an entity is in a given status." },
  { type: "condition.plan_allows", label: "If Plan Allows", group: "Condition", scope: "workspace", risk: "low", plan: "Starter", description: "Stops workflows that exceed the workspace plan." },
  { type: "condition.within_caps", label: "If Within Safety Caps", group: "Condition", scope: "workspace", risk: "low", plan: "Operator", description: "Continues only when daily safety caps are not exceeded." },
  { type: "condition.business_context", label: "Business Context Match", group: "Condition", scope: "workspace", risk: "low", plan: "Operator", description: "Continues based on workspace context (role, region, hours)." },
  { type: "condition.payment_release_allowed", label: "If Payment Release Allowed", group: "Condition", scope: "payment", risk: "critical", plan: "Scale", requiresApproval: true, description: "Checks disputes, provider state, role gate, and approval state." },
  // ── BRANCH / ROUTER ─────────────────────────────────────────────────────────
  { type: "branch.match_country", label: "Match Country", group: "Branch", scope: "compliance", risk: "medium", plan: "Operator", description: "Routes work by country profile and local rule set." },
  { type: "branch.switch", label: "Switch / Router", group: "Branch", scope: "workspace", risk: "low", plan: "Operator", description: "Routes to one of many paths by a key value." },
  { type: "branch.split_parallel", label: "Split (Parallel)", group: "Branch", scope: "workspace", risk: "low", plan: "Scale", description: "Fans out to run several paths in parallel." },
  // ── DELAY / TIME ────────────────────────────────────────────────────────────
  { type: "delay.fixed", label: "Wait (Fixed)", group: "Delay", scope: "workspace", risk: "low", plan: "Starter", description: "Waits a fixed amount of time before continuing." },
  { type: "delay.until_date", label: "Wait Until Date", group: "Delay", scope: "workspace", risk: "low", plan: "Operator", description: "Waits until a date field is reached." },
  { type: "delay.business_hours", label: "Delay For Business Hours", group: "Delay", scope: "workspace", risk: "low", plan: "Operator", description: "Waits until the next allowed local business window." },
  // ── DATA LOOKUP ─────────────────────────────────────────────────────────────
  { type: "lookup.record", label: "Get Record", group: "Lookup", scope: "workspace", risk: "low", plan: "Operator", description: "Loads a related record by id with RLS." },
  { type: "lookup.preferred_suppliers", label: "Get Preferred Suppliers", group: "Lookup", scope: "supplier_job", risk: "medium", plan: "Pro / Agency", description: "Finds workspace-scoped verified suppliers for a job category." },
  { type: "lookup.marketplace_transaction", label: "Get Marketplace Transaction", group: "Lookup", scope: "marketplace_transaction", risk: "medium", plan: "Pro / Agency", description: "Loads transaction context with RLS and redaction." },
  { type: "lookup.account_balance", label: "Get Account Balance", group: "Lookup", scope: "accounting", risk: "low", plan: "Operator", description: "Reads a ledger account balance (read-only)." },
  // ── AI (generation / analysis / control) ────────────────────────────────────
  { type: "ai.generate_summary", label: "AI Generate Summary", group: "AI", scope: "workspace", risk: "medium", plan: "Scale", requiresApproval: true, description: "Summarises context into a draft for review." },
  { type: "ai.draft_message", label: "AI Draft Message", group: "AI", scope: "customer", risk: "medium", plan: "Scale", requiresApproval: true, description: "Creates a draft message for review." },
  { type: "ai.classify", label: "AI Classify", group: "AI", scope: "workspace", risk: "medium", plan: "Scale", requiresApproval: true, description: "Classifies an item into a category for routing." },
  { type: "ai.risk_score", label: "AI Risk Score", group: "AI", scope: "workspace", risk: "high", plan: "Scale", requiresApproval: true, description: "Scores operational risk without taking destructive action." },
  { type: "ai.guardrail_check", label: "AI Guardrail Check", group: "AI", scope: "workspace", risk: "high", plan: "Scale", requiresApproval: true, description: "Runs an AI safety guardrail before a downstream step." },
  // ── ACTION (record / booking / supplier / marketplace / money / accounting /
  //    compliance / legal) ─────────────────────────────────────────────────────
  { type: "action.create_task", label: "Create Task", group: "Action", scope: "workspace", risk: "low", plan: "Starter", description: "Creates a workspace task or reminder." },
  { type: "action.update_record", label: "Update Record Field", group: "Action", scope: "workspace", risk: "medium", plan: "Operator", description: "Sets a safe field on the triggering record." },
  { type: "action.add_note", label: "Add Note", group: "Action", scope: "workspace", risk: "low", plan: "Starter", description: "Adds a timeline note to a record." },
  { type: "action.create_calendar_reminder", label: "Create Calendar Reminder", group: "Action", scope: "workspace", risk: "low", plan: "Starter", description: "Creates a calendar reminder for a date." },
  { type: "action.create_cleaning_task", label: "Create Cleaning Task", group: "Action", scope: "booking", risk: "low", plan: "Pro / Agency", description: "Creates a checkout cleaning task for a booking." },
  { type: "action.request_supplier_evidence", label: "Request Supplier Evidence", group: "Action", scope: "supplier_job", risk: "medium", plan: "Pro / Agency", description: "Asks a supplier to upload required evidence." },
  { type: "action.assign_supplier", label: "Assign Supplier", group: "Action", scope: "supplier_job", risk: "medium", plan: "Pro / Agency", description: "Drafts a supplier assignment for review." },
  { type: "action.flag_marketplace_order", label: "Flag Marketplace Order", group: "Action", scope: "marketplace_transaction", risk: "medium", plan: "Pro / Agency", description: "Flags a marketplace order for operator attention." },
  { type: "action.create_invoice_draft", label: "Create Invoice Draft", group: "Action", scope: "accounting", risk: "medium", plan: "Operator", description: "Drafts an invoice for review (never auto-issues)." },
  { type: "action.record_compliance_check", label: "Record Compliance Check", group: "Action", scope: "compliance", risk: "medium", plan: "Operator", description: "Logs a compliance check outcome on a record." },
  { type: "legal.create_draft", label: "Create Legal Draft", group: "Legal", scope: "legal", risk: "critical", plan: "Scale", requiresApproval: true, description: "Creates a legal draft without sending or serving it." },
  { type: "legal.auto_serve_notice", label: "Auto-Serve Notice", group: "Legal", scope: "legal", risk: "restricted", plan: "Enterprise", blockedFromAutoRun: true, description: "Registered as blocked so it cannot be silently automated." },
  // ── COMMUNICATION ───────────────────────────────────────────────────────────
  { type: "comm.internal_notification", label: "Send Internal Notification", group: "Communication", scope: "workspace", risk: "low", plan: "Starter", description: "Sends an in-app notification to a role or owner." },
  { type: "comm.external_message_draft", label: "Create External Message Draft", group: "Communication", scope: "customer", risk: "medium", plan: "Operator", requiresApproval: true, description: "Creates a customer, guest, tenant, or supplier message draft." },
  { type: "comm.email_draft", label: "Create Email Draft", group: "Communication", scope: "customer", risk: "medium", plan: "Operator", requiresApproval: true, description: "Drafts an email for review (never auto-sends)." },
  // ── PAYMENT (always gated) ──────────────────────────────────────────────────
  { type: "payment.release_payout_after_approval", label: "Release Payout After Approval", group: "Payment", scope: "payment", risk: "critical", plan: "Scale", requiresApproval: true, blockedFromAutoRun: true, description: "Releases payout only after approval and provider checks." },
  { type: "payment.issue_refund_after_approval", label: "Issue Refund After Approval", group: "Payment", scope: "payment", risk: "critical", plan: "Scale", requiresApproval: true, blockedFromAutoRun: true, description: "Issues a refund only after human approval." },
  { type: "payment.capture_after_approval", label: "Capture Payment After Approval", group: "Payment", scope: "payment", risk: "critical", plan: "Scale", requiresApproval: true, blockedFromAutoRun: true, description: "Captures a held payment only after approval." },
  // ── APPROVAL ────────────────────────────────────────────────────────────────
  { type: "approval.request_human", label: "Request Human Approval", group: "Approval", scope: "workspace", risk: "medium", plan: "Operator", description: "Creates an approval item and waits for a decision." },
  { type: "approval.request_legal_review", label: "Request Legal Review", group: "Approval", scope: "legal", risk: "critical", plan: "Scale", requiresApproval: true, description: "Routes legal content to a reviewer." },
  { type: "approval.request_finance_signoff", label: "Request Finance Sign-off", group: "Approval", scope: "payment", risk: "high", plan: "Scale", requiresApproval: true, description: "Routes a money action to a finance approver." },
  // ── INTEGRATION ─────────────────────────────────────────────────────────────
  { type: "integration.stripe_connect", label: "Stripe Connect", group: "Integration", scope: "payment", risk: "high", plan: "Scale", requiresApproval: true, description: "Uses Stripe Connect under approval, provider, and audit gates." },
  { type: "integration.channel_manager_webhook", label: "Channel Manager Webhook", group: "Integration", scope: "booking", risk: "medium", plan: "Pro / Agency", description: "Receives booking channel events through signed webhooks." },
  { type: "integration.accounting_sync", label: "Accounting Sync", group: "Integration", scope: "accounting", risk: "medium", plan: "Scale", description: "Pushes a draft entry to a connected accounting system." },
  // ── WEBHOOK / API ───────────────────────────────────────────────────────────
  { type: "webhook.outgoing", label: "Outgoing Webhook", group: "Webhook/API", scope: "workspace", risk: "medium", plan: "Scale", description: "Posts a signed event to a configured endpoint." },
  // ── UTILITY ─────────────────────────────────────────────────────────────────
  { type: "utility.redact_sensitive_data", label: "Redact Sensitive Data", group: "Utility", scope: "workspace", risk: "low", plan: "Starter", description: "Removes sensitive fields before logs or external calls." },
  { type: "utility.set_variable", label: "Set Variable", group: "Utility", scope: "workspace", risk: "low", plan: "Starter", description: "Stores a computed value for later nodes." },
  { type: "utility.format_text", label: "Format Text", group: "Utility", scope: "workspace", risk: "low", plan: "Starter", description: "Builds a string from tokens and record facts." },
  // ── ERROR HANDLING ──────────────────────────────────────────────────────────
  { type: "error.retry_with_backoff", label: "Retry With Backoff", group: "Error", scope: "workspace", risk: "low", plan: "Operator", description: "Retries failed nodes before stopping or falling back." },
  { type: "error.pause_after_threshold", label: "Pause After Threshold", group: "Error", scope: "workspace", risk: "medium", plan: "Operator", description: "Pauses repeated failures and notifies the owner." },
  { type: "error.fallback_path", label: "Fallback Path", group: "Error", scope: "workspace", risk: "low", plan: "Operator", description: "Routes to a safe fallback branch on failure." },
  // ── END (terminal) ──────────────────────────────────────────────────────────
  { type: "end.success", label: "End Success", group: "End", scope: "workspace", risk: "low", plan: "Starter", description: "Marks the run complete." },
  { type: "end.waiting_approval", label: "End Waiting Approval", group: "End", scope: "workspace", risk: "low", plan: "Starter", description: "Ends a run while an approval is pending." },
  { type: "end.stopped", label: "End Stopped", group: "End", scope: "workspace", risk: "low", plan: "Operator", description: "Ends a run early on a condition mismatch." },
]

export const AUTOMATION_PLAN_LIMITS = [
  { plan: "Starter", active: "3", runs: "250 / month", canvas: "No", nl: "Trial only", webhooks: "No", ai: "No", maxNodes: "5", retention: "7 days" },
  { plan: "Operator", active: "10", runs: "2,500 / month", canvas: "Basic", nl: "Limited", webhooks: "2", ai: "Limited", maxNodes: "15", retention: "30 days" },
  { plan: "Scale", active: "50", runs: "25,000 / month", canvas: "Yes", nl: "Yes", webhooks: "10", ai: "Yes", maxNodes: "50", retention: "90 days" },
  { plan: "Pro / Agency", active: "200", runs: "250,000 / month", canvas: "Advanced", nl: "Advanced", webhooks: "50", ai: "Advanced", maxNodes: "150", retention: "1 year" },
  { plan: "Enterprise", active: "Custom", runs: "Custom", canvas: "Advanced", nl: "Advanced", webhooks: "Custom", ai: "Advanced", maxNodes: "Custom", retention: "Custom" },
]

export const AUTOMATION_SETTINGS_SECTIONS = [
  "General",
  "Plans & Limits",
  "Approvals",
  "Notifications",
  "Integrations",
  "Webhooks",
  "AI Builder",
  "Safety",
  "Logs & Retention",
  "Admin Controls",
]

export const AUTOMATION_HARD_CAPS = [
  "Workspace runs per minute, hour, and day",
  "External API calls per run",
  "AI tokens and AI spend per day",
  "Payment actions per day",
  "Emails and messages per day",
  "Loop iterations, retries, and execution duration",
  "Webhook payload and JSON config size",
]

export function automationNodesByGroup(group: AutomationNodeGroup) {
  return AUTOMATION_NODE_REGISTRY.filter((node) => node.group === group)
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE MODEL — the canonical node categories + per-node config schema + the
// mapping from a node to the SAFE executor action it compiles to. This is the
// build-time source of truth the DB registry mirrors. Nothing here invents a
// destructive action: every node either (a) compiles to a safe catalogue action,
// (b) is a graph-control node (trigger/condition/branch/delay/end/utility/error
// /lookup) with no side-effect, or (c) is a GATED node (payment/legal/AI/
// external) that can never auto-run — it requires an approval object.
// ─────────────────────────────────────────────────────────────────────────────

/** The 16 node categories (lowercase canonical keys used in the DB). */
export const AUTOMATION_NODE_CATEGORIES = [
  "trigger",
  "condition",
  "branch",
  "delay",
  "lookup",
  "ai",
  "action",
  "communication",
  "payment",
  "approval",
  "legal",
  "integration",
  "webhook",
  "utility",
  "error",
  "end",
] as const
export type AutomationNodeCategory = (typeof AUTOMATION_NODE_CATEGORIES)[number]

/** Map a registry group (display) → canonical category key. */
export function groupToCategory(group: AutomationNodeGroup): AutomationNodeCategory {
  switch (group) {
    case "Trigger": return "trigger"
    case "Condition": return "condition"
    case "Branch": return "branch"
    case "Delay": return "delay"
    case "Lookup": return "lookup"
    case "AI": return "ai"
    case "Action": return "action"
    case "Communication": return "communication"
    case "Payment": return "payment"
    case "Approval": return "approval"
    case "Legal": return "legal"
    case "Integration": return "integration"
    case "Webhook/API": return "webhook"
    case "Utility": return "utility"
    case "Error": return "error"
    case "End": return "end"
  }
}

/** A single config field a node collects in the inspector. */
export interface NodeConfigField {
  key: string
  label: string
  kind: "text" | "textarea" | "number" | "select" | "boolean"
  required?: boolean
  default?: string | number | boolean
  options?: Array<{ value: string; label: string }>
  help?: string
  supportsTokens?: boolean
  /** For number fields — input bounds/step (default min 0, step 1). */
  min?: number
  max?: number
  step?: number
}

/**
 * Per-node config schema. Only nodes that take config appear here; everything
 * else defaults to an empty schema. Keys mirror what the compiler/executor read.
 */
export const NODE_CONFIG_SCHEMAS: Record<string, NodeConfigField[]> = {
  "record.created": [
    { key: "entity", label: "Record type", kind: "text", help: "Logical table to watch (e.g. tenancies)." },
  ],
  "field.changed": [
    { key: "entity", label: "Record type", kind: "text" },
    { key: "field", label: "Field", kind: "text", required: true },
  ],
  "compliance.expiring": [
    { key: "within_days", label: "Days ahead", kind: "number", default: 30, help: "Fire when due within this many days." },
  ],
  "invoice.overdue": [
    { key: "min_days_overdue", label: "Min days overdue", kind: "number", default: 1 },
  ],
  "schedule.custom_cron": [
    { key: "cron", label: "Cron expression", kind: "text", default: "0 9 * * *", required: true },
  ],
  "webhook.incoming": [
    { key: "require_signature", label: "Require HMAC signature", kind: "boolean", default: true },
  ],
  "condition.if_else": [
    { key: "field", label: "Field / fact", kind: "text", required: true },
    { key: "op", label: "Operator", kind: "select", default: "eq", options: [
      { value: "eq", label: "equals" }, { value: "neq", label: "not equals" },
      { value: "gte", label: "≥" }, { value: "lte", label: "≤" },
      { value: "gt", label: ">" }, { value: "lt", label: "<" },
      { value: "contains", label: "contains" },
    ] },
    { key: "value", label: "Value", kind: "text" },
  ],
  "condition.plan_allows": [
    { key: "feature", label: "Feature key", kind: "text", default: "automation" },
  ],
  "branch.match_country": [
    { key: "field", label: "Country field", kind: "text", default: "country" },
  ],
  "delay.business_hours": [
    { key: "min_hours", label: "Minimum delay (hours)", kind: "number", default: 1 },
  ],
  "ai.risk_score": [
    { key: "subject", label: "What to score", kind: "text", supportsTokens: true, default: "{{summary}}" },
  ],
  "ai.draft_message": [
    { key: "audience", label: "Audience", kind: "select", default: "tenant", options: [
      { value: "tenant", label: "Tenant" }, { value: "guest", label: "Guest" },
      { value: "supplier", label: "Supplier" }, { value: "owner", label: "Owner" },
    ] },
    { key: "instruction", label: "Instruction", kind: "textarea", supportsTokens: true },
  ],
  "action.create_task": [
    { key: "title", label: "Task title", kind: "text", default: "{{summary}}", supportsTokens: true },
    { key: "description", label: "Description", kind: "textarea", supportsTokens: true },
    { key: "priority", label: "Priority", kind: "select", default: "normal", options: [
      { value: "low", label: "Low" }, { value: "normal", label: "Normal" },
      { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
    ] },
    { key: "due_in_days", label: "Due in (days)", kind: "number", default: 7 },
  ],
  "action.create_cleaning_task": [
    { key: "title", label: "Task title", kind: "text", default: "Checkout clean — {{summary}}", supportsTokens: true },
    { key: "due_in_days", label: "Due in (days)", kind: "number", default: 1 },
  ],
  "action.request_supplier_evidence": [
    { key: "title", label: "Request title", kind: "text", default: "Evidence requested", supportsTokens: true },
    { key: "description", label: "What to upload", kind: "textarea", supportsTokens: true },
  ],
  "comm.internal_notification": [
    { key: "title", label: "Title", kind: "text", default: "{{summary}}", supportsTokens: true },
    { key: "body", label: "Body", kind: "textarea", supportsTokens: true },
    { key: "severity", label: "Severity", kind: "select", default: "info", options: [
      { value: "info", label: "Info" }, { value: "warning", label: "Warning" }, { value: "critical", label: "Critical" },
    ] },
  ],
  "comm.external_message_draft": [
    { key: "subject", label: "Subject", kind: "text", default: "{{summary}}", supportsTokens: true },
    { key: "body", label: "Draft body", kind: "textarea", supportsTokens: true },
  ],
  "payment.release_payout_after_approval": [
    { key: "amount", label: "Amount (minor units)", kind: "number" },
    { key: "reference", label: "Reference", kind: "text", supportsTokens: true },
  ],
  "payment.issue_refund_after_approval": [
    { key: "amount", label: "Refund amount (minor units)", kind: "number" },
    { key: "reason", label: "Reason", kind: "text", supportsTokens: true },
  ],
  "approval.request_human": [
    { key: "title", label: "Approval title", kind: "text", default: "Approval required", supportsTokens: true },
    { key: "summary", label: "What to approve", kind: "textarea", supportsTokens: true },
    { key: "sla_hours", label: "Escalate after (hours)", kind: "number", default: 24 },
  ],
  "approval.request_legal_review": [
    { key: "title", label: "Review title", kind: "text", default: "Legal review required", supportsTokens: true },
    { key: "summary", label: "Context", kind: "textarea", supportsTokens: true },
    { key: "sla_hours", label: "Escalate after (hours)", kind: "number", default: 48 },
  ],
  "legal.create_draft": [
    { key: "document_type", label: "Document type", kind: "text", default: "notice" },
    { key: "summary", label: "Draft summary", kind: "textarea", supportsTokens: true },
  ],
  "integration.stripe_connect": [
    { key: "operation", label: "Operation", kind: "text", default: "lookup_account" },
  ],
  "error.retry_with_backoff": [
    { key: "max_retries", label: "Max retries", kind: "number", default: 3 },
    { key: "backoff_seconds", label: "Backoff (seconds)", kind: "number", default: 30 },
  ],
  "error.pause_after_threshold": [
    { key: "threshold", label: "Failure threshold", kind: "number", default: 5 },
  ],
  // ── new triggers ──
  "record.updated": [
    { key: "entity", label: "Record type", kind: "text" },
  ],
  "portfolio.tenancy_ending": [
    { key: "within_days", label: "Days ahead", kind: "number", default: 60 },
  ],
  "work.task_overdue": [
    { key: "min_days_overdue", label: "Min days overdue", kind: "number", default: 1 },
  ],
  "money.payout_due": [
    { key: "within_days", label: "Days ahead", kind: "number", default: 3 },
  ],
  "schedule.daily": [
    { key: "time", label: "Local time (HH:MM)", kind: "text", default: "09:00", required: true },
  ],
  // ── new conditions ──
  "condition.field_compare": [
    { key: "left", label: "Left field", kind: "text", required: true },
    { key: "op", label: "Operator", kind: "select", default: "eq", options: [
      { value: "eq", label: "equals" }, { value: "neq", label: "not equals" },
      { value: "gte", label: "≥" }, { value: "lte", label: "≤" }, { value: "gt", label: ">" }, { value: "lt", label: "<" },
    ] },
    { key: "right", label: "Right field / value", kind: "text", required: true },
  ],
  "condition.entity_state": [
    { key: "entity", label: "Entity", kind: "text", required: true },
    { key: "state", label: "Required state", kind: "text", required: true },
  ],
  "condition.within_caps": [
    { key: "cap_key", label: "Cap key", kind: "select", default: "messages", options: [
      { value: "messages", label: "Messages / day" }, { value: "ai", label: "AI calls / day" }, { value: "payments", label: "Payment actions / day" },
    ] },
  ],
  "condition.business_context": [
    { key: "context_key", label: "Context", kind: "select", default: "business_hours", options: [
      { value: "business_hours", label: "In business hours" }, { value: "role", label: "Caller role" }, { value: "region", label: "Region" },
    ] },
    { key: "value", label: "Expected value", kind: "text" },
  ],
  // ── branch / router ──
  "branch.switch": [
    { key: "field", label: "Key field", kind: "text", required: true },
  ],
  // ── delay ──
  "delay.fixed": [
    { key: "amount", label: "Amount", kind: "number", default: 1, required: true },
    { key: "unit", label: "Unit", kind: "select", default: "hours", options: [
      { value: "minutes", label: "Minutes" }, { value: "hours", label: "Hours" }, { value: "days", label: "Days" },
    ] },
  ],
  "delay.until_date": [
    { key: "date_field", label: "Date field", kind: "text", default: "due_date", required: true },
  ],
  // ── lookup ──
  "lookup.record": [
    { key: "entity", label: "Entity", kind: "text", required: true },
    { key: "id_field", label: "Id field", kind: "text", default: "id" },
  ],
  "lookup.account_balance": [
    { key: "account", label: "Account code", kind: "text", required: true },
  ],
  // ── AI ──
  "ai.generate_summary": [
    { key: "subject", label: "What to summarise", kind: "textarea", supportsTokens: true, default: "{{summary}}" },
  ],
  "ai.classify": [
    { key: "subject", label: "What to classify", kind: "text", supportsTokens: true, default: "{{summary}}" },
    { key: "categories", label: "Categories (comma-separated)", kind: "text", required: true },
  ],
  "ai.guardrail_check": [
    { key: "policy", label: "Policy key", kind: "text", default: "default" },
  ],
  // ── actions ──
  "action.update_record": [
    { key: "field", label: "Field to set", kind: "text", required: true },
    { key: "value", label: "Value", kind: "text", supportsTokens: true },
  ],
  "action.add_note": [
    { key: "body", label: "Note", kind: "textarea", supportsTokens: true, required: true },
  ],
  "action.create_calendar_reminder": [
    { key: "title", label: "Reminder title", kind: "text", default: "{{summary}}", supportsTokens: true },
    { key: "due_in_days", label: "Due in (days)", kind: "number", default: 7 },
  ],
  "action.assign_supplier": [
    { key: "category", label: "Job category", kind: "text", required: true },
  ],
  "action.flag_marketplace_order": [
    { key: "reason", label: "Reason", kind: "text", supportsTokens: true, required: true },
  ],
  "action.create_invoice_draft": [
    { key: "amount", label: "Amount (minor units)", kind: "number" },
    { key: "reference", label: "Reference", kind: "text", supportsTokens: true },
  ],
  "action.record_compliance_check": [
    { key: "outcome", label: "Outcome", kind: "select", default: "pass", options: [
      { value: "pass", label: "Pass" }, { value: "fail", label: "Fail" }, { value: "review", label: "Needs review" },
    ] },
  ],
  // ── communication ──
  "comm.email_draft": [
    { key: "subject", label: "Subject", kind: "text", default: "{{summary}}", supportsTokens: true },
    { key: "body", label: "Draft body", kind: "textarea", supportsTokens: true },
  ],
  // ── payment (new) ──
  "payment.capture_after_approval": [
    { key: "amount", label: "Amount (minor units)", kind: "number" },
    { key: "reference", label: "Reference", kind: "text", supportsTokens: true },
  ],
  // ── approval (new) ──
  "approval.request_finance_signoff": [
    { key: "title", label: "Sign-off title", kind: "text", default: "Finance sign-off required", supportsTokens: true },
    { key: "summary", label: "Context", kind: "textarea", supportsTokens: true },
  ],
  // ── webhook / utility ──
  "webhook.outgoing": [
    { key: "endpoint_id", label: "Endpoint", kind: "text", required: true },
  ],
  "utility.set_variable": [
    { key: "name", label: "Variable name", kind: "text", required: true },
    { key: "value", label: "Value", kind: "text", supportsTokens: true },
  ],
  "utility.format_text": [
    { key: "template", label: "Template", kind: "textarea", supportsTokens: true, required: true },
  ],
  "error.fallback_path": [
    { key: "label", label: "Fallback label", kind: "text", default: "fallback" },
  ],
}

/**
 * The SAFE executor action a node compiles to, if any. Nodes that map to an
 * action produce a real (reversible) side-effect through the existing executor.
 * Nodes NOT in this map are graph-control or gated (no auto side-effect).
 */
export const NODE_ACTION_MAP: Record<string, "create_task" | "create_notification" | "draft_message" | "flag_record" | "create_calendar_reminder"> = {
  "action.create_task": "create_task",
  "action.create_cleaning_task": "create_task",
  "action.create_calendar_reminder": "create_calendar_reminder",
  "action.request_supplier_evidence": "draft_message",
  "action.add_note": "create_notification",
  "action.flag_marketplace_order": "flag_record",
  "action.record_compliance_check": "flag_record",
  "action.assign_supplier": "draft_message",
  "comm.internal_notification": "create_notification",
  "comm.external_message_draft": "draft_message",
  "comm.email_draft": "draft_message",
  "ai.draft_message": "draft_message",
  "ai.generate_summary": "create_notification",
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE SHAPES + VISUALS — premium per-category shape, colour, and icon so each
// category reads differently on the canvas. Consumed by the React Flow custom
// node renderer. Shapes: "start" (rounded-left), "diamond"/"hexagon"
// (conditions/branch), "rect" (actions), "violet" (AI), "gated" (payment/legal),
// "clock" (delay), "terminal" (end), etc.
// ─────────────────────────────────────────────────────────────────────────────

export type NodeShape = "start" | "diamond" | "hexagon" | "rect" | "ai" | "gated" | "approval" | "clock" | "lookup" | "comm" | "integration" | "webhook" | "utility" | "error" | "terminal"

export interface NodeVisual {
  shape: NodeShape
  /** Tailwind accent classes for ring/border/text. */
  accent: string
  bg: string
  border: string
  text: string
  /** lucide-react icon name (resolved in the renderer). */
  icon: string
  gated?: boolean
}

export const CATEGORY_VISUALS: Record<AutomationNodeCategory, NodeVisual> = {
  trigger: { shape: "start", accent: "emerald", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", icon: "Zap" },
  condition: { shape: "diamond", accent: "amber", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", icon: "GitBranch" },
  branch: { shape: "hexagon", accent: "orange", bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", icon: "Split" },
  delay: { shape: "clock", accent: "sky", bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-700", icon: "Clock" },
  lookup: { shape: "lookup", accent: "cyan", bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-700", icon: "Search" },
  ai: { shape: "ai", accent: "violet", bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", icon: "Sparkles" },
  action: { shape: "rect", accent: "blue", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", icon: "Play" },
  communication: { shape: "comm", accent: "indigo", bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", icon: "MessageSquare" },
  payment: { shape: "gated", accent: "red", bg: "bg-red-50", border: "border-red-300", text: "text-red-700", icon: "Lock", gated: true },
  approval: { shape: "approval", accent: "teal", bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-700", icon: "ShieldCheck" },
  legal: { shape: "gated", accent: "rose", bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", icon: "Scale", gated: true },
  integration: { shape: "integration", accent: "fuchsia", bg: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-700", icon: "Plug" },
  webhook: { shape: "webhook", accent: "purple", bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", icon: "Webhook" },
  utility: { shape: "utility", accent: "slate", bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-700", icon: "Wrench" },
  error: { shape: "error", accent: "rose", bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", icon: "AlertTriangle" },
  end: { shape: "terminal", accent: "slate", bg: "bg-slate-100", border: "border-slate-400", text: "text-slate-700", icon: "Flag" },
}

/** Resolve the visual treatment for a node type. */
export function nodeVisual(type: string): NodeVisual {
  const cat = nodeCategory(type) ?? "utility"
  return CATEGORY_VISUALS[cat]
}

/** Group display order for the palette. */
export const NODE_GROUP_ORDER: AutomationNodeGroup[] = [
  "Trigger", "Condition", "Branch", "Delay", "Lookup", "AI", "Action",
  "Communication", "Payment", "Approval", "Legal", "Integration", "Webhook/API",
  "Utility", "Error", "End",
]

const REGISTRY_BY_TYPE: Record<string, AutomationNodeDefinition> = Object.fromEntries(
  AUTOMATION_NODE_REGISTRY.map((n) => [n.type, n]),
)

export function nodeDef(type: string): AutomationNodeDefinition | undefined {
  return REGISTRY_BY_TYPE[type]
}
export function nodeCategory(type: string): AutomationNodeCategory | undefined {
  const d = nodeDef(type)
  return d ? groupToCategory(d.group) : undefined
}
export function nodeConfigSchema(type: string): NodeConfigField[] {
  return NODE_CONFIG_SCHEMAS[type] ?? []
}
/** True if this node may never auto-run — it must go through an approval. */
export function nodeRequiresApproval(type: string): boolean {
  return Boolean(nodeDef(type)?.requiresApproval)
}
/** True if this node is hard-blocked from any automated execution. */
export function nodeBlockedFromAutoRun(type: string): boolean {
  return Boolean(nodeDef(type)?.blockedFromAutoRun)
}
/** Categories whose nodes can never silently auto-run a side-effect. */
export const GATED_CATEGORIES: AutomationNodeCategory[] = ["payment", "legal"]
/** Categories that are always review-required (draft/approval path). */
export const APPROVAL_CATEGORIES: AutomationNodeCategory[] = ["payment", "legal", "approval"]

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT VARIABLES — available template tokens per upstream node category.
// Used by the inspector to show which {{vars}} are accessible at a given node.
// ─────────────────────────────────────────────────────────────────────────────

export interface ContextVar {
  token: string          // e.g. "{{summary}}"
  label: string          // human label
  source: string         // originating node category
  type: "string" | "number" | "date" | "boolean" | "id"
}

/** Base context vars always available from the trigger event. */
const TRIGGER_VARS: ContextVar[] = [
  { token: "{{trigger_id}}", label: "Trigger ID", source: "trigger", type: "id" },
  { token: "{{workspace_id}}", label: "Workspace ID", source: "trigger", type: "id" },
  { token: "{{entity_type}}", label: "Entity type", source: "trigger", type: "string" },
  { token: "{{entity_id}}", label: "Entity ID", source: "trigger", type: "id" },
  { token: "{{summary}}", label: "Summary text", source: "trigger", type: "string" },
  { token: "{{triggered_at}}", label: "Triggered at", source: "trigger", type: "date" },
]

/** Per-trigger type additional context vars. */
const TRIGGER_SPECIFIC_VARS: Record<string, ContextVar[]> = {
  "compliance.expiring": [
    { token: "{{within_days}}", label: "Days until expiry", source: "trigger", type: "number" },
    { token: "{{certificate_type}}", label: "Certificate type", source: "trigger", type: "string" },
    { token: "{{property_id}}", label: "Property ID", source: "trigger", type: "id" },
    { token: "{{property_name}}", label: "Property name", source: "trigger", type: "string" },
  ],
  "invoice.overdue": [
    { token: "{{invoice_id}}", label: "Invoice ID", source: "trigger", type: "id" },
    { token: "{{days_overdue}}", label: "Days overdue", source: "trigger", type: "number" },
    { token: "{{amount_due}}", label: "Amount due (pence)", source: "trigger", type: "number" },
    { token: "{{tenant_name}}", label: "Tenant name", source: "trigger", type: "string" },
  ],
  "portfolio.tenancy_ending": [
    { token: "{{tenancy_id}}", label: "Tenancy ID", source: "trigger", type: "id" },
    { token: "{{end_date}}", label: "Tenancy end date", source: "trigger", type: "date" },
    { token: "{{within_days}}", label: "Days until end", source: "trigger", type: "number" },
    { token: "{{tenant_name}}", label: "Tenant name", source: "trigger", type: "string" },
    { token: "{{property_name}}", label: "Property name", source: "trigger", type: "string" },
  ],
  "work.task_overdue": [
    { token: "{{task_id}}", label: "Task ID", source: "trigger", type: "id" },
    { token: "{{task_title}}", label: "Task title", source: "trigger", type: "string" },
    { token: "{{days_overdue}}", label: "Days overdue", source: "trigger", type: "number" },
    { token: "{{assignee_name}}", label: "Assignee name", source: "trigger", type: "string" },
  ],
  "supplier.job.completed": [
    { token: "{{job_id}}", label: "Job ID", source: "trigger", type: "id" },
    { token: "{{supplier_name}}", label: "Supplier name", source: "trigger", type: "string" },
    { token: "{{property_name}}", label: "Property name", source: "trigger", type: "string" },
    { token: "{{completed_at}}", label: "Completed at", source: "trigger", type: "date" },
  ],
  "money.payment_received": [
    { token: "{{payment_id}}", label: "Payment ID", source: "trigger", type: "id" },
    { token: "{{amount}}", label: "Amount (pence)", source: "trigger", type: "number" },
    { token: "{{payer_name}}", label: "Payer name", source: "trigger", type: "string" },
    { token: "{{received_at}}", label: "Received at", source: "trigger", type: "date" },
  ],
  "portfolio.tenancy_started": [
    { token: "{{tenancy_id}}", label: "Tenancy ID", source: "trigger", type: "id" },
    { token: "{{tenant_name}}", label: "Tenant name", source: "trigger", type: "string" },
    { token: "{{tenant_email}}", label: "Tenant email", source: "trigger", type: "string" },
    { token: "{{property_name}}", label: "Property name", source: "trigger", type: "string" },
    { token: "{{start_date}}", label: "Start date", source: "trigger", type: "date" },
  ],
  "record.created": [
    { token: "{{record_type}}", label: "Record type", source: "trigger", type: "string" },
    { token: "{{record_id}}", label: "Record ID", source: "trigger", type: "id" },
    { token: "{{created_by}}", label: "Created by (user ID)", source: "trigger", type: "id" },
  ],
  "record.updated": [
    { token: "{{record_type}}", label: "Record type", source: "trigger", type: "string" },
    { token: "{{record_id}}", label: "Record ID", source: "trigger", type: "id" },
    { token: "{{changed_field}}", label: "Changed field name", source: "trigger", type: "string" },
    { token: "{{old_value}}", label: "Old field value", source: "trigger", type: "string" },
    { token: "{{new_value}}", label: "New field value", source: "trigger", type: "string" },
  ],
  "booking.confirmed": [
    { token: "{{booking_id}}", label: "Booking ID", source: "trigger", type: "id" },
    { token: "{{guest_name}}", label: "Guest name", source: "trigger", type: "string" },
    { token: "{{check_in}}", label: "Check-in date", source: "trigger", type: "date" },
    { token: "{{check_out}}", label: "Checkout date", source: "trigger", type: "date" },
    { token: "{{property_name}}", label: "Property name", source: "trigger", type: "string" },
  ],
}

/** Vars produced by intermediate nodes (lookup, ai, utility). */
const CATEGORY_OUTPUT_VARS: Partial<Record<AutomationNodeCategory, ContextVar[]>> = {
  lookup: [
    { token: "{{record.id}}", label: "Looked-up record ID", source: "lookup", type: "id" },
    { token: "{{record.name}}", label: "Record name", source: "lookup", type: "string" },
    { token: "{{record.status}}", label: "Record status", source: "lookup", type: "string" },
  ],
  ai: [
    { token: "{{ai.output}}", label: "AI output text", source: "ai", type: "string" },
    { token: "{{ai.category}}", label: "AI category result", source: "ai", type: "string" },
    { token: "{{ai.risk_score}}", label: "AI risk score (0–100)", source: "ai", type: "number" },
    { token: "{{ai.summary}}", label: "AI summary", source: "ai", type: "string" },
  ],
  utility: [
    { token: "{{var.name}}", label: "Set variable value", source: "utility", type: "string" },
    { token: "{{formatted_text}}", label: "Formatted text output", source: "utility", type: "string" },
  ],
  condition: [
    { token: "{{branch}}", label: "Branch taken (TRUE/FALSE)", source: "condition", type: "string" },
  ],
}

/**
 * Returns all context variable tokens available at a given node, based on:
 * 1. The trigger node's type (gives trigger-specific vars)
 * 2. All upstream node categories (gives output vars from those nodes)
 *
 * Pass the trigger node type and an array of upstream node types (excluding the trigger).
 */
export function getAvailableVars(
  triggerType: string | null,
  upstreamNodeTypes: string[],
): ContextVar[] {
  const vars: ContextVar[] = [...TRIGGER_VARS]

  // Add trigger-specific vars
  if (triggerType && TRIGGER_SPECIFIC_VARS[triggerType]) {
    vars.push(...TRIGGER_SPECIFIC_VARS[triggerType])
  }

  // Add output vars from upstream categories (deduplicated by category)
  const seenCategories = new Set<AutomationNodeCategory>()
  for (const nodeType of upstreamNodeTypes) {
    const cat = nodeCategory(nodeType)
    if (cat && !seenCategories.has(cat) && CATEGORY_OUTPUT_VARS[cat]) {
      vars.push(...CATEGORY_OUTPUT_VARS[cat]!)
      seenCategories.add(cat)
    }
  }

  return vars
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTION VALIDATION — which node categories can connect to which.
// Prevents nonsensical flows (e.g. trigger → trigger, end → anything).
// ─────────────────────────────────────────────────────────────────────────────

/** Return true if an edge from sourceCategory to targetCategory is valid. */
export function isConnectionValid(
  sourceCategory: AutomationNodeCategory,
  targetCategory: AutomationNodeCategory,
): boolean {
  // End nodes cannot be sources
  if (sourceCategory === "end") return false
  // Nothing can connect to a trigger
  if (targetCategory === "trigger") return false
  // Triggers cannot connect directly to end nodes (must have at least one action)
  if (sourceCategory === "trigger" && targetCategory === "end") return false
  // Payment/legal (gated) cannot connect directly to another payment/legal node
  if (
    (sourceCategory === "payment" || sourceCategory === "legal") &&
    (targetCategory === "payment" || targetCategory === "legal")
  ) return false
  // Everything else is allowed
  return true
}

/** Human-readable reason why a connection is invalid (or null if valid). */
export function connectionInvalidReason(
  sourceCategory: AutomationNodeCategory,
  targetCategory: AutomationNodeCategory,
): string | null {
  if (!isConnectionValid(sourceCategory, targetCategory)) {
    if (sourceCategory === "end") return "End nodes cannot have outgoing connections."
    if (targetCategory === "trigger") return "Trigger nodes cannot receive connections — they start the flow."
    if (sourceCategory === "trigger" && targetCategory === "end") return "Connect a trigger to an action node first."
    if (
      (sourceCategory === "payment" || sourceCategory === "legal") &&
      (targetCategory === "payment" || targetCategory === "legal")
    ) return "Gated nodes (payment/legal) must route through an approval node before another gated node."
    return "This connection type is not allowed."
  }
  return null
}

/** True when a node has all required config fields filled. */
export function nodeConfigComplete(
  nodeType: string,
  config: Record<string, unknown>,
): boolean {
  const schema = nodeConfigSchema(nodeType)
  return schema
    .filter((f) => f.required)
    .every((f) => {
      const v = config[f.key]
      return v !== undefined && v !== null && v !== ""
    })
}
