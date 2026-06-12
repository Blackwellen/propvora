"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type AdminSignInResult = { error: string } | { ok: true }

export async function adminSignIn(formData: FormData): Promise<AdminSignInResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? ""
  const password = (formData.get("password") as string | null) ?? ""

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: "Invalid email or password." }
  }

  // Verify platform admin role via service-role client (bypasses RLS)
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("platform_role")
      .eq("id", data.user.id)
      .maybeSingle()

    if (!profile || profile.platform_role !== "admin") {
      await supabase.auth.signOut()
      return { error: "Access denied. This login is restricted to platform administrators." }
    }
  } catch {
    await supabase.auth.signOut()
    return { error: "Unable to verify admin privileges. Please contact support." }
  }

  return { ok: true }
}
