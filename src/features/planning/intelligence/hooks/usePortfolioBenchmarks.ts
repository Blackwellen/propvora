"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

export interface BenchmarkRow {
  metric: string
  metricKey: string
  portfolio: string
  industry: string
  portfolioRaw: number
  industryRaw: number
  result: "better" | "worse" | "par"
  unit: string
}

const SEEDED_BENCHMARKS: BenchmarkRow[] = [
  { metric: "Avg void rate",              metricKey: "void_rate",        portfolio: "2.8%",  industry: "3.4%",  portfolioRaw: 2.8,  industryRaw: 3.4, result: "better", unit: "%" },
  { metric: "Avg net yield",             metricKey: "net_yield",        portfolio: "4.1%",  industry: "4.8%",  portfolioRaw: 4.1,  industryRaw: 4.8, result: "worse",  unit: "%" },
  { metric: "Avg maintenance cost ratio", metricKey: "maint_cost_ratio", portfolio: "10.2%", industry: "9.8%",  portfolioRaw: 10.2, industryRaw: 9.8, result: "par",    unit: "%" },
  { metric: "Avg tenancy length",        metricKey: "tenancy_length",   portfolio: "18 mo", industry: "14 mo", portfolioRaw: 18,   industryRaw: 14,  result: "better", unit: "mo" },
]

interface UsePortfolioBenchmarksReturn {
  benchmarks: BenchmarkRow[]
  loading: boolean
  error: string | null
}

export function usePortfolioBenchmarks(): UsePortfolioBenchmarksReturn {
  const { workspace } = useWorkspace()
  const [benchmarks, setBenchmarks] = useState<BenchmarkRow[]>(SEEDED_BENCHMARKS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!workspace?.id) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbErr } = await supabase
        .from("planning_benchmark_assumptions")
        .select("*")
        .eq("workspace_id", workspace.id)
        .limit(20)

      if (dbErr) {
        if (dbErr.code !== "42P01") setError(dbErr.message)
        return
      }

      if (!data || data.length === 0) return

      // Merge DB assumptions with seeded structure
      const merged = SEEDED_BENCHMARKS.map((seed) => {
        const dbRow = data.find(d => d.metric_key === seed.metricKey)
        if (!dbRow) return seed
        const industryRaw = Number(dbRow.industry_avg_value)
        return {
          ...seed,
          industryRaw,
          industry: dbRow.unit === "mo" ? `${industryRaw} mo` : `${industryRaw}%`,
          result: (seed.portfolioRaw < industryRaw ? "better" : seed.portfolioRaw > industryRaw ? "worse" : "par") as BenchmarkRow["result"],
        }
      })
      setBenchmarks(merged)
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => { fetch() }, [fetch])

  return { benchmarks, loading, error }
}
