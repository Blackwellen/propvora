'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Calendar cross-section aggregation (LIVE data, 42P01-safe)
//
// The calendar OWNS native calendar_events but its real power is aggregating
// date-linked records from every other live section:
//   • calendar_events  → /app/calendar/events/{id}        (native, editable)
//   • tasks.due_at        → /app/work/tasks/{id}
//   • jobs.scheduled_date → /app/work/jobs/{id}
//   • job_schedules.next_run_at → /app/work/jobs            (recurring scheduled work)
//   • ppm_plans.next_due_date → /app/work/ppm/{id}          (planned maintenance)
//   • tenancies.start_date / end_date → /app/portfolio/tenancies/{id}
//   • rent_schedules.due_date → /app/money/rent-chase       (rent payments due)
//   • arrears_records.due_date → /app/money/arrears         (rent arrears)
//   • compliance_items.due_date → /app/compliance/coverage  (the live compliance source)
//   • property_inspections.scheduled_for → /app/compliance/inspections/{id}
//     (there is no compliance_certificates table — cert expiries surface via
//      compliance_items and property legal-deadline columns)
//   • properties.hmo_licence_expiry / epc_expiry → /app/portfolio/properties/{id} (legal deadlines)
//   • planning_landlord_offers.responded_at/sent_at → /app/planning/landlord-offers/{id}
//
// Every column referenced above is verified against the live DB schema
// (introspected 2026-06-14). possession/HMO-licence have no dedicated table —
// HMO/EPC legal deadlines are property columns, surfaced as compliance items.
//
// Every source query is individually 42P01 / RLS tolerant: a missing table
// yields an empty contribution instead of throwing, so the calendar always
// renders honest content even before every table is provisioned.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type CalendarSource =
  | 'calendar'
  | 'work'
  | 'money'
  | 'portfolio'
  | 'compliance'
  | 'planning'
  | 'contacts'

export interface CalendarItem {
  /** Stable, source-prefixed id (e.g. "task:uuid") so ids never collide. */
  key: string
  /** Raw record id of the owning record. */
  recordId: string
  title: string
  description: string | null
  /** ISO datetime the item is anchored to. */
  start: string
  /** ISO datetime end (native events only), else null. */
  end: string | null
  allDay: boolean
  source: CalendarSource
  /** Human label for the source ("Work", "Compliance", …). */
  sourceLabel: string
  /** Derived status used for colouring / grouping. */
  status: 'scheduled' | 'confirmed' | 'overdue' | 'due_today' | 'completed' | 'cancelled'
  /** Route to the OWNING detail record. */
  href: string
  propertyId: string | null
  /** True only for native calendar_events (editable, owns scheduling). */
  isNative: boolean
}

export const SOURCE_META: Record<
  CalendarSource,
  { label: string; dot: string; chip: string; border: string; barBg: string }
> = {
  calendar:   { label: 'Calendar',   dot: 'bg-slate-500',  chip: 'bg-slate-100 text-slate-700',   border: 'border-l-slate-400',  barBg: 'bg-slate-500'  },
  work:       { label: 'Work',       dot: 'bg-blue-500',   chip: 'bg-blue-100 text-blue-700',     border: 'border-l-blue-400',   barBg: 'bg-blue-500'   },
  money:      { label: 'Money',      dot: 'bg-green-500',  chip: 'bg-green-100 text-green-700',   border: 'border-l-green-400',  barBg: 'bg-green-500'  },
  portfolio:  { label: 'Portfolio',  dot: 'bg-purple-500', chip: 'bg-purple-100 text-purple-700', border: 'border-l-purple-400', barBg: 'bg-purple-500' },
  compliance: { label: 'Compliance', dot: 'bg-orange-500', chip: 'bg-orange-100 text-orange-700', border: 'border-l-orange-400', barBg: 'bg-orange-500' },
  planning:   { label: 'Planning',   dot: 'bg-indigo-500', chip: 'bg-indigo-100 text-indigo-700', border: 'border-l-indigo-400', barBg: 'bg-indigo-500' },
  contacts:   { label: 'Contacts',   dot: 'bg-pink-500',   chip: 'bg-pink-100 text-pink-700',     border: 'border-l-pink-400',   barBg: 'bg-pink-500'   },
}

// ── date helpers ─────────────────────────────────────────────────────────────

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function isPastDay(d: Date, today: Date): boolean {
  return startOfDay(d).getTime() < startOfDay(today).getTime()
}

// 42P01 (undefined_table) or RLS denial → treat as empty contribution.
function tolerant<T>(res: { data: T[] | null; error: { code?: string } | null }): T[] {
  if (res.error) return []
  return res.data ?? []
}

// ── derive a status for a cross-section date relative to "today" ─────────────
function deriveStatus(
  date: Date,
  today: Date,
  opts: { done?: boolean; cancelled?: boolean }
): CalendarItem['status'] {
  if (opts.cancelled) return 'cancelled'
  if (opts.done) return 'completed'
  if (isSameDay(date, today)) return 'due_today'
  if (isPastDay(date, today)) return 'overdue'
  return 'scheduled'
}

// Map a native calendar_events.status onto our reduced status set.
function mapNativeStatus(s: string | null): CalendarItem['status'] {
  switch (s) {
    case 'completed': return 'completed'
    case 'cancelled': return 'cancelled'
    case 'confirmed': return 'confirmed'
    case 'overdue':
    case 'urgent':
    case 'action_required': return 'overdue'
    case 'due_today':
    case 'due_tomorrow': return 'due_today'
    default: return 'scheduled'
  }
}

// Native events store an explicit status, but a past-dated event left as
// "scheduled"/"confirmed" must still read as overdue/due-today — exactly like
// every cross-section item (deriveStatus) and the `overdue` bucket. Without this
// the Overdue KPI (date-based bucket) and the Status="Overdue" filter (status
// string) disagree. Terminal/explicit states always win; otherwise we make the
// status date-aware so all surfaces (KPI, filter, Schedule/Timeline) agree.
function deriveNativeStatus(metaStatus: string | null, start: string, today: Date): CalendarItem['status'] {
  const stored = mapNativeStatus(metaStatus)
  if (stored === 'completed' || stored === 'cancelled' || stored === 'overdue') return stored
  const d = new Date(start)
  if (isSameDay(d, today)) return 'due_today'
  if (isPastDay(d, today)) return 'overdue'
  return stored // future: keep scheduled / confirmed
}

export interface UseCalendarItemsResult {
  items: CalendarItem[]
  isLoading: boolean
  isError: boolean
  /** Per-source availability — false when a table is missing/denied. */
  sourcesLive: Record<CalendarSource, boolean>
  refetch: () => void
}

export function useCalendarItems(workspaceId: string | undefined): UseCalendarItemsResult {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['calendar-items', workspaceId],
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
    queryFn: async (): Promise<{ items: CalendarItem[]; sourcesLive: Record<CalendarSource, boolean> }> => {
      const wsId = workspaceId as string
      const today = new Date()
      const items: CalendarItem[] = []
      const sourcesLive: Record<CalendarSource, boolean> = {
        calendar: true, work: true, money: true,
        portfolio: true, compliance: true, planning: true, contacts: true,
      }

      // Fire every source in parallel; each is independently tolerant.
      const [
        eventsRes,
        tasksRes,
        jobsRes,
        jobSchedulesRes,
        ppmRes,
        tenanciesRes,
        rentRes,
        arrearsRes,
        complianceItemsRes,
        inspectionsRes,
        propsRes,
        offersRes,
      ] = await Promise.all([
        supabase.from('calendar_events')
          .select('id, title, description, start_at, end_at, all_day, property_id, metadata')
          .eq('workspace_id', wsId)
          .order('start_at', { ascending: true }),
        supabase.from('tasks')
          .select('id, title, description, due_at, status, property_id')
          .eq('workspace_id', wsId)
          .not('due_at', 'is', null),
        supabase.from('jobs')
          .select('id, title, description, scheduled_date, status, property_id')
          .eq('workspace_id', wsId)
          .not('scheduled_date', 'is', null),
        supabase.from('job_schedules')
          .select('id, title, kind, next_run_at, active, property_id')
          .eq('workspace_id', wsId)
          .not('next_run_at', 'is', null),
        supabase.from('ppm_plans')
          .select('id, name, description, category, status, next_due_date, property_id')
          .eq('workspace_id', wsId)
          .not('next_due_date', 'is', null),
        supabase.from('tenancies')
          .select('id, start_date, end_date, status, property_id')
          .eq('workspace_id', wsId),
        supabase.from('rent_schedules')
          .select('id, due_date, amount_due, amount_paid, status, tenancy_id')
          .eq('workspace_id', wsId)
          .not('due_date', 'is', null),
        supabase.from('arrears_records')
          .select('id, due_date, amount_outstanding, status, property_id')
          .eq('workspace_id', wsId)
          .not('due_date', 'is', null),
        supabase.from('compliance_items')
          .select('id, title, kind, status, due_date, property_id')
          .eq('workspace_id', wsId)
          .is('deleted_at', null)
          .not('due_date', 'is', null),
        // Live table is `property_inspections` (kind / scheduled_for / status).
        // There is no `compliance_certificates` table — certificate expiries are
        // surfaced via compliance_items / property legal-deadline columns instead.
        supabase.from('property_inspections')
          .select('id, kind, scheduled_for, completed_at, status, property_id')
          .eq('workspace_id', wsId)
          .is('deleted_at', null)
          .not('scheduled_for', 'is', null),
        supabase.from('properties')
          .select('id, nickname, address_line1, hmo_licence_expiry, epc_expiry')
          .eq('workspace_id', wsId),
        supabase.from('planning_landlord_offers')
          .select('id, property_address, status, sent_at, responded_at, created_at')
          .eq('workspace_id', wsId),
      ])

      sourcesLive.calendar = !eventsRes.error
      sourcesLive.work = !tasksRes.error || !jobsRes.error || !jobSchedulesRes.error || !ppmRes.error
      sourcesLive.portfolio = !tenanciesRes.error
      sourcesLive.compliance = !complianceItemsRes.error || !inspectionsRes.error || !propsRes.error
      sourcesLive.planning = !offersRes.error
      // money surfaces through rent schedules + arrears (+ native source_module)
      sourcesLive.money = !rentRes.error || !arrearsRes.error || !eventsRes.error
      sourcesLive.contacts = !eventsRes.error

      // ── Native calendar events ───────────────────────────────────────────
      for (const e of tolerant(eventsRes) as Array<Record<string, any>>) {
        if (!e.start_at) continue
        // source_module / status are stored in metadata (not columns).
        const meta = (e.metadata ?? {}) as Record<string, any>
        const sm = (meta.source_module ?? 'manual') as string
        const source: CalendarSource =
          sm === 'money' ? 'money'
          : sm === 'contacts' ? 'contacts'
          : sm === 'compliance' ? 'compliance'
          : sm === 'planning' ? 'planning'
          : sm === 'portfolio' ? 'portfolio'
          : sm === 'work' || sm === 'supplier' ? 'work'
          : 'calendar'
        items.push({
          key: `event:${e.id}`,
          recordId: e.id,
          title: e.title ?? 'Untitled event',
          description: e.description ?? null,
          start: e.start_at,
          end: e.end_at ?? null,
          allDay: Boolean(e.all_day),
          source,
          sourceLabel: SOURCE_META[source].label,
          status: deriveNativeStatus((meta.status ?? null) as string | null, e.start_at, today),
          href: `/property-manager/calendar/events/${e.id}`,
          propertyId: e.property_id ?? null,
          isNative: true,
        })
      }

      // ── Tasks (due_date) → Work ──────────────────────────────────────────
      for (const t of tolerant(tasksRes) as Array<Record<string, any>>) {
        const due = t.due_at as string | null
        if (!due) continue
        const done = t.status === 'done' || t.status === 'completed'
        const cancelled = t.status === 'cancelled'
        items.push({
          key: `task:${t.id}`,
          recordId: t.id,
          title: t.title ?? 'Task',
          description: t.description ?? null,
          start: due,
          end: null,
          allDay: true,
          source: 'work',
          sourceLabel: 'Work',
          status: deriveStatus(new Date(due), today, { done, cancelled }),
          href: `/property-manager/work/tasks/${t.id}`,
          propertyId: t.property_id ?? null,
          isNative: false,
        })
      }

      // ── Jobs (scheduled_date) → Work ─────────────────────────────────────
      for (const j of tolerant(jobsRes) as Array<Record<string, any>>) {
        const when = j.scheduled_date as string | null
        if (!when) continue
        const done = j.status === 'complete' || j.status === 'completed'
        const cancelled = j.status === 'cancelled'
        items.push({
          key: `job:${j.id}`,
          recordId: j.id,
          title: j.title ?? 'Job',
          description: j.description ?? null,
          start: when,
          end: null,
          allDay: true,
          source: 'work',
          sourceLabel: 'Work',
          status: deriveStatus(new Date(when), today, { done, cancelled }),
          href: `/property-manager/work/jobs/${j.id}`,
          propertyId: j.property_id ?? null,
          isNative: false,
        })
      }

      // ── Job schedules (next recurring run) → Work ────────────────────────
      for (const s of tolerant(jobSchedulesRes) as Array<Record<string, any>>) {
        const when = s.next_run_at as string | null
        if (!when) continue
        items.push({
          key: `jobsched:${s.id}`,
          recordId: s.id,
          title: s.title ? `${s.title} (recurring)` : 'Scheduled work',
          description: s.kind ?? null,
          start: when,
          end: null,
          allDay: false,
          source: 'work',
          sourceLabel: 'Work',
          status: deriveStatus(new Date(when), today, { cancelled: s.active === false }),
          href: `/property-manager/work/jobs`,
          propertyId: s.property_id ?? null,
          isNative: false,
        })
      }

      // ── PPM plans (next planned-maintenance date) → Work ─────────────────
      for (const p of tolerant(ppmRes) as Array<Record<string, any>>) {
        const when = p.next_due_date as string | null
        if (!when) continue
        const done = p.status === 'completed' || p.status === 'archived'
        const cancelled = p.status === 'cancelled' || p.status === 'paused'
        items.push({
          key: `ppm:${p.id}`,
          recordId: p.id,
          title: `PPM — ${p.name ?? 'Planned maintenance'}`,
          description: p.category ?? p.description ?? null,
          start: when,
          end: null,
          allDay: true,
          source: 'work',
          sourceLabel: 'Work',
          status: deriveStatus(new Date(when), today, { done, cancelled }),
          href: `/property-manager/work/ppm/${p.id}`,
          propertyId: p.property_id ?? null,
          isNative: false,
        })
      }

      // ── Tenancies (start_date / end_date) → Portfolio ────────────────────
      for (const tn of tolerant(tenanciesRes) as Array<Record<string, any>>) {
        const ended = tn.status === 'ended' || tn.status === 'surrendered'
        if (tn.start_date) {
          items.push({
            key: `tenancy-start:${tn.id}`,
            recordId: tn.id,
            title: 'Tenancy starts',
            description: null,
            start: tn.start_date,
            end: null,
            allDay: true,
            source: 'portfolio',
            sourceLabel: 'Portfolio',
            status: deriveStatus(new Date(tn.start_date), today, { done: tn.status === 'active' || ended }),
            href: `/property-manager/portfolio/tenancies/${tn.id}`,
            propertyId: tn.property_id ?? null,
            isNative: false,
          })
        }
        if (tn.end_date) {
          items.push({
            key: `tenancy-end:${tn.id}`,
            recordId: tn.id,
            title: 'Tenancy ends',
            description: null,
            start: tn.end_date,
            end: null,
            allDay: true,
            source: 'portfolio',
            sourceLabel: 'Portfolio',
            status: deriveStatus(new Date(tn.end_date), today, { done: ended }),
            href: `/property-manager/portfolio/tenancies/${tn.id}`,
            propertyId: tn.property_id ?? null,
            isNative: false,
          })
        }
      }

      // ── Rent schedules (due date) → Money ────────────────────────────────
      for (const r of tolerant(rentRes) as Array<Record<string, any>>) {
        const when = r.due_date as string | null
        if (!when) continue
        const paid = r.status === 'paid'
          || (Number(r.amount_paid ?? 0) >= Number(r.amount_due ?? 0) && Number(r.amount_due ?? 0) > 0)
        const cancelled = r.status === 'cancelled' || r.status === 'waived'
        const amt = Number(r.amount_due ?? 0)
        items.push({
          key: `rent:${r.id}`,
          recordId: r.id,
          title: amt > 0 ? `Rent due — £${amt.toLocaleString('en-GB')}` : 'Rent due',
          description: null,
          start: when,
          end: null,
          allDay: true,
          source: 'money',
          sourceLabel: 'Money',
          status: deriveStatus(new Date(when), today, { done: paid, cancelled }),
          href: `/property-manager/money/rent-chase`,
          propertyId: null,
          isNative: false,
        })
      }

      // ── Arrears (overdue rent) → Money ───────────────────────────────────
      for (const a of tolerant(arrearsRes) as Array<Record<string, any>>) {
        const when = a.due_date as string | null
        if (!when) continue
        const resolved = a.status === 'resolved' || a.status === 'cleared' || a.status === 'paid' || a.status === 'closed'
        const out = Number(a.amount_outstanding ?? 0)
        items.push({
          key: `arrears:${a.id}`,
          recordId: a.id,
          title: out > 0 ? `Arrears — £${out.toLocaleString('en-GB')} outstanding` : 'Arrears',
          description: null,
          start: when,
          end: null,
          allDay: true,
          source: 'money',
          sourceLabel: 'Money',
          status: resolved ? 'completed' : deriveStatus(new Date(when), today, {}),
          href: `/property-manager/money/arrears`,
          propertyId: a.property_id ?? null,
          isNative: false,
        })
      }

      // ── Compliance items (due_date) → Compliance (the live source) ───────
      for (const ci of tolerant(complianceItemsRes) as Array<Record<string, any>>) {
        const when = ci.due_date as string | null
        if (!when) continue
        // compliance_items.status enum: ok | due_soon | overdue | missing | exempt
        const done = ci.status === 'ok'
        const cancelled = ci.status === 'exempt'
        items.push({
          key: `compitem:${ci.id}`,
          recordId: ci.id,
          title: ci.title ?? `${ci.kind ?? 'Compliance'} due`,
          description: ci.kind ?? null,
          start: when,
          end: null,
          allDay: true,
          source: 'compliance',
          sourceLabel: 'Compliance',
          status: deriveStatus(new Date(when), today, { done, cancelled }),
          href: `/property-manager/compliance/coverage`,
          propertyId: ci.property_id ?? null,
          isNative: false,
        })
      }

      // ── Property legal deadlines (HMO licence / EPC expiry) → Compliance ──
      for (const pr of tolerant(propsRes) as Array<Record<string, any>>) {
        const label = pr.nickname ?? pr.address_line1 ?? 'Property'
        const deadlines: Array<[string | null, string]> = [
          [pr.hmo_licence_expiry as string | null, 'HMO licence expires'],
          [pr.epc_expiry as string | null, 'EPC expires'],
        ]
        for (const [when, kind] of deadlines) {
          if (!when) continue
          items.push({
            key: `propdeadline:${pr.id}:${kind}`,
            recordId: pr.id,
            title: `${kind} — ${label}`,
            description: null,
            start: when,
            end: null,
            allDay: true,
            source: 'compliance',
            sourceLabel: 'Compliance',
            status: deriveStatus(new Date(when), today, {}),
            href: `/property-manager/portfolio/properties/${pr.id}`,
            propertyId: pr.id,
            isNative: false,
          })
        }
      }

      // ── Property inspections (scheduled) → Compliance ────────────────────
      for (const ins of tolerant(inspectionsRes) as Array<Record<string, any>>) {
        const when = ins.scheduled_for as string | null
        if (!when) continue
        const done = ins.status === 'completed' || ins.status === 'passed' || !!ins.completed_at
        items.push({
          key: `inspection:${ins.id}`,
          recordId: ins.id,
          title: `${(ins.kind ?? 'Inspection')} inspection`,
          description: null,
          start: when,
          end: null,
          allDay: true,
          source: 'compliance',
          sourceLabel: 'Compliance',
          status: deriveStatus(new Date(when), today, { done }),
          href: `/property-manager/compliance/inspections/${ins.id}`,
          propertyId: ins.property_id ?? null,
          isNative: false,
        })
      }

      // ── Planning landlord offers (expiry/response) → Planning ────────────
      for (const o of tolerant(offersRes) as Array<Record<string, any>>) {
        // Anchor to responded_at, else sent_at, else created_at.
        const when = (o.responded_at ?? o.sent_at ?? o.created_at) as string | null
        if (!when) continue
        const done = o.status === 'accepted' || o.status === 'declined' || o.status === 'expired'
        items.push({
          key: `offer:${o.id}`,
          recordId: o.id,
          title: `Landlord offer — ${o.property_address ?? 'property'}`,
          description: null,
          start: when,
          end: null,
          allDay: true,
          source: 'planning',
          sourceLabel: 'Planning',
          status: deriveStatus(new Date(when), today, { done }),
          href: `/property-manager/planning/landlord-offers/${o.id}`,
          propertyId: null,
          isNative: false,
        })
      }

      // Chronological order.
      items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      return { items, sourcesLive }
    },
  })

  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    sourcesLive: query.data?.sourcesLive ?? {
      calendar: true, work: true, money: true,
      portfolio: true, compliance: true, planning: true, contacts: true,
    },
    refetch: () => void query.refetch(),
  }
}

// ── shared derived selectors used across calendar pages ──────────────────────

export interface CalendarBuckets {
  today: CalendarItem[]
  thisWeek: CalendarItem[]   // next 7 days incl. today
  overdue: CalendarItem[]    // past, not completed/cancelled
  upcoming: CalendarItem[]   // strictly after this week
  past: CalendarItem[]       // before today, any status
}

export function bucketItems(items: CalendarItem[], now: Date = new Date()): CalendarBuckets {
  const today0 = startOfDay(now)
  const weekEnd = new Date(today0)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const today: CalendarItem[] = []
  const thisWeek: CalendarItem[] = []
  const overdue: CalendarItem[] = []
  const upcoming: CalendarItem[] = []
  const past: CalendarItem[] = []

  for (const it of items) {
    const d = new Date(it.start)
    const d0 = startOfDay(d)
    if (isSameDay(d, now)) today.push(it)
    if (d0.getTime() >= today0.getTime() && d0.getTime() < weekEnd.getTime()) thisWeek.push(it)
    if (d0.getTime() < today0.getTime()) {
      past.push(it)
      if (it.status !== 'completed' && it.status !== 'cancelled') overdue.push(it)
    }
    if (d0.getTime() >= weekEnd.getTime()) upcoming.push(it)
  }
  return { today, thisWeek, overdue, upcoming, past }
}

export function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
