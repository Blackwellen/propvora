/**
 * P5+ — PRECISE PAYMENT MODEL.
 *
 * The escrow substrate now carries a typed `payment_model` + `flow` (migration
 * 20260617070000). This module is the single source of truth for what each model
 * means and which webhook-driven state transitions are legal for it. It is PURE
 * policy — no IO, no Stripe — so it can be unit-tested and reused by the webhook
 * dispatcher, the release-block evaluator, and the money UI.
 *
 * The five payment models map onto real Stripe primitives:
 *   - authorisation       — PaymentIntent capture_method='manual', NOT captured
 *                           yet (auth-only hold on the card). Capture later.
 *   - delayed_capture     — authorised then captured within the auth window;
 *                           funds on the platform balance, released on a Transfer.
 *   - platform_hold       — captured immediately, held in escrow on the platform
 *                           balance, released to the seller by a separate Transfer
 *                           (the default marketplace/booking escrow flow).
 *   - connected_transfer  — direct/destination charge: split happens at
 *                           settlement via transfer_data + application_fee_amount.
 *   - manual_invoice      — off-Stripe / bank-transfer invoice; money state is
 *                           advanced by an operator action, NOT a card event.
 *
 * Money is integer pence everywhere.
 */

export type PaymentModel =
  | "authorisation"
  | "delayed_capture"
  | "platform_hold"
  | "connected_transfer"
  | "manual_invoice"

export type PaymentFlow =
  | "stay_booking"
  | "supplier_job"
  | "emergency_job"
  | "service_package"
  | "deposit"
  | "damage_hold"

/** Mirrors the escrow_payments status CHECK. */
export type PaymentStatusName =
  | "requires_payment"
  | "authorized"
  | "captured"
  | "released"
  | "refunded"
  | "partially_refunded"
  | "failed"
  | "cancelled"

export const PAYMENT_MODELS: PaymentModel[] = [
  "authorisation",
  "delayed_capture",
  "platform_hold",
  "connected_transfer",
  "manual_invoice",
]

export const PAYMENT_FLOWS: PaymentFlow[] = [
  "stay_booking",
  "supplier_job",
  "emergency_job",
  "service_package",
  "deposit",
  "damage_hold",
]

export const PAYMENT_MODEL_LABELS: Record<PaymentModel, string> = {
  authorisation: "Authorisation (auth-only hold)",
  delayed_capture: "Delayed capture",
  platform_hold: "Platform hold (escrow)",
  connected_transfer: "Connected transfer (direct split)",
  manual_invoice: "Manual invoice (off-Stripe)",
}

export const PAYMENT_FLOW_LABELS: Record<PaymentFlow, string> = {
  stay_booking: "Stay booking",
  supplier_job: "Supplier job",
  emergency_job: "Emergency job",
  service_package: "Service package",
  deposit: "Deposit",
  damage_hold: "Damage hold",
}

/**
 * The default payment model for a flow. Stay + supplier + emergency jobs use
 * escrow (platform_hold) so funds are protected until evidence/checkout; a
 * service package may be captured immediately (connected_transfer) when no
 * fulfilment risk exists; deposits/damage holds are authorisation-only.
 */
export function defaultModelForFlow(flow: PaymentFlow): PaymentModel {
  switch (flow) {
    case "stay_booking":
    case "supplier_job":
    case "emergency_job":
      return "platform_hold"
    case "service_package":
      return "connected_transfer"
    case "deposit":
    case "damage_hold":
      return "authorisation"
    default:
      return "platform_hold"
  }
}

/** Whether a model requires escrow holding on the platform balance. */
export function modelUsesEscrow(model: PaymentModel): boolean {
  return model === "platform_hold" || model === "delayed_capture" || model === "authorisation"
}

/**
 * The legal NEXT statuses for a payment in `status` under `model`. Used to
 * validate any state change (whether webhook- or operator-driven) before it is
 * applied. An empty set means a terminal state.
 *
 * NOTE: this encodes policy only; the webhook dispatcher additionally guards
 * each UPDATE with a conditional `.in("status", …)` so a replay cannot regress.
 */
export function legalNextStatuses(
  model: PaymentModel,
  status: PaymentStatusName
): PaymentStatusName[] {
  // Common terminal/failure edges available from any live state.
  const failEdges: PaymentStatusName[] = ["failed", "cancelled"]

  switch (status) {
    case "requires_payment":
      switch (model) {
        case "authorisation":
          return ["authorized", ...failEdges]
        case "delayed_capture":
          return ["authorized", "captured", ...failEdges]
        case "platform_hold":
        case "connected_transfer":
          return ["captured", ...failEdges]
        case "manual_invoice":
          return ["captured", ...failEdges]
      }
      return failEdges
    case "authorized":
      // An authorised hold can be captured or voided.
      return ["captured", ...failEdges]
    case "captured":
      // Captured funds can be released (escrow→transfer) or refunded.
      return ["released", "refunded", "partially_refunded"]
    case "released":
      // Released funds can still be (partially) refunded if a dispute settles.
      return ["refunded", "partially_refunded"]
    case "partially_refunded":
      return ["refunded"]
    case "refunded":
    case "failed":
    case "cancelled":
      return []
  }
}

/** PURE: is a status transition legal for this model? */
export function canTransition(
  model: PaymentModel,
  from: PaymentStatusName,
  to: PaymentStatusName
): boolean {
  return legalNextStatuses(model, from).includes(to)
}

/**
 * Money-bearing states: funds have actually been taken (captured/released or
 * partially refunded). Used by reconciliation + release gating.
 */
export function isMoneyBearing(status: PaymentStatusName): boolean {
  return (
    status === "captured" ||
    status === "released" ||
    status === "partially_refunded"
  )
}
