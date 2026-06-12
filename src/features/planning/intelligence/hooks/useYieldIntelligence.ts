"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

// ─── Seed data (shown when DB table missing or no workspace data yet) ──────────

export interface PropertyMetric {
  id: string
  address: string
  type: "HMO" | "AST" | "SA"
  value: string
  grossRentYr: string
  grossYield: number
  netYield: number
  voidRate: number
  trend: "up2" | "up" | "flat" | "down"
  aiRec: string
  recType: "underpriced" | "uplift" | "excellent" | "voids" | "maintain" | "market" | "seasonal"
}

const SEEDED_PROPERTIES: PropertyMetric[] = [
  { id: "1",  address: "22 Victoria Rd, Manchester",  type: "HMO", value: "£680k", grossRentYr: "£46,200", grossYield: 6.8,  netYield: 5.1, voidRate: 2.3,  trend: "up",   aiRec: "2 rooms underpriced",             recType: "underpriced" },
  { id: "2",  address: "14 Birchwood, London",         type: "AST", value: "£420k", grossRentYr: "£17,400", grossYield: 4.1,  netYield: 3.0, voidRate: 1.8,  trend: "flat", aiRec: "Market rate",                     recType: "market" },
  { id: "3",  address: "8 Park Lane, Leeds",           type: "AST", value: "£280k", grossRentYr: "£16,200", grossYield: 5.8,  netYield: 4.2, voidRate: 3.1,  trend: "up",   aiRec: "Consider increase at renewal",    recType: "uplift" },
  { id: "4",  address: "45 High St, Birmingham",       type: "HMO", value: "£520k", grossRentYr: "£47,400", grossYield: 9.1,  netYield: 7.2, voidRate: 1.2,  trend: "up2",  aiRec: "Excellent — maintain",            recType: "excellent" },
  { id: "5",  address: "67 Beach Rd, Brighton",        type: "AST", value: "£580k", grossRentYr: "£18,000", grossYield: 3.1,  netYield: 2.1, voidRate: 6.8,  trend: "down", aiRec: "High voids — reduce rent by 5%", recType: "voids" },
  { id: "6",  address: "3 Oak Drive, Bristol",         type: "AST", value: "£310k", grossRentYr: "£10,740", grossYield: 3.5,  netYield: 2.8, voidRate: 0.0,  trend: "flat", aiRec: "Review rent — no increase 2 yrs",recType: "uplift" },
  { id: "7",  address: "12 Brook Lane, Liverpool",     type: "HMO", value: "£380k", grossRentYr: "£38,400", grossYield: 10.1, netYield: 8.4, voidRate: 0.8,  trend: "up2",  aiRec: "Top performer — replicate model", recType: "excellent" },
  { id: "8",  address: "22 Church St, Leeds",          type: "AST", value: "£265k", grossRentYr: "£11,400", grossYield: 4.3,  netYield: 3.1, voidRate: 2.2,  trend: "flat", aiRec: "Market rate",                     recType: "market" },
  { id: "9",  address: "5 River View, Nottingham",     type: "SA",  value: "£290k", grossRentYr: "£42,000", grossYield: 14.5, netYield: 9.1, voidRate: 15.0, trend: "down", aiRec: "High yield but seasonal voids",   recType: "seasonal" },
  { id: "10", address: "19 Station Rd, Sheffield",     type: "AST", value: "£195k", grossRentYr: "£9,000",  grossYield: 4.6,  netYield: 3.4, voidRate: 1.4,  trend: "flat", aiRec: "Slight below market",             recType: "market" },
]

export interface YieldKpis {
  portfolioGrossYield: string
  portfolioNetYield: string
  bestProperty: string
  bestYield: string
  worstProperty: string
  worstYield: string
  totalPortfolioValue: string
  totalProperties: number
}

const SEEDED_KPIS: YieldKpis = {
  portfolioGrossYield: "6.8%",
  portfolioNetYield: "4.2%",
  bestProperty: "45 High St, Birmingham",
  bestYield: "9.1%",
  worstProperty: "67 Beach Rd, Brighton",
  worstYield: "3.1%",
  totalPortfolioValue: "£4.2M",
  totalProperties: 28,
}

interface UseYieldIntelligenceReturn {
  propertyMetrics: PropertyMetric[]
  kpis: YieldKpis
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useYieldIntelligence(): UseYieldIntelligenceReturn {
  const { workspace } = useWorkspace()
  const [propertyMetrics, setPropertyMetrics] = useState<PropertyMetric[]>(SEEDED_PROPERTIES)
  const [kpis, setKpis] = useState<YieldKpis>(SEEDED_KPIS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!workspace?.id) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbErr } = await supabase
        .from("planning_yield_property_metrics")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("gross_yield", { ascending: false })
        .limit(50)

      // Table missing (42P01) → fall back to seed data silently
      if (dbErr) {
        if (dbErr.code === "42P01") {
          setPropertyMetrics(SEEDED_PROPERTIES)
          setKpis(SEEDED_KPIS)
        } else {
          setError(dbErr.message)
        }
        return
      }

      if (!data || data.length === 0) {
        setPropertyMetrics(SEEDED_PROPERTIES)
        setKpis(SEEDED_KPIS)
        return
      }

      const mapped: PropertyMetric[] = data.map((row) => ({
        id: row.id,
        address: row.property_name ?? "Unknown",
        type: (row.property_type as "HMO" | "AST" | "SA") ?? "AST",
        value: row.estimated_value ? `£${(row.estimated_value / 1000).toFixed(0)}k` : "—",
        grossRentYr: row.annual_gross_rent ? `£${row.annual_gross_rent.toLocaleString()}` : "—",
        grossYield: Number((row.gross_yield * 100).toFixed(1)),
        netYield: Number((row.net_yield * 100).toFixed(1)),
        voidRate: Number((row.void_rate * 100).toFixed(1)),
        trend: (row.trend_direction as PropertyMetric["trend"]) ?? "flat",
        aiRec: row.ai_recommendation ?? "",
        recType: "market",
      }))

      setPropertyMetrics(mapped)
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => { fetch() }, [fetch])

  return { propertyMetrics, kpis, loading, error, refetch: fetch }
}
