import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Admin / service-role client. NEVER expose on the client side.
 * Use only in Server Actions, API Route Handlers, or server utilities.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
