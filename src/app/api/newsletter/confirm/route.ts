import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/newsletter/confirm?token=<uuid>
 *
 * Double opt-in confirmation. Flips a pending/unsubscribed subscriber to
 * 'subscribed' and stamps confirmed_at. Suppressed rows are never resurrected.
 * Redirects to a friendly marketing page either way (no token enumeration:
 * an unknown/invalid token shows the same neutral "link expired" outcome).
 */

const TokenSchema = z.string().uuid()

function redirectTo(request: NextRequest, status: "confirmed" | "invalid") {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    "https://app.propvora.com"
  return NextResponse.redirect(`${base}/newsletter/confirmed?status=${status}`)
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? ""
  const parsed = TokenSchema.safeParse(token)
  if (!parsed.success) return redirectTo(request, "invalid")

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    // No store configured — nothing to confirm; show neutral outcome.
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

    // Suppressed subscribers are never reactivated via a confirm link.
    if (row.status === "suppressed") return redirectTo(request, "invalid")

    if (row.status !== "subscribed") {
      await supabase
        .from("newsletter_subscribers")
        .update({
          status: "subscribed",
          consent: true,
          confirmed_at: new Date().toISOString(),
          unsubscribed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
    }

    return redirectTo(request, "confirmed")
  } catch (err) {
    console.error("[api/newsletter/confirm] error:", err)
    return redirectTo(request, "invalid")
  }
}
