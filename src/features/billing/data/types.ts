// Types for the Workspace › Billing section. Money is INTEGER PENCE everywhere.

export type BillingCycle = "monthly" | "annual"

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "paused"

// Canonical plan tiers — MUST match src/lib/billing/plans.ts PlanTier and the
// keys in catalog.generated.json so the in-app checkout shows the SAME price it
// charges (no marketing/checkout drift) and selecting a plan maps to a real
// Stripe price + entitlement. Do not reintroduce marketing-only aliases here.
export type PlanCode = "starter" | "operator" | "scale" | "pro_agency" | "enterprise"

export interface BillingPlan {
  id: string
  code: PlanCode
  name: string
  monthlyPence: number
  /** Per-year price when billed annually. */
  annualPence: number
  currency: string
  features: string[]
  isPopular: boolean
  sortOrder: number
}

export type AddonCode =
  | "extra_listings"
  | "premium_support"
  | "ai_pack"
  | "automation_pack"
  | "marketplace_boost"
  | "white_label"
  | "extra_storage"
  | "extra_seats"

export type AddonUnit = "flat" | "per_property" | "per_seat" | "per_gb" | "credit_pack"

export interface AddonCatalogItem {
  code: AddonCode
  name: string
  description: string
  unitPricePence: number
  unit: AddonUnit
  /** Default quantity when toggled on. */
  defaultQty: number
  /** Whether the add-on exposes a quantity stepper / credit selector. */
  hasQuantity: boolean
  /** For credit packs (AI usage) — the selectable pack sizes. */
  creditPacks?: Array<{ label: string; credits: number; pricePence: number }>
  /** Set false to render as "requires configuration" and disable. */
  available: boolean
  minPlan: PlanCode
  releaseStage: "V1" | "V1.5" | "V2"
  requiredFlag?: "canvasLite" | "marketplaceEnabled"
}

const PLAN_RANK: Record<PlanCode, number> = { starter: 1, operator: 2, scale: 3, pro_agency: 4, enterprise: 5 }
const RELEASE_RANK = { V1: 1, "V1.5": 2, V2: 3 } as const

export function addonAvailableForPlan(item: AddonCatalogItem, plan: PlanCode, release: "V1" | "V1.5" | "V2" = "V1.5", flags?: Partial<Record<"canvasLite" | "marketplaceEnabled", boolean>>) {
  const flagAllowed = !item.requiredFlag || flags?.[item.requiredFlag] === true
  return item.available && flagAllowed && PLAN_RANK[plan] >= PLAN_RANK[item.minPlan] && RELEASE_RANK[item.releaseStage] <= RELEASE_RANK[release]
}

export interface SubscriptionAddon {
  code: AddonCode
  enabled: boolean
  quantity: number
}

export interface BillingProfile {
  billingName: string
  billingEmail: string
  vatNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  postcode: string
  country: string
  /** Basis points; 2000 = 20% VAT. */
  taxRateBps: number
}

export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
  health: "healthy" | "expiring" | "expired" | "failed"
}

export interface Subscription {
  id: string
  planCode: PlanCode
  billingCycle: BillingCycle
  status: SubscriptionStatus
  autoRenew: boolean
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  basePricePence: number
  currency: string
}

export type BillingDocType =
  | "invoice"
  | "receipt"
  | "payment_attempt"
  | "refund"
  | "credit"
  | "tax_invoice"

export interface BillingHistoryRow {
  id: string
  docType: BillingDocType
  reference: string
  description: string
  amountPence: number
  taxPence: number
  currency: string
  status: "paid" | "due" | "failed" | "refunded" | "credited"
  periodLabel: string
  issuedAt: string
  documentPath: string | null
}

export type SubscriptionEventType =
  | "plan_change"
  | "addon_change"
  | "renewal"
  | "payment"
  | "cancellation"
  | "reactivation"

export interface SubscriptionEvent {
  id: string
  eventType: SubscriptionEventType
  summary: string
  actor: string
  occurredAt: string
}

export interface CancellationRequest {
  id: string
  reason: string
  detail: string
  effectiveAt: string | null
  accessUntil: string | null
  dataRetentionDays: number
  retentionOfferClaimed: boolean
  status: "scheduled" | "withdrawn" | "completed" | "paused"
}

export interface RenewalEvent {
  id: string
  kind: "renewal" | "reminder" | "estimate"
  title: string
  detail: string
  amountPence: number | null
  dueAt: string | null
  status: "upcoming" | "sent" | "completed" | "failed"
}

export interface HookState<T> {
  data: T
  loading: boolean
  error: string | null
  source: "live" | "seed"
  reload: () => void
}
