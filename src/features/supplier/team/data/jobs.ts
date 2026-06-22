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

/* Honest empty defaults — no live dispatch/evidence loader exists yet.
   supplier_jobs + supplier_job_assignments + supplier_job_evidence are not yet
   wired into the team dispatch board, so these render proper empty states
   rather than fabricated workers/jobs. */
export const DISPATCH_WORKERS: DispatchWorker[] = []

export const DISPATCH_UNASSIGNED: DispatchJob[] = []

/** Jobs already assigned to each worker (for the dispatch board worker columns). */
export const DISPATCH_ASSIGNED: Record<string, DispatchJob[]> = {}

export const EVIDENCE_JOBS: EvidenceJob[] = []
