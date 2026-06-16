import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Live workspace context for the AI Copilot (v2-aware).
//
// Produces a concise, FACTUAL snapshot of the caller's current workspace so the
// model answers from real data instead of generic guesses. Every query is
// 42P01/42703-safe (missing table or column → that metric is simply omitted),
// and all counts run under the caller's RLS-scoped Supabase client, so the AI
// can never see data outside the active workspace.
//
// v2 adds:
//   • workspace TYPE resolution (operator / supplier / customer) so the copilot
//     knows whose console it is in and which modules apply,
//   • counts for the new surfaces (bookings, marketplace, supplier jobs/quotes,
//     payments/payouts, disputes, automations),
//   • a capability map per workspace type that downstream code uses to decide
//     which contextual actions / slash-commands are offered.
//
// We deliberately use head-only COUNT queries (no row payloads) so this stays
// cheap, leaks no record contents into the prompt, and is resilient to the
// column-name drift that exists across this schema.
// ============================================================================

export type WorkspaceType = "operator" | "supplier" | "customer"

export interface WorkspaceProfile {
  type: WorkspaceType
  /** Sub-type label, e.g. "property-manager", "supplier", from workspaces.workspace_type. */
  subType: string | null
  /** Free-text business descriptor (portfolio_landlord, …) when present. */
  businessType: string | null
  name: string | null
  plan: string | null
}

export interface WorkspaceSnapshot {
  // Operator / portfolio
  properties?: number
  units?: number
  activeTenancies?: number
  openTasks?: number
  openJobs?: number
  contacts?: number
  documents?: number
  // Bookings (short-let / accommodation)
  bookingListings?: number
  upcomingBookings?: number
  bookingRequests?: number
  // Marketplace OS
  marketplaceListings?: number
  openOrders?: number
  openDisputes?: number
  // Supplier workspace
  supplierJobs?: number
  openQuotes?: number
  // Payments / money
  pendingPayouts?: number
  // Automations
  activeAutomations?: number
}

// ---------------------------------------------------------------------------
// Capability map: which module groups a workspace type can act on. Used to
// resolve the right contextual actions / commands per workspace.
// ---------------------------------------------------------------------------
export interface WorkspaceCapabilities {
  portfolio: boolean
  bookings: boolean
  marketplace: boolean
  supplier: boolean
  payments: boolean
  automations: boolean
  compliance: boolean
  planning: boolean
}

export function capabilitiesFor(type: WorkspaceType): WorkspaceCapabilities {
  switch (type) {
    case "supplier":
      return {
        portfolio: false, bookings: false, marketplace: true, supplier: true,
        payments: true, automations: true, compliance: true, planning: false,
      }
    case "customer":
      return {
        portfolio: false, bookings: true, marketplace: true, supplier: false,
        payments: true, automations: false, compliance: false, planning: false,
      }
    case "operator":
    default:
      return {
        portfolio: true, bookings: true, marketplace: true, supplier: true,
        payments: true, automations: true, compliance: true, planning: true,
      }
  }
}

/** Safe head-count for a table filtered by workspace. Returns undefined on any error. */
async function safeCount(
  supabase: SupabaseClient,
  table: string,
  workspaceId: string,
  extra?: (q: any) => any
): Promise<number | undefined> {
  try {
    let q: any = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
    if (extra) q = extra(q)
    const { count, error } = await q
    if (error) return undefined
    return count ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Resolve the workspace profile (type + sub-type) from the workspaces row.
 * Tolerant of missing columns — defaults to "operator" which is the broadest
 * capability set (so nothing is wrongly hidden if the column is absent).
 */
export async function getWorkspaceProfile(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined
): Promise<WorkspaceProfile> {
  const fallback: WorkspaceProfile = {
    type: "operator", subType: null, businessType: null, name: null, plan: null,
  }
  if (!workspaceId || workspaceId === "demo-workspace") return fallback
  try {
    const { data } = await supabase
      .from("workspaces")
      .select("name, type, workspace_type, business_type, plan")
      .eq("id", workspaceId)
      .maybeSingle()
    if (!data) return fallback
    const raw = String((data as any).type ?? "").toLowerCase().trim()
    const type: WorkspaceType =
      raw === "supplier" ? "supplier" : raw === "customer" ? "customer" : "operator"
    return {
      type,
      subType: ((data as any).workspace_type as string | null) ?? null,
      businessType: ((data as any).business_type as string | null) ?? null,
      name: ((data as any).name as string | null) ?? null,
      plan: ((data as any).plan as string | null) ?? null,
    }
  } catch {
    return fallback
  }
}

/**
 * Build a live snapshot of the workspace, scoped to what this workspace TYPE can
 * see. Runs all counts in parallel. Never throws — partial results are expected.
 */
export async function getWorkspaceSnapshot(
  supabase: SupabaseClient,
  workspaceId: string,
  caps?: WorkspaceCapabilities
): Promise<WorkspaceSnapshot> {
  if (!workspaceId || workspaceId === "demo-workspace") return {}
  const c = caps ?? capabilitiesFor("operator")

  const todayIso = new Date().toISOString().slice(0, 10)

  const tasks: Promise<[keyof WorkspaceSnapshot, number | undefined]>[] = []
  const add = (key: keyof WorkspaceSnapshot, p: Promise<number | undefined>) =>
    tasks.push(p.then((v) => [key, v] as [keyof WorkspaceSnapshot, number | undefined]))

  if (c.portfolio) {
    add("properties", safeCount(supabase, "properties", workspaceId))
    add("units", safeCount(supabase, "units", workspaceId))
    add("activeTenancies", safeCount(supabase, "tenancies", workspaceId, (q) => q.eq("status", "active")))
    add("openTasks", safeCount(supabase, "tasks", workspaceId, (q) => q.neq("status", "done")))
    add("openJobs", safeCount(supabase, "jobs", workspaceId, (q) =>
      q.in("status", ["open", "scheduled", "in_progress", "assigned"])))
    add("contacts", safeCount(supabase, "contacts", workspaceId))
    add("documents", safeCount(supabase, "documents", workspaceId))
  }
  if (c.bookings) {
    add("bookingListings", safeCount(supabase, "booking_listings", workspaceId))
    add("upcomingBookings", safeCount(supabase, "bookings", workspaceId, (q) =>
      q.in("status", ["confirmed", "pending", "checked_in"])))
    add("bookingRequests", safeCount(supabase, "booking_requests", workspaceId, (q) =>
      q.in("status", ["pending", "new", "open"])))
  }
  if (c.marketplace) {
    add("marketplaceListings", safeCount(supabase, "marketplace_listings", workspaceId))
    add("openOrders", safeCount(supabase, "marketplace_orders", workspaceId, (q) =>
      q.in("status", ["pending", "accepted", "in_progress", "awaiting_payment", "open"])))
    add("openDisputes", safeCount(supabase, "marketplace_disputes", workspaceId, (q) =>
      q.in("status", ["open", "pending", "under_review", "escalated"])))
  }
  if (c.supplier) {
    add("supplierJobs", safeCount(supabase, "supplier_jobs", workspaceId, (q) =>
      q.in("status", ["open", "assigned", "scheduled", "in_progress", "quoted"])))
    add("openQuotes", safeCount(supabase, "supplier_quotes", workspaceId, (q) =>
      q.in("status", ["draft", "sent", "pending", "submitted"])))
  }
  if (c.payments) {
    add("pendingPayouts", safeCount(supabase, "payouts", workspaceId, (q) =>
      q.in("status", ["pending", "scheduled", "processing", "on_hold"])))
  }
  if (c.automations) {
    add("activeAutomations", safeCount(supabase, "automation_definitions", workspaceId, (q) =>
      q.eq("status", "active")))
  }

  void todayIso
  const results = await Promise.all(tasks)
  const snap: WorkspaceSnapshot = {}
  for (const [key, val] of results) {
    if (typeof val === "number") (snap as any)[key] = val
  }
  return snap
}

function typeLabel(type: WorkspaceType): string {
  switch (type) {
    case "supplier": return "Supplier / contractor workspace"
    case "customer": return "Customer (guest / buyer) workspace"
    default: return "Property operator workspace"
  }
}

function moduleList(caps: WorkspaceCapabilities): string {
  const on: string[] = []
  if (caps.portfolio) on.push("Portfolio (properties, units, tenancies)")
  if (caps.bookings) on.push("Bookings & accommodation (listings, reservations, availability, pricing, calendar)")
  if (caps.marketplace) on.push("Marketplace OS (listings, search, orders, disputes)")
  if (caps.supplier) on.push("Supplier workspace (jobs, quotes, verification)")
  if (caps.payments) on.push("Payments, holds, disputes & payouts")
  if (caps.automations) on.push("Automations engine (canvas, recipes, runs)")
  if (caps.compliance) on.push("Compliance & legal readiness")
  if (caps.planning) on.push("Planning sets")
  return on.map((m) => `- ${m}`).join("\n")
}

/**
 * Render the full type-aware context block (profile + modules + live counts) for
 * the system prompt.
 */
export function renderWorkspaceContext(
  profile: WorkspaceProfile,
  caps: WorkspaceCapabilities,
  snap: WorkspaceSnapshot
): string {
  const lines: string[] = []
  const add = (label: string, n?: number) => {
    if (typeof n === "number") lines.push(`- ${label}: ${n}`)
  }
  // portfolio
  add("Properties", snap.properties)
  add("Units", snap.units)
  add("Active tenancies", snap.activeTenancies)
  add("Open tasks", snap.openTasks)
  add("Open jobs", snap.openJobs)
  add("Contacts", snap.contacts)
  add("Documents", snap.documents)
  // bookings
  add("Booking listings", snap.bookingListings)
  add("Upcoming bookings", snap.upcomingBookings)
  add("Pending booking requests", snap.bookingRequests)
  // marketplace
  add("Marketplace listings", snap.marketplaceListings)
  add("Open marketplace orders", snap.openOrders)
  add("Open disputes", snap.openDisputes)
  // supplier
  add("Active supplier jobs", snap.supplierJobs)
  add("Open quotes", snap.openQuotes)
  // payments
  add("Pending payouts", snap.pendingPayouts)
  // automations
  add("Active automations", snap.activeAutomations)

  const counts =
    lines.length === 0
      ? "No workspace records are available yet (this may be a new or empty workspace)."
      : `Live workspace data (current counts, scoped to this workspace only):\n${lines.join("\n")}`

  return `WORKSPACE PROFILE
- Type: ${typeLabel(profile.type)}${profile.name ? ` ("${profile.name}")` : ""}${profile.plan ? ` — ${profile.plan} plan` : ""}
${profile.subType ? `- Profile: ${profile.subType}\n` : ""}${profile.businessType ? `- Business type: ${profile.businessType}\n` : ""}
AVAILABLE MODULES
${moduleList(caps)}

${counts}`
}

// ---------------------------------------------------------------------------
// Back-compat: the previous flat snapshot renderer. Kept so any caller that
// still imports renderSnapshot keeps working; it renders just the counts.
// ---------------------------------------------------------------------------
export function renderSnapshot(snap: WorkspaceSnapshot): string {
  const lines: string[] = []
  const add = (label: string, n?: number) => {
    if (typeof n === "number") lines.push(`- ${label}: ${n}`)
  }
  add("Properties", snap.properties)
  add("Units", snap.units)
  add("Active tenancies", snap.activeTenancies)
  add("Open tasks", snap.openTasks)
  add("Open jobs", snap.openJobs)
  add("Contacts", snap.contacts)
  add("Documents", snap.documents)
  add("Booking listings", snap.bookingListings)
  add("Upcoming bookings", snap.upcomingBookings)
  add("Marketplace listings", snap.marketplaceListings)
  add("Open marketplace orders", snap.openOrders)
  add("Active supplier jobs", snap.supplierJobs)
  add("Open quotes", snap.openQuotes)

  if (lines.length === 0) {
    return "No workspace records are available yet (this may be a new or empty workspace)."
  }
  return `Live workspace data (current counts, scoped to this workspace only):\n${lines.join("\n")}`
}

/**
 * One-shot helper: resolve profile + caps + snapshot together. Used by the chat
 * and actions routes so the assembly logic lives in one place.
 */
export interface FullWorkspaceContext {
  profile: WorkspaceProfile
  caps: WorkspaceCapabilities
  snapshot: WorkspaceSnapshot
}

export async function getFullWorkspaceContext(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined
): Promise<FullWorkspaceContext> {
  const profile = await getWorkspaceProfile(supabase, workspaceId)
  const caps = capabilitiesFor(profile.type)
  const snapshot = workspaceId
    ? await getWorkspaceSnapshot(supabase, workspaceId, caps)
    : {}
  return { profile, caps, snapshot }
}
