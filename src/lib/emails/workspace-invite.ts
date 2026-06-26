import { brandedEmail, ctaButton, infoBox, BRAND } from "./_base"

const FONT_STACK = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

interface WorkspaceInviteParams {
  inviteeName: string
  workspaceName: string
  inviteUrl: string
  inviterName?: string
}

export function workspaceInviteEmail(params: WorkspaceInviteParams): { subject: string; html: string } {
  const { inviteeName, workspaceName, inviteUrl, inviterName } = params
  const displayName = inviteeName || "there"
  const subject = `You&rsquo;ve been invited to join ${workspaceName} on Propvora`

  const body = `
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:16px; font-family:${FONT_STACK};">
      Hi <strong style="color:${BRAND.textPrimary};">${displayName}</strong>,
    </p>
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:24px; font-family:${FONT_STACK};">
      ${inviterName ? `<strong style="color:${BRAND.textPrimary};">${inviterName}</strong> has invited you to join ` : "You&rsquo;ve been invited to join "}
      <strong style="color:${BRAND.textPrimary};">${workspaceName}</strong> on Propvora — the all-in-one property management platform.
    </p>

    <!-- Invite card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BRAND.accentLight}; border:1px solid ${BRAND.accentBorder}; border-radius:12px; margin-bottom:28px;">
      <tr>
        <td style="padding:22px 26px;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width:42px; vertical-align:top;">
                <div style="width:36px; height:36px; background:${BRAND.accent}; border-radius:9px; text-align:center; line-height:36px; font-size:18px;">&#128101;</div>
              </td>
              <td style="padding-left:12px; vertical-align:middle;">
                <p style="font-size:12px; font-weight:700; color:${BRAND.accent}; text-transform:uppercase; letter-spacing:0.9px; margin-bottom:3px; font-family:${FONT_STACK};">Team invitation</p>
                <p style="font-size:15px; font-weight:700; color:${BRAND.textPrimary}; margin-bottom:0; font-family:${FONT_STACK};">${workspaceName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("Accept invitation", inviteUrl)}

    <p style="font-size:12px; color:${BRAND.textFaint}; margin-top:28px; line-height:1.6; font-family:${FONT_STACK};">
      This invitation link expires in 7 days. If you weren&rsquo;t expecting this, you can safely ignore this email.
    </p>
    <p style="font-size:11px; color:${BRAND.textFaint}; margin-top:8px; word-break:break-all; line-height:1.5; font-family:${FONT_STACK};">
      Or copy this link: <a href="${inviteUrl}" style="color:${BRAND.textFaint}; text-decoration:underline;">${inviteUrl}</a>
    </p>
  `

  return {
    subject: `You've been invited to join ${workspaceName} on Propvora`,
    html: brandedEmail({
      subject: `You've been invited to join ${workspaceName} on Propvora`,
      preheaderText: `${inviterName ? inviterName + " has invited you" : "You've been invited"} to join ${workspaceName} on Propvora.`,
      category: "Team invitation",
      headline: "You&rsquo;ve been invited",
      iconEmoji: "&#128101;",
      body,
      footerNote: `Sent on behalf of ${workspaceName}.`,
    }),
  }
}
