// ============================================================================
// Marketplace listings — typed, workspace-scoped CRUD over `marketplace_listings`
// and its child tables (media / availability / pricing). Part of P2 (the data
// model + commerce kernel).
//
// EVERYTHING here is workspace-scoped and 42P01-tolerant: a missing table (cold
// or migrating DB) never throws to the caller — operations return a structured
// { data, error } result instead. RLS in the DB is the real isolation boundary;
// the explicit workspace_id filters here are defence-in-depth.
//
// GATING: publishing a listing is gated by the CALLER via
// `gateMarketplacePublishing` from `@/lib/billing/gates` (entitlement-only — v2
// is core, no feature flags). This module does NOT re-implement that gate; it
// only flips status to 'published'. Callers MUST check the gate first.
//
// All money is integer pence (`base_price_pence`).
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import type { MarketplaceTransactionType } from "./fees"

/** Lifecycle states for a listing (mirrors the DB CHECK; legacy states omitted). */
export type ListingStatus = "draft" | "published" | "paused" | "archived"

/** A marketplace listing row (P2 commerce columns). */
export interface MarketplaceListing {
  id: string
  workspace_id: string
  title: string | null
  description: string | null
  transaction_type: MarketplaceTransactionType | null
  category: string | null
  status: string
  country_code: string | null
  currency: string
  base_price_pence: number | null
  pricing_model: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  property_id: string | null
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/** A listing media row. */
export interface MarketplaceListingMedia {
  id: string
  listing_id: string
  r2_key: string | null
  url: string | null
  kind: string | null
  sort_order: number
  created_at: string
}

/** Uniform tolerant result. `error` is a short code/message, never a throw. */
export interface Result<T> {
  data: T | null
  error: string | null
}

/** Columns selected for a listing read (the P2 commerce surface). */
const LISTING_COLUMNS =
  "id, workspace_id, title, description, transaction_type, category, status, " +
  "country_code, currency, base_price_pence, pricing_model, location, latitude, " +
  "longitude, property_id, published_at, created_by, created_at, updated_at"

/** True when an error is "relation does not exist" (migration not applied). */
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

/** Normalise any thrown/returned error into a short string (tolerant layer). */
function toMessage(err: unknown): string {
  if (isMissingTable(err)) return "marketplace_unavailable"
  const e = err as { message?: string } | null
  return e?.message ?? "marketplace_error"
}

/** Fields a caller may set when creating a listing. */
export interface CreateListingInput {
  title: string
  description?: string | null
  transactionType?: MarketplaceTransactionType | null
  category?: string | null
  countryCode?: string | null
  currency?: string
  basePricePence?: number | null
  pricingModel?: string | null
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  propertyId?: string | null
  createdBy?: string | null
}

/** Fields a caller may patch on an existing listing (all optional). */
export type UpdateListingInput = Partial<
  Omit<CreateListingInput, "createdBy"> & { status: ListingStatus }
>

/**
 * Create a listing for `workspaceId` in 'draft' status. Money in integer pence.
 * Tolerant: returns { data:null, error } rather than throwing.
 */
export async function createListing(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CreateListingInput
): Promise<Result<MarketplaceListing>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!input.title?.trim()) return { data: null, error: "title_required" }
  try {
    const row = {
      workspace_id: workspaceId,
      title: input.title.trim(),
      description: input.description ?? null,
      transaction_type: input.transactionType ?? null,
      category: input.category ?? null,
      country_code: input.countryCode ?? null,
      currency: input.currency ?? "GBP",
      base_price_pence:
        input.basePricePence == null ? null : Math.trunc(input.basePricePence),
      pricing_model: input.pricingModel ?? null,
      location: input.location ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      property_id: input.propertyId ?? null,
      created_by: input.createdBy ?? null,
      status: "draft",
    }
    const { data, error } = await supabase
      .from("marketplace_listings")
      .insert(row)
      .select(LISTING_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as unknown as MarketplaceListing, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/**
 * Patch an existing listing. Workspace-scoped (cannot touch another workspace's
 * row even before RLS). Status may be set directly, but prefer the named
 * lifecycle helpers (`publishListing` etc.). Tolerant.
 */
export async function updateListing(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string,
  patch: UpdateListingInput
): Promise<Result<MarketplaceListing>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!listingId) return { data: null, error: "listing_required" }
  try {
    const update: Record<string, unknown> = {}
    if (patch.title !== undefined) update.title = patch.title
    if (patch.description !== undefined) update.description = patch.description
    if (patch.transactionType !== undefined) update.transaction_type = patch.transactionType
    if (patch.category !== undefined) update.category = patch.category
    if (patch.countryCode !== undefined) update.country_code = patch.countryCode
    if (patch.currency !== undefined) update.currency = patch.currency
    if (patch.basePricePence !== undefined)
      update.base_price_pence = patch.basePricePence == null ? null : Math.trunc(patch.basePricePence)
    if (patch.pricingModel !== undefined) update.pricing_model = patch.pricingModel
    if (patch.location !== undefined) update.location = patch.location
    if (patch.latitude !== undefined) update.latitude = patch.latitude
    if (patch.longitude !== undefined) update.longitude = patch.longitude
    if (patch.propertyId !== undefined) update.property_id = patch.propertyId
    if (patch.status !== undefined) update.status = patch.status
    if (Object.keys(update).length === 0) return { data: null, error: "no_changes" }

    const { data, error } = await supabase
      .from("marketplace_listings")
      .update(update)
      .eq("id", listingId)
      .eq("workspace_id", workspaceId)
      .select(LISTING_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as unknown as MarketplaceListing, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** Internal: flip a listing to a lifecycle status, workspace-scoped & tolerant. */
async function setStatus(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string,
  status: ListingStatus,
  extra: Record<string, unknown> = {}
): Promise<Result<MarketplaceListing>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!listingId) return { data: null, error: "listing_required" }
  try {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .update({ status, ...extra })
      .eq("id", listingId)
      .eq("workspace_id", workspaceId)
      .select(LISTING_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as unknown as MarketplaceListing, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/**
 * Publish a listing (status → 'published', stamps published_at).
 *
 * GATING: the caller MUST first pass `gateMarketplacePublishing` from
 * `@/lib/billing/gates` — this helper does not re-check entitlement.
 */
export function publishListing(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string
): Promise<Result<MarketplaceListing>> {
  return setStatus(supabase, workspaceId, listingId, "published", {
    published_at: new Date().toISOString(),
  })
}

/** Pause a published listing (status → 'paused'); reversible. */
export function pauseListing(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string
): Promise<Result<MarketplaceListing>> {
  return setStatus(supabase, workspaceId, listingId, "paused")
}

/** Archive a listing (status → 'archived'); terminal soft state. */
export function archiveListing(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string
): Promise<Result<MarketplaceListing>> {
  return setStatus(supabase, workspaceId, listingId, "archived")
}

/** Attach a media row (R2 object) to a listing. Workspace-scoped via parent. */
export async function attachListingMedia(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string,
  media: { r2Key?: string | null; url?: string | null; kind?: string | null; sortOrder?: number }
): Promise<Result<MarketplaceListingMedia>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!listingId) return { data: null, error: "listing_required" }
  try {
    // Verify the listing belongs to the workspace before attaching (defence in
    // depth on top of RLS).
    const { data: owner, error: ownerErr } = await supabase
      .from("marketplace_listings")
      .select("id")
      .eq("id", listingId)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (ownerErr) return { data: null, error: toMessage(ownerErr) }
    if (!owner) return { data: null, error: "listing_not_found" }

    const { data, error } = await supabase
      .from("marketplace_listing_media")
      .insert({
        listing_id: listingId,
        r2_key: media.r2Key ?? null,
        url: media.url ?? null,
        kind: media.kind ?? null,
        sort_order: media.sortOrder ?? 0,
      })
      .select("id, listing_id, r2_key, url, kind, sort_order, created_at")
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as unknown as MarketplaceListingMedia, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** Read a single listing scoped to the workspace. Tolerant. */
export async function getListing(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string
): Promise<Result<MarketplaceListing>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!listingId) return { data: null, error: "listing_required" }
  try {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select(LISTING_COLUMNS)
      .eq("id", listingId)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error) return { data: null, error: toMessage(error) }
    return { data: (data as unknown as MarketplaceListing) ?? null, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** Options for {@link listWorkspaceListings}. */
export interface ListListingsOptions {
  status?: ListingStatus
  transactionType?: MarketplaceTransactionType
  limit?: number
  offset?: number
}

/** List a workspace's listings (most recent first). Tolerant → [] on failure. */
export async function listWorkspaceListings(
  supabase: SupabaseClient,
  workspaceId: string,
  options: ListListingsOptions = {}
): Promise<Result<MarketplaceListing[]>> {
  if (!workspaceId) return { data: [], error: "workspace_required" }
  try {
    let query = supabase
      .from("marketplace_listings")
      .select(LISTING_COLUMNS)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (options.status) query = query.eq("status", options.status)
    if (options.transactionType) query = query.eq("transaction_type", options.transactionType)
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200)
    const offset = Math.max(options.offset ?? 0, 0)
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) {
      // Missing table → empty marketplace, not a hard error for the caller.
      if (isMissingTable(error)) return { data: [], error: null }
      return { data: [], error: toMessage(error) }
    }
    return { data: (data as unknown as MarketplaceListing[]) ?? [], error: null }
  } catch (err) {
    if (isMissingTable(err)) return { data: [], error: null }
    return { data: [], error: toMessage(err) }
  }
}
