// ============================================================================
// Marketplace reviews + trust scores — typed, workspace-scoped data layer over
// `marketplace_reviews` and `marketplace_trust_scores` (P2 trust substrate).
//
// EVERYTHING here is workspace-scoped and 42P01-tolerant: a missing table (cold
// or migrating DB) never throws — operations return a structured
// { data, error } result instead. RLS in the DB is the real isolation boundary
// (a workspace may read reviews it WROTE or reviews ABOUT it; only the reviewer
// workspace may write its own reviews). The explicit workspace_id filters here
// are defence-in-depth.
//
// GATING: there are NO feature flags. Marketplace participation is gated by the
// CALLER via entitlement (`@/lib/billing/gates`) + `workspaces.type`. This module
// does not re-implement that gate.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

/** Moderation lifecycle for a review (mirrors the DB CHECK). */
export type ReviewStatus = "published" | "hidden" | "flagged"

/** A marketplace review row. */
export interface MarketplaceReview {
  id: string
  transaction_id: string | null
  listing_id: string | null
  reviewer_workspace_id: string
  subject_workspace_id: string
  rating: number
  title: string | null
  body: string | null
  status: ReviewStatus
  created_at: string
  updated_at: string
}

/** A trust-score row (one per workspace). */
export interface MarketplaceTrustScore {
  workspace_id: string
  score: number
  review_count: number
  avg_rating: number | null
  signals: Record<string, unknown>
  updated_at: string
}

/** Uniform tolerant result. `error` is a short code/message, never a throw. */
export interface Result<T> {
  data: T | null
  error: string | null
}

const REVIEW_COLUMNS =
  "id, transaction_id, listing_id, reviewer_workspace_id, subject_workspace_id, " +
  "rating, title, body, status, created_at, updated_at"

const TRUST_COLUMNS =
  "workspace_id, score, review_count, avg_rating, signals, updated_at"

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

/** Clamp a rating into the valid 1..5 integer range. */
function clampRating(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)))
}

/** Fields a caller may set when submitting a review. */
export interface SubmitReviewInput {
  /** Workspace being reviewed (the subject). */
  subjectWorkspaceId: string
  /** 1..5; clamped defensively. */
  rating: number
  transactionId?: string | null
  listingId?: string | null
  title?: string | null
  body?: string | null
}

/**
 * Submit a review. `reviewerWorkspaceId` is the acting workspace (the reviewer);
 * the DB RLS only permits writing rows where the reviewer workspace matches the
 * member's workspace. Tolerant: returns { data:null, error } rather than throwing.
 */
export async function submitReview(
  supabase: SupabaseClient,
  reviewerWorkspaceId: string,
  input: SubmitReviewInput
): Promise<Result<MarketplaceReview>> {
  if (!reviewerWorkspaceId) return { data: null, error: "workspace_required" }
  if (!input.subjectWorkspaceId) return { data: null, error: "subject_required" }
  if (input.rating == null || Number.isNaN(input.rating))
    return { data: null, error: "rating_required" }
  try {
    const row = {
      reviewer_workspace_id: reviewerWorkspaceId,
      subject_workspace_id: input.subjectWorkspaceId,
      rating: clampRating(input.rating),
      transaction_id: input.transactionId ?? null,
      listing_id: input.listingId ?? null,
      title: input.title ?? null,
      body: input.body ?? null,
      status: "published" as ReviewStatus,
    }
    const { data, error } = await supabase
      .from("marketplace_reviews")
      .insert(row)
      .select(REVIEW_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    // Best-effort: keep the subject's trust score current after a new review.
    // Failure here must not fail the review write.
    await recomputeTrustScore(supabase, input.subjectWorkspaceId)
    return { data: data as unknown as MarketplaceReview, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** Options for {@link listReviewsForWorkspace}. */
export interface ListReviewsOptions {
  /** Restrict to a moderation status (defaults to 'published'). */
  status?: ReviewStatus | "all"
  limit?: number
  offset?: number
}

/**
 * List reviews ABOUT a workspace (subject = workspaceId), most recent first.
 * Tolerant → [] on failure (missing table = empty, not an error).
 */
export async function listReviewsForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  options: ListReviewsOptions = {}
): Promise<Result<MarketplaceReview[]>> {
  if (!workspaceId) return { data: [], error: "workspace_required" }
  try {
    let query = supabase
      .from("marketplace_reviews")
      .select(REVIEW_COLUMNS)
      .eq("subject_workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    const status = options.status ?? "published"
    if (status !== "all") query = query.eq("status", status)

    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200)
    const offset = Math.max(options.offset ?? 0, 0)
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) {
      if (isMissingTable(error)) return { data: [], error: null }
      return { data: [], error: toMessage(error) }
    }
    return { data: (data as unknown as MarketplaceReview[]) ?? [], error: null }
  } catch (err) {
    if (isMissingTable(err)) return { data: [], error: null }
    return { data: [], error: toMessage(err) }
  }
}

/**
 * Read a workspace's trust score. Tolerant: missing table OR no row yet returns
 * a zeroed score (never an error) so trust UI always has a value to render.
 */
export async function getTrustScore(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Result<MarketplaceTrustScore>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  const zero: MarketplaceTrustScore = {
    workspace_id: workspaceId,
    score: 0,
    review_count: 0,
    avg_rating: null,
    signals: {},
    updated_at: new Date().toISOString(),
  }
  try {
    const { data, error } = await supabase
      .from("marketplace_trust_scores")
      .select(TRUST_COLUMNS)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error) {
      if (isMissingTable(error)) return { data: zero, error: null }
      return { data: zero, error: toMessage(error) }
    }
    return { data: (data as MarketplaceTrustScore) ?? zero, error: null }
  } catch (err) {
    if (isMissingTable(err)) return { data: zero, error: null }
    return { data: zero, error: toMessage(err) }
  }
}

/**
 * Recompute and upsert a workspace's trust score by aggregating its PUBLISHED
 * reviews into review_count / avg_rating, and deriving a 0..100 `score` from the
 * average rating scaled by review volume. Tolerant: never throws.
 *
 * This does NOT claim a write occurred unless the upsert actually succeeded —
 * the returned Result reflects the real DB outcome.
 */
export async function recomputeTrustScore(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Result<MarketplaceTrustScore>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  try {
    const { data: reviews, error: readErr } = await supabase
      .from("marketplace_reviews")
      .select("rating")
      .eq("subject_workspace_id", workspaceId)
      .eq("status", "published")
    if (readErr) {
      if (isMissingTable(readErr)) return { data: null, error: "marketplace_unavailable" }
      return { data: null, error: toMessage(readErr) }
    }

    const rows = (reviews as { rating: number }[]) ?? []
    const reviewCount = rows.length
    const avgRating =
      reviewCount === 0
        ? null
        : rows.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewCount

    // Score 0..100: average rating on a 0..100 scale, lightly damped by review
    // volume so a single 5-star review does not equal a long, proven track
    // record. Confidence factor saturates around ~20 reviews.
    let score = 0
    if (avgRating != null) {
      const ratingPct = (avgRating / 5) * 100
      const confidence = Math.min(1, reviewCount / 20)
      score = Math.round(ratingPct * confidence * 100) / 100
    }

    const row = {
      workspace_id: workspaceId,
      score,
      review_count: reviewCount,
      avg_rating: avgRating == null ? null : Math.round(avgRating * 100) / 100,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("marketplace_trust_scores")
      .upsert(row, { onConflict: "workspace_id" })
      .select(TRUST_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as MarketplaceTrustScore, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}
