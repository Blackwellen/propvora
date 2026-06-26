/**
 * Supabase Auth email templates for Propvora.
 *
 * These are pushed to the Supabase project via the Management API.
 * Variables like {{ .ConfirmationURL }} and {{ .Token }} are Supabase Go template syntax
 * and are replaced at send time by Supabase's mailer.
 *
 * Push with: scripts/push-supabase-email-templates.mjs
 */

const SITE = "https://propvora.com"
const LOGO_URL = `${SITE}/propvora-logo-dark.png`
const YEAR = new Date().getFullYear()

const BRAND = {
  navy: "#0D1B2A",
  navyMid: "#0F172A",
  blue: "#1E3A8A",
  accent: "#2563EB",
  accentLight: "#EFF6FF",
  accentBorder: "#BFDBFE",
  green: "#059669",
  greenLight: "#ECFDF5",
  bg: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E2E8F0",
  cardBg: "#F8FAFC",
  textPrimary: "#0D1B2A",
  textBody: "#334155",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
}

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

function shell(opts: {
  subject: string
  preheader: string
  category: string
  headline: string
  icon: string
  body: string
  footerNote?: string
}): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${opts.subject}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background-color:${BRAND.bg}; font-family:${FONT}; -webkit-font-smoothing:antialiased; }
    a { color:${BRAND.accent}; }
    @media only screen and (max-width:600px) {
      .email-body { padding:24px 20px !important; }
    }
  </style>
</head>
<body style="background-color:${BRAND.bg}; margin:0; padding:40px 16px;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ffffff;">${opts.preheader}&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0" role="presentation">

          <!-- Top accent bar -->
          <tr>
            <td style="background:linear-gradient(90deg,${BRAND.accent} 0%,#1e40af 100%); height:4px; border-radius:4px 4px 0 0; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${BRAND.card}; border-radius:0 0 16px 16px; border:1px solid ${BRAND.border}; border-top:none; overflow:hidden; box-shadow:0 4px 32px rgba(0,0,0,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">

                <!-- Logo bar -->
                <tr>
                  <td style="padding:28px 40px 20px;">
                    <img src="${LOGO_URL}" alt="Propvora" width="130" height="28"
                         style="display:inline-block; width:130px; height:auto; max-height:28px; object-fit:contain;" />
                  </td>
                </tr>

                <!-- Hero header -->
                <tr>
                  <td style="padding:0 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background:linear-gradient(135deg,${BRAND.navyMid} 0%,${BRAND.blue} 100%); padding:32px 36px; border-radius:12px;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding-right:14px; vertical-align:middle;">
                                <div style="width:42px; height:42px; background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.15); border-radius:10px; text-align:center; line-height:42px; font-size:20px;">${opts.icon}</div>
                              </td>
                              <td style="vertical-align:middle;">
                                <p style="font-size:10px; font-weight:700; color:rgba(255,255,255,0.50); text-transform:uppercase; letter-spacing:1.4px; margin:0 0 5px; font-family:${FONT};">Propvora &nbsp;&middot;&nbsp; ${opts.category}</p>
                                <h1 style="font-size:22px; font-weight:800; color:#FFFFFF; line-height:1.25; margin:0; font-family:${FONT}; letter-spacing:-0.2px;">${opts.headline}</h1>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td class="email-body" style="padding:32px 40px;">
                    ${opts.body}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px 28px; border-top:1px solid ${BRAND.border};">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="text-align:center; padding-bottom:12px;">
                          <img src="${LOGO_URL}" alt="Propvora" width="80" height="18"
                               style="display:inline-block; width:80px; height:auto; opacity:0.30;" />
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align:center; padding-bottom:8px;">
                          <a href="${SITE}/help" style="font-size:12px; color:${BRAND.textFaint}; text-decoration:none; font-family:${FONT}; padding:0 8px;">Help</a>
                          <span style="color:${BRAND.border};">&middot;</span>
                          <a href="${SITE}/legal/privacy" style="font-size:12px; color:${BRAND.textFaint}; text-decoration:none; font-family:${FONT}; padding:0 8px;">Privacy</a>
                          <span style="color:${BRAND.border};">&middot;</span>
                          <a href="${SITE}/legal/terms" style="font-size:12px; color:${BRAND.textFaint}; text-decoration:none; font-family:${FONT}; padding:0 8px;">Terms</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align:center;">
                          <p style="font-size:11px; color:${BRAND.textFaint}; line-height:1.7; margin:0; font-family:${FONT};">
                            &copy; ${YEAR} Propvora &nbsp;&middot;&nbsp; Blackwellen Ltd (Co. 16482166) &nbsp;&middot;&nbsp; Registered in England &amp; Wales
                          </p>
                          ${opts.footerNote ? `<p style="font-size:11px; color:${BRAND.textFaint}; margin:4px 0 0; font-family:${FONT};">${opts.footerNote}</p>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaBtn(label: string, href: string): string {
  return `
  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:4px 0;">
    <tr>
      <td style="border-radius:10px; background:${BRAND.accent}; box-shadow:0 3px 12px rgba(37,99,235,0.30);">
        <a href="${href}" style="display:inline-block; padding:14px 32px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px; font-family:${FONT}; letter-spacing:0.2px;">
          ${label} &nbsp;&#x2192;
        </a>
      </td>
    </tr>
  </table>`
}

function securityNote(text: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
    <tr>
      <td style="background:${BRAND.accentLight}; border:1px solid ${BRAND.accentBorder}; border-radius:10px; padding:13px 16px;">
        <p style="font-size:12px; color:${BRAND.accent}; line-height:1.6; margin:0; font-family:${FONT};">&#x1F512;&nbsp; ${text}</p>
      </td>
    </tr>
  </table>`
}

// ─── Confirm email (signup verification) ─────────────────────────────────────

export const confirmSignupTemplate = {
  subject: "Confirm your Propvora account",
  body: shell({
    subject: "Confirm your Propvora account",
    preheader: "One click to verify your email and activate your Propvora account.",
    category: "Account setup",
    headline: "Confirm your email address",
    icon: "&#x2709;",
    body: `
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px; font-family:${FONT};">
        Thanks for signing up to Propvora. Please click the button below to verify your email address and activate your account.
      </p>
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:28px; font-family:${FONT};">
        This link expires in <strong style="color:${BRAND.textPrimary};">24 hours</strong>.
      </p>

      ${ctaBtn("Confirm my email", "{{ .ConfirmationURL }}")}

      ${securityNote("If you didn&rsquo;t create a Propvora account, you can safely ignore this email. No account has been activated.")}

      <p style="font-size:11px; color:${BRAND.textFaint}; margin-top:24px; word-break:break-all; line-height:1.5; font-family:${FONT};">
        Or copy this link: <a href="{{ .ConfirmationURL }}" style="color:${BRAND.textFaint}; text-decoration:underline;">{{ .ConfirmationURL }}</a>
      </p>
    `,
  }),
}

// ─── Password reset ───────────────────────────────────────────────────────────

export const passwordResetTemplate = {
  subject: "Reset your Propvora password",
  body: shell({
    subject: "Reset your Propvora password",
    preheader: "Use this link to set a new password for your Propvora account.",
    category: "Account security",
    headline: "Reset your password",
    icon: "&#x1F512;",
    body: `
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px; font-family:${FONT};">
        We received a request to reset the password for your Propvora account. Click the button below to choose a new password.
      </p>
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:28px; font-family:${FONT};">
        This link expires in <strong style="color:${BRAND.textPrimary};">1 hour</strong> and can only be used once.
      </p>

      ${ctaBtn("Reset my password", "{{ .ConfirmationURL }}")}

      ${securityNote("If you didn&rsquo;t request a password reset, please ignore this email. Your password has not been changed. If you&rsquo;re concerned, contact <a href='mailto:support@propvora.com' style='color:${BRAND.accent};'>support@propvora.com</a>.")}

      <p style="font-size:11px; color:${BRAND.textFaint}; margin-top:24px; word-break:break-all; line-height:1.5; font-family:${FONT};">
        Or copy this link: <a href="{{ .ConfirmationURL }}" style="color:${BRAND.textFaint}; text-decoration:underline;">{{ .ConfirmationURL }}</a>
      </p>
    `,
  }),
}

// ─── Magic link ───────────────────────────────────────────────────────────────

export const magicLinkTemplate = {
  subject: "Your Propvora sign-in link",
  body: shell({
    subject: "Your Propvora sign-in link",
    preheader: "Your one-click sign-in link for Propvora — expires in 1 hour.",
    category: "Sign in",
    headline: "Your sign-in link",
    icon: "&#x26A1;",
    body: `
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px; font-family:${FONT};">
        Click the button below to sign in to your Propvora account. No password needed.
      </p>
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:28px; font-family:${FONT};">
        This link expires in <strong style="color:${BRAND.textPrimary};">1 hour</strong> and can only be used once.
      </p>

      ${ctaBtn("Sign in to Propvora", "{{ .ConfirmationURL }}")}

      ${securityNote("If you didn&rsquo;t request this link, you can safely ignore this email. Your account has not been accessed.")}

      <p style="font-size:11px; color:${BRAND.textFaint}; margin-top:24px; word-break:break-all; line-height:1.5; font-family:${FONT};">
        Or copy this link: <a href="{{ .ConfirmationURL }}" style="color:${BRAND.textFaint}; text-decoration:underline;">{{ .ConfirmationURL }}</a>
      </p>
    `,
  }),
}

// ─── Email change confirmation ────────────────────────────────────────────────

export const emailChangeTemplate = {
  subject: "Confirm your new email address — Propvora",
  body: shell({
    subject: "Confirm your new email address — Propvora",
    preheader: "Confirm your new email address to complete the change on your Propvora account.",
    category: "Account security",
    headline: "Confirm your new email",
    icon: "&#x2709;",
    body: `
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px; font-family:${FONT};">
        You requested to change the email address on your Propvora account. Click the button below to confirm this new address.
      </p>
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:28px; font-family:${FONT};">
        You must confirm from <strong>both</strong> your old and new email addresses to complete the change.
        This link expires in <strong style="color:${BRAND.textPrimary};">24 hours</strong>.
      </p>

      ${ctaBtn("Confirm new email address", "{{ .ConfirmationURL }}")}

      ${securityNote("If you didn&rsquo;t request this change, please contact <a href='mailto:support@propvora.com' style='color:${BRAND.accent};'>support@propvora.com</a> immediately.")}

      <p style="font-size:11px; color:${BRAND.textFaint}; margin-top:24px; word-break:break-all; line-height:1.5; font-family:${FONT};">
        Or copy this link: <a href="{{ .ConfirmationURL }}" style="color:${BRAND.textFaint}; text-decoration:underline;">{{ .ConfirmationURL }}</a>
      </p>
    `,
  }),
}

// ─── MFA / OTP ────────────────────────────────────────────────────────────────

export const mfaOtpTemplate = {
  subject: "Your Propvora verification code",
  body: shell({
    subject: "Your Propvora verification code",
    preheader: "Your one-time verification code for Propvora.",
    category: "Account security",
    headline: "Your verification code",
    icon: "&#x1F512;",
    body: `
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:24px; font-family:${FONT};">
        Use the code below to complete your sign-in to Propvora. This code is valid for <strong style="color:${BRAND.textPrimary};">10 minutes</strong>.
      </p>

      <!-- OTP Code block -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td style="background:${BRAND.accentLight}; border:1px solid ${BRAND.accentBorder}; border-radius:12px; padding:24px; text-align:center;">
            <p style="font-size:11px; font-weight:700; color:${BRAND.accent}; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:10px; font-family:${FONT};">Verification code</p>
            <p style="font-size:40px; font-weight:800; color:${BRAND.navy}; letter-spacing:12px; font-family:${FONT}; margin:0; line-height:1;">{{ .Token }}</p>
          </td>
        </tr>
      </table>

      ${securityNote("Never share this code with anyone. Propvora staff will never ask for your verification code. If you didn&rsquo;t request this, please ignore this email.")}
    `,
  }),
}

// ─── Invite (Supabase-generated) ──────────────────────────────────────────────

export const inviteTemplate = {
  subject: "You've been invited to join Propvora",
  body: shell({
    subject: "You've been invited to join Propvora",
    preheader: "You've been invited to join a workspace on Propvora — the property management platform.",
    category: "Invitation",
    headline: "You&rsquo;ve been invited",
    icon: "&#128101;",
    body: `
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px; font-family:${FONT};">
        You&rsquo;ve been invited to join a workspace on <strong style="color:${BRAND.textPrimary};">Propvora</strong> — the all-in-one platform for property operations.
      </p>
      <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:28px; font-family:${FONT};">
        Click the button below to accept your invitation and set up your account. This invitation expires in <strong style="color:${BRAND.textPrimary};">7 days</strong>.
      </p>

      ${ctaBtn("Accept invitation", "{{ .ConfirmationURL }}")}

      ${securityNote("If you weren&rsquo;t expecting this invitation, you can safely ignore this email.")}

      <p style="font-size:11px; color:${BRAND.textFaint}; margin-top:24px; word-break:break-all; line-height:1.5; font-family:${FONT};">
        Or copy this link: <a href="{{ .ConfirmationURL }}" style="color:${BRAND.textFaint}; text-decoration:underline;">{{ .ConfirmationURL }}</a>
      </p>
    `,
  }),
}
