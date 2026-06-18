import { createClient } from "@/lib/supabase/server"
import HomePage from "@/features/customer/home/HomePage"

export const metadata = { title: "Home · Propvora" }

export default async function CustomerHomeRoute() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string }
  const display = meta.full_name || meta.name || user?.email?.split("@")[0] || "there"
  const firstName = display.split(/[\s.@]+/)[0]
  const pretty = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  return <HomePage firstName={pretty} />
}
