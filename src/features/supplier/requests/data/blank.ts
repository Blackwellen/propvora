/* ──────────────────────────────────────────────────────────────────────────
   makeBlankPipelineRequest — a fully-typed, empty PipelineRequest used when the
   Quote Builder is opened standalone (/supplier/quotes/new with no requestId).

   Every field the wizard or detail panels read is present and inert, so the
   flow is exercisable without a live request row. The recommendation block is
   neutral (no suggested price / win-probability) so the supplier prices from
   scratch.
─────────────────────────────────────────────────────────────────────────── */

import type { PipelineRequest } from "./types"

export function makeBlankPipelineRequest(overrides: Partial<PipelineRequest> = {}): PipelineRequest {
  const now = new Date().toISOString()
  return {
    id: `new-${Date.now()}`,
    ref: "NEW",
    tab: "new",
    requesterCompany: "New quote",
    requesterVerified: false,
    customerName: null,
    customerReturning: false,
    serviceTitle: "Custom quote",
    scopeSummary: "",
    scopeBullets: [],
    property: { type: null, year: null, tenure: null, heating: null, bedrooms: null, units: null, address: null },
    urgency: "standard",
    budgetMinPence: null,
    budgetMaxPence: null,
    withinCoverage: true,
    winScore: 0,
    createdAt: now,
    dueAt: null,
    files: [],
    docsRequired: 0,
    quoteId: null,
    quoteStatus: null,
    quoteAmountPence: null,
    quoteIncVatPence: null,
    quoteSentAt: null,
    quoteExpiresAt: null,
    winChance: null,
    followUpAt: null,
    versions: [],
    lineItems: [],
    messages: [],
    recommendation: {
      suggestedPricePence: null,
      marginEstPct: null,
      winProbabilityPct: null,
      fitChecks: [],
    },
    wonValuePence: null,
    acceptedAt: null,
    escrow: "none",
    nextStep: null,
    scheduleReady: false,
    lostAt: null,
    lostValuePence: null,
    lossReason: null,
    recoverable: false,
    notes: null,
    archivedAt: null,
    archiveReason: null,
    outcome: null,
    reactivationUntil: null,
    ...overrides,
  }
}
