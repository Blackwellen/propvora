import { brandedEmail, ctaButton, BRAND } from "./_base"

interface WelcomeParams {
  userName: string
  workspaceName: string
}

export function welcomeEmail(params: WelcomeParams): { subject: string; html: string } {
  const { userName, workspaceName } = params
  const subject = `Welcome to Propvora — your account is ready`
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.propvora.com"

  const features = [
    ["Portfolio & Units", "Organise all your properties and units in one view."],
    ["Tenancy Management", "Track leases, rent, and tenant communications."],
    ["Compliance", "Stay on top of certificates and inspections."],
    ["Work Management", "Assign jobs, track progress, manage suppliers."],
    ["Invoicing & Finance", "Invoices, bills, and financial reporting built in."],
  ]

  const body = `
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px;">
      Hi <strong style="color:${BRAND.textPrimary};">${userName || "there"}</strong>,
    </p>
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px;">
      Your Propvora account is ready${workspaceName ? ` and your workspace <strong style="color:${BRAND.textPrimary};">${workspaceName}</strong> has been set up` : ""}.
      Everything you need to manage properties, tenancies, compliance, finances, and your team — in one platform.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
      ${features
        .map(
          ([title, desc]) => `
      <tr>
        <td style="padding:11px 0; border-bottom:1px solid ${BRAND.border};">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width:28px; vertical-align:top; padding-top:1px;">
                <div style="width:20px; height:20px; background:${BRAND.accentLight}; border-radius:50%; text-align:center; line-height:20px; font-size:11px; color:${BRAND.accent}; font-weight:700;">&#10003;</div>
              </td>
              <td>
                <p style="font-size:13px; font-weight:700; color:${BRAND.textPrimary}; margin-bottom:2px;">${title}</p>
                <p style="font-size:12px; color:${BRAND.textMuted};">${desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
        )
        .join("")}
    </table>

    ${ctaButton("Go to your dashboard", `${SITE}/app`)}

    <p style="font-size:12px; color:${BRAND.textFaint}; margin-top:28px; line-height:1.6;">
      Questions? Reply to this email or reach us at
      <a href="mailto:support@propvora.com" style="color:${BRAND.accent};">support@propvora.com</a>.
    </p>
  `

  const html = brandedEmail({
    subject,
    category: "Welcome aboard",
    headline: `Hi ${userName || "there"}, you&rsquo;re in!`,
    body,
  })

  return { subject, html }
}
