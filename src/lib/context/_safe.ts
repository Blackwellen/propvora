import type { PackStatus } from "./context-types"

/**
 * ============================================================================
 * Shared safe-read helpers for the Context Engine.
 * ============================================================================
 * Centralises the "degrade, never throw" behaviour so every sub-resolver reads
 * the v2 foundation tables identically. A missing table (42P01) or missing
 * column (42703) — both expected when the v2 migration is not applied — is
 * treated as "no data", not an error.
 * ============================================================================
 */

/** Postgres error code, if the value looks like a PostgREST/pg error. */
export function pgCode(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/** True when the error is a "foundation not migrated yet" shape we tolerate. */
export function isMissingSchema(e: unknown): boolean {
  const c = pgCode(e)
  // 42P01 undefined_table, 42703 undefined_column, PGRST204 column not found.
  return c === "42P01" || c === "42703" || c === "PGRST204"
}

/**
 * Run a Supabase single-row read and return its data, swallowing both thrown
 * errors and returned `{ error }` objects. Always resolves — never rejects.
 */
export async function safeRow<T = Record<string, unknown>>(
  run: () => PromiseLike<{ data: T | null; error: unknown }>
): Promise<T | null> {
  try {
    const { data, error } = await run()
    if (error) return null
    return data ?? null
  } catch {
    return null
  }
}

/** ISO-2 country code normaliser → uppercased, or null if not a 2-letter code. */
export function normaliseCountry(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(t) ? t : null
}

/** Coerce an arbitrary value to a known PackStatus, defaulting as given. */
export function toPackStatus(v: unknown, fallback: PackStatus): PackStatus {
  const known: PackStatus[] = [
    "disabled",
    "generic_only",
    "research_only",
    "beta",
    "reviewed",
    "enabled",
  ]
  return typeof v === "string" && (known as string[]).includes(v)
    ? (v as PackStatus)
    : fallback
}

/** Numeric rank of a PackStatus for `>=` comparisons. */
const PACK_RANK: Record<PackStatus, number> = {
  disabled: 0,
  generic_only: 1,
  research_only: 2,
  beta: 3,
  reviewed: 4,
  enabled: 5,
}

/** True when `status` is at least as mature as `min`. */
export function packAtLeast(status: PackStatus, min: PackStatus): boolean {
  return PACK_RANK[status] >= PACK_RANK[min]
}

/** Pick the first non-empty string from a list of candidate column values. */
export function firstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim()
  }
  return null
}
