"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface PpmKpis {
  activeSchedules: number
  dueThisMonth: number
  overdue: number
  dueNext30Days: number
  completedThisYear: number
}

export interface PpmUpcomingItem {
  id: string
  serviceType: string
  property: string
  dueDate: string
  supplier: string
  estCost: number | null
  status: string
}

export interface PpmOverdueItem {
  id: string
  serviceType: string
  property: string
  ref: string
  dueDate: string
  daysOverdue: number
  supplier: string
  estCost: number | null
}

export function usePpmOverview() {
  const [kpis, setKpis] = useState<PpmKpis>({ activeSchedules: 0, dueThisMonth: 0, overdue: 0, dueNext30Days: 0, completedThisYear: 0 })
  const [upcoming, setUpcoming] = useState<PpmUpcomingItem[]>([])
  const [overdue, setOverdue] = useState<PpmOverdueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: schedulesData, error: schedulesError } = await supabase
          .from("ppm_schedules")
          .select("id, service_type, status, next_due_date, estimated_cost")
          .eq("status", "active")
          .limit(100)

        if (schedulesError) {
          // Table might not exist yet — use seed data
          if (schedulesError.code === "42P01") return
          throw schedulesError
        }

        if (!cancelled && schedulesData) {
          // Derive basic kpis from live data
          const today = new Date()
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          const next30 = new Date(today)
          next30.setDate(next30.getDate() + 30)

          const active = schedulesData.length
          const dueMonth = schedulesData.filter(
            (s) => s.next_due_date && new Date(s.next_due_date) <= endOfMonth
          ).length
          const overdueCount = schedulesData.filter(
            (s) => s.next_due_date && new Date(s.next_due_date) < today
          ).length
          const dueNext = schedulesData.filter(
            (s) =>
              s.next_due_date &&
              new Date(s.next_due_date) >= today &&
              new Date(s.next_due_date) <= next30
          ).length

          setKpis({
            activeSchedules: active,
            dueThisMonth: dueMonth,
            overdue: overdueCount,
            dueNext30Days: dueNext,
            completedThisYear: 0,
          })
        }
      } catch {
        if (!cancelled) setError("Failed to load PPM data")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return { kpis, upcoming, overdue, loading, error }
}
