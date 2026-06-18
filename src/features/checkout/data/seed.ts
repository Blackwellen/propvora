// ============================================================================
// Checkout — bundled seed fallback. Used when the live tables are absent
// (42P01) or no row matches, so every screen renders a coherent, premium demo
// instead of an empty void. All money is integer pence.
// ============================================================================

import { calcBooking, calcService, calcEmergency, VAT_RATE_BPS } from "./calc"
import type {
  CheckoutBundle,
  CheckoutType,
  CheckoutPaymentMethod,
  CheckoutLineItem,
} from "./types"

const WS = "00000000-0000-0000-0000-000000000000"

function seedMethods(sessionId: string): CheckoutPaymentMethod[] {
  return [
    { id: `${sessionId}-pm-card`, checkout_session_id: sessionId, method_type: "card", brand: "Visa", last4: "4242", exp_label: "08/28", is_default: true },
    { id: `${sessionId}-pm-apple`, checkout_session_id: sessionId, method_type: "apple_pay", brand: null, last4: null, exp_label: null, is_default: false },
    { id: `${sessionId}-pm-google`, checkout_session_id: sessionId, method_type: "google_pay", brand: null, last4: null, exp_label: null, is_default: false },
    { id: `${sessionId}-pm-bank`, checkout_session_id: sessionId, method_type: "bank_transfer", brand: null, last4: null, exp_label: null, is_default: false },
  ]
}

function nowPlus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function dateOnly(days: number): string {
  return nowPlus(days).slice(0, 10)
}

// ── Booking ─────────────────────────────────────────────────────────────────
function seedBooking(id: string): CheckoutBundle {
  const nightly = 18500
  const nights = 4
  const calc = calcBooking({
    nightlyPence: nightly,
    nights,
    cleaningFeePence: 6500,
    extrasPence: 0,
    discountPence: 0,
    depositHoldPence: 25000,
  })
  const lineItems: CheckoutLineItem[] = [
    { id: `${id}-li-stay`, checkout_session_id: id, kind: "base", label: `Nightly rate × ${nights} nights`, quantity: nights, unit_amount_pence: nightly, amount_pence: nightly * nights, currency: "GBP", selected: true },
    { id: `${id}-li-clean`, checkout_session_id: id, kind: "fee", label: "Cleaning fee", quantity: 1, unit_amount_pence: 6500, amount_pence: 6500, currency: "GBP", selected: true },
  ]
  return {
    session: {
      id, workspace_id: WS, checkout_type: "booking", reference_type: "booking", reference_id: id,
      status: "pending_payment", currency: "GBP", total_due_now_pence: calc.totalDueNowPence,
      contact_email: null, expires_at: nowPlus(1), metadata_json: {}, created_at: nowPlus(0), updated_at: nowPlus(0),
    },
    breakdown: {
      id: `${id}-bd`, checkout_session_id: id, subtotal_pence: calc.subtotalPence,
      cleaning_fee_pence: calc.cleaningFeePence, service_fee_pence: calc.serviceFeePence,
      platform_fee_pence: 0, vat_pence: calc.vatPence, vat_rate_bps: VAT_RATE_BPS,
      discount_pence: calc.discountPence, deposit_hold_pence: calc.depositHoldPence,
      total_due_now_pence: calc.totalDueNowPence, total_full_pence: calc.totalFullPence,
      estimate_low_pence: null, estimate_high_pence: null, currency: "GBP", promo_code: null,
    },
    lineItems,
    paymentMethods: seedMethods(id),
    addOns: [
      { id: `${id}-ao-early`, label: "Early check-in (12:00)", amount_pence: 3500, selected: false },
      { id: `${id}-ao-late`, label: "Late check-out (14:00)", amount_pence: 3500, selected: false },
    ],
    guest: {
      full_name: null, email: null, phone: null, guests_count: 2,
      check_in: dateOnly(14), check_out: dateOnly(18), arrival_notes: null,
      special_requests: null, billing_same_as_contact: true,
      billing_line1: null, billing_city: null, billing_postcode: null, billing_country: "GB",
    },
    property: {
      property_name: "The Garden Loft, Shoreditch",
      location: "Shoreditch, London E2",
      image_url: null,
      nightly_pence: nightly, nights, rating: 4.9, reviews_count: 214,
    },
  }
}

// ── Instant-pay service ───────────────────────────────────────────────────────
function seedService(id: string): CheckoutBundle {
  const base = 14000
  const calc = calcService({ basePence: base, addOnsPence: 0, escrowHoldPence: base })
  return {
    session: {
      id, workspace_id: WS, checkout_type: "service", reference_type: "service_order", reference_id: id,
      status: "pending_payment", currency: "GBP", total_due_now_pence: calc.totalDueNowPence,
      contact_email: null, expires_at: nowPlus(2), metadata_json: {}, created_at: nowPlus(0), updated_at: nowPlus(0),
    },
    breakdown: {
      id: `${id}-bd`, checkout_session_id: id, subtotal_pence: calc.subtotalPence,
      cleaning_fee_pence: 0, service_fee_pence: 0, platform_fee_pence: calc.platformFeePence,
      vat_pence: calc.vatPence, vat_rate_bps: VAT_RATE_BPS, discount_pence: 0,
      deposit_hold_pence: calc.escrowHoldPence, total_due_now_pence: calc.totalDueNowPence,
      total_full_pence: calc.totalDueNowPence, estimate_low_pence: null, estimate_high_pence: null,
      currency: "GBP", promo_code: null,
    },
    lineItems: [
      { id: `${id}-li-base`, checkout_session_id: id, kind: "base", label: "Deep clean — 3 bed flat", quantity: 1, unit_amount_pence: base, amount_pence: base, currency: "GBP", selected: true },
    ],
    paymentMethods: seedMethods(id),
    addOns: [
      { id: `${id}-ao-oven`, label: "Oven deep clean", amount_pence: 4500, selected: false },
      { id: `${id}-ao-windows`, label: "Interior windows", amount_pence: 3000, selected: false },
      { id: `${id}-ao-carpet`, label: "Carpet shampoo", amount_pence: 6000, selected: false },
    ],
    service: {
      supplier_name: "BrightHome Cleaning Co.", service_name: "Deep clean — 3 bed flat",
      service_scope: "Full property deep clean including kitchen, bathrooms and all living areas.",
      appointment_at: nowPlus(3), property_address: "14 Park Crescent, London NW1 4HE",
      access_details: "Key safe by front door — code provided after booking.",
      contact_name: null, contact_phone: null, service_notes: null, appointment_confirmed: false,
    },
    supplier: { logo_url: null, avatar_url: null, rating: 4.8, reviews_count: 96, vetted: true },
  }
}

// ── Emergency dispatch ────────────────────────────────────────────────────────
function seedEmergency(id: string): CheckoutBundle {
  const calc = calcEmergency({
    callOutFeePence: 9000, labourLowPence: 8000, labourHighPence: 22000, outOfHoursPremiumPence: 4500,
  })
  return {
    session: {
      id, workspace_id: WS, checkout_type: "emergency", reference_type: "emergency_order", reference_id: id,
      status: "pending_payment", currency: "GBP", total_due_now_pence: calc.estimateLowPence,
      contact_email: null, expires_at: nowPlus(1), metadata_json: {}, created_at: nowPlus(0), updated_at: nowPlus(0),
    },
    breakdown: {
      id: `${id}-bd`, checkout_session_id: id, subtotal_pence: calc.callOutFeePence,
      cleaning_fee_pence: 0, service_fee_pence: 0, platform_fee_pence: 0, vat_pence: 0,
      vat_rate_bps: VAT_RATE_BPS, discount_pence: 0, deposit_hold_pence: 0,
      total_due_now_pence: calc.estimateLowPence, total_full_pence: calc.estimateHighPence,
      estimate_low_pence: calc.estimateLowPence, estimate_high_pence: calc.estimateHighPence,
      currency: "GBP", promo_code: null,
    },
    lineItems: [
      { id: `${id}-li-callout`, checkout_session_id: id, kind: "fee", label: "Emergency call-out fee", quantity: 1, unit_amount_pence: calc.callOutFeePence, amount_pence: calc.callOutFeePence, currency: "GBP", selected: true },
      { id: `${id}-li-ooh`, checkout_session_id: id, kind: "fee", label: "Out-of-hours premium", quantity: 1, unit_amount_pence: calc.outOfHoursPremiumPence, amount_pence: calc.outOfHoursPremiumPence, currency: "GBP", selected: true },
    ],
    paymentMethods: seedMethods(id),
    addOns: [],
    emergency: {
      provider_name: "RapidFix Emergency Plumbers", response_time_label: "~35 min",
      coverage_area: "Greater London", property_address: "14 Park Crescent, London NW1 4HE",
      issue_details: "Burst pipe under kitchen sink — water spreading across floor.",
      access_notes: null, live_phone: "+44 20 7946 1188", emergency_contact: null,
      preferred_contact: "call", acceptance_deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      dispatch_stage: "request_sent",
    },
  }
}

// ── Quote request / RFQ ───────────────────────────────────────────────────────
function seedQuoteRequest(id: string): CheckoutBundle {
  return {
    session: {
      id, workspace_id: WS, checkout_type: "quote_request", reference_type: "quote_request", reference_id: id,
      status: "draft", currency: "GBP", total_due_now_pence: 0,
      contact_email: null, expires_at: null, metadata_json: {}, created_at: nowPlus(0), updated_at: nowPlus(0),
    },
    breakdown: {
      id: `${id}-bd`, checkout_session_id: id, subtotal_pence: 0, cleaning_fee_pence: 0,
      service_fee_pence: 0, platform_fee_pence: 0, vat_pence: 0, vat_rate_bps: VAT_RATE_BPS,
      discount_pence: 0, deposit_hold_pence: 0, total_due_now_pence: 0, total_full_pence: 0,
      estimate_low_pence: 80000, estimate_high_pence: 150000, currency: "GBP", promo_code: null,
    },
    lineItems: [],
    paymentMethods: [],
    addOns: [],
    quoteRequest: {
      supplier_name: "Meridian Property Maintenance", service_type: "Bathroom renovation",
      service_description: "Full refit of main bathroom — new suite, tiling and electrics.",
      property_address: "14 Park Crescent, London NW1 4HE",
      preferred_date: dateOnly(21), preferred_time: "Morning", flexibility: "Flexible within 2 weeks",
      budget_low_pence: 80000, budget_high_pence: 150000, urgency: "soon",
      contact_name: null, contact_email: null, contact_phone: null,
      message: null, site_visit: "on_site",
    },
    supplier: { logo_url: null, avatar_url: null, rating: 4.7, reviews_count: 58, vetted: true },
  }
}

export function seedBundle(type: CheckoutType, id: string): CheckoutBundle {
  switch (type) {
    case "service":
      return seedService(id)
    case "emergency":
      return seedEmergency(id)
    case "quote_request":
      return seedQuoteRequest(id)
    case "booking":
    default:
      return seedBooking(id)
  }
}
