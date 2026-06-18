/* ──────────────────────────────────────────────────────────────────────────
   Team Supplier — overview / command-centre domain types + 42P01-safe seed.

   Drives manifest images 1 (Command Centre) and 2 (Capacity & SLA Risk). Reads
   from supplier_team_activity + supplier_jobs + supplier_quotes aggregates once
   wired; seed for now so the team surface renders. Money is integer pence.
─────────────────────────────────────────────────────────────────────────── */

export interface TeamKpi {
  key: string
  label: string
  value: string
  sub?: string
  tone?: "emerald" | "amber" | "red" | "blue" | "slate"
}

export interface WorkerLoad {
  id: string
  name: string
  role: string
  initials: string
  utilisationPct: number
  jobsToday: number
  status: "available" | "busy" | "overbooked" | "off"
  nextFreeAt: string | null
}

export interface DispatchQueueItem {
  id: string
  ref: string
  title: string
  area: string
  priority: "standard" | "high" | "emergency"
  slaMins: number
  suggestedWorker: string | null
}

export interface QuoteApprovalItem {
  id: string
  ref: string
  customer: string
  valuePence: number
  marginPct: number
  estimator: string
  riskFlag: boolean
}

export interface RevenueByMember {
  name: string
  initials: string
  revenuePence: number
  jobs: number
}

export interface ComplianceBlocker {
  id: string
  label: string
  worker: string | null
  severity: "warning" | "critical"
}

export interface TeamMessagePreview {
  id: string
  from: string
  preview: string
  at: string
  unread: boolean
}

export const TEAM_OVERVIEW_KPIS: TeamKpi[] = [
  { key: "utilisation", label: "Team utilisation", value: "78%", sub: "6 of 8 engineers", tone: "blue" },
  { key: "open_requests", label: "Open requests", value: "24", sub: "5 new today", tone: "slate" },
  { key: "awaiting_assignment", label: "Awaiting assignment", value: "8", sub: "2 emergency", tone: "amber" },
  { key: "active_jobs", label: "Active jobs", value: "32", sub: "on site now", tone: "blue" },
  { key: "sla_risk", label: "SLA risk", value: "3", sub: "breaching < 2h", tone: "red" },
  { key: "overdue_evidence", label: "Overdue evidence", value: "5", sub: "payout blocked", tone: "amber" },
  { key: "quote_approvals", label: "Quote approvals", value: "6", sub: "awaiting sign-off", tone: "amber" },
  { key: "win_rate", label: "Quote win rate", value: "38%", sub: "last 30 days", tone: "emerald" },
]

export const TEAM_WORKER_LOAD: WorkerLoad[] = [
  { id: "w1", name: "Jake Foster", role: "Gas engineer", initials: "JF", utilisationPct: 92, jobsToday: 5, status: "overbooked", nextFreeAt: null },
  { id: "w2", name: "Mike Thompson", role: "Plumber", initials: "MT", utilisationPct: 74, jobsToday: 4, status: "busy", nextFreeAt: "16:30" },
  { id: "w3", name: "Emma Collins", role: "Electrician", initials: "EC", utilisationPct: 61, jobsToday: 3, status: "busy", nextFreeAt: "15:00" },
  { id: "w4", name: "Sarah Ahmed", role: "Multi-trade", initials: "SA", utilisationPct: 40, jobsToday: 2, status: "available", nextFreeAt: "now" },
  { id: "w5", name: "John Parker", role: "Gas engineer", initials: "JP", utilisationPct: 0, jobsToday: 0, status: "off", nextFreeAt: "Tomorrow" },
]

export const TEAM_DISPATCH_QUEUE: DispatchQueueItem[] = [
  { id: "d1", ref: "JOB-2025-0461", title: "No heating — emergency", area: "M14", priority: "emergency", slaMins: 45, suggestedWorker: "Jake Foster" },
  { id: "d2", ref: "JOB-2025-0459", title: "Leaking stack pipe", area: "M20", priority: "high", slaMins: 180, suggestedWorker: "Mike Thompson" },
  { id: "d3", ref: "JOB-2025-0458", title: "Consumer unit upgrade", area: "M3", priority: "standard", slaMins: 1440, suggestedWorker: "Emma Collins" },
]

export const TEAM_QUOTE_APPROVALS: QuoteApprovalItem[] = [
  { id: "q1", ref: "QUO-2025-0456", customer: "Priya & Co PM", valuePence: 480000, marginPct: 47, estimator: "Mike Thompson", riskFlag: false },
  { id: "q2", ref: "QUO-2025-0451", customer: "Osei Lettings", valuePence: 126000, marginPct: 18, estimator: "Emma Collins", riskFlag: true },
  { id: "q3", ref: "QUO-2025-0448", customer: "Northside Homes", valuePence: 92000, marginPct: 32, estimator: "Sarah Ahmed", riskFlag: false },
]

export const TEAM_REVENUE_BY_MEMBER: RevenueByMember[] = [
  { name: "Jake Foster", initials: "JF", revenuePence: 4210000, jobs: 38 },
  { name: "Mike Thompson", initials: "MT", revenuePence: 3180000, jobs: 29 },
  { name: "Emma Collins", initials: "EC", revenuePence: 2740000, jobs: 24 },
  { name: "Sarah Ahmed", initials: "SA", revenuePence: 1810000, jobs: 17 },
]

export const TEAM_COMPLIANCE_BLOCKERS: ComplianceBlocker[] = [
  { id: "c1", label: "Public liability insurance expired", worker: null, severity: "critical" },
  { id: "c2", label: "Gas Safe expiring in 14 days", worker: "John Parker", severity: "warning" },
  { id: "c3", label: "DBS check missing", worker: "Sarah Ahmed", severity: "warning" },
]

export const TEAM_RECENT_MESSAGES: TeamMessagePreview[] = [
  { id: "m1", from: "Priya Nair", preview: "Access code is 4821, tenant in after 9am", at: "12m", unread: true },
  { id: "m2", from: "Daniel Osei", preview: "Can you confirm the warranty period?", at: "1h", unread: true },
  { id: "m3", from: "Jake Foster (team)", preview: "Running 20 min late to JOB-0461", at: "2h", unread: false },
]

export const TEAM_REVENUE_SNAPSHOT = { grossPence: 10942000, netPence: 9180000, currency: "GBP", changePct: 12 }

// ── Capacity & SLA risk (image 2) ────────────────────────────────────────────

export interface JobAtRisk {
  id: string
  ref: string
  title: string
  worker: string | null
  slaMins: number
  reason: string
}

export const TEAM_JOBS_AT_RISK: JobAtRisk[] = [
  { id: "r1", ref: "JOB-2025-0461", title: "No heating — emergency", worker: null, slaMins: 45, reason: "Unassigned" },
  { id: "r2", ref: "JOB-2025-0455", title: "Boiler service", worker: "Jake Foster", slaMins: 90, reason: "Worker overbooked" },
  { id: "r3", ref: "JOB-2025-0450", title: "Bathroom leak", worker: "Mike Thompson", slaMins: 120, reason: "Route conflict" },
  { id: "r4", ref: "JOB-2025-0447", title: "EICR inspection", worker: "Emma Collins", slaMins: -30, reason: "Evidence overdue" },
]

/** Hour-by-hour utilisation per worker for the capacity heatmap (0-100). */
export const TEAM_CAPACITY_HEATMAP: { worker: string; initials: string; hours: number[] }[] = [
  { worker: "Jake Foster", initials: "JF", hours: [60, 90, 100, 100, 80, 100, 70, 40] },
  { worker: "Mike Thompson", initials: "MT", hours: [40, 60, 80, 70, 90, 50, 30, 20] },
  { worker: "Emma Collins", initials: "EC", hours: [20, 40, 60, 80, 60, 40, 60, 30] },
  { worker: "Sarah Ahmed", initials: "SA", hours: [0, 20, 40, 30, 50, 40, 20, 0] },
]
