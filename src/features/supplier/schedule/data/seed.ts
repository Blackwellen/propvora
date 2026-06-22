/* Rich, demo-quality seed data for the supplier Schedule surfaces. Used as the
   42P01-safe fallback so every tab renders premium before migrations run / when
   the workspace has no rows yet. All times are anchored to the current week. */

import type {
  CalendarData,
  AvailabilityData,
  TimeOffData,
  ScheduleEvent,
} from "./types"

/** Monday 00:00 of the current week, in local time, as ISO. */
export function weekStart(d = new Date()): Date {
  const x = new Date(d)
  const dow = (x.getDay() + 6) % 7 // 0=Mon
  x.setDate(x.getDate() - dow)
  x.setHours(0, 0, 0, 0)
  return x
}

function isoAt(dayOffset: number, minute: number): string {
  const base = weekStart()
  const d = new Date(base)
  d.setDate(d.getDate() + dayOffset)
  d.setMinutes(minute)
  return d.toISOString()
}

function ev(p: Partial<ScheduleEvent> & {
  id: string; title: string; kind: ScheduleEvent["kind"]; day: number;
  startMinute: number; endMinute: number
}): ScheduleEvent {
  return {
    status: "scheduled",
    allDay: false,
    emergency: false,
    outOfHours: p.startMinute < 480 || p.endMinute > 1080,
    conflict: false,
    slaRisk: "none",
    starts_at: isoAt(p.day, p.startMinute),
    ends_at: isoAt(p.day, p.endMinute),
    ...p,
  }
}

const EVENTS: ScheduleEvent[] = [
  ev({ id: "e1", title: "Boiler service — 14 Elm Rd", kind: "job", day: 0, startMinute: 540, endMinute: 630,
    customerName: "Priya Shah", customerPhone: "07700 900123", address: "14 Elm Road, Bristol BS1 4DJ",
    serviceName: "Boiler service", jobId: "JOB-1042", slaRisk: "low" }),
  ev({ id: "e1t", title: "Travel", kind: "travel", day: 0, startMinute: 630, endMinute: 665, travelMinutes: 35 }),
  ev({ id: "e2", title: "Radiator leak — 9 Oak Ave", kind: "job", day: 0, startMinute: 665, endMinute: 785,
    customerName: "Tom Becker", customerPhone: "07700 900456", address: "9 Oak Avenue, Bristol BS2 8PL",
    serviceName: "Emergency plumbing", jobId: "JOB-1043", emergency: true, slaRisk: "high", status: "at_risk" }),
  ev({ id: "e3", title: "Smart thermostat fit", kind: "job", day: 1, startMinute: 600, endMinute: 690,
    customerName: "Aisha Khan", address: "22 Maple St, Bath BA1 2QR", serviceName: "Thermostat install", jobId: "JOB-1051" }),
  ev({ id: "e4", title: "Site survey — new build", kind: "visit", day: 1, startMinute: 840, endMinute: 930,
    customerName: "Harborfield Lettings", address: "Plot 7, Quayside, Bristol", serviceName: "Survey", jobId: "JOB-1055" }),
  ev({ id: "e5", title: "Blocked — admin / quotes", kind: "blocked", day: 2, startMinute: 480, endMinute: 600 }),
  ev({ id: "e6", title: "Gas safety cert ×3", kind: "job", day: 2, startMinute: 600, endMinute: 780,
    customerName: "Crestwood PM", address: "Multiple — Clifton", serviceName: "Gas safety", jobId: "JOB-1060" }),
  ev({ id: "e7", title: "EV charger install", kind: "job", day: 3, startMinute: 540, endMinute: 720,
    customerName: "Daniel Roe", address: "3 Birch Close, Bristol", serviceName: "EV charger", jobId: "JOB-1066" }),
  ev({ id: "e8", title: "Out-of-hours callout", kind: "job", day: 3, startMinute: 1140, endMinute: 1230,
    customerName: "Nightline PM", address: "Central, Bristol", serviceName: "Emergency", jobId: "JOB-1069",
    emergency: true, outOfHours: true, slaRisk: "med" }),
  ev({ id: "e9", title: "Boiler repair", kind: "job", day: 4, startMinute: 600, endMinute: 720,
    customerName: "Grace Owusu", address: "41 Pine Walk, Bristol", serviceName: "Boiler repair", jobId: "JOB-1072" }),
  // a deliberate conflict on Friday afternoon
  ev({ id: "e10", title: "Underfloor heating", kind: "job", day: 4, startMinute: 780, endMinute: 900,
    customerName: "Lena Park", address: "8 Cedar Ln, Bristol", serviceName: "UFH", jobId: "JOB-1075", conflict: true }),
  ev({ id: "e11", title: "Quote visit (overlap)", kind: "visit", day: 4, startMinute: 810, endMinute: 870,
    customerName: "M. Idris", address: "12 Cedar Ln, Bristol", serviceName: "Quote", jobId: "JOB-1076", conflict: true }),
]

export const SEED_CALENDAR: CalendarData = {
  events: EVENTS,
  weekStartIso: weekStart().toISOString(),
  kpis: {
    jobsThisWeek: EVENTS.filter((e) => e.kind === "job").length,
    freeSlots: 9,
    conflicts: EVENTS.filter((e) => e.conflict).length,
    siteVisits: EVENTS.filter((e) => e.kind === "visit").length,
    outOfHoursJobs: EVENTS.filter((e) => e.outOfHours && e.kind === "job").length,
  },
}

export const SEED_AVAILABILITY: AvailabilityData = {
  bands: [
    { key: "early", label: "Early (06–08)", startMinute: 360, endMinute: 480 },
    { key: "core", label: "Core (08–17)", startMinute: 480, endMinute: 1020 },
    { key: "evening", label: "Evening (17–21)", startMinute: 1020, endMinute: 1260 },
    { key: "night", label: "Night (21–06)", startMinute: 1260, endMinute: 1800 },
  ],
  cells: (() => {
    const out: AvailabilityData["cells"] = []
    for (let day = 0; day < 7; day++) {
      const weekend = day >= 5
      out.push({ day, band: "early", state: weekend ? "unavailable" : "emergency_only" })
      out.push({ day, band: "core", state: weekend ? (day === 5 ? "emergency_only" : "unavailable") : "available" })
      out.push({ day, band: "evening", state: weekend ? "unavailable" : "emergency_only" })
      out.push({ day, band: "night", state: "emergency_only" })
    }
    return out
  })(),
  daySummaries: [
    { day: 0, bookableHours: 9, capacityUsed: 3, capacityMax: 5 },
    { day: 1, bookableHours: 9, capacityUsed: 2, capacityMax: 5 },
    { day: 2, bookableHours: 9, capacityUsed: 2, capacityMax: 5 },
    { day: 3, bookableHours: 9, capacityUsed: 2, capacityMax: 5 },
    { day: 4, bookableHours: 9, capacityUsed: 3, capacityMax: 5 },
    { day: 5, bookableHours: 0, capacityUsed: 0, capacityMax: 2 },
    { day: 6, bookableHours: 0, capacityUsed: 0, capacityMax: 0 },
  ],
  rules: {
    recurringHoursLabel: "Mon–Fri 08:00–17:00",
    emergency247: true,
    responseWindowHours: 2,
    leadTimeHours: 4,
    maxJobsPerDay: 5,
    travelBufferMinutes: 30,
  },
  serviceAvailability: [
    { serviceId: "s1", name: "Boiler service", state: "available" },
    { serviceId: "s2", name: "Emergency plumbing", state: "available", note: "24/7" },
    { serviceId: "s3", name: "EV charger install", state: "available" },
    { serviceId: "s4", name: "Gas safety cert", state: "emergency_only", note: "Core hours only" },
  ],
  instantBookEligible: true,
  weeklyBookableHours: 45,
  kpis: {
    availableDays: 5,
    bookableHours: 45,
    emergencyEnabled: true,
    avgResponse: "1h 48m",
    nextUnavailable: "Sat 21 Jun",
  },
}

/* ── Honest EMPTY fallbacks ──────────────────────────────────────────────────
   Served when the workspace has no live schedule rows. The calendar and time-off
   surfaces show nothing fabricated; availability keeps a neutral default
   hour-band grid + recurring-hours rules (a starting template the supplier
   edits, not fabricated bookings) but with no fake services / response times. */

export const EMPTY_CALENDAR: CalendarData = {
  events: [],
  weekStartIso: weekStart().toISOString(),
  kpis: { jobsThisWeek: 0, freeSlots: 0, conflicts: 0, siteVisits: 0, outOfHoursJobs: 0 },
}

export const EMPTY_AVAILABILITY: AvailabilityData = {
  bands: SEED_AVAILABILITY.bands,
  cells: SEED_AVAILABILITY.cells,
  daySummaries: SEED_AVAILABILITY.daySummaries.map((d) => ({ ...d, capacityUsed: 0 })),
  rules: SEED_AVAILABILITY.rules,
  serviceAvailability: [],
  instantBookEligible: SEED_AVAILABILITY.instantBookEligible,
  weeklyBookableHours: SEED_AVAILABILITY.weeklyBookableHours,
  kpis: {
    availableDays: SEED_AVAILABILITY.kpis.availableDays,
    bookableHours: SEED_AVAILABILITY.kpis.bookableHours,
    emergencyEnabled: SEED_AVAILABILITY.kpis.emergencyEnabled,
    avgResponse: "—",
    nextUnavailable: "—",
  },
}

export const EMPTY_TIME_OFF: TimeOffData = {
  blocks: [],
  affectedJobs: [],
  affectedRequests: [],
  settings: { autoDecline: true, notifyCustomers: true },
  recurringRules: [],
  reasonCounts: [],
  kpis: { timeOffBooked: 0, upcomingBlockedDays: 0, affectedJobs: 0, availableThisMonth: 0 },
}

function isoDay(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

export const SEED_TIME_OFF: TimeOffData = {
  blocks: [
    { id: "t1", reason: "annual_leave", title: "Summer holiday", note: "Family trip", starts_at: isoDay(12), ends_at: isoDay(19), allDay: true, recurring: false, autoDecline: true, notifyCustomers: true, affectedJobs: 2 },
    { id: "t2", reason: "training", title: "Gas Safe refresher", starts_at: isoDay(5), ends_at: isoDay(5), allDay: true, recurring: false, autoDecline: true, notifyCustomers: false, affectedJobs: 1 },
    { id: "t3", reason: "pm_off", title: "PM off — school run", starts_at: isoDay(2), ends_at: isoDay(2), allDay: false, recurring: true, autoDecline: false, notifyCustomers: false, affectedJobs: 0 },
    { id: "t4", reason: "personal", title: "Dentist", starts_at: isoDay(8), ends_at: isoDay(8), allDay: false, recurring: false, autoDecline: true, notifyCustomers: true, affectedJobs: 0 },
  ],
  affectedJobs: [
    { id: "aj1", jobTitle: "Boiler service — 14 Elm Rd", customerName: "Priya Shah", date: isoDay(13), action: "reschedule" },
    { id: "aj2", jobTitle: "Gas safety cert ×3", customerName: "Crestwood PM", date: isoDay(15), action: "conflict" },
  ],
  affectedRequests: [
    { id: "ar1", title: "Radiator install quote", customerName: "Tom Becker", date: isoDay(14) },
  ],
  settings: { autoDecline: true, notifyCustomers: true },
  recurringRules: [
    { id: "rr1", label: "Every Wed afternoon off", cadence: "Weekly · Wed PM" },
    { id: "rr2", label: "Bank holidays closed", cadence: "Yearly · UK bank holidays" },
  ],
  reasonCounts: [
    { reason: "annual_leave", label: "Annual leave", count: 14 },
    { reason: "pm_off", label: "PM off", count: 9 },
    { reason: "personal", label: "Personal", count: 4 },
    { reason: "training", label: "Training", count: 3 },
    { reason: "holiday", label: "Holiday", count: 8 },
  ],
  kpis: {
    timeOffBooked: 11,
    upcomingBlockedDays: 9,
    affectedJobs: 3,
    availableThisMonth: 18,
  },
}
