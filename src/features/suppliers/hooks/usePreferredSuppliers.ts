"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

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

// Seed fallback
const SEED_SUPPLIERS: SupplierRow[] = [
  { id: "s1", name: "James Wright Electrical Ltd", primaryTrade: "Electrical Contractor", location: "London",     serviceRadiusMiles: 15, verificationStatus: "verified", complianceStatus: "valid",    averageResponseMinutes: 58,  ratingInternal: 4.9, jobsCompleted: 63 },
  { id: "s2", name: "AH Plumbing & Heating",       primaryTrade: "Plumbing & Heating",   location: "Manchester", serviceRadiusMiles: 20, verificationStatus: "verified", complianceStatus: "valid",    averageResponseMinutes: 75,  ratingInternal: 4.8, jobsCompleted: 41 },
  { id: "s3", name: "Sarah Mitchell Gas Services",  primaryTrade: "Gas Engineer",         location: "Birmingham", serviceRadiusMiles: 25, verificationStatus: "verified", complianceStatus: "valid",    averageResponseMinutes: 95,  ratingInternal: 5.0, jobsCompleted: 89 },
]

export function usePreferredSuppliers() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>(SEED_SUPPLIERS)
  const [total, setTotal] = useState(246)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, count, error: fetchError } = await supabase
          .from("suppliers")
          .select("id, name, primary_trade, postcode, service_radius_miles, verification_status, compliance_status, average_response_minutes, rating_internal, jobs_completed", { count: "exact" })
          .eq("preferred_status", true)
          .limit(10)

        if (fetchError) {
          if (fetchError.code === "42P01") return
          throw fetchError
        }

        if (!cancelled && data && data.length > 0) {
          setTotal(count ?? data.length)
          setSuppliers(
            data.map((s) => ({
              id: s.id,
              name: s.name,
              primaryTrade: s.primary_trade ?? "",
              location: s.postcode ?? "",
              serviceRadiusMiles: s.service_radius_miles ?? 0,
              verificationStatus: s.verification_status ?? "unverified",
              complianceStatus: s.compliance_status ?? "unknown",
              averageResponseMinutes: s.average_response_minutes ?? 0,
              ratingInternal: s.rating_internal ?? 0,
              jobsCompleted: s.jobs_completed ?? 0,
            }))
          )
        }
      } catch {
        if (!cancelled) setError("Failed to load suppliers — showing demo data")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return { suppliers, total, loading, error }
}
