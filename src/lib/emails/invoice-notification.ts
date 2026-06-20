import { brandedEmail, ctaButton, summaryCard, BRAND } from "./_base"

interface InvoiceEmailParams {
  recipientName: string
  invoiceNumber: string
  amountDue: string
  dueDate: string
  propertyLabel?: string | null
  workspaceName?: string | null
  payUrl?: string | null
}

export function invoiceNotificationEmail(params: InvoiceEmailParams): { subject: string; html: string } {
  const { recipientName, invoiceNumber, amountDue, dueDate, propertyLabel, workspaceName, payUrl } = params
  const subject = `Invoice ${invoiceNumber} — ${amountDue} due ${dueDate}`

  const propertyRow = propertyLabel
    ? `<tr>
        <td style="padding-bottom:14px; border-bottom:1px solid ${BRAND.border};">
          <p style="font-size:11px; font-weight:700; color:${BRAND.textFaint}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">Property</p>
          <p style="font-size:14px; font-weight:600; color:${BRAND.textPrimary};">${propertyLabel}</p>
        </td>
       </tr>`
    : ""

  const body = `
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px;">
      Hi <strong style="color:${BRAND.textPrimary};">${recipientName || "there"}</strong>,
    </p>
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:28px;">
      Please find the details of your invoice below.
    </p>

    ${summaryCard(`
      ${propertyRow}
      <tr>
        <td style="padding-top:${propertyLabel ? "14px" : "0"};">
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

    ${payUrl ? ctaButton("Pay invoice online", payUrl) : ""}

    <p style="font-size:12px; color:${BRAND.textFaint}; line-height:1.6; margin-top:24px;">
      If you have any questions about this invoice, please reply to this email.
    </p>
  `

  const html = brandedEmail({
    subject,
    category: `Invoice ${invoiceNumber}`,
    headline: "You have a new invoice",
    body,
    footerNote: workspaceName
      ? `Sent on behalf of ${workspaceName} via Propvora.`
      : undefined,
  })

  return { subject, html }
}
