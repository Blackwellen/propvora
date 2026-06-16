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
      "Summarise the user's current workspace situation using the live counts in the WORKSPACE PROFILE and data above. Lead with what matters most for this workspace type, then list 3-5 concrete things they could do next. Under 200 words.",
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
      "Produce a prioritised weekly action list for this workspace, ordered by urgency. Use ONLY the live counts above to ground it (open tasks, jobs, disputes, requests, payouts due). For each item give a one-line why. Under 200 words.",
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
      "Give a concise portfolio health summary for this property operator using the live counts (properties, units, active tenancies, open tasks/jobs). Call out occupancy, voids and anything that looks like a gap. Be specific and actionable. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/check-tenancy",
    label: "/check-tenancy",
    description: "Check tenancy status & what to watch",
    category: "Portfolio",
    capability: "portfolio",
    prompt:
      "Explain what to review for active tenancies in a UK portfolio: rent status, break clauses, renewal windows, deposit protection and compliance ties. Reference the live active-tenancy count. Keep legal points as general information and recommend confirming with a solicitor. Under 220 words.",
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
      "Provide a UK rental compliance review checklist: Gas Safety (annual), EICR (5y), EPC (10y, min E), smoke/CO alarms, Legionella, HMO licensing, deposit protection (30 days). Note frequency and the risk of each gap. Frame legal points as general information. Under 260 words.",
    requiresApproval: false,
  },
  {
    slug: "/find-missing-docs",
    label: "/find-missing-docs",
    description: "Find likely missing documents",
    category: "Compliance",
    capability: "compliance",
    prompt:
      "List the documents a UK rental portfolio most commonly is missing (Gas Safety, EICR, EPC, signed AST, deposit protection certificate, Right to Rent checks) and the legal risk of each absence. Suggest how to close the gaps. Under 240 words.",
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
      "Draft a compelling short-let / accommodation listing: a punchy title, a 120-150 word description, 5 highlight bullets, and suggested house-rules. Use placeholders like {property name}, {location}, {bedrooms} where specifics aren't provided. This is a DRAFT for the user to edit and publish themselves.",
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
      "Explain how to summarise a reservation for an operator: guest details, dates, payment/deposit status, access/check-in plan, and any outstanding actions before arrival. Provide a reusable summary template with labelled placeholders. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/suggest-pricing",
    label: "/suggest-pricing",
    description: "Suggest a pricing approach for a listing",
    category: "Bookings",
    capability: "bookings",
    prompt:
      "Suggest a structured pricing approach for a short-let listing: base nightly rate logic, weekday vs weekend, seasonal/peak adjustments, length-of-stay discounts, cleaning fee and minimum-stay. Present it as a framework with example numbers clearly marked as illustrative, not financial advice. Under 240 words.",
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
      "Draft a marketplace listing for a property service or product: a clear title, a 100-140 word description, scope/inclusions bullets, and a suggested pricing line. Use placeholders for specifics. This is a DRAFT the user reviews before publishing.",
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
      "Explain how an open marketplace/order dispute typically progresses and what the operator should do: gather evidence, the standard resolution stages, payment-hold implications, and how to communicate fairly with both sides. Keep it process guidance, not a legal ruling. Reference the open-dispute count if shown. Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/review-orders",
    label: "/review-orders",
    description: "Review open marketplace orders",
    category: "Marketplace",
    capability: "marketplace",
    prompt:
      "Explain how to triage open marketplace orders: which states need action (awaiting payment, accepted-not-started, in progress, ready to release), what to check before releasing funds, and how to spot at-risk orders. Reference the open-order count if shown. Under 220 words.",
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
      "Explain how to compare competing supplier quotes for a job objectively: normalise scope, compare price vs inclusions, check insurance/verification status, lead time, warranty and reviews. Provide a simple scoring framework the user can apply. Reference the open-quote count if shown. Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/draft-supplier-message",
    label: "/draft-supplier-message",
    description: "Draft a message to a supplier",
    category: "Communication",
    capability: "supplier",
    prompt:
      "Draft a professional, concise message to a supplier/contractor about a job. Cover the request, the property/access context (use placeholders), the timeline, and ask for confirmation. Keep it courteous and clear. This is a DRAFT the user sends themselves.",
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
      "Explain what supplier verification covers (identity, business registration, insurance, licences, references) and why each badge matters when assigning work. Describe what an operator should require before trusting a supplier with a job. Under 220 words.",
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
      "Explain how payouts and payment holds work for the user: why funds may be held (pending completion, dispute, verification), the typical release sequence, and what the user can do to unblock a held payout. Make clear you cannot move money — any release is actioned by the user through Propvora's controls. Reference the pending-payout count if shown. Under 220 words.",
    requiresApproval: false,
  },
  {
    slug: "/cashflow-forecast",
    label: "/cashflow-forecast",
    description: "Explain a 30-day cashflow view",
    category: "Money",
    capability: "payments",
    prompt:
      "Explain how to read a 30-day cashflow for this workspace: money in (rent / orders / bookings), money out (mortgage, fees, maintenance reserve, payouts), and voids/risk. Give a simple framework with illustrative figures clearly marked as examples, not financial advice. Under 240 words.",
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
      "Draft a firm-but-fair rent arrears chase message for a UK tenant, plus a one-line explanation of when escalation (Section 8) becomes relevant framed as general information. Use placeholders for tenant name, amount and dates. This is a DRAFT the user reviews and sends.",
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
      "Turn the user's request into a well-formed task: a clear title, a short description, a suggested priority and a suggested due-date window. Return it as a structured draft. Do NOT claim the task was created — the user confirms and saves it.",
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
      "Draft a maintenance work order: title, description of the issue, affected property/unit (placeholder), urgency, and the trade required. Return it as a structured draft for the user to confirm. Do NOT claim it was created.",
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
      "Help review a property planning set (acquisition/development): key risks, planning-permission timelines, what a complete set should contain, and common oversights. Frame legal/financial points as general information to confirm with professionals. Under 240 words.",
    requiresApproval: false,
  },
  {
    slug: "/draft-landlord-offer",
    label: "/draft-landlord-offer",
    description: "Draft a landlord acquisition offer",
    category: "Planning",
    capability: "planning",
    prompt:
      "Draft a professional landlord acquisition offer letter: property address placeholder, offered price, completion timeline, and conditions (subject to survey, vacant possession). Make it professional. This is a DRAFT the user reviews before sending; it creates nothing.",
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
      "Suggest 3 high-value automation recipes for this workspace type, each as trigger → condition → action. Keep them practical and explain the time saved. Make clear these are suggestions the user builds and enables themselves in the Automations canvas. Under 220 words.",
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
