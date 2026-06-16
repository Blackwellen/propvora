"use client"

// Client API helpers for the Automation Engine surfaces. Thin fetch wrappers
// returning typed JSON; every call is workspace-scoped server-side.

export interface RegistryNode {
  type: string
  label: string
  group: string
  category: string
  scope: string
  risk: string
  plan: string
  requiresApproval: boolean
  blockedFromAutoRun: boolean
  description: string
  config: Array<{ key: string; label: string; kind: string; required?: boolean; default?: unknown; options?: Array<{ value: string; label: string }>; help?: string; supportsTokens?: boolean }>
}

export interface CompileIssue { level: "error" | "warning"; code: string; node_key?: string; message: string }
export interface CompileResultDTO {
  ok: boolean
  issues: CompileIssue[]
  plan: { trigger: unknown; steps: Array<{ node_key: string; node_type: string; category: string; requiresApproval: boolean; blocked: boolean; risk: string }>; hasApprovalGate: boolean }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } })
  return (await res.json()) as T
}
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  return (await res.json()) as T
}

export function loadRegistry(workspaceId?: string) {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""
  return getJson<{ ok: boolean; registry: RegistryNode[]; version: unknown; versions: unknown[] }>(`/api/automations/nodes${q}`)
}
export function loadVersion(versionId: string, workspaceId?: string) {
  const q = new URLSearchParams({ versionId, ...(workspaceId ? { workspaceId } : {}) }).toString()
  return getJson<{ ok: boolean; version: unknown; registry: RegistryNode[] }>(`/api/automations/nodes?${q}`)
}
export function saveGraph(body: { workspaceId?: string; definitionId: string; nodes: unknown[]; edges: unknown[]; publish?: boolean }) {
  return postJson<{ ok: boolean; versionId?: string; version?: number; published?: boolean; compile?: CompileResultDTO; error?: string }>("/api/automations/nodes", body)
}
export function loadRecipes() {
  return getJson<{ ok: boolean; recipes: Array<{ slug: string; name: string; description: string; domain: string; minPlan: string; recommended: boolean; nodeCount: number; actionCount: number }> }>("/api/automations/recipes")
}
export function installRecipe(body: { workspaceId?: string; slug: string }) {
  return postJson<{ ok: boolean; definitionId?: string; versionId?: string; issues?: CompileIssue[]; disabled?: boolean; error?: string }>("/api/automations/recipes", body)
}
export function loadApprovals(workspaceId?: string, status?: string) {
  const q = new URLSearchParams({ ...(workspaceId ? { workspaceId } : {}), ...(status ? { status } : {}) }).toString()
  return getJson<{ ok: boolean; approvals: Array<Record<string, unknown>>; error?: string }>(`/api/automations/approvals?${q}`)
}
export function decideApproval(body: { workspaceId?: string; approvalId: string; decision: "approved" | "rejected"; note?: string }) {
  return postJson<{ ok: boolean; error?: string }>("/api/automations/approvals", body)
}
export function loadErrors(workspaceId?: string, resolved?: boolean) {
  const q = new URLSearchParams({ ...(workspaceId ? { workspaceId } : {}), ...(resolved !== undefined ? { resolved: String(resolved) } : {}) }).toString()
  return getJson<{ ok: boolean; errors: Array<Record<string, unknown>> }>(`/api/automations/errors?${q}`)
}
export function resolveErrorApi(body: { workspaceId?: string; errorId: string }) {
  return postJson<{ ok: boolean }>("/api/automations/errors", body)
}
export function loadUsage(workspaceId?: string) {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""
  return getJson<{ ok: boolean; tier?: string; limits?: Record<string, unknown>; usage?: Record<string, unknown>; error?: string }>(`/api/automations/usage${q}`)
}
export function loadIntegrations(workspaceId?: string) {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""
  return getJson<{ ok: boolean; catalogue: Array<Record<string, unknown>>; connections: Array<Record<string, unknown>> }>(`/api/automations/integrations${q}`)
}
export function saveIntegration(body: { workspaceId?: string; provider: string; name: string; status?: string; config?: Record<string, unknown> }) {
  return postJson<{ ok: boolean; id?: string; error?: string }>("/api/automations/integrations", body)
}
export function aiBuild(body: { workspaceId?: string; prompt: string }) {
  return postJson<{ ok: boolean; draft?: boolean; name?: string; description?: string; graph?: { nodes: unknown[]; edges: unknown[] }; compile?: CompileResultDTO; notes?: string[]; error?: string }>("/api/automations/ai-builder", body)
}
export function replayRun(body: { workspaceId?: string; runId: string }) {
  return postJson<{ ok: boolean; runId?: string; queued?: boolean; error?: string }>("/api/automations/runs/replay", body)
}
export function loadRunDetail(runId: string, workspaceId?: string) {
  const q = new URLSearchParams({ runId, ...(workspaceId ? { workspaceId } : {}) }).toString()
  return getJson<{ ok: boolean; run: Record<string, unknown> | null; nodeRuns: Array<Record<string, unknown>>; events: Array<Record<string, unknown>> }>(`/api/automations/runs?${q}`)
}
export function createDraftDefinition(body: { workspaceId?: string; definition: Record<string, unknown> }) {
  return postJson<{ ok: boolean; id?: string; error?: string }>("/api/automations/definitions", body)
}
