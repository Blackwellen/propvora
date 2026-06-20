import { brandedEmail, summaryCard, BRAND } from "./_base"

interface RentReminderParams {
  tenantName: string
  propertyAddress: string
  amountDue: string
  dueDate: string
}

export function rentReminderEmail(params: RentReminderParams): { subject: string; html: string } {
  const { tenantName, propertyAddress, amountDue, dueDate } = params
  const subject = `Rent reminder — ${amountDue} due on ${dueDate}`

  const body = `
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px;">
      Hi <strong style="color:${BRAND.textPrimary};">${tenantName || "there"}</strong>,
    </p>
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:28px;">
      This is a friendly reminder that your rent payment is coming up:
    </p>

    ${summaryCard(`
      <tr>
        <td style="padding-bottom:14px; border-bottom:1px solid ${BRAND.border};">
          <p style="font-size:11px; font-weight:700; color:${BRAND.textFaint}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Property</p>
          <p style="font-size:14px; font-weight:600; color:${BRAND.textPrimary};">${propertyAddress}</p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:14px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <p style="font-size:11px; font-weight:700; color:${BRAND.textFaint}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Amount due</p>
                <p style="font-size:28px; font-weight:800; color:${BRAND.textPrimary}; line-height:1;">${amountDue}</p>
              </td>
              <td style="text-align:right;">
                <p style="font-size:11px; font-weight:700; color:${BRAND.textFaint}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Due date</p>
                <p style="font-size:14px; font-weight:700; color:${BRAND.red};">${dueDate}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `)}

    <p style="font-size:14px; color:${BRAND.textMuted}; line-height:1.7; margin-bottom:12px;">
      Please ensure payment is made by the due date to avoid any late fees. If you&rsquo;ve already paid, please disregard this reminder.
    </p>
    <p style="font-size:12px; color:${BRAND.textFaint}; line-height:1.6;">
      If you have any questions about your tenancy or payment, please contact your property manager.
    </p>
  `

  const html = brandedEmail({
    subject,
    category: "Rent reminder",
    headline: "Payment due soon",
    body,
    footerNote: "Sent on behalf of your property manager.",
  })

  return { subject, html }
}
