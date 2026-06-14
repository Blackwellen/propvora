"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

export interface SupplierRow {
  id: string
  name: string
  primaryTrade: string
  location: string
  serviceRadiusMiles: number
  verificationStatus: string
  complianceStatus: string
  averageResponseMinutes: number
  ratingInternal: number
  jobsCompleted: number
}

const GENERIC_TAGS = new Set(["preferred", "vip", "portfolio", "regular", "reliable", "source"])

function deriveTrade(tags: string[] | null, company: string | null): string {
  const tag = (tags ?? []).find((t) => !GENERIC_TAGS.has(t.toLowerCase()))
  if (tag) return tag.charAt(0).toUpperCase() + tag.slice(1)
  return company || "Supplier"
}

/**
 * Preferred suppliers = live supplier contacts (contacts.type = 'supplier'),
 * surfacing those tagged "preferred" first. No fabricated data.
 */
export function usePreferredSuppliers() {
  const { workspace } = useWorkspace()
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const wid = workspace?.id
    if (!wid) { setLoading(false); return }

    async function fetchData() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, count, error: fetchError } = await supabase
          .from("contacts")
          .select("id, display_name, company, city, postcode, tags, rating, status", { count: "exact" })
          .eq("workspace_id", wid)
          .eq("type", "supplier")
          .order("rating", { ascending: false, nullsFirst: false })
          .limit(10)

        if (fetchError) {
          if (fetchError.code === "42P01") { if (!cancelled) setLoading(false); return }
          throw fetchError
        }

        if (cancelled) return
        setTotal(count ?? (data?.length ?? 0))
        setSuppliers(
          (data ?? []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: (s.display_name as string) || (s.company as string) || "Supplier",
            primaryTrade: deriveTrade(s.tags as string[] | null, s.company as string | null),
            location: [s.city, s.postcode].filter(Boolean).join(", ") || "—",
            serviceRadiusMiles: 0,
            verificationStatus: s.status === "active" ? "verified" : "unverified",
            complianceStatus: "unknown",
            averageResponseMinutes: 0,
            ratingInternal: typeof s.rating === "number" ? s.rating : 0,
            jobsCompleted: 0,
          })),
        )
      } catch {
        if (!cancelled) setError("Failed to load suppliers")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [workspace?.id])

  return { suppliers, total, loading, error }
}
