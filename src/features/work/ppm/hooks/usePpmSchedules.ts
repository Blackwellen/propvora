"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface PpmScheduleRow {
  id: string
  property: string
  address: string
  taskType: string
  category: string
  frequency: string
  lastCompleted: string
  lastCompletedBy: string
  nextDue: string
  nextDueDays: string
  supplier: string
  supplierInitials: string
  estCost: string
  status: "scheduled" | "due-soon" | "overdue" | "completed"
}

export interface PpmScheduleFilters {
  search: string
  property: string
  serviceType: string
  supplier: string
  priority: string
  status: string
}

const DEFAULT_FILTERS: PpmScheduleFilters = {
  search: "",
  property: "",
  serviceType: "",
  supplier: "",
  priority: "",
  status: "",
}

// Seed data — displayed when Supabase table is not yet available
const SEED_SCHEDULES: PpmScheduleRow[] = [
  { id: "s1", property: "14 Park Road", address: "London SW1A 1AA", taskType: "Gas Safety Certificate", category: "Gas", frequency: "Annual", lastCompleted: "10 Jun 2025", lastCompletedBy: "British Gas", nextDue: "8 Jun 2026", nextDueDays: "In 345 days", supplier: "British Gas Homecare", supplierInitials: "BG", estCost: "£120.00", status: "due-soon" },
  { id: "s2", property: "7 Oak Avenue", address: "Manchester M2 3AA", taskType: "Boiler Annual Service", category: "Gas", frequency: "Annual", lastCompleted: "12 Jun 2025", lastCompletedBy: "HeatPro Ltd", nextDue: "12 Jun 2026", nextDueDays: "In 349 days", supplier: "HeatPro Ltd", supplierInitials: "HP", estCost: "£145.00", status: "scheduled" },
  { id: "s3", property: "22 Mill Lane", address: "Birmingham B1 1AA", taskType: "EICR Electrical Inspection", category: "Electrical", frequency: "Annual", lastCompleted: "14 Mar 2021", lastCompletedBy: "ElecSure Ltd", nextDue: "15 Jun 2026", nextDueDays: "In 352 days", supplier: "ElecSure Ltd", supplierInitials: "ES", estCost: "£320.00", status: "overdue" },
  { id: "s4", property: "Beech House", address: "Leeds LS1 2QG", taskType: "Fire Alarm Test", category: "Fire", frequency: "Quarterly", lastCompleted: "19 Mar 2026", lastCompletedBy: "FireSafe Services", nextDue: "19 Jun 2026", nextDueDays: "In 356 days", supplier: "FireSafe Services", supplierInitials: "FS", estCost: "£85.00", status: "scheduled" },
  { id: "s5", property: "3 River View", address: "Bristol BS1 6AA", taskType: "Legionella Risk Assessment", category: "Water", frequency: "Annual", lastCompleted: "24 Jun 2025", lastCompletedBy: "AquaSafe Ltd", nextDue: "24 Jun 2026", nextDueDays: "In 361 days", supplier: "AquaSafe Ltd", supplierInitials: "AS", estCost: "£210.00", status: "scheduled" },
]

export function usePpmSchedules() {
  const [schedules, setSchedules] = useState<PpmScheduleRow[]>(SEED_SCHEDULES)
  const [total, setTotal] = useState(342)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PpmScheduleFilters>(DEFAULT_FILTERS)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from("ppm_schedules")
        .select("*", { count: "exact" })
        .limit(10)

      if (filters.status) query = query.eq("status", filters.status)
      if (filters.serviceType) query = query.ilike("service_type", `%${filters.serviceType}%`)

      const { data, count, error: fetchError } = await query

      if (fetchError) {
        if (fetchError.code === "42P01") return // Table not yet created
        throw fetchError
      }

      if (data) {
        setTotal(count ?? data.length)
      }
    } catch {
      setError("Failed to load schedules — showing demo data")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  return { schedules, total, loading, error, filters, setFilters }
}
