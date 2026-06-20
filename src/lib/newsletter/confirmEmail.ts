/**
 * Double opt-in confirmation email for the newsletter.
 * Pure template — returns { subject, html }. Sent best-effort via Resend
 * (src/lib/email.ts); the signup never hard-fails if email is unconfigured.
 */
import { brandedEmail, ctaButton, BRAND } from "@/lib/emails/_base"

interface ConfirmEmailParams {
  confirmUrl: string
}

export function newsletterConfirmEmail(params: ConfirmEmailParams): { subject: string; html: string } {
  const { confirmUrl } = params
  const subject = "Confirm your Propvora newsletter subscription"

  const body = `
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px;">
      You (or someone using this email address) asked to receive the Propvora newsletter —
      product updates, property-operations tips, and compliance insights.
    </p>
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:32px;">
      Click the button below to confirm. If this wasn&rsquo;t you, simply ignore this email —
      no subscription is created without confirmation.
    </p>

    ${ctaButton("Confirm subscription", confirmUrl)}

    <p style="font-size:12px; color:${BRAND.textFaint}; margin-top:28px; line-height:1.6;">
      Or paste this link into your browser:<br />
      <a href="${confirmUrl}" style="color:${BRAND.accent}; word-break:break-all;">${confirmUrl}</a>
    </p>
  `

  const html = brandedEmail({
    subject,
    category: "Newsletter",
    headline: "Confirm your subscription",
    body,
    footerNote: "You will only receive emails after confirming. Unsubscribe at any time.",
  })

  return { subject, html }
}
