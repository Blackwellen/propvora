/**
 * P6 — Sanctions SCREENING (a SIGNAL, not a legal determination).
 *
 * ⚠️ HONESTY FRAMING — READ FIRST
 * This is a lightweight SCREENING SIGNAL, NOT sanctions/AML clearance. It checks
 * a subject's country against Propvora's `country_packs` banned list (RU/IR/KP/SY
 * are recorded as offer_status='banned' / legal_status='disabled') and does a
 * naive name comparison against any supplied watch-list. A positive match means
 * "review required"; a negative match means ONLY "no match against this limited
 * list" — it is NOT a clean-bill certification. Definitive sanctions/PEP
 * screening requires a licensed provider and legal review. Every result is
 * recorded as a `sanctions_screenings` row + a `verification_checks` sanctions
 * row whose `result` is 'manual_review' (matched) or 'pass' interpreted strictly
 * as "no list match" — never as legal clearance.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { CountryPack, ScreeningResult } from "./types"

/** Country offer_status values that mean the jurisdiction is sanctioned/blocked. */
const SANCTIONED_OFFER_STATUSES = new Set(["banned"])
/** Backstop legal_status values that also indicate a blocked jurisdiction. */
const SANCTIONED_LEGAL_STATUSES = new Set(["disabled"])

/**
 * Pure: is a country code sanctioned per the supplied country_packs snapshot?
 * Case-insensitive on the 2-letter code. Returns false when the code is unknown
 * (unknown ≠ safe — callers should treat unknown jurisdictions cautiously, but
 * we do not fabricate a match).
 */
export function isCountrySanctioned(
  countryCode: string | null | undefined,
  packs: CountryPack[]
): boolean {
  if (!countryCode) return false
  const code = countryCode.trim().toUpperCase()
  if (!code) return false
  const pack = packs.find((p) => (p.code ?? "").toUpperCase() === code)
  if (!pack) return false
  const offer = (pack.offer_status ?? "").toLowerCase()
  const legal = (pack.legal_status ?? "").toLowerCase()
  return SANCTIONED_OFFER_STATUSES.has(offer) || SANCTIONED_LEGAL_STATUSES.has(legal)
}

/** Postgres / PostgREST codes meaning the table/column is not provisioned yet. */
const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703"])

function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/**
 * Run a sanctions SCREENING SIGNAL for a subject and record it.
 *
 * Steps:
 *  1. Load the country_packs snapshot and test `countryCode` against the banned
 *     list (the only authoritative list we hold). Optionally compare `name`
 *     against a caller-supplied `nameWatchlist` (naive case-insensitive substring
 *     — clearly a signal only).
 *  2. INSERT a `sanctions_screenings` row capturing the inputs + outcome.
 *  3. INSERT a `verification_checks` sanctions row when `verificationId` is given,
 *     with result 'manual_review' on a match (a human MUST review) or 'pass'
 *     meaning ONLY "no list match" (not legal clearance).
 *
 * 42P01-tolerant: if tables are unprovisioned, returns the computed signal
 * without persisting. Never throws on a provisioning gap.
 */
export async function screenAgainstSanctions(
  supabase: SupabaseClient,
  args: {
    workspaceId?: string | null
    name: string
    countryCode?: string | null
    nameWatchlist?: string[]
    verificationId?: string | null
    screenedBy?: string | null
  }
): Promise<ScreeningResult> {
  // 1. Compute the signal.
  let packs: CountryPack[] = []
  try {
    const { data } = await supabase
      .from("country_packs")
      .select("code, name, offer_status, legal_status")
    packs = (data as CountryPack[] | null) ?? []
  } catch {
    packs = []
  }

  const countrySanctioned = isCountrySanctioned(args.countryCode, packs)

  const nameNorm = args.name.trim().toLowerCase()
  const nameHit = (args.nameWatchlist ?? []).some(
    (w) => nameNorm.length > 0 && nameNorm.includes(w.trim().toLowerCase()) && w.trim().length > 0
  )

  const matched = countrySanctioned || nameHit
  const detail: Record<string, unknown> = {
    signal_only: true,
    note: "Screening signal against Propvora's banned-country list + supplied name watchlist. NOT a legal sanctions/AML determination.",
    country_code: args.countryCode ?? null,
    country_sanctioned: countrySanctioned,
    name_watchlist_hit: nameHit,
  }
  if (countrySanctioned) {
    const pack = packs.find(
      (p) => (p.code ?? "").toUpperCase() === (args.countryCode ?? "").toUpperCase()
    )
    detail.matched_country = pack?.name ?? args.countryCode ?? null
  }

  // 2. Record the screening row (best-effort).
  try {
    const { error } = await supabase.from("sanctions_screenings").insert({
      workspace_id: args.workspaceId ?? null,
      subject_name: args.name,
      country_code: args.countryCode ?? null,
      matched,
      match_detail: detail,
      screened_by: args.screenedBy ?? null,
    })
    if (error && !isNotProvisioned(error)) throw error
  } catch (err) {
    if (!isNotProvisioned(err)) throw err
  }

  // 3. Record the verification check row (best-effort) when tied to a verification.
  if (args.verificationId) {
    try {
      const { error } = await supabase.from("verification_checks").insert({
        verification_id: args.verificationId,
        check_type: "sanctions",
        // A match → human review required. No match → 'pass' meaning ONLY
        // "no list match" (see module honesty framing) — never legal clearance.
        result: matched ? "manual_review" : "pass",
        detail,
      })
      if (error && !isNotProvisioned(error)) throw error
    } catch (err) {
      if (!isNotProvisioned(err)) throw err
    }
  }

  return { matched, detail }
}
