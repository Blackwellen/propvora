// Smart Rules — trigger evaluation.
// Reads CURRENT live data through the caller's (RLS-scoped) Supabase client and
// returns the set of records each rule matches. Pure read; no writes here.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { SmartRule, TriggerMatch } from "./types"

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
}
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN
  return Number.isFinite(n) ? n : fallback
}
function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T00:00:00Z").getTime()
  const b = new Date(toISO + "T00:00:00Z").getTime()
  return Math.round((a - b) / 86_400_000)
}

type Row = Record<string, unknown>
const str = (r: Row, k: string) => (r[k] == null ? "" : String(r[k]))

/**
 * Evaluate one rule against live data. Returns candidate matches (capped).
 * Each branch is 42P01/empty-safe: a query error yields no matches, never throws.
 */
export async function evaluateRule(
  supabase: SupabaseClient,
  rule: SmartRule,
  limit = 100,
): Promise<TriggerMatch[]> {
  const ws = rule.workspace_id
  const cfg = rule.trigger_config || {}

  try {
    switch (rule.trigger_type) {
      // ── Original triggers ──────────────────────────────────────────────────

      case "compliance_due_soon": {
        const within = num(cfg.within_days, 30)
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, kind, due_date, status, property_id")
          .eq("workspace_id", ws)
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .gte("due_date", todayISO())
          .lte("due_date", daysFromNow(within))
          .neq("status", "complete")
          .order("due_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return data.map((r: Row) => {
          const due = str(r, "due_date")
          const inDays = daysBetween(due, todayISO())
          return {
            entity_type: "compliance_items",
            entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `${str(r, "title") || str(r, "kind") || "Compliance item"} due in ${inDays} day${inDays === 1 ? "" : "s"}`,
            facts: { due_date: due, days_remaining: inDays, kind: str(r, "kind") },
          }
        })
      }

      case "compliance_overdue": {
        const minOverdue = num(cfg.min_days_overdue, 0)
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, kind, due_date, status, property_id")
          .eq("workspace_id", ws)
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .lt("due_date", daysFromNow(-minOverdue))
          .neq("status", "complete")
          .order("due_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return data.map((r: Row) => {
          const due = str(r, "due_date")
          const overdue = daysBetween(todayISO(), due)
          return {
            entity_type: "compliance_items",
            entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `${str(r, "title") || str(r, "kind") || "Compliance item"} overdue by ${overdue} day${overdue === 1 ? "" : "s"}`,
            facts: { due_date: due, days_overdue: overdue, kind: str(r, "kind") },
          }
        })
      }

      case "tenancy_ending": {
        const within = num(cfg.within_days, 60)
        const { data, error } = await supabase
          .from("tenancies")
          .select("id, end_date, status, property_id")
          .eq("workspace_id", ws)
          .is("deleted_at", null)
          .eq("status", "active")
          .not("end_date", "is", null)
          .gte("end_date", todayISO())
          .lte("end_date", daysFromNow(within))
          .order("end_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return data.map((r: Row) => {
          const end = str(r, "end_date")
          const inDays = daysBetween(end, todayISO())
          return {
            entity_type: "tenancies",
            entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Tenancy ending in ${inDays} day${inDays === 1 ? "" : "s"} (${end})`,
            facts: { end_date: end, days_remaining: inDays },
          }
        })
      }

      case "rent_overdue": {
        const minOverdue = num(cfg.min_days_overdue, 1)
        const minAmount = num(cfg.min_amount, 0)
        const { data, error } = await supabase
          .from("rent_schedules")
          .select("id, due_date, amount_due, amount_paid, status, tenancy_id")
          .eq("workspace_id", ws)
          .lt("due_date", daysFromNow(-(minOverdue - 1)))
          .order("due_date", { ascending: true })
          .limit(limit * 2)
        if (error || !data) return []
        const matches: TriggerMatch[] = []
        for (const r of data as Row[]) {
          const status = str(r, "status").toLowerCase()
          if (status === "paid") continue
          const outstanding = num(r.amount_due, 0) - num(r.amount_paid, 0)
          if (outstanding <= 0 || outstanding < minAmount) continue
          const due = str(r, "due_date")
          const overdue = daysBetween(todayISO(), due)
          matches.push({
            entity_type: "rent_schedules",
            entity_id: str(r, "id"),
            property_id: null,
            summary: `Rent £${outstanding.toFixed(2)} overdue by ${overdue} day${overdue === 1 ? "" : "s"}`,
            facts: { due_date: due, outstanding, days_overdue: overdue, tenancy_id: str(r, "tenancy_id") },
          })
          if (matches.length >= limit) break
        }
        return matches
      }

      case "planning_offer_sent": {
        const stale = num(cfg.stale_after_days, 7)
        const { data, error } = await supabase
          .from("planning_landlord_offers")
          .select("id, property_address, status, sent_at, responded_at")
          .eq("workspace_id", ws)
          .eq("status", "sent")
          .not("sent_at", "is", null)
          .is("responded_at", null)
          .lte("sent_at", new Date(Date.now() - stale * 86_400_000).toISOString())
          .order("sent_at", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return data.map((r: Row) => ({
          entity_type: "planning_landlord_offers",
          entity_id: str(r, "id"),
          property_id: null,
          summary: `Offer awaiting response: ${str(r, "property_address") || "landlord offer"}`,
          facts: { sent_at: str(r, "sent_at"), property_address: str(r, "property_address") },
        }))
      }

      case "planning_offer_expiring": {
        const expire = num(cfg.expire_after_days, 14)
        const { data, error } = await supabase
          .from("planning_landlord_offers")
          .select("id, property_address, status, sent_at, responded_at")
          .eq("workspace_id", ws)
          .eq("status", "sent")
          .not("sent_at", "is", null)
          .is("responded_at", null)
          .lte("sent_at", new Date(Date.now() - expire * 86_400_000).toISOString())
          .order("sent_at", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return data.map((r: Row) => ({
          entity_type: "planning_landlord_offers",
          entity_id: str(r, "id"),
          property_id: null,
          summary: `Offer expiring (no response): ${str(r, "property_address") || "landlord offer"}`,
          facts: { sent_at: str(r, "sent_at"), property_address: str(r, "property_address") },
        }))
      }

      case "job_completed": {
        const within = num(cfg.within_days, 7)
        const { data, error } = await supabase
          .from("jobs")
          .select("id, title, status, completed_date, property_id")
          .eq("workspace_id", ws)
          .eq("status", "completed")
          .not("completed_date", "is", null)
          .gte("completed_date", daysFromNow(-within))
          .order("completed_date", { ascending: false })
          .limit(limit)
        if (error || !data) return []
        return data.map((r: Row) => ({
          entity_type: "jobs",
          entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Job completed: ${str(r, "title") || "maintenance job"}`,
          facts: { completed_date: str(r, "completed_date") },
        }))
      }

      case "licence_expiring": {
        const within = num(cfg.within_days, 90)
        const { data, error } = await supabase
          .from("hmo_licences")
          .select("id, licence_number, licence_type, expiry_date, status, property_id")
          .eq("workspace_id", ws)
          .not("expiry_date", "is", null)
          .gte("expiry_date", todayISO())
          .lte("expiry_date", daysFromNow(within))
          .order("expiry_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return data.map((r: Row) => {
          const exp = str(r, "expiry_date")
          const inDays = daysBetween(exp, todayISO())
          return {
            entity_type: "hmo_licences",
            entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `${str(r, "licence_type") || "HMO"} licence ${str(r, "licence_number")} expiring in ${inDays} day${inDays === 1 ? "" : "s"}`,
            facts: { expiry_date: exp, days_remaining: inDays },
          }
        })
      }

      // ── Tenancy lifecycle ──────────────────────────────────────────────────

      case "tenancy_started": {
        const { data, error } = await supabase
          .from("tenancies")
          .select("id, start_date, status, property_id")
          .eq("workspace_id", ws)
          .eq("status", "active")
          .eq("start_date", todayISO())
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "tenancies", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Tenancy started today (move-in)`,
          facts: { start_date: str(r, "start_date") },
        }))
      }

      case "tenancy_expired": {
        const { data, error } = await supabase
          .from("tenancies")
          .select("id, end_date, status, property_id")
          .eq("workspace_id", ws)
          .eq("status", "active")
          .not("end_date", "is", null)
          .lt("end_date", todayISO())
          .order("end_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const overdue = daysBetween(todayISO(), str(r, "end_date"))
          return {
            entity_type: "tenancies", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Tenancy expired ${overdue} day${overdue === 1 ? "" : "s"} ago`,
            facts: { end_date: str(r, "end_date"), days_overdue: overdue },
          }
        })
      }

      case "lease_renewal_approaching": {
        const within = num(cfg.within_days, 90)
        const { data, error } = await supabase
          .from("tenancies")
          .select("id, end_date, status, property_id")
          .eq("workspace_id", ws)
          .eq("status", "active")
          .not("end_date", "is", null)
          .gte("end_date", todayISO())
          .lte("end_date", daysFromNow(within))
          .order("end_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "end_date"), todayISO())
          return {
            entity_type: "tenancies", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Lease renewal decision due in ${inDays} days`,
            facts: { end_date: str(r, "end_date"), days_remaining: inDays },
          }
        })
      }

      case "move_out_approaching": {
        const within = num(cfg.within_days, 14)
        const { data, error } = await supabase
          .from("tenancies")
          .select("id, end_date, status, property_id")
          .eq("workspace_id", ws)
          .in("status", ["active", "ending"])
          .not("end_date", "is", null)
          .gte("end_date", todayISO())
          .lte("end_date", daysFromNow(within))
          .order("end_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "end_date"), todayISO())
          return {
            entity_type: "tenancies", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Move-out in ${inDays} day${inDays === 1 ? "" : "s"}`,
            facts: { end_date: str(r, "end_date"), days_remaining: inDays },
          }
        })
      }

      case "void_period_started": {
        const { data, error } = await supabase
          .from("units")
          .select("id, name, property_id, status, status_changed_at")
          .eq("workspace_id", ws)
          .eq("status", "vacant")
          .gte("status_changed_at", todayISO())
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "units", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Unit "${str(r, "name") || str(r, "id")}" is now vacant`,
          facts: { unit_name: str(r, "name"), status_changed_at: str(r, "status_changed_at") },
        }))
      }

      case "void_period_long": {
        const minDays = num(cfg.min_days, 30)
        const cutoff = daysFromNow(-minDays)
        const { data, error } = await supabase
          .from("units")
          .select("id, name, property_id, status, status_changed_at")
          .eq("workspace_id", ws)
          .eq("status", "vacant")
          .not("status_changed_at", "is", null)
          .lte("status_changed_at", cutoff)
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const days = daysBetween(todayISO(), str(r, "status_changed_at").slice(0, 10))
          return {
            entity_type: "units", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Unit vacant for ${days} days`,
            facts: { unit_name: str(r, "name"), days_vacant: days },
          }
        })
      }

      // ── Rent & payments ───────────────────────────────────────────────────

      case "rent_due_soon": {
        const within = num(cfg.within_days, 3)
        const { data, error } = await supabase
          .from("rent_schedules")
          .select("id, due_date, amount_due, amount_paid, status, tenancy_id")
          .eq("workspace_id", ws)
          .neq("status", "paid")
          .gte("due_date", todayISO())
          .lte("due_date", daysFromNow(within))
          .order("due_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).filter((r) => {
          const outstanding = num(r.amount_due, 0) - num(r.amount_paid, 0)
          return outstanding > 0
        }).map((r) => {
          const inDays = daysBetween(str(r, "due_date"), todayISO())
          const outstanding = num(r.amount_due, 0) - num(r.amount_paid, 0)
          return {
            entity_type: "rent_schedules", entity_id: str(r, "id"),
            property_id: null,
            summary: `Rent £${outstanding.toFixed(2)} due in ${inDays} day${inDays === 1 ? "" : "s"}`,
            facts: { due_date: str(r, "due_date"), outstanding, days_until_due: inDays },
          }
        })
      }

      case "rent_payment_received": {
        const within = num(cfg.within_days, 1)
        const { data, error } = await supabase
          .from("rent_schedules")
          .select("id, due_date, amount_due, amount_paid, tenancy_id, updated_at")
          .eq("workspace_id", ws)
          .eq("status", "paid")
          .gte("updated_at", daysFromNow(-within))
          .order("updated_at", { ascending: false })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "rent_schedules", entity_id: str(r, "id"),
          property_id: null,
          summary: `Rent payment received: £${num(r.amount_paid, 0).toFixed(2)}`,
          facts: { due_date: str(r, "due_date"), amount_paid: num(r.amount_paid, 0), updated_at: str(r, "updated_at") },
        }))
      }

      case "payment_failed": {
        const { data, error } = await supabase
          .from("rent_schedules")
          .select("id, due_date, amount_due, status, tenancy_id")
          .eq("workspace_id", ws)
          .eq("status", "failed")
          .order("due_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "rent_schedules", entity_id: str(r, "id"),
          property_id: null,
          summary: `Payment failed for £${num(r.amount_due, 0).toFixed(2)} due ${str(r, "due_date")}`,
          facts: { due_date: str(r, "due_date"), amount_due: num(r.amount_due, 0) },
        }))
      }

      case "arrears_threshold_reached": {
        const threshold = num(cfg.min_amount, 500)
        const { data, error } = await supabase
          .from("rent_schedules")
          .select("id, due_date, amount_due, amount_paid, tenancy_id")
          .eq("workspace_id", ws)
          .lt("due_date", todayISO())
          .neq("status", "paid")
          .order("due_date", { ascending: true })
          .limit(limit * 5)
        if (error || !data) return []
        const byTenancy: Record<string, { total: number; ids: string[]; due: string }> = {}
        for (const r of data as Row[]) {
          const outstanding = num(r.amount_due, 0) - num(r.amount_paid, 0)
          if (outstanding <= 0) continue
          const tid = str(r, "tenancy_id")
          if (!byTenancy[tid]) byTenancy[tid] = { total: 0, ids: [], due: str(r, "due_date") }
          byTenancy[tid].total += outstanding
          byTenancy[tid].ids.push(str(r, "id"))
        }
        return Object.entries(byTenancy)
          .filter(([, v]) => v.total >= threshold)
          .slice(0, limit)
          .map(([tenancyId, v]) => ({
            entity_type: "tenancies", entity_id: tenancyId,
            property_id: null,
            summary: `Arrears total £${v.total.toFixed(2)} — threshold exceeded`,
            facts: { total_arrears: v.total, schedule_count: v.ids.length },
          }))
      }

      // ── Maintenance & jobs ─────────────────────────────────────────────────

      case "maintenance_request_submitted": {
        const within = num(cfg.within_days, 1)
        const { data, error } = await supabase
          .from("jobs")
          .select("id, title, status, created_at, property_id")
          .eq("workspace_id", ws)
          .eq("status", "open")
          .gte("created_at", daysFromNow(-within))
          .order("created_at", { ascending: false })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "jobs", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `New maintenance request: ${str(r, "title") || "untitled"}`,
          facts: { title: str(r, "title"), created_at: str(r, "created_at") },
        }))
      }

      case "maintenance_request_overdue": {
        const minDays = num(cfg.min_days_unassigned, 3)
        const { data, error } = await supabase
          .from("jobs")
          .select("id, title, status, created_at, assigned_to, property_id")
          .eq("workspace_id", ws)
          .eq("status", "open")
          .is("assigned_to", null)
          .lte("created_at", daysFromNow(-minDays))
          .order("created_at", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const days = daysBetween(todayISO(), str(r, "created_at").slice(0, 10))
          return {
            entity_type: "jobs", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Maintenance unassigned for ${days} days: ${str(r, "title") || "untitled"}`,
            facts: { title: str(r, "title"), days_unassigned: days },
          }
        })
      }

      case "job_overdue": {
        const { data, error } = await supabase
          .from("jobs")
          .select("id, title, status, due_date, property_id")
          .eq("workspace_id", ws)
          .not("due_date", "is", null)
          .lt("due_date", todayISO())
          .not("status", "in", '("completed","cancelled")')
          .order("due_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const overdue = daysBetween(todayISO(), str(r, "due_date"))
          return {
            entity_type: "jobs", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Job overdue by ${overdue} days: ${str(r, "title") || "untitled"}`,
            facts: { title: str(r, "title"), due_date: str(r, "due_date"), days_overdue: overdue },
          }
        })
      }

      case "quote_received": {
        const within = num(cfg.within_hours, 24)
        const cutoff = new Date(Date.now() - within * 3_600_000).toISOString()
        const { data, error } = await supabase
          .from("supplier_quotes")
          .select("id, amount, created_at, job_id, supplier_id")
          .eq("workspace_id", ws)
          .eq("status", "submitted")
          .gte("created_at", cutoff)
          .order("created_at", { ascending: false })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "supplier_quotes", entity_id: str(r, "id"),
          property_id: null,
          summary: `New quote received: £${num(r.amount, 0).toFixed(2)}`,
          facts: { amount: num(r.amount, 0), created_at: str(r, "created_at"), job_id: str(r, "job_id") },
        }))
      }

      case "quote_expiring": {
        const within = num(cfg.within_days, 3)
        const { data, error } = await supabase
          .from("supplier_quotes")
          .select("id, amount, valid_until, job_id, supplier_id")
          .eq("workspace_id", ws)
          .eq("status", "submitted")
          .not("valid_until", "is", null)
          .gte("valid_until", todayISO())
          .lte("valid_until", daysFromNow(within))
          .order("valid_until", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "valid_until"), todayISO())
          return {
            entity_type: "supplier_quotes", entity_id: str(r, "id"),
            property_id: null,
            summary: `Quote expires in ${inDays} day${inDays === 1 ? "" : "s"}: £${num(r.amount, 0).toFixed(2)}`,
            facts: { amount: num(r.amount, 0), valid_until: str(r, "valid_until"), days_remaining: inDays },
          }
        })
      }

      case "invoice_overdue": {
        const minDays = num(cfg.min_days_overdue, 7)
        const { data, error } = await supabase
          .from("supplier_invoices")
          .select("id, amount, due_date, status, supplier_id, job_id")
          .eq("workspace_id", ws)
          .neq("status", "paid")
          .not("due_date", "is", null)
          .lt("due_date", daysFromNow(-minDays))
          .order("due_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const overdue = daysBetween(todayISO(), str(r, "due_date"))
          return {
            entity_type: "supplier_invoices", entity_id: str(r, "id"),
            property_id: null,
            summary: `Invoice £${num(r.amount, 0).toFixed(2)} overdue by ${overdue} days`,
            facts: { amount: num(r.amount, 0), due_date: str(r, "due_date"), days_overdue: overdue },
          }
        })
      }

      case "inspection_due": {
        const within = num(cfg.within_days, 14)
        const { data, error } = await supabase
          .from("inspections")
          .select("id, scheduled_date, status, property_id")
          .eq("workspace_id", ws)
          .eq("status", "scheduled")
          .gte("scheduled_date", todayISO())
          .lte("scheduled_date", daysFromNow(within))
          .order("scheduled_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "scheduled_date"), todayISO())
          return {
            entity_type: "inspections", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Inspection due in ${inDays} day${inDays === 1 ? "" : "s"}`,
            facts: { scheduled_date: str(r, "scheduled_date"), days_until: inDays },
          }
        })
      }

      case "inspection_overdue": {
        const { data, error } = await supabase
          .from("inspections")
          .select("id, scheduled_date, status, property_id")
          .eq("workspace_id", ws)
          .eq("status", "scheduled")
          .lt("scheduled_date", todayISO())
          .order("scheduled_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const overdue = daysBetween(todayISO(), str(r, "scheduled_date"))
          return {
            entity_type: "inspections", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Inspection ${overdue} days overdue`,
            facts: { scheduled_date: str(r, "scheduled_date"), days_overdue: overdue },
          }
        })
      }

      case "contractor_not_reviewed": {
        const minDays = num(cfg.min_days_since_completion, 7)
        const { data, error } = await supabase
          .from("jobs")
          .select("id, title, completed_date, property_id, supplier_rating")
          .eq("workspace_id", ws)
          .eq("status", "completed")
          .is("supplier_rating", null)
          .not("completed_date", "is", null)
          .lte("completed_date", daysFromNow(-minDays))
          .order("completed_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const days = daysBetween(todayISO(), str(r, "completed_date"))
          return {
            entity_type: "jobs", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Contractor not reviewed — job completed ${days} days ago`,
            facts: { title: str(r, "title"), completed_date: str(r, "completed_date"), days_since_completion: days },
          }
        })
      }

      // ── Compliance & certificates ──────────────────────────────────────────

      case "gas_cert_expiring": {
        const within = num(cfg.within_days, 60)
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, due_date, status, property_id")
          .eq("workspace_id", ws)
          .ilike("title", "%gas%")
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .gte("due_date", todayISO())
          .lte("due_date", daysFromNow(within))
          .neq("status", "complete")
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "due_date"), todayISO())
          return {
            entity_type: "compliance_items", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Gas Safety Certificate expires in ${inDays} days`,
            facts: { due_date: str(r, "due_date"), days_remaining: inDays },
          }
        })
      }

      case "eicr_expiring": {
        const within = num(cfg.within_days, 60)
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, due_date, status, property_id")
          .eq("workspace_id", ws)
          .or("title.ilike.%EICR%,title.ilike.%electrical%")
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .gte("due_date", todayISO())
          .lte("due_date", daysFromNow(within))
          .neq("status", "complete")
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "due_date"), todayISO())
          return {
            entity_type: "compliance_items", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `EICR/Electrical cert expires in ${inDays} days`,
            facts: { due_date: str(r, "due_date"), days_remaining: inDays },
          }
        })
      }

      case "epc_expiring": {
        const within = num(cfg.within_days, 180)
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, due_date, status, property_id")
          .eq("workspace_id", ws)
          .ilike("title", "%EPC%")
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .gte("due_date", todayISO())
          .lte("due_date", daysFromNow(within))
          .neq("status", "complete")
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "due_date"), todayISO())
          return {
            entity_type: "compliance_items", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `EPC expires in ${inDays} days`,
            facts: { due_date: str(r, "due_date"), days_remaining: inDays },
          }
        })
      }

      case "right_to_rent_due": {
        const within = num(cfg.within_days, 30)
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, due_date, status, property_id")
          .eq("workspace_id", ws)
          .ilike("title", "%right to rent%")
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .gte("due_date", todayISO())
          .lte("due_date", daysFromNow(within))
          .neq("status", "complete")
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "due_date"), todayISO())
          return {
            entity_type: "compliance_items", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Right to Rent check due in ${inDays} days`,
            facts: { due_date: str(r, "due_date"), days_remaining: inDays },
          }
        })
      }

      case "insurance_expiring": {
        const within = num(cfg.within_days, 60)
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, due_date, status, property_id")
          .eq("workspace_id", ws)
          .ilike("title", "%insurance%")
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .gte("due_date", todayISO())
          .lte("due_date", daysFromNow(within))
          .neq("status", "complete")
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "due_date"), todayISO())
          return {
            entity_type: "compliance_items", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Insurance expires in ${inDays} days`,
            facts: { due_date: str(r, "due_date"), days_remaining: inDays, title: str(r, "title") },
          }
        })
      }

      case "deposit_unprotected": {
        const afterDays = num(cfg.after_days, 30)
        const { data, error } = await supabase
          .from("tenancies")
          .select("id, start_date, deposit_amount, deposit_protected, property_id")
          .eq("workspace_id", ws)
          .eq("status", "active")
          .eq("deposit_protected", false)
          .not("deposit_amount", "is", null)
          .gt("deposit_amount", 0)
          .lte("start_date", daysFromNow(-afterDays))
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const days = daysBetween(todayISO(), str(r, "start_date"))
          return {
            entity_type: "tenancies", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Deposit of £${num(r.deposit_amount, 0).toFixed(2)} unprotected after ${days} days`,
            facts: { deposit_amount: num(r.deposit_amount, 0), days_since_start: days, start_date: str(r, "start_date") },
          }
        })
      }

      case "deposit_return_overdue": {
        const afterDays = num(cfg.after_days, 10)
        const { data, error } = await supabase
          .from("tenancies")
          .select("id, end_date, deposit_amount, deposit_returned, property_id")
          .eq("workspace_id", ws)
          .in("status", ["ended", "expired"])
          .eq("deposit_returned", false)
          .gt("deposit_amount", 0)
          .not("end_date", "is", null)
          .lt("end_date", daysFromNow(-afterDays))
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const overdue = daysBetween(todayISO(), str(r, "end_date"))
          return {
            entity_type: "tenancies", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Deposit of £${num(r.deposit_amount, 0).toFixed(2)} not returned — ${overdue} days since move-out`,
            facts: { deposit_amount: num(r.deposit_amount, 0), end_date: str(r, "end_date"), days_overdue: overdue },
          }
        })
      }

      // ── Communications & portal ───────────────────────────────────────────

      case "portal_message_unanswered": {
        const minDays = num(cfg.min_days_unanswered, 3)
        const { data, error } = await supabase
          .from("portal_messages")
          .select("id, subject, created_at, thread_id, property_id")
          .eq("workspace_id", ws)
          .eq("is_read", false)
          .lte("created_at", daysFromNow(-minDays))
          .order("created_at", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const days = daysBetween(todayISO(), str(r, "created_at").slice(0, 10))
          return {
            entity_type: "portal_messages", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Unanswered message: "${str(r, "subject") || "no subject"}" (${days} days)`,
            facts: { subject: str(r, "subject"), days_unanswered: days },
          }
        })
      }

      case "complaint_received": {
        const within = num(cfg.within_days, 1)
        const { data, error } = await supabase
          .from("complaints")
          .select("id, subject, status, created_at, property_id")
          .eq("workspace_id", ws)
          .eq("status", "open")
          .gte("created_at", daysFromNow(-within))
          .order("created_at", { ascending: false })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "complaints", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Complaint received: ${str(r, "subject") || "no subject"}`,
          facts: { subject: str(r, "subject"), created_at: str(r, "created_at") },
        }))
      }

      case "document_expiring": {
        const within = num(cfg.within_days, 30)
        const { data, error } = await supabase
          .from("documents")
          .select("id, name, expiry_date, kind, property_id")
          .eq("workspace_id", ws)
          .is("deleted_at", null)
          .not("expiry_date", "is", null)
          .gte("expiry_date", todayISO())
          .lte("expiry_date", daysFromNow(within))
          .order("expiry_date", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const inDays = daysBetween(str(r, "expiry_date"), todayISO())
          return {
            entity_type: "documents", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Document "${str(r, "name")}" expires in ${inDays} days`,
            facts: { name: str(r, "name"), expiry_date: str(r, "expiry_date"), days_remaining: inDays, kind: str(r, "kind") },
          }
        })
      }

      // ── Portfolio events ───────────────────────────────────────────────────

      case "property_added": {
        const within = num(cfg.within_days, 1)
        const { data, error } = await supabase
          .from("properties")
          .select("id, name, address, created_at")
          .eq("workspace_id", ws)
          .gte("created_at", daysFromNow(-within))
          .order("created_at", { ascending: false })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "properties", entity_id: str(r, "id"),
          property_id: str(r, "id"),
          summary: `New property added: ${str(r, "name") || str(r, "address") || "property"}`,
          facts: { name: str(r, "name"), address: str(r, "address"), created_at: str(r, "created_at") },
        }))
      }

      case "unit_vacant": {
        const { data, error } = await supabase
          .from("units")
          .select("id, name, property_id, status, status_changed_at")
          .eq("workspace_id", ws)
          .eq("status", "vacant")
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "units", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Unit "${str(r, "name") || str(r, "id")}" is vacant`,
          facts: { unit_name: str(r, "name"), status_changed_at: str(r, "status_changed_at") },
        }))
      }

      case "hmo_room_vacant": {
        // HMO rooms (units) that are vacant — filter by property type if available
        const { data, error } = await supabase
          .from("units")
          .select("id, name, property_id, status, status_changed_at, unit_type")
          .eq("workspace_id", ws)
          .eq("status", "vacant")
          .in("unit_type", ["room", "hmo_room", "bedsit"])
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "units", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `HMO room "${str(r, "name") || str(r, "id")}" is vacant`,
          facts: { unit_name: str(r, "name"), unit_type: str(r, "unit_type"), status_changed_at: str(r, "status_changed_at") },
        }))
      }

      case "booking_checkin_tomorrow": {
        const { data, error } = await supabase
          .from("stay_bookings")
          .select("id, check_in_date, check_out_date, guest_name, property_id")
          .eq("workspace_id", ws)
          .eq("status", "confirmed")
          .eq("check_in_date", daysFromNow(1))
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "stay_bookings", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Guest ${str(r, "guest_name") || "checking in"} tomorrow`,
          facts: { check_in_date: str(r, "check_in_date"), guest_name: str(r, "guest_name") },
        }))
      }

      case "booking_checkout_today": {
        const { data, error } = await supabase
          .from("stay_bookings")
          .select("id, check_in_date, check_out_date, guest_name, property_id")
          .eq("workspace_id", ws)
          .eq("status", "confirmed")
          .eq("check_out_date", todayISO())
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "stay_bookings", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Guest ${str(r, "guest_name") || ""} checking out today`,
          facts: { check_out_date: str(r, "check_out_date"), guest_name: str(r, "guest_name") },
        }))
      }

      case "booking_cancelled": {
        const within = num(cfg.within_days, 1)
        const { data, error } = await supabase
          .from("stay_bookings")
          .select("id, check_in_date, guest_name, cancelled_at, property_id")
          .eq("workspace_id", ws)
          .eq("status", "cancelled")
          .gte("cancelled_at", daysFromNow(-within))
          .order("cancelled_at", { ascending: false })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "stay_bookings", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Booking cancelled — was due ${str(r, "check_in_date")}`,
          facts: { check_in_date: str(r, "check_in_date"), guest_name: str(r, "guest_name") },
        }))
      }

      // ── Planning / lettings ────────────────────────────────────────────────

      case "viewing_not_booked": {
        const minDays = num(cfg.min_days_vacant, 7)
        const { data: units, error: unitsErr } = await supabase
          .from("units")
          .select("id, name, property_id, status_changed_at")
          .eq("workspace_id", ws)
          .eq("status", "vacant")
          .lte("status_changed_at", daysFromNow(-minDays))
          .limit(limit)
        if (unitsErr || !units) return []
        const unitIds = (units as Row[]).map((u) => str(u, "id"))
        if (unitIds.length === 0) return []
        const { data: viewings } = await supabase
          .from("viewings")
          .select("unit_id")
          .eq("workspace_id", ws)
          .in("unit_id", unitIds)
          .gte("scheduled_at", todayISO())
        const bookedUnits = new Set((viewings || []).map((v: Row) => str(v, "unit_id")))
        return (units as Row[]).filter((u) => !bookedUnits.has(str(u, "id"))).map((u) => {
          const days = daysBetween(todayISO(), str(u, "status_changed_at").slice(0, 10))
          return {
            entity_type: "units", entity_id: str(u, "id"),
            property_id: (u.property_id as string) ?? null,
            summary: `Vacant unit with no viewing booked (${days} days vacant)`,
            facts: { unit_name: str(u, "name"), days_vacant: days },
          }
        })
      }

      case "offer_accepted": {
        const within = num(cfg.within_days, 1)
        const { data, error } = await supabase
          .from("rental_offers")
          .select("id, property_id, amount, accepted_at, applicant_name")
          .eq("workspace_id", ws)
          .eq("status", "accepted")
          .gte("accepted_at", daysFromNow(-within))
          .order("accepted_at", { ascending: false })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => ({
          entity_type: "rental_offers", entity_id: str(r, "id"),
          property_id: (r.property_id as string) ?? null,
          summary: `Offer accepted: £${num(r.amount, 0).toFixed(2)} from ${str(r, "applicant_name") || "applicant"}`,
          facts: { amount: num(r.amount, 0), accepted_at: str(r, "accepted_at"), applicant_name: str(r, "applicant_name") },
        }))
      }

      case "referencing_overdue": {
        const minDays = num(cfg.min_days, 5)
        const { data, error } = await supabase
          .from("tenancy_applications")
          .select("id, property_id, applicant_name, referencing_status, created_at")
          .eq("workspace_id", ws)
          .in("referencing_status", ["pending", "in_progress", "not_started"])
          .lte("created_at", daysFromNow(-minDays))
          .order("created_at", { ascending: true })
          .limit(limit)
        if (error || !data) return []
        return (data as Row[]).map((r) => {
          const days = daysBetween(todayISO(), str(r, "created_at").slice(0, 10))
          return {
            entity_type: "tenancy_applications", entity_id: str(r, "id"),
            property_id: (r.property_id as string) ?? null,
            summary: `Referencing incomplete after ${days} days for ${str(r, "applicant_name") || "applicant"}`,
            facts: { applicant_name: str(r, "applicant_name"), days_since_application: days, referencing_status: str(r, "referencing_status") },
          }
        })
      }

      default:
        return []
    }
  } catch {
    return []
  }
}
