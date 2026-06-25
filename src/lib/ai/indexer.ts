import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { indexContent, type IndexChunk } from "./embeddings"

// ============================================================================
// Content indexer — turn a workspace's real records into searchable embeddings.
//
// Reads the workspace's own rows (properties, tenancies, compliance items,
// tasks, contacts) via the service-role client filtered by workspace_id, builds
// one compact text chunk per record, and upserts them into ai_embeddings so RAG
// (src/lib/ai/embeddings.ts) has real data to retrieve. Schema-tolerant: selects
// '*' and reads whatever fields exist, so column drift never breaks indexing.
//
// This is a server job (called from /api/ai/index or a cron). It is idempotent
// per record (upsert on workspace+source), so re-running refreshes the index.
// ============================================================================

type Row = Record<string, unknown>
/** Lookup maps so child records (tenancy/task/compliance) carry real names. */
type Names = { prop: Record<string, string>; contact: Record<string, string> }
const s = (v: unknown): string => (v == null ? "" : String(v))
const firstStr = (r: Row, keys: string[]): string => {
  for (const k of keys) if (r[k] != null && String(r[k]).trim()) return String(r[k])
  return ""
}

async function fetchRows(table: string, workspaceId: string, limit = 500): Promise<Row[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from(table).select("*").eq("workspace_id", workspaceId).limit(limit)
    if (error || !Array.isArray(data)) return []
    return data as Row[]
  } catch {
    return []
  }
}

function propertyChunk(r: Row, _names: Names): IndexChunk | null {
  const id = s(r.id)
  if (!id) return null
  const name = firstStr(r, ["nickname", "name", "title", "label"]) || "Property"
  const addr = [firstStr(r, ["address_line1", "address", "full_address"]), firstStr(r, ["city"]), firstStr(r, ["postcode"])]
    .filter(Boolean)
    .join(", ")
  const type = firstStr(r, ["category", "property_type", "type", "subcategory"])
  const status = firstStr(r, ["status"])
  const beds = firstStr(r, ["bedrooms", "beds"])
  const content = `Property "${name}"${addr ? ` at ${addr}` : ""}.${type ? ` Type: ${type}.` : ""}${beds ? ` ${beds} bedrooms.` : ""}${status ? ` Status: ${status}.` : ""}`
  return { sourceType: "property", sourceId: id, content }
}

function tenancyChunk(r: Row, names: Names): IndexChunk | null {
  const id = s(r.id)
  if (!id) return null
  const prop = names.prop[s(r.property_id)]
  const tenant = names.contact[s(r.primary_contact_id)]
  const status = firstStr(r, ["status"])
  const rent = firstStr(r, ["rent_amount", "rent", "monthly_rent"])
  const start = firstStr(r, ["start_date"])
  const end = firstStr(r, ["end_date"])
  const content = `Tenancy${prop ? ` at ${prop}` : ""}${tenant ? `, tenant ${tenant}` : ""}.${status ? ` Status: ${status}.` : ""}${rent ? ` Rent: ${rent} pcm.` : ""}${start ? ` Starts ${start}.` : ""}${end ? ` Ends ${end}.` : ""}`
  return { sourceType: "tenancy", sourceId: id, content }
}

function complianceChunk(r: Row, names: Names): IndexChunk | null {
  const id = s(r.id)
  if (!id) return null
  const prop = names.prop[s(r.property_id)]
  const title = firstStr(r, ["title", "name", "type", "kind", "certificate_type"]) || "Compliance item"
  const status = firstStr(r, ["status"])
  const due = firstStr(r, ["due_date", "expiry_date", "expires_at"])
  const content = `Compliance: ${title}${prop ? ` for ${prop}` : ""}.${status ? ` Status: ${status}.` : ""}${due ? ` Due/expires ${due}.` : ""}`
  return { sourceType: "compliance", sourceId: id, content }
}

function taskChunk(r: Row, names: Names): IndexChunk | null {
  const id = s(r.id)
  if (!id) return null
  const prop = names.prop[s(r.property_id)]
  const title = firstStr(r, ["title", "name", "summary"]) || "Task"
  const desc = firstStr(r, ["description", "details", "body"])
  const status = firstStr(r, ["status"])
  const priority = firstStr(r, ["priority"])
  const due = firstStr(r, ["due_date", "due_at"])
  const content = `Task: ${title}${prop ? ` (${prop})` : ""}.${desc ? ` ${desc}.` : ""}${priority ? ` Priority: ${priority}.` : ""}${status ? ` Status: ${status}.` : ""}${due ? ` Due ${due}.` : ""}`
  return { sourceType: "task", sourceId: id, content }
}

function contactChunk(r: Row, _names: Names): IndexChunk | null {
  const id = s(r.id)
  if (!id) return null
  const name = firstStr(r, ["name", "full_name", "display_name"]) || "Contact"
  const email = firstStr(r, ["email", "email_address"])
  const role = firstStr(r, ["type", "role", "contact_type", "category"])
  const content = `Contact: ${name}.${role ? ` Role: ${role}.` : ""}${email ? ` Email: ${email}.` : ""}`
  return { sourceType: "contact", sourceId: id, content }
}

const SOURCES: { table: string; build: (r: Row, names: Names) => IndexChunk | null }[] = [
  { table: "properties", build: propertyChunk },
  { table: "tenancies", build: tenancyChunk },
  { table: "compliance_items", build: complianceChunk },
  { table: "tasks", build: taskChunk },
  { table: "contacts", build: contactChunk },
]

/** Build property + contact name lookup maps so child chunks carry real names. */
async function buildNames(workspaceId: string): Promise<Names> {
  const names: Names = { prop: {}, contact: {} }
  const [props, contacts] = await Promise.all([
    fetchRows("properties", workspaceId),
    fetchRows("contacts", workspaceId),
  ])
  for (const p of props) {
    const id = s(p.id)
    if (!id) continue
    const nick = firstStr(p, ["nickname", "name", "title"]) || "Property"
    const addr = firstStr(p, ["address_line1", "city", "postcode"])
    names.prop[id] = addr ? `${nick} (${addr})` : nick
  }
  for (const c of contacts) {
    const id = s(c.id)
    if (id) names.contact[id] = firstStr(c, ["display_name", "name", "full_name"]) || "Contact"
  }
  return names
}

export interface IndexResult {
  indexed: number
  byType: Record<string, number>
}

/**
 * Index (or refresh) a workspace's records into ai_embeddings. Returns the
 * count indexed per source type. Best-effort and bounded (max 500 rows/table).
 */
export async function indexWorkspace(workspaceId: string): Promise<IndexResult> {
  const byType: Record<string, number> = {}
  let total = 0
  if (!workspaceId || workspaceId === "demo-workspace") return { indexed: 0, byType }

  // Name maps first, so tenancy/task/compliance chunks carry real property +
  // tenant names (what lets the Copilot draft grounded letters, not templates).
  const names = await buildNames(workspaceId)

  for (const src of SOURCES) {
    const rows = await fetchRows(src.table, workspaceId)
    if (rows.length === 0) continue
    const chunks = rows.map((r) => src.build(r, names)).filter((c): c is IndexChunk => c !== null)
    if (chunks.length === 0) continue
    // Embed + upsert in batches to keep each NIM request reasonable.
    let done = 0
    for (let i = 0; i < chunks.length; i += 64) {
      done += await indexContent(workspaceId, chunks.slice(i, i + 64))
    }
    if (done > 0) {
      byType[chunks[0].sourceType] = done
      total += done
    }
  }
  return { indexed: total, byType }
}
