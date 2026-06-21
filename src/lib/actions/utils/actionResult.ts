/**
 * Shared result type for server actions.
 *
 * All server actions should return one of these shapes so callers can
 * distinguish success, validation failures, and 42P01 table-missing states
 * without catching thrown errors.
 *
 * Usage:
 *   export async function myAction(): Promise<ActionResult<MyData>> {
 *     const { data, error } = await supabase.from(…).select(…)
 *     if (error) return fromSupabaseError(error)
 *     return ok(data)
 *   }
 */

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; code?: string }
  | { ok: false; unavailable: true }

/** Return a successful result, optionally with a data payload. */
export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data }
}

/** Return a failure with a user-facing error message and optional error code. */
export function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

/**
 * Return an "unavailable" result — used when the required database table does
 * not exist yet (Postgres error code 42P01). UI should degrade gracefully
 * rather than showing an error banner.
 */
export function unavailable(): ActionResult<never> {
  return { ok: false, unavailable: true }
}

/**
 * Maps a Supabase PostgREST error into an ActionResult.
 * 42P01 ("relation does not exist") becomes `unavailable()`.
 * All other errors become `fail(message, code)`.
 */
export function fromSupabaseError(error: {
  code?: string
  message: string
}): ActionResult<never> {
  if (error.code === "42P01") return unavailable()
  return fail(error.message, error.code)
}
