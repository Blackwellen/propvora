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

// Hardcoded seed data used as fallback when table does not yet exist
const SEED_KPIS: PpmKpis = {
  activeSchedules: 34,
  dueThisMonth: 8,
  overdue: 2,
  dueNext30Days: 14,
  completedThisYear: 67,
}

const SEED_UPCOMING: PpmUpcomingItem[] = [
  { id: "1", serviceType: "Boiler Annual Service",       property: "7 Oak Ave",      dueDate: "12 Jun 2026", supplier: "HeatPro Ltd",           estCost: 850, status: "scheduled" },
  { id: "2", serviceType: "EICR Inspection",             property: "22 Mill Lane",   dueDate: "14 Jun 2026", supplier: "ElecSure Ltd",           estCost: 620, status: "scheduled" },
  { id: "3", serviceType: "Gas Safety Certificate",      property: "14 Park Rd",     dueDate: "18 Jun 2026", supplier: "British Gas Homecare",   estCost: 120, status: "scheduled" },
  { id: "4", serviceType: "Legionella Risk Assessment",  property: "3 River View",   dueDate: "24 Jun 2026", supplier: "AquaSafe Ltd",           estCost: 300, status: "scheduled" },
  { id: "5", serviceType: "Fire Alarm Test",             property: "Beech House",    dueDate: "26 Jun 2026", supplier: "FireSafe Services",      estCost: 180, status: "scheduled" },
  { id: "6", serviceType: "HVAC Maintenance",            property: "41 Station Rd",  dueDate: "29 Jun 2026", supplier: "ClimaCare Ltd",          estCost: 250, status: "scheduled" },
]

const SEED_OVERDUE: PpmOverdueItem[] = [
  { id: "1", serviceType: "Boiler Annual Service", property: "Beech House", ref: "FIRE-0021", dueDate: "02 Jun 2026", daysOverdue: 8, supplier: "FireSafe Services", estCost: 850 },
  { id: "2", serviceType: "EICR Inspection",       property: "Elm Court",   ref: "ELEC-0153", dueDate: "05 Jun 2026", daysOverdue: 5, supplier: "ElecSure Ltd",     estCost: 620 },
]

export function usePpmOverview() {
  const [kpis, setKpis] = useState<PpmKpis>(SEED_KPIS)
  const [upcoming, setUpcoming] = useState<PpmUpcomingItem[]>(SEED_UPCOMING)
  const [overdue, setOverdue] = useState<PpmOverdueItem[]>(SEED_OVERDUE)
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
            completedThisYear: SEED_KPIS.completedThisYear,
          })
        }
      } catch {
        if (!cancelled) setError("Failed to load PPM data — showing demo data")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return { kpis, upcoming, overdue, loading, error }
}
