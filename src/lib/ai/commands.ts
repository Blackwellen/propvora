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
  | "Automations"
  | "Communication"
  | "Tasks & Work"
  | "Planning"
  | "Money"
  | "General"

/** Which capability flag must be true for this command to be offered. */
export type CapabilityKey = keyof WorkspaceCapabilities | "always"

export interface CopilotCommand {
  /** Slash slug, e.g. "/summarise". Unique. */
  slug: string
  /** Display label (defaults to slug). */
  label: string
  description: string
  category: CommandCategory
  /** Capability gate — "always" means available to every workspace type. */
  capability: CapabilityKey
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
  // --- General / analysis (read-only) ---
  {
    slug: "/summarise",
    label: "/summarise",
    description: "Summarise the current page in context",
    category: "General",
    capability: "always",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers, no bold formatting. Summarise this workspace situation using the live counts in the WORKSPACE PROFILE. Write 3 to 5 sentences covering what is most important right now, then give a numbered list of 3 to 5 concrete next actions the user should take. Use plain numbered lines like '1. Action here'. Under 200 words.",
    requiresApproval: false,
    shortcut: "⌘1",
  },
  {
    slug: "/upcoming-priorities",
    label: "/upcoming-priorities",
    description: "Your prioritised to-do list for the week",
    category: "General",
    capability: "always",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Produce a numbered weekly priority list for this workspace ordered by urgency. Use ONLY the live counts above (open tasks, jobs, disputes, requests, payouts due). For each item give a one-line reason why it is urgent. Format each as '1. Task — why it matters'. Under 200 words.",
    requiresApproval: false,
    shortcut: "⌘2",
  },

  // --- Portfolio / operator ---
  {
    slug: "/explain-portfolio",
    label: "/explain-portfolio",
    description: "Portfolio health summary",
    category: "Portfolio",
    capability: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Give a concise portfolio health summary using the live counts (properties, units, active tenancies, open tasks and jobs). Write two short paragraphs: the first covering occupancy and financial health, the second covering voids, risks and gaps. Then give a numbered list of 3 actions to improve portfolio health. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/check-tenancy",
    label: "/check-tenancy",
    description: "Check tenancy status & what to watch",
    category: "Portfolio",
    capability: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain what to review for active tenancies in a UK portfolio. Cover rent status, break clauses, renewal windows, deposit protection and compliance ties. Reference the live active-tenancy count if shown. Give a numbered checklist of things to verify. Frame legal points as general information and note that a solicitor should confirm specifics. Under 220 words.",
    requiresApproval: false,
  },

  // --- Compliance ---
  {
    slug: "/review-compliance",
    label: "/review-compliance",
    description: "Review compliance gaps & deadlines",
    category: "Compliance",
    capability: "compliance",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Provide a UK rental compliance checklist as a numbered list. Cover these 8 areas in order: 1. Gas Safety certificate (annual), 2. EICR electrical inspection (every 5 years), 3. EPC energy certificate (10 years, minimum grade E), 4. Smoke and CO alarms, 5. Legionella risk assessment, 6. HMO licensing if applicable, 7. Deposit protection (30-day deadline), 8. Right to Rent checks. For each state the frequency and the risk of a gap. Frame all legal points as general information. Under 260 words.",
    requiresApproval: false,
  },
  {
    slug: "/find-missing-docs",
    label: "/find-missing-docs",
    description: "Find likely missing documents",
    category: "Compliance",
    capability: "compliance",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. List the documents a UK rental portfolio most commonly is missing as a numbered list. Cover Gas Safety certificate, EICR, EPC, signed AST, deposit protection certificate, Right to Rent checks, and How to Rent guide. For each document state the legal risk of its absence and a one-line suggestion for closing the gap. Under 240 words.",
    requiresApproval: false,
  },

  // --- Bookings ---
  {
    slug: "/draft-listing",
    label: "/draft-listing",
    description: "Draft a booking/accommodation listing",
    category: "Bookings",
    capability: "bookings",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a short-let accommodation listing. Structure it as: Title (one line), Description (120 to 150 words in plain prose), Highlights (numbered list of 5 items), House Rules (numbered list of 5 rules). Use placeholders like {property name}, {location}, {bedrooms} where specifics are not provided. Mark this clearly at the top as: DRAFT — review and edit before publishing. This creates nothing automatically.",
    requiresApproval: true,
    mutationType: "listing-draft",
  },
  {
    slug: "/summarise-booking",
    label: "/summarise-booking",
    description: "Summarise a reservation & next steps",
    category: "Bookings",
    capability: "bookings",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Provide a reusable reservation summary template with labelled placeholders. Cover: Guest name and contact, Dates (check-in and check-out), Payment and deposit status, Access and check-in plan, Outstanding actions before arrival. Format each field as 'Label: {placeholder}' on its own line. Then add a short paragraph on what to confirm in the 48 hours before check-in. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/suggest-pricing",
    label: "/suggest-pricing",
    description: "Suggest a pricing approach for a listing",
    category: "Bookings",
    capability: "bookings",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Suggest a structured pricing framework for a short-let listing. Cover these points as a numbered list: 1. Base nightly rate logic, 2. Weekday versus weekend differential, 3. Seasonal and peak-period adjustments, 4. Length-of-stay discounts, 5. Cleaning fee structure, 6. Minimum stay rules. Include illustrative example figures clearly labelled as examples only and not financial advice. Under 240 words.",
    requiresApproval: false,
  },

  // --- Marketplace ---
  {
    slug: "/draft-marketplace-listing",
    label: "/draft-marketplace-listing",
    description: "Draft a marketplace service/product listing",
    category: "Marketplace",
    capability: "marketplace",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a marketplace listing for a property service or product. Structure it as: Title (one line), Description (100 to 140 words in plain prose), What is included (numbered list of 5 items), Pricing line (one sentence). Use placeholders for specifics not provided. Mark clearly at the top as: DRAFT — review before publishing. This creates nothing automatically.",
    requiresApproval: true,
    mutationType: "listing-draft",
  },
  {
    slug: "/explain-dispute",
    label: "/explain-dispute",
    description: "Explain a dispute and the resolution path",
    category: "Marketplace",
    capability: "marketplace",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how an open marketplace order dispute progresses and what the operator should do. Write two short paragraphs: the first covering evidence gathering and the resolution stages, the second covering payment-hold implications and fair communication with both sides. Then give a numbered list of 3 immediate actions the operator should take. Reference the open-dispute count if shown. Frame this as process guidance, not legal advice. Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/review-orders",
    label: "/review-orders",
    description: "Review open marketplace orders",
    category: "Marketplace",
    capability: "marketplace",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how to triage open marketplace orders. Give a numbered list covering the 4 key order states that need action: awaiting payment, accepted but not started, in progress, and ready to release. For each state describe what to check and what to do. Add a short paragraph on how to spot at-risk orders. Reference the open-order count if shown. Under 220 words.",
    requiresApproval: false,
  },

  // --- Supplier ---
  {
    slug: "/compare-quotes",
    label: "/compare-quotes",
    description: "Compare supplier quotes objectively",
    category: "Supplier",
    capability: "supplier",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how to compare competing supplier quotes for a job objectively. Give a numbered scoring framework covering: 1. Normalise scope and inclusions, 2. Compare price per deliverable, 3. Check insurance and verification status, 4. Assess lead time and availability, 5. Review warranty and aftercare, 6. Check platform rating and reviews. Reference the open-quote count if shown. Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/draft-supplier-message",
    label: "/draft-supplier-message",
    description: "Draft a message to a supplier",
    category: "Communication",
    capability: "supplier",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a professional concise message to a supplier or contractor about a job. Structure it as: Opening (one sentence stating the request), Context (property and access details using placeholders like {property address} and {access instructions}), Timeline (when the work is needed), Confirmation request (what you need them to confirm). Mark clearly at the top as: DRAFT — review before sending. This sends nothing automatically.",
    requiresApproval: true,
    mutationType: "message-draft",
  },
  {
    slug: "/explain-verification",
    label: "/explain-verification",
    description: "Explain supplier verification status",
    category: "Supplier",
    capability: "supplier",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain what supplier verification covers and why each badge matters. Give a numbered list covering: 1. Identity verification, 2. Business registration check, 3. Public liability insurance, 4. Trade licences and qualifications, 5. References and work history. For each item say what it protects the operator against and what the minimum requirement should be before assigning a job. Under 220 words.",
    requiresApproval: false,
  },

  // --- Payments ---
  {
    slug: "/explain-payout",
    label: "/explain-payout",
    description: "Explain a payout / hold",
    category: "Payments",
    capability: "payments",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how payouts and payment holds work. Write two short paragraphs: the first covering why funds may be held (pending completion, open dispute, verification required) and the typical release sequence; the second covering what the user can do to unblock a held payout through Propvora controls. Make clear that you cannot move money — all releases are actioned by the user. Reference the pending-payout count if shown. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/cashflow-forecast",
    label: "/cashflow-forecast",
    description: "Explain a 30-day cashflow view",
    category: "Money",
    capability: "payments",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Explain how to read a 30-day cashflow for this workspace. Write one short paragraph summarising the concept, then give two numbered lists: the first listing typical money-in sources (rent, orders, bookings) and the second listing typical money-out items (mortgage payments, fees, maintenance reserve, payouts). Include illustrative example figures labelled clearly as examples only, not financial advice. Under 240 words.",
    requiresApproval: false,
  },

  // --- Money / arrears (operator) ---
  {
    slug: "/chase-arrears",
    label: "/chase-arrears",
    description: "Draft an arrears chase message",
    category: "Communication",
    capability: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a firm but fair rent arrears chase message for a UK tenant. Use placeholders like {tenant name}, {amount owed} and {due date}. Write the message in plain business letter style with: Opening (state the arrears clearly), Middle (request payment or a payment plan), Close (deadline for response and next steps). After the message draft, add a one-sentence note on when escalation via Section 8 becomes relevant, framed as general information only. Mark clearly at the top as: DRAFT — review before sending.",
    requiresApproval: true,
    mutationType: "message-draft",
  },

  // --- Tasks & Work ---
  {
    slug: "/create-task",
    label: "/create-task",
    description: "Draft a task from context",
    category: "Tasks & Work",
    capability: "always",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Turn the user's request into a well-formed task. Present it as labelled fields on separate lines: Title: (one clear action-oriented line), Description: (2 to 3 sentences explaining what needs doing and why), Priority: (High / Medium / Low with a one-line reason), Suggested due date: (a timeframe like 'within 3 days' or 'by end of week'). Mark clearly at the top as: DRAFT TASK — confirm and save in Propvora. This creates nothing automatically.",
    requiresApproval: true,
    mutationType: "task-draft",
  },
  {
    slug: "/create-work-order",
    label: "/create-work-order",
    description: "Draft a maintenance work order",
    category: "Tasks & Work",
    capability: "portfolio",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a maintenance work order as labelled fields on separate lines: Title: (one line describing the issue), Issue description: (2 to 3 sentences), Property and unit: ({property address} — {unit reference}), Urgency: (Emergency / Urgent / Routine with reason), Trade required: (e.g. Plumber, Electrician, General builder). Mark clearly at the top as: DRAFT WORK ORDER — confirm and create in Propvora. This creates nothing automatically.",
    requiresApproval: true,
    mutationType: "job-draft",
  },

  // --- Planning ---
  {
    slug: "/review-planning",
    label: "/review-planning",
    description: "Review a planning set",
    category: "Planning",
    capability: "planning",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Help review a property planning set for an acquisition or development. Write one short paragraph on the key risks to check, then give a numbered checklist of what a complete planning set should contain: 1. Planning permission status and conditions, 2. Building regulations approval, 3. Title deeds and boundary confirmation, 4. Survey reports (structural, environmental), 5. Utility connections and capacity, 6. Access rights and easements. End with a one-sentence note that legal and financial points should be confirmed with qualified professionals. Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/draft-landlord-offer",
    label: "/draft-landlord-offer",
    description: "Draft a landlord acquisition offer",
    category: "Planning",
    capability: "planning",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Draft a professional landlord acquisition offer letter in plain business letter style. Include these sections as labelled paragraphs: Property (address placeholder), Offered price ({offered price} — subject to survey and valuation), Completion timeline ({proposed completion date}), Conditions (subject to satisfactory survey and vacant possession), Contact details ({your name and contact}). Mark clearly at the top as: DRAFT OFFER LETTER — review with your solicitor before sending. This creates nothing automatically.",
    requiresApproval: true,
    mutationType: "document-draft",
  },

  // --- Automations ---
  {
    slug: "/suggest-automation",
    label: "/suggest-automation",
    description: "Suggest a useful automation recipe",
    category: "Automations",
    capability: "automations",
    prompt:
      "Respond in plain text only. No asterisks, no markdown headers. Suggest 3 high-value automation recipes for this workspace type. Present each as a numbered item with this structure: the trigger, the condition (if any), the action, and the time saved per week. Format each as: '1. Recipe name — Trigger: X. Condition: Y. Action: Z. Time saved: approximately N minutes per week.' Make clear at the end that these are suggestions the user builds and enables themselves in the Automations canvas. Under 220 words.",
    requiresApproval: false,
  },
]

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------
const BY_SLUG = new Map(COPILOT_COMMANDS.map((c) => [c.slug, c]))

export function getCommand(slug: string): CopilotCommand | undefined {
  return BY_SLUG.get(slug.startsWith("/") ? slug : `/${slug}`)
}

/** Does a message begin with a known slash command? Returns it + the remaining args text. */
export function parseSlashCommand(
  message: string
): { command: CopilotCommand; args: string } | null {
  const trimmed = message.trimStart()
  if (!trimmed.startsWith("/")) return null
  const firstTok = trimmed.split(/\s+/, 1)[0]
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
