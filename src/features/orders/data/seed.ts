import type {
  OrderRow, QuoteRow, RfqRow, EscrowRow, CompletedOrderRow,
  OrderAttachment, OrderActivity, OrderMilestone, PayoutSplit, ReleaseCondition,
} from "./types"

export const SEED_ORDERS: OrderRow[] = [
  { id: "o1", orderRef: "ORD-10241", propertyLabel: "14 Grove St", location: "London E8", orderType: "Boiler service", supplierName: "HeatPro Ltd", supplierInitials: "HP", scheduledDate: "2026-06-20", escrowAmountPence: 48000, fundedAmountPence: 48000, milestoneStatus: "in_progress", evidenceStatus: "partial", slaStatus: "on_track", risk: "low", status: "in_progress", supplierRating: 4.8, supplierPhone: "020 7946 0101", supplierEmail: "ops@heatpro.co.uk", escrowState: "held" },
  { id: "o2", orderRef: "ORD-10238", propertyLabel: "Manor Flat 3B", location: "London SE1", orderType: "Gas safety cert", supplierName: "Gas Safe Co", supplierInitials: "GS", scheduledDate: "2026-06-18", escrowAmountPence: 12000, fundedAmountPence: 12000, milestoneStatus: "awaiting_evidence", evidenceStatus: "missing", slaStatus: "due_soon", risk: "medium", status: "in_progress", supplierRating: 4.6, supplierPhone: "020 7946 0142", supplierEmail: "bookings@gassafe.co.uk", escrowState: "evidence_pending" },
  { id: "o3", orderRef: "ORD-10235", propertyLabel: "22 Oak Ave", location: "Manchester M1", orderType: "Plumbing repair", supplierName: "FlowFix", supplierInitials: "FF", scheduledDate: "2026-06-15", escrowAmountPence: 36500, fundedAmountPence: 36500, milestoneStatus: "in_progress", evidenceStatus: "missing", slaStatus: "at_risk", risk: "high", status: "in_progress", supplierRating: 4.1, supplierPhone: "0161 496 0100", supplierEmail: "jobs@flowfix.co.uk", escrowState: "held" },
  { id: "o4", orderRef: "ORD-10233", propertyLabel: "Victoria Terrace", location: "Leeds LS1", orderType: "Electrical check", supplierName: "Voltify", supplierInitials: "VF", scheduledDate: "2026-06-22", escrowAmountPence: 22000, fundedAmountPence: 0, milestoneStatus: "not_started", evidenceStatus: "missing", slaStatus: "on_track", risk: "low", status: "assigned", supplierRating: 4.9, supplierPhone: "0113 496 0188", supplierEmail: "hello@voltify.co.uk", escrowState: "funding_pending" },
  { id: "o5", orderRef: "ORD-10229", propertyLabel: "Brunswick HMO", location: "Bristol BS1", orderType: "Deep clean", supplierName: "SparkleClean", supplierInitials: "SC", scheduledDate: "2026-06-17", escrowAmountPence: 18000, fundedAmountPence: 18000, milestoneStatus: "review", evidenceStatus: "submitted", slaStatus: "on_track", risk: "low", status: "in_progress", supplierRating: 4.7, supplierPhone: "0117 496 0123", supplierEmail: "team@sparkleclean.co.uk", escrowState: "review_pending" },
]

export const SEED_COMPLETED: CompletedOrderRow[] = [
  { id: "c1", orderRef: "ORD-10180", propertyLabel: "9 Birch Close", location: "London N1", orderType: "Boiler service", supplierName: "HeatPro Ltd", supplierInitials: "HP", scheduledDate: "2026-05-28", escrowAmountPence: 46000, fundedAmountPence: 46000, milestoneStatus: "completed", evidenceStatus: "approved", slaStatus: "on_track", risk: "low", status: "completed", completedDate: "2026-05-30", finalCostPence: 46000, payoutStatus: "paid", evidenceBundle: "6 photos · 1 cert", rating: 5 },
  { id: "c2", orderRef: "ORD-10175", propertyLabel: "Harbour View 12", location: "Bristol BS1", orderType: "Plumbing repair", supplierName: "FlowFix", supplierInitials: "FF", scheduledDate: "2026-05-24", escrowAmountPence: 28500, fundedAmountPence: 28500, milestoneStatus: "completed", evidenceStatus: "approved", slaStatus: "on_track", risk: "low", status: "completed", completedDate: "2026-05-26", finalCostPence: 31000, payoutStatus: "paid", evidenceBundle: "4 photos", rating: 4 },
  { id: "c3", orderRef: "ORD-10169", propertyLabel: "Manor Flat 1A", location: "London SE1", orderType: "Gas safety cert", supplierName: "Gas Safe Co", supplierInitials: "GS", scheduledDate: "2026-05-20", escrowAmountPence: 12000, fundedAmountPence: 12000, milestoneStatus: "completed", evidenceStatus: "approved", slaStatus: "on_track", risk: "low", status: "completed", completedDate: "2026-05-21", finalCostPence: 12000, payoutStatus: "pending", evidenceBundle: "1 cert", rating: 5 },
]

export const SEED_RFQS: RfqRow[] = [
  { id: "r1", rfqRef: "RFQ-2041", title: "Annual boiler service — 3 properties", propertyLabel: "Portfolio (3)", orderType: "Boiler service", quoteCount: 4, status: "comparing", createdAt: "2026-06-12", bestPricePence: 42000, savingsPence: 9000 },
  { id: "r2", rfqRef: "RFQ-2038", title: "Emergency plumbing — 22 Oak Ave", propertyLabel: "22 Oak Ave", orderType: "Plumbing", quoteCount: 3, status: "open", createdAt: "2026-06-14", bestPricePence: 31000, savingsPence: 5500 },
  { id: "r3", rfqRef: "RFQ-2030", title: "EICR electrical inspection", propertyLabel: "Victoria Terrace", orderType: "Electrical", quoteCount: 5, status: "approved", createdAt: "2026-06-08", bestPricePence: 19500, savingsPence: 4200 },
  { id: "r4", rfqRef: "RFQ-2022", title: "End-of-tenancy deep clean", propertyLabel: "Brunswick HMO", orderType: "Cleaning", quoteCount: 2, status: "expired", createdAt: "2026-05-30", bestPricePence: 16000, savingsPence: 0 },
]

export const SEED_QUOTES: QuoteRow[] = [
  { id: "q1", supplierName: "HeatPro Ltd", supplierInitials: "HP", priceExVatPence: 42000, etaDays: 3, leadTimeLabel: "3 working days", warrantyMonths: 12, insuranceCoverPence: 200000000, available: true, responseHours: 2, coverageArea: "Greater London", notes: "Gas Safe registered, OFTEC engineers. Includes parts.", recommendation: "best_match", status: "quoted" },
  { id: "q2", supplierName: "WarmServ", supplierInitials: "WS", priceExVatPence: 38500, etaDays: 5, leadTimeLabel: "5 working days", warrantyMonths: 6, insuranceCoverPence: 100000000, available: true, responseHours: 6, coverageArea: "London + Home Counties", notes: "Lowest headline price. Parts billed separately.", recommendation: "lowest_price", status: "quoted" },
  { id: "q3", supplierName: "BoilerCare", supplierInitials: "BC", priceExVatPence: 40000, etaDays: 2, leadTimeLabel: "2 working days", warrantyMonths: 24, insuranceCoverPence: 500000000, available: true, responseHours: 1, coverageArea: "Nationwide", notes: "Longest warranty, fastest response. Premium tier.", recommendation: "best_value", status: "quoted" },
  { id: "q4", supplierName: "QuickHeat", supplierInitials: "QH", priceExVatPence: 45000, etaDays: 7, leadTimeLabel: "7 working days", warrantyMonths: 6, insuranceCoverPence: 100000000, available: false, responseHours: 12, coverageArea: "London", notes: "Currently at capacity — limited availability.", recommendation: null, status: "requested" },
]

export const SEED_ESCROWS: EscrowRow[] = [
  { id: "e1", escrowId: "ESC-5102", orderRef: "ORD-10241", propertyLabel: "14 Grove St", supplierName: "HeatPro Ltd", totalHeldPence: 48000, fundedAmountPence: 48000, releaseDate: "2026-06-23", milestoneLabel: "Work in progress", milestoneProgress: 60, evidenceStatus: "partial", hasDispute: false, escrowState: "held" },
  { id: "e2", escrowId: "ESC-5098", orderRef: "ORD-10238", propertyLabel: "Manor Flat 3B", supplierName: "Gas Safe Co", totalHeldPence: 12000, fundedAmountPence: 12000, releaseDate: "2026-06-19", milestoneLabel: "Awaiting evidence", milestoneProgress: 80, evidenceStatus: "missing", hasDispute: false, escrowState: "evidence_pending" },
  { id: "e3", escrowId: "ESC-5095", orderRef: "ORD-10235", propertyLabel: "22 Oak Ave", supplierName: "FlowFix", totalHeldPence: 36500, fundedAmountPence: 36500, releaseDate: "2026-06-16", milestoneLabel: "Disputed", milestoneProgress: 40, evidenceStatus: "missing", hasDispute: true, escrowState: "disputed" },
  { id: "e4", escrowId: "ESC-5089", orderRef: "ORD-10229", propertyLabel: "Brunswick HMO", supplierName: "SparkleClean", totalHeldPence: 18000, fundedAmountPence: 18000, releaseDate: "2026-06-18", milestoneLabel: "Ready to release", milestoneProgress: 100, evidenceStatus: "approved", hasDispute: false, escrowState: "ready_to_release" },
]

export const SEED_PAYOUT_SPLITS: PayoutSplit[] = [
  { id: "ps1", splitType: "supplier_net", label: "Supplier net", amountPence: 40800, released: false },
  { id: "ps2", splitType: "platform_fee", label: "Platform fee (10%)", amountPence: 4800, released: false },
  { id: "ps3", splitType: "retention", label: "Retention (5%)", amountPence: 2400, released: false },
]

export const SEED_RELEASE_CONDITIONS: ReleaseCondition[] = [
  { id: "rc1", key: "completion", label: "Work marked complete", required: true, met: true },
  { id: "rc2", key: "evidence", label: "Evidence submitted & approved", required: true, met: false },
  { id: "rc3", key: "sign_off", label: "Operator sign-off", required: true, met: false },
  { id: "rc4", key: "dispute_free", label: "No open disputes", required: true, met: true },
]

export const SEED_ATTACHMENTS: OrderAttachment[] = [
  { id: "at1", name: "before-boiler.jpg", kind: "Photo", sizeLabel: "1.2 MB", uploadedAt: "2 days ago" },
  { id: "at2", name: "quote-heatpro.pdf", kind: "Quote", sizeLabel: "240 KB", uploadedAt: "4 days ago" },
  { id: "at3", name: "gas-safety-cert.pdf", kind: "Certificate", sizeLabel: "180 KB", uploadedAt: "1 day ago" },
]

export const SEED_ACTIVITY: OrderActivity[] = [
  { id: "ac1", kind: "status", text: "Order moved to In progress", actor: "HeatPro Ltd", at: "2h ago" },
  { id: "ac2", kind: "evidence", text: "Before photo uploaded", actor: "HeatPro Ltd", at: "5h ago" },
  { id: "ac3", kind: "schedule", text: "Scheduled for 20 Jun 2026", actor: "Jamahl T.", at: "1d ago" },
  { id: "ac4", kind: "status", text: "Supplier accepted assignment", actor: "HeatPro Ltd", at: "2d ago" },
  { id: "ac5", kind: "note", text: "Order created and funded into escrow", actor: "Jamahl T.", at: "2d ago" },
]

export const SEED_MILESTONES: OrderMilestone[] = [
  { id: "m1", label: "Assigned & funded", status: "done", due: "2026-06-13", amountPence: 0 },
  { id: "m2", label: "On-site attendance", status: "done", due: "2026-06-20", amountPence: 24000 },
  { id: "m3", label: "Work complete + evidence", status: "in_progress", due: "2026-06-21", amountPence: 24000 },
  { id: "m4", label: "Sign-off & release", status: "pending", due: "2026-06-23", amountPence: 0 },
]
