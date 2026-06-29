// ============================================================================
// Copilot slash-command + contextual-action registry — SINGLE SOURCE OF TRUTH.
//
// Every command/action the copilot can run is declared ONCE here. Both the chat
// route (slash-command dispatch) and the actions route consume this registry,
// and the client palette is driven from the same list (via /api/ai/commands),
// so the UI list can never drift from what actually has a handler.
//
// A command is purely DECLARATIVE: it carries the instruction the model runs,
// which workspace capability it needs, and whether it's a sensitive draft that
// must be approval-gated. NO command auto-executes a payment, legal or
// destructive action — `requiresApproval` drafts are returned as proposed
// actions for the user to confirm; everything else is read-only guidance.
//
// This module is import-safe on both server and client (no server-only deps,
// no secrets) so the palette can render the catalogue.
// ============================================================================

import type { WorkspaceCapabilities, WorkspaceType } from "./workspace-context"

export type CommandCategory =
  | "Portfolio"
  | "Bookings"
  | "Marketplace"
  | "Supplier"
  | "Payments"
  | "Compliance"
  | "Legal"
  | "Automations"
  | "Communication"
  | "Tasks & Work"
  | "Planning"
  | "Money"
  | "Calendar"
  | "Contacts"
  | "Documents"
  | "General"

/** Which capability flag must be true for this command to be offered. */
export type CapabilityKey = keyof WorkspaceCapabilities | "always"

/**
 * Feature-flag pack that groups commands by product area.
 * Workspaces only see packs that are relevant to their type and enabled flags.
 */
export type CommandPack =
  | "ai-core"       // core AI tools — always available to authenticated workspaces
  | "portfolio"     // property management: properties, units, tenancies
  | "compliance"    // compliance & legal readiness
  | "money"         // rent, payments, cashflow, accounting
  | "work"          // maintenance, jobs, work orders
  | "planning"      // lettings, planning sets, acquisitions
  | "supplier"      // supplier workspace: jobs, quotes, verification
  | "bookings"      // stays, accommodation, booking management
  | "marketplace"   // marketplace OS: listings, orders, disputes

export interface CopilotCommand {
  /** Slash slug, e.g. "/summarise". Unique. */
  slug: string
  /** Display label (defaults to slug). */
  label: string
  description: string
  category: CommandCategory
  /** Capability gate — "always" means available to every workspace type. */
  capability: CapabilityKey
  /**
   * Feature-flag pack this command belongs to. Used to filter the palette by
   * workspace type and enabled feature flags. NEXT_PUBLIC_QA_ALL_FLAGS=true
   * bypasses the filter and shows all commands.
   */
  pack: CommandPack
  /** The instruction sent to the model when this command runs. */
  prompt: string
  /** Draft/operation that must be human-approved before anything is created. */
  requiresApproval: boolean
  /** Tag for the approval queue / audit (only when requiresApproval). */
  mutationType?: string
  /** Keyboard hint shown in the palette. */
  shortcut?: string
}

// ---------------------------------------------------------------------------
// The registry. Ordered roughly by how often each is used.
// ---------------------------------------------------------------------------
export const COPILOT_COMMANDS: CopilotCommand[] = [
  // --- General / AI core (always available) ---
  {
    slug: "/summarise",
    label: "/summarise",
    description: "Summarise the current page in context",
    category: "General",
    capability: "always",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Summarise the user's current workspace situation using the live counts in the WORKSPACE PROFILE. Lead with the most important metric for this workspace type, then list 3-5 specific things they could act on today. Output format: short opening sentence, then numbered list of actions with one-line reasoning each. Under 200 words. If counts are unavailable, say so rather than guessing.",
    requiresApproval: false,
    shortcut: "⌘1",
  },
  {
    slug: "/upcoming-priorities",
    label: "/upcoming-priorities",
    description: "Your prioritised to-do list for the week",
    category: "General",
    capability: "always",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Produce a prioritised weekly action list for this workspace, ordered by urgency. Ground every item in the live counts shown in WORKSPACE CONTEXT (open tasks, jobs, disputes, requests, payouts due). For each item give a one-line reason why it matters this week. Output format: numbered list, item name then dash then reason. Under 200 words. Do not invent figures not present in the context.",
    requiresApproval: false,
    shortcut: "⌘2",
  },
  {
    slug: "/create-task",
    label: "/create-task",
    description: "Draft a task from context",
    category: "Tasks & Work",
    capability: "always",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Turn the user's request into a well-formed task draft. Output format: four labelled fields — Title: (one line), Description: (2-3 sentences), Priority: (Low / Medium / High / Urgent with one-line reason), Due date window: (e.g. within 24 hours / this week / this month). End with: 'Review and confirm before saving.' Do NOT claim the task was created.",
    requiresApproval: true,
    mutationType: "task-draft",
  },
  {
    slug: "/generate-report",
    label: "/generate-report",
    description: "Generate a branded PDF report or letter",
    category: "General",
    capability: "always",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Write the FULL body of the requested document (report, letter or notice) grounded in the real records in WORKSPACE CONTEXT and RELEVANT RECORDS — use the actual property names, addresses, tenant names, amounts and dates. NEVER use {PLACEHOLDER} tokens. Use clear headings and short paragraphs. End with: 'Review and approve to generate the PDF.' Do NOT claim it was generated.",
    requiresApproval: true,
    mutationType: "doc-generate",
  },
  {
    slug: "/agent",
    label: "/agent",
    description: "Plan a multi-step action across your records",
    category: "General",
    capability: "always",
    pack: "ai-core",
    prompt: "(handled by the multi-step agent — this should not reach the chat model)",
    requiresApproval: false,
  },
  {
    slug: "/go-to",
    label: "/go-to",
    description: "Jump to any section or open a wizard",
    category: "General",
    capability: "always",
    pack: "ai-core",
    prompt: "(handled by the navigation agent — this should not reach the model)",
    requiresApproval: false,
  },
  {
    slug: "/compare-properties",
    label: "/compare-properties",
    description: "Compare properties side by side",
    category: "Portfolio",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Compare the properties the user names (or the top properties in RELEVANT RECORDS) side by side on: units, occupancy, active tenancies, monthly rent, open tasks and compliance status. Use ONLY the real figures from WORKSPACE CONTEXT and RELEVANT RECORDS — never invent numbers. Output a compact comparison, one property per block, then a one-line verdict on which needs attention most. If data for a property isn't available, say so.",
    requiresApproval: false,
  },
  {
    slug: "/escalation-summary",
    label: "/escalation-summary",
    description: "List open escalations and high-priority items",
    category: "General",
    capability: "always",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Summarise open escalations and high-priority items for this workspace using the live counts in WORKSPACE CONTEXT (open disputes, high-priority jobs, overdue tasks, pending payouts). Output format: numbered list — item type, count or status, recommended action. If a count is not available, omit that item. Under 180 words.",
    requiresApproval: false,
  },

  // --- Portfolio / operator ---
  {
    slug: "/explain-portfolio",
    label: "/explain-portfolio",
    description: "Portfolio health summary",
    category: "Portfolio",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Give a concise portfolio health summary for this property operator using the live counts from WORKSPACE CONTEXT (properties, units, active tenancies, open tasks, open jobs). Call out occupancy, voids and any operational gaps. Output format: labelled fields — Occupancy: / Voids: / Open tasks: / Open jobs: / Key concerns: — each on one line with a short observation. Under 220 words. Do not invent any figure not present in the context.",
    requiresApproval: false,
  },
  {
    slug: "/check-tenancy",
    label: "/check-tenancy",
    description: "Check tenancy status and what to watch",
    category: "Portfolio",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain the key areas to review for active UK tenancies: rent payment status, break clauses, renewal windows, deposit protection compliance, and right-to-rent validity. Reference the live active-tenancy count from WORKSPACE CONTEXT if shown. Output format: numbered list of review items, each with a one-line what-to-check and one-line risk if missed. Frame all legal points as general information; recommend confirming with a solicitor. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/void-properties",
    label: "/void-properties",
    description: "List vacant units and days void",
    category: "Portfolio",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Summarise the void / vacant situation for this portfolio using the live counts from WORKSPACE CONTEXT (properties, units, active tenancies). Calculate approximate void units as units minus active tenancies if both counts are available. Output format: numbered list — each void unit (use placeholder if actual IDs unknown), estimated days void if determinable, and one recommended action to fill it. End with total estimated void count and monthly revenue impact note (use placeholder figures clearly marked as illustrative). Under 200 words.",
    requiresApproval: false,
  },
  {
    slug: "/tenancy-renewals",
    label: "/tenancy-renewals",
    description: "Tenancies ending in the next 90 days",
    category: "Portfolio",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain what to do for tenancies ending in the next 90 days: renewal negotiation steps, notice periods under UK law (Section 21 / Section 5 notice), what documents to prepare, and how to handle a tenant who wants to leave. Reference the live active-tenancy count from WORKSPACE CONTEXT. Output format: numbered list of action steps with timeframes (90 days out, 60 days, 30 days, final week). Frame legal points as general information; recommend a solicitor for specific cases. Under 230 words.",
    requiresApproval: false,
  },
  {
    slug: "/draft-move-in-letter",
    label: "/draft-move-in-letter",
    description: "Draft a move-in welcome letter for a tenancy",
    category: "Communication",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a professional and warm move-in welcome letter for a new UK residential tenant. Include: greeting with tenant name placeholder {TENANT_NAME}, property address placeholder {PROPERTY_ADDRESS}, tenancy start date placeholder {START_DATE}, key contacts (property manager name {PM_NAME}, emergency number {EMERGENCY_CONTACT}), meter reading reminder, deposit protection scheme reference placeholder {DEPOSIT_SCHEME}, how to report maintenance, and a closing welcome note. Output format: letter body with clear paragraphs labelled by topic. This is a DRAFT for the user to personalise and send; nothing has been created or sent.",
    requiresApproval: true,
    mutationType: "document-draft",
  },

  // --- Compliance ---
  {
    slug: "/review-compliance",
    label: "/review-compliance",
    description: "Review compliance gaps and deadlines",
    category: "Compliance",
    capability: "compliance",
    pack: "compliance",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Using the 'COMPLIANCE NEEDING ATTENTION' items in KEY RECORDS, list each REAL item by its property name and its due/overdue date, ordered most urgent (most overdue) first, and for each give the specific next action (e.g. 'Book EICR for 22 Park Road — overdue 37 days'). Do NOT output a generic checklist when real records are present. If KEY RECORDS shows no compliance items needing attention, say compliance looks up to date and briefly note the core UK requirements. Frame as information, not guaranteed advice. Under 260 words.",
    requiresApproval: false,
  },
  {
    slug: "/find-missing-docs",
    label: "/find-missing-docs",
    description: "Find likely missing documents",
    category: "Compliance",
    capability: "compliance",
    pack: "compliance",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Using KEY RECORDS (properties + compliance items), identify which SPECIFIC properties are missing or overdue on a required document, naming the property and the document (e.g. 'Mill Cottage — EICR overdue, re-let blocked'). Lead with the real gaps from the records; only after that, briefly note any standard UK documents not represented in the records. Never produce only a generic list when real records are present. Output: numbered list — property + document, risk (one line), how to close it (one line). Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/compliance-calendar",
    label: "/compliance-calendar",
    description: "Next 10 compliance items due",
    category: "Compliance",
    capability: "compliance",
    pack: "compliance",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Build a compliance calendar from KEY RECORDS: list the user's REAL compliance items by property name, ordered by actual due/expiry date (soonest first), each with its date and the trigger action (e.g. 'EICR — 88 Hawthorn, expires 7 Jul — book renewal now'). Only use the real dates in the records; do not invent dates. If no records, briefly note standard UK renewal frequencies. Never produce only a generic calendar when real records exist. Under 260 words.",
    requiresApproval: false,
  },
  {
    slug: "/deposit-status",
    label: "/deposit-status",
    description: "List tenancies with deposit issues",
    category: "Compliance",
    capability: "compliance",
    pack: "compliance",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Using the ACTIVE TENANCIES in KEY RECORDS, list each tenancy by tenant name and property, and flag deposit risk where relevant (e.g. a 'Protect deposit' task in KEY RECORDS, or a tenancy that may need confirmation). Name the specific tenancies. Then briefly state the UK rule (30-day protection, approved schemes, up to 3x penalty) as context. Never produce only a generic explanation when real tenancies are listed. Frame as information, recommend a solicitor for specific cases. Under 230 words.",
    requiresApproval: false,
  },

  // --- Money ---
  {
    slug: "/chase-arrears",
    label: "/chase-arrears",
    description: "Draft an arrears chase message",
    category: "Communication",
    capability: "portfolio",
    pack: "money",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a firm but fair rent arrears chase message for a UK tenant. Include: tenant name placeholder {TENANT_NAME}, property address placeholder {PROPERTY_ADDRESS}, amount overdue placeholder {AMOUNT_OVERDUE}, due date placeholder {DUE_DATE}, payment methods, and a one-line note that continued non-payment may lead to formal action (frame as general information, not legal advice). Output format: message body with subject line on the first line, then the body paragraphs. End with: 'This is a DRAFT — review before sending.' Nothing has been sent.",
    requiresApproval: true,
    mutationType: "message-draft",
  },
  {
    slug: "/explain-payout",
    label: "/explain-payout",
    description: "Explain a payout or hold",
    category: "Payments",
    capability: "payments",
    pack: "money",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how payouts and payment holds work for this workspace: common reasons funds may be held (pending job completion, open dispute, identity verification), the typical release sequence, and what the user can do to unblock a held payout. Reference the pending-payout count from WORKSPACE CONTEXT if shown. Output format: numbered list of hold reasons then steps to unblock. End with: 'Any payout release must be actioned by you through Propvora's controls — I cannot move money.' Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/cashflow-forecast",
    label: "/cashflow-forecast",
    description: "Explain a 30-day cashflow view",
    category: "Money",
    capability: "payments",
    pack: "money",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how to read and build a 30-day cashflow forecast for this workspace: income streams (rent, orders, bookings), outgoings (mortgage, agent fees, maintenance reserve, payouts due), void risk, and the net position. Output format: labelled fields — Income sources: / Outgoings to account for: / Void risk: / What to watch: — each with a short paragraph. Include a note that any figures used as examples are illustrative and not financial advice. Under 240 words.",
    requiresApproval: false,
  },

  // --- Tasks and Work ---
  {
    slug: "/create-work-order",
    label: "/create-work-order",
    description: "Draft a maintenance work order",
    category: "Tasks & Work",
    capability: "portfolio",
    pack: "work",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a maintenance work order based on the user's description. Output format: five labelled fields — Title: (one line), Issue description: (2-3 sentences), Property/unit: (placeholder {PROPERTY_ADDRESS} if not specified), Urgency: (Routine / Urgent / Emergency with one-line reason), Trade required: (e.g. plumber, electrician, general handyman). End with: 'Confirm and save this draft in the Work section.' Do NOT claim it was created.",
    requiresApproval: true,
    mutationType: "job-draft",
  },
  {
    slug: "/job-pipeline",
    label: "/job-pipeline",
    description: "Jobs by status — open, in-progress, complete",
    category: "Tasks & Work",
    capability: "portfolio",
    pack: "work",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Summarise the current maintenance job pipeline for this workspace using the live counts from WORKSPACE CONTEXT (open jobs). Explain what each pipeline stage means (open, assigned, scheduled, in-progress, complete) and what action the operator should take at each stage. Output format: numbered list of stages — stage name, what it means, operator action required. End with the open-job count from context and a note on what to prioritise. Under 220 words. Do not invent counts not in the context.",
    requiresApproval: false,
  },

  // --- Planning ---
  {
    slug: "/review-planning",
    label: "/review-planning",
    description: "Review a planning set",
    category: "Planning",
    capability: "planning",
    pack: "planning",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Help review a property planning set (acquisition or development). Cover: key risks to assess, typical planning-permission timeline in England, what a complete planning pack should contain, and common oversights. Output format: numbered list of review items — each with a one-line what-to-check and one-line risk. End with a note that planning matters must be confirmed with a planning consultant or solicitor. Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/draft-landlord-offer",
    label: "/draft-landlord-offer",
    description: "Draft a landlord acquisition offer",
    category: "Planning",
    capability: "planning",
    pack: "planning",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a professional landlord acquisition offer letter. Include: property address placeholder {PROPERTY_ADDRESS}, offered price placeholder {OFFERED_PRICE}, proposed completion timeline placeholder {COMPLETION_DATE}, conditions (subject to survey, subject to vacant possession, subject to satisfactory searches). Keep it professional and concise. Output format: letter body with labelled sections — Offer, Price, Conditions, Next steps. End with: 'This is a DRAFT — review with your solicitor before sending.' Nothing has been submitted.",
    requiresApproval: true,
    mutationType: "document-draft",
  },

  // --- Bookings ---
  {
    slug: "/draft-listing",
    label: "/draft-listing",
    description: "Draft a booking/accommodation listing",
    category: "Bookings",
    capability: "bookings",
    pack: "bookings",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a compelling short-let or accommodation listing. Output format: four labelled sections — Title: (one punchy line under 10 words), Description: (120-150 words, guest-focused), Highlights: (5 bullet points as dashed list), House rules: (5 rules as dashed list). Use placeholders {PROPERTY_NAME}, {LOCATION}, {BEDROOMS}, {SLEEPS} where specifics are not provided. End with: 'This is a DRAFT — edit and publish it yourself in the Bookings section.' Nothing has been created.",
    requiresApproval: true,
    mutationType: "listing-draft",
  },
  {
    slug: "/summarise-booking",
    label: "/summarise-booking",
    description: "Summarise a reservation and next steps",
    category: "Bookings",
    capability: "bookings",
    pack: "bookings",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Provide a reusable reservation summary template an operator can fill in for any booking. Output format: labelled fields — Guest: {GUEST_NAME} / Dates: {CHECK_IN} to {CHECK_OUT} / Payment status: {PAYMENT_STATUS} / Deposit held: {DEPOSIT_AMOUNT} / Access/check-in plan: {ACCESS_METHOD} / Outstanding actions: {ACTION_LIST}. After the template, add a numbered list of 5 standard pre-arrival actions the operator should complete. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/suggest-pricing",
    label: "/suggest-pricing",
    description: "Suggest a pricing approach for a listing",
    category: "Bookings",
    capability: "bookings",
    pack: "bookings",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Suggest a structured pricing approach for a short-let listing. Output format: labelled sections — Base rate logic: / Weekday vs weekend: / Seasonal and peak adjustments: / Length-of-stay discounts: / Cleaning fee: / Minimum stay: — each section with one paragraph of guidance. Include placeholder example figures clearly marked as illustrative only, not financial advice. Under 240 words.",
    requiresApproval: false,
  },

  // --- Marketplace ---
  {
    slug: "/draft-marketplace-listing",
    label: "/draft-marketplace-listing",
    description: "Draft a marketplace service or product listing",
    category: "Marketplace",
    capability: "marketplace",
    pack: "marketplace",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a marketplace listing for a property service or product. Output format: four labelled sections — Title: (one clear line under 10 words), Description: (100-140 words, buyer-focused), Scope and inclusions: (5 items as dashed list), Pricing: (one line with placeholder {PRICE} clearly marked as illustrative). End with: 'This is a DRAFT — review and publish it yourself in the Marketplace section.' Nothing has been published.",
    requiresApproval: true,
    mutationType: "listing-draft",
  },
  {
    slug: "/explain-dispute",
    label: "/explain-dispute",
    description: "Explain a dispute and the resolution path",
    category: "Marketplace",
    capability: "marketplace",
    pack: "marketplace",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how a marketplace or order dispute typically progresses and what the operator should do at each stage. Cover: opening a dispute, evidence gathering, the standard review stages, payment-hold implications, and communicating with both parties. Reference the open-dispute count from WORKSPACE CONTEXT if shown. Output format: numbered list of stages — stage name, what happens, what the operator should do. End with: 'This is process guidance, not a legal ruling — consult a solicitor for formal disputes.' Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/review-orders",
    label: "/review-orders",
    description: "Review open marketplace orders",
    category: "Marketplace",
    capability: "marketplace",
    pack: "marketplace",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how to triage open marketplace orders, covering each order state and what action it requires. States to cover: awaiting payment, accepted but not started, in progress, ready to release funds, disputed. Reference the open-order count from WORKSPACE CONTEXT if shown. Output format: numbered list — state name, what it means, operator action required (one line each). End with a note on how to spot at-risk orders (no activity in 72+ hours, no supplier response). Under 220 words.",
    requiresApproval: false,
  },

  // --- Supplier pack ---
  {
    slug: "/compare-quotes",
    label: "/compare-quotes",
    description: "Compare supplier quotes objectively",
    category: "Supplier",
    capability: "supplier",
    pack: "supplier",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how to compare competing supplier quotes for a job objectively. Cover: normalising scope (like-for-like), price versus inclusions, checking insurance and verification status, lead time, warranty terms, and review scores. Provide a simple scoring framework. Output format: numbered list of comparison criteria — criterion name, what to check, why it matters (one line each). Then a scoring table template with placeholder columns. Reference the open-quote count from WORKSPACE CONTEXT if shown. Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/draft-supplier-message",
    label: "/draft-supplier-message",
    description: "Draft a message to a supplier",
    category: "Communication",
    capability: "supplier",
    pack: "supplier",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a professional message to a supplier or contractor about a job. Output format: labelled sections — Subject: (one line), Message body: (covering the request, property/access details using placeholder {PROPERTY_ADDRESS}, timeline, and confirmation request), Sign-off: (using placeholder {YOUR_NAME}). Keep it courteous and under 150 words. End with: 'This is a DRAFT — review and send it yourself from the Messages section.' Nothing has been sent.",
    requiresApproval: true,
    mutationType: "message-draft",
  },
  {
    slug: "/explain-verification",
    label: "/explain-verification",
    description: "Explain supplier verification status",
    category: "Supplier",
    capability: "supplier",
    pack: "supplier",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain what supplier verification covers on Propvora and why each badge matters. Cover: identity verification, business registration, public liability insurance, trade-specific licences (Gas Safe, NICEIC, etc.), and reference checks. Output format: numbered list — badge name, what it verifies, why it matters before assigning work (one line each). End with a note on what minimum badges an operator should require for high-risk jobs (gas, electrical). Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/supplier-quotes",
    label: "/supplier-quotes",
    description: "Summary of outstanding supplier quotes",
    category: "Supplier",
    capability: "supplier",
    pack: "supplier",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Summarise the outstanding quote situation for this workspace using the live open-quote count from WORKSPACE CONTEXT. Explain what each quote status means (draft, sent/pending, submitted, accepted, rejected) and what the operator should do if a quote has been open for more than 5 days without a response. Output format: numbered list — status name, what it means, action required. End with the open-quote count from context. Under 200 words.",
    requiresApproval: false,
  },

  // --- Automations ---
  {
    slug: "/suggest-automation",
    label: "/suggest-automation",
    description: "Suggest a useful automation recipe",
    category: "Automations",
    capability: "automations",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Suggest 3 high-value automation recipes for this workspace type and its active modules. For each recipe show the trigger, condition, and action. Explain the time saved per week (estimate clearly labelled as illustrative). Output format: numbered list — Recipe name, Trigger: / Condition: / Action: / Time saved: — each on its own line. End with: 'Build and enable these in the Automations section — they are suggestions only.' Under 220 words.",
    requiresApproval: false,
  },

  // --- Calendar ---
  {
    slug: "/whats-coming-up",
    label: "/whats-coming-up",
    description: "Upcoming calendar events and deadlines",
    category: "Calendar",
    capability: "always",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Summarise what's coming up for this workspace using the live items in WORKSPACE CONTEXT and KEY RECORDS (upcoming calendar events, compliance due dates, tenancy renewals, task due dates). Order by date, soonest first, and name the REAL item where records are present (e.g. 'Tue — Gas safety inspection at 22 Park Road'). For each give a one-line prep action. If no dated records are present, say the calendar looks clear for the period. Under 200 words. Never invent dates.",
    requiresApproval: false,
  },
  {
    slug: "/draft-event",
    label: "/draft-event",
    description: "Draft a calendar event to add",
    category: "Calendar",
    capability: "always",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Turn the user's request into a calendar event draft. Output format: five labelled fields — Title: (one line), Type: (Inspection / Viewing / Meeting / Maintenance / Reminder / Other), When: (date and time, or a clear window if unspecified), Location/property: (placeholder {PROPERTY_ADDRESS} if not given), Notes: (1-2 sentences). End with: 'Review and confirm to add this to the Calendar.' Do NOT claim it was created.",
    requiresApproval: true,
    mutationType: "event-draft",
  },

  // --- Contacts ---
  {
    slug: "/find-contact",
    label: "/find-contact",
    description: "Find a contact and their linked records",
    category: "Contacts",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Using the contacts and related records in KEY RECORDS / RELEVANT RECORDS, locate the contact the user describes (by name, role or linked property) and summarise who they are: contact type (tenant, landlord, supplier, etc.), key details present in the records, and which properties or tenancies they are linked to. Name the REAL contact and links. If no matching contact appears in the records, say so and suggest how to refine the search. Under 200 words. Never invent contact details.",
    requiresApproval: false,
  },
  {
    slug: "/draft-contact-intro",
    label: "/draft-contact-intro",
    description: "Draft an introduction message to a contact",
    category: "Communication",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a professional introduction or first-contact message. Output format: labelled sections — Subject: (one line), Message body: (covering who you are, the reason for contact, and a clear next step, using placeholders {CONTACT_NAME}, {YOUR_NAME}, {PROPERTY_ADDRESS} where specifics are not provided), Sign-off:. Keep it courteous and under 150 words. End with: 'This is a DRAFT — review and send it yourself from the Messages section.' Nothing has been sent.",
    requiresApproval: true,
    mutationType: "message-draft",
  },

  // --- Documents ---
  {
    slug: "/find-document",
    label: "/find-document",
    description: "Find a document and where it's linked",
    category: "Documents",
    capability: "always",
    pack: "ai-core",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Using the documents and certificates in KEY RECORDS / RELEVANT RECORDS, find the document the user describes (by type, property or date) and report: document name/type, the property or record it is linked to, its status, and any expiry date present. Name the REAL document. If nothing matches the records, say so and note where that document type would normally live (Compliance certificates, property documents, etc.). Under 200 words. Never invent a document.",
    requiresApproval: false,
  },

  // --- Legal (V1 — gated by the compliance/legal capability) ---
  {
    slug: "/possession-options",
    label: "/possession-options",
    description: "Explain possession routes for a tenancy",
    category: "Legal",
    capability: "compliance",
    pack: "compliance",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain the general routes a UK landlord may consider to recover possession of a residential property: Section 21 (no-fault, where still applicable), Section 8 (grounds-based, e.g. arrears ground 8/10/11), and the accelerated vs standard court process at a high level. Note key prerequisites (valid deposit protection, EPC/EICR/gas served, How to Rent guide, correct notice periods). Output format: numbered list — route name, when it may apply, key prerequisites, typical timeline. Frame everything as general information, NOT legal advice, and strongly recommend confirming with a solicitor before serving any notice. Under 260 words.",
    requiresApproval: false,
  },
  {
    slug: "/draft-inspection-notice",
    label: "/draft-inspection-notice",
    description: "Draft a tenant inspection / access notice",
    category: "Legal",
    capability: "portfolio",
    pack: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a courteous tenant notice giving the legally-required minimum 24 hours' written notice for property access (routine inspection or maintenance) under a UK residential tenancy. Include placeholders {TENANT_NAME}, {PROPERTY_ADDRESS}, {VISIT_DATE}, {VISIT_TIME}, {REASON}, {PM_NAME}. Make clear access is at a reasonable time and the tenant can propose an alternative. Output format: letter/message body with clear paragraphs. End with: 'This is a DRAFT — review and send it yourself; ensure at least 24 hours notice. General information, not legal advice.' Nothing has been sent.",
    requiresApproval: true,
    mutationType: "document-draft",
  },

  // --- Money (expanded) ---
  {
    slug: "/rent-roll",
    label: "/rent-roll",
    description: "Summarise the rent roll across tenancies",
    category: "Money",
    capability: "portfolio",
    pack: "money",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Build a rent-roll summary from the ACTIVE TENANCIES and property records in KEY RECORDS: list each tenancy by tenant and property with its monthly rent where present, then give the total monthly rent across the portfolio. Use ONLY real figures from the records — never invent rent amounts. Flag any tenancy showing arrears or a missing rent figure. Output format: numbered list — tenant + property + monthly rent, then a TOTAL line and a one-line note on anything to chase. If no tenancies are present, say so. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/expense-summary",
    label: "/expense-summary",
    description: "Summarise expenses and where money is going",
    category: "Money",
    capability: "payments",
    pack: "money",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Summarise the workspace's outgoings using the expense, bill and invoice records in KEY RECORDS / RELEVANT RECORDS. Group by category where the records allow (maintenance, mortgage/finance, fees, utilities, other), give the real total per category, and highlight the largest cost driver and any unpaid bills. Use ONLY real figures from the records — never invent amounts. Output format: labelled categories with totals, then a one-line note on the biggest spend and anything overdue. If no expense records are present, say so. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/rent-increase-letter",
    label: "/rent-increase-letter",
    description: "Draft a rent increase notice",
    category: "Communication",
    capability: "portfolio",
    pack: "money",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a UK rent increase notice for an assured shorthold tenancy. Include placeholders {TENANT_NAME}, {PROPERTY_ADDRESS}, {CURRENT_RENT}, {NEW_RENT}, {EFFECTIVE_DATE}, {PM_NAME}. State the new rent, the effective date (respecting the minimum one month / one rent-period notice and not within the first 12 months of a periodic increase via Section 13 where relevant), and a courteous rationale. Output format: letter body with clear paragraphs. End with: 'This is a DRAFT — confirm the correct statutory notice and period with your solicitor before serving. General information, not legal advice.' Nothing has been sent.",
    requiresApproval: true,
    mutationType: "document-draft",
  },
]

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------
const BY_SLUG = new Map(COPILOT_COMMANDS.map((c) => [c.slug.toLowerCase(), c]))

export function getCommand(slug: string): CopilotCommand | undefined {
  const key = (slug.startsWith("/") ? slug : `/${slug}`).toLowerCase()
  return BY_SLUG.get(key)
}

/**
 * Does a message begin with a known slash command?
 * Returns the command + any trailing args text.
 * Handles: /slug, /slug args, /slug-with-dashes, case-insensitive.
 */
export function parseSlashCommand(
  message: string
): { command: CopilotCommand; args: string } | null {
  const trimmed = message.trimStart()
  if (!trimmed.startsWith("/")) return null
  const firstTok = trimmed.split(/\s+/, 1)[0].toLowerCase()
  const cmd = BY_SLUG.get(firstTok)
  if (!cmd) return null
  const args = trimmed.slice(firstTok.length).trim()
  return { command: cmd, args }
}

/** Filter the registry to the commands a given workspace type can use. */
export function commandsForCapabilities(caps: WorkspaceCapabilities): CopilotCommand[] {
  return COPILOT_COMMANDS.filter(
    (c) => c.capability === "always" || caps[c.capability as keyof WorkspaceCapabilities]
  )
}

export function commandsForType(
  type: WorkspaceType,
  capsFor: (t: WorkspaceType) => WorkspaceCapabilities
): CopilotCommand[] {
  return commandsForCapabilities(capsFor(type))
}

// ---------------------------------------------------------------------------
// Pack-based filtering for the slash-command palette.
// Returns the packs that are enabled for a given workspace type.
// NEXT_PUBLIC_QA_ALL_FLAGS=true bypasses all pack filtering.
// ---------------------------------------------------------------------------

export function getEnabledPacks(
  workspaceType: WorkspaceType,
  caps: WorkspaceCapabilities
): CommandPack[] {
  // QA all-flags mode: show every pack regardless of workspace type.
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true"
  ) {
    return [
      "ai-core",
      "portfolio",
      "compliance",
      "money",
      "work",
      "planning",
      "supplier",
      "bookings",
      "marketplace",
    ]
  }

  const packs: CommandPack[] = ["ai-core"]

  if (workspaceType === "operator") {
    packs.push("portfolio", "compliance", "money", "work", "planning")
    if (caps.bookings) packs.push("bookings")
    if (caps.marketplace) packs.push("marketplace")
  }

  if (workspaceType === "supplier") {
    packs.push("supplier", "work")
    if (caps.compliance) packs.push("compliance")
    if (caps.marketplace) packs.push("marketplace")
  }

  if (workspaceType === "customer") {
    if (caps.bookings) packs.push("bookings")
    if (caps.marketplace) packs.push("marketplace")
  }

  return packs
}

/**
 * Return all commands visible for a workspace type + capability set,
 * filtered by enabled packs.
 */
export function commandsForPacks(
  workspaceType: WorkspaceType,
  caps: WorkspaceCapabilities
): CopilotCommand[] {
  const enabledPacks = getEnabledPacks(workspaceType, caps)
  return COPILOT_COMMANDS.filter(
    (c) =>
      enabledPacks.includes(c.pack) &&
      (c.capability === "always" || caps[c.capability as keyof WorkspaceCapabilities])
  )
}

/** Human-readable pack label for palette group headers. */
export function packLabel(pack: CommandPack): string {
  switch (pack) {
    case "ai-core":     return "AI Core"
    case "portfolio":   return "Portfolio"
    case "compliance":  return "Compliance"
    case "money":       return "Money"
    case "work":        return "Work & Maintenance"
    case "planning":    return "Planning"
    case "supplier":    return "Supplier"
    case "bookings":    return "Bookings"
    case "marketplace": return "Marketplace"
  }
}

/** Stable pack display order for the palette. */
export const PACK_ORDER: CommandPack[] = [
  "ai-core",
  "portfolio",
  "compliance",
  "money",
  "work",
  "planning",
  "supplier",
  "bookings",
  "marketplace",
]
