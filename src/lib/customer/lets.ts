import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  LetProperty, Viewing, ViewingStatus, Application, ApplicationStatus,
  Offer, OfferStatus, Tenancy, TenancyStatus,
} from "@/features/customer/data/lets"

/**
 * Customer "Lets" (long-term rentals) data layer — RLS-scoped reads from the live
 * let_properties / customer_let_* / customer_tenancy_* tables, mapped to the shapes
 * the Lets UI already consumes. Mirrors src/lib/customer/data.ts (bookings).
 *
 * Tolerant: missing tables/columns → empty result (the UI shows honest empty states).
 * Rich display fields the schema doesn't have dedicated columns for (agent, transport,
 * holding deposit, move-in date, credit score, …) are read from metadata_json.
 */

const PLACEHOLDER = "/property-types/holiday.jpg"

function tolerable(e: unknown): boolean {
  const c = (e as { code?: string } | null)?.code
  return c === "42P01" || c === "42703" || c === "PGRST205" || c === "PGRST200"
}
function meta(row: Record<string, unknown>): Record<string, unknown> {
  return (row.metadata_json as Record<string, unknown> | null) ?? {}
}
function str(v: unknown, fallback = ""): string { return typeof v === "string" ? v : fallback }
function num(v: unknown, fallback = 0): number { return typeof v === "number" ? v : fallback }
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) } catch { return "—" }
}

// ── let_properties join ───────────────────────────────────────────────────────
interface LetPropRow {
  id: string; slug: string | null; title: string | null; city: string | null
  postcode: string | null; region: string | null; beds: number | null
  bathrooms: number | null; monthly_rent_pence: number | null; deposit_pence: number | null
  available_from: string | null; property_type: string | null; metadata_json: Record<string, unknown> | null
}
const LETPROP_COLS = "id, slug, title, city, postcode, region, beds, bathrooms, monthly_rent_pence, deposit_pence, available_from, property_type, is_published, metadata_json"

function propLocation(p: LetPropRow | null): string {
  if (!p) return "—"
  return [p.city, p.postcode].filter(Boolean).join(", ") || p.region || "—"
}
function propImage(p: LetPropRow | null): string {
  const m = p ? meta(p as unknown as Record<string, unknown>) : {}
  return str(m.image) || PLACEHOLDER
}

async function loadLetProps(supabase: SupabaseClient, ids: string[]): Promise<Map<string, LetPropRow>> {
  const map = new Map<string, LetPropRow>()
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return map
  try {
    const { data } = await supabase.from("let_properties").select(LETPROP_COLS).in("id", unique)
    for (const p of (data as LetPropRow[] | null) ?? []) map.set(p.id, p)
  } catch { /* tolerate */ }
  return map
}

// ── Recommended lets (public, published) ──────────────────────────────────────
export async function listRecommendedLets(supabase: SupabaseClient): Promise<LetProperty[]> {
  try {
    const { data, error } = await supabase
      .from("let_properties").select(LETPROP_COLS).eq("is_published", true)
      .order("created_at", { ascending: false }).limit(12)
    if (error) { if (tolerable(error)) return []; throw error }
    return ((data as LetPropRow[] | null) ?? []).map((p) => ({
      id: p.slug ?? p.id,
      title: p.title ?? "Rental property",
      location: propLocation(p),
      image: propImage(p),
      rentPence: num(p.monthly_rent_pence),
      beds: num(p.beds),
      baths: num(p.bathrooms),
      furnished: /furnished/i.test(str(p.property_type)) || meta(p as unknown as Record<string, unknown>).furnished === true,
      available: p.available_from ? `Available ${fmtDate(p.available_from)}` : "Available now",
    }))
  } catch (e) { if (tolerable(e)) return []; throw e }
}

export async function getLet(supabase: SupabaseClient, idOrSlug: string): Promise<LetProperty | null> {
  try {
    const { data } = await supabase.from("let_properties").select(LETPROP_COLS)
      .or(`slug.eq.${idOrSlug},id.eq.${idOrSlug}`).maybeSingle()
    const p = data as LetPropRow | null
    if (!p) return null
    return {
      id: p.slug ?? p.id, title: p.title ?? "Rental property", location: propLocation(p),
      image: propImage(p), rentPence: num(p.monthly_rent_pence), beds: num(p.beds), baths: num(p.bathrooms),
      furnished: /furnished/i.test(str(p.property_type)) || meta(p as unknown as Record<string, unknown>).furnished === true,
      available: p.available_from ? `Available ${fmtDate(p.available_from)}` : "Available now",
    }
  } catch { return null }
}

// ── Viewings ──────────────────────────────────────────────────────────────────
const VIEWING_STATUS: Record<string, ViewingStatus> = {
  requested: "Upcoming", upcoming: "Upcoming", confirmed: "Confirmed", completed: "Completed",
  reschedule_requested: "Reschedule requested", cancelled: "Cancelled", canceled: "Cancelled",
}
export async function listViewings(supabase: SupabaseClient): Promise<Viewing[]> {
  try {
    const { data, error } = await supabase
      .from("customer_let_viewings")
      .select("id, let_property_id, requested_for, viewing_status, metadata_json")
      .neq("status", "removed").order("requested_for", { ascending: false }).limit(100)
    if (error) { if (tolerable(error)) return []; throw error }
    const rows = (data as Record<string, unknown>[] | null) ?? []
    const props = await loadLetProps(supabase, rows.map((r) => str(r.let_property_id)))
    return rows.map((r) => {
      const p = props.get(str(r.let_property_id)) ?? null
      const m = meta(r)
      const when = r.requested_for as string | null
      return {
        id: str(r.id), property: p?.title ?? str(m.property, "Viewing"), location: propLocation(p),
        image: propImage(p), agent: str(m.agent, "Lettings team"),
        date: fmtDate(when), time: when ? new Date(when).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
        status: VIEWING_STATUS[str(r.viewing_status).toLowerCase()] ?? "Upcoming",
        transport: str(m.transport, "—"), access: str(m.access, "Meet agent on arrival"),
      }
    })
  } catch (e) { if (tolerable(e)) return []; throw e }
}
export async function getViewing(supabase: SupabaseClient, id: string): Promise<Viewing | null> {
  return (await listViewings(supabase)).find((v) => v.id === id) ?? null
}

// ── Applications ──────────────────────────────────────────────────────────────
const APP_STATUS: Record<string, ApplicationStatus> = {
  draft: "Draft", submitted: "Submitted", under_review: "Under review", in_review: "Under review",
  approved: "Approved", declined: "Declined", rejected: "Declined",
}
export async function listApplications(supabase: SupabaseClient): Promise<Application[]> {
  try {
    const { data, error } = await supabase
      .from("customer_let_applications")
      .select("id, let_property_id, application_status, created_at, metadata_json")
      .neq("status", "removed").order("created_at", { ascending: false }).limit(100)
    if (error) { if (tolerable(error)) return []; throw error }
    const rows = (data as Record<string, unknown>[] | null) ?? []
    const props = await loadLetProps(supabase, rows.map((r) => str(r.let_property_id)))
    return rows.map((r) => {
      const p = props.get(str(r.let_property_id)) ?? null
      const m = meta(r)
      const status = APP_STATUS[str(r.application_status).toLowerCase()] ?? "Draft"
      return {
        id: str(r.id), property: p?.title ?? str(m.property, "Application"), location: propLocation(p),
        image: propImage(p), rentPence: num(p?.monthly_rent_pence) || num(m.rentPence),
        status, submitted: status === "Draft" ? "—" : fmtDate(str(r.created_at)),
        progressPct: num(m.progressPct, status === "Draft" ? 45 : 100),
        score: num(m.score), affordabilityPct: num(m.affordabilityPct),
        moveIn: str(m.moveIn, "—"),
      }
    })
  } catch (e) { if (tolerable(e)) return []; throw e }
}
export async function getApplication(supabase: SupabaseClient, id: string): Promise<Application | null> {
  return (await listApplications(supabase)).find((a) => a.id === id) ?? null
}

// ── Offers ────────────────────────────────────────────────────────────────────
const OFFER_STATUS: Record<string, OfferStatus> = {
  open: "Open", submitted: "Open", counter: "Counter offer", counter_offer: "Counter offer",
  accepted: "Accepted", expired: "Expired", declined: "Expired",
}
export async function listOffers(supabase: SupabaseClient): Promise<Offer[]> {
  try {
    const { data, error } = await supabase
      .from("customer_let_offers")
      .select("id, let_property_id, offer_amount_pence, offer_status, metadata_json")
      .neq("status", "removed").order("created_at", { ascending: false }).limit(100)
    if (error) { if (tolerable(error)) return []; throw error }
    const rows = (data as Record<string, unknown>[] | null) ?? []
    const props = await loadLetProps(supabase, rows.map((r) => str(r.let_property_id)))
    return rows.map((r) => {
      const p = props.get(str(r.let_property_id)) ?? null
      const m = meta(r)
      return {
        id: str(r.id), property: p?.title ?? str(m.property, "Offer"), location: propLocation(p),
        image: propImage(p), rentOfferedPence: num(r.offer_amount_pence),
        askingPence: num(p?.monthly_rent_pence) || num(m.askingPence) || num(r.offer_amount_pence),
        status: OFFER_STATUS[str(r.offer_status).toLowerCase()] ?? "Open",
        moveIn: str(m.moveIn, "—"), tenancyMonths: num(m.tenancyMonths, 12),
        holdingDepositPence: num(m.holdingDepositPence), furnished: m.furnished === true,
      }
    })
  } catch (e) { if (tolerable(e)) return []; throw e }
}
export async function getOffer(supabase: SupabaseClient, id: string): Promise<Offer | null> {
  return (await listOffers(supabase)).find((o) => o.id === id) ?? null
}

// ── Tenancies ─────────────────────────────────────────────────────────────────
const TENANCY_STATUS: Record<string, TenancyStatus> = {
  active: "Active", upcoming: "Upcoming", pending: "Upcoming", notice_given: "Notice given", ended: "Notice given",
}
function termMonths(start: string | null, end: string | null): number {
  if (!start || !end) return 12
  try {
    const s = new Date(start), e = new Date(end)
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  } catch { return 12 }
}
export async function listTenancies(supabase: SupabaseClient): Promise<Tenancy[]> {
  try {
    const { data, error } = await supabase
      .from("customer_tenancies")
      .select("id, let_property_id, rent_pence, deposit_pence, start_date, end_date, status, metadata_json")
      .neq("status", "removed").order("start_date", { ascending: false }).limit(100)
    if (error) { if (tolerable(error)) return []; throw error }
    const rows = (data as Record<string, unknown>[] | null) ?? []
    const props = await loadLetProps(supabase, rows.map((r) => str(r.let_property_id)))

    // Next payment per tenancy (earliest unpaid scheduled rent).
    const nextPay = new Map<string, string>()
    try {
      const ids = rows.map((r) => str(r.id))
      if (ids.length) {
        const { data: sched } = await supabase
          .from("customer_tenancy_rent_schedule")
          .select("customer_tenancy_id, due_date, payment_status")
          .in("customer_tenancy_id", ids).neq("payment_status", "paid")
          .order("due_date", { ascending: true })
        for (const s of (sched as Record<string, unknown>[] | null) ?? []) {
          const tid = str(s.customer_tenancy_id)
          if (!nextPay.has(tid)) nextPay.set(tid, fmtDate(str(s.due_date)))
        }
      }
    } catch { /* tolerate */ }

    return rows.map((r) => {
      const p = props.get(str(r.let_property_id)) ?? null
      const m = meta(r)
      return {
        id: str(r.id), property: p?.title ?? str(m.property, "Tenancy"), location: propLocation(p),
        image: propImage(p), rentPence: num(r.rent_pence), nextPaymentDate: nextPay.get(str(r.id)) ?? "—",
        status: TENANCY_STATUS[str(r.status).toLowerCase()] ?? "Active",
        moveIn: fmtDate(str(r.start_date)), landlord: str(m.landlord, "Your landlord"),
        depositPence: num(r.deposit_pence), termMonths: termMonths(str(r.start_date), str(r.end_date)),
        startDate: fmtDate(str(r.start_date)),
      }
    })
  } catch (e) { if (tolerable(e)) return []; throw e }
}
export async function getTenancy(supabase: SupabaseClient, id: string): Promise<Tenancy | null> {
  return (await listTenancies(supabase)).find((t) => t.id === id) ?? null
}
