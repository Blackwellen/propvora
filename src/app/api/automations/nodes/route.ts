import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation, gateCanvasLite, getWorkspaceTier } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"
import {
  AUTOMATION_NODE_REGISTRY,
  nodeConfigSchema,
  nodeCategory,
} from "@/lib/automation/node-registry"
import { compileCanvas } from "@/lib/automation/canvas-compile"
import {
  createVersion,
  publishVersion,
  getVersion,
  listVersions,
  type CanvasGraph,
} from "@/lib/automation/canvas-model"
import { getPlanLimits } from "@/lib/automation/limits"

// Node registry + canvas graph save/compile/publish API.
// GET  → the node registry (with config schemas) for the node library.
// POST → save a graph as a new version, compile + validate it, optionally
//        publish it active. Canvas-gated. NEVER runs anything.
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined
    const definitionId = url.searchParams.get("definitionId") ?? undefined
    const versionId = url.searchParams.get("versionId") ?? undefined

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth

    // The node registry is reference data — always available to authed members.
    const registry = AUTOMATION_NODE_REGISTRY.map((n) => ({
      type: n.type,
      label: n.label,
      group: n.group,
      category: nodeCategory(n.type),
      scope: n.scope,
      risk: n.risk,
      plan: n.plan,
      requiresApproval: Boolean(n.requiresApproval),
      blockedFromAutoRun: Boolean(n.blockedFromAutoRun),
      description: n.description,
      config: nodeConfigSchema(n.type),
    }))

    let version = null
    let versions: unknown[] = []
    if (ctx.workspaceId && (versionId || definitionId)) {
      if (versionId) version = await getVersion(ctx.supabase, ctx.workspaceId, versionId)
      if (definitionId) versions = await listVersions(ctx.supabase, ctx.workspaceId, definitionId)
    }

    return NextResponse.json({ ok: true, registry, version, versions }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/nodes:GET", requestId })
    return NextResponse.json({ error: "Couldn't load nodes.", requestId }, { status: 500 })
  }
}

const nodeSchema = z.object({
  node_key: z.string().min(1),
  node_type: z.string().min(1),
  label: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  pos_x: z.number().optional(),
  pos_y: z.number().optional(),
})
const edgeSchema = z.object({
  source_key: z.string().min(1),
  target_key: z.string().min(1),
  branch_label: z.string().nullable().optional(),
})
const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  definitionId: z.string().min(1),
  nodes: z.array(nodeSchema).max(500),
  edges: z.array(edgeSchema).max(1000),
  publish: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A valid graph is required." }, { status: 400 })
    const { workspaceId, definitionId, nodes, edges, publish } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    // Canvas builder is a higher entitlement than base automation.
    const baseGate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!baseGate.allowed) return NextResponse.json({ error: baseGate.reason, upgrade: true, tier: baseGate.tier }, { status: baseGate.status ?? 402 })
    const canvasGate = await gateCanvasLite(ctx.supabase, ctx.workspaceId)
    if (!canvasGate.allowed) return NextResponse.json({ error: canvasGate.reason, upgrade: true, tier: canvasGate.tier }, { status: canvasGate.status ?? 402 })

    const tier = await getWorkspaceTier(ctx.supabase, ctx.workspaceId)
    const limits = await getPlanLimits(ctx.supabase, tier)

    // Resolve admin kill-switched node types (registry rows with enabled=false).
    const adminBannedTypes = new Set<string>()
    try {
      const { data: killed } = await ctx.supabase.from("automation_node_registry").select("node_type").eq("enabled", false)
      for (const r of (killed as Array<{ node_type: string }>) ?? []) adminBannedTypes.add(r.node_type)
    } catch { /* tolerant — no kill-switches resolves to none */ }

    const graph: CanvasGraph = {
      nodes: nodes.map((n) => ({
        node_key: n.node_key,
        node_type: n.node_type,
        category: nodeCategory(n.node_type) ?? "utility",
        label: n.label ?? null,
        config: n.config ?? {},
        risk: "low",
        pos_x: n.pos_x ?? 0,
        pos_y: n.pos_y ?? 0,
      })),
      edges: edges.map((e) => ({ source_key: e.source_key, target_key: e.target_key, branch_label: e.branch_label ?? null })),
    }

    // Compile + validate against the plan (node budget = a hard plan limit) and
    // the admin kill-switches (a banned node type fails the compile).
    const compile = compileCanvas(graph, { maxNodes: limits.maxNodes, adminBannedTypes })

    const version = await createVersion(ctx.supabase, ctx.workspaceId, definitionId, graph, {
      userId: ctx.userId,
      status: compile.ok ? "validated" : "invalid",
      compiled: compile.plan as unknown as Record<string, unknown>,
      validation: { ok: compile.ok, issues: compile.issues },
    })
    if (!version) return NextResponse.json({ error: "Couldn't save the graph." }, { status: 500 })

    // Publish only when valid and requested.
    if (publish && compile.ok) {
      await publishVersion(ctx.supabase, ctx.workspaceId, definitionId, version.id, compile.plan as unknown as Record<string, unknown>, { ok: true, issues: compile.issues })
    } else if (publish && !compile.ok) {
      return NextResponse.json({ ok: false, versionId: version.id, version: version.version, compile, error: "Fix the validation errors before publishing." }, { status: 422 })
    }

    return NextResponse.json({ ok: true, versionId: version.id, version: version.version, published: Boolean(publish && compile.ok), compile }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/nodes:POST", requestId })
    return NextResponse.json({ error: "Couldn't save the graph.", requestId }, { status: 500 })
  }
}
