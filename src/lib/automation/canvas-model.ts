// Automation Engine — the NODE/EDGE canvas model data layer.
//
// A definition (automation_definitions) gains a versioned NODE GRAPH:
//   automation_versions  — one immutable compiled version per save/publish.
//   automation_nodes     — the typed nodes of a version.
//   automation_edges     — the directed edges of a version.
//
// This layer is the persistence for the canvas builder. It is tolerant
// (42P01-safe reads), workspace-scoped on every query, and never performs a
// side-effect beyond writing the graph rows. Compilation (graph → executor run
// plan) lives in canvas-compile.ts; this file only persists/loads the graph.

import type { SupabaseClient } from "@supabase/supabase-js"
import { nodeCategory, nodeDef, type AutomationRiskLevel } from "./node-registry"

const VERSIONS_TABLE = "automation_versions"
const NODES_TABLE = "automation_nodes"
const EDGES_TABLE = "automation_edges"

export type VersionStatus = "draft" | "validated" | "published" | "archived" | "invalid"

export interface CanvasNode {
  node_key: string
  node_type: string
  category: string
  label: string | null
  config: Record<string, unknown>
  risk: AutomationRiskLevel
  pos_x: number
  pos_y: number
}

export interface CanvasEdge {
  source_key: string
  target_key: string
  branch_label: string | null
}

export interface CanvasGraph {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export interface AutomationVersion {
  id: string
  workspace_id: string
  definition_id: string
  version: number
  status: VersionStatus
  compiled: Record<string, unknown>
  validation: Record<string, unknown>
  is_active: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface VersionWithGraph extends AutomationVersion {
  graph: CanvasGraph
}

type Row = Record<string, unknown>

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function toVersion(r: Row): AutomationVersion {
  return {
    id: String(r.id),
    workspace_id: String(r.workspace_id),
    definition_id: String(r.definition_id),
    version: Number(r.version ?? 1),
    status: (r.status as VersionStatus) ?? "draft",
    compiled: obj(r.compiled),
    validation: obj(r.validation),
    is_active: Boolean(r.is_active),
    notes: (r.notes as string | null) ?? null,
    created_by: (r.created_by as string | null) ?? null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  }
}

/** Normalise an incoming canvas node (from the client) into a storable node. */
export function normaliseNode(raw: Partial<CanvasNode> & { node_type: string; node_key: string }): CanvasNode {
  const def = nodeDef(raw.node_type)
  return {
    node_key: String(raw.node_key),
    node_type: String(raw.node_type),
    category: nodeCategory(raw.node_type) ?? "utility",
    label: raw.label ?? def?.label ?? raw.node_type,
    config: obj(raw.config),
    risk: (def?.risk ?? "low") as AutomationRiskLevel,
    pos_x: Number(raw.pos_x ?? 0),
    pos_y: Number(raw.pos_y ?? 0),
  }
}

/**
 * Create a new version of a definition's graph and persist its nodes/edges.
 * The next version number is derived from the latest existing version. Returns
 * the new version id. The version starts as 'draft'; publishing is a separate
 * step (publishVersion). Workspace-scoped.
 */
export async function createVersion(
  supabase: SupabaseClient,
  workspaceId: string,
  definitionId: string,
  graph: CanvasGraph,
  opts: { userId?: string | null; status?: VersionStatus; compiled?: Record<string, unknown>; validation?: Record<string, unknown>; notes?: string | null } = {},
): Promise<{ id: string; version: number } | null> {
  try {
    const { data: last } = await supabase
      .from(VERSIONS_TABLE)
      .select("version")
      .eq("definition_id", definitionId)
      .eq("workspace_id", workspaceId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextVersion = Number((last as { version?: number } | null)?.version ?? 0) + 1

    const { data, error } = await supabase
      .from(VERSIONS_TABLE)
      .insert({
        workspace_id: workspaceId,
        definition_id: definitionId,
        version: nextVersion,
        status: opts.status ?? "draft",
        compiled: opts.compiled ?? {},
        validation: opts.validation ?? {},
        is_active: false,
        notes: opts.notes ?? null,
        created_by: opts.userId ?? null,
      })
      .select("id, version")
      .single()
    if (error || !data) return null
    const versionId = String(data.id)

    await replaceGraph(supabase, workspaceId, versionId, graph)
    return { id: versionId, version: Number(data.version) }
  } catch {
    return null
  }
}

/** Replace all nodes/edges of a version with the supplied graph. */
export async function replaceGraph(
  supabase: SupabaseClient,
  workspaceId: string,
  versionId: string,
  graph: CanvasGraph,
): Promise<void> {
  await supabase.from(NODES_TABLE).delete().eq("version_id", versionId)
  await supabase.from(EDGES_TABLE).delete().eq("version_id", versionId)

  const nodes = (graph.nodes ?? []).map((n) => {
    const nn = normaliseNode(n)
    return { workspace_id: workspaceId, version_id: versionId, ...nn }
  })
  if (nodes.length) await supabase.from(NODES_TABLE).insert(nodes)

  const edges = (graph.edges ?? [])
    .filter((e) => e.source_key && e.target_key)
    .map((e) => ({
      workspace_id: workspaceId,
      version_id: versionId,
      source_key: String(e.source_key),
      target_key: String(e.target_key),
      branch_label: e.branch_label ?? null,
    }))
  if (edges.length) await supabase.from(EDGES_TABLE).insert(edges)
}

/** Load a version with its graph (tolerant — null if missing). */
export async function getVersion(
  supabase: SupabaseClient,
  workspaceId: string,
  versionId: string,
): Promise<VersionWithGraph | null> {
  try {
    const { data: v } = await supabase
      .from(VERSIONS_TABLE)
      .select("*")
      .eq("id", versionId)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (!v) return null
    const graph = await loadGraph(supabase, versionId)
    return { ...toVersion(v as Row), graph }
  } catch {
    return null
  }
}

/** Load just the node/edge graph of a version. */
export async function loadGraph(supabase: SupabaseClient, versionId: string): Promise<CanvasGraph> {
  try {
    const [{ data: nodes }, { data: edges }] = await Promise.all([
      supabase.from(NODES_TABLE).select("*").eq("version_id", versionId),
      supabase.from(EDGES_TABLE).select("*").eq("version_id", versionId),
    ])
    return {
      nodes: ((nodes as Row[]) ?? []).map((n) => ({
        node_key: String(n.node_key),
        node_type: String(n.node_type),
        category: String(n.category ?? "utility"),
        label: (n.label as string | null) ?? null,
        config: obj(n.config),
        risk: (n.risk as AutomationRiskLevel) ?? "low",
        pos_x: Number(n.pos_x ?? 0),
        pos_y: Number(n.pos_y ?? 0),
      })),
      edges: ((edges as Row[]) ?? []).map((e) => ({
        source_key: String(e.source_key),
        target_key: String(e.target_key),
        branch_label: (e.branch_label as string | null) ?? null,
      })),
    }
  } catch {
    return { nodes: [], edges: [] }
  }
}

/** The active (published) version of a definition, if any. */
export async function getActiveVersion(
  supabase: SupabaseClient,
  workspaceId: string,
  definitionId: string,
): Promise<VersionWithGraph | null> {
  try {
    const { data: v } = await supabase
      .from(VERSIONS_TABLE)
      .select("*")
      .eq("definition_id", definitionId)
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!v) return null
    const graph = await loadGraph(supabase, String((v as Row).id))
    return { ...toVersion(v as Row), graph }
  } catch {
    return null
  }
}

/** List versions of a definition, newest first. */
export async function listVersions(
  supabase: SupabaseClient,
  workspaceId: string,
  definitionId: string,
): Promise<AutomationVersion[]> {
  try {
    const { data } = await supabase
      .from(VERSIONS_TABLE)
      .select("*")
      .eq("definition_id", definitionId)
      .eq("workspace_id", workspaceId)
      .order("version", { ascending: false })
    return ((data as Row[]) ?? []).map(toVersion)
  } catch {
    return []
  }
}

/**
 * Publish a version: mark it active, demote any previously-active version, and
 * stamp the version status. The caller compiles + validates first and passes the
 * compiled plan in. Workspace-scoped.
 */
export async function publishVersion(
  supabase: SupabaseClient,
  workspaceId: string,
  definitionId: string,
  versionId: string,
  compiled: Record<string, unknown>,
  validation: Record<string, unknown>,
): Promise<void> {
  // Demote previously-active versions of this definition.
  await supabase
    .from(VERSIONS_TABLE)
    .update({ is_active: false, status: "archived", updated_at: new Date().toISOString() })
    .eq("definition_id", definitionId)
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)

  await supabase
    .from(VERSIONS_TABLE)
    .update({ is_active: true, status: "published", compiled, validation, updated_at: new Date().toISOString() })
    .eq("id", versionId)
    .eq("workspace_id", workspaceId)
}

/** Persist a draft compile/validation result onto a version without publishing. */
export async function saveVersionCompile(
  supabase: SupabaseClient,
  workspaceId: string,
  versionId: string,
  status: VersionStatus,
  compiled: Record<string, unknown>,
  validation: Record<string, unknown>,
): Promise<void> {
  await supabase
    .from(VERSIONS_TABLE)
    .update({ status, compiled, validation, updated_at: new Date().toISOString() })
    .eq("id", versionId)
    .eq("workspace_id", workspaceId)
}
