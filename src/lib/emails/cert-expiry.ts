interface CertExpiryParams {
  certType: string
  propertyAddress: string
  expiryDate: string
  daysUntilExpiry: number
}

export function certExpiryEmail(params: CertExpiryParams): {
  subject: string
  html: string
} {
  const { certType, propertyAddress, expiryDate, daysUntilExpiry } = params

  const urgency = daysUntilExpiry <= 7 ? 'URGENT: ' : daysUntilExpiry <= 30 ? 'Action required: ' : ''
  const subject = `${urgency}${certType} expiring in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} — ${propertyAddress}`

  const urgencyColour = daysUntilExpiry <= 7 ? '#DC2626' : daysUntilExpiry <= 30 ? '#D97706' : '#2563EB'
  const urgencyBg = daysUntilExpiry <= 7 ? '#FEF2F2' : daysUntilExpiry <= 30 ? '#FFFBEB' : '#EFF6FF'
  const urgencyBorder = daysUntilExpiry <= 7 ? '#FECACA' : daysUntilExpiry <= 30 ? '#FDE68A' : '#BFDBFE'
  const urgencyLabel = daysUntilExpiry <= 7 ? 'Urgent — expires very soon' : daysUntilExpiry <= 30 ? 'Action required' : 'Upcoming expiry'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="background-color:#F1F5F9; padding:40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">

          <!-- Logo bar -->
          <tr>
            <td style="padding-bottom:28px; text-align:center;">
              <span style="font-size:22px; font-weight:800; color:#0D1B2A; letter-spacing:-0.5px;">
                Propvora
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF; border-radius:16px; border:1px solid #E2E8F0; overflow:hidden;">

              <!-- Header strip -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%); padding:32px 40px;">
                    <p style="font-size:13px; font-weight:600; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Compliance alert</p>
                    <h1 style="font-size:24px; font-weight:800; color:#FFFFFF; line-height:1.2; margin:0;">Certificate expiring soon</h1>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 40px;">

                    <!-- Urgency badge -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:${urgencyBg}; border:1px solid ${urgencyBorder}; border-radius:8px; padding:10px 16px;">
                          <p style="font-size:13px; font-weight:700; color:${urgencyColour};">${urgencyLabel}</p>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:28px;">
                      The following compliance certificate requires your attention:
                    </p>

                    <!-- Certificate summary card -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; margin-bottom:32px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding-bottom:14px; border-bottom:1px solid #E2E8F0;">
                                <p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Certificate type</p>
                                <p style="font-size:16px; font-weight:700; color:#0D1B2A;">${certType}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:14px; padding-bottom:14px; border-bottom:1px solid #E2E8F0;">
                                <p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Property</p>
                                <p style="font-size:14px; font-weight:600; color:#0D1B2A;">${propertyAddress}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:14px;">
                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td>
                                      <p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Expiry date</p>
                                      <p style="font-size:14px; font-weight:700; color:${urgencyColour};">${expiryDate}</p>
                                    </td>
                                    <td style="text-align:right;">
                                      <p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Days remaining</p>
                                      <p style="font-size:22px; font-weight:800; color:${urgencyColour};">${daysUntilExpiry}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size:14px; color:#64748B; line-height:1.6; margin-bottom:24px;">
                      Please arrange renewal of this certificate as soon as possible to maintain compliance. Log in to Propvora to update the certificate record once renewed.
                    </p>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="border-radius:10px; background:#2563EB;">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.propvora.com'}/app/compliance/certificates"
                             style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px; letter-spacing:0.2px;">
                            View compliance dashboard &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px; text-align:center;">
              <p style="font-size:12px; color:#94A3B8; line-height:1.6;">
                &copy; ${new Date().getFullYear()} Blackwellen Ltd, trading as Propvora. &nbsp;&bull;&nbsp; Compliance alerts powered by Propvora.
              </p>
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
