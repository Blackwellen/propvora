/**
 * Affiliate application APPROVED — welcome email.
 * Sent (via Resend) when an affiliate application is auto-accepted, confirming
 * approval and giving the login link + their referral code.
 *
 * Server-only (imports the branded shell which is used from server code).
 */

import { brandedEmail, ctaButton, summaryCard, dataRow, infoBox, BRAND } from "@/lib/emails/_base"

export interface AffiliateApprovedEmailInput {
  fullName?: string | null
  referralCode?: string | null
  /** Absolute login URL, e.g. https://www.propvora.com/affiliate-login */
  loginUrl: string
}

export function affiliateApprovedEmail(input: AffiliateApprovedEmailInput): { subject: string; html: string } {
  const first = (input.fullName ?? "").trim().split(/\s+/)[0] || "there"
  const subject = "You're in — welcome to the Propvora Partner Programme"

  const code = (input.referralCode ?? "").trim()
  const codeCard = code
    ? summaryCard(dataRow("Your referral code", code, "font-size:16px;letter-spacing:0.5px;", false))
    : ""

  const body = `
    <p style="font-size:15px;color:${BRAND.textBody};line-height:1.65;margin:0 0 16px;">Hi ${first},</p>
    <p style="font-size:15px;color:${BRAND.textBody};line-height:1.65;margin:0 0 20px;">
      Great news — your application to the <strong>Propvora Partner Programme</strong> has been approved. You can sign in to your affiliate dashboard now to grab your referral links and start earning.
    </p>
    ${ctaButton("Log in to your dashboard", input.loginUrl)}
    <p style="font-size:13px;color:${BRAND.textMuted};line-height:1.6;margin:0 0 22px;">
      Use the same email address you applied with. New here? You can set a password from the login screen.
    </p>
    ${codeCard}
    ${infoBox(
      "Earn 10% recurring commission (up to 15% at higher tiers) for 6 months on every paying customer you refer. Commission clears after a 30-day hold and is then paid <strong>automatically</strong> to your connected Stripe account once your cleared balance reaches £50 — connect Stripe from your dashboard to get paid.",
      "success",
    )}
    <p style="font-size:13px;color:${BRAND.textMuted};line-height:1.6;margin:8px 0 0;">
      Full details are in the <a href="https://www.propvora.com/affiliate-programme/terms" style="color:${BRAND.accent};text-decoration:none;">Affiliate Terms</a>. Questions? Just reply to this email or contact <a href="mailto:partners@propvora.com" style="color:${BRAND.accent};text-decoration:none;">partners@propvora.com</a>.
    </p>
  `

  const html = brandedEmail({
    subject,
    preheaderText: "Your Propvora Partner Programme application has been approved — sign in to get started.",
    category: "Partner Programme",
    headline: "You're approved 🎉",
    iconEmoji: "🤝",
    body,
    footerNote: "You're receiving this because you applied to the Propvora Partner Programme.",
  })

  return { subject, html }
}
