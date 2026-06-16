import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CustomerProfile,
  CustomerProfileInput,
  SavedListing,
  ListingSummary,
  CustomerBooking,
  CustomerOrder,
  CustomerThread,
} from "./types"

// ============================================================================
// Customer WORKSPACE data layer (P7).
//
// All helpers are workspace-scoped and 42P01/42703-tolerant: a missing table /
// column resolves to a safe empty / no-op result rather than throwing, so the
// UI degrades gracefully before/after migration.
//
// Isolation: every read is filtered by the customer's OWN workspace_id (or, for
// bookings, their workspace_id OR the account email they signed in with). RLS
// (is_customer_workspace_member) enforces this server-side too. The caller
// passes an authenticated SupabaseClient (server or browser).
// ============================================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/** True for schema-shape errors we tolerate (missing table / column). */
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703"
}

const LISTING_COLS =
  "id, title, company_name, listing_type, category, location, location_city, " +
  "currency, base_price_pence, price, price_unit, images, status"

function asListingSummary(row: unknown): ListingSummary | null {
  if (!row || typeof row !== "object") return null
  const r = row as Record<string, unknown>
  return {
    id: String(r.id ?? ""),
    title: (r.title as string) ?? null,
    company_name: (r.company_name as string) ?? null,
    listing_type: (r.listing_type as string) ?? null,
    category: (r.category as string) ?? null,
    location: (r.location as string) ?? null,
    location_city: (r.location_city as string) ?? null,
    currency: (r.currency as string) ?? "GBP",
    base_price_pence: (r.base_price_pence as number) ?? null,
    price: (r.price as number) ?? null,
    price_unit: (r.price_unit as string) ?? null,
    images: (r.images as string[]) ?? null,
    status: (r.status as string) ?? null,
  }
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function getCustomerProfile(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CustomerProfile | null> {
  if (!workspaceId) return null
  try {
    const { data, error } = await supabase
      .from("customer_profiles")
      .select("workspace_id, display_name, email, phone, preferences, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as CustomerProfile | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

export async function upsertCustomerProfile(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CustomerProfileInput
): Promise<CustomerProfile | null> {
  if (!workspaceId) return null
  const row = { workspace_id: workspaceId, ...input }
  try {
    const { data, error } = await supabase
      .from("customer_profiles")
      .upsert(row, { onConflict: "workspace_id" })
      .select("workspace_id, display_name, email, phone, preferences, created_at, updated_at")
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as CustomerProfile | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

// ── Saved listings (favourites) ──────────────────────────────────────────────

export async function listSavedListings(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SavedListing[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("customer_saved_listings")
      .select(`id, listing_id, created_at, listing:marketplace_listings(${LISTING_COLS})`)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id ?? ""),
        listing_id: String(row.listing_id ?? ""),
        created_at: String(row.created_at ?? ""),
        listing: asListingSummary(row.listing),
      }
    })
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Set of listing ids the customer has saved (for hydrating save buttons). */
export async function listSavedListingIds(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<string[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("customer_saved_listings")
      .select("listing_id")
      .eq("workspace_id", workspaceId)
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []).map((r) => String((r as { listing_id: string }).listing_id))
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

export async function saveListing(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string
): Promise<boolean> {
  if (!workspaceId || !listingId) return false
  try {
    const { error } = await supabase
      .from("customer_saved_listings")
      .upsert(
        { workspace_id: workspaceId, listing_id: listingId },
        { onConflict: "workspace_id,listing_id", ignoreDuplicates: true }
      )
    if (error && !tolerable(error)) throw error
    return !error
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}

export async function unsaveListing(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string
): Promise<boolean> {
  if (!workspaceId || !listingId) return false
  try {
    const { error } = await supabase
      .from("customer_saved_listings")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("listing_id", listingId)
    if (error && !tolerable(error)) throw error
    return !error
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}

// ── Bookings (the customer's own stays) ──────────────────────────────────────

const BOOKING_COLS =
  "id, listing_id, booking_listing_id, property_id, booking_ref, guest_name, guest_email, " +
  "check_in, check_out, nights, guests_count, currency, subtotal_pence, fees_pence, " +
  "deposit_pence, total_pence, status, payment_status, arrival_time, source, created_at, " +
  "booking_listing:booking_listings(title, slug)"

/** Flatten the embedded booking_listing join into listing_title/slug. */
function mapBooking(row: unknown): CustomerBooking {
  const r = (row ?? {}) as Record<string, unknown>
  const bl = r.booking_listing as { title?: string; slug?: string } | null
  return {
    ...(r as unknown as CustomerBooking),
    listing_title: bl?.title ?? null,
    listing_slug: bl?.slug ?? null,
  }
}

/**
 * The customer's stays. Honest scoping: matches EITHER bookings linked to their
 * customer workspace (customer_workspace_id) OR bookings made as a guest with
 * the email on their account. Never returns another customer's rows.
 */
export async function listCustomerBookings(
  supabase: SupabaseClient,
  workspaceId: string,
  accountEmail: string | null
): Promise<CustomerBooking[]> {
  if (!workspaceId) return []
  const ors: string[] = [`customer_workspace_id.eq.${workspaceId}`]
  if (accountEmail) ors.push(`guest_email.eq.${accountEmail}`)
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLS)
      .or(ors.join(","))
      .order("check_in", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []).map(mapBooking)
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

export async function getCustomerBooking(
  supabase: SupabaseClient,
  workspaceId: string,
  accountEmail: string | null,
  bookingId: string
): Promise<CustomerBooking | null> {
  if (!workspaceId || !bookingId) return null
  const ors: string[] = [`customer_workspace_id.eq.${workspaceId}`]
  if (accountEmail) ors.push(`guest_email.eq.${accountEmail}`)
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLS)
      .eq("id", bookingId)
      .or(ors.join(","))
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return data ? mapBooking(data) : null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Issues the customer has reported on a booking (RLS-scoped). Tolerant → []. */
export async function listCustomerBookingIssues(
  supabase: SupabaseClient,
  bookingId: string
): Promise<Array<{ id: string; category: string; severity: string; subject: string; status: string; created_at: string }>> {
  if (!bookingId) return []
  try {
    const { data, error } = await supabase
      .from("booking_issues")
      .select("id, category, severity, subject, status, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []) as Array<{ id: string; category: string; severity: string; subject: string; status: string; created_at: string }>
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** The customer's review for a booking, if any (RLS-scoped). Tolerant → null. */
export async function getCustomerBookingReview(
  supabase: SupabaseClient,
  bookingId: string
): Promise<{ id: string; rating: number; title: string | null; body: string | null } | null> {
  if (!bookingId) return null
  try {
    const { data, error } = await supabase
      .from("booking_reviews")
      .select("id, rating, title, body")
      .eq("booking_id", bookingId)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as { id: string; rating: number; title: string | null; body: string | null } | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

// ── Orders (buyer side of marketplace_transactions) ──────────────────────────

export async function listCustomerOrders(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CustomerOrder[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("marketplace_transactions")
      .select(
        `id, listing_id, transaction_type, gross_pence, platform_fee_pence, currency, status, created_at, listing:marketplace_listings(${LISTING_COLS})`
      )
      .eq("buyer_workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id ?? ""),
        listing_id: (row.listing_id as string) ?? null,
        transaction_type: (row.transaction_type as string) ?? null,
        gross_pence: (row.gross_pence as number) ?? null,
        platform_fee_pence: (row.platform_fee_pence as number) ?? null,
        currency: (row.currency as string) ?? "GBP",
        status: String(row.status ?? "pending"),
        created_at: String(row.created_at ?? ""),
        listing: asListingSummary(row.listing),
      }
    })
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

// ── Messages (the customer workspace's threads) ──────────────────────────────

export async function listCustomerThreads(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CustomerThread[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("message_threads")
      .select("id, title, type, updated_at, created_at")
      .eq("workspace_id", workspaceId)
      .or("archived.is.null,archived.eq.false")
      .order("updated_at", { ascending: false })
      .limit(100)
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    const threads = (data ?? []) as Record<string, unknown>[]
    if (threads.length === 0) return []

    // Best-effort last-message hydration (tolerant; threads still render without).
    const ids = threads.map((t) => String(t.id))
    const lastByThread = new Map<string, { content: string; sender: string; at: string }>()
    try {
      const { data: msgs } = await supabase
        .from("messages")
        .select("thread_id, content, sender_name, created_at")
        .in("thread_id", ids)
        .order("created_at", { ascending: false })
        .limit(400)
      for (const m of (msgs ?? []) as Record<string, unknown>[]) {
        const tid = String(m.thread_id)
        if (!lastByThread.has(tid)) {
          lastByThread.set(tid, {
            content: String(m.content ?? ""),
            sender: String(m.sender_name ?? ""),
            at: String(m.created_at ?? ""),
          })
        }
      }
    } catch {
      // tolerate missing messages table — threads still list.
    }

    return threads.map((t) => {
      const last = lastByThread.get(String(t.id))
      return {
        id: String(t.id),
        title: (t.title as string) ?? null,
        type: (t.type as string) ?? null,
        updated_at: (t.updated_at as string) ?? null,
        created_at: (t.created_at as string) ?? null,
        last_message: last?.content ?? null,
        last_sender: last?.sender ?? null,
        last_at: last?.at ?? null,
      }
    })
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}
