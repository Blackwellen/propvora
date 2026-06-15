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

      default:
        return []
    }
  } catch {
    return []
  }
}
