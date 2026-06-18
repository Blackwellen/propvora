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

const SEED: Record<string, JobCompletion> = {
  "JOB-2025-0421": {
    id: "JOB-2025-0421",
    ref: "JOB-2025-0421",
    title: "Annual boiler service",
    customer: "Priya Nair",
    workspace: "Priya & Co Property Management",
    valuePence: 16500,
    qualityScore: 86,
    escrowStatus: "held",
    evidence: [
      { id: "e1", phase: "before", label: "Boiler — before", required: true, fileName: null },
      { id: "e2", phase: "before", label: "Gas meter reading", required: true, fileName: "meter.jpg" },
      { id: "e3", phase: "during", label: "Work in progress", required: false, fileName: "during-1.jpg" },
      { id: "e4", phase: "after", label: "Boiler — after", required: true, fileName: "after-1.jpg" },
      { id: "e5", phase: "after", label: "Completed safety check", required: true, fileName: "after-2.jpg" },
    ],
    checklist: [
      { id: "c1", label: "Work completed to agreed scope", done: true },
      { id: "c2", label: "Site left clean and safe", done: true },
      { id: "c3", label: "Before & after photos captured", done: false },
      { id: "c4", label: "Materials & parts logged", done: true },
      { id: "c5", label: "Customer walkthrough completed", done: false },
    ],
    warranty: { months: 12, note: "Parts and labour on the serviced boiler." },
    recommendations: ["Replace pressure relief valve within 6 months", "Annual service recommended to maintain warranty"],
  },
}

export function getSeedJobCompletion(jobId: string): JobCompletion {
  return SEED[jobId] ?? { ...SEED["JOB-2025-0421"], id: jobId, ref: jobId }
}
