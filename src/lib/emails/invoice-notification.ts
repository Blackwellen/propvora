interface InvoiceEmailParams {
  recipientName: string
  invoiceNumber: string
  amountDue: string
  dueDate: string
  propertyLabel?: string | null
  workspaceName?: string | null
  payUrl?: string | null
}

/**
 * Transactional invoice-notification email. Mirrors the table-based, email-client
 * safe markup used across Propvora's transactional templates.
 */
export function invoiceNotificationEmail(params: InvoiceEmailParams): {
  subject: string
  html: string
} {
  const { recipientName, invoiceNumber, amountDue, dueDate, propertyLabel, workspaceName, payUrl } = params
  const subject = `Invoice ${invoiceNumber} — ${amountDue} due ${dueDate}`

  const payButton = payUrl
    ? `<tr><td style="padding-top:24px;">
         <a href="${payUrl}" style="display:inline-block; background:#2563EB; color:#FFFFFF; text-decoration:none; font-size:14px; font-weight:700; padding:12px 28px; border-radius:10px;">Pay invoice online</a>
       </td></tr>`
    : ""

  const propertyRow = propertyLabel
    ? `<tr>
         <td style="padding-top:14px; padding-bottom:14px; border-bottom:1px solid #E2E8F0;">
           <p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Property</p>
           <p style="font-size:14px; font-weight:600; color:#0D1B2A;">${propertyLabel}</p>
         </td>
       </tr>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>* { box-sizing: border-box; margin: 0; padding: 0; } body { background-color:#F1F5F9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing:antialiased; }</style>
</head>
<body style="background-color:#F1F5F9; padding:40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td style="padding-bottom:28px; text-align:center;">
          <span style="font-size:22px; font-weight:800; color:#0D1B2A; letter-spacing:-0.5px;">${workspaceName || "Propvora"}</span>
        </td></tr>
        <tr><td style="background:#FFFFFF; border-radius:16px; border:1px solid #E2E8F0; overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%); padding:32px 40px;">
              <p style="font-size:13px; font-weight:600; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Invoice ${invoiceNumber}</p>
              <h1 style="font-size:24px; font-weight:800; color:#FFFFFF; line-height:1.2; margin:0;">You have a new invoice</h1>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="padding:36px 40px;">
              <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:24px;">Hi ${recipientName || "there"},</p>
              <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:28px;">Please find the details of your invoice below.</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; margin-bottom:8px;">
                <tr><td style="padding:24px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    ${propertyRow}
                    <tr><td style="padding-top:14px;">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td><p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Amount due</p>
                            <p style="font-size:22px; font-weight:800; color:#0D1B2A;">${amountDue}</p></td>
                          <td style="text-align:right;"><p style="font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Due date</p>
                            <p style="font-size:14px; font-weight:700; color:#DC2626;">${dueDate}</p></td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${payButton}</table>
              <p style="font-size:12px; color:#94A3B8; line-height:1.6; margin-top:24px;">If you have any questions about this invoice, please reply to this email.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding-top:28px; text-align:center;">
          <p style="font-size:12px; color:#94A3B8; line-height:1.6;">&copy; ${new Date().getFullYear()} ${workspaceName || "Propvora"}. Sent via Propvora &mdash; a trading name of Blackwellen Ltd.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}
