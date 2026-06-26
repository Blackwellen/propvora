/**
 * Shared branded email wrapper for all Propvora transactional emails.
 * Table-based layout — works in Gmail, Outlook (Windows), Apple Mail, Yahoo.
 * Rules: solid colours only (no CSS gradients — they break Outlook), all styles inline,
 * logo hardcoded to staging CDN (not NEXT_PUBLIC_SITE_URL which resolves to localhost in dev).
 */

// Logo image served from staging (confirmed live). All visible links use propvora.com.
// Swap LOGO_CDN to https://propvora.com once that domain's DNS is pointed.
const LOGO_CDN = "https://staging.propvora.com"
const LOGO_URL = `${LOGO_CDN}/propvora-logo-dark.png`
const SITE = "https://propvora.com"
const YEAR = new Date().getFullYear()

/** Brand colour tokens */
export const BRAND = {
  navy: "#0D1B2A",
  navyMid: "#0F172A",
  blue: "#1E3A8A",
  accent: "#2563EB",
  accentDark: "#1d4ed8",
  accentLight: "#EFF6FF",
  accentBorder: "#BFDBFE",
  green: "#059669",
  greenLight: "#ECFDF5",
  red: "#DC2626",
  redLight: "#FEF2F2",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  bg: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E2E8F0",
  cardBg: "#F8FAFC",
  textPrimary: "#0D1B2A",
  textBody: "#334155",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
} as const

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

/** Invisible inbox preview text */
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;">${text}&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;</div>`
}

/** Primary blue CTA button */
export function ctaButton(label: string, href: string): string {
  return `
  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 24px;">
    <tr>
      <td style="border-radius:8px;background:#2563EB;">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;font-family:${FONT};letter-spacing:0.2px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

/** Secondary ghost button */
export function secondaryButton(label: string, href: string): string {
  return `
  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0;">
    <tr>
      <td style="border-radius:8px;border:2px solid #E2E8F0;">
        <a href="${href}" style="display:inline-block;padding:12px 24px;font-size:13px;font-weight:600;color:#334155;text-decoration:none;border-radius:8px;font-family:${FONT};">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

/** Highlighted alert/info box */
export function infoBox(text: string, tone: "info" | "success" | "warning" | "danger" = "info"): string {
  const config = {
    info:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#1d4ed8", icon: "ℹ" },
    success: { bg: "#ECFDF5", border: "#A7F3D0", color: "#059669", icon: "✓" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", icon: "!" },
    danger:  { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", icon: "✕" },
  }[tone]
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
    <tr>
      <td style="background:${config.bg};border:1px solid ${config.border};border-radius:8px;padding:14px 18px;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:22px;vertical-align:top;padding-right:10px;font-size:14px;color:${config.color};font-weight:700;">${config.icon}</td>
            <td style="font-size:13px;color:${config.color};line-height:1.6;font-family:${FONT};">${text}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

/** Divider line */
export function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;"><tr><td style="height:1px;background:#E2E8F0;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
}

/** Summary card row */
export function dataRow(label: string, value: string, valueStyle = "", border = true): string {
  return `
  <tr>
    <td style="padding:${border ? "14px 0" : "10px 0"};${border ? "border-bottom:1px solid #E2E8F0;" : ""}">
      <p style="font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.9px;margin:0 0 4px;font-family:${FONT};">${label}</p>
      <p style="font-size:14px;font-weight:600;color:#0D1B2A;font-family:${FONT};${valueStyle}margin:0;">${value}</p>
    </td>
  </tr>`
}

/** Summary card container */
export function summaryCard(rows: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:28px;">
    <tr><td style="padding:22px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${rows}</table>
    </td></tr>
  </table>`
}

/**
 * Full branded email shell.
 * Solid-colour design — no CSS gradients so Outlook renders correctly.
 */
export function brandedEmail(opts: {
  subject: string
  preheaderText?: string
  category: string
  headline: string
  iconEmoji?: string
  body: string
  footerNote?: string
}): string {
  const { subject, preheaderText, category, headline, iconEmoji, body, footerNote } = opts

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>${subject}</title>
  <style>
    * { box-sizing:border-box; }
    body { margin:0; padding:0; background:#F1F5F9; font-family:${FONT}; -webkit-font-smoothing:antialiased; }
    a { color:#2563EB; }
    @media only screen and (max-width:600px) {
      .outer { padding:20px 12px !important; }
      .card-inner { padding:24px 20px !important; }
      .hero { padding:28px 24px !important; }
      .logo-cell { padding:20px 24px 16px !important; }
      h1.headline { font-size:20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;">

  ${preheaderText ? preheader(preheaderText) : ""}

  <table class="outer" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F1F5F9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

        <!-- Blue top bar -->
        <tr>
          <td style="background:#2563EB;height:4px;border-radius:6px 6px 0 0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- White card -->
        <tr>
          <td style="background:#ffffff;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 12px 12px;overflow:hidden;">

            <!-- Logo row -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td class="logo-cell" style="padding:28px 40px 20px;border-bottom:1px solid #F1F5F9;">
                  <a href="https://propvora.com" style="text-decoration:none;display:inline-block;">
                    <!--[if !mso]><!-->
                    <img src="${LOGO_URL}"
                         alt="Propvora"
                         width="140"
                         style="display:block;width:140px;height:auto;border:0;outline:0;"
                         onerror="this.style.display='none'" />
                    <!--<![endif]-->
                    <!--[if mso]><span style="font-size:22px;font-weight:800;color:#0D1B2A;font-family:Arial,sans-serif;text-decoration:none;">Propvora</span><![endif]-->
                  </a>
                </td>
              </tr>
            </table>

            <!-- Dark hero header — solid colour (no gradient, works in all clients) -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td class="hero" style="background:#0D1B2A;padding:36px 40px;">
                  <table cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      ${iconEmoji ? `<td style="vertical-align:middle;padding-right:16px;">
                        <div style="width:48px;height:48px;background:#1e3a8a;border-radius:10px;text-align:center;line-height:48px;font-size:22px;">${iconEmoji}</div>
                      </td>` : ""}
                      <td style="vertical-align:middle;">
                        <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.4px;margin:0 0 8px;font-family:${FONT};">Propvora &nbsp;&middot;&nbsp; ${category}</p>
                        <h1 class="headline" style="font-size:24px;font-weight:800;color:#ffffff;line-height:1.25;margin:0;font-family:${FONT};letter-spacing:-0.3px;">${headline}</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Body -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td class="card-inner" style="padding:36px 40px;">
                  ${body}
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:28px 40px;border-radius:0 0 12px 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="text-align:center;padding-bottom:14px;">
                        <img src="${LOGO_URL}" alt="Propvora" width="80"
                             style="display:inline-block;width:80px;height:auto;opacity:0.25;border:0;"
                             onerror="this.style.display='none'" />
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align:center;padding-bottom:10px;">
                        <a href="https://propvora.com/help" style="font-size:12px;color:#94A3B8;text-decoration:none;font-family:${FONT};padding:0 8px;">Help</a>
                        <span style="color:#CBD5E1;">&middot;</span>
                        <a href="https://propvora.com/legal/privacy" style="font-size:12px;color:#94A3B8;text-decoration:none;font-family:${FONT};padding:0 8px;">Privacy</a>
                        <span style="color:#CBD5E1;">&middot;</span>
                        <a href="https://propvora.com/legal/terms" style="font-size:12px;color:#94A3B8;text-decoration:none;font-family:${FONT};padding:0 8px;">Terms</a>
                        <span style="color:#CBD5E1;">&middot;</span>
                        <a href="mailto:support@propvora.com" style="font-size:12px;color:#94A3B8;text-decoration:none;font-family:${FONT};padding:0 8px;">Support</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align:center;">
                        <p style="font-size:11px;color:#94A3B8;line-height:1.7;margin:0;font-family:${FONT};">
                          &copy; ${YEAR} Propvora &nbsp;&middot;&nbsp; Blackwellen Ltd (Co.&nbsp;16482166) &nbsp;&middot;&nbsp; Registered in England &amp; Wales
                        </p>
                        ${footerNote ? `<p style="font-size:11px;color:#94A3B8;margin:4px 0 0;font-family:${FONT};">${footerNote}</p>` : ""}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`
}

export { LOGO_URL, YEAR, FONT as FONT_STACK }
