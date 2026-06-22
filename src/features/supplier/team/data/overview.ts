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

/* Honest empty defaults — no live team-aggregate loader exists yet. The team
   surfaces render proper empty states until supplier_team_* aggregates are
   wired. KPI values are "—"/0 (not invented numbers, not fake names). */
export const TEAM_OVERVIEW_KPIS: TeamKpi[] = [
  { key: "utilisation", label: "Team utilisation", value: "—", tone: "blue" },
  { key: "open_requests", label: "Open requests", value: "0", tone: "slate" },
  { key: "awaiting_assignment", label: "Awaiting assignment", value: "0", tone: "amber" },
  { key: "active_jobs", label: "Active jobs", value: "0", tone: "blue" },
  { key: "sla_risk", label: "SLA risk", value: "0", tone: "red" },
  { key: "overdue_evidence", label: "Overdue evidence", value: "0", tone: "amber" },
  { key: "quote_approvals", label: "Quote approvals", value: "0", tone: "amber" },
  { key: "win_rate", label: "Quote win rate", value: "—", tone: "emerald" },
]

export const TEAM_WORKER_LOAD: WorkerLoad[] = []

export const TEAM_DISPATCH_QUEUE: DispatchQueueItem[] = []

export const TEAM_QUOTE_APPROVALS: QuoteApprovalItem[] = []

export const TEAM_REVENUE_BY_MEMBER: RevenueByMember[] = []

export const TEAM_COMPLIANCE_BLOCKERS: ComplianceBlocker[] = []

export const TEAM_RECENT_MESSAGES: TeamMessagePreview[] = []

export const TEAM_REVENUE_SNAPSHOT = { grossPence: 0, netPence: 0, currency: "GBP", changePct: 0 }

// ── Capacity & SLA risk (image 2) ────────────────────────────────────────────

export interface JobAtRisk {
  id: string
  ref: string
  title: string
  worker: string | null
  slaMins: number
  reason: string
}

export const TEAM_JOBS_AT_RISK: JobAtRisk[] = []

/** Hour-by-hour utilisation per worker for the capacity heatmap (0-100). */
export const TEAM_CAPACITY_HEATMAP: { worker: string; initials: string; hours: number[] }[] = []
