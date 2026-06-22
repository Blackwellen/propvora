/* ──────────────────────────────────────────────────────────────────────────
   Supplier payout detail + blocker domain types and 42P01-safe seed.

   Manifest images 52 (payout detail) & 53 (blocker resolution). Reads from
   supplier_payouts + supplier_payout_blockers once those relations exist; until
   then these seeds render the surface. Money is integer pence; dates are ISO.

   IMPORTANT (security): payout + payment-method data is private to the supplier
   owner. These shapes never expose bank/account numbers — only a masked label.
─────────────────────────────────────────────────────────────────────────── */

export type PayoutStatus = "awaiting" | "blocked" | "in_transit" | "paid" | "failed"
export type BlockerStatus = "open" | "resolved" | "in_review"

export interface PayoutJobLine {
  id: string
  ref: string
  title: string
  completedAt: string | null
  grossPence: number
  feePence: number
  netPence: number
  href: string
}

export interface EscrowCondition {
  id: string
  label: string
  met: boolean
}

export interface PayoutBlocker {
  id: string
  status: BlockerStatus
  /** What's needed: 'evidence' | 'sign_off' | 'invoice' | 'insurance' | 'terms' | 'kyc'. */
  kind: "evidence" | "sign_off" | "invoice" | "insurance" | "terms" | "kyc"
  title: string
  detail: string
  jobRef: string | null
  /** Resolution affordance: an upload, a link, or a confirm. */
  action: { type: "upload" | "link" | "confirm"; label: string; href?: string }
}

export interface PayoutDetail {
  id: string
  ref: string
  status: PayoutStatus
  workspaceName: string
  expectedAt: string | null
  grossPence: number
  feePence: number
  vatPence: number
  netPence: number
  currency: string
  destinationMasked: string
  jobs: PayoutJobLine[]
  escrowConditions: EscrowCondition[]
  blockers: PayoutBlocker[]
  audit: { id: string; label: string; at: string }[]
}

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString()
}

const SEED: Record<string, PayoutDetail> = {
  "PAY-2025-0058": {
    id: "PAY-2025-0058",
    ref: "PAY-2025-0058",
    status: "blocked",
    workspaceName: "Priya & Co Property Management",
    expectedAt: iso(-3),
    grossPence: 358000,
    feePence: 17900,
    vatPence: 0,
    netPence: 340100,
    currency: "GBP",
    destinationMasked: "Barclays •••• 4821",
    jobs: [
      { id: "j1", ref: "JOB-2025-0421", title: "Annual boiler service", completedAt: iso(5), grossPence: 16500, feePence: 825, netPence: 15675, href: "/supplier/jobs/JOB-2025-0421" },
      { id: "j2", ref: "JOB-2025-0418", title: "Communal lighting repair", completedAt: iso(6), grossPence: 84000, feePence: 4200, netPence: 79800, href: "/supplier/jobs/JOB-2025-0418" },
      { id: "j3", ref: "JOB-2025-0402", title: "Bathroom leak — emergency", completedAt: iso(8), grossPence: 257500, feePence: 12875, netPence: 244625, href: "/supplier/jobs/JOB-2025-0402" },
    ],
    escrowConditions: [
      { id: "c1", label: "Job marked complete by supplier", met: true },
      { id: "c2", label: "Completion evidence uploaded", met: false },
      { id: "c3", label: "Customer sign-off received", met: false },
      { id: "c4", label: "Invoice submitted & approved", met: true },
      { id: "c5", label: "Valid public liability insurance on file", met: false },
    ],
    blockers: [
      { id: "b1", status: "open", kind: "evidence", title: "Missing before photos", detail: "JOB-2025-0421 has no 'before' evidence. Upload at least one before photo to release escrow.", jobRef: "JOB-2025-0421", action: { type: "upload", label: "Upload photos", href: "/supplier/jobs/JOB-2025-0421/evidence" } },
      { id: "b2", status: "open", kind: "sign_off", title: "Customer sign-off pending", detail: "JOB-2025-0418 is awaiting customer confirmation that the work is complete.", jobRef: "JOB-2025-0418", action: { type: "link", label: "Request sign-off", href: "/supplier/jobs/JOB-2025-0418/sign-off" } },
      { id: "b3", status: "open", kind: "insurance", title: "Insurance certificate expired", detail: "Your public liability certificate expired. Renew it to keep receiving payouts.", jobRef: null, action: { type: "link", label: "Renew insurance", href: "/supplier/insurance/renew?step=policy" } },
      { id: "b4", status: "resolved", kind: "invoice", title: "Invoice approved", detail: "INV-2025-0042 was approved by the operator.", jobRef: "JOB-2025-0402", action: { type: "link", label: "View invoice", href: "/supplier/finance/invoices/INV-2025-0042" } },
    ],
    audit: [
      { id: "a1", label: "Payout scheduled", at: iso(4) },
      { id: "a2", label: "Escrow check failed — 3 blockers raised", at: iso(3) },
      { id: "a3", label: "Invoice INV-2025-0042 approved", at: iso(2) },
    ],
  },
}

/** Honest empty payout — shown for an unknown id instead of cloning a fake one. */
function emptyPayoutDetail(payoutId: string): PayoutDetail {
  return {
    id: payoutId,
    ref: payoutId,
    status: "awaiting",
    workspaceName: "—",
    expectedAt: null,
    grossPence: 0,
    feePence: 0,
    vatPence: 0,
    netPence: 0,
    currency: "GBP",
    destinationMasked: "—",
    jobs: [],
    escrowConditions: [],
    blockers: [],
    audit: [],
  }
}

export function getSeedPayoutDetail(payoutId: string): PayoutDetail {
  // Real payout records render when present; an unknown id degrades to an honest
  // empty payout (zeros + no lines), never a fabricated one.
  return SEED[payoutId] ?? emptyPayoutDetail(payoutId)
}
