import { describe, it, expect } from "vitest"
import {
  AUTOMATION_NODE_REGISTRY,
  NODE_ACTION_MAP,
  NODE_CONFIG_SCHEMAS,
  CATEGORY_VISUALS,
  AUTOMATION_NODE_CATEGORIES,
  nodeCategory,
  nodeVisual,
  nodeDef,
} from "@/lib/automation/node-registry"
import { compileCanvas } from "@/lib/automation/canvas-compile"
import { checkNodeBudget } from "@/lib/automation/limits"
import { SMART_RECIPES, recipesByDomain } from "@/lib/automation/recipes"
import type { CanvasGraph } from "@/lib/automation/canvas-model"

const SAFE_ACTIONS = new Set(["create_task", "create_notification", "draft_message", "flag_record", "create_calendar_reminder"])

// Build a CanvasGraph node from a node type with given key/config.
function n(node_key: string, node_type: string, config: Record<string, unknown> = {}) {
  return { node_key, node_type, category: nodeCategory(node_type) ?? "utility", label: null, config, risk: "low" as const, pos_x: 0, pos_y: 0 }
}
function e(source_key: string, target_key: string) {
  return { source_key, target_key, branch_label: null }
}

describe("node registry", () => {
  it("registers 50+ distinct node types (mandate)", () => {
    const types = new Set(AUTOMATION_NODE_REGISTRY.map((nd) => nd.type))
    expect(types.size).toBe(AUTOMATION_NODE_REGISTRY.length) // no duplicates
    expect(types.size).toBeGreaterThanOrEqual(50)
  })

  it("covers every node category", () => {
    const cats = new Set(AUTOMATION_NODE_REGISTRY.map((nd) => nodeCategory(nd.type)))
    for (const c of AUTOMATION_NODE_CATEGORIES) expect(cats.has(c)).toBe(true)
  })

  it("maps every NODE_ACTION_MAP entry to a real node and a safe action", () => {
    for (const [type, action] of Object.entries(NODE_ACTION_MAP)) {
      expect(nodeDef(type), `node ${type} must exist`).toBeTruthy()
      expect(SAFE_ACTIONS.has(action)).toBe(true)
    }
  })

  it("only attaches config schemas to real node types", () => {
    for (const type of Object.keys(NODE_CONFIG_SCHEMAS)) {
      expect(nodeDef(type), `config schema for unknown node ${type}`).toBeTruthy()
    }
  })

  it("gives every category a distinct shape/colour/icon visual", () => {
    for (const c of AUTOMATION_NODE_CATEGORIES) {
      const v = CATEGORY_VISUALS[c]
      expect(v).toBeTruthy()
      expect(v.shape).toBeTruthy()
      expect(v.icon).toBeTruthy()
    }
    // payment + legal are gated (lock accent)
    expect(CATEGORY_VISUALS.payment.gated).toBe(true)
    expect(CATEGORY_VISUALS.legal.gated).toBe(true)
    // resolver works for a concrete type
    expect(nodeVisual("record.created").shape).toBe("start")
  })

  it("marks payment + legal autoserve nodes as gated / blocked", () => {
    expect(nodeDef("payment.release_payout_after_approval")?.requiresApproval).toBe(true)
    expect(nodeDef("payment.release_payout_after_approval")?.blockedFromAutoRun).toBe(true)
    expect(nodeDef("legal.auto_serve_notice")?.blockedFromAutoRun).toBe(true)
  })
})

describe("canvas compiler", () => {
  it("compiles a valid trigger → action → end graph", () => {
    const g: CanvasGraph = {
      nodes: [n("t1", "record.created"), n("a1", "action.create_task", { title: "x" }), n("end", "end.success")],
      edges: [e("t1", "a1"), e("a1", "end")],
    }
    const r = compileCanvas(g)
    expect(r.ok).toBe(true)
    expect(r.issues.filter((i) => i.level === "error")).toHaveLength(0)
    expect(r.plan.trigger?.node_type).toBe("record.created")
    expect(r.plan.steps.some((s) => s.action_type === "create_task")).toBe(true)
  })

  it("rejects a graph with no trigger", () => {
    const g: CanvasGraph = { nodes: [n("a1", "action.create_task"), n("end", "end.success")], edges: [e("a1", "end")] }
    const r = compileCanvas(g)
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.code === "no_trigger")).toBe(true)
  })

  it("rejects more than one trigger", () => {
    const g: CanvasGraph = {
      nodes: [n("t1", "record.created"), n("t2", "field.changed", { field: "x" }), n("a1", "action.create_task"), n("end", "end.success")],
      edges: [e("t1", "a1"), e("t2", "a1"), e("a1", "end")],
    }
    expect(compileCanvas(g).issues.some((i) => i.code === "multiple_triggers")).toBe(true)
  })

  it("flags a missing required config field", () => {
    // field.changed requires `field`.
    const g: CanvasGraph = {
      nodes: [n("t1", "field.changed", {}), n("a1", "action.create_task"), n("end", "end.success")],
      edges: [e("t1", "a1"), e("a1", "end")],
    }
    const r = compileCanvas(g)
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.code === "missing_config")).toBe(true)
  })

  it("flags an orphan action not reachable from the trigger", () => {
    const g: CanvasGraph = {
      nodes: [n("t1", "record.created"), n("a1", "action.create_task"), n("orphan", "comm.internal_notification"), n("end", "end.success")],
      edges: [e("t1", "a1"), e("a1", "end")],
    }
    const r = compileCanvas(g)
    expect(r.issues.some((i) => i.code === "orphan_node")).toBe(true)
  })

  it("rejects an unbounded loop but allows a delay-bounded one", () => {
    const unbounded: CanvasGraph = {
      nodes: [n("t1", "record.created"), n("a1", "action.create_task"), n("a2", "action.add_note", { body: "x" }), n("end", "end.success")],
      edges: [e("t1", "a1"), e("a1", "a2"), e("a2", "a1"), e("a1", "end")],
    }
    expect(compileCanvas(unbounded).issues.some((i) => i.code === "unbounded_loop")).toBe(true)

    const bounded: CanvasGraph = {
      nodes: [n("t1", "record.created"), n("d1", "delay.fixed", { amount: 1, unit: "hours" }), n("a1", "action.create_task"), n("end", "end.success")],
      edges: [e("t1", "d1"), e("d1", "a1"), e("a1", "d1"), e("a1", "end")],
    }
    const r = compileCanvas(bounded)
    expect(r.issues.some((i) => i.code === "unbounded_loop")).toBe(false)
  })

  it("surfaces payment/legal steps as approval-gated, never auto-run", () => {
    const g: CanvasGraph = {
      nodes: [
        n("t1", "supplier.job.completed"),
        n("g1", "approval.request_human", { title: "Approve" }),
        n("p1", "payment.release_payout_after_approval"),
        n("end", "end.waiting_approval"),
      ],
      edges: [e("t1", "g1"), e("g1", "p1"), e("p1", "end")],
    }
    const r = compileCanvas(g)
    expect(r.plan.hasApprovalGate).toBe(true)
    const payStep = r.plan.steps.find((s) => s.node_type === "payment.release_payout_after_approval")
    expect(payStep?.requiresApproval).toBe(true)
    expect(payStep?.blocked).toBe(true)
  })

  it("enforces the plan node budget", () => {
    const g: CanvasGraph = {
      nodes: [n("t1", "record.created"), n("a1", "action.create_task"), n("end", "end.success")],
      edges: [e("t1", "a1"), e("a1", "end")],
    }
    expect(compileCanvas(g, { maxNodes: 2 }).issues.some((i) => i.code === "too_many_nodes")).toBe(true)
    expect(compileCanvas(g, { maxNodes: 10 }).issues.some((i) => i.code === "too_many_nodes")).toBe(false)
  })

  it("blocks an admin-killed node type", () => {
    const g: CanvasGraph = {
      nodes: [n("t1", "record.created"), n("a1", "action.create_task"), n("end", "end.success")],
      edges: [e("t1", "a1"), e("a1", "end")],
    }
    const r = compileCanvas(g, { adminBannedTypes: new Set(["action.create_task"]) })
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.code === "node_killed")).toBe(true)
  })
})

describe("plan limits", () => {
  const limits = { plan: "Scale", maxActive: 50, maxRunsMonth: 25000, maxNodes: 50, maxWebhooks: 10, retentionDays: 90, canvasAccess: "full" as const, aiAccess: "full" as const, nlAccess: "full" as const }

  it("allows a graph within the node budget", () => {
    expect(checkNodeBudget(limits, 10).allowed).toBe(true)
  })
  it("blocks a graph over the node budget", () => {
    const c = checkNodeBudget(limits, 60)
    expect(c.allowed).toBe(false)
    expect(c.limit).toBe(50)
  })
})

describe("recipes compile cleanly", () => {
  it("has many templates spanning the major sections", () => {
    expect(SMART_RECIPES.length).toBeGreaterThanOrEqual(30)
    const domains = new Set(SMART_RECIPES.map((r) => r.domain))
    for (const d of ["portfolio", "supplier", "money", "compliance", "booking", "sa", "hmo", "r2r", "admin"]) {
      expect(domains.has(d as never), `missing domain ${d}`).toBe(true)
    }
    expect(recipesByDomain("supplier").length).toBeGreaterThan(0)
  })

  it("every recipe graph uses real node types and compiles without errors", () => {
    for (const r of SMART_RECIPES) {
      const graph: CanvasGraph = {
        nodes: r.graph.nodes.map((nd) => n(nd.node_key, nd.node_type, nd.config ?? {})),
        edges: r.graph.edges.map((ed) => e(ed.source_key, ed.target_key)),
      }
      // Every node type must exist in the registry.
      for (const nd of r.graph.nodes) expect(nodeDef(nd.node_type), `recipe ${r.slug}: unknown node ${nd.node_type}`).toBeTruthy()
      const compiled = compileCanvas(graph)
      const errs = compiled.issues.filter((i) => i.level === "error")
      expect(errs, `recipe ${r.slug} should compile clean: ${errs.map((x) => x.message).join("; ")}`).toHaveLength(0)
    }
  })

  it("every recipe v2 action maps to a safe catalogue action", () => {
    for (const r of SMART_RECIPES) {
      for (const a of r.actions) expect(SAFE_ACTIONS.has(String(a.action_type)), `recipe ${r.slug}: unsafe action ${a.action_type}`).toBe(true)
    }
  })
})
