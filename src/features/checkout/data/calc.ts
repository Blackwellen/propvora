// ============================================================================
// Checkout — central price calculation engine. Pure functions, integer pence.
// VAT is 20% (2000 bps) by default. Nothing here touches Stripe or the DB.
// ============================================================================

export const VAT_RATE_BPS = 2000 // 20.00%

export function applyBps(pence: number, bps: number): number {
  return Math.round((pence * bps) / 10000)
}

export interface BookingCalcInput {
  nightlyPence: number
  nights: number
  cleaningFeePence: number
  extrasPence: number // selected optional extras
  discountPence: number // applied promo
  depositHoldPence: number // refundable damage deposit hold
  serviceFeeBps?: number // platform service fee on subtotal (default 12%)
  vatRateBps?: number
}

export interface BookingCalcResult {
  subtotalPence: number // nightly × nights + extras
  cleaningFeePence: number
  serviceFeePence: number
  discountPence: number
  vatPence: number
  depositHoldPence: number
  totalDueNowPence: number // taxable total (deposit is a separate hold)
  totalFullPence: number // full trip price incl deposit hold
}

export function calcBooking(input: BookingCalcInput): BookingCalcResult {
  const serviceFeeBps = input.serviceFeeBps ?? 1200
  const vatRateBps = input.vatRateBps ?? VAT_RATE_BPS

  const stayPence = Math.max(0, input.nightlyPence) * Math.max(0, input.nights)
  const subtotalPence = stayPence + Math.max(0, input.extrasPence)
  const cleaningFeePence = Math.max(0, input.cleaningFeePence)
  const serviceFeePence = applyBps(subtotalPence, serviceFeeBps)
  const discountPence = Math.max(0, input.discountPence)

  const preVat = Math.max(0, subtotalPence + cleaningFeePence + serviceFeePence - discountPence)
  const vatPence = applyBps(preVat, vatRateBps)
  const totalDueNowPence = preVat + vatPence
  const totalFullPence = totalDueNowPence + Math.max(0, input.depositHoldPence)

  return {
    subtotalPence,
    cleaningFeePence,
    serviceFeePence,
    discountPence,
    vatPence,
    depositHoldPence: Math.max(0, input.depositHoldPence),
    totalDueNowPence,
    totalFullPence,
  }
}

export interface ServiceCalcInput {
  basePence: number
  addOnsPence: number
  platformFeeBps?: number // default 10%
  escrowHoldPence?: number
  vatRateBps?: number
}

export interface ServiceCalcResult {
  subtotalPence: number
  platformFeePence: number
  vatPence: number
  escrowHoldPence: number
  totalDueNowPence: number
}

export function calcService(input: ServiceCalcInput): ServiceCalcResult {
  const platformFeeBps = input.platformFeeBps ?? 1000
  const vatRateBps = input.vatRateBps ?? VAT_RATE_BPS
  const subtotalPence = Math.max(0, input.basePence) + Math.max(0, input.addOnsPence)
  const platformFeePence = applyBps(subtotalPence, platformFeeBps)
  const vatPence = applyBps(subtotalPence + platformFeePence, vatRateBps)
  const escrowHoldPence = Math.max(0, input.escrowHoldPence ?? subtotalPence)
  const totalDueNowPence = subtotalPence + platformFeePence + vatPence
  return { subtotalPence, platformFeePence, vatPence, escrowHoldPence, totalDueNowPence }
}

export interface EmergencyCalcInput {
  callOutFeePence: number
  labourLowPence: number
  labourHighPence: number
  outOfHoursPremiumPence: number
  vatRateBps?: number
}

export interface EmergencyCalcResult {
  callOutFeePence: number
  outOfHoursPremiumPence: number
  estimateLowPence: number // incl VAT
  estimateHighPence: number // incl VAT
}

export function calcEmergency(input: EmergencyCalcInput): EmergencyCalcResult {
  const vatRateBps = input.vatRateBps ?? VAT_RATE_BPS
  const base = Math.max(0, input.callOutFeePence) + Math.max(0, input.outOfHoursPremiumPence)
  const low = base + Math.max(0, input.labourLowPence)
  const high = base + Math.max(0, input.labourHighPence)
  return {
    callOutFeePence: Math.max(0, input.callOutFeePence),
    outOfHoursPremiumPence: Math.max(0, input.outOfHoursPremiumPence),
    estimateLowPence: low + applyBps(low, vatRateBps),
    estimateHighPence: high + applyBps(high, vatRateBps),
  }
}
