/* ──────────────────────────────────────────────────────────────────────────
   Team Supplier — schedule capacity + emergency rota seed (images 11 & 12).
   Reads supplier_team_calendar_events / supplier_emergency_rota once wired.
─────────────────────────────────────────────────────────────────────────── */

export interface ScheduleWorkerRow {
  id: string
  name: string
  initials: string
  trade: string
  /** Per-day load 0-100 for Mon..Fri. */
  load: number[]
  jobsThisWeek: number
}

export interface RotaShift {
  id: string
  day: string
  onCall: string
  onCallInitials: string
  backup: string | null
  area: string
  responseSlaMins: number
  premium: boolean
  gap: boolean
  fatigueRisk: boolean
  handover: string | null
}

/* Honest empty defaults — no live schedule/rota loader exists yet.
   supplier_team_calendar_events / supplier_emergency_rota are not yet wired, so
   the capacity and rota views render proper empty states rather than fabricated
   workers and on-call shifts. */
export const SCHEDULE_WORKERS: ScheduleWorkerRow[] = []

export const ROTA_SHIFTS: RotaShift[] = []
