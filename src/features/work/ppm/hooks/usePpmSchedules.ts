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

function mapRow(row: Record<string, unknown>): PpmScheduleRow {
  const prop = row.properties as Record<string, unknown> | null
  const sup = row.suppliers as Record<string, unknown> | null
  const nextDate = row.next_due_date ? new Date(row.next_due_date as string) : null
  const daysUntil = nextDate ? Math.round((nextDate.getTime() - Date.now()) / 86_400_000) : null
  const supName = (sup?.name as string) ?? "Unassigned"

  return {
    id: row.id as string,
    property: (prop?.address_line1 as string) ?? "Unknown property",
    address: [(prop?.city as string), (prop?.postcode as string)].filter(Boolean).join(", "),
    taskType: (row.service_type as string) ?? "",
    category: (row.compliance_category as string) ?? "",
    frequency: (row.frequency as string) ?? "",
    lastCompleted: row.last_completed_at
      ? new Date(row.last_completed_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "Never",
    lastCompletedBy: "",
    nextDue: nextDate
      ? nextDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "Not set",
    nextDueDays: daysUntil === null ? "" : daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `In ${daysUntil} days`,
    supplier: supName,
    supplierInitials: supName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase(),
    estCost: row.estimated_cost ? `£${Number(row.estimated_cost).toFixed(2)}` : "TBC",
    status: (row.status as PpmScheduleRow["status"]) ?? "scheduled",
  }
}

export function usePpmSchedules() {
  const [schedules, setSchedules] = useState<PpmScheduleRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingDemoData, setUsingDemoData] = useState(false)
  const [filters, setFilters] = useState<PpmScheduleFilters>(DEFAULT_FILTERS)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from("ppm_schedules")
        .select("*, properties(address_line1, city, postcode), suppliers(name)", { count: "exact" })
        .limit(50)

      if (filters.status) query = query.eq("status", filters.status)
      if (filters.serviceType) query = query.ilike("service_type", `%${filters.serviceType}%`)
      if (filters.property) query = query.eq("property_id", filters.property)

      const { data, count, error: fetchError } = await query

      if (fetchError) {
        if (fetchError.code === "42P01") {
          // Table not yet created — show honest empty state
          setSchedules([])
          setTotal(0)
          setUsingDemoData(false)
          return
        }
        throw fetchError
      }

      const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
      setSchedules(rows)
      setTotal(count ?? rows.length)
      setUsingDemoData(false)
    } catch {
      setError("Failed to load schedules")
      setSchedules([])
      setTotal(0)
      setUsingDemoData(false)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  return { schedules, total, loading, error, usingDemoData, filters, setFilters }
}
