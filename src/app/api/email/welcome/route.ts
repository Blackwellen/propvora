import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { welcomeEmail } from "@/lib/emails/welcome"

/**
 * POST /api/email/welcome
 *
 * Called client-side after a successful supabase.auth.signUp().
 * Sends a welcome email to the new user.
 *
 * Body: { email: string; userName: string; workspaceName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      email?: unknown
      userName?: unknown
      workspaceName?: unknown
    }

    const { email, userName, workspaceName } = body

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Missing required field: email" },
        { status: 400 }
      )
    }

    const { subject, html } = welcomeEmail({
      userName: typeof userName === "string" ? userName : "",
      workspaceName: typeof workspaceName === "string" ? workspaceName : "",
    })

    const result = await sendEmail({ to: email.trim().toLowerCase(), subject, html })

    if (result.error) {
      // Log but don't surface to client — welcome email is non-critical
      console.error("[api/email/welcome] Send failed:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.id ?? null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[api/email/welcome] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
