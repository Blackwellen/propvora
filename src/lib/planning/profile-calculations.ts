// ─── Profile Calculations ────────────────────────────────────────────────────
// Pure financial calculation functions for planning profile analysis.

export function calcGrossYield(annualRent: number, propertyValue: number): number {
  return propertyValue > 0 ? (annualRent / propertyValue) * 100 : 0
}

export function calcNetYield(annualRent: number, annualCosts: number, propertyValue: number): number {
  return propertyValue > 0 ? ((annualRent - annualCosts) / propertyValue) * 100 : 0
}

export function calcMonthlyGrossIncome(units: number, avgRent: number, occupancy: number): number {
  return units * avgRent * (occupancy / 100)
}

export function calcNOI(grossIncome: number, operatingCosts: number): number {
  return grossIncome - operatingCosts
}

export function calcOperatingMargin(noi: number, grossIncome: number): number {
  return grossIncome > 0 ? (noi / grossIncome) * 100 : 0
}

export function calcROI(annualProfit: number, totalInvested: number): number {
  return totalInvested > 0 ? (annualProfit / totalInvested) * 100 : 0
}

export function calcIRR(cashflows: number[]): number {
  // Newton-Raphson IRR approximation
  let rate = 0.1
  for (let i = 0; i < 100; i++) {
    let npv = 0
    let dnpv = 0
    cashflows.forEach((cf, t) => {
      npv += cf / Math.pow(1 + rate, t)
      dnpv -= (t * cf) / Math.pow(1 + rate, t + 1)
    })
    if (Math.abs(npv) < 1e-6) break
    if (dnpv === 0) break
    rate -= npv / dnpv
  }
  return rate * 100
}

export function calcCashOnCash(annualCashflow: number, cashInvested: number): number {
  return cashInvested > 0 ? (annualCashflow / cashInvested) * 100 : 0
}

export function calcBreakevenOccupancy(fixedCosts: number, revenuePerUnit: number): number {
  return revenuePerUnit > 0 ? (fixedCosts / revenuePerUnit) * 100 : 0
}

export function calcBreakevenMonth(
  monthlyCosts: number,
  monthlyRevenue: number,
  setupCost: number
): number {
  const monthlyProfit = monthlyRevenue - monthlyCosts
  return monthlyProfit > 0 ? Math.ceil(setupCost / monthlyProfit) : 0
}

export function calcRevPAR(adr: number, occupancy: number): number {
  return adr * (occupancy / 100)
}

export function calcWAULT(
  leases: Array<{ remainingTerm: number; annualRent: number }>
): number {
  const totalRent = leases.reduce((s, l) => s + l.annualRent, 0)
  if (totalRent === 0) return 0
  return leases.reduce((s, l) => s + l.remainingTerm * l.annualRent, 0) / totalRent
}

export function calcDSCR(noi: number, annualDebtService: number): number {
  return annualDebtService > 0 ? noi / annualDebtService : 0
}

export function calcLTV(loanAmount: number, propertyValue: number): number {
  return propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0
}

export function calcEquityReleased(newLoan: number, existingLoan: number): number {
  return newLoan - existingLoan
}

export function calcARVUplift(
  purchasePrice: number,
  renovationCost: number,
  arv: number
): number {
  return arv - purchasePrice - renovationCost
}

export function calcGrossMargin(salePrice: number, totalCosts: number): number {
  return salePrice > 0 ? ((salePrice - totalCosts) / salePrice) * 100 : 0
}

export function calcNetProfit(salePrice: number, allCosts: number): number {
  return salePrice - allCosts
}

export function calcRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact
}

export function calcComplianceScore(compliantCount: number, totalCount: number): number {
  return totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0
}

export function calcChecklistReadiness(completedCount: number, totalCount: number): number {
  return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
}

export function fmtCurrency(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`
    if (Math.abs(n) >= 1_000) return `£${(n / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}
