/* ──────────────────────────────────────────────────────────────────────────
   Verification status model — the SINGLE honesty layer.

   The UI never invents a verification state. Every label, tone and stepper
   position derives from the real status string returned by
   `/api/identity/status`. We normalise the many provider/lib spellings into a
   small, honest set of phases and pin copy to each one.

   Honesty rules baked in here:
   • "verified" is the ONLY state that claims success.
   • screening signals (sanctions/PEP) are described as "screening signals
     pending review" — never as determinations.
   • nothing here is legal advice; copy frames this as identity verification to
     enable selling / receiving payouts.
─────────────────────────────────────────────────────────────────────────── */

export type VerificationPhase =
  | "not_started"
  | "pending"
  | "processing"
  | "requires_input"
  | "verified"
  | "canceled"

export interface PhaseMeta {
  phase: VerificationPhase
  /** Short status label for badges. */
  label: string
  /** A reassuring one-line description of where the user is. */
  description: string
  /** Badge / accent tone keyword. */
  tone: "slate" | "blue" | "amber" | "emerald" | "red"
  /** Index in the canonical stepper (not_started=0 … verified=3). */
  stepIndex: number
}

/** Canonical 4-stage stepper the UI renders. */
export const STEPPER_STAGES = [
  { key: "start", label: "Start", hint: "Begin identity verification" },
  { key: "submit", label: "Submitted", hint: "Documents sent to our provider" },
  { key: "review", label: "Processing", hint: "Checks running" },
  { key: "verified", label: "Verified", hint: "You can sell & receive payouts" },
] as const

/** Map any raw status string onto an honest phase. Unknown → not_started. */
export function normalisePhase(raw: string | null | undefined): VerificationPhase {
  const s = (raw ?? "").toLowerCase().trim()
  if (!s) return "not_started"
  if (/(verified|approved|complete|passed|success)/.test(s)) return "verified"
  if (/(requires_input|requires_action|action_required|more_info|needs_input|input_required|resubmit|requires_resubmission)/.test(s))
    return "requires_input"
  if (/(processing|reviewing|in_review|under_review|checking)/.test(s)) return "processing"
  if (/(canceled|cancelled|expired|abandoned)/.test(s)) return "canceled"
  if (/(pending|submitted|started|created|awaiting|in_progress|progress)/.test(s)) return "pending"
  return "not_started"
}

export function phaseMeta(phase: VerificationPhase): PhaseMeta {
  switch (phase) {
    case "verified":
      return {
        phase,
        label: "Verified",
        description: "Identity verified. You can sell and receive payouts.",
        tone: "emerald",
        stepIndex: 3,
      }
    case "processing":
      return {
        phase,
        label: "Processing",
        description: "Your documents are with our verification provider. This usually completes within a few minutes.",
        tone: "blue",
        stepIndex: 2,
      }
    case "requires_input":
      return {
        phase,
        label: "Action needed",
        description: "The provider needs another photo or document to finish. Resume verification to continue.",
        tone: "amber",
        stepIndex: 1,
      }
    case "pending":
      return {
        phase,
        label: "Submitted",
        description: "Your verification has started. Continue to finish capturing your documents.",
        tone: "blue",
        stepIndex: 1,
      }
    case "canceled":
      return {
        phase,
        label: "Not complete",
        description: "Verification was cancelled or expired. You can start again at any time.",
        tone: "slate",
        stepIndex: 0,
      }
    case "not_started":
    default:
      return {
        phase,
        label: "Not started",
        description: "Verify your identity to unlock selling and payouts on Propvora.",
        tone: "slate",
        stepIndex: 0,
      }
  }
}

/** A screening/risk flag is ALWAYS a pending-review signal, never a verdict. */
export function screeningSignalLabel(flag: string): string {
  const pretty = flag.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return `${pretty} — screening signal, pending review`
}

export interface VerificationStatus {
  workspaceId?: string
  verificationId?: string | null
  status?: string
  provider?: string | null
  verified?: boolean
  checks?: Array<{ type?: string; status?: string; label?: string }>
  riskFlags?: string[]
  verifiedAt?: string | null
  submittedAt?: string | null
  expiresAt?: string | null
  updatedAt?: string | null
  documents?: Array<Record<string, unknown>>
  notReady?: boolean
}

export interface VerificationDocument {
  id?: string
  docType?: string
  document_type?: string
  name?: string
  file_name?: string
  status?: string
  created_at?: string
  key?: string
}
