import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

// ============================================================================
// AI memory tiers — recall + write over ai_memory_{workspace,user,thread}.
//
//   • thread    — rolling summary + salient facts for one chat (continuity).
//   • workspace — durable facts the engine learns about the portfolio.
//   • user      — per-user preferences (tone, default report format, units).
//
// Recall is injected into the system prompt every turn. Writes are PROPOSED by
// the model and confirmed deterministically (dedupe by key); they go through
// the memory.write tool, never silently. All reads/writes are RLS-scoped and
// FAIL-OPEN — a missing table or store error yields empty memory, never an
// error that breaks a turn.
// ============================================================================

export interface MemoryFact {
  key: string
  value: unknown
  confidence: number
}

export interface RecalledMemory {
  workspace: MemoryFact[]
  user: MemoryFact[]
  threadSummary: string | null
}

const EMPTY: RecalledMemory = { workspace: [], user: [], threadSummary: null }

/** Recall all memory tiers for a turn. Best-effort; never throws. */
export async function recallMemory(
  supabase: SupabaseClient,
  args: { workspaceId: string; userId: string | null; threadId: string | null }
): Promise<RecalledMemory> {
  if (!args.workspaceId || args.workspaceId === "demo-workspace") return EMPTY
  const out: RecalledMemory = { workspace: [], user: [], threadSummary: null }
  try {
    const [ws, usr, thr] = await Promise.all([
      supabase
        .from("ai_memory_workspace")
        .select("key, value, confidence")
        .eq("workspace_id", args.workspaceId)
        .order("confidence", { ascending: false })
        .limit(40),
      args.userId
        ? supabase
            .from("ai_memory_user")
            .select("key, value, confidence")
            .eq("workspace_id", args.workspaceId)
            .eq("user_id", args.userId)
            .limit(20)
        : Promise.resolve({ data: [] as MemoryFact[] }),
      args.threadId
        ? supabase
            .from("ai_memory_thread")
            .select("summary")
            .eq("thread_id", args.threadId)
            .maybeSingle()
        : Promise.resolve({ data: null as { summary: string | null } | null }),
    ])
    out.workspace = (ws.data as MemoryFact[] | null) ?? []
    out.user = (usr.data as MemoryFact[] | null) ?? []
    out.threadSummary = (thr.data as { summary: string | null } | null)?.summary ?? null
  } catch {
    return EMPTY
  }
  return out
}

/** Render recalled memory as a compact, prompt-ready block (or "" if empty). */
export function renderMemory(mem: RecalledMemory): string {
  const lines: string[] = []
  if (mem.threadSummary) lines.push(`Conversation so far: ${mem.threadSummary}`)
  if (mem.workspace.length) {
    lines.push("Known about this workspace:")
    for (const f of mem.workspace.slice(0, 20)) {
      lines.push(`- ${f.key}: ${stringifyValue(f.value)}`)
    }
  }
  if (mem.user.length) {
    lines.push("This user's preferences:")
    for (const f of mem.user.slice(0, 12)) {
      lines.push(`- ${f.key}: ${stringifyValue(f.value)}`)
    }
  }
  return lines.join("\n")
}

function stringifyValue(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  try {
    return JSON.stringify(v)
  } catch {
    return ""
  }
}

// ── Writes (deterministic, deduped by key) ─────────────────────────────────

/** Upsert a durable workspace fact. Best-effort. */
export async function writeWorkspaceMemory(
  _supabase: SupabaseClient,
  args: { workspaceId: string; key: string; value: unknown; confidence?: number }
): Promise<void> {
  if (!args.workspaceId || args.workspaceId === "demo-workspace" || !args.key) return
  try {
    // Service-role: ai_memory_workspace is server-written (SELECT-only policy)
    // so the engine's learned facts can't be forged by a client.
    await createAdminClient()
      .from("ai_memory_workspace")
      .upsert(
        {
          workspace_id: args.workspaceId,
          key: args.key,
          value: args.value as object,
          confidence: args.confidence ?? 0.8,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,key" }
      )
  } catch {
    /* non-fatal */
  }
}

/** Upsert a per-user preference. Best-effort. */
export async function writeUserMemory(
  supabase: SupabaseClient,
  args: { workspaceId: string; userId: string; key: string; value: unknown; confidence?: number; sourceMessageId?: string | null }
): Promise<void> {
  if (!args.workspaceId || args.workspaceId === "demo-workspace" || !args.userId || !args.key) return
  try {
    await supabase
      .from("ai_memory_user")
      .upsert(
        {
          workspace_id: args.workspaceId,
          user_id: args.userId,
          key: args.key,
          value: args.value as object,
          confidence: args.confidence ?? 0.8,
          source_message_id: args.sourceMessageId ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,user_id,key" }
      )
  } catch {
    /* non-fatal */
  }
}

/** Upsert a thread's rolling summary + salient facts. Best-effort. */
export async function upsertThreadSummary(
  _supabase: SupabaseClient,
  args: { threadId: string; workspaceId: string; summary: string; salient?: Record<string, unknown>; tokenCount?: number }
): Promise<void> {
  if (!args.threadId || !args.workspaceId || args.workspaceId === "demo-workspace") return
  try {
    // Service-role: ai_memory_thread is server-written (SELECT-only policy).
    await createAdminClient()
      .from("ai_memory_thread")
      .upsert(
        {
          thread_id: args.threadId,
          workspace_id: args.workspaceId,
          summary: args.summary.slice(0, 4000),
          salient: (args.salient ?? {}) as object,
          token_count: args.tokenCount ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "thread_id" }
      )
  } catch {
    /* non-fatal */
  }
}
