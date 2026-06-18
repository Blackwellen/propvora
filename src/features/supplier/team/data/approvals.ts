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

export const QUOTES_FOR_APPROVAL: QuoteForApproval[] = [
  {
    id: "QUO-2025-0456", ref: "QUO-2025-0456", customer: "Priya & Co Property Management",
    estimator: "Mike Thompson", estimatorInitials: "MT", owner: "Alex Morgan",
    valuePence: 480000, marginPct: 47, discountPct: 0, riskFlags: [],
    customerDeadline: inDays(2), revisionNote: null,
    lineItems: [
      { description: "Boiler supply & fit (Worcester 30i)", qtyUnit: "1", pricePence: 320000 },
      { description: "Labour (2 engineers, 1 day)", qtyUnit: "1", pricePence: 120000 },
      { description: "Sundries & flush", qtyUnit: "1", pricePence: 40000 },
    ],
  },
  {
    id: "QUO-2025-0451", ref: "QUO-2025-0451", customer: "Osei Lettings",
    estimator: "Emma Collins", estimatorInitials: "EC", owner: "Alex Morgan",
    valuePence: 126000, marginPct: 18, discountPct: 15, riskFlags: ["Low margin", "Discount over 10%"],
    customerDeadline: inDays(1), revisionNote: "Customer asked for a 15% discount on labour.",
    lineItems: [
      { description: "Communal LED fittings (x12)", qtyUnit: "12", pricePence: 84000 },
      { description: "Labour", qtyUnit: "1", pricePence: 42000 },
    ],
  },
  {
    id: "QUO-2025-0448", ref: "QUO-2025-0448", customer: "Northside Homes",
    estimator: "Sarah Ahmed", estimatorInitials: "SA", owner: "Alex Morgan",
    valuePence: 92000, marginPct: 32, discountPct: 5, riskFlags: [],
    customerDeadline: inDays(4), revisionNote: null,
    lineItems: [
      { description: "EICR inspection (3 units)", qtyUnit: "3", pricePence: 60000 },
      { description: "Minor remedials", qtyUnit: "1", pricePence: 32000 },
    ],
  },
]
