import type {
  ActivityItem,
  AiBuild,
  ApprovalRow,
  AutomationRow,
  CredentialAlert,
  ErrorRow,
  IntegrationRow,
  PlanQuotaRow,
  Recipe,
  ReviewQueueItem,
  RunRow,
  UsageDriver,
  WebhookDelivery,
  WebhookEndpoint,
} from "./types"

/* ───────────────────────── Home ───────────────────────── */
export const SEED_HOME_AUTOMATIONS: AutomationRow[] = [
  { id: "a1", ref: "AUTO-00123", name: "Rent overdue → draft chase message", category: "Rent & Arrears", trigger: "Rent overdue", actionsSummary: "Draft message", actionCount: 2, status: "live", lastChecked: "2m ago", owner: "Jamahl T.", modules: ["Finance", "People"], frequency: "Every 4h", reviewFirst: true, enabled: true },
  { id: "a2", ref: "AUTO-00098", name: "Lease expiry → renew reminder", category: "Tenancy", trigger: "Lease expiry", actionsSummary: "Send reminder", actionCount: 3, status: "live", lastChecked: "11m ago", owner: "Priya S.", modules: ["Tenancies", "People"], frequency: "Daily", reviewFirst: true, enabled: true },
  { id: "a3", ref: "AUTO-00076", name: "New maintenance → triage & assign", category: "Maintenance", trigger: "New maintenance", actionsSummary: "Triage + assign", actionCount: 4, status: "live", lastChecked: "18m ago", owner: "Alex J.", modules: ["Jobs", "Suppliers"], frequency: "Realtime", reviewFirst: false, enabled: true },
  { id: "a4", ref: "AUTO-00062", name: "Supplier invoice → coding check", category: "Finance", trigger: "Invoice received", actionsSummary: "Code & flag", actionCount: 3, status: "review", lastChecked: "33m ago", owner: "Jamahl T.", modules: ["Finance"], frequency: "Realtime", reviewFirst: true, enabled: true },
  { id: "a5", ref: "AUTO-00051", name: "Inspection due → schedule", category: "Compliance", trigger: "Inspection due", actionsSummary: "Schedule visit", actionCount: 2, status: "paused", lastChecked: "1d ago", owner: "Priya S.", modules: ["Compliance"], frequency: "Weekly", reviewFirst: true, enabled: false },
]

export const SEED_REVIEW_QUEUE: ReviewQueueItem[] = [
  { id: "rq1", title: "Mark tenant arrears balance", risk: "high" },
  { id: "rq2", title: "Suspend late fee", risk: "medium" },
  { id: "rq3", title: "Close maintenance job", risk: "low" },
]

export const SEED_ACTIVITY: ActivityItem[] = [
  { id: "ac1", kind: "run_completed", text: "Automation run completed — Rent overdue → draft chase", at: "2m ago" },
  { id: "ac2", kind: "action_executed", text: "Action executed — Renewal reminder sent to TR-1021", at: "14m ago" },
  { id: "ac3", kind: "approval_required", text: "Approval required — Supplier invoice coding check", at: "33m ago" },
  { id: "ac4", kind: "error", text: "Error encountered — Payment API timeout (Rent collection)", at: "1h ago" },
  { id: "ac5", kind: "paused", text: "Automation paused — Inspection due → schedule", at: "1d ago" },
]

/* ───────────────────────── Recipes ───────────────────────── */
export const SEED_FEATURED_RECIPES: Recipe[] = [
  { id: "fr1", name: "Lease Expiry Renewal Suite", category: "Leasing", tags: ["Leasing", "Tenancy"], badge: "Most popular", trigger: "Lease expiry", actionCount: 5, modules: ["Tenancies", "People", "Notifications"], timeSaved: "12 hrs/month", successRate: 98, difficulty: "Medium", reviewFirst: true, usedCount: 124 },
  { id: "fr2", name: "Maintenance Request Flow", category: "Maintenance", tags: ["Maintenance", "Jobs"], badge: "High impact", trigger: "New maintenance", actionCount: 6, modules: ["Jobs", "Suppliers", "Notifications"], timeSaved: "18 hrs/month", successRate: 96, difficulty: "Medium", reviewFirst: false, usedCount: 98 },
  { id: "fr3", name: "Rent Collection & Follow-up", category: "Finance", tags: ["Finance", "Arrears"], badge: "Time saver", trigger: "Rent overdue", actionCount: 4, modules: ["Finance", "People"], timeSaved: "9 hrs/month", successRate: 99, difficulty: "Easy", reviewFirst: true, usedCount: 142 },
  { id: "fr4", name: "Compliance Check Cycle", category: "Compliance", tags: ["Compliance", "Safety"], badge: "Risk reducer", trigger: "Certificate expiry", actionCount: 5, modules: ["Compliance", "Documents"], timeSaved: "7 hrs/month", successRate: 97, difficulty: "Hard", reviewFirst: true, usedCount: 76 },
]

export const SEED_RECIPES: Recipe[] = [
  { id: "r1", name: "Rent overdue → draft chase", category: "Finance", tags: ["Finance"], badge: "Popular", trigger: "Rent overdue", actionCount: 3, modules: ["Finance", "People"], timeSaved: "9 hrs/month", successRate: 99, difficulty: "Easy", reviewFirst: true, usedCount: 124 },
  { id: "r2", name: "Lease expiry → renewal offer", category: "Leasing", tags: ["Leasing"], trigger: "Lease expiry", actionCount: 5, modules: ["Tenancies", "Notifications"], timeSaved: "12 hrs/month", successRate: 98, difficulty: "Medium", reviewFirst: true, usedCount: 112 },
  { id: "r3", name: "New maintenance → triage & assign", category: "Maintenance", tags: ["Maintenance"], badge: "New", trigger: "New maintenance", actionCount: 4, modules: ["Jobs", "Suppliers"], timeSaved: "18 hrs/month", successRate: 96, difficulty: "Medium", reviewFirst: false, usedCount: 98 },
  { id: "r4", name: "Supplier invoice → coding check", category: "Finance", tags: ["Finance"], trigger: "Invoice received", actionCount: 3, modules: ["Finance"], timeSaved: "6 hrs/month", successRate: 94, difficulty: "Medium", reviewFirst: true, usedCount: 87 },
  { id: "r5", name: "Inspection due → schedule visit", category: "Compliance", tags: ["Compliance"], trigger: "Inspection due", actionCount: 2, modules: ["Compliance"], timeSaved: "5 hrs/month", successRate: 97, difficulty: "Easy", reviewFirst: true, usedCount: 64 },
  { id: "r6", name: "Tenant onboarding sequence", category: "Tenant Experience", tags: ["Onboarding"], badge: "Popular", trigger: "Tenancy created", actionCount: 6, modules: ["People", "Documents", "Notifications"], timeSaved: "10 hrs/month", successRate: 95, difficulty: "Hard", reviewFirst: false, usedCount: 58 },
  { id: "r7", name: "Lead enquiry → auto response", category: "Communications", tags: ["Leads"], trigger: "Lead enquiry", actionCount: 2, modules: ["People", "Notifications"], timeSaved: "8 hrs/month", successRate: 99, difficulty: "Easy", reviewFirst: false, usedCount: 51 },
  { id: "r8", name: "Vendor statement → send monthly", category: "Reports", tags: ["Reports", "Finance"], trigger: "Schedule", actionCount: 3, modules: ["Finance", "Documents"], timeSaved: "4 hrs/month", successRate: 100, difficulty: "Easy", reviewFirst: false, usedCount: 44 },
]

/* ───────────────────────── My Automations ───────────────────────── */
export const SEED_MY_AUTOMATIONS: AutomationRow[] = [
  { id: "m1", ref: "AUTO-00123", name: "Rent overdue → draft chase message", category: "Finance", trigger: "Rent overdue", actionsSummary: "Draft message", actionCount: 2, status: "live", lastChecked: "2m ago", lastRun: "2m ago", nextRun: "in 3h 58m", owner: "Jamahl T.", modules: ["Finance", "People"], frequency: "Every 4h", reviewFirst: true, enabled: true, health: "excellent", version: "v3.2.1" },
  { id: "m2", ref: "AUTO-00098", name: "Lease expiry → renew reminder", category: "Tenancy", trigger: "Lease expiry", actionsSummary: "Send reminder", actionCount: 3, status: "live", lastChecked: "11m ago", lastRun: "11m ago", nextRun: "Tomorrow 08:00", owner: "Priya S.", modules: ["Tenancies", "People"], frequency: "Daily", reviewFirst: true, enabled: true, health: "good", version: "v2.4.0" },
  { id: "m3", ref: "AUTO-00076", name: "New maintenance → triage & assign", category: "Maintenance", trigger: "New maintenance", actionsSummary: "Triage + assign", actionCount: 4, status: "live", lastChecked: "18m ago", lastRun: "18m ago", nextRun: "Realtime", owner: "Alex J.", modules: ["Jobs", "Suppliers"], frequency: "Realtime", reviewFirst: false, enabled: true, health: "excellent", version: "v5.1.0" },
  { id: "m4", ref: "AUTO-00062", name: "Supplier invoice → coding check", category: "Finance", trigger: "Invoice received", actionsSummary: "Code & flag", actionCount: 3, status: "review", lastChecked: "33m ago", lastRun: "33m ago", nextRun: "Realtime", owner: "Jamahl T.", modules: ["Finance"], frequency: "Realtime", reviewFirst: true, enabled: true, health: "fair", version: "v1.9.0" },
  { id: "m5", ref: "AUTO-00051", name: "Inspection due → schedule", category: "Compliance", trigger: "Inspection due", actionsSummary: "Schedule visit", actionCount: 2, status: "live", lastChecked: "1h ago", lastRun: "1h ago", nextRun: "Mon 09:00", owner: "Priya S.", modules: ["Compliance"], frequency: "Weekly", reviewFirst: true, enabled: true, health: "good", version: "v3.0.2" },
  { id: "m6", ref: "AUTO-00044", name: "Suspended late fee", category: "Finance", trigger: "Arrears cleared", actionsSummary: "Reverse late fee", actionCount: 1, status: "paused", lastChecked: "2d ago", lastRun: "2d ago", nextRun: "—", owner: "Jamahl T.", modules: ["Finance"], frequency: "Realtime", reviewFirst: true, enabled: false, health: "poor", version: "v2.1.3" },
  { id: "m7", ref: "AUTO-00039", name: "Vendor statement → send", category: "Reports", trigger: "Schedule", actionsSummary: "Compile + send", actionCount: 3, status: "live", lastChecked: "5h ago", lastRun: "5h ago", nextRun: "1st of month", owner: "Alex J.", modules: ["Finance", "Documents"], frequency: "Monthly", reviewFirst: false, enabled: true, health: "good", version: "v1.5.4" },
  { id: "m8", ref: "AUTO-00031", name: "Lead enquiry → auto response", category: "Communications", trigger: "Lead enquiry", actionsSummary: "Auto reply", actionCount: 2, status: "live", lastChecked: "9m ago", lastRun: "9m ago", nextRun: "Realtime", owner: "Priya S.", modules: ["People", "Notifications"], frequency: "Realtime", reviewFirst: false, enabled: true, health: "excellent", version: "v4.2.0" },
]

/* ───────────────────────── Runs & Logs ───────────────────────── */
export const SEED_RUNS: RunRow[] = [
  { id: "run1", ref: "RUN-2024-05-24-001246", automation: "Inspection due → schedule", triggerEvent: "Inspection due", status: "failed", startedAt: "24 May, 14:02", duration: "0m 48s", outputs: 0, approvals: 0, initiatedBy: "System", initiatedKind: "System",
    steps: [
      { step: "Fetch inspections due", status: "success", duration: "0.4s", startedAt: "14:02:01", details: "12 records fetched" },
      { step: "Validate data", status: "success", duration: "0.2s", startedAt: "14:02:02", details: "OK" },
      { step: "Create inspection tasks", status: "failed", duration: "0.6s", startedAt: "14:02:02", details: "Validation error: missing property reference" },
      { step: "Send notifications", status: "skipped", duration: "—", startedAt: "—", details: "Skipped after failure" },
      { step: "Create approvals", status: "skipped", duration: "—", startedAt: "—", details: "Skipped after failure" },
    ] },
  { id: "run2", ref: "RUN-2024-05-24-001245", automation: "Rent overdue → draft chase", triggerEvent: "Rent overdue", status: "success", startedAt: "24 May, 13:40", duration: "1m 12s", outputs: 3, approvals: 1, initiatedBy: "System", initiatedKind: "System" },
  { id: "run3", ref: "RUN-2024-05-24-001244", automation: "New maintenance → triage", triggerEvent: "New maintenance", status: "success", startedAt: "24 May, 13:21", duration: "0m 54s", outputs: 2, approvals: 0, initiatedBy: "Alex J.", initiatedKind: "Manual" },
  { id: "run4", ref: "RUN-2024-05-24-001243", automation: "Lease expiry → renew reminder", triggerEvent: "Lease expiry", status: "success", startedAt: "24 May, 12:58", duration: "2m 03s", outputs: 4, approvals: 1, initiatedBy: "System", initiatedKind: "System" },
  { id: "run5", ref: "RUN-2024-05-24-001242", automation: "Supplier invoice → coding", triggerEvent: "Invoice received", status: "skipped", startedAt: "24 May, 12:30", duration: "0m 06s", outputs: 0, approvals: 0, initiatedBy: "System", initiatedKind: "System" },
  { id: "run6", ref: "RUN-2024-05-24-001241", automation: "Lead enquiry → auto response", triggerEvent: "Lead enquiry", status: "success", startedAt: "24 May, 12:10", duration: "0m 22s", outputs: 1, approvals: 0, initiatedBy: "System", initiatedKind: "System" },
  { id: "run7", ref: "RUN-2024-05-24-001240", automation: "Vendor statement → send", triggerEvent: "Schedule", status: "success", startedAt: "24 May, 11:45", duration: "1m 31s", outputs: 3, approvals: 0, initiatedBy: "System", initiatedKind: "System" },
  { id: "run8", ref: "RUN-2024-05-24-001239", automation: "Rent overdue → draft chase", triggerEvent: "Rent overdue", status: "failed", startedAt: "24 May, 11:20", duration: "0m 38s", outputs: 0, approvals: 0, initiatedBy: "System", initiatedKind: "System" },
  { id: "run9", ref: "RUN-2024-05-24-001238", automation: "Inspection due → schedule", triggerEvent: "Inspection due", status: "success", startedAt: "24 May, 10:55", duration: "1m 04s", outputs: 2, approvals: 1, initiatedBy: "Priya S.", initiatedKind: "Manual" },
  { id: "run10", ref: "RUN-2024-05-24-001237", automation: "New maintenance → triage", triggerEvent: "New maintenance", status: "success", startedAt: "24 May, 10:31", duration: "0m 49s", outputs: 2, approvals: 0, initiatedBy: "System", initiatedKind: "System" },
]

export const SEED_FAILED_STEPS = [
  { label: "Send email", value: 9 },
  { label: "Create task", value: 6 },
  { label: "Fetch supplier data", value: 4 },
  { label: "Generate document", value: 2 },
  { label: "Update invoice coding", value: 2 },
]

/* ───────────────────────── Approvals ───────────────────────── */
export const SEED_APPROVALS: ApprovalRow[] = [
  { id: "ap1", ref: "AUTO-00098", automation: "Lease expiry → renew reminder", proposedAction: "Send renewal reminder to tenant", risk: "medium", relatedTo: "Alex Johnson", relatedRef: "TR-1021", created: "12m ago", requestedBy: "System", impact: "medium", deadline: "1h 25m left", deadlineSoon: true, confidence: 92, summary: "The tenancy for Alex Johnson (TR-1021) expires in 60 days. This automation proposes sending a renewal reminder with the standard renewal offer and a link to confirm." },
  { id: "ap2", ref: "AUTO-00123", automation: "Rent overdue → draft chase", proposedAction: "Send arrears chase message", risk: "high", relatedTo: "Maria Lopez", relatedRef: "TR-0884", created: "20m ago", requestedBy: "System", impact: "high", deadline: "3h 02m left", confidence: 88, summary: "Rent is 9 days overdue. Proposes a firm-but-fair chase message and a flag on the tenancy." },
  { id: "ap3", ref: "AUTO-00051", automation: "Inspection due → schedule", proposedAction: "Schedule property inspection", risk: "low", relatedTo: "12 Oak Street", relatedRef: "PR-0042", created: "44m ago", requestedBy: "Priya S.", impact: "low", deadline: "1d left", confidence: 95 },
  { id: "ap4", ref: "AUTO-00062", automation: "Supplier invoice → coding", proposedAction: "Apply suggested expense coding", risk: "medium", relatedTo: "BrightSpark Ltd", relatedRef: "INV-3391", created: "1h ago", requestedBy: "System", impact: "medium", deadline: "5h left", confidence: 84 },
  { id: "ap5", ref: "AUTO-00076", automation: "New maintenance → triage", proposedAction: "Assign job to preferred contractor", risk: "high", relatedTo: "Boiler fault", relatedRef: "JOB-2210", created: "1h ago", requestedBy: "System", impact: "high", deadline: "2h left", confidence: 90 },
  { id: "ap6", ref: "AUTO-00115", automation: "Arrears threshold → alert", proposedAction: "Escalate arrears to manager", risk: "medium", relatedTo: "James Carter", relatedRef: "TR-0712", created: "2h ago", requestedBy: "System", impact: "medium", deadline: "6h left", confidence: 86 },
  { id: "ap7", ref: "AUTO-00088", automation: "Insurance expiry → notify", proposedAction: "Notify owner of expiring cover", risk: "low", relatedTo: "5 Elm Court", relatedRef: "PR-0019", created: "3h ago", requestedBy: "System", impact: "low", deadline: "1d left", confidence: 97 },
  { id: "ap8", ref: "AUTO-00071", automation: "Job completion → invoice", proposedAction: "Generate supplier invoice", risk: "medium", relatedTo: "PlumbPro", relatedRef: "JOB-2188", created: "4h ago", requestedBy: "System", impact: "medium", deadline: "8h left", confidence: 89 },
]

/* ───────────────────────── Errors ───────────────────────── */
export const SEED_ERRORS: ErrorRow[] = [
  { id: "e1", ref: "ERR-0004921", title: "Payment API timeout", subtitle: "Stripe charge request did not respond in time", automation: "Rent collection", automationRef: "Auto-0062", severity: "critical", firstSeen: "2m ago", latestSeen: "2m ago", impactedRecord: "#PMT-88421", retryCount: 3, owner: "Jamahl T.", status: "active", safeToRetry: true, retriesRemaining: 2 },
  { id: "e2", ref: "ERR-0004918", title: "Supplier webhook failed", subtitle: "Endpoint returned 500 on job.completed", automation: "Maintenance triage", automationRef: "Auto-0076", severity: "high", firstSeen: "18m ago", latestSeen: "5m ago", impactedRecord: "#JOB-2210", retryCount: 2, owner: "Alex J.", status: "active", safeToRetry: true, retriesRemaining: 3 },
  { id: "e3", ref: "ERR-0004902", title: "Bank feed connection lost", subtitle: "OAuth token expired for Xero", automation: "Invoice sync", automationRef: "Auto-0044", severity: "high", firstSeen: "1h ago", latestSeen: "20m ago", impactedRecord: "#FEED-0012", retryCount: 0, owner: "Jamahl T.", status: "needs_config", safeToRetry: false, retriesRemaining: 0 },
  { id: "e4", ref: "ERR-0004890", title: "Template rendering error", subtitle: "Missing merge field {tenant_name}", automation: "Lease expiry → reminder", automationRef: "Auto-0098", severity: "medium", firstSeen: "2h ago", latestSeen: "1h ago", impactedRecord: "#TR-1021", retryCount: 1, owner: "Priya S.", status: "active", safeToRetry: true, retriesRemaining: 2 },
  { id: "e5", ref: "ERR-0004871", title: "Document generation failed", subtitle: "PDF service returned malformed output", automation: "Vendor statement", automationRef: "Auto-0039", severity: "medium", firstSeen: "3h ago", latestSeen: "2h ago", impactedRecord: "#DOC-5521", retryCount: 1, owner: "Alex J.", status: "active", safeToRetry: true, retriesRemaining: 2 },
  { id: "e6", ref: "ERR-0004850", title: "Email delivery bounced", subtitle: "Recipient mailbox full", automation: "Lead auto response", automationRef: "Auto-0031", severity: "low", firstSeen: "5h ago", latestSeen: "4h ago", impactedRecord: "#LEAD-0091", retryCount: 0, owner: "Priya S.", status: "resolved", safeToRetry: false, retriesRemaining: 0 },
  { id: "e7", ref: "ERR-0004833", title: "Zapier action failed", subtitle: "Rate limit exceeded on outbound zap", automation: "CRM sync", automationRef: "Auto-0102", severity: "high", firstSeen: "6h ago", latestSeen: "5h ago", impactedRecord: "#ZAP-3320", retryCount: 2, owner: "Jamahl T.", status: "active", safeToRetry: true, retriesRemaining: 1 },
  { id: "e8", ref: "ERR-0004810", title: "SFTP file not found", subtitle: "Expected nightly export missing", automation: "Bank reconciliation", automationRef: "Auto-0058", severity: "medium", firstSeen: "8h ago", latestSeen: "7h ago", impactedRecord: "#SFTP-0007", retryCount: 0, owner: "Alex J.", status: "needs_config", safeToRetry: false, retriesRemaining: 0 },
]

/* ───────────────────────── Integrations ───────────────────────── */
export const SEED_INTEGRATIONS: IntegrationRow[] = [
  { id: "i1", name: "Gmail", category: "Email", health: "healthy", environment: "Production", lastSync: "2m ago", permissions: "Send, read", capabilities: "Email, threads", executions: 1248, successRate: 99.3 },
  { id: "i2", name: "Microsoft Outlook", category: "Email", health: "healthy", environment: "Production", lastSync: "5m ago", permissions: "Send, read", capabilities: "Email, calendar" },
  { id: "i3", name: "Twilio", category: "Messaging", health: "healthy", environment: "Production", lastSync: "8m ago", permissions: "Send SMS", capabilities: "SMS, voice", executions: 431, successRate: 98.1 },
  { id: "i4", name: "Stripe", category: "Payments", health: "healthy", environment: "Production", lastSync: "1m ago", permissions: "Charges, refunds", capabilities: "Payments, payouts", executions: 642, successRate: 99.7 },
  { id: "i5", name: "Xero", category: "Accounting", health: "healthy", environment: "Production", lastSync: "12m ago", permissions: "Invoices, contacts", capabilities: "Accounting", executions: 512, successRate: 99.1 },
  { id: "i6", name: "QuickBooks Online", category: "Accounting", health: "healthy", environment: "Production", lastSync: "20m ago", permissions: "Invoices", capabilities: "Accounting" },
  { id: "i7", name: "OpenAI", category: "AI", health: "healthy", environment: "Production", lastSync: "3m ago", permissions: "Completions", capabilities: "AI drafting" },
  { id: "i8", name: "Slack", category: "Messaging", health: "healthy", environment: "Production", lastSync: "4m ago", permissions: "Post messages", capabilities: "Notifications", executions: 987, successRate: 99.5 },
  { id: "i9", name: "Microsoft Teams", category: "Messaging", health: "healthy", environment: "Production", lastSync: "9m ago", permissions: "Post messages", capabilities: "Notifications" },
  { id: "i10", name: "HMRC MTD", category: "Tax", health: "warning", environment: "Production", lastSync: "2h ago", permissions: "Submit VAT", capabilities: "Tax filing" },
  { id: "i11", name: "Google Calendar", category: "Calendar", health: "healthy", environment: "Production", lastSync: "6m ago", permissions: "Events", capabilities: "Scheduling" },
  { id: "i12", name: "DocuSign", category: "Documents", health: "healthy", environment: "Production", lastSync: "15m ago", permissions: "Send envelopes", capabilities: "E-signature" },
  { id: "i13", name: "Google Drive", category: "Storage", health: "healthy", environment: "Production", lastSync: "7m ago", permissions: "Read, write", capabilities: "File storage" },
  { id: "i14", name: "Dropbox", category: "Storage", health: "healthy", environment: "Production", lastSync: "22m ago", permissions: "Read, write", capabilities: "File storage" },
  { id: "i15", name: "Amazon S3", category: "Storage", health: "healthy", environment: "Production", lastSync: "10m ago", permissions: "Read, write", capabilities: "Object storage" },
]

export const SEED_CREDENTIAL_ALERTS: CredentialAlert[] = [
  { id: "c1", name: "Xero", credential: "Access Token", daysLeft: 7, tone: "warning" },
  { id: "c2", name: "Gmail", credential: "OAuth", daysLeft: 13, tone: "warning" },
  { id: "c3", name: "Twilio", credential: "Auth Token", daysLeft: 28, tone: "ok" },
]

/* ───────────────────────── Webhooks ───────────────────────── */
export const SEED_WEBHOOK_ENDPOINTS: WebhookEndpoint[] = [
  { id: "w1", name: "Property events", slug: "prop_events_webhook", url: "https://hooks.acme.io/property-events", eventGroups: ["Properties", "Tenancies", "Tasks"], eventCount: 14, secretSet: true, environment: "Production", lastDelivery: "1m ago", successRate: 99.7, enabled: true },
  { id: "w2", name: "Invoice updates", slug: "invoice_updates_webhook", url: "https://hooks.acme.io/invoices", eventGroups: ["Invoices", "Payments"], eventCount: 8, secretSet: true, environment: "Production", lastDelivery: "4m ago", successRate: 99.2, enabled: true },
  { id: "w3", name: "Maintenance alerts", slug: "maint_alerts_webhook", url: "https://hooks.acme.io/maintenance", eventGroups: ["Jobs", "Suppliers"], eventCount: 6, secretSet: true, environment: "Production", lastDelivery: "9m ago", successRate: 98.9, enabled: true },
  { id: "w4", name: "Compliance changes", slug: "compliance_webhook", url: "https://staging.acme.io/compliance", eventGroups: ["Compliance"], eventCount: 4, secretSet: false, environment: "Staging", lastDelivery: "2h ago", successRate: 95.1, enabled: false },
  { id: "w5", name: "Custom notifications", slug: "custom_notify_webhook", url: "https://dev.acme.io/notify", eventGroups: ["Notifications"], eventCount: 3, secretSet: true, environment: "Development", lastDelivery: "30m ago", successRate: 97.6, enabled: true },
]

export const SEED_WEBHOOK_DELIVERIES: WebhookDelivery[] = [
  { id: "d1", event: "property.updated", eventId: "evt_8821", endpoint: "Property events", environment: "Production", status: "success", deliveredAt: "1m ago", response: 200, latency: "142ms", retries: 0 },
  { id: "d2", event: "invoice.paid", eventId: "evt_8820", endpoint: "Invoice updates", environment: "Production", status: "success", deliveredAt: "4m ago", response: 200, latency: "188ms", retries: 0 },
  { id: "d3", event: "job.completed", eventId: "evt_8819", endpoint: "Maintenance alerts", environment: "Production", status: "failed", deliveredAt: "9m ago", response: 500, latency: "2.1s", retries: 2 },
  { id: "d4", event: "tenant.created", eventId: "evt_8818", endpoint: "Property events", environment: "Production", status: "success", deliveredAt: "14m ago", response: 201, latency: "176ms", retries: 0 },
  { id: "d5", event: "compliance.document.approved", eventId: "evt_8817", endpoint: "Compliance changes", environment: "Staging", status: "failed", deliveredAt: "21m ago", response: 401, latency: "98ms", retries: 1 },
]

/* ───────────────────────── AI Builder ───────────────────────── */
export const SEED_AI_BUILDS: AiBuild[] = [
  { id: "b1", name: "Lease renewal autopilot", status: "Draft", at: "2h ago" },
  { id: "b2", name: "Rent arrears escalation", status: "Draft", at: "1d ago" },
  { id: "b3", name: "Maintenance triage flow", status: "Deployed", at: "3d ago" },
  { id: "b4", name: "Supplier invoice approval", status: "Draft", at: "4d ago" },
]

export const SEED_AI_EXAMPLES = [
  "Rent arrears reminder sequence",
  "Maintenance request triage",
  "Lease expiry + renewal workflow",
  "Supplier invoice approval",
  "Tenant onboarding process",
]

/* ───────────────────────── Usage & Limits ───────────────────────── */
export const SEED_USAGE_DRIVERS: UsageDriver[] = [
  { id: "u1", name: "Rent overdue workflow", runs: 2341, share: 16.3 },
  { id: "u2", name: "Lease renewal reminder", runs: 1982, share: 13.8 },
  { id: "u3", name: "Inspection due workflow", runs: 1745, share: 12.1 },
  { id: "u4", name: "Supplier invoice coding", runs: 1532, share: 10.6 },
  { id: "u5", name: "Maintenance triage & assign", runs: 1287, share: 8.9 },
]

export const SEED_USAGE_BY_MODULE = [
  { label: "Tenancies", value: 3842 },
  { label: "Jobs", value: 3281 },
  { label: "Suppliers", value: 2317 },
  { label: "Finance", value: 1924 },
  { label: "Compliance", value: 1518 },
  { label: "People", value: 872 },
  { label: "Properties", value: 628 },
]

export const SEED_PLAN_QUOTAS: PlanQuotaRow[] = [
  { id: "q1", name: "JT Property Manager", plan: "Enterprise · this workspace", runs: "100,000", runsUsedPct: 14.4, aiCredits: "100,000", webhooks: "2,000,000", storage: "1,000", activeAutomations: "Unlimited", concurrentRuns: "50", approvalQueue: "1,000", status: "Healthy" },
  { id: "q2", name: "Group total", plan: "3 workspaces", runs: "300,000", runsUsedPct: 22.1, aiCredits: "300,000", webhooks: "6,000,000", storage: "3,000", activeAutomations: "Unlimited", concurrentRuns: "150", approvalQueue: "3,000", status: "Healthy" },
  { id: "q3", name: "Plan limit", plan: "Enterprise", runs: "Unlimited", runsUsedPct: 0, aiCredits: "Unlimited", webhooks: "Unlimited", storage: "Unlimited", activeAutomations: "Unlimited", concurrentRuns: "Unlimited", approvalQueue: "Unlimited", status: "On track" },
]
