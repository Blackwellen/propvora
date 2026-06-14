import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/newsletter/unsubscribe?token=<uuid>
 *
 * One-click unsubscribe via the per-subscriber confirm_token. Flips the row to
 * 'unsubscribed' and stamps unsubscribed_at. Always returns a neutral outcome
 * (no enumeration). Pair this token in the List-Unsubscribe header / footer of
 * any marketing email so recipients can opt out without authentication.
 */

const TokenSchema = z.string().uuid()

function redirectTo(request: NextRequest, status: "unsubscribed" | "invalid") {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    "https://app.propvora.com"
  return NextResponse.redirect(`${base}/newsletter/unsubscribed?status=${status}`)
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? ""
  const parsed = TokenSchema.safeParse(token)
  if (!parsed.success) return redirectTo(request, "invalid")

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return redirectTo(request, "invalid")
  }

  try {
    const supabase = createAdminClient()

    const { data: row } = await supabase
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("confirm_token", parsed.data)
      .maybeSingle()

    if (!row) return redirectTo(request, "invalid")

    // Suppressed rows stay suppressed; just show the neutral done state.
    if (row.status !== "suppressed") {
      await supabase
        .from("newsletter_subscribers")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
    }

    return redirectTo(request, "unsubscribed")
  } catch (err) {
    console.error("[api/newsletter/unsubscribe] error:", err)
    return redirectTo(request, "invalid")
  }
}
