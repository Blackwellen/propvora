import type { Tutorial, ChecklistItem } from "../tutorial-types"

// ============================================================================
// Seeded tutorial content — the 42P01-safe single source of truth for Guided
// Help. The engine works entirely from this even before any DB content exists.
// Admin-editable tutorial templates (guided_help_templates) are a documented
// follow-up; this provides the real, shipping experience today.
// ============================================================================

export const TUTORIALS: Tutorial[] = [
  {
    key: "home.overview",
    type: "first-use",
    title: "Welcome to Propvora",
    summary: "A quick tour of your dashboard.",
    section: "Home",
    routePattern: "/app",
    helpHref: "/help",
    steps: [
      { title: "Your command centre", body: "The dashboard surfaces what needs attention: priority actions, KPIs and recent activity across your portfolio." },
      { title: "Quick create", body: "Use the create button in the top bar to add a property, contact, task or job from anywhere." },
      { title: "AI Copilot", body: "The ✦ bubble (bottom-right) answers questions about this workspace and can draft messages and proposals — you always approve before anything changes." },
    ],
  },
  {
    key: "portfolio.overview",
    type: "first-use",
    title: "Your Portfolio",
    summary: "Properties, units and tenancies in one place.",
    section: "Portfolio",
    routePattern: "/app/portfolio",
    helpHref: "/help",
    steps: [
      { title: "Add your first property", body: "A property is the hub that connects units, tenancies, work, documents, compliance and money records." },
      { title: "Units & tenancies", body: "Add units to a property, then create tenancies to track tenants, rent and deposits." },
      { title: "Everything links back", body: "Work orders, certificates and invoices all attach to the property, so you get a complete operating picture." },
    ],
  },
  {
    key: "work.overview",
    type: "first-use",
    title: "Work & Maintenance",
    summary: "Tasks, jobs and suppliers.",
    section: "Work",
    routePattern: "/app/work",
    helpHref: "/help",
    steps: [
      { title: "Tasks vs jobs", body: "Tasks are lightweight to-dos. Jobs are scheduled maintenance with suppliers, costs and evidence." },
      { title: "Assign suppliers", body: "Assign a job to a supplier, track its status, and collect before/after evidence on completion." },
      { title: "PPM", body: "Planned preventative maintenance keeps recurring work (servicing, inspections) on schedule." },
    ],
  },
  {
    key: "money.overview",
    type: "first-use",
    title: "Money",
    summary: "Income, expenses, invoices and arrears.",
    section: "Money",
    routePattern: "/app/money",
    helpHref: "/help",
    steps: [
      { title: "Track income & expenses", body: "Record rent in and costs out against properties and tenancies for a clear cashflow picture." },
      { title: "Invoices & bills", body: "Raise invoices and log supplier bills; arrears and rent-chase help you stay on top of what's owed." },
      { title: "Accounting", body: "Deeper accounting (journals, reconciliation, reports) lives in the Accounting section." },
    ],
  },
  {
    key: "compliance.overview",
    type: "first-use",
    title: "Compliance",
    summary: "Certificates, inspections and evidence.",
    section: "Compliance",
    routePattern: "/app/compliance",
    helpHref: "/help",
    steps: [
      { title: "Track certificates", body: "Gas Safety, EICR, EPC and more — each with clear expiry states so nothing slips past a deadline." },
      { title: "Upload evidence", body: "Attach certificates and inspection evidence; they're stored securely and linked to the property." },
      { title: "Coverage", body: "See compliance coverage across your portfolio at a glance and act on what's overdue." },
    ],
  },
  {
    key: "contacts.overview",
    type: "first-use",
    title: "Contacts",
    summary: "People, organisations and portals.",
    section: "Contacts",
    routePattern: "/app/contacts",
    helpHref: "/help",
    steps: [
      { title: "People & organisations", body: "Keep tenants, suppliers, landlords and teams in one address book, linked to their records." },
      { title: "Portal access", body: "Grant secure external portals so contacts can upload documents, submit jobs or send invoices." },
    ],
  },
  {
    key: "calendar.overview",
    type: "first-use",
    title: "Calendar",
    summary: "Events, reminders and linked dates.",
    section: "Calendar",
    routePattern: "/app/calendar",
    helpHref: "/help",
    steps: [
      { title: "One timeline", body: "Compliance expiries, tenancy dates, jobs and reminders come together in month, week, day and agenda views." },
      { title: "Create reminders", body: "Add reminders for anything important and never miss a key date." },
    ],
  },
  {
    key: "legal.overview",
    type: "first-use",
    title: "Legal",
    summary: "Possession, HMO, RRA readiness.",
    section: "Legal",
    routePattern: "/app/legal",
    helpHref: "/help",
    steps: [
      { title: "Legal readiness", body: "Track possession matters, HMO licences, EPC advisory and Renters' Rights readiness." },
      { title: "Evidence packs", body: "Keep legal documents and evidence organised and linked to the property and tenancy." },
    ],
  },
]

// ── Portal tutorials (external users — simple, non-technical, no app jargon) ──
export const PORTAL_TUTORIALS: Tutorial[] = [
  {
    key: "portal.landlord.welcome",
    type: "first-use",
    surface: "portal",
    title: "Welcome to your portal",
    summary: "How to use your landlord portal.",
    section: "Landlord portal",
    routePattern: "/landlord-portal",
    steps: [
      { title: "Your properties", body: "See a summary of your properties, statements and key documents shared with you." },
      { title: "Documents", body: "Upload documents when requested, and download statements and reports." },
      { title: "Messaging", body: "Message the management team directly from your portal — no email needed." },
    ],
  },
  {
    key: "portal.supplier.welcome",
    type: "first-use",
    surface: "portal",
    title: "Welcome to your portal",
    summary: "How to use your supplier portal.",
    section: "Supplier portal",
    routePattern: "/supplier-portal",
    steps: [
      { title: "Your jobs", body: "View jobs assigned to you, with the details and location you need to get started." },
      { title: "Quotes & invoices", body: "Submit a quote, then upload your invoice once the work is done." },
      { title: "Evidence", body: "Add before/after photos and notes so the team can review and approve your work." },
    ],
  },
  {
    key: "portal.tenant.welcome",
    type: "first-use",
    surface: "portal",
    title: "Welcome to your portal",
    summary: "How to use your tenant portal.",
    section: "Tenant portal",
    routePattern: "/tenant-portal",
    steps: [
      { title: "Your tenancy", body: "See your tenancy details and any information shared with you." },
      { title: "Report an issue", body: "Submit a maintenance request and add photos so it can be actioned quickly." },
      { title: "Messaging", body: "Message the management team directly from your portal." },
    ],
  },
  {
    key: "portal.generic.welcome",
    type: "first-use",
    surface: "portal",
    title: "Welcome to your portal",
    summary: "How to use your secure portal.",
    section: "Portal",
    routePattern: "/portal",
    steps: [
      { title: "Your secure portal", body: "This is your private space to share documents and messages with the management team." },
      { title: "Stay in touch", body: "Upload anything requested and message the team directly — securely." },
    ],
  },
]

export const SETUP_CHECKLIST: ChecklistItem[] = [
  { key: "chk.property", label: "Add your first property", description: "The hub for everything else.", href: "/app/portfolio/properties", metric: "properties" },
  { key: "chk.unit", label: "Add a unit", description: "Break a property into lettable units.", href: "/app/portfolio", metric: "units" },
  { key: "chk.tenancy", label: "Create a tenancy", description: "Track tenants, rent and deposits.", href: "/app/portfolio", metric: "tenancies" },
  { key: "chk.contact", label: "Add a contact", description: "Tenants, suppliers and teams.", href: "/app/contacts", metric: "contacts" },
  { key: "chk.document", label: "Upload a document", description: "Build your document library and evidence trail.", href: "/app/portfolio", metric: "documents" },
  { key: "chk.team", label: "Invite a team member", description: "Collaborate with roles & permissions.", href: "/app/workspace-settings/team", metric: "team", roles: ["owner", "admin"] },
]
