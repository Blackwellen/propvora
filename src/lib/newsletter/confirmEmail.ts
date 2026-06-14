/**
 * Double opt-in confirmation email for the newsletter.
 * Pure template — returns { subject, html }. Sent best-effort via Resend
 * (src/lib/email.ts); the signup never hard-fails if email is unconfigured.
 */

interface ConfirmEmailParams {
  confirmUrl: string
}

export function newsletterConfirmEmail(params: ConfirmEmailParams): {
  subject: string
  html: string
} {
  const { confirmUrl } = params
  const subject = "Confirm your Propvora newsletter subscription"

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="background-color:#F1F5F9; margin:0; padding:40px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding-bottom:28px; text-align:center;">
              <span style="font-size:22px; font-weight:800; color:#0D1B2A; letter-spacing:-0.5px;">Propvora</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff; border-radius:16px; padding:40px; border:1px solid #E2E8F0;">
              <h1 style="font-size:20px; font-weight:700; color:#0F172A; margin:0 0 16px;">Confirm your subscription</h1>
              <p style="font-size:15px; line-height:1.6; color:#475569; margin:0 0 24px;">
                You (or someone using this email) asked to receive the Propvora newsletter.
                Confirm below to start receiving product news and property-operations tips.
                If this wasn't you, simply ignore this email — no subscription is created without confirmation.
              </p>
              <a href="${confirmUrl}" style="display:inline-block; background:#2563EB; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:12px 24px; border-radius:12px;">
                Confirm subscription
              </a>
              <p style="font-size:13px; line-height:1.6; color:#94A3B8; margin:24px 0 0;">
                Or paste this link into your browser:<br />
                <span style="color:#2563EB; word-break:break-all;">${confirmUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px; text-align:center;">
              <p style="font-size:12px; color:#94A3B8; margin:0;">© 2026 Blackwellen Ltd, trading as Propvora.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
