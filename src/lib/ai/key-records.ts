import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { WorkspaceCapabilities } from "./workspace-context"

// ============================================================================
// Key records — the ACTUAL named records (not just counts) the Copilot needs to
// give full-depth, enterprise-grade answers. Counts tell it "14 open tasks";
// this tells it "22 Park Road: EICR overdue 37 days; Apt 3B Riverside: rent
// overdue, Priya Sharma". Without this, commands can only give generic advice.
//
// RLS-scoped via the caller's client (only records the user can see). Schema-
// tolerant + fail-soft: a missing table/column just omits that section.
// ============================================================================

type Row = Record<string, unknown>
const s = (v: unknown): string => (v == null ? "" : String(v))
const firstStr = (r: Row, keys: string[]): string => {
  for (const k of keys) if (r[k] != null && String(r[k]).trim()) return String(r[k])
  return ""
}

async function rows(supabase: SupabaseClient, table: string, workspaceId: string, limit = 200): Promise<Row[]> {
  try {
    const { data, error } = await supabase.from(table).select("*").eq("workspace_id", workspaceId).limit(limit)
    return error || !Array.isArray(data) ? [] : (data as Row[])
  } catch {
    return []
  }
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Build a compact "KEY RECORDS" block of real, named records for the prompt.
 * Caps each list so the prompt stays bounded. Returns "" if nothing to show.
 */
export async function getKeyRecords(
  supabase: SupabaseClient,
  workspaceId: string,
  caps: WorkspaceCapabilities
): Promise<string> {
  if (!workspaceId || workspaceId === "demo-workspace") return ""

  // Name maps (property + contact) so child records read with real names.
  const [props, contacts] = await Promise.all([
    rows(supabase, "properties", workspaceId),
    rows(supabase, "contacts", workspaceId),
  ])
  const propName: Record<string, string> = {}
  for (const p of props) {
    const nick = firstStr(p, ["nickname", "name", "title"]) || "Property"
    const addr = firstStr(p, ["address_line1", "city", "postcode"])
    propName[s(p.id)] = addr ? `${nick}, ${addr}` : nick
  }
  const contactName: Record<string, string> = {}
  for (const c of contacts) contactName[s(c.id)] = firstStr(c, ["display_name", "name", "full_name"]) || "Contact"

  const sections: string[] = []
  const td = today()

  if (caps.portfolio) {
    // Overdue / open tasks
    const tasks = await rows(supabase, "tasks", workspaceId)
    const open = tasks.filter((t) => firstStr(t, ["status"]) !== "done")
    if (open.length) {
      const lines = open.slice(0, 10).map((t) => {
        const p = propName[s(t.property_id)]
        const due = firstStr(t, ["due_date", "due_at"])
        return `- ${firstStr(t, ["title", "name"]) || "Task"}${p ? ` — ${p}` : ""}${firstStr(t, ["priority"]) ? ` [${firstStr(t, ["priority"])}]` : ""}${due ? ` (due ${due})` : ""}`
      })
      sections.push(`OPEN TASKS (${open.length}):\n${lines.join("\n")}`)
    }
    // Active tenancies
    const tens = await rows(supabase, "tenancies", workspaceId)
    const active = tens.filter((t) => firstStr(t, ["status"]) === "active")
    if (active.length) {
      const lines = active.slice(0, 10).map((t) => {
        const p = propName[s(t.property_id)]
        const tenant = contactName[s(t.primary_contact_id)]
        const rent = firstStr(t, ["rent_amount", "rent", "monthly_rent"])
        const end = firstStr(t, ["end_date"])
        return `- ${tenant || "Tenant"}${p ? ` at ${p}` : ""}${rent ? ` — £${rent} pcm` : ""}${end ? `, ends ${end}` : ""}`
      })
      sections.push(`ACTIVE TENANCIES (${active.length}):\n${lines.join("\n")}`)
    }
    // Vacant units
    const units = await rows(supabase, "units", workspaceId)
    const vacant = units.filter((u) => /vacant|void/i.test(firstStr(u, ["status"])))
    if (vacant.length) {
      const lines = vacant.slice(0, 8).map((u) => `- ${propName[s(u.property_id)] || "Property"}${firstStr(u, ["name", "label", "unit_number"]) ? ` — unit ${firstStr(u, ["name", "label", "unit_number"])}` : ""}`)
      sections.push(`VACANT UNITS (${vacant.length}):\n${lines.join("\n")}`)
    }
  }

  if (caps.compliance) {
    const comp = await rows(supabase, "compliance_items", workspaceId)
    // Items needing attention = overdue / due-soon / expiring (NOT "ok" / "compliant").
    const attention = comp
      .filter((c) => {
        const st = firstStr(c, ["status"]).toLowerCase()
        return st === "" || /overdue|due_soon|due-soon|expiring|expired|action|pending|missing/.test(st) || (st !== "ok" && st !== "compliant" && st !== "valid")
      })
      .sort((a, b) => firstStr(a, ["due_date", "expiry_date"]).localeCompare(firstStr(b, ["due_date", "expiry_date"])))
    if (attention.length) {
      const lines = attention.slice(0, 10).map((c) => {
        const p = propName[s(c.property_id)]
        const due = firstStr(c, ["due_date", "expiry_date", "expires_at"])
        const overdue = due && due < td
        return `- ${firstStr(c, ["title", "kind", "type"]) || "Compliance item"}${p ? ` — ${p}` : ""}${due ? ` (${overdue ? "OVERDUE since" : "due"} ${due})` : ""}`
      })
      sections.push(`COMPLIANCE NEEDING ATTENTION (${attention.length}):\n${lines.join("\n")}`)
    }
  }

  if (sections.length === 0) return ""
  return `KEY RECORDS — the user's actual records. When answering, NAME these specific properties, units, tenants, tasks and compliance items and their dates/amounts. Do NOT give a generic checklist when real records are listed here:\n\n${sections.join("\n\n")}`
}
