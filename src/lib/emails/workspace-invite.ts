import { brandedEmail, ctaButton, BRAND } from "./_base"

interface WorkspaceInviteParams {
  inviteeName: string
  workspaceName: string
  inviteUrl: string
}

export function workspaceInviteEmail(params: WorkspaceInviteParams): { subject: string; html: string } {
  const { inviteeName, workspaceName, inviteUrl } = params
  const subject = `You've been invited to join ${workspaceName} on Propvora`

  const body = `
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px;">
      Hi <strong style="color:${BRAND.textPrimary};">${inviteeName || "there"}</strong>,
    </p>
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:20px;">
      You&rsquo;ve been invited to join
      <strong style="color:${BRAND.textPrimary};">${workspaceName}</strong> on
      <strong style="color:${BRAND.textPrimary};">Propvora</strong> — the all-in-one platform
      for property operations.
    </p>
    <p style="font-size:15px; color:${BRAND.textBody}; line-height:1.7; margin-bottom:32px;">
      Click the button below to accept your invitation and set up your account.
    </p>

    ${ctaButton("Accept invitation", inviteUrl)}

    <p style="font-size:12px; color:${BRAND.textFaint}; margin-top:28px; line-height:1.6;">
      If you weren&rsquo;t expecting this invitation, you can safely ignore this email.
    </p>
    <p style="font-size:11px; color:${BRAND.border}; margin-top:8px; word-break:break-all; line-height:1.5;">
      Link: <a href="${inviteUrl}" style="color:${BRAND.textFaint};">${inviteUrl}</a>
    </p>
  `

  const html = brandedEmail({
    subject,
    category: "Team invitation",
    headline: "You&rsquo;ve been invited",
    body,
    footerNote: `Sent on behalf of ${workspaceName}.`,
  })

  return { subject, html }
}
