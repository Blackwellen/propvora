import "server-only"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Result of a platform-admin verification.
 */
export interface AdminIdentity {
  userId: string
  email: string | null
  fullName: string | null
}

/**
 * Verify the current session belongs to a platform admin.
 *
 * Security model (fail-closed):
 *  - Requires an authenticated Supabase session.
 *  - Uses the service-role client to read the caller's own profile row,
 *    bypassing RLS so the check is authoritative.
 *  - Accepts EITHER `platform_role = 'admin'` (the dedicated platform flag set
 *    by scripts/setup-platform-admin.sql) OR the core `role` column being
 *    'platform_admin'. Either alone is sufficient.
 *  - Any error (missing column, missing row, db error) returns null — access
 *    is DENIED, never granted, on uncertainty.
 *
 * Returns the admin identity on success, or `null` if the caller is not a
 * verified platform admin. Callers MUST treat null as "deny".
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  let userId: string
  let email: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    userId = user.id
    email = user.email ?? null
  } catch {
    return null
  }

  // Authoritative role check via service-role (bypasses RLS).
  const admin = createAdminClient()

  // Primary check: profiles.platform_role === 'admin'.
  // NOTE: profiles has `display_name` (NOT `full_name`) — selecting a missing
  // column 42703-errors and would silently deny every admin, so select only
  // columns that exist.
  let isAdmin = false
  let fullName: string | null = null
  try {
    const { data } = await admin
      .from("profiles")
      .select("platform_role, display_name")
      .eq("id", userId)
      .maybeSingle()
    if (data) {
      fullName = (data.display_name as string | null) ?? null
      if (data.platform_role === "admin") isAdmin = true
    }
  } catch {
    // platform_role column may not exist — fall through to the grant table.
  }

  // Secondary grant path: the platform_admins table (explicit grants).
  if (!isAdmin) {
    try {
      const { data } = await admin
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle()
      if (data) isAdmin = true
    } catch {
      // table missing — deny.
    }
  }

  if (!isAdmin) return null
  return { userId, email, fullName }
}

/**
 * Throwing variant for use inside Server Actions / route handlers.
 * Throws if the caller is not a verified platform admin.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity()
  if (!identity) throw new Error("Forbidden: platform admin access required")
  return identity
}

// ─── MFA assurance gate for the admin console ────────────────────────────────

export type AdminMfaState =
  | "ok"            // aal2 satisfied (or no MFA configured to enforce) → allow
  | "challenge"     // a TOTP factor is enrolled but the session is only aal1 → must verify
  | "unknown"       // could not determine — treat as allow (fail-open ONLY for the
                    //   assurance check; the role check above is still fail-closed)

/**
 * Determine whether the current admin session has satisfied MFA.
 *
 * Supabase exposes an Authenticator Assurance Level (AAL). A session that has
 * verified a TOTP factor is `aal2`; one that has only a password is `aal1`.
 *
 * Policy (non-breaking):
 *   - If the admin has a VERIFIED TOTP factor enrolled but the current session
 *     is not yet aal2 → "challenge": the layout redirects to the verify step so
 *     privileged console access always requires the second factor.
 *   - If the admin has NO verified factor enrolled, we do not lock them out
 *     (they can still reach the console and should enrol MFA) → "ok". This keeps
 *     existing admins working while enforcing 2FA for anyone who has set it up.
 *
 * Any error determining the state returns "unknown" (allow) so an Auth/API
 * hiccup never bricks the console — the authoritative role gate already ran.
 */
export async function getAdminMfaState(): Promise<AdminMfaState> {
  try {
    const supabase = await createClient()

    const { data: aal, error: aalErr } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalErr) return "unknown"

    // Already stepped up — nothing to do.
    if (aal?.currentLevel === "aal2") return "ok"

    // If Supabase says the next required level is aal2 while the current session
    // is below it, an enrolled factor must be satisfied → force the challenge.
    if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") {
      return "challenge"
    }

    // Cross-check enrolled factors directly in case nextLevel is stale.
    const { data: factors, error: facErr } = await supabase.auth.mfa.listFactors()
    if (facErr) return "unknown"
    const hasVerifiedTotp = (factors?.totp ?? []).some((f) => f.status === "verified")
    return hasVerifiedTotp ? "challenge" : "ok"
  } catch {
    return "unknown"
  }
}
