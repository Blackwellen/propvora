interface WorkspaceInviteParams {
  inviteeName: string
  workspaceName: string
  inviteUrl: string
}

export function workspaceInviteEmail(params: WorkspaceInviteParams): {
  subject: string
  html: string
} {
  const { inviteeName, workspaceName, inviteUrl } = params

  const subject = `You've been invited to join ${workspaceName} on Propvora`

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
                    <p style="font-size:13px; font-weight:600; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Team invitation</p>
                    <h1 style="font-size:24px; font-weight:800; color:#FFFFFF; line-height:1.2; margin:0;">You&rsquo;ve been invited</h1>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:24px;">
                      Hi ${inviteeName || 'there'},
                    </p>
                    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:24px;">
                      You&rsquo;ve been invited to join <strong style="color:#0D1B2A;">${workspaceName}</strong> on Propvora — the all-in-one platform for property operations.
                    </p>
                    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:32px;">
                      Click the button below to accept your invitation and create your account.
                    </p>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="border-radius:10px; background:#2563EB;">
                          <a href="${inviteUrl}"
                             style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px; letter-spacing:0.2px;">
                            Accept invitation &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size:12px; color:#94A3B8; margin-top:28px; line-height:1.6;">
                      If you weren&rsquo;t expecting this invitation, you can safely ignore this email.
                    </p>
                    <p style="font-size:11px; color:#CBD5E1; margin-top:8px; word-break:break-all;">
                      Or copy this link: ${inviteUrl}
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
