import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

// ============================================================================
// RAG — embeddings + hybrid retrieval over workspace records/documents.
//
// Embeddings come from NVIDIA NIM `baai/bge-m3` (1024-dim, GDPR-compliant US
// infra — see project-ai-provider-compliance). Retrieval calls the RLS-scoped
// ai_match_embeddings function so the Copilot can NEVER surface a record the
// caller can't see. Everything FAILS OPEN: no key / no rows / store error →
// empty result, never an error that breaks a turn.
// ============================================================================

export const EMBED_MODEL = "baai/bge-m3"
export const EMBED_DIM = 1024
const NIM_BASE = "https://integrate.api.nvidia.com/v1"

/** Embed one or more texts. Returns [] on any failure (fail-open). */
export async function embedTexts(
  texts: string[],
  inputType: "passage" | "query" = "passage"
): Promise<number[][]> {
  const key = process.env.NVIDIA_API_KEY
  if (!key || texts.length === 0) return []
  try {
    const res = await fetch(`${NIM_BASE}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts, input_type: inputType }),
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: { embedding: number[]; index: number }[] }
    const rows = json.data ?? []
    // Preserve input order.
    const out: number[][] = new Array(texts.length).fill(null)
    rows.forEach((r) => {
      out[r.index ?? 0] = r.embedding
    })
    return out.map((e) => e ?? [])
  } catch {
    return []
  }
}

/** pgvector text literal for a JS number[] (for RPC binding). */
function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`
}

export interface IndexChunk {
  sourceType: string
  sourceId: string
  chunkIndex?: number
  content: string
  metadata?: Record<string, unknown>
}

/**
 * Embed + upsert content chunks into ai_embeddings (service-role write — the
 * index must not be poisonable by clients). Best-effort; skips empty/oversized.
 */
export async function indexContent(workspaceId: string, chunks: IndexChunk[]): Promise<number> {
  if (!workspaceId || workspaceId === "demo-workspace" || chunks.length === 0) return 0
  const texts = chunks.map((c) => c.content.slice(0, 4000))
  const vectors = await embedTexts(texts, "passage")
  if (vectors.length === 0) return 0
  const rows = chunks.map((c, i) => ({
    workspace_id: workspaceId,
    source_type: c.sourceType,
    source_id: c.sourceId,
    chunk_index: c.chunkIndex ?? 0,
    content: texts[i],
    embedding: vectors[i] && vectors[i].length ? toVectorLiteral(vectors[i]) : null,
    metadata: (c.metadata ?? {}) as object,
    updated_at: new Date().toISOString(),
  }))
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from("ai_embeddings")
      .upsert(rows, { onConflict: "workspace_id,source_type,source_id,chunk_index" })
    return error ? 0 : rows.length
  } catch {
    return 0
  }
}

export interface RetrievedChunk {
  id: string
  sourceType: string
  sourceId: string
  content: string
  similarity: number
  score: number
}

/**
 * Hybrid retrieval for a query. Embeds the query, then calls the RLS-scoped
 * ai_match_embeddings RPC (the user client → RLS applies → only this
 * workspace's rows). Fail-open empty.
 */
export async function retrieve(
  supabase: SupabaseClient,
  workspaceId: string,
  query: string,
  k = 8
): Promise<RetrievedChunk[]> {
  if (!workspaceId || workspaceId === "demo-workspace" || !query.trim()) return []
  const [vec] = await embedTexts([query], "query")
  if (!vec || vec.length === 0) return []
  try {
    const { data, error } = await supabase.rpc("ai_match_embeddings", {
      p_workspace: workspaceId,
      p_embedding: toVectorLiteral(vec),
      p_query: query,
      p_k: k,
    })
    if (error || !Array.isArray(data)) return []
    return (data as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      sourceType: String(r.source_type),
      sourceId: String(r.source_id),
      content: String(r.content),
      similarity: Number(r.similarity ?? 0),
      score: Number(r.score ?? 0),
    }))
  } catch {
    return []
  }
}

/** Render retrieved chunks as a cited context block for the system prompt. */
export function renderRetrieved(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ""
  const lines = chunks.map(
    (c, i) => `[${i + 1}] (${c.sourceType}:${c.sourceId}) ${c.content.replace(/\s+/g, " ").slice(0, 400)}`
  )
  return `RELEVANT RECORDS (cite as [n] when you use them; each maps to a real ${""}record the user can open):\n${lines.join("\n")}`
}
