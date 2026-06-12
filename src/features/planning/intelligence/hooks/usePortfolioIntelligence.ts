"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

export type PerformanceTier = "star" | "average" | "under"

export interface HeatProperty {
  id: string
  name: string
  type: "HMO" | "AST" | "SA"
  tier: PerformanceTier
  netYield: number
  voidRate: number
  maintRatio: number
  aiStatus: string
  aiVariant: "ok" | "warn" | "good"
}

export interface MaintRow {
  property: string
  costYtd: string
  pctGross: number
  vsAvg: string
  vsAvgDir: "up" | "down" | "flat"
  flag: string
  flagType: "warn" | "ok" | "neutral"
}

export interface TenantRisk {
  initials: string
  unit: string
  score: number
  missedPayments: number
  status: string
  statusColor: "red" | "amber" | "slate"
}

export interface PortfolioKpis {
  totalProperties: number
  starPerformers: number
  averagePerformers: number
  underPerformers: number
  healthScore: number
}

const SEEDED_HEAT_PROPERTIES: HeatProperty[] = [
  { id: "1",  name: "Brook Lane, Liverpool",   type: "HMO", tier: "star",    netYield: 8.4, voidRate: 0.8,  maintRatio: 8,  aiStatus: "✓ Optimised",           aiVariant: "good" },
  { id: "2",  name: "High St, Birmingham",     type: "HMO", tier: "star",    netYield: 7.2, voidRate: 1.2,  maintRatio: 9,  aiStatus: "✓ Optimised",           aiVariant: "good" },
  { id: "3",  name: "River View, Nottingham",  type: "SA",  tier: "star",    netYield: 9.1, voidRate: 15.0, maintRatio: 7,  aiStatus: "⚠ Monitor voids",       aiVariant: "warn" },
  { id: "4",  name: "Victoria Rd, Manchester", type: "HMO", tier: "star",    netYield: 5.1, voidRate: 2.3,  maintRatio: 9,  aiStatus: "✓ Good",                aiVariant: "good" },
  { id: "5",  name: "Birchwood, London",       type: "AST", tier: "average", netYield: 3.0, voidRate: 1.8,  maintRatio: 12, aiStatus: "→ Monitor",             aiVariant: "ok" },
  { id: "6",  name: "Park Lane, Leeds",        type: "AST", tier: "average", netYield: 4.2, voidRate: 3.1,  maintRatio: 10, aiStatus: "→ Stable",              aiVariant: "ok" },
  { id: "7",  name: "Church St, Leeds",        type: "AST", tier: "average", netYield: 3.1, voidRate: 2.2,  maintRatio: 11, aiStatus: "→ Stable",              aiVariant: "ok" },
  { id: "8",  name: "Station Rd, Sheffield",   type: "AST", tier: "average", netYield: 3.4, voidRate: 1.4,  maintRatio: 9,  aiStatus: "→ Stable",              aiVariant: "ok" },
  { id: "9",  name: "Beach Rd, Brighton",      type: "AST", tier: "under",   netYield: 2.1, voidRate: 6.8,  maintRatio: 14, aiStatus: "⚠ High voids + costs", aiVariant: "warn" },
  { id: "10", name: "Oak Drive, Bristol",      type: "AST", tier: "under",   netYield: 2.8, voidRate: 0.0,  maintRatio: 15, aiStatus: "⚠ Outdated rent",      aiVariant: "warn" },
  { id: "11", name: "Elm Close, Coventry",     type: "AST", tier: "under",   netYield: 2.4, voidRate: 5.2,  maintRatio: 16, aiStatus: "⚠ Below market",       aiVariant: "warn" },
  { id: "12", name: "Canal St, Nottingham",    type: "AST", tier: "under",   netYield: 2.6, voidRate: 4.1,  maintRatio: 13, aiStatus: "⚠ Review needed",      aiVariant: "warn" },
]

const SEEDED_MAINT_ROWS: MaintRow[] = [
  { property: "Beach Rd, Brighton",      costYtd: "£3,200", pctGross: 17.8, vsAvg: "+8.3%", vsAvgDir: "up",   flag: "⚠ Recurring roof issues", flagType: "warn" },
  { property: "Brook Lane, Liverpool",   costYtd: "£1,800", pctGross: 4.7,  vsAvg: "-4.8%", vsAvgDir: "down", flag: "✓ Well maintained",        flagType: "ok" },
  { property: "Victoria Rd, Manchester", costYtd: "£4,100", pctGross: 8.9,  vsAvg: "-0.6%", vsAvgDir: "flat", flag: "✓ Within normal",          flagType: "ok" },
  { property: "High St, Birmingham",     costYtd: "£5,200", pctGross: 11.0, vsAvg: "+1.5%", vsAvgDir: "up",   flag: "→ Monitor",                flagType: "neutral" },
  { property: "Birchwood, London",       costYtd: "£2,400", pctGross: 13.8, vsAvg: "+4.3%", vsAvgDir: "up",   flag: "⚠ Rising costs",           flagType: "warn" },
]

const SEEDED_TENANT_RISKS: TenantRisk[] = [
  { initials: "J.C.", unit: "Room 2, Manchester", score: 42, missedPayments: 2, status: "Active chase",    statusColor: "amber" },
  { initials: "A.H.", unit: "Oak Ave, Leeds",     score: 38, missedPayments: 3, status: "Possession case", statusColor: "red" },
  { initials: "E.W.", unit: "Birmingham",         score: 51, missedPayments: 1, status: "Monitoring",      statusColor: "amber" },
  { initials: "T.W.", unit: "Bristol",            score: 28, missedPayments: 4, status: "Pre-legal",       statusColor: "red" },
  { initials: "M.J.", unit: "Liverpool",          score: 67, missedPayments: 0, status: "Low priority",    statusColor: "slate" },
]

const SEEDED_KPIS: PortfolioKpis = {
  totalProperties: 28,
  starPerformers: 8,
  averagePerformers: 14,
  underPerformers: 6,
  healthScore: 74,
}

interface UsePortfolioIntelligenceReturn {
  propertyTiers: HeatProperty[]
  maintenanceCosts: MaintRow[]
  tenantRiskScores: TenantRisk[]
  kpis: PortfolioKpis
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePortfolioIntelligence(): UsePortfolioIntelligenceReturn {
  const { workspace } = useWorkspace()
  const [propertyTiers, setPropertyTiers] = useState<HeatProperty[]>(SEEDED_HEAT_PROPERTIES)
  const [maintenanceCosts] = useState<MaintRow[]>(SEEDED_MAINT_ROWS)
  const [tenantRiskScores] = useState<TenantRisk[]>(SEEDED_TENANT_RISKS)
  const [kpis, setKpis] = useState<PortfolioKpis>(SEEDED_KPIS)
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
        .order("net_yield", { ascending: false })
        .limit(50)

      if (dbErr) {
        if (dbErr.code !== "42P01") setError(dbErr.message)
        return
      }

      if (!data || data.length === 0) return

      const mapped: HeatProperty[] = data.map((row) => ({
        id: row.id,
        name: row.property_name ?? "Unknown",
        type: (row.property_type as "HMO" | "AST" | "SA") ?? "AST",
        tier: (row.performance_tier as PerformanceTier) ?? "average",
        netYield: Number((row.net_yield * 100).toFixed(1)),
        voidRate: Number((row.void_rate * 100).toFixed(1)),
        maintRatio: Number(((row.maintenance_cost_ratio ?? 0) * 100).toFixed(1)),
        aiStatus: row.ai_recommendation ?? "→ No data",
        aiVariant: "ok" as const,
      }))

      setPropertyTiers(mapped)
      setKpis({
        totalProperties: data.length,
        starPerformers: data.filter(r => r.performance_tier === "star").length,
        averagePerformers: data.filter(r => r.performance_tier === "average").length,
        underPerformers: data.filter(r => r.performance_tier === "under").length,
        healthScore: 74,
      })
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => { fetch() }, [fetch])

  return { propertyTiers, maintenanceCosts, tenantRiskScores, kpis, loading, error, refetch: fetch }
}
