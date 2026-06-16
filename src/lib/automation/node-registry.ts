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
  { label: "Home", href: "/property-manager/automations", match: ["/automations"] },
  { label: "Recipes", href: "/property-manager/automations/recipes", match: ["/automations/recipes", "/automations/templates"] },
  { label: "My Automations", href: "/property-manager/automations/my-automations", match: ["/automations/my-automations"] },
  { label: "Canvas Builder", href: "/property-manager/automations/canvas", match: ["/automations/canvas"] },
  { label: "Runs & Logs", href: "/property-manager/automations/runs", match: ["/automations/runs"] },
  { label: "Approvals", href: "/property-manager/automations/approvals", match: ["/automations/approvals"] },
  { label: "Errors", href: "/property-manager/automations/errors", match: ["/automations/errors"] },
  { label: "Integrations", href: "/property-manager/automations/integrations", match: ["/automations/integrations"] },
  { label: "Webhooks", href: "/property-manager/automations/webhooks", match: ["/automations/webhooks"] },
  { label: "AI Builder", href: "/property-manager/automations/ai-builder", match: ["/automations/ai-builder", "/automations/builder"] },
  { label: "Usage & Limits", href: "/property-manager/automations/usage", match: ["/automations/usage"] },
  { label: "Settings", href: "/property-manager/automations/settings", match: ["/automations/settings"] },
  { label: "Admin Controls", href: "/property-manager/automations/admin-controls", match: ["/automations/admin-controls"] },
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
  { type: "record.created", label: "Record Created", group: "Trigger", scope: "workspace", risk: "low", plan: "Starter", description: "Starts when a workspace record is created." },
  { type: "field.changed", label: "Field Changed", group: "Trigger", scope: "workspace", risk: "low", plan: "Starter", description: "Starts when a watched field changes value." },
  { type: "booking.confirmed", label: "Booking Confirmed", group: "Trigger", scope: "booking", risk: "medium", plan: "Pro / Agency", description: "Starts when a booking becomes confirmed." },
  { type: "booking.checkout_due", label: "Checkout Due", group: "Trigger", scope: "booking", risk: "medium", plan: "Pro / Agency", description: "Starts before checkout based on local calendar rules." },
  { type: "supplier.job.completed", label: "Supplier Job Completed", group: "Trigger", scope: "supplier_job", risk: "medium", plan: "Pro / Agency", description: "Starts when a supplier marks a job complete." },
  { type: "marketplace.transaction.created", label: "Marketplace Transaction Created", group: "Trigger", scope: "marketplace_transaction", risk: "medium", plan: "Pro / Agency", description: "Starts when a marketplace order or transaction is opened." },
  { type: "invoice.overdue", label: "Invoice Overdue", group: "Trigger", scope: "accounting", risk: "medium", plan: "Operator", description: "Starts when an invoice crosses the overdue threshold." },
  { type: "compliance.expiring", label: "Compliance Expiring", group: "Trigger", scope: "compliance", risk: "high", plan: "Operator", requiresApproval: true, description: "Starts before a certificate, licence, or safety item expires." },
  { type: "legal.review.required", label: "Legal Review Required", group: "Trigger", scope: "legal", risk: "critical", plan: "Scale", requiresApproval: true, description: "Starts review-first legal workflows." },
  { type: "schedule.custom_cron", label: "Custom Cron", group: "Trigger", scope: "workspace", risk: "medium", plan: "Scale", description: "Runs on a configured cron schedule with caps." },
  { type: "webhook.incoming", label: "Incoming Webhook", group: "Webhook/API", scope: "workspace", risk: "medium", plan: "Scale", description: "Accepts signed inbound events from an external system." },
  { type: "condition.if_else", label: "If / Else", group: "Condition", scope: "workspace", risk: "low", plan: "Starter", description: "Routes records based on a true or false expression." },
  { type: "condition.plan_allows", label: "If Plan Allows", group: "Condition", scope: "workspace", risk: "low", plan: "Starter", description: "Stops workflows that exceed the workspace plan." },
  { type: "condition.payment_release_allowed", label: "If Payment Release Allowed", group: "Condition", scope: "payment", risk: "critical", plan: "Scale", requiresApproval: true, description: "Checks disputes, provider state, role gate, and approval state." },
  { type: "branch.match_country", label: "Match Country", group: "Branch", scope: "compliance", risk: "medium", plan: "Operator", description: "Routes work by country profile and local rule set." },
  { type: "delay.business_hours", label: "Delay For Business Hours", group: "Delay", scope: "workspace", risk: "low", plan: "Operator", description: "Waits until the next allowed local business window." },
  { type: "lookup.preferred_suppliers", label: "Get Preferred Suppliers", group: "Lookup", scope: "supplier_job", risk: "medium", plan: "Pro / Agency", description: "Finds workspace-scoped verified suppliers for a job category." },
  { type: "lookup.marketplace_transaction", label: "Get Marketplace Transaction", group: "Lookup", scope: "marketplace_transaction", risk: "medium", plan: "Pro / Agency", description: "Loads transaction context with RLS and redaction." },
  { type: "ai.risk_score", label: "AI Risk Score", group: "AI", scope: "workspace", risk: "high", plan: "Scale", requiresApproval: true, description: "Scores operational risk without taking destructive action." },
  { type: "ai.draft_message", label: "AI Draft Message", group: "AI", scope: "customer", risk: "medium", plan: "Scale", requiresApproval: true, description: "Creates a draft message for review." },
  { type: "action.create_task", label: "Create Task", group: "Action", scope: "workspace", risk: "low", plan: "Starter", description: "Creates a workspace task or reminder." },
  { type: "action.create_cleaning_task", label: "Create Cleaning Task", group: "Action", scope: "booking", risk: "low", plan: "Pro / Agency", description: "Creates a checkout cleaning task for a booking." },
  { type: "action.request_supplier_evidence", label: "Request Supplier Evidence", group: "Action", scope: "supplier_job", risk: "medium", plan: "Pro / Agency", description: "Asks a supplier to upload required evidence." },
  { type: "comm.internal_notification", label: "Send Internal Notification", group: "Communication", scope: "workspace", risk: "low", plan: "Starter", description: "Sends an in-app notification to a role or owner." },
  { type: "comm.external_message_draft", label: "Create External Message Draft", group: "Communication", scope: "customer", risk: "medium", plan: "Operator", requiresApproval: true, description: "Creates a customer, guest, tenant, or supplier message draft." },
  { type: "payment.release_payout_after_approval", label: "Release Payout After Approval", group: "Payment", scope: "payment", risk: "critical", plan: "Scale", requiresApproval: true, description: "Releases payout only after approval and provider checks." },
  { type: "payment.issue_refund_after_approval", label: "Issue Refund After Approval", group: "Payment", scope: "payment", risk: "critical", plan: "Scale", requiresApproval: true, description: "Issues a refund only after human approval." },
  { type: "approval.request_human", label: "Request Human Approval", group: "Approval", scope: "workspace", risk: "medium", plan: "Operator", description: "Creates an approval item and waits for a decision." },
  { type: "approval.request_legal_review", label: "Request Legal Review", group: "Approval", scope: "legal", risk: "critical", plan: "Scale", requiresApproval: true, description: "Routes legal content to a reviewer." },
  { type: "legal.create_draft", label: "Create Legal Draft", group: "Legal", scope: "legal", risk: "critical", plan: "Scale", requiresApproval: true, description: "Creates a legal draft without sending or serving it." },
  { type: "legal.auto_serve_notice", label: "Auto-Serve Notice", group: "Legal", scope: "legal", risk: "restricted", plan: "Enterprise", blockedFromAutoRun: true, description: "Registered as blocked so it cannot be silently automated." },
  { type: "integration.stripe_connect", label: "Stripe Connect", group: "Integration", scope: "payment", risk: "high", plan: "Scale", requiresApproval: true, description: "Uses Stripe Connect under approval, provider, and audit gates." },
  { type: "integration.channel_manager_webhook", label: "Channel Manager Webhook", group: "Integration", scope: "booking", risk: "medium", plan: "Pro / Agency", description: "Receives booking channel events through signed webhooks." },
  { type: "utility.redact_sensitive_data", label: "Redact Sensitive Data", group: "Utility", scope: "workspace", risk: "low", plan: "Starter", description: "Removes sensitive fields before logs or external calls." },
  { type: "error.retry_with_backoff", label: "Retry With Backoff", group: "Error", scope: "workspace", risk: "low", plan: "Operator", description: "Retries failed nodes before stopping or falling back." },
  { type: "error.pause_after_threshold", label: "Pause After Threshold", group: "Error", scope: "workspace", risk: "medium", plan: "Operator", description: "Pauses repeated failures and notifies the owner." },
  { type: "end.waiting_approval", label: "End Waiting Approval", group: "End", scope: "workspace", risk: "low", plan: "Starter", description: "Ends a run while an approval is pending." },
  { type: "end.success", label: "End Success", group: "End", scope: "workspace", risk: "low", plan: "Starter", description: "Marks the run complete." },
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
}

/**
 * The SAFE executor action a node compiles to, if any. Nodes that map to an
 * action produce a real (reversible) side-effect through the existing executor.
 * Nodes NOT in this map are graph-control or gated (no auto side-effect).
 */
export const NODE_ACTION_MAP: Record<string, "create_task" | "create_notification" | "draft_message" | "flag_record" | "create_calendar_reminder"> = {
  "action.create_task": "create_task",
  "action.create_cleaning_task": "create_task",
  "action.request_supplier_evidence": "draft_message",
  "comm.internal_notification": "create_notification",
  "comm.external_message_draft": "draft_message",
  "ai.draft_message": "draft_message",
}

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
