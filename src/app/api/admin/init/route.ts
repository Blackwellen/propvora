import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ADMIN_EMAIL = "jamahlthomas1996@gmail.com"
const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET

/**
 * One-time admin initialisation endpoint.
 * Call: POST /api/admin/init
 * Body: { "secret": "<ADMIN_SETUP_SECRET env var>" }
 *
 * Sets platform_role = 'admin' on the profile for ADMIN_EMAIL.
 * Requires ADMIN_SETUP_SECRET to be set in your .env.local.
 */
export async function POST(req: Request) {
  if (!SETUP_SECRET) {
    return NextResponse.json({ error: "ADMIN_SETUP_SECRET not configured." }, { status: 500 })
  }

  let body: { secret?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (body.secret !== SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  const admin = createAdminClient()

  // Ensure platform_role column exists (best-effort, ignore errors)
  try {
    await admin.rpc("exec_sql", {
      sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform_role TEXT DEFAULT NULL;`,
    })
  } catch { /* column may already exist */ }

  // Find the user in auth
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) {
    return NextResponse.json({ error: "Failed to list users." }, { status: 500 })
  }

  const user = users.find((u) => u.email === ADMIN_EMAIL)
  if (!user) {
    return NextResponse.json({
      error: `User ${ADMIN_EMAIL} not found. Sign up first at /register, then call this endpoint again.`,
    }, { status: 404 })
  }

  // Upsert profile with platform_role = admin
  const { error: upsertErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, platform_role: "admin" }, { onConflict: "id" })

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `${ADMIN_EMAIL} is now a platform admin. Visit /admin/login to sign in.`,
  })
}
