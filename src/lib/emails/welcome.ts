interface WelcomeParams {
  userName: string
  workspaceName: string
}

export function welcomeEmail(params: WelcomeParams): {
  subject: string
  html: string
} {
  const { userName, workspaceName } = params

  const subject = `Welcome to Propvora — your account is ready`

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
                    <p style="font-size:13px; font-weight:600; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Welcome aboard</p>
                    <h1 style="font-size:24px; font-weight:800; color:#FFFFFF; line-height:1.2; margin:0;">Hi ${userName || 'there'}, you&rsquo;re in!</h1>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:24px;">
                      Your Propvora account is ready${workspaceName ? ` and your workspace <strong style="color:#0D1B2A;">${workspaceName}</strong> has been set up` : ''}.
                    </p>
                    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:32px;">
                      Propvora gives you everything you need to manage properties, tenancies, compliance, finances, and your team — all in one place.
                    </p>

                    <!-- Feature list -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      ${[
                        ['Portfolio & Units', 'Organise all your properties and units in one view.'],
                        ['Tenancy Management', 'Track leases, rent, and tenant communications.'],
                        ['Compliance', 'Stay on top of certificates and inspections.'],
                        ['Work Management', 'Assign jobs, track progress, manage suppliers.'],
                        ['Invoicing & Finance', 'Invoices, bills, and financial reporting built in.'],
                      ].map(([title, desc]) => `
                      <tr>
                        <td style="padding:10px 0; border-bottom:1px solid #F1F5F9;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:28px; vertical-align:top; padding-top:2px;">
                                <div style="width:20px; height:20px; background:#EFF6FF; border-radius:50%; text-align:center; line-height:20px; font-size:11px; color:#2563EB; font-weight:700;">&#10003;</div>
                              </td>
                              <td>
                                <p style="font-size:13px; font-weight:700; color:#0D1B2A; margin-bottom:2px;">${title}</p>
                                <p style="font-size:12px; color:#64748B;">${desc}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join('')}
                    </table>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="border-radius:10px; background:#2563EB;">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.propvora.com'}/app"
                             style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px; letter-spacing:0.2px;">
                            Go to your dashboard &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size:12px; color:#94A3B8; margin-top:28px; line-height:1.6;">
                      If you have any questions, reply to this email or reach our team at support@propvora.com.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px; text-align:center;">
              <p style="font-size:12px; color:#94A3B8; line-height:1.6;">
                &copy; ${new Date().getFullYear()} Propvora Ltd. &nbsp;&bull;&nbsp; Property operations, simplified.
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
