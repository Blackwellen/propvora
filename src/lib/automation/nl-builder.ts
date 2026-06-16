// Automation Engine — NATURAL-LANGUAGE BUILDER.
//
// Prompt → constrained node-graph DRAFT, via the existing AI gateway. The AI is
// hard-constrained to the node catalogue: it may ONLY emit known node types and
// the trigger/action vocabulary the engine can evaluate + run. The output is a
// DRAFT graph the user must review and confirm — it is NEVER saved, enabled, or
// run by this module. Destructive/legal/payment nodes can appear in a draft, but
// they compile to GATED steps (approvals), never auto-runnable actions.
//
// SAFETY CONTRACT:
//   * The AI cannot invent node types or actions — anything off-catalogue is
//     dropped during validation.
//   * The draft is returned with review_required = true and enabled = false.
//   * Compilation runs the same validator the canvas uses, so a returned draft
//     is honest about whether it would even publish.

import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveModelChain, gatewayComplete, recordUsageEvent } from "@/lib/ai/gateway"
import { SAFETY_CLAUSES, fenceUntrusted } from "@/lib/ai/safety"
import {
  AUTOMATION_NODE_REGISTRY,
  nodeDef,
  nodeCategory,
  nodeConfigSchema,
} from "./node-registry"
import { compileCanvas, type CompileResult } from "./canvas-compile"
import type { CanvasGraph } from "./canvas-model"

export interface NlBuildResult {
  ok: boolean
  /** The proposed draft graph (review-required, never saved). */
  graph: CanvasGraph | null
  /** Compile/validation of the draft (honest about publishability). */
  compile: CompileResult | null
  /** A short human title + summary for the draft. */
  name: string
  description: string
  /** Honesty notes (dropped nodes, missing config defaults applied, etc). */
  notes: string[]
  error?: string
  meta?: { provider: string; model: string; tokensIn: number; tokensOut: number }
}

/** Compact node catalogue for the prompt (type + category + config keys). */
function catalogueForPrompt() {
  return AUTOMATION_NODE_REGISTRY.map((n) => ({
    type: n.type,
    category: nodeCategory(n.type),
    label: n.label,
    risk: n.risk,
    requiresApproval: Boolean(n.requiresApproval),
    blockedFromAutoRun: Boolean(n.blockedFromAutoRun),
    config: nodeConfigSchema(n.type).map((f) => ({ key: f.key, kind: f.kind })),
  }))
}

function systemPrompt(): string {
  return `You are Propvora's automation graph drafting assistant. You translate a property operator's plain-English request into a DRAFT automation node graph built ONLY from the node catalogue below.

You do NOT create, save, enable, or run anything. You ONLY propose a draft the human will review and confirm. Never claim you activated an automation.

RULES:
- Use ONLY node "type" strings from the catalogue. Never invent node types.
- The graph MUST contain exactly one trigger node (category "trigger") and end with an "end" node.
- Connect nodes with edges so the trigger reaches the end. No orphan nodes.
- For high-risk work (payment/legal), you MUST route through an approval node — never connect a trigger straight to a payment/legal node. These never auto-run; they require human approval.
- Use config keys only from each node's "config" list.

CATALOGUE:
${JSON.stringify(catalogueForPrompt())}

Respond with ONLY a single JSON object (no markdown) of this exact shape:
{
  "name": string,
  "description": string,
  "nodes": [ { "node_key": string, "node_type": string, "config": { } } ],
  "edges": [ { "source_key": string, "target_key": string, "branch_label": string|null } ]
}`
}

/** Extract the first JSON object from a model response (tolerant of fences). */
function parseJson(text: string): Record<string, unknown> | null {
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf("{")
  const end = body.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Validate + normalise the AI's raw graph against the catalogue. Drops unknown
 * node types and config keys; lays nodes out; never trusts the AI for risk.
 */
function normaliseGraph(raw: Record<string, unknown>): { graph: CanvasGraph; notes: string[] } {
  const notes: string[] = []
  const rawNodes = Array.isArray(raw.nodes) ? (raw.nodes as Array<Record<string, unknown>>) : []
  const rawEdges = Array.isArray(raw.edges) ? (raw.edges as Array<Record<string, unknown>>) : []

  const seenKeys = new Set<string>()
  const nodes = rawNodes
    .map((n, i) => {
      const type = String(n.node_type ?? "")
      const def = nodeDef(type)
      if (!def) {
        notes.push(`Dropped unknown node "${type}".`)
        return null
      }
      let key = String(n.node_key ?? `n${i}`)
      if (seenKeys.has(key)) key = `${key}_${i}`
      seenKeys.add(key)
      // Keep only catalogue config keys.
      const allowed = new Set(nodeConfigSchema(type).map((f) => f.key))
      const cfgIn = (n.config && typeof n.config === "object" ? n.config : {}) as Record<string, unknown>
      const config: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(cfgIn)) if (allowed.has(k)) config[k] = v
      return {
        node_key: key,
        node_type: type,
        category: nodeCategory(type) ?? "utility",
        label: def.label,
        config,
        risk: def.risk,
        pos_x: 80 + (i % 4) * 220,
        pos_y: 80 + Math.floor(i / 4) * 160,
      }
    })
    .filter((n): n is NonNullable<typeof n> => n !== null)

  const validKeys = new Set(nodes.map((n) => n.node_key))
  const edges = rawEdges
    .map((e) => ({
      source_key: String(e.source_key ?? ""),
      target_key: String(e.target_key ?? ""),
      branch_label: e.branch_label != null ? String(e.branch_label) : null,
    }))
    .filter((e) => validKeys.has(e.source_key) && validKeys.has(e.target_key))

  return { graph: { nodes, edges }, notes }
}

/**
 * Build a constrained draft graph from a prompt. Never saves or runs anything.
 * Workspace-scoped only for AI usage metering.
 */
export async function buildFromPrompt(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  prompt: string,
): Promise<NlBuildResult> {
  const base: NlBuildResult = { ok: false, graph: null, compile: null, name: "", description: "", notes: [] }
  try {
    const chain = await resolveModelChain(supabase)
    const res = await gatewayComplete(chain, {
      messages: [
        { role: "system", content: `${systemPrompt()}\n\n${SAFETY_CLAUSES}` },
        { role: "user", content: fenceUntrusted("operator request", prompt.slice(0, 2000)) },
      ],
      maxTokens: 900,
      temperature: 0.3,
    })

    // Best-effort usage metering (never blocks the draft).
    try {
      await recordUsageEvent(supabase, {
        workspaceId,
        userId,
        route: "automation_nl_builder",
        usage: {
          provider: res.provider,
          model: res.model,
          tokensIn: res.tokensIn,
          tokensOut: res.tokensOut,
          costPence: res.costPence,
        },
      })
    } catch { /* metering is best-effort */ }

    const parsed = parseJson(res.text)
    if (!parsed) return { ...base, error: "The assistant didn't return a usable draft. Try rephrasing." }

    const { graph, notes } = normaliseGraph(parsed)
    if (graph.nodes.length === 0) return { ...base, notes, error: "No usable nodes were produced from that request." }

    const compile = compileCanvas(graph)
    return {
      ok: true,
      graph,
      compile,
      name: String(parsed.name ?? "Drafted automation").slice(0, 120),
      description: String(parsed.description ?? "").slice(0, 400),
      notes: [
        ...notes,
        "Draft only — nothing was saved, enabled, or run. Review and confirm to create a disabled draft.",
      ],
      meta: { provider: res.provider, model: res.model, tokensIn: res.tokensIn, tokensOut: res.tokensOut },
    }
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "AI draft failed." }
  }
}
