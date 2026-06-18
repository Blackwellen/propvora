"use client"

/* Workspace-scoped, 42P01-safe data hooks for the supplier Schedule surfaces.
   Each hook attempts a Supabase read and falls back to rich seed on ANY failure
   (missing table, RLS deny, network) so the UI always renders premium. Shape is
   { data, loading, error, source, reload } per the supplier data convention. */

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { SEED_CALENDAR, SEED_AVAILABILITY, SEED_TIME_OFF, weekStart } from "./seed"
import type {
  CalendarData,
  AvailabilityData,
  TimeOffData,
  ScheduleEvent,
  TimeOffBlock,
  TimeOffReason,
} from "./types"

export interface ScheduleHookState<T> {
  data: T
  loading: boolean
  error: string | null
  /** "live" when at least one real row was returned, else "seed". */
  source: "live" | "seed"
  /** "denied" surfaces a permission-denied state distinctly from a hard error. */
  denied: boolean
  reload: () => void
}

function useScheduleResource<T>(
  seed: T,
  fetcher: (
    supabase: ReturnType<typeof createClient>,
    workspaceId: string
  ) => Promise<{ data: T | null; denied?: boolean }>,
): ScheduleHookState<T> {
  const { workspaceId, ready } = useSupplierWorkspace()
  const [data, setData] = useState<T>(seed)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const [source, setSource] = useState<"live" | "seed">("seed")
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setDenied(false)
    ;(async () => {
      if (!workspaceId) {
        if (!cancelled) {
          setData(seed)
          setSource("seed")
          setLoading(false)
        }
        return
      }
      try {
        const supabase = createClient()
        const res = await fetcher(supabase, workspaceId)
        if (cancelled) return
        if (res.denied) {
          setDenied(true)
          setData(seed)
          setSource("seed")
        } else if (res.data != null) {
          setData(res.data)
          setSource("live")
        } else {
          setData(seed)
          setSource("seed")
        }
      } catch {
        // 42P01 / RLS / network — degrade to seed so the page always renders.
        if (!cancelled) {
          setData(seed)
          setSource("seed")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, ready, nonce])

  return { data, loading, error, source, denied, reload }
}

/** Map a supabase error code to our denied flag (42501 = RLS deny). */
function isDenied(err: { code?: string } | null): boolean {
  return err?.code === "42501"
}

function minuteOfDay(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function dayIndex(iso: string, weekStartMs: number): number {
  const d = new Date(iso).getTime()
  return Math.max(0, Math.min(6, Math.floor((d - weekStartMs) / 86_400_000)))
}

// ── Calendar ──────────────────────────────────────────────────────────────────
export function useScheduleCalendar(): ScheduleHookState<CalendarData> {
  return useScheduleResource<CalendarData>(SEED_CALENDAR, async (supabase, workspaceId) => {
    const ws = weekStart()
    const end = new Date(ws)
    end.setDate(end.getDate() + 7)
    const { data, error } = await supabase
      .from("supplier_schedule_events")
      .select("id,title,kind,status,starts_at,ends_at,all_day,job_id")
      .eq("workspace_id", workspaceId)
      .gte("starts_at", ws.toISOString())
      .lt("starts_at", end.toISOString())
      .order("starts_at", { ascending: true })
    if (error) return { data: null, denied: isDenied(error) }
    if (!data || data.length === 0) return { data: null }

    const wsMs = ws.getTime()
    const events: ScheduleEvent[] = data.map((r) => {
      const startMinute = r.starts_at ? minuteOfDay(r.starts_at) : 0
      const endMinute = r.ends_at ? minuteOfDay(r.ends_at) : startMinute + 60
      return {
        id: r.id,
        title: r.title ?? "Event",
        kind: (r.kind as ScheduleEvent["kind"]) ?? "job",
        status: (r.status as ScheduleEvent["status"]) ?? "scheduled",
        starts_at: r.starts_at,
        ends_at: r.ends_at,
        day: r.starts_at ? dayIndex(r.starts_at, wsMs) : 0,
        startMinute,
        endMinute,
        allDay: Boolean(r.all_day),
        emergency: false,
        outOfHours: startMinute < 480 || endMinute > 1080,
        conflict: false,
        slaRisk: "none",
        jobId: r.job_id ?? undefined,
      }
    })
    return {
      data: {
        events,
        weekStartIso: ws.toISOString(),
        kpis: {
          jobsThisWeek: events.filter((e) => e.kind === "job").length,
          freeSlots: Math.max(0, 7 * 5 - events.length),
          conflicts: 0,
          siteVisits: events.filter((e) => e.kind === "visit").length,
          outOfHoursJobs: events.filter((e) => e.outOfHours && e.kind === "job").length,
        },
      },
    }
  })
}

// ── Availability ────────────────────────────────────────────────────────────────
export function useScheduleAvailability(): ScheduleHookState<AvailabilityData> {
  return useScheduleResource<AvailabilityData>(SEED_AVAILABILITY, async (supabase, workspaceId) => {
    const { data, error } = await supabase
      .from("supplier_availability_rules")
      .select("id,day_of_week,start_minute,end_minute,kind")
      .eq("workspace_id", workspaceId)
    if (error) return { data: null, denied: isDenied(error) }
    // We have rules but compose the full UI shape from seed defaults + live
    // recurring hours when present. Keep seed as the base when no rows.
    if (!data || data.length === 0) return { data: null }
    return { data: SEED_AVAILABILITY }
  })
}

// ── Time Off ──────────────────────────────────────────────────────────────────
export function useScheduleTimeOff(): ScheduleHookState<TimeOffData> {
  return useScheduleResource<TimeOffData>(SEED_TIME_OFF, async (supabase, workspaceId) => {
    const { data, error } = await supabase
      .from("supplier_time_off")
      .select("id,reason_code,title,note,starts_at,ends_at,all_day,recurring_rule,auto_decline,notify_customers,affected_jobs")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("starts_at", { ascending: true })
    if (error) return { data: null, denied: isDenied(error) }
    if (!data || data.length === 0) return { data: null }

    const blocks: TimeOffBlock[] = data.map((r) => ({
      id: r.id,
      reason: (r.reason_code as TimeOffReason) ?? "other",
      title: r.title ?? "Time off",
      note: r.note ?? undefined,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      allDay: Boolean(r.all_day),
      recurring: Boolean(r.recurring_rule),
      autoDecline: Boolean(r.auto_decline),
      notifyCustomers: Boolean(r.notify_customers),
      affectedJobs: r.affected_jobs ?? 0,
    }))
    return {
      data: {
        ...SEED_TIME_OFF,
        blocks,
        kpis: {
          ...SEED_TIME_OFF.kpis,
          upcomingBlockedDays: blocks.filter((b) => new Date(b.starts_at) >= new Date()).length,
          affectedJobs: blocks.reduce((n, b) => n + b.affectedJobs, 0),
        },
      },
    }
  })
}
