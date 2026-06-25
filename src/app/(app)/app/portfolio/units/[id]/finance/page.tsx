"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUnit } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { createClient } from "@/lib/supabase/client"
import { type IncomeChartPoint } from "@/components/portfolio/unit-detail/shared"
import { UnitFinanceTab } from "@/components/portfolio/unit-detail/UnitFinanceTab"

export default function UnitFinancePage() {
  const params = useParams()
  const unitId = params.id as string
  const { workspace } = useWorkspace()
  const { data: unit } = useUnit(workspace?.id, unitId)
  const { data: tenancies = [] } = useTenancies(workspace?.id)
  const [incomeChart, setIncomeChart] = useState<IncomeChartPoint[]>([])

  const tenancy = tenancies.find(t => t.unit_id === unitId && t.status === "active") ?? tenancies.find(t => t.unit_id === unitId) ?? null

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient()
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("money_transactions")
          .select("amount, occurred_on, direction")
          .eq("workspace_id", workspace.id)
          .eq("unit_id", unitId)
          .eq("direction", "in")
          .order("occurred_on", { ascending: true })
        if (!error && data && data.length > 0) {
          const byMonth: Record<string, { income: number; expenses: number }> = {}
          for (const row of data as Array<{ amount: number; occurred_on: string; direction: string }>) {
            const d = new Date(row.occurred_on)
            if (isNaN(d.getTime())) continue
            const key = d.toLocaleString("en-GB", { month: "short" })
            if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0 }
            byMonth[key].income += Number(row.amount) || 0
          }
          setIncomeChart(Object.entries(byMonth).slice(-6).map(([month, v]) => ({ month, income: v.income, expenses: v.expenses })))
        }
      } catch { /* money_transactions may not exist — silent */ }
    })()
  }, [workspace?.id, unitId])

  if (!unit) return null
  return <UnitFinanceTab incomeChart={incomeChart} tenancy={tenancy} unit={unit} />
}
