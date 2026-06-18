/* ──────────────────────────────────────────────────────────────────────────
   Supplier Schedule — shared domain types (Calendar / Availability / Time Off).
   Money is integer pence throughout. These mirror the additive Supabase tables
   (supplier_schedule_events, supplier_availability_rules, supplier_time_off)
   but stay UI-shaped so seed + live data share one contract.
─────────────────────────────────────────────────────────────────────────── */

export type EventKind = "job" | "visit" | "travel" | "blocked" | "time_off"
export type EventStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "at_risk"

export interface ScheduleEvent {
  id: string
  title: string
  kind: EventKind
  status: EventStatus
  /** ISO start/end. */
  starts_at: string
  ends_at: string
  /** 0=Mon … 6=Sun (derived for the week grid). */
  day: number
  startMinute: number
  endMinute: number
  allDay: boolean
  emergency: boolean
  outOfHours: boolean
  conflict: boolean
  slaRisk: "none" | "low" | "med" | "high"
  customerName?: string
  customerPhone?: string
  address?: string
  serviceName?: string
  jobId?: string
  travelMinutes?: number
}

export interface CalendarData {
  events: ScheduleEvent[]
  weekStartIso: string
  kpis: {
    jobsThisWeek: number
    freeSlots: number
    conflicts: number
    siteVisits: number
    outOfHoursJobs: number
  }
}

export type AvailabilityBandState = "available" | "emergency_only" | "unavailable"

export interface AvailabilityCell {
  day: number          // 0..6 Mon..Sun
  band: string         // band key e.g. "early" | "core" | "evening" | "night"
  state: AvailabilityBandState
}

export interface AvailabilityDaySummary {
  day: number
  bookableHours: number
  capacityUsed: number
  capacityMax: number
}

export interface AvailabilityRules {
  recurringHoursLabel: string
  emergency247: boolean
  responseWindowHours: number
  leadTimeHours: number
  maxJobsPerDay: number
  travelBufferMinutes: number
}

export interface ServiceAvailabilityRow {
  serviceId: string
  name: string
  state: AvailabilityBandState
  note?: string
}

export interface AvailabilityData {
  bands: { key: string; label: string; startMinute: number; endMinute: number }[]
  cells: AvailabilityCell[]
  daySummaries: AvailabilityDaySummary[]
  rules: AvailabilityRules
  serviceAvailability: ServiceAvailabilityRow[]
  instantBookEligible: boolean
  weeklyBookableHours: number
  kpis: {
    availableDays: number
    bookableHours: number
    emergencyEnabled: boolean
    avgResponse: string
    nextUnavailable: string
  }
}

export type TimeOffReason = "annual_leave" | "pm_off" | "personal" | "training" | "holiday" | "other"

export interface TimeOffBlock {
  id: string
  reason: TimeOffReason
  title: string
  note?: string
  starts_at: string
  ends_at: string
  allDay: boolean
  recurring: boolean
  autoDecline: boolean
  notifyCustomers: boolean
  affectedJobs: number
}

export interface AffectedJob {
  id: string
  jobTitle: string
  customerName: string
  date: string
  action: "conflict" | "reschedule"
}

export interface AffectedRequest {
  id: string
  title: string
  customerName: string
  date: string
}

export interface ReasonCount {
  reason: TimeOffReason
  label: string
  count: number
}

export interface TimeOffData {
  blocks: TimeOffBlock[]
  affectedJobs: AffectedJob[]
  affectedRequests: AffectedRequest[]
  settings: { autoDecline: boolean; notifyCustomers: boolean }
  recurringRules: { id: string; label: string; cadence: string }[]
  reasonCounts: ReasonCount[]
  kpis: {
    timeOffBooked: number
    upcomingBlockedDays: number
    affectedJobs: number
    availableThisMonth: number
  }
}
