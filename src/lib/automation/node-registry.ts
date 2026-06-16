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
