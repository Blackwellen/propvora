/**
 * GET /api/ai/entities?workspaceId=...&q=...&type=...
 *
 * Entity search for the composer's @-mention picker — returns real, RLS-scoped
 * records the user can reference while chatting. Covers the whole product:
 * properties, units, tenancies, contacts, tasks, jobs, compliance, invoices,
 * bills, deposits, PPM plans, calendar events, reminders, automations and
 * planning sets.
 *
 * Type filtering: "@property kingsway" (or ?type=property) narrows to one
 * category; otherwise a default cross-section set is interleaved. The `type`
 * value matches the field-schema keys so an @-mentioned record can then be
 * edited in natural language ("@<unit> set rent to 850").
 *
 * Response: { entities: [{ type, id, label }], typeFilter }
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

interface Hit { type: string; id: string; label: string }
type Row = Record<string, unknown>
type NameMaps = { prop: Record<string, string>; contact: Record<string, string> }
const str = (v: unknown) => (v == null ? "" : String(v))

// ── Entity sources: one per @-mentionable record type ────────────────────────
// `searchCol` is the column ilike'd when the user types a term; sources without
// one (tenancy/deposit have no text name) are post-filtered on their formatted
// label. `needsMaps` sources enrich their label with property/contact names.
interface Source {
  type: string
  table: string
  searchCol: string | null
  needsMaps?: boolean
  format: (r: Row, m: NameMaps) => string
}

const SOURCES: Source[] = [
  { type: "property", table: "properties", searchCol: "nickname", format: (r) => str(r.nickname || r.address_line1 || "Property") },
  { type: "unit", table: "units", searchCol: "label", needsMaps: true, format: (r, m) => `${str(r.label || "Unit")}${m.prop[str(r.property_id)] ? ` · ${m.prop[str(r.property_id)]}` : ""}` },
  { type: "tenancy", table: "tenancies", searchCol: null, needsMaps: true, format: (r, m) => `${m.contact[str(r.primary_contact_id)] || "Tenancy"}${m.prop[str(r.property_id)] ? ` · ${m.prop[str(r.property_id)]}` : ""}` },
  { type: "contact", table: "contacts", searchCol: "display_name", format: (r) => str(r.display_name || "Contact") },
  { type: "task", table: "tasks", searchCol: "title", format: (r) => str(r.title || "Task") },
  { type: "job", table: "jobs", searchCol: "title", format: (r) => str(r.title || "Job") },
  { type: "compliance", table: "compliance_items", searchCol: "title", format: (r) => str(r.title || r.kind || "Compliance") },
  { type: "invoice", table: "invoices", searchCol: "invoice_number", needsMaps: true, format: (r, m) => `${str(r.invoice_number || "Invoice")}${m.prop[str(r.property_id)] ? ` · ${m.prop[str(r.property_id)]}` : ""}` },
  { type: "bill", table: "bills", searchCol: "bill_number", needsMaps: true, format: (r, m) => `${str(r.bill_number || "Bill")}${m.prop[str(r.property_id)] ? ` · ${m.prop[str(r.property_id)]}` : ""}` },
  { type: "deposit", table: "deposits", searchCol: "reference_number", needsMaps: true, format: (r, m) => `${str(r.reference_number || "Deposit")}${m.prop[str(r.property_id)] ? ` · ${m.prop[str(r.property_id)]}` : r.amount ? ` · £${str(r.amount)}` : ""}` },
  { type: "ppm", table: "ppm_plans", searchCol: "name", format: (r) => str(r.name || "PPM plan") },
  { type: "event", table: "calendar_events", searchCol: "title", format: (r) => str(r.title || "Event") },
  { type: "reminder", table: "calendar_reminders", searchCol: "title", format: (r) => str(r.title || "Reminder") },
  { type: "automation", table: "automation_definitions", searchCol: "name", format: (r) => str(r.name || "Automation") },
  { type: "planningSet", table: "planning_sets", searchCol: "title", format: (r) => str(r.title || "Planning set") },
]
const SOURCE_BY_TYPE: Record<string, Source> = Object.fromEntries(SOURCES.map((s) => [s.type, s]))

// Types interleaved when no @type is given — the long tail stays reachable by
// typing an explicit type word (e.g. "@automation").
const DEFAULT_TYPES = ["property", "contact", "tenancy", "unit", "task", "job", "compliance", "invoice"]

// Type-word → canonical type. Lets the user write "@tenant", "@cert", "@flow".
const TYPE_ALIASES: Record<string, string> = {
  property: "property", properties: "property", prop: "property",
  unit: "unit", units: "unit", room: "unit", flat: "unit",
  tenancy: "tenancy", tenancies: "tenancy", tenant: "tenancy", tenants: "tenancy", lease: "tenancy", let: "tenancy",
  contact: "contact", contacts: "contact", person: "contact", people: "contact", landlord: "contact", owner: "contact", supplier: "contact", organisation: "contact", organization: "contact", company: "contact",
  task: "task", tasks: "task", todo: "task",
  job: "job", jobs: "job", repair: "job", workorder: "job",
  compliance: "compliance", cert: "compliance", certificate: "compliance", certificates: "compliance", safety: "compliance", inspection: "compliance", gas: "compliance", epc: "compliance", eicr: "compliance",
  invoice: "invoice", invoices: "invoice", inv: "invoice",
  bill: "bill", bills: "bill", expense: "bill", expenses: "bill",
  deposit: "deposit", deposits: "deposit",
  ppm: "ppm", maintenance: "ppm", planned: "ppm", schedule: "ppm",
  event: "event", events: "event", appointment: "event", calendar: "event",
  reminder: "reminder", reminders: "reminder",
  automation: "automation", automations: "automation", flow: "automation", recipe: "automation", workflow: "automation",
  planningset: "planningSet", planning: "planningSet", appraisal: "planningSet", deal: "planningSet",
}

async function buildMaps(supabase: SupabaseClient, workspaceId: string): Promise<NameMaps> {
  const m: NameMaps = { prop: {}, contact: {} }
  const [{ data: props }, { data: contacts }] = await Promise.all([
    supabase.from("properties").select("id,nickname,address_line1").eq("workspace_id", workspaceId).limit(1000),
    supabase.from("contacts").select("id,display_name").eq("workspace_id", workspaceId).limit(1000),
  ])
  for (const p of (props ?? []) as Row[]) m.prop[str(p.id)] = str(p.nickname || p.address_line1 || "Property")
  for (const c of (contacts ?? []) as Row[]) m.contact[str(c.id)] = str(c.display_name || "Contact")
  return m
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? ""
    let q = (request.nextUrl.searchParams.get("q") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ entities: [] })

    // Resolve a type filter from ?type= or the first query word.
    let typeFilter = (request.nextUrl.searchParams.get("type") ?? "").trim().toLowerCase()
    if (!typeFilter && q) {
      const first = q.split(/\s+/)[0].toLowerCase()
      if (TYPE_ALIASES[first]) { typeFilter = TYPE_ALIASES[first]; q = q.slice(first.length).trim() }
    }
    typeFilter = TYPE_ALIASES[typeFilter] ?? typeFilter
    if (typeFilter && !SOURCE_BY_TYPE[typeFilter]) typeFilter = ""

    const { data: member } = await supabase
      .from("workspace_members").select("role")
      .eq("workspace_id", workspaceId).eq("user_id", user.id).single()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const activeSources = typeFilter ? [SOURCE_BY_TYPE[typeFilter]] : SOURCES.filter((s) => DEFAULT_TYPES.includes(s.type))
    const perType = typeFilter ? 12 : 4
    const maps: NameMaps = activeSources.some((s) => s.needsMaps) ? await buildMaps(supabase, workspaceId) : { prop: {}, contact: {} }
    const like = `%${q.replace(/[%_]/g, "")}%`

    const run = async (src: Source): Promise<Hit[]> => {
      try {
        let query = supabase.from(src.table).select("*").eq("workspace_id", workspaceId).limit(src.searchCol ? perType : Math.max(perType, 20))
        if (q && src.searchCol) query = query.ilike(src.searchCol, like)
        const { data, error } = await query
        if (error || !Array.isArray(data)) return []
        let hits = (data as Row[])
          .map((r) => ({ type: src.type, id: str(r.id), label: src.format(r, maps) }))
          .filter((h) => h.id)
        // Sources without a search column are post-filtered on their label.
        if (q && !src.searchCol) hits = hits.filter((h) => h.label.toLowerCase().includes(q.toLowerCase()))
        return hits.slice(0, perType)
      } catch {
        return []
      }
    }

    const results = await Promise.all(activeSources.map(run))

    let entities: Hit[]
    if (typeFilter) {
      entities = results[0] ?? []
    } else {
      // Interleave so no single type dominates the picker.
      entities = []
      for (let i = 0; i < perType; i++) for (const list of results) if (list[i]) entities.push(list[i])
    }

    return NextResponse.json({ entities: entities.slice(0, 16), typeFilter: typeFilter || null })
  } catch {
    return NextResponse.json({ entities: [] })
  }
}
