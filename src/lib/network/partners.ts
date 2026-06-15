import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  PartnerRelationship,
  PartnerListResult,
  PartnerDetail,
  PartnerGroup,
  PartnerGroupKey,
  PartnerSummary,
  RelationshipType,
  RelationshipStatus,
} from "./types"

/* ──────────────────────────────────────────────────────────────────────────
   PARTNER GRAPH — operators <-> suppliers <-> customers <-> marketplace.

   `partner_relationships` is a DERIVED/cached graph. The canonical derivation
   lives in the SQL function `recompute_partner_graph(workspace)` (see migration
   20260616180000) which aggregates supplier_connections + marketplace_
   transactions + bookings into the owning workspace's edges. This module wraps
   that function and reads back the cached rows for the UI.

   Strict workspace scoping: every read here filters by workspace_id, and the
   table's RLS only returns rows the caller's workspace OWNS — there is no path
   for a workspace to see another's partner edges.

   Tolerant: a cold/migrating DB (table or sibling modules absent) resolves to
   `ready:false` / empty rather than throwing. All money/state lives in the
   owning modules; nothing is invented here.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "PGRST202", "42883"])

function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned|relation .* does not exist|could not find/i.test(
    e.message ?? ""
  )
}

function toRelationshipType(v: unknown): RelationshipType | null {
  switch (v) {
    case "supplier":
    case "operator":
    case "customer":
    case "marketplace_seller":
    case "marketplace_buyer":
      return v
    default:
      return null
  }
}

function toStatus(v: unknown): RelationshipStatus {
  return v === "pending" || v === "ended" ? v : "active"
}

/**
 * Recompute the cached partner graph for ONE workspace by invoking the
 * SECURITY DEFINER SQL function. Best-effort: returns the row count it produced,
 * or 0 if the function/tables aren't provisioned. Never throws.
 */
export async function recomputePartnerGraph(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<number> {
  if (!workspaceId) return 0
  try {
    const { data, error } = await supabase.rpc("recompute_partner_graph", {
      _workspace_id: workspaceId,
    })
    if (error) {
      if (isMissing(error)) return 0
      return 0
    }
    return typeof data === "number" ? data : 0
  } catch {
    return 0
  }
}

interface PartnerFilter {
  relationshipType?: RelationshipType
  status?: RelationshipStatus
  group?: PartnerGroupKey
}

const GROUP_OF: Record<RelationshipType, PartnerGroupKey> = {
  supplier: "suppliers",
  operator: "operators",
  customer: "customers",
  marketplace_seller: "marketplace",
  marketplace_buyer: "marketplace",
}

const GROUP_LABEL: Record<PartnerGroupKey, string> = {
  suppliers: "Suppliers",
  operators: "Operators",
  customers: "Customers",
  marketplace: "Marketplace counterparties",
}

const GROUP_ORDER: PartnerGroupKey[] = ["suppliers", "customers", "marketplace", "operators"]

/** Read the cached relationship rows the workspace owns, hydrated + grouped. */
export async function listPartners(
  supabase: SupabaseClient,
  workspaceId: string,
  filter?: PartnerFilter
): Promise<PartnerListResult> {
  const empty: PartnerListResult = {
    ready: false,
    groups: [],
    summary: emptySummary(),
  }
  if (!workspaceId) return { ...empty, ready: true }

  let rows: Record<string, unknown>[] = []
  try {
    let q = supabase
      .from("partner_relationships")
      .select(
        "id, workspace_id, partner_workspace_id, relationship_type, status, first_interaction_at, last_interaction_at, interaction_count"
      )
      .eq("workspace_id", workspaceId)
    if (filter?.relationshipType) q = q.eq("relationship_type", filter.relationshipType)
    if (filter?.status) q = q.eq("status", filter.status)
    const { data, error } = await q
      .order("last_interaction_at", { ascending: false, nullsFirst: false })
      .limit(2000)
    if (error) {
      if (isMissing(error)) return { ...empty, ready: false }
      return { ...empty, ready: true }
    }
    rows = (data as Record<string, unknown>[]) ?? []
  } catch {
    return { ...empty, ready: false }
  }

  // Hydrate partner names/types in one round trip (tolerant of RLS hiding rows).
  const partnerIds = Array.from(
    new Set(rows.map((r) => r.partner_workspace_id as string).filter(Boolean))
  )
  const nameById = new Map<string, { name: string | null; type: string | null }>()
  if (partnerIds.length > 0) {
    try {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name, workspace_type, type")
        .in("id", partnerIds)
      for (const w of (ws as Record<string, unknown>[]) ?? []) {
        nameById.set(w.id as string, {
          name: (w.name as string) ?? null,
          type: ((w.workspace_type as string) ?? (w.type as string)) ?? null,
        })
      }
    } catch {
      // partner names are non-essential; ids still render
    }
  }

  const partners: PartnerRelationship[] = []
  for (const r of rows) {
    const rt = toRelationshipType(r.relationship_type)
    if (!rt) continue
    if (filter?.group && GROUP_OF[rt] !== filter.group) continue
    const meta = nameById.get(r.partner_workspace_id as string)
    partners.push({
      id: r.id as string,
      workspaceId: r.workspace_id as string,
      partnerWorkspaceId: r.partner_workspace_id as string,
      partnerName: meta?.name ?? null,
      partnerType: meta?.type ?? null,
      relationshipType: rt,
      status: toStatus(r.status),
      firstInteractionAt: (r.first_interaction_at as string) ?? null,
      lastInteractionAt: (r.last_interaction_at as string) ?? null,
      interactionCount: Number(r.interaction_count ?? 0),
    })
  }

  // Group.
  const byGroup = new Map<PartnerGroupKey, PartnerRelationship[]>()
  for (const p of partners) {
    const g = GROUP_OF[p.relationshipType]
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g)!.push(p)
  }
  const groups: PartnerGroup[] = GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
    key: g,
    label: GROUP_LABEL[g],
    partners: byGroup.get(g)!,
  }))

  return { ready: true, groups, summary: summarise(partners) }
}

/** A single relationship edge + its summary stats. */
export async function getPartner(
  supabase: SupabaseClient,
  workspaceId: string,
  partnerId: string
): Promise<PartnerDetail> {
  if (!workspaceId || !partnerId) return { ready: true, relationship: null }
  const result = await listPartners(supabase, workspaceId)
  if (!result.ready) return { ready: false, relationship: null }
  for (const g of result.groups) {
    const hit = g.partners.find(
      (p) => p.id === partnerId || p.partnerWorkspaceId === partnerId
    )
    if (hit) return { ready: true, relationship: hit }
  }
  return { ready: true, relationship: null }
}

function emptySummary(): PartnerSummary {
  return {
    totalPartners: 0,
    suppliers: 0,
    operators: 0,
    customers: 0,
    marketplaceCounterparties: 0,
    activeCount: 0,
    pendingCount: 0,
    totalInteractions: 0,
  }
}

function summarise(partners: PartnerRelationship[]): PartnerSummary {
  const s = emptySummary()
  // Distinct partner workspaces (a counterparty can hold >1 relationship type).
  s.totalPartners = new Set(partners.map((p) => p.partnerWorkspaceId)).size
  for (const p of partners) {
    if (p.relationshipType === "supplier") s.suppliers += 1
    else if (p.relationshipType === "operator") s.operators += 1
    else if (p.relationshipType === "customer") s.customers += 1
    else s.marketplaceCounterparties += 1
    if (p.status === "active") s.activeCount += 1
    else if (p.status === "pending") s.pendingCount += 1
    s.totalInteractions += p.interactionCount
  }
  return s
}
