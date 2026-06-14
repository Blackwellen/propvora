import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/integrations/status
 * Returns which integrations are configured server-side (booleans only — never
 * exposes any secret). Used by Workspace Settings → Integrations for real status.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const r2 = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    (process.env.R2_BUCKET || process.env.R2_BUCKET_NAME)
  )

  return NextResponse.json({
    stripe: !!process.env.STRIPE_SECRET_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    resend: !!process.env.RESEND_API_KEY,
    supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    r2,
    "companies-house": !!process.env.COMPANIES_HOUSE_API_KEY,
    maps: true, // OpenStreetMap — no key required
    "google-auth": false,
    webhooks: !!process.env.STRIPE_WEBHOOK_SECRET,
  })
}
