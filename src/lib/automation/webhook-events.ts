// Canonical OUTBOUND webhook event-type registry.
//
// Previously the outbound webhook `event_types` field was validated only as
// `z.array(z.string()).min(1)` — any free-form string was accepted and there was
// no curated picker. This registry is the single source of truth for the events
// Propvora can emit to an external endpoint, so the UI can render a real picker
// and the API can reject unknown event types.
//
// These mirror the automation engine's own audit/event vocabulary (runs,
// approvals, compliance, money, bookings, work, supplier, marketplace) plus the
// test event. Keep in sync with the triggers in catalogue.ts / node-registry.ts.

export interface OutboundWebhookEvent {
  /** Canonical dotted event key sent in the payload `event` field. */
  key: string
  /** Human label for the picker. */
  label: string
  /** Grouping for the picker. */
  group:
    | "Lifecycle"
    | "Portfolio"
    | "Work"
    | "Compliance"
    | "Money"
    | "Bookings"
    | "Supplier"
    | "Marketplace"
    | "System"
  /** One-line description shown under the label. */
  description: string
}

export const OUTBOUND_WEBHOOK_EVENTS: OutboundWebhookEvent[] = [
  // Automation run lifecycle
  { key: "run.completed", label: "Run completed", group: "Lifecycle", description: "An automation run finished successfully." },
  { key: "run.failed", label: "Run failed", group: "Lifecycle", description: "An automation run failed." },
  { key: "approval.requested", label: "Approval requested", group: "Lifecycle", description: "An automation step needs human approval." },
  { key: "approval.decided", label: "Approval decided", group: "Lifecycle", description: "An approval was approved or rejected." },
  // Portfolio
  { key: "property.added", label: "Property added", group: "Portfolio", description: "A property was added to the portfolio." },
  { key: "tenancy.started", label: "Tenancy started", group: "Portfolio", description: "A new tenancy began." },
  { key: "tenancy.ending", label: "Tenancy ending", group: "Portfolio", description: "A tenancy is approaching its end date." },
  // Work
  { key: "task.created", label: "Task created", group: "Work", description: "A work task was created." },
  { key: "task.overdue", label: "Task overdue", group: "Work", description: "A task passed its due date." },
  { key: "job.completed", label: "Job completed", group: "Work", description: "A maintenance job was completed." },
  // Compliance
  { key: "compliance.expiring", label: "Compliance expiring", group: "Compliance", description: "A certificate or licence is expiring soon." },
  { key: "compliance.failed", label: "Compliance check failed", group: "Compliance", description: "A compliance check was recorded as failed." },
  // Money
  { key: "payment.received", label: "Payment received", group: "Money", description: "An inbound payment settled." },
  { key: "invoice.overdue", label: "Invoice overdue", group: "Money", description: "An invoice crossed its overdue threshold." },
  // Bookings
  { key: "booking.confirmed", label: "Booking confirmed", group: "Bookings", description: "A booking became confirmed." },
  { key: "booking.cancelled", label: "Booking cancelled", group: "Bookings", description: "A booking was cancelled." },
  { key: "booking.checkin_due", label: "Check-in due", group: "Bookings", description: "A booking check-in is approaching." },
  { key: "booking.checkout_due", label: "Checkout due", group: "Bookings", description: "A booking checkout is approaching." },
  // Supplier
  { key: "supplier.job_assigned", label: "Supplier job assigned", group: "Supplier", description: "A supplier was assigned a job." },
  { key: "supplier.evidence_uploaded", label: "Supplier evidence uploaded", group: "Supplier", description: "A supplier uploaded completion evidence." },
  // Marketplace
  { key: "marketplace.transaction_created", label: "Marketplace transaction", group: "Marketplace", description: "A marketplace order/transaction opened." },
  { key: "marketplace.order_disputed", label: "Marketplace order disputed", group: "Marketplace", description: "A buyer raised a marketplace dispute." },
  // System
  { key: "test.webhook", label: "Test event", group: "System", description: "A manual test delivery from Propvora." },
]

export const OUTBOUND_WEBHOOK_EVENT_KEYS: string[] = OUTBOUND_WEBHOOK_EVENTS.map((e) => e.key)

const KEY_SET = new Set(OUTBOUND_WEBHOOK_EVENT_KEYS)

/** True if every supplied event key is a known canonical outbound event. */
export function areValidOutboundEvents(keys: string[]): boolean {
  return keys.length > 0 && keys.every((k) => KEY_SET.has(k))
}

/** Filter a list down to only the known canonical event keys. */
export function filterKnownOutboundEvents(keys: string[]): string[] {
  return keys.filter((k) => KEY_SET.has(k))
}

/** Group the registry for a picker UI. */
export function outboundEventsByGroup(): Record<string, OutboundWebhookEvent[]> {
  const out: Record<string, OutboundWebhookEvent[]> = {}
  for (const e of OUTBOUND_WEBHOOK_EVENTS) {
    ;(out[e.group] ??= []).push(e)
  }
  return out
}
