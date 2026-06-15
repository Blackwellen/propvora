/* ──────────────────────────────────────────────────────────────────────────
   Payment / payout / booking status vocabulary + honest copy mapping.

   Single source of truth for how a raw Stripe/record status becomes (a) a pill
   tone and label, and (b) the HONEST guest-facing copy. Money is integer pence;
   formatting happens at the UI edge via formatPence().
─────────────────────────────────────────────────────────────────────────── */

export type PaymentPhase =
  | "requires_payment"
  | "processing"
  | "held" // requires_capture — authorised, funds in escrow
  | "succeeded" // captured / paid out path begins
  | "failed"
  | "refunded"
  | "unknown"

/** Normalise a raw payment/intent status onto our phase vocabulary. */
export function normalisePaymentPhase(raw: string | null | undefined): PaymentPhase {
  const s = (raw ?? "").toLowerCase()
  if (!s) return "unknown"
  if (["requires_payment", "requires_payment_method", "requires_confirmation", "requires_action", "pending"].includes(s))
    return "requires_payment"
  if (["processing", "in_progress"].includes(s)) return "processing"
  if (["requires_capture", "authorized", "held", "on_hold"].includes(s)) return "held"
  if (["succeeded", "captured", "paid", "completed", "complete"].includes(s)) return "succeeded"
  if (["failed", "canceled", "cancelled", "requires_payment_method_failed"].includes(s)) return "failed"
  if (["refunded", "reversed"].includes(s)) return "refunded"
  return "unknown"
}

export interface StatusVisual {
  label: string
  bg: string
  text: string
  dot: string
}

/** Pill visuals for a payment phase (premium, light-theme only). */
export function paymentVisual(phase: PaymentPhase): StatusVisual {
  switch (phase) {
    case "requires_payment":
      return { label: "Awaiting payment", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" }
    case "processing":
      return { label: "Processing", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" }
    case "held":
      return { label: "Held in escrow", bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" }
    case "succeeded":
      return { label: "Captured", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" }
    case "failed":
      return { label: "Failed", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" }
    case "refunded":
      return { label: "Refunded", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" }
    default:
      return { label: "Unknown", bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-300" }
  }
}

export type PayoutStatus = "in_escrow" | "pending_payout" | "paid" | "on_hold" | "reversed" | "unknown"

export function normalisePayoutStatus(raw: string | null | undefined): PayoutStatus {
  const s = (raw ?? "").toLowerCase()
  if (["in_escrow", "escrow", "requires_capture", "held"].includes(s)) return "in_escrow"
  if (["pending", "pending_payout", "in_transit", "scheduled"].includes(s)) return "pending_payout"
  if (["paid", "paid_out", "settled", "succeeded"].includes(s)) return "paid"
  if (["on_hold", "review", "disputed"].includes(s)) return "on_hold"
  if (["reversed", "refunded", "failed", "cancelled", "canceled"].includes(s)) return "reversed"
  return "unknown"
}

export function payoutVisual(status: PayoutStatus): StatusVisual {
  switch (status) {
    case "in_escrow":
      return { label: "In escrow", bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" }
    case "pending_payout":
      return { label: "Pending payout", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" }
    case "paid":
      return { label: "Paid out", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" }
    case "on_hold":
      return { label: "On hold", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" }
    case "reversed":
      return { label: "Reversed", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" }
    default:
      return { label: "—", bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-300" }
  }
}

/**
 * HONEST guest-facing copy. We NEVER claim the booking is confirmed or that
 * money was captured unless the status records say so. Escrow phases explain
 * that funds are HELD until the stay completes.
 */
export interface GuestCopy {
  heading: string
  body: string
  tone: "processing" | "held" | "confirmed" | "failed" | "neutral"
}

export function guestPaymentCopy(
  paymentPhase: PaymentPhase,
  bookingStatus: string | null | undefined
): GuestCopy {
  const confirmed = (bookingStatus ?? "").toLowerCase() === "confirmed"
  if (confirmed && (paymentPhase === "succeeded" || paymentPhase === "held")) {
    return {
      heading: "Your booking is confirmed",
      body: "The property manager has confirmed your stay. Your payment is held securely and is released to them after your stay.",
      tone: "confirmed",
    }
  }
  switch (paymentPhase) {
    case "held":
      return {
        heading: "Payment received — booking pending confirmation",
        body: "Your card has been authorised and the funds are held securely in escrow. They are only released to the property manager once your stay is confirmed and completed. The manager will confirm your dates shortly.",
        tone: "held",
      }
    case "succeeded":
      return {
        heading: "Payment received — booking pending confirmation",
        body: "We've received your payment. It is held securely until your stay is confirmed and completed. The property manager will confirm your dates shortly.",
        tone: "held",
      }
    case "processing":
    case "requires_payment":
      return {
        heading: "Processing your payment…",
        body: "We're confirming your payment with your bank. This usually takes a few seconds — please keep this page open.",
        tone: "processing",
      }
    case "failed":
      return {
        heading: "Payment didn't go through",
        body: "Your payment couldn't be completed and no money has been taken. Please try again or use a different card.",
        tone: "failed",
      }
    case "refunded":
      return {
        heading: "Payment refunded",
        body: "This payment has been refunded. If you didn't expect this, please contact the property manager.",
        tone: "neutral",
      }
    default:
      return {
        heading: "Checking your payment…",
        body: "We're checking the latest status of your payment. Please keep this page open.",
        tone: "processing",
      }
  }
}

/** Format integer pence at the UI edge. */
export function formatPence(pence: number | null | undefined, currency = "GBP"): string {
  const value = (Number(pence ?? 0) || 0) / 100
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      minimumFractionDigits: 2,
    }).format(value)
  } catch {
    return `£${value.toFixed(2)}`
  }
}
