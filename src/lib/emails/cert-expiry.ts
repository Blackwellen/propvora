import { brandedEmail, ctaButton, summaryCard, dataRow, BRAND } from "./_base"

interface CertExpiryParams {
  certType: string
  propertyAddress: string
  expiryDate: string
  daysUntilExpiry: number
}

export function certExpiryEmail(params: CertExpiryParams): { subject: string; html: string } {
  const { certType, propertyAddress, expiryDate, daysUntilExpiry } = params
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.propvora.com"

  const urgency = daysUntilExpiry <= 7 ? "URGENT: " : daysUntilExpiry <= 30 ? "Action required: " : ""
  const subject = `${urgency}${certType} expiring in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"} — ${propertyAddress}`

  const urgencyColour = daysUntilExpiry <= 7 ? BRAND.red : daysUntilExpiry <= 30 ? BRAND.amber : BRAND.accent
  const urgencyBg = daysUntilExpiry <= 7 ? "#FEF2F2" : daysUntilExpiry <= 30 ? "#FFFBEB" : BRAND.accentLight
  const urgencyBorder = daysUntilExpiry <= 7 ? "#FECACA" : daysUntilExpiry <= 30 ? "#FDE68A" : "#BFDBFE"
  const urgencyLabel =
    daysUntilExpiry <= 7
      ? "Urgent — expires very soon"
      : daysUntilExpiry <= 30
        ? "Action required"
        : "Upcoming expiry"

  const body = `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
      <tr>
        <td style="background:${urgencyBg}; border:1px solid ${urgencyBorder}; border-radius:8px; padding:10px 16px;">
          <p style="font-size:13px; font-weight:700; color:${urgencyColour};">${urgencyLabel}</p>
        </td>
      </tr>
    </table>

    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:28px;">
      The following compliance certificate requires your attention:
    </p>

    ${summaryCard(`
      ${dataRow("Certificate type", `<span style="font-size:16px;">${certType}</span>`)}
      ${dataRow("Property", propertyAddress)}
      <tr>
        <td style="padding-top:14px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <p style="font-size:11px; font-weight:700; color:${BRAND.textFaint}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Expiry date</p>
                <p style="font-size:14px; font-weight:700; color:${urgencyColour};">${expiryDate}</p>
              </td>
              <td style="text-align:right;">
                <p style="font-size:11px; font-weight:700; color:${BRAND.textFaint}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Days remaining</p>
                <p style="font-size:28px; font-weight:800; color:${urgencyColour}; line-height:1;">${daysUntilExpiry}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `)}

    <p style="font-size:14px; color:${BRAND.textMuted}; line-height:1.7; margin-bottom:28px;">
      Please arrange renewal of this certificate as soon as possible to maintain compliance. Log in to Propvora to update the certificate record once renewed.
    </p>

    ${ctaButton("View compliance dashboard", `${SITE}/app/compliance/certificates`)}
  `

  const html = brandedEmail({
    subject,
    category: "Compliance alert",
    headline: "Certificate expiring soon",
    body,
  })

  return { subject, html }
}
