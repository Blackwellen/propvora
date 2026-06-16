import "server-only"
import { createClient } from "@/lib/supabase/server"
import { resolveActiveWorkspaceId } from "@/lib/money/server"

/**
 * Shared server access for the money sub-sections: resolve the active workspace
 * for the signed-in operator. Fail-closed (null when unauthenticated).
 */
export async function getMoneyWorkspace(): Promise<{ workspaceId: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { workspaceId: null }
  const workspaceId = await resolveActiveWorkspaceId(supabase, user.id)
  return { workspaceId }
}

/** Pence → £ string. Integer pence in, formatted GBP out. */
export function fmtPence(pence: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    (Number.isFinite(pence) ? pence : 0) / 100
  )
}
