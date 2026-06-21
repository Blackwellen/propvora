// Static quick-action commands for the command palette. Pure navigation /
// create shortcuts — no data access, always available.

export interface QuickCommand {
  id: string
  label: string
  hint: string
  href: string
  keywords: string[]
}

export const QUICK_COMMANDS: QuickCommand[] = [
  // Create
  { id: "new-property", label: "New property", hint: "Create", href: "/property-manager/portfolio/properties/new", keywords: ["add", "create", "property", "portfolio"] },
  { id: "new-contact", label: "New contact", hint: "Create", href: "/property-manager/contacts/new", keywords: ["add", "create", "contact", "person", "tenant", "supplier"] },
  { id: "new-task", label: "New task", hint: "Create", href: "/property-manager/work/tasks/new", keywords: ["add", "create", "task", "todo", "work"] },
  { id: "new-job", label: "New job", hint: "Create", href: "/property-manager/work/jobs/new", keywords: ["add", "create", "job", "maintenance", "work"] },
  { id: "new-invoice", label: "New invoice", hint: "Create", href: "/property-manager/money/invoices/new", keywords: ["add", "create", "invoice", "money", "bill"] },
  { id: "new-event", label: "New calendar event", hint: "Create", href: "/property-manager/calendar/events/new", keywords: ["add", "create", "event", "calendar", "schedule"] },
  { id: "new-compliance", label: "New compliance certificate", hint: "Create", href: "/property-manager/compliance/certificates/new", keywords: ["add", "create", "compliance", "certificate", "epc", "gas"] },

  // Go to
  { id: "go-dashboard", label: "Go to Dashboard", hint: "Navigate", href: "/property-manager", keywords: ["home", "dashboard", "overview"] },
  { id: "go-portfolio", label: "Go to Portfolio", hint: "Navigate", href: "/property-manager/portfolio/properties", keywords: ["portfolio", "properties", "units"] },
  { id: "go-contacts", label: "Go to Contacts", hint: "Navigate", href: "/property-manager/contacts", keywords: ["contacts", "people"] },
  { id: "go-work", label: "Go to Work", hint: "Navigate", href: "/property-manager/work/tasks", keywords: ["work", "tasks", "jobs"] },
  { id: "go-money", label: "Go to Money", hint: "Navigate", href: "/property-manager/money", keywords: ["money", "finance", "invoices", "bills"] },
  { id: "go-compliance", label: "Go to Compliance", hint: "Navigate", href: "/property-manager/compliance/overview", keywords: ["compliance", "certificates", "safety"] },
  { id: "go-planning", label: "Go to Planning", hint: "Navigate", href: "/property-manager/planning/sets", keywords: ["planning", "deals", "appraisal"] },
  { id: "go-calendar", label: "Go to Calendar", hint: "Navigate", href: "/property-manager/calendar", keywords: ["calendar", "schedule", "events"] },
  { id: "go-messages", label: "Go to Messages", hint: "Navigate", href: "/property-manager/messages", keywords: ["messages", "inbox", "chat"] },
  { id: "go-settings", label: "Go to Settings", hint: "Navigate", href: "/property-manager/workspace-settings", keywords: ["settings", "workspace", "preferences"] },
]

/** Filters quick commands by a query against label + keywords. */
export function filterCommands(query: string): QuickCommand[] {
  const q = query.trim().toLowerCase()
  if (!q) return QUICK_COMMANDS.slice(0, 6)
  return QUICK_COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q)),
  )
}
