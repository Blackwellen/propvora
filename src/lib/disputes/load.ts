import "server-only"

// ============================================================================
// Shared REAL dispute loader — used by /api/disputes (PM/admin client hooks)
// AND by server pages (customer surfaces). Maps marketplace_disputes +
// dispute_actions (+ best-effort booking context) into the rich `Dispute`
// UI shape. Live data only.
// ============================================================================
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminIdentity } from "@/lib/admin/guard"
import {
  mapDispute,
  type Dispute,
  type RawDispute,
  type RawDisputeAction,
  type DisputeContext,
} from "@/features/bookings/disputes/data/map"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadContext(db: any, rows: RawDispute[]): Promise<Map<string, DisputeContext>> {
  const out = new Map<string, DisputeContext>()
  const bookingIds = Array.from(new Set(rows.map((r) => r.booking_id).filter(Boolean))) as string[]
  if (bookingIds.length === 0) return out
  try {
    const { data: bookings } = await db
      .from("bookings")
      .select("id, guest_name, guest_email, listing_id, marketplace_listings(title, city, hero_image_url)")
      .in("id", bookingIds)
    const byBooking = new Map<string, Record<string, unknown>>()
    for (const b of (bookings as Record<string, unknown>[]) ?? []) byBooking.set(b.id as string, b)
    for (const r of rows) {
      if (!r.booking_id) continue
      const b = byBooking.get(r.booking_id)
      if (!b) continue
      const listing = (b.marketplace_listings ?? {}) as Record<string, unknown>
      out.set(r.id, {
        booking_reference: `BK-${(r.booking_id as string).replace(/-/g, "").slice(0, 6).toUpperCase()}`,
        guest_name: (b.guest_name as string) || undefined,
        guest_email: (b.guest_email as string) || undefined,
        property_name: (listing.title as string) || undefined,
        property_location: (listing.city as string) || undefined,
        property_image: (listing.hero_image_url as string) || undefined,
      })
    }
  } catch {
    // best-effort
  }
  return out
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function attachActions(db: any, rows: RawDispute[], ctx: Map<string, DisputeContext>): Promise<Dispute[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const { data: actionRows } = await db.from("dispute_actions").select("*").in("dispute_id", ids).order("created_at", { ascending: true })
  const byDispute = new Map<string, RawDisputeAction[]>()
  for (const a of (actionRows as RawDisputeAction[]) ?? []) {
    const arr = byDispute.get(a.dispute_id) ?? []
    arr.push(a)
    byDispute.set(a.dispute_id, arr)
  }
  return rows.map((r) => mapDispute(r, byDispute.get(r.id) ?? [], ctx.get(r.id) ?? {}))
}

/** Every dispute the current caller is party to (admins see all when scope=all). */
export async function loadDisputesForUser(opts: { scopeAll?: boolean } = {}): Promise<{ items: Dispute[]; ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { items: [], ok: false }

  const admin = await getAdminIdentity()
  const db = createAdminClient()
  let rows: RawDispute[] = []
  try {
    if (admin && opts.scopeAll) {
      const { data } = await db.from("marketplace_disputes").select("*").order("created_at", { ascending: false })
      rows = (data as RawDispute[]) ?? []
    } else {
      const { data: memberships } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id)
      const wsIds = Array.from(new Set((memberships ?? []).map((m) => (m as { workspace_id: string }).workspace_id).filter(Boolean)))
      if (wsIds.length === 0) return { items: [], ok: true }
      const list = wsIds.map((id) => `"${id}"`).join(",")
      const { data } = await db
        .from("marketplace_disputes")
        .select("*")
        .or(`raised_by_workspace_id.in.(${list}),against_workspace_id.in.(${list}),workspace_id.in.(${list})`)
        .order("created_at", { ascending: false })
      rows = (data as RawDispute[]) ?? []
    }
  } catch {
    return { items: [], ok: true }
  }
  const ctx = await loadContext(db, rows)
  return { items: await attachActions(db, rows, ctx), ok: true }
}

/** A single dispute by id, authorised (admin or member of a party workspace). */
export async function loadDisputeForUser(id: string): Promise<{ dispute: Dispute | null; status: "ok" | "unauthenticated" | "forbidden" | "not-found" }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { dispute: null, status: "unauthenticated" }

  const db = createAdminClient()
  const { data: row } = await db.from("marketplace_disputes").select("*").eq("id", id).maybeSingle()
  if (!row) return { dispute: null, status: "not-found" }
  const dispute = row as RawDispute

  const admin = await getAdminIdentity()
  if (!admin) {
    const { data: memberships } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id)
    const wsIds = new Set((memberships ?? []).map((m) => (m as { workspace_id: string }).workspace_id))
    const parties = [dispute.workspace_id, dispute.raised_by_workspace_id, dispute.against_workspace_id].filter(Boolean) as string[]
    if (!parties.some((p) => wsIds.has(p))) return { dispute: null, status: "forbidden" }
  }

  const ctx = await loadContext(db, [dispute])
  const [mapped] = await attachActions(db, [dispute], ctx)
  return { dispute: mapped ?? null, status: "ok" }
}
