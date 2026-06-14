import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/ready — admin-only readiness probe.
 *
 * Platform-admin gated. Reports presence-only booleans for required config and
 * provider reachability so an operator can confirm an environment is wired
 * before flipping it live. NEVER returns secret values — only `configured: true/false`.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Verify platform admin via service-role (RLS-independent, fail closed).
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle()
  if (!profile || profile.platform_role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // DB reachability.
  let db = false
  try {
    const { error } = await admin.from("workspaces").select("id", { head: true, count: "exact" }).limit(1)
    db = !error
  } catch { db = false }

  const env = {
    supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripe: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    resend: !!process.env.RESEND_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    r2: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && (process.env.R2_BUCKET || process.env.R2_BUCKET_NAME)),
    companiesHouse: !!process.env.COMPANIES_HOUSE_API_KEY,
    siteUrl: !!(process.env.NEXT_PUBLIC_SITE_URL && !/localhost/.test(process.env.NEXT_PUBLIC_SITE_URL ?? "")),
  }

  // Recent Stripe webhook activity (proves the pipe is alive).
  let lastWebhookAt: string | null = null
  try {
    const { data } = await admin
      .from("stripe_webhook_events")
      .select("processed_at")
      .order("processed_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    lastWebhookAt = (data?.processed_at as string) ?? null
  } catch { /* table may be empty */ }

  const required = [db, env.supabase, env.stripe, env.stripeWebhook]
  const ready = required.every(Boolean)

  return NextResponse.json(
    { ready, db, env, lastWebhookAt, time: new Date().toISOString() },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  )
}
