/* ──────────────────────────────────────────────────────────────────────────
   Job completion domain — evidence + sign-off (manifest images 46 & 47).

   Drives the dedicated /supplier/jobs/[id]/evidence and /sign-off pages. Reads
   from supplier_assignments + supplier_job_evidence once wired; seed for now.
   All uploads are upload-only; evidence files are private to the supplier until
   approved. Money is integer pence.
─────────────────────────────────────────────────────────────────────────── */

export type EvidencePhase = "before" | "during" | "after"

export interface EvidenceSlot {
  id: string
  phase: EvidencePhase
  label: string
  required: boolean
  /** Captured file name once uploaded (seed = some captured, some pending). */
  fileName: string | null
}

export interface CompletionChecklistItem {
  id: string
  label: string
  done: boolean
}

export interface JobCompletion {
  id: string
  ref: string
  title: string
  customer: string
  workspace: string
  valuePence: number
  qualityScore: number | null
  escrowStatus: "held" | "ready" | "released"
  evidence: EvidenceSlot[]
  checklist: CompletionChecklistItem[]
  warranty: { months: number; note: string } | null
  recommendations: string[]
}

/* ──────────────────────────────────────────────────────────────────────────
   Honest, NON-fabricated completion scaffold.

   The evidence/sign-off pages need a *structure* to render (the before/during/
   after photo slots and the completion checklist are a generic template, not
   data about a specific customer). So we provide an empty scaffold keyed to the
   real job id — no fabricated customer, workspace, money, quality score or
   recommendations. The live job completion read replaces this once wired.
─────────────────────────────────────────────────────────────────────────── */
function blankJobCompletion(jobId: string): JobCompletion {
  return {
    id: jobId,
    ref: jobId,
    title: "Job",
    customer: "—",
    workspace: "—",
    valuePence: 0,
    qualityScore: null,
    escrowStatus: "held",
    evidence: [
      { id: "e1", phase: "before", label: "Before photo", required: true, fileName: null },
      { id: "e2", phase: "before", label: "Site / meter reading", required: false, fileName: null },
      { id: "e3", phase: "during", label: "Work in progress", required: false, fileName: null },
      { id: "e4", phase: "after", label: "After photo", required: true, fileName: null },
      { id: "e5", phase: "after", label: "Completed safety check", required: false, fileName: null },
    ],
    checklist: [
      { id: "c1", label: "Work completed to agreed scope", done: false },
      { id: "c2", label: "Site left clean and safe", done: false },
      { id: "c3", label: "Before & after photos captured", done: false },
      { id: "c4", label: "Materials & parts logged", done: false },
      { id: "c5", label: "Customer walkthrough completed", done: false },
    ],
    warranty: null,
    recommendations: [],
  }
}

export function getSeedJobCompletion(jobId: string): JobCompletion {
  return blankJobCompletion(jobId)
}
