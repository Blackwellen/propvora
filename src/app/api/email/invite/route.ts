import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { sendEmail } from "@/lib/email"
import { workspaceInviteEmail } from "@/lib/emails/workspace-invite"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // setAll called from a Server Component — safe to ignore
            }
          },
        },
      }
    )

    // Verify the caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json() as {
      inviteeEmail?: unknown
      inviteeName?: unknown
      workspaceName?: unknown
      invitationId?: unknown
    }

    const { inviteeEmail, inviteeName, workspaceName, invitationId } = body

    if (
      typeof inviteeEmail !== "string" ||
      typeof workspaceName !== "string" ||
      typeof invitationId !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing required fields: inviteeEmail, workspaceName, invitationId" },
        { status: 400 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (request.headers.get("origin") || "https://app.propvora.com")

    const inviteUrl = `${baseUrl}/register?invite=${encodeURIComponent(invitationId)}`

    const { subject, html } = workspaceInviteEmail({
      inviteeName: typeof inviteeName === "string" ? inviteeName : inviteeEmail,
      workspaceName,
      inviteUrl,
    })

    const result = await sendEmail({ to: inviteeEmail, subject, html })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.id ?? null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[api/email/invite] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
