import "server-only"
import { SITE_DESTINATIONS, SITE_WIZARDS } from "./site-map"

// ============================================================================
// Navigation agent — resolve a natural-language intent into a real Propvora
// destination ({ route, filters, highlightIds }). Pure client navigation: this
// drives the EXISTING UI, it has no privileged data path. The client router
// consumes the result (push route → apply filters → scroll/highlight).
//
// Canonical PM prefix is /property-manager/* (NEVER /app/*) — see CLAUDE.md
// routing rules. Every destination here points at a real, shipped list/section
// page so an intent never resolves to a 404.
// ============================================================================

export interface NavTarget {
  /** Canonical /property-manager route. */
  route: string
  /** Query params to apply (status filters, search, etc.). */
  filters?: Record<string, string>
  /** Record ids to scroll to / highlight on arrival. */
  highlightIds?: string[]
  /** Human label for the "Take me there" affordance. */
  label: string
}

interface NavRule {
  /** Keywords (lowercased) — any match triggers the rule; order = priority. */
  keywords: string[]
  target: Omit<NavTarget, "highlightIds">
}

// Ordered most-specific → most-general. First match wins, so "overdue
// compliance" beats the generic "compliance".
const NAV_RULES: NavRule[] = [
  // ── Compliance ───────────────────────────────────────────────────────────
  {
    keywords: ["expired certificate", "expired certificates", "overdue compliance", "overdue certificate", "expired compliance", "out of date certificate"],
    target: { route: "/property-manager/compliance", filters: { status: "overdue" }, label: "Overdue compliance" },
  },
  {
    keywords: ["due compliance", "compliance due", "expiring certificate", "certificates due", "due soon compliance"],
    target: { route: "/property-manager/compliance", filters: { status: "due_soon" }, label: "Compliance due soon" },
  },
  {
    keywords: ["compliance", "certificate", "certificates", "gas safety", "eicr", "epc", "inspection"],
    target: { route: "/property-manager/compliance", label: "Compliance" },
  },
  // ── Work ─────────────────────────────────────────────────────────────────
  {
    keywords: ["overdue task", "overdue tasks", "late task", "late tasks"],
    target: { route: "/property-manager/work/tasks", filters: { status: "overdue" }, label: "Overdue tasks" },
  },
  {
    keywords: ["new task", "create task", "add task"],
    target: { route: "/property-manager/work/tasks/new", label: "Create a task" },
  },
  {
    keywords: ["task", "tasks", "to-do", "todo"],
    target: { route: "/property-manager/work/tasks", label: "Tasks" },
  },
  {
    keywords: ["job", "jobs", "maintenance", "repair", "work order"],
    target: { route: "/property-manager/work/jobs", label: "Jobs" },
  },
  // ── Portfolio ──────────────────────────────────────────────────────────────
  {
    keywords: ["add property", "new property", "create property"],
    target: { route: "/property-manager/portfolio/properties/new", label: "Add a property" },
  },
  {
    keywords: ["property", "properties", "portfolio", "unit", "units"],
    target: { route: "/property-manager/portfolio/properties", label: "Properties" },
  },
  {
    keywords: ["tenancy", "tenancies", "tenant", "tenants", "lease", "leases"],
    target: { route: "/property-manager/portfolio/tenancies", label: "Tenancies" },
  },
  // ── Money ──────────────────────────────────────────────────────────────────
  {
    keywords: ["arrears", "rent arrears", "overdue rent", "unpaid rent", "behind on rent"],
    target: { route: "/property-manager/money", filters: { tab: "arrears" }, label: "Rent arrears" },
  },
  {
    keywords: ["invoice", "invoices", "billing"],
    target: { route: "/property-manager/money/invoices", label: "Invoices" },
  },
  {
    keywords: ["expense", "expenses", "cost", "costs", "spend"],
    target: { route: "/property-manager/money", filters: { tab: "expenses" }, label: "Expenses" },
  },
  {
    keywords: ["money", "finance", "rent", "income", "cashflow", "cash flow"],
    target: { route: "/property-manager/money", label: "Money" },
  },
  // ── Calendar / Contacts / Planning / Automations ───────────────────────────
  {
    keywords: ["calendar", "schedule", "event", "events", "appointment", "appointments", "diary"],
    target: { route: "/property-manager/calendar", label: "Calendar" },
  },
  {
    keywords: ["contact", "contacts", "people", "landlord", "landlords", "owner", "owners"],
    target: { route: "/property-manager/contacts", label: "Contacts" },
  },
  {
    keywords: ["supplier", "suppliers", "contractor", "contractors", "trade", "trades"],
    target: { route: "/property-manager/suppliers", label: "Suppliers" },
  },
  {
    keywords: ["planning", "forecast", "forecasts", "scenario", "appraisal", "deal"],
    target: { route: "/property-manager/planning", label: "Planning" },
  },
  {
    keywords: ["automation", "automations", "recipe", "recipes", "workflow", "workflows"],
    target: { route: "/property-manager/automations", label: "Automations" },
  },
  {
    keywords: ["document", "documents", "file", "files"],
    target: { route: "/property-manager/documents", label: "Documents" },
  },
  {
    keywords: ["setting", "settings", "preference", "preferences", "account"],
    target: { route: "/property-manager/settings", label: "Settings" },
  },
  {
    keywords: ["home", "dashboard", "overview"],
    target: { route: "/property-manager", label: "Home dashboard" },
  },
]

/**
 * Resolve a navigation intent to a real destination. Returns null when no rule
 * matches (the caller should then fall back to a normal chat answer rather than
 * guessing a route). Matching is substring-based on a lowercased intent.
 */
export function resolveNavigation(intent: string, highlightIds?: string[]): NavTarget | null {
  // Normalise: lowercase + strip articles so "create A tenancy" matches
  // "create tenancy", and collapse whitespace.
  const q = ` ${intent.toLowerCase().replace(/\b(a|an|the|my|to|please|go|take|me)\b/g, " ").replace(/\s+/g, " ").trim()} `
  if (!q.trim()) return null
  const withIds = (t: Omit<NavTarget, "highlightIds">): NavTarget => ({
    ...t,
    ...(highlightIds && highlightIds.length ? { highlightIds } : {}),
  })

  // Gather every candidate match across wizards, filter-rules and destinations,
  // then pick the LONGEST matched keyword (most specific) — so "planning sets"
  // beats "planning" and "schedule ppm" beats "schedule". Wizards win ties
  // (a creation intent should launch the flow, not the list).
  type Cand = { len: number; prio: number; target: Omit<NavTarget, "highlightIds"> }
  let best: Cand | null = null
  const consider = (keywords: string[], prio: number, target: Omit<NavTarget, "highlightIds">) => {
    for (const k of keywords) {
      if (q.includes(k) && (!best || k.length > best.len || (k.length === best.len && prio > best.prio))) {
        best = { len: k.length, prio, target }
      }
    }
  }
  for (const w of SITE_WIZARDS) consider(w.keywords, 3, { route: w.route, label: w.label })
  for (const r of NAV_RULES) consider(r.keywords, 2, r.target)
  for (const d of SITE_DESTINATIONS) consider(d.keywords, 1, { route: d.route, label: d.label })

  return best ? withIds((best as Cand).target) : null
}

/** All canonical destinations (for tests + a "where can you take me?" answer). */
export function navDestinations(): NavTarget[] {
  return NAV_RULES.map((r) => r.target)
}
