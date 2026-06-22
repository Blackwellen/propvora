/* ──────────────────────────────────────────────────────────────────────────
   Team Supplier — quote approval queue domain + 42P01-safe seed.

   Drives manifest image 5 (Quote Approval Queue). Reads from supplier_quotes +
   supplier_quote_approvals once wired; seed for now. Money is integer pence.
─────────────────────────────────────────────────────────────────────────── */

export interface ApprovalLineItem {
  description: string
  qtyUnit: string
  pricePence: number
}

export interface QuoteForApproval {
  id: string
  ref: string
  customer: string
  estimator: string
  estimatorInitials: string
  owner: string
  valuePence: number
  marginPct: number
  discountPct: number
  riskFlags: string[]
  customerDeadline: string
  revisionNote: string | null
  lineItems: ApprovalLineItem[]
}

function inDays(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString()
}

/* Honest empty default — no live quote-approval loader exists yet.
   supplier_quotes + supplier_quote_approvals are not yet wired, so the approval
   queue renders its "all caught up" empty state rather than fabricated quotes. */
export const QUOTES_FOR_APPROVAL: QuoteForApproval[] = []
