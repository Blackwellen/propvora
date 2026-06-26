import { brandedEmail, ctaButton, infoBox, BRAND } from "./_base"

const FONT_STACK = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

interface WelcomeParams {
  userName: string
  workspaceName: string
}

export function welcomeEmail(params: WelcomeParams): { subject: string; html: string } {
  const { userName, workspaceName } = params
  const displayName = userName || "there"
  const subject = `Welcome to Propvora — your workspace is ready`
  const SITE = "https://propvora.com"

  const features = [
    { icon: "&#127968;", title: "Portfolio & Units", desc: "Organise all your properties and units in one view." },
    { icon: "&#128203;", title: "Tenancy Management", desc: "Track leases, rent schedules and tenant communications." },
    { icon: "&#9989;", title: "Compliance", desc: "Certificates, inspections and legal deadlines — never missed." },
    { icon: "&#128295;", title: "Work Management", desc: "Assign jobs, track progress and manage suppliers." },
    { icon: "&#128176;", title: "Invoicing & Finance", desc: "Invoices, bills and financial reporting built in." },
    { icon: "&#129302;", title: "AI Copilot", desc: "AI-powered operations assistant — built for property." },
  ]

  const featureGrid = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
      ${features.map((f, i) => `
      <tr>
        <td style="padding:12px 0; ${i < features.length - 1 ? `border-bottom:1px solid ${BRAND.border};` : ""}">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width:36px; vertical-align:top; padding-top:1px;">
                <div style="width:28px; height:28px; background:${BRAND.accentLight}; border-radius:7px; text-align:center; line-height:28px; font-size:15px;">${f.icon}</div>
              </td>
              <td style="padding-left:4px; vertical-align:middle;">
                <p style="font-size:13px; font-weight:700; color:${BRAND.textPrimary}; margin-bottom:2px; font-family:${FONT_STACK};">${f.title}</p>
                <p style="font-size:12px; color:${BRAND.textMuted}; font-family:${FONT_STACK}; line-height:1.5;">${f.desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("")}
    </table>`

  const body = `
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:16px; font-family:${FONT_STACK};">
      Hi <strong style="color:${BRAND.textPrimary};">${displayName}</strong>,
    </p>
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:24px; font-family:${FONT_STACK};">
      Your Propvora account is ready${workspaceName ? ` and your workspace <strong style="color:${BRAND.textPrimary};">&ldquo;${workspaceName}&rdquo;</strong> has been created` : ""}. You now have everything you need to run your property operations — from day-to-day maintenance to long-term compliance.
    </p>

    ${featureGrid}

    ${ctaButton("Open your dashboard", `${SITE}/property-manager`)}

    <p style="font-size:13px; color:${BRAND.textMuted}; margin-top:28px; line-height:1.6; font-family:${FONT_STACK};">
      Need help getting started? Visit our <a href="https://propvora.com/help" style="color:${BRAND.accent};font-weight:600;">Help Centre</a> or reply to this email &mdash; we&rsquo;re here.
    </p>
  `

  return {
    subject,
    html: brandedEmail({
      subject,
      preheaderText: `Hi ${displayName}, your Propvora workspace is live and ready to use.`,
      category: "Welcome aboard",
      headline: `You&rsquo;re in, ${displayName}`,
      iconEmoji: "&#127968;",
      body,
    }),
  }
}
