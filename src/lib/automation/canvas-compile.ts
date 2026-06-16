// Automation Engine — the CANVAS COMPILER.
//
// Turns a node/edge graph (canvas-model) into:
//   1. A VALIDATION result (errors block publish; warnings inform).
//   2. A compiled RUN PLAN the existing executor can drain — i.e. an ordered
//      list of executor actions (the SAFE catalogue actions) plus the GATED
//      steps (payment/legal/approval) the executor must route to an approval
//      instead of auto-running.
//
// This is PURE (no I/O). It composes the node registry + the existing action
// catalogue. It NEVER produces a destructive action: a node either compiles to a
// safe catalogue action, is graph-control (no side-effect), or is gated (emits a
// `requiresApproval` plan step the executor turns into an approval object).
//
// Validation rules enforced (the depth mandate):
//   * Every node_type must exist in the registry.
//   * Required config fields must be present.
//   * Exactly one trigger node and at least one end (or terminal action) node.
//   * No orphan nodes on the critical path (every non-trigger node must be
//     reachable from a trigger; the graph must reach an end/action).
//   * No unbounded loops (a cycle without an error/delay bound is rejected).
//   * Forbidden nodes: blockedFromAutoRun nodes cannot be on an auto path.
//   * Plan-banned / role-banned node types are blocked (caller supplies the ban
//     sets resolved from plan limits + admin kill-switches).

import {
  nodeDef,
  nodeCategory,
  nodeConfigSchema,
  NODE_ACTION_MAP,
  GATED_CATEGORIES,
  type AutomationNodeCategory,
} from "./node-registry"
import type { CanvasGraph, CanvasNode } from "./canvas-model"
import type { ActionType } from "./types"

export interface CompileContext {
  /** Node types this plan/tier may not use (resolved from plan limits). */
  planBannedTypes?: Set<string>
  /** Node types an admin kill-switch has disabled globally. */
  adminBannedTypes?: Set<string>
  /** Node types the caller's role may not use. */
  roleBannedTypes?: Set<string>
  /** Max nodes allowed for this plan (0 = unknown/skip). */
  maxNodes?: number
}

export interface CompiledPlanStep {
  node_key: string
  node_type: string
  category: AutomationNodeCategory
  /** The safe executor action this step runs, if it is an action step. */
  action_type?: ActionType
  /** Resolved action config (passed straight to the executor's payload builder). */
  config: Record<string, unknown>
  /** True when this step must be gated behind a human approval (never auto-run). */
  requiresApproval: boolean
  /** True when this step is hard-blocked from any automated execution. */
  blocked: boolean
  risk: string
}

export interface CompiledPlan {
  /** The single trigger node (compiler guarantees exactly one when ok=true). */
  trigger: { node_key: string; node_type: string; config: Record<string, unknown> } | null
  /** Ordered, topologically-sorted execution steps (action/communication/ai/
   *  payment/legal/approval) — graph-control nodes are resolved out. */
  steps: CompiledPlanStep[]
  /** True if any step requires approval (the run will pause for a human). */
  hasApprovalGate: boolean
}

export interface ValidationIssue {
  level: "error" | "warning"
  code: string
  node_key?: string
  message: string
}

export interface CompileResult {
  ok: boolean
  issues: ValidationIssue[]
  plan: CompiledPlan
}

const TRIGGER_CATEGORY: AutomationNodeCategory = "trigger"
const END_CATEGORY: AutomationNodeCategory = "end"

/** Build adjacency maps from edges. */
function buildAdjacency(graph: CanvasGraph) {
  const out = new Map<string, string[]>()
  const indeg = new Map<string, number>()
  for (const n of graph.nodes) {
    out.set(n.node_key, [])
    indeg.set(n.node_key, 0)
  }
  for (const e of graph.edges) {
    if (!out.has(e.source_key) || !indeg.has(e.target_key)) continue
    out.get(e.source_key)!.push(e.target_key)
    indeg.set(e.target_key, (indeg.get(e.target_key) ?? 0) + 1)
  }
  return { out, indeg }
}

/** Detect a cycle reachable from `start` using DFS colouring. */
function findCycle(start: string, out: Map<string, string[]>): string[] | null {
  const WHITE = 0, GREY = 1, BLACK = 2
  const colour = new Map<string, number>()
  const stack: string[] = []
  let cycle: string[] | null = null

  function dfs(u: string): boolean {
    colour.set(u, GREY)
    stack.push(u)
    for (const v of out.get(u) ?? []) {
      const c = colour.get(v) ?? WHITE
      if (c === GREY) {
        const i = stack.indexOf(v)
        cycle = stack.slice(i >= 0 ? i : 0).concat(v)
        return true
      }
      if (c === WHITE && dfs(v)) return true
    }
    colour.set(u, BLACK)
    stack.pop()
    return false
  }
  dfs(start)
  return cycle
}

/**
 * Compile + validate a canvas graph. Pure. Returns ok=false with issues when the
 * graph cannot be published; ok=true yields a run plan the executor can drain.
 */
export function compileCanvas(graph: CanvasGraph, ctx: CompileContext = {}): CompileResult {
  const issues: ValidationIssue[] = []
  const nodes = graph.nodes ?? []
  const planBanned = ctx.planBannedTypes ?? new Set<string>()
  const adminBanned = ctx.adminBannedTypes ?? new Set<string>()
  const roleBanned = ctx.roleBannedTypes ?? new Set<string>()

  const emptyPlan: CompiledPlan = { trigger: null, steps: [], hasApprovalGate: false }

  if (nodes.length === 0) {
    issues.push({ level: "error", code: "empty_graph", message: "Add at least a trigger and one action." })
    return { ok: false, issues, plan: emptyPlan }
  }
  if (ctx.maxNodes && ctx.maxNodes > 0 && nodes.length > ctx.maxNodes) {
    issues.push({ level: "error", code: "too_many_nodes", message: `This plan allows at most ${ctx.maxNodes} nodes (graph has ${nodes.length}).` })
  }

  // 1. Every node type must exist + not be banned. Validate required config.
  for (const n of nodes) {
    const def = nodeDef(n.node_type)
    if (!def) {
      issues.push({ level: "error", code: "unknown_node", node_key: n.node_key, message: `Unknown node type "${n.node_type}".` })
      continue
    }
    if (adminBanned.has(n.node_type)) {
      issues.push({ level: "error", code: "node_killed", node_key: n.node_key, message: `"${def.label}" is disabled by an admin kill-switch.` })
    }
    if (planBanned.has(n.node_type)) {
      issues.push({ level: "error", code: "node_plan_banned", node_key: n.node_key, message: `"${def.label}" isn't available on your plan.` })
    }
    if (roleBanned.has(n.node_type)) {
      issues.push({ level: "error", code: "node_role_banned", node_key: n.node_key, message: `Your role can't use "${def.label}".` })
    }
    for (const f of nodeConfigSchema(n.node_type)) {
      if (f.required) {
        const v = n.config?.[f.key]
        if (v == null || String(v).trim() === "") {
          issues.push({ level: "error", code: "missing_config", node_key: n.node_key, message: `"${def.label}" needs "${f.label}".` })
        }
      }
    }
  }

  // 2. Exactly one trigger.
  const triggers = nodes.filter((n) => nodeCategory(n.node_type) === TRIGGER_CATEGORY)
  if (triggers.length === 0) {
    issues.push({ level: "error", code: "no_trigger", message: "A trigger node is required to start the automation." })
  } else if (triggers.length > 1) {
    issues.push({ level: "error", code: "multiple_triggers", message: "Only one trigger node is allowed per automation." })
  }

  // 3. At least one end OR terminal action node.
  const ends = nodes.filter((n) => nodeCategory(n.node_type) === END_CATEGORY)
  const actionish = nodes.filter((n) => {
    const c = nodeCategory(n.node_type)
    return c === "action" || c === "communication" || c === "payment" || c === "legal"
  })
  if (ends.length === 0 && actionish.length === 0) {
    issues.push({ level: "error", code: "no_terminal", message: "Add an action or an End node so the run has an outcome." })
  }

  const { out, indeg } = buildAdjacency(graph)
  const trigger = triggers[0]

  // 4. Reachability + orphans (only meaningful with a single trigger).
  if (trigger) {
    const reachable = new Set<string>()
    const queue = [trigger.node_key]
    while (queue.length) {
      const u = queue.shift()!
      if (reachable.has(u)) continue
      reachable.add(u)
      for (const v of out.get(u) ?? []) queue.push(v)
    }
    for (const n of nodes) {
      if (n.node_key === trigger.node_key) continue
      if (!reachable.has(n.node_key)) {
        // An unreachable action/payment/legal node is a critical-path orphan.
        const c = nodeCategory(n.node_type)
        const critical = c === "action" || c === "communication" || c === "payment" || c === "legal" || c === "end"
        issues.push({
          level: critical ? "error" : "warning",
          code: "orphan_node",
          node_key: n.node_key,
          message: `"${nodeDef(n.node_type)?.label ?? n.node_type}" isn't connected to the trigger path.`,
        })
      }
    }

    // 5. No unbounded loops. A cycle is only allowed when it contains a bounding
    // node (error.retry_with_backoff / delay.*). Otherwise it's unbounded.
    const cycle = findCycle(trigger.node_key, out)
    if (cycle) {
      const bounded = cycle.some((k) => {
        const t = nodes.find((n) => n.node_key === k)?.node_type ?? ""
        return t.startsWith("error.") || t.startsWith("delay.")
      })
      if (!bounded) {
        issues.push({ level: "error", code: "unbounded_loop", message: "This automation contains a loop with no delay or retry bound." })
      } else {
        issues.push({ level: "warning", code: "bounded_loop", message: "Loop detected — bounded by a delay/retry node." })
      }
    }
  }

  // 6. Forbidden auto nodes: blockedFromAutoRun must be gated (we surface them as
  // requiresApproval + blocked steps; never auto-runnable).
  // (handled when building steps below)

  const ok = !issues.some((i) => i.level === "error")

  // Build the compiled plan only when valid. We linearise the side-effecting
  // nodes in topological order from the trigger; graph-control nodes (condition/
  // branch/delay/lookup/utility/error/end) are resolved out of the run plan
  // (the executor's evaluate/condition handling already lives in the engine).
  let plan: CompiledPlan = emptyPlan
  if (ok && trigger) {
    const order = topoOrder(graph, out, indeg, trigger.node_key)
    const steps: CompiledPlanStep[] = []
    for (const key of order) {
      const n = nodes.find((x) => x.node_key === key)
      if (!n) continue
      const c = nodeCategory(n.node_type)
      if (!c || c === "trigger" || c === "end") continue
      // Only side-effecting / gated categories become run-plan steps.
      const isSideEffecting = ["action", "communication", "ai", "payment", "legal", "approval", "integration"].includes(c)
      if (!isSideEffecting) continue
      steps.push(toPlanStep(n, c))
    }
    plan = {
      trigger: { node_key: trigger.node_key, node_type: trigger.node_type, config: trigger.config ?? {} },
      steps,
      hasApprovalGate: steps.some((s) => s.requiresApproval || s.blocked),
    }
  }

  return { ok, issues, plan }
}

/** Kahn's topological sort, falling back to BFS order on a (bounded) cycle. */
function topoOrder(
  graph: CanvasGraph,
  out: Map<string, string[]>,
  indeg: Map<string, number>,
  start: string,
): string[] {
  const local = new Map(indeg)
  const q: string[] = []
  for (const [k, d] of local) if (d === 0) q.push(k)
  if (!q.includes(start)) q.unshift(start)
  const ordered: string[] = []
  const seen = new Set<string>()
  while (q.length) {
    const u = q.shift()!
    if (seen.has(u)) continue
    seen.add(u)
    ordered.push(u)
    for (const v of out.get(u) ?? []) {
      local.set(v, (local.get(v) ?? 1) - 1)
      if ((local.get(v) ?? 0) <= 0 && !seen.has(v)) q.push(v)
    }
  }
  // Append any nodes a cycle left out, in reachable BFS order from start.
  for (const n of graph.nodes) if (!seen.has(n.node_key)) ordered.push(n.node_key)
  return ordered
}

/** Map a node into a compiled run-plan step. */
function toPlanStep(n: CanvasNode, category: AutomationNodeCategory): CompiledPlanStep {
  const def = nodeDef(n.node_type)
  const actionType = NODE_ACTION_MAP[n.node_type] as ActionType | undefined
  const gated = GATED_CATEGORIES.includes(category) || category === "approval"
  const requiresApproval = Boolean(def?.requiresApproval) || gated
  const blocked = Boolean(def?.blockedFromAutoRun)
  return {
    node_key: n.node_key,
    node_type: n.node_type,
    category,
    action_type: actionType,
    config: n.config ?? {},
    requiresApproval,
    blocked,
    risk: def?.risk ?? "low",
  }
}

/**
 * Compile a graph straight into the v2 definition `actions[]` shape the existing
 * executor drains. Only SAFE action steps that can auto-run (not gated, not
 * blocked, and mapping to a catalogue action) are emitted as auto actions.
 * Gated/blocked steps are returned separately so the caller can record them as
 * approvals rather than auto-running them.
 */
export function planToDefinitionActions(plan: CompiledPlan): {
  actions: Array<{ action_type: ActionType; config: Record<string, unknown> }>
  gated: CompiledPlanStep[]
} {
  const actions: Array<{ action_type: ActionType; config: Record<string, unknown> }> = []
  const gated: CompiledPlanStep[] = []
  for (const s of plan.steps) {
    if (s.requiresApproval || s.blocked || !s.action_type) {
      gated.push(s)
      continue
    }
    actions.push({ action_type: s.action_type, config: s.config })
  }
  return { actions, gated }
}
