/* ──────────────────────────────────────────────────────────────────────────
   Supplier Overview — RICH seed data.

   Every tab falls back to this so the Solo Overview always renders premium —
   even before the supplier has any live records, or when the finance tables
   aren't provisioned yet (42P01-safe). Money is INTEGER PENCE.

   Dates are computed relative to "now" so the agenda/timeline always look live.
─────────────────────────────────────────────────────────────────────────── */

import type {
  TodayData,
  RequestsData,
  JobsData,
  EarningsData,
  ComplianceData,
} from "./types"

const GBP = "GBP"

function at(hoursFromNow: number, minute = 0): string {
  const d = new Date()
  d.setHours(d.getHours() + hoursFromNow, minute, 0, 0)
  return d.toISOString()
}
function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
function dateInDays(days: number): string {
  return inDays(days).slice(0, 10)
}

export const seedToday: TodayData = {
  kpis: {
    newRequests: 8,
    jobsToday: 4,
    awaitingEvidence: 3,
    awaitingPayoutPence: 124_000,
    responseScorePct: 94,
  },
  agenda: [
    { id: "a1", time: "08:30", title: "Boiler service — 123 Maple Rd", subtitle: "Manchester M14 4QX · On site", kind: "job", status: "in_progress", href: "/supplier/jobs" },
    { id: "a2", time: "10:30", title: "Electrical inspection — 45 Victoria St", subtitle: "Manchester M2 5GP · Scheduled", kind: "job", status: "upcoming", href: "/supplier/jobs" },
    { id: "a3", time: "11:15", title: "Travel to next job", subtitle: "6.4 miles · ~28 min", kind: "off", status: "upcoming", href: "/supplier/schedule" },
    { id: "a4", time: "11:45", title: "Plumbing repair — 78 King St", subtitle: "Manchester M2 4NH · Scheduled", kind: "job", status: "upcoming", href: "/supplier/jobs" },
    { id: "a5", time: "13:15", title: "Travel to next job", subtitle: "4.1 miles · ~18 min", kind: "off", status: "upcoming", href: "/supplier/schedule" },
    { id: "a6", time: "13:30", title: "Extractor fan replacement — 78 Park Ave", subtitle: "Manchester M3 1JP · Scheduled", kind: "job", status: "upcoming", href: "/supplier/jobs" },
  ],
  nextAppointment: {
    id: "next1",
    jobRef: "JOB-7421",
    customer: "BuildWell Estates",
    service: "Boiler service",
    address: "123 Maple Rd, Manchester M14 4QX",
    startsAt: at(0, 30),
    etaMinutes: 16,
    distanceMiles: 4.2,
    jobHref: "/supplier/jobs",
    photo: "/demo/properties/maple-court.jpg",
    durationMinutes: 60,
    stateLabel: "On site",
  },
  priorityAlerts: [
    { id: "p1", tone: "red", title: "Evidence missing on JOB-2041", body: "Sign-off blocked — 2 of 4 photos uploaded.", ctaLabel: "Upload evidence", href: "/supplier/jobs" },
    { id: "p2", tone: "amber", title: "Gas Safe expires in 21 days", body: "Renew to keep gas services visible.", ctaLabel: "Renew now", href: "/supplier/compliance" },
    { id: "p3", tone: "blue", title: "4 new requests in your area", body: "Average value £640 · respond to win.", ctaLabel: "View requests", href: "/supplier/requests" },
  ],
  quickActions: [
    { id: "q1", label: "Update availability", href: "/supplier/availability", icon: "calendar" },
    { id: "q2", label: "View requests", href: "/supplier/requests", icon: "inbox" },
    { id: "q3", label: "Add service", href: "/supplier/services", icon: "plus" },
    { id: "q4", label: "Upload compliance", href: "/supplier/compliance", icon: "shield" },
    { id: "q5", label: "Profile preview", href: "/supplier/profile", icon: "user" },
  ],
  earnings: { todayPence: 42_000, weekPence: 142_000, currency: GBP },
  unread: [
    { id: "m1", from: "Property Manager – Central Portfolio", preview: "New request: Fire door inspection at 22…", receivedAt: at(-1), href: "/supplier/messages" },
    { id: "m2", from: "BuildWell Estates", preview: "Job update: Kitchen tap replacement compl…", receivedAt: at(-26), href: "/supplier/messages" },
    { id: "m3", from: "Langford House", preview: "Thanks for completing the job", receivedAt: at(-50), href: "/supplier/messages" },
  ],
  availability: { available: true, hours: "07:00 – 18:00" },
  payout: { thisWeekPence: 124_000, nextPayoutPence: 86_000, nextPayoutDate: dateInDays(3), currency: GBP },
  complianceAlerts: [
    { id: "c1", document: "Gas Safe", status: "expiring", detail: "Registration 7211849", expiresAt: inDays(21), ctaLabel: "Renew", href: "/supplier/compliance" },
    { id: "c2", document: "RAMS", status: "missing", detail: "Required for Riverside job", expiresAt: null, ctaLabel: "Submit", href: "/supplier/compliance" },
  ],
  trust: {
    scorePct: 92,
    breakdown: { onTimePct: 96, responsePct: 94, qualityPct: 91, communicationPct: 89 },
  },
}

export const seedRequests: RequestsData = {
  kpis: {
    openRequests: 8,
    responseDueToday: 3,
    potentialValuePence: 375_000,
    avgWinChancePct: 68,
    questionsAwaiting: 5,
  },
  rows: [
    {
      id: "r1", property: "Riverside Apartments", address: "Riverside Quarter, Leeds LS1 4AP",
      service: "Communal heating upgrade", urgency: "high", responseDueAt: at(3),
      distanceMiles: 2.1, estValuePence: 124_000, currency: GBP, winChancePct: 74, isNew: true,
      summary: "Plant-room boiler cascade serving 24 flats is end-of-life and needs replacement before winter.",
      budgetMinPence: 90_000, budgetMaxPence: 150_000, preferredDate: dateInDays(9),
      requiredDocuments: ["Gas Safe", "Public liability", "RAMS"], requesterCompany: "Riverside Block Management",
    },
    {
      id: "r2", property: "14 Oakfield Road", address: "Headingley, Leeds LS6 3PG",
      service: "Boiler replacement", urgency: "normal", responseDueAt: at(28),
      distanceMiles: 3.6, estValuePence: 38_000, currency: GBP, winChancePct: 62, isNew: true,
      summary: "Combi boiler beyond economical repair. Landlord wants a like-for-like swap with a 10-year warranty.",
      budgetMinPence: 28_000, budgetMaxPence: 42_000, preferredDate: dateInDays(5),
      requiredDocuments: ["Gas Safe", "Public liability"], requesterCompany: "Headingley Lettings",
    },
    {
      id: "r3", property: "Flat 2, Mill Court", address: "Burley, Leeds LS6 2QT",
      service: "Emergency leak repair", urgency: "emergency", responseDueAt: at(2),
      distanceMiles: 4.2, estValuePence: 26_000, currency: GBP, winChancePct: 81, isNew: false,
      summary: "Active leak under the kitchen sink causing damp to the flat below. Needs same-day attendance.",
      budgetMinPence: 15_000, budgetMaxPence: 30_000, preferredDate: dateInDays(0),
      requiredDocuments: ["Public liability"], requesterCompany: "Mill Court Management",
    },
    {
      id: "r4", property: "7 Beech Close", address: "Roundhay, Leeds LS8 1NP",
      service: "EICR inspection", urgency: "normal", responseDueAt: at(40),
      distanceMiles: 5.8, estValuePence: 18_000, currency: GBP, winChancePct: 55, isNew: false,
      summary: "5-year landlord electrical safety certificate renewal across a 3-bed terrace.",
      budgetMinPence: 12_000, budgetMaxPence: 22_000, preferredDate: dateInDays(7),
      requiredDocuments: ["NICEIC / NAPIT", "Public liability"], requesterCompany: "Beech Close Lettings",
    },
  ],
}

export const seedJobs: JobsData = {
  kpis: {
    activeJobs: 5,
    dueToday: 2,
    atRisk: 1,
    evidenceMissing: 2,
    escrowWaitingPence: 88_000,
  },
  rows: [
    {
      id: "j1", jobRef: "JOB-2048", title: "Emergency leak assessment", customer: "Mill Court Management",
      address: "Flat 2, Mill Court, Leeds LS6 2QT", appointmentAt: at(1, 15), slaDueAt: at(4),
      evidenceProvided: 1, evidenceRequired: 3, invoiceStatus: "none", priority: "high", status: "en_route",
      etaMinutes: 18, distanceMiles: 4.2, accessInstructions: "Key safe by front door, code 4471. Tenant home from 10am.",
      contactName: "Dawn Phillips", contactPhone: "07700 900118",
      evidenceChecklist: [
        { id: "e1", label: "Before photo", done: true },
        { id: "e2", label: "Repair photo", done: false },
        { id: "e3", label: "Customer sign-off", done: false },
      ],
    },
    {
      id: "j2", jobRef: "JOB-2041", title: "Boiler annual service", customer: "Headingley Lettings",
      address: "14 Oakfield Rd, Leeds LS6 3PG", appointmentAt: at(-2), slaDueAt: at(-1),
      evidenceProvided: 2, evidenceRequired: 4, invoiceStatus: "draft", priority: "high", status: "at_risk",
      etaMinutes: 0, distanceMiles: 3.6, accessInstructions: "Tenant present. Park on driveway.",
      contactName: "Marcus Bell", contactPhone: "07700 900342",
      evidenceChecklist: [
        { id: "e1", label: "Service checklist", done: true },
        { id: "e2", label: "Flue gas reading", done: true },
        { id: "e3", label: "Gas Safe record", done: false },
        { id: "e4", label: "Customer sign-off", done: false },
      ],
    },
    {
      id: "j3", jobRef: "JOB-2052", title: "EICR inspection", customer: "Beech Close Lettings",
      address: "7 Beech Close, Leeds LS8 1NP", appointmentAt: at(7), slaDueAt: at(48),
      evidenceProvided: 0, evidenceRequired: 2, invoiceStatus: "none", priority: "normal", status: "scheduled",
      etaMinutes: 26, distanceMiles: 5.8, accessInstructions: "Collect key from agent office before 5pm.",
      contactName: "Priya Shah", contactPhone: "07700 900755",
      evidenceChecklist: [
        { id: "e1", label: "Test results", done: false },
        { id: "e2", label: "Signed certificate", done: false },
      ],
    },
    {
      id: "j4", jobRef: "JOB-2039", title: "Tap replacement", customer: "Roundhay Residential",
      address: "22 Park View, Leeds LS8 2AB", appointmentAt: at(-26), slaDueAt: at(-20),
      evidenceProvided: 3, evidenceRequired: 3, invoiceStatus: "sent", priority: "low", status: "awaiting_signoff",
      etaMinutes: 0, distanceMiles: 6.1, accessInstructions: "Completed — awaiting customer confirmation.",
      contactName: "Tom Reed", contactPhone: "07700 900908",
      evidenceChecklist: [
        { id: "e1", label: "Before photo", done: true },
        { id: "e2", label: "After photo", done: true },
        { id: "e3", label: "Invoice", done: true },
      ],
    },
    {
      id: "j5", jobRef: "JOB-2055", title: "Communal lighting fault", customer: "Riverside Block Management",
      address: "Riverside Quarter, Leeds LS1 4AP", appointmentAt: at(30), slaDueAt: at(72),
      evidenceProvided: 0, evidenceRequired: 2, invoiceStatus: "none", priority: "normal", status: "scheduled",
      etaMinutes: 9, distanceMiles: 2.1, accessInstructions: "Concierge will grant access to the riser cupboard.",
      contactName: "Sasha Owens", contactPhone: "07700 900471",
      evidenceChecklist: [
        { id: "e1", label: "Fault photo", done: false },
        { id: "e2", label: "Repair photo", done: false },
      ],
    },
  ],
  earningsByService: [
    { label: "Boiler", value: 124_000, color: "#2563EB" },
    { label: "Electrical", value: 86_000, color: "#7C3AED" },
    { label: "Plumbing", value: 62_000, color: "#059669" },
    { label: "Other", value: 28_000, color: "#F59E0B" },
  ],
  recentInvoices: [
    { id: "iv1", number: "INV-1042", customer: "Roundhay Residential", service: "Tap replacement", status: "sent", amountPence: 14_000, currency: GBP, issuedAt: dateInDays(-1), dueAt: dateInDays(13) },
    { id: "iv2", number: "INV-1039", customer: "Headingley Lettings", service: "Boiler service", status: "paid", amountPence: 9_000, currency: GBP, issuedAt: dateInDays(-8), dueAt: dateInDays(6) },
    { id: "iv3", number: "INV-1037", customer: "Mill Court Management", service: "Leak repair", status: "overdue", amountPence: 22_000, currency: GBP, issuedAt: dateInDays(-22), dueAt: dateInDays(-1) },
  ],
  complianceStatus: [
    { document: "Gas Safe", state: "expiring" },
    { document: "Public liability", state: "verified" },
    { document: "RAMS", state: "missing" },
  ],
}

export const seedEarnings: EarningsData = {
  kpis: {
    thisMonthPence: 423_500,
    inEscrowPence: 123_500,
    awaitingPayoutPence: 124_000,
    paidOutPence: 876_000,
    unpaidInvoicesPence: 62_000,
  },
  currency: GBP,
  trendMonthly: [
    { label: "Jan", value: 286_000 }, { label: "Feb", value: 312_000 },
    { label: "Mar", value: 298_000 }, { label: "Apr", value: 364_000 },
    { label: "May", value: 388_000 }, { label: "Jun", value: 412_500 },
  ],
  trendDaily: [
    { label: "Mon", value: 42_000 }, { label: "Tue", value: 58_000 },
    { label: "Wed", value: 36_000 }, { label: "Thu", value: 74_500 },
    { label: "Fri", value: 48_000 }, { label: "Sat", value: 28_000 },
    { label: "Sun", value: 0 },
  ],
  payoutTimeline: [
    { id: "pt1", label: "Awaiting release", amountPence: 168_000, currency: GBP, state: "awaiting", date: dateInDays(0) },
    { id: "pt2", label: "Scheduled payout", amountPence: 184_000, currency: GBP, state: "scheduled", date: dateInDays(3) },
    { id: "pt3", label: "Paid out", amountPence: 92_000, currency: GBP, state: "paid", date: dateInDays(-4) },
    { id: "pt4", label: "Paid out", amountPence: 146_000, currency: GBP, state: "paid", date: dateInDays(-11) },
  ],
  invoices: [
    { id: "iv1", number: "INV-1042", customer: "Roundhay Residential", service: "Tap replacement", status: "sent", amountPence: 14_000, currency: GBP, issuedAt: dateInDays(-1), dueAt: dateInDays(13) },
    { id: "iv2", number: "INV-1039", customer: "Headingley Lettings", service: "Boiler service", status: "paid", amountPence: 9_000, currency: GBP, issuedAt: dateInDays(-8), dueAt: dateInDays(6) },
    { id: "iv3", number: "INV-1037", customer: "Mill Court Management", service: "Leak repair", status: "overdue", amountPence: 22_000, currency: GBP, issuedAt: dateInDays(-22), dueAt: dateInDays(-1) },
    { id: "iv4", number: "INV-1044", customer: "Riverside Block Management", service: "Lighting fault", status: "draft", amountPence: 18_000, currency: GBP, issuedAt: null, dueAt: null },
  ],
  revenueByService: [
    { name: "Boiler service", value: 162_000, color: "#2563EB" },
    { name: "Electrical inspection", value: 121_000, color: "#7C3AED" },
    { name: "Plumbing repair", value: 76_000, color: "#059669" },
    { name: "Extractor fan replacement", value: 43_000, color: "#F59E0B" },
    { name: "Other services", value: 21_500, color: "#94A3B8" },
  ],
  blockedPayouts: [
    { id: "bp1", customer: "BuildWell Estates", service: "Boiler service", amountPence: 78_000, currency: GBP, reason: "Photos (after) missing", evidenceProvided: 2, evidenceRequired: 4, jobHref: "/supplier/jobs" },
    { id: "bp2", customer: "Langford House", service: "Electrical inspection", amountPence: 45_500, currency: GBP, reason: "Certificate missing", evidenceProvided: 1, evidenceRequired: 3, jobHref: "/supplier/jobs" },
  ],
  availableBalancePence: 124_000,
  financeHealthPct: 92,
}

export const seedCompliance: ComplianceData = {
  kpis: {
    trustScorePct: 92,
    documentsVerified: 14,
    documentsTotal: 16,
    expiringSoon: 3,
    servicesBlocked: 2,
    profileVisible: true,
  },
  alerts: [
    { id: "c1", document: "Gas Safe", status: "expiring", detail: "Registration 7211849 expires soon", expiresAt: inDays(21), ctaLabel: "Upload renewal", href: "/supplier/compliance" },
    { id: "c2", document: "RAMS", status: "missing", detail: "Required for communal heating jobs", expiresAt: null, ctaLabel: "Submit RAMS", href: "/supplier/compliance" },
  ],
  requiredDocs: [
    { id: "d1", name: "Public liability insurance", state: "verified", detail: "£5m cover · AXA", expiresAt: inDays(204), ctaLabel: "View", href: "/supplier/insurance" },
    { id: "d2", name: "Gas Safe registration", state: "expiring", detail: "Expires in 21 days", expiresAt: inDays(21), ctaLabel: "Renew", href: "/supplier/compliance" },
    { id: "d3", name: "NICEIC / NAPIT", state: "verified", detail: "Domestic installer", expiresAt: inDays(150), ctaLabel: "View", href: "/supplier/verification" },
    { id: "d4", name: "RAMS template", state: "missing", detail: "Not yet provided", expiresAt: null, ctaLabel: "Upload", href: "/supplier/compliance" },
    { id: "d5", name: "Employers liability", state: "not_required", detail: "Solo operator — not required", expiresAt: null, ctaLabel: "—", href: "/supplier/insurance" },
    { id: "d6", name: "DBS check", state: "verified", detail: "Enhanced · valid", expiresAt: inDays(320), ctaLabel: "View", href: "/supplier/verification" },
  ],
  expiryTimeline: [
    { id: "x1", document: "Gas Safe registration", expiresAt: inDays(21), daysLeft: 21 },
    { id: "x2", document: "NICEIC / NAPIT", expiresAt: inDays(150), daysLeft: 150 },
    { id: "x3", document: "Public liability", expiresAt: inDays(204), daysLeft: 204 },
  ],
  serviceImpact: [
    { id: "s1", service: "Boiler & heating", state: "at_risk", reason: "Gas Safe expires in 21 days", ctaLabel: "Renew", href: "/supplier/compliance" },
    { id: "s2", service: "Communal heating upgrade", state: "blocked", reason: "RAMS required", ctaLabel: "Upload RAMS", href: "/supplier/compliance" },
    { id: "s3", service: "Electrical / EICR", state: "active", reason: "All documents valid", ctaLabel: "View", href: "/supplier/verification" },
    { id: "s4", service: "Plumbing", state: "active", reason: "All documents valid", ctaLabel: "View", href: "/supplier/services" },
  ],
  availability: { available: true, hours: "08:00 – 18:00" },
  payout: { thisWeekPence: 286_500, nextPayoutPence: 184_000, nextPayoutDate: dateInDays(3), currency: GBP },
  trust: {
    scorePct: 92,
    breakdown: { onTimePct: 96, responsePct: 94, qualityPct: 91, communicationPct: 89 },
  },
}
