"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/* ──────────────────────────────────────────────────────────────────────────
   Resolve the signed-in user's supplier workspace id on the client. The
   `(supplier-workspace)` layout already guarantees membership server-side, so
   this is a lightweight lookup for client surfaces that must pass `workspaceId`
   to APIs (e.g. the marketplace listings API). Tolerant: returns null if the
   table is absent or the read fails.
─────────────────────────────────────────────────────────────────────────── */
export function useSupplierWorkspaceId(): { workspaceId: string | null; loading: boolean } {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          if (active) setLoading(false)
          return
        }
        const { data } = await supabase
          .from("supplier_workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle()
        if (active) setWorkspaceId(data?.workspace_id ?? null)
      } catch {
        if (active) setWorkspaceId(null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return { workspaceId, loading }
}
