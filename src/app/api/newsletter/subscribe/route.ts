import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit, clientKey } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/newsletter/turnstile"
import { sendEmail } from "@/lib/email"
import { newsletterConfirmEmail } from "@/lib/newsletter/confirmEmail"

/**
 * POST /api/newsletter/subscribe
 * Body: { email: string; consent: boolean; turnstileToken?: string }
 *
 * Explicit-consent newsletter signup with double opt-in (MAX-RELEASE 200, 31).
 *
 *  - Validates email + REQUIRES consent === true (no marketing without consent).
 *  - Rate limited 5 / 10 min per IP (fail-open).
 *  - Turnstile verified only when a secret key is configured (key-gated).
 *  - Upserts subscriber via the service role (RLS deny-all table).
 *  - Sends a best-effort confirmation email; never hard-fails on email.
 *  - Anti-enumeration: always returns a generic success, never revealing
 *    whether the email already existed or its prior status.
 */

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
  turnstileToken: z.string().optional(),
})

const GENERIC_SUCCESS = {
  success: true,
  message: "Please check your inbox to confirm your subscription.",
}

function baseUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    "https://app.propvora.com"
  )
}

export async function POST(request: NextRequest) {
  // --- Parse + validate ----------------------------------------------------
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const isConsent = first?.path?.[0] === "consent"
    return NextResponse.json(
      { error: isConsent ? "Consent is required" : "Enter a valid email address" },
      { status: 400 }
    )
  }
  const { email, turnstileToken } = parsed.data

  // --- Rate limit (per IP, fail-open) --------------------------------------
  const key = clientKey(request, "newsletter")
  const rl = await rateLimit({ key, limit: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  // --- Turnstile (key-gated) -----------------------------------------------
  const ip = key.split(":").slice(1).join(":")
  const turnstile = await verifyTurnstile(turnstileToken, ip)
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 400 }
    )
  }

  // --- Persist via service role (RLS deny-all table) -----------------------
  // Missing service-role config -> treat as best-effort no-op success so the
  // form never hard-fails in environments without secrets.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(GENERIC_SUCCESS)
  }

  try {
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, confirm_token")
      .eq("email", email)
      .maybeSingle()

    let confirmToken: string | null = null
    let shouldSendConfirm = false

    if (!existing) {
      // New subscriber -> pending, awaiting double opt-in.
      const { data: inserted } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email,
          status: "pending",
          consent: true,
          source: "marketing_footer",
          ip,
        })
        .select("confirm_token")
        .maybeSingle()
      confirmToken = (inserted?.confirm_token as string | undefined) ?? null
      shouldSendConfirm = true
    } else if (existing.status === "subscribed") {
      // Already confirmed -> idempotent success, no re-confirmation email.
      shouldSendConfirm = false
    } else if (existing.status === "suppressed") {
      // Hard suppression -> do NOT resurrect; silently return generic success
      // (anti-enumeration). Suppression is cleared only by an operator.
      shouldSendConfirm = false
    } else {
      // pending or unsubscribed -> (re)subscribe to pending and re-send confirm.
      const { data: updated } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "pending",
          consent: true,
          source: "marketing_footer",
          ip,
          unsubscribed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("confirm_token")
        .maybeSingle()
      confirmToken =
        (updated?.confirm_token as string | undefined) ??
        (existing.confirm_token as string | undefined) ??
        null
      shouldSendConfirm = true
    }

    // --- Best-effort confirmation email (never hard-fails) ------------------
    if (shouldSendConfirm && confirmToken) {
      const confirmUrl = `${baseUrl(request)}/api/newsletter/confirm?token=${encodeURIComponent(
        confirmToken
      )}`
      const { subject, html } = newsletterConfirmEmail({ confirmUrl })
      try {
        await sendEmail({ to: email, subject, html })
      } catch (err) {
        console.error("[api/newsletter/subscribe] confirm email failed:", err)
      }
    }
  } catch (err) {
    // Store error -> log but still return generic success (anti-enumeration +
    // do not leak infrastructure state to the client).
    console.error("[api/newsletter/subscribe] store error:", err)
  }

  return NextResponse.json(GENERIC_SUCCESS)
}
