/**
 * Cloudflare Turnstile verification — KEY-GATED.
 *
 * If no Turnstile secret key is configured, verification is SKIPPED (returns
 * ok=true). This lets the newsletter signup work in dev / before keys are
 * provisioned, and only enforces the challenge once a secret is set.
 *
 * Reads the task-specified env name first, then falls back to the existing
 * CF_-prefixed name already present in this project's .env.example.
 */

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

/** The Turnstile secret, from either supported env name (or undefined). */
export function getTurnstileSecret(): string | undefined {
  const secret =
    process.env.TURNSTILE_SECRET_KEY ?? process.env.CF_TURNSTILE_SECRET_KEY
  return secret && secret.trim() ? secret.trim() : undefined
}

/** True when a secret key is configured and verification must be enforced. */
export function isTurnstileEnabled(): boolean {
  return getTurnstileSecret() !== undefined
}

/**
 * Verify a Turnstile token. Returns { ok: true } when verification is skipped
 * (no secret configured) or succeeds; { ok: false } on a failed/missing token.
 * Fails CLOSED only when the key is configured — i.e. a missing token with an
 * active secret is rejected.
 */
export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string
): Promise<{ ok: boolean }> {
  const secret = getTurnstileSecret()
  if (!secret) return { ok: true } // key-gated: no secret -> skip

  if (!token || !token.trim()) return { ok: false }

  try {
    const body = new URLSearchParams()
    body.set("secret", secret)
    body.set("response", token)
    if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp)

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    if (!res.ok) return { ok: false }

    const data = (await res.json()) as { success?: boolean }
    return { ok: data.success === true }
  } catch {
    // Network/verify error with an active secret -> reject (fail closed).
    return { ok: false }
  }
}
