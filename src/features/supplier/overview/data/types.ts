/* ──────────────────────────────────────────────────────────────────────────
   Supplier Overview — domain types.

   These are the view-model shapes the five Overview tabs render. They are
   deliberately decoupled from the raw Supabase row shapes: the hooks map DB
   rows (or seed) into these. All money is INTEGER PENCE (formatPence).
─────────────────────────────────────────────────────────────────────────── */

export type OverviewTab =
  | "today"
  | "requests"
  | "jobs"
  | "earnings"
  | "compliance"

/** Where the rendered data came from — drives a tiny source pill. */
export type DataSource = "live" | "seed"

export interface OverviewState<T> {
  data: T | null
  loading: boolean
  error: boolean
  /** "live" once a Supabase read succeeds, otherwise "seed". */
  source: DataSource
  reload: () => void
}

/* ── Shared small shapes ─────────────────────────────────────────────────── */

export interface Money {
  pence: number
  currency: string
}

export interface TrustBreakdown {
  onTimePct: number
  responsePct: number
  qualityPct: number
  communicationPct: number
}

/* ── Today ───────────────────────────────────────────────────────────────── */

export interface AgendaItem {
  id: string
  time: string // "09:30"
  title: string
  subtitle: string
  kind: "job" | "visit" | "quote" | "admin" | "off"
  status: "upcoming" | "in_progress" | "done" | "overdue"
  href: string
}

export interface NextAppointment {
  id: string
  jobRef: string
  customer: string
  service: string
  address: string
  startsAt: string // ISO
  etaMinutes: number
  distanceMiles: number
  jobHref: string
  /** Optional property photo shown in the Today "Next appointment" hero. */
  photo?: string
  /** Appointment window length in minutes (e.g. 60). */
  durationMinutes?: number
  /** Short job state label rendered as a pill (e.g. "On site"). */
  stateLabel?: string
}

export interface PriorityAlert {
  id: string
  tone: "amber" | "red" | "blue" | "violet"
  title: string
  body: string
  ctaLabel: string
  href: string
}

export interface UnreadMessage {
  id: string
  from: string
  preview: string
  receivedAt: string // ISO
  href: string
}

export interface ComplianceAlert {
  id: string
  document: string // "Gas Safe", "RAMS"
  status: "expiring" | "expired" | "missing"
  detail: string
  expiresAt: string | null
  ctaLabel: string
  href: string
}

export interface TodayData {
  kpis: {
    newRequests: number
    jobsToday: number
    awaitingEvidence: number
    awaitingPayoutPence: number
    responseScorePct: number
  }
  agenda: AgendaItem[]
  nextAppointment: NextAppointment | null
  priorityAlerts: PriorityAlert[]
  quickActions: { id: string; label: string; href: string; icon: string }[]
  earnings: { todayPence: number; weekPence: number; currency: string }
  unread: UnreadMessage[]
  availability: { available: boolean; hours: string }
  payout: { thisWeekPence: number; nextPayoutPence: number; nextPayoutDate: string; currency: string }
  complianceAlerts: ComplianceAlert[]
  trust: { scorePct: number; breakdown: TrustBreakdown }
}

/* ── Open Requests ───────────────────────────────────────────────────────── */

export interface RequestRow {
  id: string
  property: string
  address: string
  service: string
  urgency: "low" | "normal" | "high" | "emergency"
  responseDueAt: string // ISO
  distanceMiles: number
  estValuePence: number
  currency: string
  winChancePct: number
  isNew: boolean
  // right-panel detail
  summary: string
  budgetMinPence: number
  budgetMaxPence: number
  preferredDate: string
  requiredDocuments: string[]
  requesterCompany: string
}

export interface RequestsData {
  kpis: {
    openRequests: number
    responseDueToday: number
    potentialValuePence: number
    avgWinChancePct: number
    questionsAwaiting: number
  }
  rows: RequestRow[]
}

/* ── Active Jobs ─────────────────────────────────────────────────────────── */

export interface JobRow {
  id: string
  jobRef: string
  title: string
  customer: string
  address: string
  appointmentAt: string // ISO
  slaDueAt: string // ISO
  evidenceProvided: number
  evidenceRequired: number
  invoiceStatus: "none" | "draft" | "sent" | "paid"
  priority: "low" | "normal" | "high"
  status: "scheduled" | "en_route" | "in_progress" | "awaiting_signoff" | "at_risk"
  // right-panel detail
  etaMinutes: number
  distanceMiles: number
  accessInstructions: string
  contactName: string
  contactPhone: string
  evidenceChecklist: { id: string; label: string; done: boolean }[]
}

export interface JobsData {
  kpis: {
    activeJobs: number
    dueToday: number
    atRisk: number
    evidenceMissing: number
    escrowWaitingPence: number
  }
  rows: JobRow[]
  earningsByService: { label: string; value: number; color?: string }[]
  recentInvoices: InvoiceRow[]
  complianceStatus: { document: string; state: "verified" | "expiring" | "missing" }[]
}

/* ── Earnings ────────────────────────────────────────────────────────────── */

export interface InvoiceRow {
  id: string
  number: string
  customer: string
  service: string
  status: "draft" | "sent" | "paid" | "overdue" | "void"
  amountPence: number
  currency: string
  issuedAt: string | null
  dueAt: string | null
}

export interface PayoutTimelineItem {
  id: string
  label: string
  amountPence: number
  currency: string
  state: "awaiting" | "scheduled" | "paid"
  date: string
}

export interface BlockedPayout {
  id: string
  customer: string
  service: string
  amountPence: number
  currency: string
  reason: string
  evidenceProvided: number
  evidenceRequired: number
  jobHref: string
}

export interface EarningsData {
  kpis: {
    thisMonthPence: number
    inEscrowPence: number
    awaitingPayoutPence: number
    paidOutPence: number
    unpaidInvoicesPence: number
  }
  currency: string
  trendMonthly: { label: string; value: number }[]
  trendDaily: { label: string; value: number }[]
  payoutTimeline: PayoutTimelineItem[]
  invoices: InvoiceRow[]
  revenueByService: { name: string; value: number; color: string }[]
  blockedPayouts: BlockedPayout[]
  availableBalancePence: number
  financeHealthPct: number
}

/* ── Compliance Alerts ───────────────────────────────────────────────────── */

export type DocState = "verified" | "expiring" | "missing" | "not_required"

export interface RequiredDoc {
  id: string
  name: string
  state: DocState
  detail: string
  expiresAt: string | null
  ctaLabel: string
  href: string
}

export interface ExpiryItem {
  id: string
  document: string
  expiresAt: string // ISO
  daysLeft: number
}

export interface ServiceImpact {
  id: string
  service: string
  state: "active" | "at_risk" | "blocked"
  reason: string
  ctaLabel: string
  href: string
}

export interface ComplianceData {
  kpis: {
    trustScorePct: number
    documentsVerified: number
    documentsTotal: number
    expiringSoon: number
    servicesBlocked: number
    profileVisible: boolean
  }
  alerts: ComplianceAlert[]
  requiredDocs: RequiredDoc[]
  expiryTimeline: ExpiryItem[]
  serviceImpact: ServiceImpact[]
  availability: { available: boolean; hours: string }
  payout: { thisWeekPence: number; nextPayoutPence: number; nextPayoutDate: string; currency: string }
  trust: { scorePct: number; breakdown: TrustBreakdown }
}
