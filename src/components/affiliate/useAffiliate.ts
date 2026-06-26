"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface AffiliateRecord {
  workspace_id: string
  enrolled: boolean
  approved: boolean
  band: number | null
  public_handle: string | null
  payout_email: string | null
  referral_code: string | null
  discount_referral_code: string | null
  active_referrals_count: number | null
  sub_affiliate_count: number | null
  pending_pence: number | null
  cleared_pence: number | null
  paid_pence: number | null
  sub_pending_pence: number | null
  sub_cleared_pence: number | null
  leaderboard_visible: boolean | null
}

export interface UseAffiliateResult {
  loading: boolean
  workspaceId: string | null
  affiliate: AffiliateRecord | null
  reload: () => Promise<void>
}

/** Resolve the signed-in user's current workspace + its affiliate row (live schema). */
export function useAffiliate(): UseAffiliateResult {
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [affiliate, setAffiliate] = useState<AffiliateRecord | null>(null)

  const reload = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      let wsId: string | null = null
      const { data: profile } = await supabase
        .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
      wsId = (profile?.current_workspace_id as string | null) ?? null
      if (!wsId) {
        const { data: mem } = await supabase
          .from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle()
        wsId = (mem?.workspace_id as string | null) ?? null
      }
      setWorkspaceId(wsId)
      if (!wsId) { setLoading(false); return }

      const { data: aff, error } = await supabase
        .from("affiliates")
        .select("workspace_id, enrolled, approved, band, public_handle, payout_email, referral_code, discount_referral_code, active_referrals_count, sub_affiliate_count, pending_pence, cleared_pence, paid_pence, sub_pending_pence, sub_cleared_pence, leaderboard_visible")
        .eq("workspace_id", wsId)
        .maybeSingle()
      if (error && error.code !== "42P01" && error.code !== "PGRST116") console.error(error)
      setAffiliate((aff as AffiliateRecord) ?? null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  return { loading, workspaceId, affiliate, reload }
}
