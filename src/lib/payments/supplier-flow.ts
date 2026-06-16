import "server-only"

/**
 * P5+ — SUPPLIER-JOB MONEY FLOW ENGINE (DB state machine, gated).
 *
 * Orchestrates the supplier-job escrow lifecycle as DB state + balancing ledger
 * entries, with the release-block gate enforced before any payout:
 *
 *   authoriseHold → (evidence approved) → release  [BLOCKED if gates fire]
 *
 * Concretely:
 *   1. authoriseSupplierJob — record the captured escrow_payment ('captured') +
 *      its escrow_hold ('held'), and post the "funded into escrow" journal.
 *   2. releaseSupplierJob — evaluate canReleaseFunds(); ONLY if allowed:
 *        • flip escrow_hold → released, escrow_payment → released;
 *        • append marketplace_commission_ledger (platform_fee, seller_payout);
 *        • create the payout row (pending) + payout_ledger entries;
 *        • post the "released" + "payout" journals (commission income + payable).
 *      If BLOCKED, nothing money-bearing happens; the block audit is recorded.
 *
 * This NEVER calls Stripe. It records DB state that a real Connect transfer (and
 * its webhook) will confirm — the payout row stays 'pending' until the
 * transfer.created / payout.paid webhook advances it. The commission/payout
 * LEDGER entries here are the platform's own append-only accounting; they do not
 * assert money left Stripe.
 *
 * Money is integer pence. Append-only ledgers. Workspace-scoped.
 */

import { recordPayout } from "./connect-transfers"
import { canReleaseFunds, type ReleaseContext, type ReleaseDecision } from "./release-blocks"
import {
  loadMoneyAccounts,
  buildSupplierFunded,
  buildSupplierReleased,
  buildSupplierPayout,
} from "@/lib/accounting/payments-journal"
import { postJournalEntry } from "@/lib/accounting/ledger"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface SupplierFlowSupabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc?: (fn: string, params: Record<string, unknown>) => any
}

export interface AuthoriseSupplierJobArgs {
  workspaceId: string
  jobRef: string
  grossPence: number
  processingFeePence?: number
  currency?: string
  /** Optional linkage for downstream gating + reconciliation. */
  transactionId?: string | null
  supplierJobAssignmentId?: string | null
  createdBy?: string | null
  /** When true (default) also post the "funded into escrow" journal. */
  postJournal?: boolean
}

export interface AuthoriseResult {
  paymentId: string
  holdId: string
  journalPosted: boolean
}

/**
 * authoriseSupplierJob — record the captured escrow payment + hold for a
 * supplier job, post the funding journal. (In production the capture itself is a
 * verified Stripe event; this records the resulting DB state + accounting.)
 */
export async function authoriseSupplierJob(
  supabase: SupplierFlowSupabase,
  args: AuthoriseSupplierJobArgs
): Promise<AuthoriseResult> {
  const gross = Math.max(0, Math.trunc(args.grossPence))
  const currency = (args.currency ?? "GBP").toUpperCase()

  const { data: payment, error: payErr } = await supabase
    .from("escrow_payments")
    .insert({
      workspace_id: args.workspaceId,
      transaction_id: args.transactionId ?? null,
      amount_pence: gross,
      currency,
      platform_fee_pence: 0,
      capture_method: "manual",
      status: "captured",
      escrow: true,
      payment_model: "platform_hold",
      flow: "supplier_job",
    })
    .select("id")
    .single()
  if (payErr) throw payErr
  const paymentId = (payment as { id: string }).id

  const { data: hold, error: holdErr } = await supabase
    .from("escrow_holds")
    .insert({
      payment_id: paymentId,
      workspace_id: args.workspaceId,
      hold_type: "payment",
      amount_pence: gross,
      status: "held",
      release_condition: "evidence_approved",
    })
    .select("id")
    .single()
  if (holdErr) throw holdErr
  const holdId = (hold as { id: string }).id

  let journalPosted = false
  if (args.postJournal !== false) {
    const accounts = await loadMoneyAccounts(supabase as unknown as SupabaseClient, args.workspaceId)
    const entry = buildSupplierFunded(accounts, {
      workspaceId: args.workspaceId,
      jobRef: args.jobRef,
      sourceId: paymentId,
      grossPence: gross,
      processingFeePence: args.processingFeePence ?? 0,
      createdBy: args.createdBy ?? null,
    })
    await postJournalEntry(supabase as unknown as SupabaseClient, entry)
    journalPosted = true
  }

  return { paymentId, holdId, journalPosted }
}

export interface ReleaseSupplierJobArgs {
  workspaceId: string
  jobRef: string
  paymentId: string
  grossPence: number
  /** Platform commission retained, integer pence. */
  commissionPence: number
  providerFeePence?: number
  currency?: string
  /** Recipient seller/supplier workspace for the payout row. */
  supplierWorkspaceId: string
  connectAccountId?: string | null
  transactionId?: string | null
  supplierJobAssignmentId?: string | null
  /** Verification gating inputs. */
  jobRisk?: ReleaseContext["jobRisk"]
  jobCategory?: string | null
  createdBy?: string | null
  /** When true (default) also post the released + payout journals. */
  postJournal?: boolean
}

export interface ReleaseResult {
  released: boolean
  decision: ReleaseDecision
  payoutId?: string
  netPence?: number
  journalsPosted?: number
}

/**
 * releaseSupplierJob — GATED release. Evaluates the release-block engine first
 * (NEVER fails open); if any gate is active, returns released:false with the
 * decision and performs NO money-bearing writes. If allowed, advances the
 * escrow/payment, appends the commission ledger, records the payout, and posts
 * the released + payout journals.
 */
export async function releaseSupplierJob(
  supabase: SupplierFlowSupabase,
  args: ReleaseSupplierJobArgs
): Promise<ReleaseResult> {
  const gross = Math.max(0, Math.trunc(args.grossPence))
  const commission = Math.max(0, Math.trunc(args.commissionPence))
  const providerFee = Math.max(0, Math.trunc(args.providerFeePence ?? 0))
  const net = Math.max(0, gross - commission - providerFee)
  const currency = (args.currency ?? "GBP").toUpperCase()

  // ── GATE ───────────────────────────────────────────────────────────────────
  const decision = await canReleaseFunds(supabase, {
    workspaceId: args.workspaceId,
    paymentId: args.paymentId,
    transactionId: args.transactionId ?? null,
    supplierJobId: args.supplierJobAssignmentId ?? null,
    supplierWorkspaceId: args.supplierWorkspaceId,
    jobRisk: args.jobRisk ?? null,
    jobCategory: args.jobCategory ?? null,
    evaluatedBy: args.createdBy ?? null,
  })
  if (!decision.allowed) {
    return { released: false, decision }
  }

  // ── Advance escrow + payment ────────────────────────────────────────────────
  const nowIso = new Date().toISOString()
  await supabase
    .from("escrow_holds")
    .update({ status: "released", released_at: nowIso, updated_at: nowIso })
    .eq("payment_id", args.paymentId)
    .eq("status", "held")
  await supabase
    .from("escrow_payments")
    .update({ status: "released", updated_at: nowIso })
    .eq("id", args.paymentId)
    .neq("status", "released")

  // ── Commission ledger (append-only) ─────────────────────────────────────────
  if (args.transactionId) {
    await supabase.from("marketplace_commission_ledger").insert([
      { transaction_id: args.transactionId, entry_type: "platform_fee", amount_pence: commission, currency },
      { transaction_id: args.transactionId, entry_type: "seller_payout", amount_pence: net, currency },
      ...(providerFee > 0
        ? [{ transaction_id: args.transactionId, entry_type: "provider_fee", amount_pence: providerFee, currency }]
        : []),
    ])
  }

  // ── Payout row (pending) + payout_ledger ─────────────────────────────────────
  const payout = await recordPayout(supabase as unknown as SupabaseClient, {
    workspaceId: args.supplierWorkspaceId,
    amountPence: net,
    currency,
    connectAccountId: args.connectAccountId ?? null,
    paymentId: args.paymentId,
    platformFeePence: commission,
  })

  // ── Journals (released + payout) ─────────────────────────────────────────────
  let journalsPosted = 0
  if (args.postJournal !== false) {
    const accounts = await loadMoneyAccounts(supabase as unknown as SupabaseClient, args.workspaceId)
    await postJournalEntry(
      supabase as unknown as SupabaseClient,
      buildSupplierReleased(accounts, {
        workspaceId: args.workspaceId,
        jobRef: args.jobRef,
        sourceId: args.paymentId,
        grossPence: gross,
        commissionPence: commission,
        providerFeePence: providerFee,
        createdBy: args.createdBy ?? null,
      })
    )
    journalsPosted += 1
    await postJournalEntry(
      supabase as unknown as SupabaseClient,
      buildSupplierPayout(accounts, {
        workspaceId: args.workspaceId,
        jobRef: args.jobRef,
        sourceId: args.paymentId,
        netPence: net,
        createdBy: args.createdBy ?? null,
      })
    )
    journalsPosted += 1
  }

  return { released: true, decision, payoutId: payout.id, netPence: net, journalsPosted }
}
