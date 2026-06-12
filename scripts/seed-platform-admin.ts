import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ADMIN_EMAIL = "jamahlthomas1996@gmail.com"

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  // Step 1: Find the user in auth
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) {
    console.error("❌ Failed to list auth users:", listErr.message)
    process.exit(1)
  }

  const user = users.find((u) => u.email === ADMIN_EMAIL)
  if (!user) {
    console.error(`❌ No auth user found for ${ADMIN_EMAIL}`)
    console.error("   → Register at /register first, then re-run this script.")
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.email} (${user.id})`)

  // Step 2: Add platform_role column (idempotent via IF NOT EXISTS)
  const { error: alterErr } = await admin.rpc("exec_sql" as never, {
    sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform_role TEXT DEFAULT NULL;",
  } as never)
  // Ignore error — column may already exist or rpc may not be defined; we proceed anyway
  if (alterErr) {
    console.warn("⚠️  ALTER TABLE skipped (column likely already exists):", alterErr.message)
  }

  // Step 3: Upsert platform_role = 'admin' into profiles
  const { error: upsertErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, platform_role: "admin" }, { onConflict: "id" })

  if (upsertErr) {
    console.error("❌ Failed to set platform_role:", upsertErr.message)
    process.exit(1)
  }

  // Step 4: Verify
  const { data: profile, error: fetchErr } = await admin
    .from("profiles")
    .select("id, platform_role")
    .eq("id", user.id)
    .maybeSingle()

  if (fetchErr || !profile) {
    console.error("❌ Could not verify — row not found after upsert:", fetchErr?.message)
    process.exit(1)
  }

  if (profile.platform_role === "admin") {
    console.log(`✅ ${ADMIN_EMAIL} is now platform_role = 'admin'`)
    console.log("   → Sign in at /admin/login")
  } else {
    console.error("❌ Upsert ran but platform_role is still:", profile.platform_role)
    process.exit(1)
  }
}

run().catch((err) => {
  console.error("❌ Unexpected error:", err)
  process.exit(1)
})
