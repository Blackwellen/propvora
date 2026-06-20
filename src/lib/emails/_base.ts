/**
 * Shared branded email wrapper for all Propvora transactional emails.
 * Uses table-based layout for maximum email client compatibility.
 * Logo is hosted at NEXT_PUBLIC_SITE_URL/propvora-logo-dark.png with text fallback.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://propvora.com"
const LOGO_URL = `${SITE}/propvora-logo-dark.png`
const YEAR = new Date().getFullYear()

/** Brand colour tokens */
export const BRAND = {
  navy: "#0D1B2A",
  navyMid: "#0F172A",
  blue: "#1E3A8A",
  accent: "#2563EB",
  accentLight: "#EFF6FF",
  red: "#DC2626",
  amber: "#D97706",
  bg: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E2E8F0",
  cardBg: "#F8FAFC",
  textPrimary: "#0D1B2A",
  textBody: "#334155",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
} as const

/** Branded logo bar shown above every email card */
function logoBar(): string {
  return `
  <tr>
    <td style="padding-bottom:24px; text-align:center;">
      <!--[if !mso]><!-->
      <img src="${LOGO_URL}" alt="Propvora" width="140" height="32"
           style="display:inline-block; width:140px; height:auto; max-height:32px; object-fit:contain;"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" />
      <!--<![endif]-->
      <span style="display:none; font-size:22px; font-weight:800; color:${BRAND.navy}; letter-spacing:-0.5px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        &#x25C6; Propvora
      </span>
    </td>
  </tr>`
}

/** Dark gradient header strip with category label + headline */
export function emailHeader(category: string, headline: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td style="background:linear-gradient(135deg,${BRAND.navyMid} 0%,${BRAND.blue} 100%); padding:32px 40px; border-radius:16px 16px 0 0;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding-right:12px; vertical-align:middle;">
              <div style="width:36px; height:36px; background:rgba(255,255,255,0.12); border-radius:8px; text-align:center; line-height:36px;">
                <span style="font-size:18px;">&#x25C6;</span>
              </div>
            </td>
            <td style="vertical-align:middle;">
              <p style="font-size:11px; font-weight:700; color:rgba(255,255,255,0.55); text-transform:uppercase; letter-spacing:1.2px; margin:0 0 4px;">Propvora &nbsp;&#xb7;&nbsp; ${category}</p>
              <h1 style="font-size:22px; font-weight:800; color:#FFFFFF; line-height:1.2; margin:0;">${headline}</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

/** Primary blue CTA button */
export function ctaButton(label: string, href: string): string {
  return `
  <table cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td style="border-radius:10px; background:${BRAND.accent}; box-shadow:0 2px 8px rgba(37,99,235,0.30);">
        <a href="${href}"
           style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px; letter-spacing:0.3px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          ${label} &nbsp;&rarr;
        </a>
      </td>
    </tr>
  </table>`
}

/** Secondary ghost CTA */
export function secondaryButton(label: string, href: string): string {
  return `
  <table cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td style="border-radius:10px; border:2px solid ${BRAND.border};">
        <a href="${href}"
           style="display:inline-block; padding:11px 24px; font-size:13px; font-weight:600; color:${BRAND.textBody}; text-decoration:none; border-radius:8px; letter-spacing:0.2px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

/** Branded footer with legal line, unsubscribe, and social links */
function emailFooter(extraLine?: string): string {
  return `
  <tr>
    <td style="padding-top:32px; text-align:center; border-top:1px solid ${BRAND.border};">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="text-align:center; padding-bottom:12px;">
            <img src="${LOGO_URL}" alt="Propvora" width="80" height="18"
                 style="display:inline-block; width:80px; height:auto; opacity:0.4;" />
          </td>
        </tr>
        <tr>
          <td style="text-align:center;">
            <p style="font-size:12px; color:${BRAND.textFaint}; line-height:1.7; margin:0;">
              &copy; ${YEAR} <a href="https://propvora.com" style="color:${BRAND.textFaint}; text-decoration:none;">Propvora</a>
              &nbsp;&bull;&nbsp; Blackwellen Ltd (Co. 16482166) &nbsp;&bull;&nbsp; <a href="https://propvora.com/legal/privacy" style="color:${BRAND.textFaint}; text-decoration:underline;">Privacy</a>
              &nbsp;&bull;&nbsp; <a href="https://propvora.com/legal/terms" style="color:${BRAND.textFaint}; text-decoration:underline;">Terms</a>
            </p>
            ${extraLine ? `<p style="font-size:11px; color:${BRAND.textFaint}; line-height:1.6; margin:6px 0 0;">${extraLine}</p>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

/** Global shared styles injected into every email <style> block */
const SHARED_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background-color:${BRAND.bg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
  a { color:${BRAND.accent}; }
`

/**
 * Wraps the given body HTML in the full branded email shell.
 * @param body  - inner content rows (everything inside the white card body)
 * @param subject - used as <title>
 * @param footerNote - optional extra line in the footer (e.g. "Sent on behalf of…")
 */
export function brandedEmail(opts: {
  subject: string
  category: string
  headline: string
  body: string
  footerNote?: string
}): string {
  const { subject, category, headline, body, footerNote } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${subject}</title>
  <style>${SHARED_STYLES}</style>
</head>
<body style="background-color:${BRAND.bg}; padding:40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0" role="presentation">

          ${logoBar()}

          <!-- Card -->
          <tr>
            <td style="background:${BRAND.card}; border-radius:16px; border:1px solid ${BRAND.border}; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">

              ${emailHeader(category, headline)}

              <!-- Body content -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 40px;">
                    ${body}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          ${emailFooter(footerNote)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Helper: info/data row pair for summary cards */
export function dataRow(label: string, value: string, valueStyle = "", border = true): string {
  return `
  <tr>
    <td style="padding:${border ? "14px 0" : "10px 0"}; ${border ? "border-bottom:1px solid " + BRAND.border + ";" : ""}">
      <p style="font-size:11px; font-weight:700; color:${BRAND.textFaint}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">${label}</p>
      <p style="font-size:14px; font-weight:600; color:${BRAND.textPrimary}; ${valueStyle}">${value}</p>
    </td>
  </tr>`
}

/** Helper: summary card container */
export function summaryCard(rows: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:${BRAND.cardBg}; border:1px solid ${BRAND.border}; border-radius:12px; margin-bottom:28px;">
    <tr>
      <td style="padding:22px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${rows}
        </table>
      </td>
    </tr>
  </table>`
}

export { logoBar, emailFooter, SITE, YEAR }
