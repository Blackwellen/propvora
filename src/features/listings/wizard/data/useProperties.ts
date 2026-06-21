"use client"

// Workspace-scoped property options for the wizard's property selector.
// Reads `properties`; on any failure (42P01 / RLS / network / empty) falls
// back to premium seed so the selector always renders.

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import type { HookState, PropertyOption } from "./types"

export function useProperties(): HookState<PropertyOption[]> {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [data, setData] = useState<PropertyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"live" | "seed">("seed")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!workspaceId) {
      setData([])
      setSource("seed")
      setLoading(false)
      return
    }
    try {
      const supabase = createClient()
      const { data: rows, error: err } = await supabase
        .from("properties")
        .select("id, name:nickname, address_line_1:address_line1, city, postcode")
        .eq("workspace_id", workspaceId)
        .limit(50)
      if (err) throw err
      if (rows && rows.length) {
        setData(
          rows.map((r) => {
            const row = r as Record<string, unknown>
            const addr = [row.address_line_1, row.city, row.postcode]
              .filter(Boolean)
              .join(", ")
            return {
              id: String(row.id),
              label: String(row.name ?? "Untitled property"),
              address: addr || "Address on file",
            }
          }),
        )
        setSource("live")
      } else {
        setData([])
        setSource("seed")
      }
    } catch {
      setData([])
      setSource("seed")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, source, reload: load }
}
