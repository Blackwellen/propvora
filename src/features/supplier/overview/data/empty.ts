import type {
  TodayData,
  RequestsData,
  JobsData,
  EarningsData,
  ComplianceData,
} from "./types"

export const emptyToday: TodayData = {
  kpis: { newRequests: 0, jobsToday: 0, awaitingEvidence: 0, awaitingPayoutPence: 0, responseScorePct: 0 },
  agenda: [],
  nextAppointment: null,
  priorityAlerts: [],
  quickActions: [],
  earnings: { todayPence: 0, weekPence: 0, currency: "GBP" },
  unread: [],
  availability: { available: false, hours: "—" },
  payout: { thisWeekPence: 0, nextPayoutPence: 0, nextPayoutDate: "—", currency: "GBP" },
  complianceAlerts: [],
  trust: { scorePct: 0, breakdown: { onTimePct: 0, responsePct: 0, qualityPct: 0, communicationPct: 0 } },
}

export const emptyRequests: RequestsData = {
  kpis: { openRequests: 0, responseDueToday: 0, potentialValuePence: 0, avgWinChancePct: 0, questionsAwaiting: 0 },
  rows: [],
}

export const emptyJobs: JobsData = {
  kpis: { activeJobs: 0, dueToday: 0, atRisk: 0, evidenceMissing: 0, escrowWaitingPence: 0 },
  rows: [],
  earningsByService: [],
  recentInvoices: [],
  complianceStatus: [],
}

export const emptyEarnings: EarningsData = {
  kpis: { thisMonthPence: 0, inEscrowPence: 0, awaitingPayoutPence: 0, paidOutPence: 0, unpaidInvoicesPence: 0 },
  currency: "GBP",
  trendMonthly: [],
  trendDaily: [],
  payoutTimeline: [],
  invoices: [],
  revenueByService: [],
  blockedPayouts: [],
  availableBalancePence: 0,
  financeHealthPct: 0,
}

export const emptyCompliance: ComplianceData = {
  kpis: { trustScorePct: 0, documentsVerified: 0, documentsTotal: 0, expiringSoon: 0, servicesBlocked: 0, profileVisible: false },
  alerts: [],
  requiredDocs: [],
  expiryTimeline: [],
  serviceImpact: [],
  availability: { available: false, hours: "—" },
  payout: { thisWeekPence: 0, nextPayoutPence: 0, nextPayoutDate: "—", currency: "GBP" },
  trust: { scorePct: 0, breakdown: { onTimePct: 0, responsePct: 0, qualityPct: 0, communicationPct: 0 } },
}
