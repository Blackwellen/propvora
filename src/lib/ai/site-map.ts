// Import-safe on server + client (pure data + a render helper, no secrets).
// ============================================================================
// Propvora site map — the Copilot's knowledge of the WHOLE app so it can
// navigate to any section/sub-tab and LAUNCH any creation wizard. This is what
// connects the Copilot to the product instead of leaving it a bubble.
//
// Canonical PM prefix is /property-manager/* (NEVER /app/*). Destinations are
// real, shipped routes. WIZARDS are the creation flows — surfaced as Copilot
// actions ("Add a property", "Schedule PPM") so the assistant can DO things.
// ============================================================================

export interface SiteDestination {
  /** Lowercased keywords; any substring match triggers it (order = priority). */
  keywords: string[]
  route: string
  label: string
  /** Section group, for the prompt's app-structure summary. */
  section: string
}

export interface SiteWizard extends SiteDestination {
  /** Short verb phrase for the action chip, e.g. "Add a property". */
  action: string
}

// ── Navigable destinations (overview + sub-tabs across every section) ────────
export const SITE_DESTINATIONS: SiteDestination[] = [
  // Home
  { keywords: ["home", "dashboard", "overview"], route: "/property-manager", label: "Home", section: "Home" },

  // Portfolio
  { keywords: ["portfolio"], route: "/property-manager/portfolio", label: "Portfolio overview", section: "Portfolio" },
  { keywords: ["properties", "property list"], route: "/property-manager/portfolio/properties", label: "Properties", section: "Portfolio" },
  { keywords: ["units", "rooms"], route: "/property-manager/portfolio/units", label: "Units", section: "Portfolio" },
  { keywords: ["tenancies", "tenancy", "leases", "tenants"], route: "/property-manager/portfolio/tenancies", label: "Tenancies", section: "Portfolio" },

  // Work
  { keywords: ["work overview", "maintenance overview"], route: "/property-manager/work", label: "Work overview", section: "Work" },
  { keywords: ["tasks", "to-do", "todo"], route: "/property-manager/work/tasks", label: "Tasks", section: "Work" },
  { keywords: ["jobs", "work orders", "repairs"], route: "/property-manager/work/jobs", label: "Jobs", section: "Work" },
  { keywords: ["board", "kanban"], route: "/property-manager/work/board", label: "Work board", section: "Work" },
  { keywords: ["gantt", "gant"], route: "/property-manager/work/gantt", label: "Work Gantt", section: "Work" },
  { keywords: ["ppm", "planned maintenance", "preventive maintenance", "schedules"], route: "/property-manager/work/ppm", label: "PPM", section: "Work" },
  { keywords: ["suppliers", "contractors", "trades"], route: "/property-manager/work/suppliers", label: "Suppliers", section: "Work" },
  { keywords: ["complaints"], route: "/property-manager/work/complaints", label: "Complaints", section: "Work" },
  { keywords: ["work reports"], route: "/property-manager/work/reports", label: "Work reports", section: "Work" },

  // Planning
  { keywords: ["planning overview", "planning"], route: "/property-manager/planning", label: "Planning overview", section: "Planning" },
  { keywords: ["profiles", "strategy profiles"], route: "/property-manager/planning/profiles", label: "Planning profiles", section: "Planning" },
  { keywords: ["planning sets", "appraisals", "deals"], route: "/property-manager/planning/sets", label: "Planning sets", section: "Planning" },
  { keywords: ["offers", "landlord offers"], route: "/property-manager/planning/landlord-offers", label: "Landlord offers", section: "Planning" },
  { keywords: ["forecasts", "forecast"], route: "/property-manager/planning/forecasts", label: "Forecasts", section: "Planning" },

  // Contacts
  { keywords: ["contacts overview", "contacts"], route: "/property-manager/contacts", label: "Contacts overview", section: "Contacts" },
  { keywords: ["people", "individuals"], route: "/property-manager/contacts/people", label: "People", section: "Contacts" },
  { keywords: ["organisations", "organizations", "companies"], route: "/property-manager/contacts/organisations", label: "Organisations", section: "Contacts" },
  { keywords: ["contacts board"], route: "/property-manager/contacts/board", label: "Contacts board", section: "Contacts" },

  // Portals
  { keywords: ["portals", "portal access", "access grants"], route: "/property-manager/portals", label: "Portals", section: "Portals" },

  // Money
  { keywords: ["money overview", "finance", "money"], route: "/property-manager/money", label: "Money overview", section: "Money" },
  { keywords: ["income", "rent received"], route: "/property-manager/money/income", label: "Income", section: "Money" },
  { keywords: ["expenses", "costs", "spend"], route: "/property-manager/money/expenses", label: "Expenses", section: "Money" },
  { keywords: ["invoices", "invoice"], route: "/property-manager/money/invoices", label: "Invoices", section: "Money" },
  { keywords: ["bills"], route: "/property-manager/money/bills", label: "Bills", section: "Money" },
  { keywords: ["arrears", "overdue rent", "unpaid rent"], route: "/property-manager/money/arrears", label: "Arrears", section: "Money" },
  { keywords: ["deposits", "deposit"], route: "/property-manager/money/deposits", label: "Deposits", section: "Money" },
  { keywords: ["payouts"], route: "/property-manager/money/payouts", label: "Payouts", section: "Money" },
  { keywords: ["rent chase", "chase rent"], route: "/property-manager/money/rent-chase", label: "Rent chase", section: "Money" },

  // Calendar
  { keywords: ["calendar", "schedule", "diary"], route: "/property-manager/calendar", label: "Calendar", section: "Calendar" },
  { keywords: ["events"], route: "/property-manager/calendar/events", label: "Events", section: "Calendar" },
  { keywords: ["reminders"], route: "/property-manager/calendar/reminders", label: "Reminders", section: "Calendar" },

  // Compliance
  { keywords: ["compliance overview", "compliance"], route: "/property-manager/compliance", label: "Compliance overview", section: "Compliance" },
  { keywords: ["certificates", "certificate", "gas safety", "eicr", "epc certificate"], route: "/property-manager/compliance/certificates", label: "Certificates", section: "Compliance" },
  { keywords: ["inspections", "inspection"], route: "/property-manager/compliance/inspections", label: "Inspections", section: "Compliance" },
  { keywords: ["compliance documents", "evidence"], route: "/property-manager/compliance/documents", label: "Compliance documents", section: "Compliance" },
  { keywords: ["coverage"], route: "/property-manager/compliance/coverage", label: "Compliance coverage", section: "Compliance" },

  // Legal
  { keywords: ["legal overview", "legal"], route: "/property-manager/legal", label: "Legal overview", section: "Legal" },
  { keywords: ["possession", "eviction", "section 21", "section 8"], route: "/property-manager/legal/possession", label: "Possession", section: "Legal" },
  { keywords: ["hmo licence", "hmo license", "hmo licences"], route: "/property-manager/legal/hmo-licences", label: "HMO licences", section: "Legal" },
  { keywords: ["epc advisory", "epc"], route: "/property-manager/legal/epc-advisory", label: "EPC advisory", section: "Legal" },
  { keywords: ["rra", "renters rights", "rra 2026"], route: "/property-manager/legal/rra-2026", label: "RRA 2026", section: "Legal" },

  // Messages / Automations / Documents / Settings
  { keywords: ["messages", "inbox"], route: "/property-manager/messages", label: "Messages", section: "Messages" },
  { keywords: ["automations", "recipes", "workflows"], route: "/property-manager/automations", label: "Automations", section: "Automations" },
  { keywords: ["documents", "files"], route: "/property-manager/contacts/documents", label: "Documents", section: "Documents" },
  { keywords: ["settings", "workspace settings", "preferences"], route: "/property-manager/workspace-settings", label: "Workspace settings", section: "Settings" },
  { keywords: ["billing", "subscription", "plan"], route: "/property-manager/workspace/billing", label: "Billing", section: "Settings" },
]

// ── Wizards (creation flows) — surfaced as Copilot ACTIONS ───────────────────
export const SITE_WIZARDS: SiteWizard[] = [
  { keywords: ["add property", "new property", "create property"], route: "/property-manager/portfolio/properties/new", label: "Add property", action: "Add a property", section: "Portfolio" },
  { keywords: ["add unit", "new unit", "create unit"], route: "/property-manager/portfolio/units/new", label: "Add unit", action: "Add a unit", section: "Portfolio" },
  { keywords: ["create tenancy", "new tenancy", "add tenancy", "add tenant"], route: "/property-manager/portfolio/tenancies/new", label: "Create tenancy", action: "Create a tenancy", section: "Portfolio" },
  { keywords: ["create task", "new task", "add task"], route: "/property-manager/work/tasks/new", label: "Create task", action: "Create a task", section: "Work" },
  { keywords: ["create job", "new job", "raise job", "log repair"], route: "/property-manager/work/jobs/new", label: "Create job", action: "Raise a job", section: "Work" },
  { keywords: ["new ppm", "ppm schedule", "schedule ppm", "planned maintenance schedule"], route: "/property-manager/work/ppm/new", label: "New PPM schedule", action: "Schedule PPM", section: "Work" },
  { keywords: ["new planning set", "create planning set", "new appraisal"], route: "/property-manager/planning/sets/new", label: "New planning set", action: "New planning set", section: "Planning" },
  { keywords: ["new offer", "create offer", "landlord offer"], route: "/property-manager/planning/landlord-offers/new", label: "New landlord offer", action: "New landlord offer", section: "Planning" },
  { keywords: ["add contact", "new contact", "create contact"], route: "/property-manager/contacts/new", label: "Add contact", action: "Add a contact", section: "Contacts" },
  { keywords: ["add income", "record income", "log income"], route: "/property-manager/money/income/new", label: "Add income", action: "Add income", section: "Money" },
  { keywords: ["add expense", "record expense", "log expense"], route: "/property-manager/money/expenses/new", label: "Add expense", action: "Add an expense", section: "Money" },
  { keywords: ["new invoice", "create invoice", "raise invoice"], route: "/property-manager/money/invoices/new", label: "New invoice", action: "Create an invoice", section: "Money" },
  { keywords: ["add bill", "new bill", "record bill"], route: "/property-manager/money/bills/new", label: "Add bill", action: "Add a bill", section: "Money" },
  { keywords: ["track deposit", "new deposit", "protect deposit"], route: "/property-manager/money/deposits/new", label: "Track deposit", action: "Track a deposit", section: "Money" },
  { keywords: ["new rent chase", "rent chase case", "chase arrears case"], route: "/property-manager/money/rent-chase?new=1", label: "New rent chase case", action: "Start a rent chase", section: "Money" },
  { keywords: ["new event", "create event", "add event"], route: "/property-manager/calendar/events/new", label: "New event", action: "Create an event", section: "Calendar" },
  { keywords: ["new reminder", "add reminder", "set reminder"], route: "/property-manager/calendar/reminders/new", label: "New reminder", action: "Set a reminder", section: "Calendar" },
  { keywords: ["add certificate", "new certificate", "upload certificate", "renew certificate"], route: "/property-manager/compliance/certificates/new", label: "Add certificate", action: "Add a certificate", section: "Compliance" },
  { keywords: ["schedule inspection", "new inspection", "book inspection"], route: "/property-manager/compliance/inspections/new", label: "Schedule inspection", action: "Schedule an inspection", section: "Compliance" },
  { keywords: ["upload document", "add document", "upload evidence", "add evidence"], route: "/property-manager/compliance/documents/new", label: "Upload document", action: "Upload a document", section: "Compliance" },
  { keywords: ["new possession", "possession case", "start eviction"], route: "/property-manager/legal/possession/new", label: "New possession case", action: "Start a possession case", section: "Legal" },
  { keywords: ["register hmo", "hmo licence registration", "new hmo licence"], route: "/property-manager/legal/hmo-licences?new=1", label: "Register HMO licence", action: "Register an HMO licence", section: "Legal" },
  { keywords: ["grant portal", "portal access", "invite to portal"], route: "/property-manager/portals?new=1", label: "Grant portal access", action: "Grant portal access", section: "Portals" },
]

/** A compact app-structure summary for the system prompt. */
export function renderSiteStructure(): string {
  const bySection = new Map<string, string[]>()
  for (const d of SITE_DESTINATIONS) {
    if (!bySection.has(d.section)) bySection.set(d.section, [])
    bySection.get(d.section)!.push(d.label)
  }
  const lines = [...bySection.entries()].map(([s, items]) => `- ${s}: ${items.join(", ")}`)
  const wizards = SITE_WIZARDS.map((w) => w.action).join(", ")
  return `PROPVORA APP STRUCTURE (you can take the user to any of these and launch any creation flow):\n${lines.join("\n")}\nCreation flows you can launch: ${wizards}.`
}
