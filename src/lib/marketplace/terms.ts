// ============================================================================
// Marketplace terms acceptance — typed, workspace-scoped data layer over
// `marketplace_terms_acceptance` (P2 trust substrate).
//
// APPEND-ONLY ledger: each acceptance is a new immutable row (the DB grants
// SELECT + INSERT only — no UPDATE/DELETE policy). This gives an auditable trail
// of which workspace accepted which terms version, by whom, and when.
//
// This module records and reads acceptances; it makes NO legal claim about the
// content of the terms themselves. 42P01-tolerant and workspace-scoped.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * The current marketplace terms version callers should record/check against.
 * Bump this (date-stamped) whenever the marketplace terms materially change so
 * a re-acceptance is required.
 */
export const CURRENT_MARKETPLACE_TERMS_VERSION = "2026-06-15"

/** A recorded terms-acceptance row. */
export interface MarketplaceTermsAcceptance {
  id: string
  workspace_id: string
  terms_version: string
  accepted_by: string | null
  accepted_at: string
  ip: string | null
}

/** Uniform tolerant result. */
export interface Result<T> {
  data: T | null
  error: string | null
}

const ACCEPTANCE_COLUMNS =
  "id, workspace_id, terms_version, accepted_by, accepted_at, ip"

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

function toMessage(err: unknown): string {
  if (isMissingTable(err)) return "marketplace_unavailable"
  const e = err as { message?: string } | null
  return e?.message ?? "marketplace_error"
}

/** Fields a caller may set when recording an acceptance. */
export interface RecordTermsAcceptanceInput {
  /** Defaults to CURRENT_MARKETPLACE_TERMS_VERSION when omitted. */
  termsVersion?: string
  /** The acting user who accepted. */
  acceptedBy?: string | null
  /** Originating IP (no other request data — keep PII minimal). */
  ip?: string | null
}

/**
 * Record a terms acceptance for a workspace (append-only). Tolerant: returns
 * { data:null, error } rather than throwing.
 */
export async function recordTermsAcceptance(
  supabase: SupabaseClient,
  workspaceId: string,
  input: RecordTermsAcceptanceInput = {}
): Promise<Result<MarketplaceTermsAcceptance>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  const version = input.termsVersion?.trim() || CURRENT_MARKETPLACE_TERMS_VERSION
  try {
    const { data, error } = await supabase
      .from("marketplace_terms_acceptance")
      .insert({
        workspace_id: workspaceId,
        terms_version: version,
        accepted_by: input.acceptedBy ?? null,
        ip: input.ip ?? null,
      })
      .select(ACCEPTANCE_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as MarketplaceTermsAcceptance, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/**
 * Whether a workspace has accepted a given terms version (defaults to the
 * current version). Tolerant: a missing table is treated as "not accepted"
 * (false) WITHOUT surfacing an error, so a cold DB does not falsely gate.
 * Returns { data:boolean, error } — `data` is the authoritative answer.
 */
export async function hasAcceptedTerms(
  supabase: SupabaseClient,
  workspaceId: string,
  version: string = CURRENT_MARKETPLACE_TERMS_VERSION
): Promise<Result<boolean>> {
  if (!workspaceId) return { data: false, error: "workspace_required" }
  try {
    const { data, error } = await supabase
      .from("marketplace_terms_acceptance")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("terms_version", version)
      .limit(1)
      .maybeSingle()
    if (error) {
      if (isMissingTable(error)) return { data: false, error: null }
      return { data: false, error: toMessage(error) }
    }
    return { data: Boolean(data), error: null }
  } catch (err) {
    if (isMissingTable(err)) return { data: false, error: null }
    return { data: false, error: toMessage(err) }
  }
}

/** List a workspace's acceptance history, most recent first. Tolerant → []. */
export async function listTermsAcceptances(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Result<MarketplaceTermsAcceptance[]>> {
  if (!workspaceId) return { data: [], error: "workspace_required" }
  try {
    const { data, error } = await supabase
      .from("marketplace_terms_acceptance")
      .select(ACCEPTANCE_COLUMNS)
      .eq("workspace_id", workspaceId)
      .order("accepted_at", { ascending: false })
    if (error) {
      if (isMissingTable(error)) return { data: [], error: null }
      return { data: [], error: toMessage(error) }
    }
    return { data: (data as MarketplaceTermsAcceptance[]) ?? [], error: null }
  } catch (err) {
    if (isMissingTable(err)) return { data: [], error: null }
    return { data: [], error: toMessage(err) }
  }
}
