interface RentReminderParams {
  tenantName: string
  propertyAddress: string
  amountDue: string
  dueDate: string
}

export function rentReminderEmail(params: RentReminderParams): {
  subject: string
  html: string
} {
  const { tenantName, propertyAddress, amountDue, dueDate } = params

  const subject = `Rent reminder — ${amountDue} due on ${dueDate}`

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
                    <p style="font-size:13px; font-weight:600; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Rent reminder</p>
                    <h1 style="font-size:24px; font-weight:800; color:#FFFFFF; line-height:1.2; margin:0;">Payment due soon</h1>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:24px;">
                      Hi ${tenantName || 'there'},
                    </p>
                    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:28px;">
                      This is a friendly reminder that your rent payment is coming up for:
                    </p>

                    <!-- Payment summary card -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; margin-bottom:32px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding-bottom:14px; border-bottom:1px solid #E2E8F0;">
                                <p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Property</p>
                                <p style="font-size:14px; font-weight:600; color:#0D1B2A;">${propertyAddress}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:14px; padding-bottom:14px; border-bottom:1px solid #E2E8F0;">
                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td>
                                      <p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Amount due</p>
                                      <p style="font-size:22px; font-weight:800; color:#0D1B2A;">${amountDue}</p>
                                    </td>
                                    <td style="text-align:right;">
                                      <p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Due date</p>
                                      <p style="font-size:14px; font-weight:700; color:#DC2626;">${dueDate}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size:14px; color:#64748B; line-height:1.6; margin-bottom:12px;">
                      Please ensure payment is made by the due date to avoid any late fees. If you&rsquo;ve already paid, please disregard this reminder.
                    </p>
                    <p style="font-size:12px; color:#94A3B8; line-height:1.6;">
                      If you have any questions about your tenancy or payment, please contact your property manager.
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
                &copy; ${new Date().getFullYear()} Propvora Ltd. &nbsp;&bull;&nbsp; Sent on behalf of your property manager.
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
