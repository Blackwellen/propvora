import type {
  ManagedEscrowRow, EscrowEvidenceItem, EscrowMilestoneItem,
  EscrowReleaseConditionItem, EscrowTimelineItem, EscrowSplitItem,
  EscrowCashflowPoint, EscrowProjectionPoint,
} from "./types"

export const SEED_MANAGED_ESCROWS: ManagedEscrowRow[] = [
  { id: "m1", escrowId: "ESC-5102", linkedType: "service_order", reference: "ORD-10241", counterparty: "HeatPro Ltd", counterpartyInitials: "HP", propertyLabel: "14 Grove St", amountHeldPence: 48000, fundedAmountPence: 48000, releaseDate: "2026-06-23", stage: "held", evidenceStatus: "partial", releaseRule: "On completion + evidence", risk: "low", hasDispute: false, milestoneProgress: 60 },
  { id: "m2", escrowId: "ESC-5098", linkedType: "service_order", reference: "ORD-10238", counterparty: "Gas Safe Co", counterpartyInitials: "GS", propertyLabel: "Manor Flat 3B", amountHeldPence: 12000, fundedAmountPence: 12000, releaseDate: "2026-06-19", stage: "evidence_pending", evidenceStatus: "missing", releaseRule: "On completion + evidence", risk: "medium", hasDispute: false, milestoneProgress: 80 },
  { id: "m3", escrowId: "ESC-5095", linkedType: "service_order", reference: "ORD-10235", counterparty: "FlowFix", counterpartyInitials: "FF", propertyLabel: "22 Oak Ave", amountHeldPence: 36500, fundedAmountPence: 36500, releaseDate: "2026-06-16", stage: "disputed", evidenceStatus: "missing", releaseRule: "On completion + sign-off", risk: "high", hasDispute: true, milestoneProgress: 40 },
  { id: "m4", escrowId: "ESC-5089", linkedType: "service_order", reference: "ORD-10229", counterparty: "SparkleClean", counterpartyInitials: "SC", propertyLabel: "Brunswick HMO", amountHeldPence: 18000, fundedAmountPence: 18000, releaseDate: "2026-06-18", stage: "ready_to_release", evidenceStatus: "approved", releaseRule: "On completion + evidence", risk: "low", hasDispute: false, milestoneProgress: 100 },
  { id: "m5", escrowId: "ESC-5081", linkedType: "booking", reference: "BKG-3320", counterparty: "A. Whitfield", counterpartyInitials: "AW", propertyLabel: "Harbour View 12", amountHeldPence: 64000, fundedAmountPence: 64000, releaseDate: "2026-06-25", stage: "funded", evidenceStatus: "submitted", releaseRule: "On check-out + no claim", risk: "low", hasDispute: false, milestoneProgress: 30 },
  { id: "m6", escrowId: "ESC-5074", linkedType: "booking", reference: "BKG-3315", counterparty: "M. Osei", counterpartyInitials: "MO", propertyLabel: "9 Birch Close", amountHeldPence: 28000, fundedAmountPence: 28000, releaseDate: "2026-06-21", stage: "review_pending", evidenceStatus: "submitted", releaseRule: "On check-out + no claim", risk: "medium", hasDispute: false, milestoneProgress: 90 },
]

export const SEED_E_EVIDENCE: EscrowEvidenceItem[] = [
  { id: "ev1", name: "before-kitchen.jpg", phase: "before", approved: true, uploadedAt: "2 days ago" },
  { id: "ev2", name: "during-pipe.jpg", phase: "during", approved: false, uploadedAt: "5h ago" },
  { id: "ev3", name: "completion-cert.pdf", phase: "after", approved: false, uploadedAt: "3h ago" },
]

export const SEED_E_MILESTONES: EscrowMilestoneItem[] = [
  { id: "em1", label: "Funded into escrow", done: true },
  { id: "em2", label: "Supplier attended", done: true },
  { id: "em3", label: "Work complete", done: false },
  { id: "em4", label: "Evidence approved", done: false },
  { id: "em5", label: "Released", done: false },
]

export const SEED_E_CONDITIONS: EscrowReleaseConditionItem[] = [
  { id: "ec1", label: "Work marked complete", required: true, met: true },
  { id: "ec2", label: "Evidence submitted & approved", required: true, met: false },
  { id: "ec3", label: "Operator sign-off", required: true, met: false },
  { id: "ec4", label: "No open disputes", required: true, met: true },
]

export const SEED_E_TIMELINE: EscrowTimelineItem[] = [
  { id: "et1", fromState: "funded", toState: "held", reason: "Supplier accepted", actor: "System", at: "2d ago" },
  { id: "et2", fromState: "held", toState: "evidence_pending", reason: "Awaiting completion evidence", actor: "System", at: "1d ago" },
  { id: "et3", fromState: null, toState: "funded", reason: "Buyer authorised + funded", actor: "Jamahl T.", at: "3d ago" },
]

export const SEED_E_SPLITS: EscrowSplitItem[] = [
  { id: "es1", label: "Supplier net", amountPence: 40800, released: false },
  { id: "es2", label: "Platform fee (10%)", amountPence: 4800, released: false },
  { id: "es3", label: "Retention (5%)", amountPence: 2400, released: false },
]

export const SEED_CASHFLOW: EscrowCashflowPoint[] = [
  { month: "Feb", inflowPence: 182000, releasedPence: 140000 },
  { month: "Mar", inflowPence: 224000, releasedPence: 198000 },
  { month: "Apr", inflowPence: 196000, releasedPence: 210000 },
  { month: "May", inflowPence: 268000, releasedPence: 224000 },
  { month: "Jun", inflowPence: 206500, releasedPence: 96000 },
]

export const SEED_PROJECTION: EscrowProjectionPoint[] = [
  { date: "Jun 18", projectedReleasePence: 18000 },
  { date: "Jun 19", projectedReleasePence: 30000 },
  { date: "Jun 21", projectedReleasePence: 58000 },
  { date: "Jun 23", projectedReleasePence: 106000 },
  { date: "Jun 25", projectedReleasePence: 170000 },
]
