import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CustomerProfile,
  CustomerProfileInput,
  SavedListing,
  ListingSummary,
  CustomerBooking,
  CustomerOrder,
  CustomerThread,
  CustomerMessage,
  CustomerNotification,
  CustomerSavedSearch,
  CustomerListingDetail,
  CustomerLegalDoc,
  CustomerReceipt,
  CustomerStaySummary,
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

// ── Customer messaging (dedicated guest↔host threads — customer_depth) ───────
//
// These read/write the customer_message_threads / customer_messages tables whose
// RLS is anchored on the GUEST's customer workspace (is_customer_workspace_member),
// so a guest can actually compose + read their own conversations. The operator
// `message_threads` table (workspace_members-gated) is left untouched.

/** The guest's own threads, newest first. Tolerant → []. */
export async function listCustomerMessageThreads(
  supabase: SupabaseClient,
  customerWorkspaceId: string
): Promise<CustomerThread[]> {
  if (!customerWorkspaceId) return []
  try {
    const { data, error } = await supabase
      .from("customer_message_threads")
      .select(
        "id, subject, booking_id, last_message, last_sender, last_message_at, unread_for_customer, created_at, updated_at"
      )
      .eq("customer_workspace_id", customerWorkspaceId)
      .eq("archived", false)
      .order("updated_at", { ascending: false })
      .limit(100)
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id ?? ""),
        title: (row.subject as string) ?? null,
        type: null,
        updated_at: (row.updated_at as string) ?? null,
        created_at: (row.created_at as string) ?? null,
        last_message: (row.last_message as string) ?? null,
        last_sender: (row.last_sender as string) ?? null,
        last_at: (row.last_message_at as string) ?? null,
        booking_id: (row.booking_id as string) ?? null,
        unread: (row.unread_for_customer as number) ?? 0,
      }
    })
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

export async function getCustomerMessageThread(
  supabase: SupabaseClient,
  customerWorkspaceId: string,
  threadId: string
): Promise<CustomerThread | null> {
  if (!customerWorkspaceId || !threadId) return null
  try {
    const { data, error } = await supabase
      .from("customer_message_threads")
      .select(
        "id, subject, booking_id, last_message, last_sender, last_message_at, unread_for_customer, created_at, updated_at"
      )
      .eq("customer_workspace_id", customerWorkspaceId)
      .eq("id", threadId)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    if (!data) return null
    const row = data as Record<string, unknown>
    return {
      id: String(row.id ?? ""),
      title: (row.subject as string) ?? null,
      type: null,
      updated_at: (row.updated_at as string) ?? null,
      created_at: (row.created_at as string) ?? null,
      last_message: (row.last_message as string) ?? null,
      last_sender: (row.last_sender as string) ?? null,
      last_at: (row.last_message_at as string) ?? null,
      booking_id: (row.booking_id as string) ?? null,
      unread: (row.unread_for_customer as number) ?? 0,
    }
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

export async function listCustomerThreadMessages(
  supabase: SupabaseClient,
  customerWorkspaceId: string,
  threadId: string
): Promise<CustomerMessage[]> {
  if (!customerWorkspaceId || !threadId) return []
  try {
    const { data, error } = await supabase
      .from("customer_messages")
      .select("id, thread_id, sender_role, sender_name, body, created_at")
      .eq("customer_workspace_id", customerWorkspaceId)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id ?? ""),
        thread_id: String(row.thread_id ?? ""),
        sender_role: (row.sender_role as CustomerMessage["sender_role"]) ?? "customer",
        sender_name: (row.sender_name as string) ?? null,
        body: String(row.body ?? ""),
        created_at: String(row.created_at ?? ""),
      }
    })
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Messages on the thread for a given booking (empty if no thread yet). */
export async function listCustomerBookingMessages(
  supabase: SupabaseClient,
  customerWorkspaceId: string,
  bookingId: string
): Promise<CustomerMessage[]> {
  if (!customerWorkspaceId || !bookingId) return []
  try {
    const { data, error } = await supabase
      .from("customer_message_threads")
      .select("id")
      .eq("customer_workspace_id", customerWorkspaceId)
      .eq("booking_id", bookingId)
      .limit(1)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    const threadId = (data as { id?: string } | null)?.id
    if (!threadId) return []
    return listCustomerThreadMessages(supabase, customerWorkspaceId, threadId)
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Count of unread messages across the guest's threads. */
export async function countCustomerUnreadMessages(
  supabase: SupabaseClient,
  customerWorkspaceId: string
): Promise<number> {
  if (!customerWorkspaceId) return 0
  try {
    const { data, error } = await supabase
      .from("customer_message_threads")
      .select("unread_for_customer")
      .eq("customer_workspace_id", customerWorkspaceId)
      .eq("archived", false)
    if (error) {
      if (tolerable(error)) return 0
      throw error
    }
    return (data ?? []).reduce(
      (n, r) => n + Number((r as { unread_for_customer?: number }).unread_for_customer ?? 0),
      0
    )
  } catch (e) {
    if (tolerable(e)) return 0
    throw e
  }
}

// ── Customer notifications (notification centre — customer_depth) ────────────

export async function listCustomerNotifications(
  supabase: SupabaseClient,
  customerWorkspaceId: string,
  limit = 60
): Promise<CustomerNotification[]> {
  if (!customerWorkspaceId) return []
  try {
    const { data, error } = await supabase
      .from("customer_notifications")
      .select("id, kind, title, body, href, severity, entity_type, entity_id, read_at, created_at")
      .eq("customer_workspace_id", customerWorkspaceId)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id ?? ""),
        kind: String(row.kind ?? "general"),
        title: String(row.title ?? ""),
        body: (row.body as string) ?? null,
        href: (row.href as string) ?? null,
        severity: (row.severity as CustomerNotification["severity"]) ?? "info",
        entity_type: (row.entity_type as string) ?? null,
        entity_id: (row.entity_id as string) ?? null,
        read_at: (row.read_at as string) ?? null,
        created_at: String(row.created_at ?? ""),
      }
    })
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

export async function countCustomerUnreadNotifications(
  supabase: SupabaseClient,
  customerWorkspaceId: string
): Promise<number> {
  if (!customerWorkspaceId) return 0
  try {
    const { count, error } = await supabase
      .from("customer_notifications")
      .select("id", { count: "exact", head: true })
      .eq("customer_workspace_id", customerWorkspaceId)
      .is("read_at", null)
    if (error) {
      if (tolerable(error)) return 0
      throw error
    }
    return count ?? 0
  } catch (e) {
    if (tolerable(e)) return 0
    throw e
  }
}

// ── Saved searches (customer_depth) ──────────────────────────────────────────

export async function listCustomerSavedSearches(
  supabase: SupabaseClient,
  customerWorkspaceId: string
): Promise<CustomerSavedSearch[]> {
  if (!customerWorkspaceId) return []
  try {
    const { data, error } = await supabase
      .from("customer_saved_searches")
      .select("id, label, query, created_at")
      .eq("customer_workspace_id", customerWorkspaceId)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id ?? ""),
        label: String(row.label ?? ""),
        query: (row.query as Record<string, unknown>) ?? {},
        created_at: String(row.created_at ?? ""),
      }
    })
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

// ── Trip detail extras: listing detail, amenities, house rules, legal ────────

const SPLIT_AMENITIES = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean)
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v === true || (typeof v === "string" && v.length > 0))
      .map(([k]) => k)
  }
  return []
}

/** Rich listing detail for a booking's stay (booking_listings + amenities). */
export async function getCustomerListingDetail(
  supabase: SupabaseClient,
  listingId: string | null
): Promise<CustomerListingDetail | null> {
  if (!listingId) return null
  try {
    const { data, error } = await supabase
      .from("booking_listings")
      .select(
        "id, title, summary, description, listing_type, max_guests, bedrooms, beds, bathrooms, amenities, house_rules, check_in_window, checkout_time, cancellation_policy, country_code, timezone"
      )
      .eq("id", listingId)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    if (!data) return null
    const r = data as Record<string, unknown>

    // Structured amenity rows (optional richer source).
    let amenities = SPLIT_AMENITIES(r.amenities)
    try {
      const { data: rows } = await supabase
        .from("booking_listing_amenities")
        .select("amenity_key")
        .eq("listing_id", listingId)
      const fromRows = (rows ?? []).map((x) => String((x as { amenity_key?: string }).amenity_key)).filter(Boolean)
      if (fromRows.length > 0) amenities = Array.from(new Set([...amenities, ...fromRows]))
    } catch {
      // tolerate — fall back to the jsonb column.
    }

    return {
      id: String(r.id ?? ""),
      title: (r.title as string) ?? null,
      summary: (r.summary as string) ?? null,
      description: (r.description as string) ?? null,
      listing_type: (r.listing_type as string) ?? null,
      max_guests: (r.max_guests as number) ?? null,
      bedrooms: (r.bedrooms as number) ?? null,
      beds: (r.beds as number) ?? null,
      bathrooms: (r.bathrooms as number) ?? null,
      amenities,
      house_rules: SPLIT_AMENITIES(r.house_rules),
      check_in_window: (r.check_in_window as string) ?? null,
      checkout_time: (r.checkout_time as string) ?? null,
      cancellation_policy: (r.cancellation_policy as string) ?? null,
      country_code: (r.country_code as string) ?? null,
      timezone: (r.timezone as string) ?? null,
    }
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Guest-facing legal docs + whether this booking has accepted each version. */
export async function listCustomerLegalDocs(
  supabase: SupabaseClient,
  bookingId: string
): Promise<CustomerLegalDoc[]> {
  try {
    const { data: docs, error } = await supabase
      .from("booking_legal_documents")
      .select("slug, title, version, jurisdiction, audience")
      .in("audience", ["guest", "both"])
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    const accepted = new Map<string, string>()
    try {
      const { data: accs } = await supabase
        .from("booking_legal_acceptances")
        .select("document_type, document_version, accepted, created_at")
        .eq("booking_id", bookingId)
      for (const a of (accs ?? []) as Record<string, unknown>[]) {
        if (a.accepted) accepted.set(String(a.document_type), String(a.created_at ?? ""))
      }
    } catch {
      // tolerate — show all as not-yet-accepted.
    }
    return (docs ?? []).map((d) => {
      const row = d as Record<string, unknown>
      const slug = String(row.slug ?? "")
      const at = accepted.get(slug) ?? accepted.get(String(row.title ?? "")) ?? null
      return {
        slug,
        title: String(row.title ?? ""),
        version: String(row.version ?? ""),
        jurisdiction: (row.jurisdiction as string) ?? null,
        accepted: at != null,
        accepted_at: at,
      }
    })
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

// ── Payments / receipts + stays summary (derived from bookings) ──────────────

/** Receipts for the guest's bookings (paid/refunded/deposit), newest first. */
export async function listCustomerReceipts(
  supabase: SupabaseClient,
  workspaceId: string,
  accountEmail: string | null
): Promise<CustomerReceipt[]> {
  const bookings = await listCustomerBookings(supabase, workspaceId, accountEmail)
  return bookings.map((b) => ({
    id: b.id,
    booking_ref: b.booking_ref,
    booking_id: b.id,
    title: b.listing_title ?? null,
    check_in: b.check_in,
    check_out: b.check_out,
    total_pence: b.total_pence,
    deposit_pence: b.deposit_pence,
    currency: b.currency,
    status: b.status,
    payment_status: b.payment_status,
    created_at: b.created_at,
  }))
}

/** Compact stays rollup (nights, spend, by-month) for dashboard/profile. */
export async function getCustomerStaySummary(
  supabase: SupabaseClient,
  workspaceId: string,
  accountEmail: string | null
): Promise<CustomerStaySummary> {
  const bookings = await listCustomerBookings(supabase, workspaceId, accountEmail)
  const live = bookings.filter((b) => !/(cancelled|canceled|expired|refunded)/i.test(b.status))
  const now = Date.now()
  const currency = live[0]?.currency ?? "GBP"

  let totalNights = 0
  let totalSpend = 0
  let completed = 0
  let upcoming = 0
  const monthMap = new Map<string, { nights: number; spend: number }>()

  for (const b of live) {
    const nights = b.nights ?? 0
    const spend = b.total_pence ?? 0
    totalNights += nights
    totalSpend += spend
    if (b.check_in && Date.parse(b.check_in) >= now) upcoming += 1
    if (/(completed|checked_out)/i.test(b.status)) completed += 1
    if (b.check_in) {
      const d = new Date(b.check_in)
      if (!Number.isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const m = monthMap.get(key) ?? { nights: 0, spend: 0 }
        m.nights += nights
        m.spend += spend
        monthMap.set(key, m)
      }
    }
  }

  const by_month = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, v]) => ({ month, nights: v.nights, spend_pence: v.spend }))

  return {
    total_stays: live.length,
    completed_stays: completed,
    upcoming_stays: upcoming,
    total_nights: totalNights,
    total_spend_pence: totalSpend,
    currency,
    by_month,
  }
}

// ── Write helpers (called from server actions; RLS enforces ownership) ────────

/**
 * Find-or-create a guest↔host thread for a booking, then append a message.
 * Returns the thread id. All writes are RLS-gated to the guest's workspace.
 */
export async function postCustomerMessage(
  supabase: SupabaseClient,
  customerWorkspaceId: string,
  args: {
    threadId?: string | null
    bookingId?: string | null
    hostWorkspaceId?: string | null
    subject?: string | null
    body: string
    senderName?: string | null
    senderId?: string | null
  }
): Promise<string | null> {
  if (!customerWorkspaceId || !args.body.trim()) return null
  let threadId = args.threadId ?? null

  // Resolve an existing booking thread, or create one.
  if (!threadId && args.bookingId) {
    const { data: existing } = await supabase
      .from("customer_message_threads")
      .select("id")
      .eq("customer_workspace_id", customerWorkspaceId)
      .eq("booking_id", args.bookingId)
      .limit(1)
      .maybeSingle()
    threadId = (existing as { id?: string } | null)?.id ?? null
  }

  if (!threadId) {
    const { data: created, error } = await supabase
      .from("customer_message_threads")
      .insert({
        customer_workspace_id: customerWorkspaceId,
        host_workspace_id: args.hostWorkspaceId ?? null,
        booking_id: args.bookingId ?? null,
        subject: args.subject ?? null,
        created_by: args.senderId ?? null,
      })
      .select("id")
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    threadId = (created as { id?: string } | null)?.id ?? null
  }
  if (!threadId) return null

  const { error: msgErr } = await supabase.from("customer_messages").insert({
    thread_id: threadId,
    customer_workspace_id: customerWorkspaceId,
    sender_role: "customer",
    sender_id: args.senderId ?? null,
    sender_name: args.senderName ?? null,
    body: args.body.trim(),
    read_by_customer: true,
  })
  if (msgErr && !tolerable(msgErr)) throw msgErr

  // Update the thread preview (best-effort).
  await supabase
    .from("customer_message_threads")
    .update({
      last_message: args.body.trim().slice(0, 280),
      last_sender: args.senderName ?? "You",
      last_message_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("customer_workspace_id", customerWorkspaceId)

  return threadId
}

/** Mark every notification in the guest's workspace as read. */
export async function markAllCustomerNotificationsRead(
  supabase: SupabaseClient,
  customerWorkspaceId: string
): Promise<boolean> {
  if (!customerWorkspaceId) return false
  try {
    const { error } = await supabase
      .from("customer_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("customer_workspace_id", customerWorkspaceId)
      .is("read_at", null)
    if (error && !tolerable(error)) throw error
    return !error
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}

/** Mark a single notification read. */
export async function markCustomerNotificationRead(
  supabase: SupabaseClient,
  customerWorkspaceId: string,
  id: string
): Promise<boolean> {
  if (!customerWorkspaceId || !id) return false
  try {
    const { error } = await supabase
      .from("customer_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("customer_workspace_id", customerWorkspaceId)
      .eq("id", id)
    if (error && !tolerable(error)) throw error
    return !error
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}

/** Save a stay search the guest can re-run. */
export async function createCustomerSavedSearch(
  supabase: SupabaseClient,
  customerWorkspaceId: string,
  label: string,
  query: Record<string, unknown>
): Promise<boolean> {
  if (!customerWorkspaceId || !label.trim()) return false
  try {
    const { error } = await supabase.from("customer_saved_searches").insert({
      customer_workspace_id: customerWorkspaceId,
      label: label.trim(),
      query,
    })
    if (error && !tolerable(error)) throw error
    return !error
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}

export async function deleteCustomerSavedSearch(
  supabase: SupabaseClient,
  customerWorkspaceId: string,
  id: string
): Promise<boolean> {
  if (!customerWorkspaceId || !id) return false
  try {
    const { error } = await supabase
      .from("customer_saved_searches")
      .delete()
      .eq("customer_workspace_id", customerWorkspaceId)
      .eq("id", id)
    if (error && !tolerable(error)) throw error
    return !error
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}

// ── Workspace search (bookings / messages / documents) ───────────────────────

export interface CustomerSearchResults {
  bookings: { id: string; title: string; sub: string; href: string }[]
  messages: { id: string; title: string; sub: string; href: string }[]
  documents: { id: string; title: string; sub: string; href: string }[]
}

/** Search across the guest's bookings, message threads and booking documents. */
export async function searchCustomerWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  accountEmail: string | null,
  term: string
): Promise<CustomerSearchResults> {
  const q = term.trim().toLowerCase()
  const empty: CustomerSearchResults = { bookings: [], messages: [], documents: [] }
  if (!q) return empty

  const [bookings, threads] = await Promise.all([
    listCustomerBookings(supabase, workspaceId, accountEmail),
    listCustomerMessageThreads(supabase, workspaceId),
  ])

  const bookingMatches = bookings
    .filter((b) =>
      [b.listing_title, b.booking_ref, b.guest_name, b.status].some((v) => (v ?? "").toLowerCase().includes(q))
    )
    .slice(0, 12)
    .map((b) => ({
      id: b.id,
      title: b.listing_title ?? (b.nights ? `${b.nights} night stay` : "Stay"),
      sub: `${b.booking_ref ? `${b.booking_ref} · ` : ""}${b.status}`,
      href: `/user/bookings/${b.id}`,
    }))

  const messageMatches = threads
    .filter((t) => [t.title, t.last_message].some((v) => (v ?? "").toLowerCase().includes(q)))
    .slice(0, 12)
    .map((t) => ({
      id: t.id,
      title: t.title ?? "Conversation",
      sub: t.last_message ?? "",
      href: `/user/messages/${t.id}`,
    }))

  // Documents: guest legal docs across the matched/most-recent booking.
  let documentMatches: CustomerSearchResults["documents"] = []
  const firstBooking = bookings[0]
  if (firstBooking) {
    const docs = await listCustomerLegalDocs(supabase, firstBooking.id)
    documentMatches = docs
      .filter((d) => d.title.toLowerCase().includes(q))
      .slice(0, 12)
      .map((d) => ({
        id: d.slug,
        title: d.title,
        sub: `v${d.version}${d.jurisdiction ? ` · ${d.jurisdiction}` : ""}`,
        href: `/user/bookings/${firstBooking.id}`,
      }))
  }

  return { bookings: bookingMatches, messages: messageMatches, documents: documentMatches }
}

/**
 * Report an issue on a booking. The guest's authenticated client (`supabase`)
 * is used only to PROVE the guest is allowed to see the booking (RLS); the
 * actual write is performed with a SERVICE-role client (`writer`) because
 * booking_issues INSERT is operator-workspace-gated and has no guest INSERT
 * policy (we deliberately do NOT widen the operator RLS). The guest never
 * supplies a workspace id, so no cross-workspace write is possible.
 */
export async function createCustomerBookingIssue(
  supabase: SupabaseClient,
  writer: SupabaseClient,
  workspaceId: string,
  accountEmail: string | null,
  args: { bookingId: string; category: string; severity: string; subject: string; detail: string; reportedBy?: string | null; photoUrls?: string[] }
): Promise<boolean> {
  // Ownership gate: the guest must be able to read this booking under RLS.
  const booking = await getCustomerBooking(supabase, workspaceId, accountEmail, args.bookingId)
  if (!booking) return false

  // Resolve the operator workspace that owns the booking (service-role read).
  let opWorkspaceId: string | null = null
  try {
    const { data } = await writer
      .from("bookings")
      .select("workspace_id")
      .eq("id", args.bookingId)
      .maybeSingle()
    opWorkspaceId = (data as { workspace_id?: string } | null)?.workspace_id ?? null
  } catch {
    opWorkspaceId = null
  }
  if (!opWorkspaceId) return false

  const { error } = await writer.from("booking_issues").insert({
    booking_id: args.bookingId,
    workspace_id: opWorkspaceId,
    category: args.category,
    severity: args.severity,
    subject: args.subject,
    detail: args.detail,
    status: "open",
    reported_by: args.reportedBy ?? "guest",
    ...(args.photoUrls?.length ? { photo_urls: args.photoUrls } : {}),
  })
  if (error) throw error
  return true
}
