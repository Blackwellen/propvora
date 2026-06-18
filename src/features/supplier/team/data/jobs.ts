/* ──────────────────────────────────────────────────────────────────────────
   Team Supplier — dispatch + evidence board domain types + 42P01-safe seed.

   Drives manifest images 8 (Dispatch Board) and 10 (Evidence + Awaiting
   Sign-off). Reads from supplier_jobs + supplier_job_assignments +
   supplier_job_evidence once wired; seed for now. Money is integer pence.
─────────────────────────────────────────────────────────────────────────── */

export type JobPriority = "standard" | "high" | "emergency"

export interface DispatchWorker {
  id: string
  name: string
  initials: string
  trade: string
  status: "available" | "on_job" | "off"
  jobsToday: number
  area: string
}

export interface DispatchJob {
  id: string
  ref: string
  title: string
  area: string
  priority: JobPriority
  slaMins: number
  trade: string
  travelMins: number | null
  assignedWorkerId: string | null
}

export interface EvidenceJob {
  id: string
  ref: string
  title: string
  worker: string
  workerInitials: string
  stage: "awaiting_evidence" | "awaiting_signoff"
  completenessPct: number
  beforeOk: boolean
  afterOk: boolean
  certOk: boolean
  payoutBlocked: boolean
  qualityScore: number | null
  customerReminded: boolean
}

export const DISPATCH_WORKERS: DispatchWorker[] = [
  { id: "w1", name: "Jake Foster", initials: "JF", trade: "Gas", status: "on_job", jobsToday: 5, area: "M14" },
  { id: "w2", name: "Mike Thompson", initials: "MT", trade: "Plumbing", status: "on_job", jobsToday: 4, area: "M20" },
  { id: "w3", name: "Emma Collins", initials: "EC", trade: "Electrical", status: "available", jobsToday: 3, area: "M3" },
  { id: "w4", name: "Sarah Ahmed", initials: "SA", trade: "Multi-trade", status: "available", jobsToday: 2, area: "M6" },
]

export const DISPATCH_UNASSIGNED: DispatchJob[] = [
  { id: "u1", ref: "JOB-2025-0461", title: "No heating — emergency", area: "M14", priority: "emergency", slaMins: 45, trade: "Gas", travelMins: 12, assignedWorkerId: null },
  { id: "u2", ref: "JOB-2025-0459", title: "Leaking stack pipe", area: "M20", priority: "high", slaMins: 180, trade: "Plumbing", travelMins: 20, assignedWorkerId: null },
  { id: "u3", ref: "JOB-2025-0458", title: "Consumer unit upgrade", area: "M3", priority: "standard", slaMins: 1440, trade: "Electrical", travelMins: 8, assignedWorkerId: null },
  { id: "u4", ref: "JOB-2025-0457", title: "Tap replacement", area: "M6", priority: "standard", slaMins: 720, trade: "Plumbing", travelMins: 15, assignedWorkerId: null },
]

/** Jobs already assigned to each worker (for the dispatch board worker columns). */
export const DISPATCH_ASSIGNED: Record<string, DispatchJob[]> = {
  w1: [
    { id: "a1", ref: "JOB-2025-0451", title: "Boiler service", area: "M14", priority: "standard", slaMins: 240, trade: "Gas", travelMins: null, assignedWorkerId: "w1" },
    { id: "a2", ref: "JOB-2025-0449", title: "Radiator bleed", area: "M14", priority: "standard", slaMins: 480, trade: "Gas", travelMins: null, assignedWorkerId: "w1" },
  ],
  w2: [
    { id: "a3", ref: "JOB-2025-0450", title: "Bathroom leak", area: "M20", priority: "high", slaMins: 120, trade: "Plumbing", travelMins: null, assignedWorkerId: "w2" },
  ],
  w3: [],
  w4: [],
}

export const EVIDENCE_JOBS: EvidenceJob[] = [
  { id: "e1", ref: "JOB-2025-0421", title: "Annual boiler service", worker: "Jake Foster", workerInitials: "JF", stage: "awaiting_evidence", completenessPct: 60, beforeOk: false, afterOk: true, certOk: true, payoutBlocked: true, qualityScore: 86, customerReminded: false },
  { id: "e2", ref: "JOB-2025-0418", title: "Communal lighting repair", worker: "Emma Collins", workerInitials: "EC", stage: "awaiting_signoff", completenessPct: 100, beforeOk: true, afterOk: true, certOk: true, payoutBlocked: false, qualityScore: 92, customerReminded: true },
  { id: "e3", ref: "JOB-2025-0402", title: "Bathroom leak — emergency", worker: "Mike Thompson", workerInitials: "MT", stage: "awaiting_evidence", completenessPct: 30, beforeOk: true, afterOk: false, certOk: false, payoutBlocked: true, qualityScore: null, customerReminded: false },
  { id: "e4", ref: "JOB-2025-0399", title: "EICR inspection", worker: "Emma Collins", workerInitials: "EC", stage: "awaiting_signoff", completenessPct: 100, beforeOk: true, afterOk: true, certOk: true, payoutBlocked: false, qualityScore: 88, customerReminded: false },
]
