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

export const SCHEDULE_WORKERS: ScheduleWorkerRow[] = [
  { id: "w1", name: "Jake Foster", initials: "JF", trade: "Gas", load: [90, 100, 80, 100, 60], jobsThisWeek: 21 },
  { id: "w2", name: "Mike Thompson", initials: "MT", trade: "Plumbing", load: [60, 80, 70, 90, 50], jobsThisWeek: 17 },
  { id: "w3", name: "Emma Collins", initials: "EC", trade: "Electrical", load: [40, 60, 80, 60, 40], jobsThisWeek: 12 },
  { id: "w4", name: "Sarah Ahmed", initials: "SA", trade: "Multi-trade", load: [20, 40, 30, 50, 20], jobsThisWeek: 8 },
]

export const ROTA_SHIFTS: RotaShift[] = [
  { id: "r1", day: "Mon", onCall: "Jake Foster", onCallInitials: "JF", backup: "Mike Thompson", area: "Manchester N", responseSlaMins: 60, premium: false, gap: false, fatigueRisk: false, handover: "Spare van keys in lockbox." },
  { id: "r2", day: "Tue", onCall: "Mike Thompson", onCallInitials: "MT", backup: "Emma Collins", area: "Manchester C", responseSlaMins: 60, premium: false, gap: false, fatigueRisk: false, handover: null },
  { id: "r3", day: "Wed", onCall: "Jake Foster", onCallInitials: "JF", backup: null, area: "Manchester N", responseSlaMins: 60, premium: true, gap: false, fatigueRisk: true, handover: "Jake on 3rd consecutive night — monitor." },
  { id: "r4", day: "Thu", onCall: "Emma Collins", onCallInitials: "EC", backup: "Sarah Ahmed", area: "Manchester S", responseSlaMins: 90, premium: false, gap: false, fatigueRisk: false, handover: null },
  { id: "r5", day: "Fri", onCall: "—", onCallInitials: "?", backup: null, area: "Manchester S", responseSlaMins: 90, premium: true, gap: true, fatigueRisk: false, handover: null },
  { id: "r6", day: "Sat", onCall: "Sarah Ahmed", onCallInitials: "SA", backup: "Jake Foster", area: "All areas", responseSlaMins: 120, premium: true, gap: false, fatigueRisk: false, handover: "Weekend premium rate applies." },
  { id: "r7", day: "Sun", onCall: "—", onCallInitials: "?", backup: null, area: "All areas", responseSlaMins: 120, premium: true, gap: true, fatigueRisk: false, handover: null },
]
