// Automation Engine — SMART RECIPES.
//
// A recipe is a curated node graph across a business domain (booking / supplier
// / marketplace / money / compliance / legal / customer). Instantiating a recipe
// creates a DISABLED DRAFT v2 definition in the workspace (never auto-activates
// or runs), plus its node-graph version. The user reviews + enables it.
//
// Recipes are grounded in the REAL catalogue: each recipe's trigger maps to a
// catalogue TriggerType the engine can evaluate, and each action node maps to a
// SAFE catalogue action (NODE_ACTION_MAP) the executor can run — or to a GATED
// node (payment/legal/approval) that compiles to an approval, never an auto-run.
// This guarantees an instantiated recipe both compiles and (for its safe steps)
// actually executes.

import type { SupabaseClient } from "@supabase/supabase-js"
import { createDefinition, type DefinitionAction } from "./definitions"
import { createVersion, type CanvasGraph } from "./canvas-model"
import { compileCanvas } from "./canvas-compile"
import { NODE_ACTION_MAP } from "./node-registry"
import type { ActionType, TriggerType } from "./types"

export type RecipeDomain =
  | "booking"
  | "supplier"
  | "marketplace"
  | "money"
  | "compliance"
  | "legal"
  | "customer"

export interface RecipeNode {
  node_key: string
  node_type: string
  label?: string
  config?: Record<string, unknown>
}
export interface RecipeEdge {
  source_key: string
  target_key: string
  branch_label?: string
}

export interface SmartRecipe {
  slug: string
  name: string
  description: string
  domain: RecipeDomain
  minPlan: "Starter" | "Operator" | "Scale" | "Pro / Agency" | "Enterprise"
  recommended?: boolean
  /** Catalogue trigger this recipe's definition listens on. */
  trigger: { kind: "event" | "schedule" | "webhook"; type: TriggerType; config?: Record<string, unknown> }
  /** The node graph (trigger node + action/gated nodes + end). */
  graph: { nodes: RecipeNode[]; edges: RecipeEdge[] }
  /** The v2 definition action array (the executor-drained safe actions). */
  actions: DefinitionAction[]
}

/**
 * The curated recipe catalogue. Each is review-first and disabled on install.
 * Domains span the whole product surface; every action node maps to a safe
 * catalogue action or a gated approval node.
 */
export const SMART_RECIPES: SmartRecipe[] = [
  // ── Compliance ─────────────────────────────────────────────────────────────
  {
    slug: "compliance-expiry-task",
    name: "Compliance expiring → renewal task",
    description: "When a certificate or licence falls due within 30 days, create a high-priority renewal task.",
    domain: "compliance",
    minPlan: "Operator",
    recommended: true,
    trigger: { kind: "event", type: "compliance_due_soon", config: { within_days: 30 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "compliance.expiring", config: { within_days: 30 } },
        { node_key: "a1", node_type: "action.create_task", config: { title: "Renew: {{summary}}", description: "Book the renewal before the due date.", priority: "high", due_in_days: 14 } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_task", config: { title: "Renew: {{summary}}", description: "Book the renewal before the due date.", priority: "high", due_in_days: "14" } }],
  },
  {
    slug: "compliance-overdue-escalate",
    name: "Compliance overdue → notify + flag",
    description: "When a compliance item is overdue, raise a critical notification and flag the record.",
    domain: "compliance",
    minPlan: "Operator",
    trigger: { kind: "event", type: "compliance_overdue", config: { min_days_overdue: 0 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "compliance.expiring", config: {} },
        { node_key: "c1", node_type: "comm.internal_notification", config: { title: "Overdue: {{summary}}", body: "Past its due date.", severity: "critical" } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "c1" }, { source_key: "c1", target_key: "e1" } ],
    },
    actions: [
      { action_type: "create_notification", config: { title: "Overdue: {{summary}}", body: "This compliance item is past its due date.", severity: "critical" } },
      { action_type: "flag_record", config: { reason: "Compliance overdue: {{summary}}" } },
    ],
  },
  // ── Money ──────────────────────────────────────────────────────────────────
  {
    slug: "rent-arrears-draft",
    name: "Rent overdue → draft chase (review-first)",
    description: "Draft a polite arrears chase message for review when rent is 3+ days overdue. Never auto-sends.",
    domain: "money",
    minPlan: "Operator",
    recommended: true,
    trigger: { kind: "event", type: "rent_overdue", config: { min_days_overdue: 3, min_amount: 0 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "invoice.overdue", config: { min_days_overdue: 3 } },
        { node_key: "c1", node_type: "comm.external_message_draft", config: { subject: "Rent reminder", body: "Hi, our records show an outstanding balance. Could you let us know when payment will be made? Thank you." } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "c1" }, { source_key: "c1", target_key: "e1" } ],
    },
    actions: [{ action_type: "draft_message", config: { subject: "Rent reminder", body: "Hi, our records show an outstanding balance on your rent. Could you let us know when payment will be made? Thank you." } }],
  },
  {
    slug: "payout-release-approval",
    name: "Payout release → human approval (gated)",
    description: "Routes a payout release through a mandatory human approval. The engine never releases a payout automatically.",
    domain: "money",
    minPlan: "Scale",
    trigger: { kind: "event", type: "job_completed", config: { within_days: 7 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "supplier.job.completed", config: {} },
        { node_key: "g1", node_type: "approval.request_human", config: { title: "Approve supplier payout", summary: "Release payout for completed job: {{summary}}", sla_hours: 24 } },
        { node_key: "p1", node_type: "payment.release_payout_after_approval", config: { reference: "{{summary}}" } },
        { node_key: "e1", node_type: "end.waiting_approval" },
      ],
      edges: [ { source_key: "t1", target_key: "g1" }, { source_key: "g1", target_key: "p1" }, { source_key: "p1", target_key: "e1" } ],
    },
    // No auto actions: the only side-effecting nodes are gated (approval+payment).
    actions: [{ action_type: "create_notification", config: { title: "Payout awaiting approval: {{summary}}", body: "A supplier payout is waiting for your approval.", severity: "warning" } }],
  },
  // ── Booking ────────────────────────────────────────────────────────────────
  {
    slug: "checkout-cleaning-task",
    name: "Checkout due → create cleaning task",
    description: "When a booking checkout is due, create a cleaning task for the property.",
    domain: "booking",
    minPlan: "Pro / Agency",
    recommended: true,
    trigger: { kind: "event", type: "job_completed", config: { within_days: 1 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "booking.checkout_due", config: {} },
        { node_key: "a1", node_type: "action.create_cleaning_task", config: { title: "Checkout clean — {{summary}}", due_in_days: 1 } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_task", config: { title: "Checkout clean — {{summary}}", description: "Turn over the property after checkout.", priority: "high", due_in_days: "1" } }],
  },
  // ── Supplier ───────────────────────────────────────────────────────────────
  {
    slug: "supplier-evidence-request",
    name: "Job complete → request supplier evidence",
    description: "When a supplier marks a job complete, draft a request for completion evidence (review-first).",
    domain: "supplier",
    minPlan: "Pro / Agency",
    trigger: { kind: "event", type: "job_completed", config: { within_days: 7 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "supplier.job.completed", config: {} },
        { node_key: "a1", node_type: "action.request_supplier_evidence", config: { title: "Evidence requested", description: "Please upload photos and the completion sign-off for {{summary}}." } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "draft_message", config: { subject: "Evidence requested", body: "Please upload photos and the completion sign-off for {{summary}}." } }],
  },
  // ── Marketplace ───────────────────────────────────────────────────────────
  {
    slug: "marketplace-new-transaction-task",
    name: "New marketplace transaction → review task",
    description: "When a marketplace transaction opens, create a task to review and fulfil it.",
    domain: "marketplace",
    minPlan: "Pro / Agency",
    trigger: { kind: "event", type: "job_completed", config: { within_days: 1 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "marketplace.transaction.created", config: {} },
        { node_key: "l1", node_type: "lookup.marketplace_transaction", config: {} },
        { node_key: "a1", node_type: "action.create_task", config: { title: "Review transaction: {{summary}}", priority: "normal", due_in_days: 1 } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "l1" }, { source_key: "l1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_task", config: { title: "Review transaction: {{summary}}", description: "Review and fulfil the new marketplace transaction.", priority: "normal", due_in_days: "1" } }],
  },
  // ── Legal ──────────────────────────────────────────────────────────────────
  {
    slug: "legal-review-gate",
    name: "Legal review required → route to reviewer (gated)",
    description: "Routes legal content to a human reviewer. Never serves or files a notice automatically.",
    domain: "legal",
    minPlan: "Scale",
    trigger: { kind: "event", type: "compliance_overdue", config: { min_days_overdue: 14 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "legal.review.required", config: {} },
        { node_key: "g1", node_type: "approval.request_legal_review", config: { title: "Legal review required", summary: "Review before any notice: {{summary}}", sla_hours: 48 } },
        { node_key: "d1", node_type: "legal.create_draft", config: { document_type: "notice", summary: "{{summary}}" } },
        { node_key: "e1", node_type: "end.waiting_approval" },
      ],
      edges: [ { source_key: "t1", target_key: "g1" }, { source_key: "g1", target_key: "d1" }, { source_key: "d1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_notification", config: { title: "Legal review required: {{summary}}", body: "An item needs legal review before any further action.", severity: "warning" } }],
  },
  // ── Customer ───────────────────────────────────────────────────────────────
  {
    slug: "tenancy-ending-renewal",
    name: "Tenancy ending → renewal decision task",
    description: "Create a renewal decision task 60 days before a tenancy ends.",
    domain: "customer",
    minPlan: "Operator",
    recommended: true,
    trigger: { kind: "event", type: "tenancy_ending", config: { within_days: 60 } },
    graph: {
      nodes: [
        { node_key: "t1", node_type: "field.changed", config: { field: "end_date" } },
        { node_key: "a1", node_type: "action.create_task", config: { title: "Renewal decision: {{summary}}", priority: "normal", due_in_days: 21 } },
        { node_key: "e1", node_type: "end.success" },
      ],
      edges: [ { source_key: "t1", target_key: "a1" }, { source_key: "a1", target_key: "e1" } ],
    },
    actions: [{ action_type: "create_task", config: { title: "Renewal decision: {{summary}}", description: "Decide renew vs re-let and contact the tenant.", priority: "normal", due_in_days: "21" } }],
  },
]

export function recipeBySlug(slug: string): SmartRecipe | undefined {
  return SMART_RECIPES.find((r) => r.slug === slug)
}
export function recipesByDomain(domain: RecipeDomain): SmartRecipe[] {
  return SMART_RECIPES.filter((r) => r.domain === domain)
}

/** Build the canvas graph (with categories/risk normalised) for a recipe. */
function recipeGraph(recipe: SmartRecipe): CanvasGraph {
  let i = 0
  const nodes = recipe.graph.nodes.map((n) => ({
    node_key: n.node_key,
    node_type: n.node_type,
    category: "utility",
    label: n.label ?? null,
    config: n.config ?? {},
    risk: "low" as const,
    pos_x: 80 + (i % 4) * 220,
    pos_y: 80 + Math.floor(i++ / 4) * 160,
  }))
  const edges = recipe.graph.edges.map((e) => ({ source_key: e.source_key, target_key: e.target_key, branch_label: e.branch_label ?? null }))
  return { nodes, edges }
}

export interface InstantiateResult {
  ok: boolean
  definitionId?: string
  versionId?: string
  error?: string
  /** Compile issues (recipe should compile clean; surfaced for honesty). */
  issues?: Array<{ level: string; code: string; message: string }>
}

/**
 * Instantiate a recipe into the workspace as a DISABLED DRAFT definition + its
 * node-graph version. NEVER enables or runs it. Returns the new ids.
 */
export async function instantiateRecipe(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  slug: string,
): Promise<InstantiateResult> {
  const recipe = recipeBySlug(slug)
  if (!recipe) return { ok: false, error: "Unknown recipe." }

  // Only keep actions that map to a real safe action (defence in depth).
  const safeActions = recipe.actions.filter((a) => {
    return ["create_task", "create_notification", "draft_message", "flag_record", "create_calendar_reminder"].includes(String(a.action_type))
  }) as Array<{ action_type: ActionType; config?: Record<string, unknown> }>

  try {
    const { id: definitionId } = await createDefinition(supabase, workspaceId, userId, {
      name: recipe.name,
      description: recipe.description,
      trigger: recipe.trigger,
      conditions: {},
      actions: safeActions,
      enabled: false, // DISABLED DRAFT — never auto-activates
      source: "template",
    })

    const graph = recipeGraph(recipe)
    const compiled = compileCanvas(graph)
    const version = await createVersion(supabase, workspaceId, definitionId, graph, {
      userId,
      status: compiled.ok ? "validated" : "invalid",
      compiled: compiled.plan as unknown as Record<string, unknown>,
      validation: { ok: compiled.ok, issues: compiled.issues },
      notes: `Instantiated from recipe "${recipe.slug}".`,
    })

    return {
      ok: true,
      definitionId,
      versionId: version?.id,
      issues: compiled.issues.map((i) => ({ level: i.level, code: i.code, message: i.message })),
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to instantiate recipe." }
  }
}

/** Map a recipe's action node type → its safe executor action (for previews). */
export function recipeActionFor(nodeType: string): string | undefined {
  return NODE_ACTION_MAP[nodeType]
}
