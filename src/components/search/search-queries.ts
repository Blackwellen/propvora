"use client"

// ────────────────────────────────────────────────────────────────────────────
// Command-palette search queries
//
// Workspace-scoped, RLS-safe, 42P01-safe reads across the core entities. Each
// query is independently try/caught so a missing table never breaks the rest,
// and result counts are capped. Real data only — no mocks.
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/client"
import { resolveEntityHref } from "@/lib/notifications/routes"

export type ResultGroup =
  | "Properties"
  | "Units"
  | "Tenancies"
  | "Contacts"
  | "Tasks"
  | "Jobs"
  | "Invoices"
  | "Compliance"
  | "Planning"
  | "Calendar"

export interface SearchHit {
  id: string
  group: ResultGroup
  title: string
  subtitle: string
  href: string
}

const PER_GROUP = 5

function esc(term: string): string {
  // Escape PostgREST `or` reserved characters in user input.
  return term.replace(/[%,()]/g, " ").trim()
}

export async function runEntitySearch(
  workspaceId: string,
  rawTerm: string,
): Promise<SearchHit[]> {
  const term = esc(rawTerm)
  if (!term || !workspaceId) return []
  const supabase = createClient()
  const like = `%${term}%`
  const hits: SearchHit[] = []

  await Promise.all([
    // ── Properties ────────────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("properties")
          .select("id, nickname, address_line1, city, postcode")
          .eq("workspace_id", workspaceId)
          .or(`nickname.ilike.${like},address_line1.ilike.${like},city.ilike.${like},postcode.ilike.${like}`)
          .limit(PER_GROUP)
        for (const p of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: p.id, group: "Properties",
            title: p.nickname || p.address_line1 || "Property",
            subtitle: [p.address_line1, p.city, p.postcode].filter(Boolean).join(", "),
            href: resolveEntityHref("property", p.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Units ─────────────────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("units")
          .select("id, label, status, property_id")
          .eq("workspace_id", workspaceId)
          .ilike("label", like)
          .limit(PER_GROUP)
        for (const u of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: u.id, group: "Units",
            title: u.label || "Unit",
            subtitle: u.status ? `Unit · ${u.status}` : "Unit",
            href: resolveEntityHref("unit", u.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Tenancies ─────────────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("tenancies")
          .select("id, status, start_date, end_date, deposit_ref")
          .eq("workspace_id", workspaceId)
          .or(`deposit_ref.ilike.${like},status.ilike.${like}`)
          .limit(PER_GROUP)
        for (const t of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: t.id, group: "Tenancies",
            title: t.deposit_ref ? `Tenancy ${t.deposit_ref}` : "Tenancy",
            subtitle: [t.status, t.start_date && `from ${t.start_date}`].filter(Boolean).join(" · "),
            href: resolveEntityHref("tenancy", t.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Contacts ──────────────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("contacts")
          .select("id, display_name, email, type, company")
          .eq("workspace_id", workspaceId)
          .or(`display_name.ilike.${like},email.ilike.${like},company.ilike.${like}`)
          .limit(PER_GROUP)
        for (const c of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: c.id, group: "Contacts",
            title: c.display_name || c.email || "Contact",
            subtitle: [c.type, c.company, c.email].filter(Boolean).join(" · "),
            href: resolveEntityHref("contact", c.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Tasks ─────────────────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("tasks")
          .select("id, title, status, priority")
          .eq("workspace_id", workspaceId)
          .ilike("title", like)
          .limit(PER_GROUP)
        for (const t of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: t.id, group: "Tasks",
            title: t.title || "Task",
            subtitle: [t.status, t.priority].filter(Boolean).join(" · ") || "Task",
            href: resolveEntityHref("task", t.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Jobs ──────────────────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("jobs")
          .select("id, title, status, reference")
          .eq("workspace_id", workspaceId)
          .or(`title.ilike.${like},reference.ilike.${like}`)
          .limit(PER_GROUP)
        for (const j of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: j.id, group: "Jobs",
            title: j.title || j.reference || "Job",
            subtitle: [j.reference, j.status].filter(Boolean).join(" · ") || "Job",
            href: resolveEntityHref("job", j.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Invoices ──────────────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("invoices")
          .select("id, invoice_number, status, total")
          .eq("workspace_id", workspaceId)
          .ilike("invoice_number", like)
          .limit(PER_GROUP)
        for (const i of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: i.id, group: "Invoices",
            title: i.invoice_number ? `Invoice ${i.invoice_number}` : "Invoice",
            subtitle: [i.status, i.total != null && `£${Number(i.total).toLocaleString()}`]
              .filter(Boolean).join(" · "),
            href: resolveEntityHref("invoice", i.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Compliance items ──────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("compliance_items")
          .select("id, title, kind, status, due_date")
          .eq("workspace_id", workspaceId)
          .or(`title.ilike.${like},kind.ilike.${like}`)
          .limit(PER_GROUP)
        for (const c of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: c.id, group: "Compliance",
            title: c.title || c.kind || "Compliance item",
            subtitle: [c.kind, c.status, c.due_date && `due ${c.due_date}`].filter(Boolean).join(" · "),
            href: resolveEntityHref("compliance_item", c.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Planning sets ─────────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("planning_sets")
          .select("id, title, status, operation_profile")
          .eq("workspace_id", workspaceId)
          .ilike("title", like)
          .limit(PER_GROUP)
        for (const p of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: p.id, group: "Planning",
            title: p.title || "Planning set",
            subtitle: [p.operation_profile, p.status].filter(Boolean).join(" · ") || "Planning set",
            href: resolveEntityHref("planning_set", p.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),

    // ── Calendar events ───────────────────────────────────────────
    (async () => {
      try {
        const { data } = await supabase
          .from("calendar_events")
          .select("id, title, type, start_date, start_at")
          .eq("workspace_id", workspaceId)
          .ilike("title", like)
          .limit(PER_GROUP)
        for (const e of (data ?? []) as Record<string, string>[]) {
          hits.push({
            id: e.id, group: "Calendar",
            title: e.title || "Event",
            subtitle: [e.type, e.start_date || (e.start_at ? String(e.start_at).slice(0, 10) : null)]
              .filter(Boolean).join(" · ") || "Event",
            href: resolveEntityHref("calendar_event", e.id)!,
          })
        }
      } catch { /* 42P01-safe */ }
    })(),
  ])

  return hits
}
