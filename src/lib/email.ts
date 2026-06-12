/**
 * Centralised Resend email utility for Propvora.
 *
 * This module must only be imported from server-side code:
 *   - API routes (app/api/[...]/route.ts)
 *   - Server Actions ('use server')
 *   - Server Components
 *
 * Never import this in a 'use client' file — Resend uses Node.js APIs.
 */

import { Resend } from "resend"

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? "hello@propvora.com"

/**
 * Parameters accepted by sendEmail.
 */
export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

/**
 * Result returned by sendEmail.
 * `id` is set when the send succeeded; `error` is set on failure.
 */
export interface SendEmailResult {
  id?: string
  error: string | null
}

/**
 * Send a transactional email via Resend.
 *
 * Gracefully no-ops (logs a warning and returns `{ error: null }`) when
 * `RESEND_API_KEY` is not configured so callers never crash in dev or
 * environments where the key has not yet been set.
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY is not set — skipping send to:",
      typeof params.to === "string" ? params.to : params.to.join(", ")
    )
    return { error: null }
  }

  const resend = new Resend(apiKey)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    })

    if (error) {
      console.error("[email] Resend send error:", error)
      return { error: error.message }
    }

    return { id: data?.id ?? undefined, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error"
    console.error("[email] Unexpected error sending email:", message)
    return { error: message }
  }
}
