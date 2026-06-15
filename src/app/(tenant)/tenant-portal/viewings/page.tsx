"use client"

import React, { useEffect, useState } from "react"
import { CalendarCheck, MapPin, Clock, CheckCircle2, Calendar } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import {
  resolveTenantContext, resolveTenantTenancies,
  tenancyIds, tenancyPropertyIds, formatDate, propertyLabel,
  type TenantContext, type PropertyLite,
} from "../_lib/tenant-context"

interface ViewingRow {
  id: string
  title: string
  description: string | null
  event_type: string | null
  status: string
  start_at: string
  end_at: string | null
  location: string | null
  property_id: string | null
}

const VIEWING_TYPES = ["viewing", "inspection", "check_in", "check_out"]

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

function statusMeta(status: string): { label: string; variant: "default" | "primary" | "success" | "warning" | "sky" } {
  switch (status) {
    case "confirmed": return { label: "Confirmed", variant: "success" }
    case "completed": return { label: "Completed", variant: "default" }
    case "cancelled": return { label: "Cancelled", variant: "default" }
    case "tentative": return { label: "Tentative", variant: "warning" }
    default: return { label: "Scheduled", variant: "sky" }
  }
}

export default function TenantViewingsPage() {
  const [ctx, setCtx] = useState<TenantContext | null>(null)
  const [events, setEvents] = useState<ViewingRow[]>([])
  const [propertyById, setPropertyById] = useState<Map<string, PropertyLite>>(new Map())
  const [loading, setLoading] = useState(true)
  const [noContext, setNoContext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const tenant = await resolveTenantContext()
        if (!tenant) { setNoContext(true); setLoading(false); return }
        setCtx(tenant)

        const myTenancies = await resolveTenantTenancies(tenant.contactId, tenant.workspaceId)
        const tIds = tenancyIds(myTenancies)
        const pIds = tenancyPropertyIds(myTenancies)

        // Property labels
        if (pIds.length > 0) {
          try {
            const { data: pData } = await supabase
              .from("properties")
              .select("id, nickname, address_line1, address_line2, city, postcode, status")
              .in("id", pIds)
            const m = new Map<string, PropertyLite>()
            for (const r of (pData ?? []) as unknown as PropertyLite[]) m.set(r.id, r)
            setPropertyById(m)
          } catch { /* tolerate */ }
        }

        // LIVE calendar_events scoped STRICTLY to this tenant. The live schema
        // links events to a subject via related_type/related_id (contact,
        // tenancy) plus a direct property_id column — there is no status /
        // location / contact_id / tenancy_id column. We never load
        // all-workspace events; viewing-type only.
        const collected = new Map<string, ViewingRow>()
        const SELECT =
          "id, title, description, event_type, type, start_at, start_date, end_at, property_address, property_id, related_type, related_id"

        function collect(rows: Record<string, unknown>[]) {
          for (const r of rows) {
            const type = (r.event_type as string) ?? (r.type as string) ?? ""
            if (!VIEWING_TYPES.includes(type)) continue
            collected.set(r.id as string, {
              id: r.id as string,
              title: (r.title as string) ?? "Viewing",
              description: (r.description as string) ?? null,
              event_type: type,
              status: "scheduled", // no per-event status column in the live schema
              start_at: (r.start_at as string) ?? (r.start_date as string),
              end_at: (r.end_at as string) ?? null,
              location: (r.property_address as string) ?? null,
              property_id: (r.property_id as string) ?? null,
            })
          }
        }

        // Scope by related_type/related_id (contact + tenancy linkage).
        async function pullRelated(relatedType: string, ids: string[]) {
          if (ids.length === 0) return
          try {
            const { data, error: evErr } = await supabase
              .from("calendar_events")
              .select(SELECT)
              .eq("related_type", relatedType)
              .in("related_id", ids)
            if (evErr) {
              if (code(evErr) !== "42P01") setError("Could not load your viewings.")
              return
            }
            collect((data ?? []) as Record<string, unknown>[])
          } catch { /* tolerate */ }
        }

        // Scope by a direct column (property_id).
        async function pullColumn(column: string, ids: string[]) {
          if (ids.length === 0) return
          try {
            const { data, error: evErr } = await supabase
              .from("calendar_events")
              .select(SELECT)
              .in(column, ids)
            if (evErr) {
              if (code(evErr) !== "42P01") setError("Could not load your viewings.")
              return
            }
            collect((data ?? []) as Record<string, unknown>[])
          } catch { /* tolerate */ }
        }

        await pullRelated("contact", [tenant.contactId])
        await pullRelated("tenancy", tIds)
        await pullColumn("property_id", pIds)

        setEvents(
          Array.from(collected.values()).sort(
            (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
          )
        )
      } catch (err) {
        console.error(err)
        setError("Unexpected error loading viewings.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleConfirm(id: string) {
    setConfirming(id)
    try {
      const supabase = createClient()
      const { error: upErr } = await supabase
        .from("calendar_events")
        .update({ status: "confirmed" })
        .eq("id", id)
      if (upErr) throw upErr
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "confirmed" } : e)))
    } catch (err) {
      console.error(err)
      setError("Could not confirm this appointment.")
    } finally {
      setConfirming(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-56" /></div>
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <CalendarCheck className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No tenant account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Ask your managing agent to grant you portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.end_at ?? e.start_at).getTime() >= now && e.status !== "cancelled")
  const past = events.filter((e) => new Date(e.end_at ?? e.start_at).getTime() < now || e.status === "cancelled")

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Viewings &amp; Visits</h1>
        <p className="text-sm text-slate-500">Inspections, viewings and check-ins for your home</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {events.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <CalendarCheck className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No viewings scheduled</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              You don&apos;t have any viewings, inspections or visits scheduled. When your managing agent books one,
              it will appear here for you to confirm.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">Upcoming</h2>
              {upcoming.map((e) => (
                <ViewingCard
                  key={e.id}
                  event={e}
                  property={e.property_id ? propertyById.get(e.property_id) ?? null : null}
                  onConfirm={handleConfirm}
                  confirming={confirming === e.id}
                />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">Past</h2>
              {past.map((e) => (
                <ViewingCard
                  key={e.id}
                  event={e}
                  property={e.property_id ? propertyById.get(e.property_id) ?? null : null}
                  past
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ViewingCard({
  event, property, onConfirm, confirming, past,
}: {
  event: ViewingRow
  property: PropertyLite | null
  onConfirm?: (id: string) => void
  confirming?: boolean
  past?: boolean
}) {
  const meta = statusMeta(event.status)
  const canConfirm = !past && event.status !== "confirmed" && event.status !== "cancelled" && !!onConfirm
  return (
    <Card className="p-4 rounded-2xl border-slate-200">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-900">{event.title}</h3>
            <Badge variant={meta.variant} dot>{meta.label}</Badge>
            {event.event_type && (
              <Badge variant="outline" size="sm">
                <span className="capitalize">{event.event_type.replace(/_/g, " ")}</span>
              </Badge>
            )}
          </div>
          {event.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{event.description}</p>}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {formatDate(event.start_at, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {formatDate(event.start_at, { hour: "2-digit", minute: "2-digit" })}
              {event.end_at && ` – ${formatDate(event.end_at, { hour: "2-digit", minute: "2-digit" })}`}
            </span>
            {(event.location || property) && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {event.location || (property ? propertyLabel(property) : "")}
              </span>
            )}
          </div>
        </div>
        {canConfirm && (
          <Button variant="primary" size="sm" onClick={() => onConfirm!(event.id)} disabled={confirming}>
            <CheckCircle2 className="w-4 h-4" /> {confirming ? "Confirming…" : "Confirm"}
          </Button>
        )}
      </div>
    </Card>
  )
}
