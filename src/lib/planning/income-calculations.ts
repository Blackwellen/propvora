// ─────────────────────────────────────────────────────────────────────────────
// Planning Wizard — Income / Revenue Model Builder calculation engine
//
// Single source of truth for every KPI, summary number and chart series used by
// the 11 Income sub-tabs. Pure functions only — no React, no Supabase. Each tab
// component imports the relevant calculator so the maths is never duplicated.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  RoomLine,
  UnitLine,
  NightlyRateLine,
  OccupancyScenario,
  SeasonLine,
  AncillaryLine,
  ParkingLine,
  LaundryLine,
  MembershipLine,
  CorporateLetLine,
  OtherIncomeLine,
} from "@/components/planning/wizard/WizardContext"

// ─── Model assumptions (documented, not magic literals) ─────────────────────

/** Operating-cost ratio used to estimate net yield at the income stage, before
 *  the detailed Expenses & Bills step refines it. 18% is the UK PRS planning norm. */
export const OPEX_RATIO = 0.18
/** Average nights per calendar month for serviced-accommodation maths. */
export const NIGHTS_PER_MONTH = 30.4
/** Default ancillary contribution margin assumption when no cost line exists. */
export const ANCILLARY_CONTRIBUTION_MARGIN = 0.74

// ─── Generic helpers ─────────────────────────────────────────────────────────

export const round = (n: number, dp = 0): number => {
  const f = 10 ** dp
  return Math.round((Number.isFinite(n) ? n : 0) * f) / f
}

export const sum = (xs: number[]): number => xs.reduce((a, b) => a + (b || 0), 0)

export const gbp = (n: number, dp = 0): string =>
  `£${round(n, dp).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`

export const pct = (n: number, dp = 0): string => `${round(n, dp)}%`

/** Parse a unit/room range ("101–110", "201-210", "12 Studios", "101") to a count. */
export function parseRangeCount(value: string): number {
  if (!value) return 1
  const lead = value.match(/^\s*(\d+)\s*$/)
  if (lead) return 1
  const range = value.match(/(\d+)\s*[–-]\s*(\d+)/)
  if (range) {
    const a = Number(range[1])
    const b = Number(range[2])
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a) return b - a + 1
  }
  const qty = value.match(/(\d+)/)
  return qty ? Number(qty[1]) : 1
}

function weightedAvg(pairs: Array<[value: number, weight: number]>): number {
  const w = sum(pairs.map((p) => p[1]))
  if (w === 0) return 0
  return sum(pairs.map((p) => p[0] * p[1])) / w
}

/** Twelve-month seed-free projection curve from a monthly base + amplitude (%). */
export function monthlyCurve(base: number, amplitudePct = 5): Array<{ m: string; v: number }> {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months.map((m, i) => {
    const seasonal = Math.sin(((i - 2) / 12) * Math.PI * 2) * (amplitudePct / 100)
    return { m, v: round(base * (1 + seasonal)) }
  })
}

/** Rent cover from forecast financing inputs; null when no property value/LTV yet. */
export function rentCover(grossMonthly: number, propertyValue: number, ltvPct: number, ratePct: number): number | null {
  const loan = propertyValue * (ltvPct / 100)
  const monthlyInterest = (loan * (ratePct / 100)) / 12
  if (monthlyInterest <= 0) return null
  return grossMonthly / monthlyInterest
}

export function grossYield(grossAnnual: number, propertyValue: number): number | null {
  if (propertyValue <= 0) return null
  return (grossAnnual / propertyValue) * 100
}

// ─── Rent per room ───────────────────────────────────────────────────────────

export interface RoomMetrics {
  grossMonthly: number
  grossAnnual: number
  roomCount: number
  avgRent: number
  avgVoid: number
  avgRoomRate: number
  letPct: number
  voidPct: number
  turnoverPct: number
}

export function calcRooms(rooms: RoomLine[], voidAllowancePct: number): RoomMetrics {
  const roomCount = rooms.length
  const grossMonthly = sum(rooms.map((r) => r.avgRentPcm * (1 - r.voidPct / 100)))
  const avgRent = roomCount ? sum(rooms.map((r) => r.avgRentPcm)) / roomCount : 0
  const avgVoid = roomCount ? sum(rooms.map((r) => r.voidPct)) / roomCount : 0
  const voidPct = round(voidAllowancePct)
  return {
    grossMonthly: round(grossMonthly),
    grossAnnual: round(grossMonthly * 12),
    roomCount,
    avgRent: round(avgRent),
    avgVoid: round(avgVoid, 1),
    avgRoomRate: roomCount ? round(grossMonthly / roomCount) : 0,
    letPct: round(100 - voidPct - 1),
    voidPct,
    turnoverPct: 1,
  }
}

// ─── Rent per unit ───────────────────────────────────────────────────────────

export interface UnitMetrics {
  grossMonthly: number
  grossAnnual: number
  unitCount: number
  avgUnitSize: number
  avgRent: number
  avgVoid: number
  estimatedAnnualVoid: number
  rentPsf: number
  avgUnitRate: number
  letPct: number
  voidPct: number
  turnoverPct: number
}

export function calcUnits(units: UnitLine[], voidAllowancePct: number): UnitMetrics {
  const counts = units.map((u) => parseRangeCount(u.unitNumber))
  const unitCount = sum(counts)
  const grossMonthly = sum(units.map((u, i) => u.avgRentPcm * counts[i]))
  const avgRent = unitCount ? grossMonthly / unitCount : 0
  const avgUnitSize = unitCount ? sum(units.map((u, i) => u.unitSizeSqFt * counts[i])) / unitCount : 0
  const avgVoid = weightedAvg(units.map((u, i) => [u.voidPct, counts[i]] as [number, number]))
  const grossAnnual = grossMonthly * 12
  return {
    grossMonthly: round(grossMonthly),
    grossAnnual: round(grossAnnual),
    unitCount,
    avgUnitSize: round(avgUnitSize),
    avgRent: round(avgRent),
    avgVoid: round(avgVoid, 1),
    estimatedAnnualVoid: round(grossAnnual * (voidAllowancePct / 100)),
    rentPsf: avgUnitSize ? round(avgRent / avgUnitSize, 2) : 0,
    avgUnitRate: round(avgRent),
    letPct: round(100 - voidAllowancePct - 1),
    voidPct: round(voidAllowancePct),
    turnoverPct: 1,
  }
}

// ─── Nightly rate ────────────────────────────────────────────────────────────

export interface NightlyMetrics {
  grossMonthly: number
  grossAnnual: number
  planCount: number
  avgNightlyRate: number
  avgOccupancyTarget: number
  adr: number
  revpar: number
  occupiedNights: number
  voidNights: number
  cleaningRevenue: number
}

function planAvgNightly(p: NightlyRateLine): number {
  // 5 weekday nights + 2 weekend nights (uplifted), averaged across the week.
  return (p.baseRateWeekday * (5 + 2 * (1 + p.weekendUpliftPct / 100))) / 7
}

export function calcNightly(rates: NightlyRateLine[], voidPct: number): NightlyMetrics {
  const planCount = rates.length
  let grossMonthly = 0
  let cleaningRevenue = 0
  let occupiedNights = 0
  const availableNights = planCount * NIGHTS_PER_MONTH
  rates.forEach((p) => {
    const avgNightly = planAvgNightly(p)
    const occNights = NIGHTS_PER_MONTH * (p.occupancyTargetPct / 100) * (1 - voidPct / 100)
    const stays = occNights / Math.max(p.minStayNights || 1, 1)
    const clean = stays * (p.cleaningFee || 0)
    occupiedNights += occNights
    grossMonthly += avgNightly * occNights + clean
    cleaningRevenue += clean
  })
  const adr = occupiedNights ? (grossMonthly - cleaningRevenue) / occupiedNights : 0
  return {
    grossMonthly: round(grossMonthly),
    grossAnnual: round(grossMonthly * 12),
    planCount,
    avgNightlyRate: planCount ? round(sum(rates.map(planAvgNightly)) / planCount) : 0,
    avgOccupancyTarget: planCount ? round(sum(rates.map((r) => r.occupancyTargetPct)) / planCount, 1) : 0,
    adr: round(adr),
    revpar: availableNights ? round((grossMonthly - cleaningRevenue) / availableNights) : 0,
    occupiedNights: round(occupiedNights),
    voidNights: round(availableNights - occupiedNights),
    cleaningRevenue: round(cleaningRevenue),
  }
}

// ─── Occupancy scenarios ─────────────────────────────────────────────────────

export interface OccupancyMetrics {
  weightedOccupancy: number
  weightedVoid: number
  weightedTurnover: number
  primaryChannel: string
  stabilisation: string
  baseOccupancy: number
}

export function calcOccupancy(scenarios: OccupancyScenario[]): OccupancyMetrics {
  const scored = scenarios.filter((s) => s.targetOccupancyPct != null)
  const base = scenarios.find((s) => s.kind === "base")
  const avg = (sel: (s: OccupancyScenario) => number | null) => {
    const vals = scored.map(sel).filter((v): v is number => v != null)
    return vals.length ? sum(vals) / vals.length : 0
  }
  const channelCounts = scenarios.reduce<Record<string, number>>((acc, s) => {
    if (s.channel) acc[s.channel] = (acc[s.channel] || 0) + 1
    return acc
  }, {})
  const primaryChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
  return {
    weightedOccupancy: round(avg((s) => s.targetOccupancyPct), 1),
    weightedVoid: round(avg((s) => s.expectedVoidPct), 1),
    weightedTurnover: round(avg((s) => s.turnoverPct), 1),
    primaryChannel,
    stabilisation: base?.stabilisedPeriod || "—",
    baseOccupancy: round(base?.targetOccupancyPct ?? avg((s) => s.targetOccupancyPct), 1),
  }
}

// ─── Seasonal assumptions ────────────────────────────────────────────────────

export interface SeasonalMetrics {
  peakImpactPct: number
  peakSeason: string
  lowImpactPct: number
  lowSeason: string
  netAnnualImpactPct: number
}

export function calcSeasonal(seasons: SeasonLine[]): SeasonalMetrics {
  if (!seasons.length) {
    return { peakImpactPct: 0, peakSeason: "—", lowImpactPct: 0, lowSeason: "—", netAnnualImpactPct: 0 }
  }
  const peak = seasons.reduce((a, b) => (b.rateAdjPct > a.rateAdjPct ? b : a))
  const low = seasons.reduce((a, b) => (b.rateAdjPct < a.rateAdjPct ? b : a))
  return {
    peakImpactPct: round(peak.rateAdjPct, 1),
    peakSeason: peak.name,
    lowImpactPct: round(low.rateAdjPct, 1),
    lowSeason: low.name,
    netAnnualImpactPct: round(sum(seasons.map((s) => s.rateAdjPct)) / seasons.length, 1),
  }
}

// ─── Ancillary income ────────────────────────────────────────────────────────

export interface AncillaryMetrics {
  grossMonthly: number
  grossAnnual: number
  streamCount: number
  weightedTakeUp: number
  avgPerOccUnit: number
  contributionMarginPct: number
}

export function calcAncillary(lines: AncillaryLine[], occupiedUnits: number): AncillaryMetrics {
  const grossMonthly = sum(lines.map((l) => l.unitPriceIncVat * (l.adoptionRate / 100) * occupiedUnits))
  return {
    grossMonthly: round(grossMonthly),
    grossAnnual: round(grossMonthly * 12),
    streamCount: lines.length,
    weightedTakeUp: lines.length ? round(sum(lines.map((l) => l.adoptionRate)) / lines.length) : 0,
    avgPerOccUnit: occupiedUnits ? round(grossMonthly / occupiedUnits) : 0,
    contributionMarginPct: lines.length ? round(ANCILLARY_CONTRIBUTION_MARGIN * 100) : 0,
  }
}

// ─── Parking ─────────────────────────────────────────────────────────────────

export interface ParkingMetrics {
  totalSpaces: number
  reservedSpaces: number
  rentableSpaces: number
  occupiedSpaces: number
  utilisationPct: number
  avgMonthlyFee: number
  potentialMonthly: number
  projectedMonthly: number
  annualProjected: number
  revenuePerSpace: number
}

export function calcParking(lines: ParkingLine[]): ParkingMetrics {
  const totalSpaces = sum(lines.map((l) => l.spacesAvailable))
  const occupiedSpaces = sum(lines.map((l) => l.spacesAvailable * (l.currentUtilPct / 100)))
  const potentialMonthly = sum(lines.map((l) => l.spacesAvailable * l.monthlyFee))
  const projectedMonthly = sum(lines.map((l) => l.spacesAvailable * l.monthlyFee * (l.currentUtilPct / 100)))
  return {
    totalSpaces,
    reservedSpaces: sum(lines.map((l) => l.reservedSpaces)),
    rentableSpaces: sum(lines.map((l) => l.rentableSpaces)),
    occupiedSpaces: round(occupiedSpaces),
    utilisationPct: totalSpaces ? round((occupiedSpaces / totalSpaces) * 100) : 0,
    avgMonthlyFee: totalSpaces
      ? round(weightedAvg(lines.map((l) => [l.monthlyFee, l.spacesAvailable] as [number, number])), 2)
      : 0,
    potentialMonthly: round(potentialMonthly),
    projectedMonthly: round(projectedMonthly),
    annualProjected: round(projectedMonthly * 12),
    revenuePerSpace: totalSpaces ? round(projectedMonthly / totalSpaces, 2) : 0,
  }
}

// ─── Laundry ─────────────────────────────────────────────────────────────────

export interface LaundryMetrics {
  grossMonthly: number
  streamCount: number
  avgUsageRate: number
  avgAdoption: number
  avgSpendPerOccUnit: number
  costRecoveryPct: number
}

function laundryPrice(l: LaundryLine): number {
  return l.washPrice || l.dryPrice || l.packagePrice || 0
}

export function calcLaundry(lines: LaundryLine[], occupiedUnits: number): LaundryMetrics {
  const grossMonthly = sum(
    lines.map((l) => laundryPrice(l) * l.usageFreq * (l.adoptionRate / 100) * occupiedUnits),
  )
  return {
    grossMonthly: round(grossMonthly),
    streamCount: lines.length,
    avgUsageRate: lines.length ? round(sum(lines.map((l) => l.usageFreq)) / lines.length, 1) : 0,
    avgAdoption: lines.length ? round(sum(lines.map((l) => l.adoptionRate)) / lines.length) : 0,
    avgSpendPerOccUnit: occupiedUnits ? round(grossMonthly / occupiedUnits, 2) : 0,
    costRecoveryPct: lines.length ? round(sum(lines.map((l) => l.costRecoveryPct)) / lines.length) : 0,
  }
}

// ─── Membership & service charges ────────────────────────────────────────────

export interface MembershipMetrics {
  grossMonthly: number
  activeCharges: number
  eligibleUnits: number
  avgChargePerUnit: number
  weightedCollection: number
  perEligibleUnit: number
}

function membershipMonthly(m: MembershipLine): number {
  const periodFactor = m.billingFrequency === "Annual" ? 1 / 12 : m.billingFrequency === "Quarterly" ? 1 / 3 : 1
  return m.pricePerUnit * m.eligibleUnits * (m.takeUpRate / 100) * periodFactor
}

export function calcMembership(lines: MembershipLine[]): MembershipMetrics {
  const grossMonthly = sum(lines.map(membershipMonthly))
  const eligibleUnits = lines.length ? Math.max(...lines.map((l) => l.eligibleUnits)) : 0
  return {
    grossMonthly: round(grossMonthly),
    activeCharges: lines.length,
    eligibleUnits,
    avgChargePerUnit: lines.length ? round(sum(lines.map((l) => l.pricePerUnit)) / lines.length) : 0,
    weightedCollection: lines.length
      ? round(weightedAvg(lines.map((l) => [l.takeUpRate, l.eligibleUnits] as [number, number])))
      : 0,
    perEligibleUnit: eligibleUnits ? round(grossMonthly / eligibleUnits, 2) : 0,
  }
}

// ─── Corporate lets ──────────────────────────────────────────────────────────

export interface CorporateMetrics {
  grossMonthly: number
  activeAccounts: number
  totalUnits: number
  avgContractValue: number
  contractedOccupancy: number
  avgContractLength: number
  weightedAvgRate: number
}

function corporateMonthly(c: CorporateLetLine): number {
  return parseRangeCount(c.unitAllocation) * c.agreedRatePcm * (c.occupancyCommitmentPct / 100)
}

export function calcCorporate(lines: CorporateLetLine[]): CorporateMetrics {
  const grossMonthly = sum(lines.map(corporateMonthly))
  const totalUnits = sum(lines.map((c) => parseRangeCount(c.unitAllocation)))
  return {
    grossMonthly: round(grossMonthly),
    activeAccounts: lines.length,
    totalUnits,
    avgContractValue: lines.length ? round(grossMonthly / lines.length) : 0,
    contractedOccupancy: lines.length
      ? round(weightedAvg(lines.map((c) => [c.occupancyCommitmentPct, parseRangeCount(c.unitAllocation)] as [number, number])))
      : 0,
    avgContractLength: lines.length ? round(sum(lines.map((c) => c.expectedMonths)) / lines.length, 1) : 0,
    weightedAvgRate: totalUnits ? round(grossMonthly / totalUnits) : 0,
  }
}

// ─── Other income lines ──────────────────────────────────────────────────────

export interface OtherIncomeMetrics {
  grossMonthly: number
  lineCount: number
  recurringMonthly: number
  weightedUtilisation: number
  oneOffMonthly: number
  vatReclaimable: number
  highest: { name: string; pct: number }
  lowest: { name: string; pct: number }
}

const RECURRING_FREQ = new Set(["Monthly", "Quarterly", "Annual"])

function otherMonthly(o: OtherIncomeLine): number {
  const periodFactor = o.frequency === "Annual" ? 1 / 12 : o.frequency === "Quarterly" ? 1 / 3 : 1
  return o.amount * periodFactor
}

export function calcOther(lines: OtherIncomeLine[]): OtherIncomeMetrics {
  const monthlies = lines.map(otherMonthly)
  const grossMonthly = sum(monthlies)
  const recurringMonthly = sum(lines.filter((o) => RECURRING_FREQ.has(o.frequency)).map(otherMonthly))
  const oneOffMonthly = grossMonthly - recurringMonthly
  let highest = { name: "—", pct: 0 }
  let lowest = { name: "—", pct: 0 }
  if (lines.length && grossMonthly > 0) {
    const withPct = lines.map((o, i) => ({ name: o.source, pct: (monthlies[i] / grossMonthly) * 100 }))
    highest = withPct.reduce((a, b) => (b.pct > a.pct ? b : a))
    lowest = withPct.reduce((a, b) => (b.pct < a.pct ? b : a))
  }
  return {
    grossMonthly: round(grossMonthly),
    lineCount: lines.length,
    recurringMonthly: round(recurringMonthly),
    weightedUtilisation: lines.length ? round(sum(lines.map((o) => o.adoptionPct)) / lines.length) : 0,
    oneOffMonthly: round(oneOffMonthly),
    vatReclaimable: round(sum(lines.map((o, i) => monthlies[i] * (o.vatRate / 100)))),
    highest: { name: highest.name, pct: round(highest.pct, 1) },
    lowest: { name: lowest.name, pct: round(lowest.pct, 1) },
  }
}

// ─── Cross-tab totals (for live summary bridge) ──────────────────────────────

export interface IncomeTotals {
  coreRentMonthly: number
  ancillaryMonthly: number
  parkingMonthly: number
  laundryMonthly: number
  membershipMonthly: number
  corporateMonthly: number
  otherMonthly: number
  grossMonthly: number
  grossAnnual: number
  netMonthly: number
  netAnnual: number
}

export interface IncomeTotalsInput {
  rooms: RoomLine[]
  units: UnitLine[]
  nightlyRates: NightlyRateLine[]
  ancillaryLines: AncillaryLine[]
  parkingLines: ParkingLine[]
  laundryLines: LaundryLine[]
  membershipLines: MembershipLine[]
  corporateLets: CorporateLetLine[]
  otherIncomeLines: OtherIncomeLine[]
  voidAllowancePct: number
  nightlyVoidPct: number
  occupiedUnits: number
}

export function calcIncomeTotals(input: IncomeTotalsInput): IncomeTotals {
  const coreRentMonthly =
    calcRooms(input.rooms, input.voidAllowancePct).grossMonthly +
    calcUnits(input.units, input.voidAllowancePct).grossMonthly +
    calcNightly(input.nightlyRates, input.nightlyVoidPct).grossMonthly
  const ancillaryMonthly = calcAncillary(input.ancillaryLines, input.occupiedUnits).grossMonthly
  const parkingMonthly = calcParking(input.parkingLines).projectedMonthly
  const laundryMonthly = calcLaundry(input.laundryLines, input.occupiedUnits).grossMonthly
  const membershipMonthly = calcMembership(input.membershipLines).grossMonthly
  const corporateMonthly = calcCorporate(input.corporateLets).grossMonthly
  const otherMonthly = calcOther(input.otherIncomeLines).grossMonthly
  const grossMonthly =
    coreRentMonthly + ancillaryMonthly + parkingMonthly + laundryMonthly + membershipMonthly + corporateMonthly + otherMonthly
  const netMonthly = grossMonthly * (1 - OPEX_RATIO)
  return {
    coreRentMonthly: round(coreRentMonthly),
    ancillaryMonthly,
    parkingMonthly,
    laundryMonthly,
    membershipMonthly,
    corporateMonthly,
    otherMonthly,
    grossMonthly: round(grossMonthly),
    grossAnnual: round(grossMonthly * 12),
    netMonthly: round(netMonthly),
    netAnnual: round(netMonthly * 12),
  }
}

/** Best-effort occupied-unit count used by per-occupied-unit ancillary maths. */
export function deriveOccupiedUnits(input: {
  units: UnitLine[]
  rooms: RoomLine[]
  numUnits: number
  voidAllowancePct: number
}): number {
  const unitCount = sum(input.units.map((u) => parseRangeCount(u.unitNumber)))
  const total = unitCount || input.rooms.length || input.numUnits || 0
  return Math.max(0, round(total * (1 - input.voidAllowancePct / 100)))
}
