import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { connectEnabled, type ConnectStatus } from "@/lib/billing/connect"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/connect/status — Connect status for the caller's current workspace.
 * RLS limits the row to workspace members. Returns a safe "none" when Connect
 * is disabled or not yet onboarded.
 */
export async function GET() {
  const off: ConnectStatus = {
    connected: false, status: "none", chargesEnabled: false,
    payoutsEnabled: false, detailsSubmitted: false, accountId: null,
  }
  if (!connectEnabled()) return NextResponse.json({ ...off, enabled: false })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
  const wsId = profile?.current_workspace_id as string | undefined
  if (!wsId) return NextResponse.json({ ...off, enabled: true })

  const { data } = await supabase
    .from("stripe_connect_accounts")
    .select("stripe_account_id, status, charges_enabled, payouts_enabled, details_submitted")
    .eq("workspace_id", wsId)
    .maybeSingle()

  if (!data) return NextResponse.json({ ...off, enabled: true })
  return NextResponse.json({
    enabled: true,
    connected: true,
    status: data.status,
    chargesEnabled: !!data.charges_enabled,
    payoutsEnabled: !!data.payouts_enabled,
    detailsSubmitted: !!data.details_submitted,
    accountId: data.stripe_account_id,
  })
}
