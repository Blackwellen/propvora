// ============================================================================
// Marketplace transactions — the COMMERCE KERNEL. Creates a
// `marketplace_transactions` row plus its matching append-only
// `marketplace_commission_ledger` entries, using the P1 fee contract
// (`calculateMarketplaceFee` / `FeeBreakdown` from ./fees) to split every
// transaction into platform fee, provider fee and seller payout.
//
// All money is integer pence. Workspace-scoped (buyer + seller) with RLS as the
// real boundary. 42P01-tolerant: a missing table never throws to the caller.
//
// Atomicity note: Supabase's PostgREST client has no client-side multi-statement
// transaction, so we insert the transaction header first, then the ledger
// entries. If the ledger insert fails we surface the error but DO NOT roll back
// the header (the immutable ledger is reconcilable downstream). The header is the
// source of truth for fee amounts; the ledger mirrors them as discrete entries.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { calculateMarketplaceFee, type FeeBreakdown, type MarketplaceTransactionType } from "./fees"

/** Lifecycle states for a marketplace transaction (mirrors the DB CHECK). */
export type TransactionStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "released"
  | "refunded"
  | "disputed"
  | "cancelled"

/** A marketplace transaction row. All amounts integer pence. */
export interface MarketplaceTransaction {
  id: string
  buyer_workspace_id: string
  seller_workspace_id: string
  listing_id: string | null
  transaction_type: MarketplaceTransactionType
  gross_pence: number
  platform_fee_pence: number
  provider_fee_pence: number
  seller_payout_pence: number
  net_platform_revenue_pence: number
  platform_fee_percent: number | null
  applied_fee_rule_id: string | null
  currency: string
  status: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

/** A single commission-ledger entry (append-only). */
export interface CommissionLedgerEntry {
  id: string
  transaction_id: string
  entry_type: "platform_fee" | "provider_fee" | "seller_payout" | "refund" | "adjustment"
  amount_pence: number
  currency: string
  created_at: string
}

/** Uniform tolerant result. */
export interface Result<T> {
  data: T | null
  error: string | null
}

/** A marketplace order row (the buyer-facing fulfilment record). */
export interface MarketplaceOrder {
  id: string
  workspace_id: string
  buyer_workspace_id: string | null
  seller_workspace_id: string | null
  listing_id: string | null
  transaction_id: string | null
  transaction_type: string | null
  title: string
  status: string
  gross_pence: number
  fee_pence: number
  payout_pence: number
  currency: string
  amount: number
  created_at: string | null
  updated_at: string | null
}

/** Result of {@link createMarketplaceTransaction}: header + fee split + ledger + order. */
export interface CreateTransactionResult {
  transaction: MarketplaceTransaction
  fee: FeeBreakdown
  ledger: CommissionLedgerEntry[]
  order: MarketplaceOrder | null
}

const TXN_COLUMNS =
  "id, buyer_workspace_id, seller_workspace_id, listing_id, transaction_type, " +
  "gross_pence, platform_fee_pence, provider_fee_pence, seller_payout_pence, " +
  "net_platform_revenue_pence, platform_fee_percent, applied_fee_rule_id, " +
  "currency, status, metadata, created_at, updated_at"

/** Allowed status transitions (state machine for a marketplace transaction). */
const ALLOWED_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  pending: ["authorized", "cancelled"],
  authorized: ["captured", "cancelled"],
  captured: ["released", "refunded", "disputed"],
  released: ["refunded", "disputed"],
  refunded: [],
  disputed: ["refunded", "released", "cancelled"],
  cancelled: [],
}

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

function toMessage(err: unknown): string {
  if (isMissingTable(err)) return "marketplace_unavailable"
  const e = err as { message?: string } | null
  return e?.message ?? "marketplace_error"
}

/** Inputs to {@link createMarketplaceTransaction}. */
export interface CreateTransactionArgs {
  supabase: SupabaseClient
  buyerWorkspaceId: string
  sellerWorkspaceId: string
  listingId?: string | null
  transactionType: MarketplaceTransactionType
  /** Gross amount in integer pence. */
  grossPence: number
  /** ISO 3166-1 alpha-2 country governing the fee rule. */
  countryCode: string
  /** Payment-provider fee in integer pence (default 0). */
  providerFeePence?: number
  /** Seller's plan tier (used by the fee resolver), if known. */
  sellerPlanTier?: string
  /** Listing category (used by the fee resolver), if known. */
  category?: string
  currency?: string
  metadata?: Record<string, unknown>
  /** Human title for the order row (NOT NULL in marketplace_orders). */
  orderTitle?: string
  /** Property the order relates to, if any. */
  propertyId?: string | null
}

/**
 * Create a marketplace transaction: resolve the fee via the P1 engine, insert
 * the transaction header, append the matching commission-ledger entries
 * (platform_fee, provider_fee when > 0, seller_payout), and create the
 * matching `marketplace_orders` fulfilment row. Best-effort sequence with real
 * error handling — the transaction header is the source of truth; a downstream
 * (ledger/order) failure is surfaced but does not roll back the header. Tolerant.
 * All money integer pence.
 */
export async function createMarketplaceTransaction(
  args: CreateTransactionArgs
): Promise<Result<CreateTransactionResult>> {
  const {
    supabase,
    buyerWorkspaceId,
    sellerWorkspaceId,
    transactionType,
    countryCode,
  } = args
  if (!buyerWorkspaceId || !sellerWorkspaceId) return { data: null, error: "workspace_required" }
  const grossPence = Math.max(0, Math.trunc(args.grossPence))
  const providerFeePence = Math.max(0, Math.trunc(args.providerFeePence ?? 0))
  const currency = args.currency ?? "GBP"

  try {
    // 1. Resolve the fee split via the P1 contract (DB-driven, fallback-safe).
    const fee = await calculateMarketplaceFee({
      supabase,
      countryCode,
      transactionType,
      planTier: args.sellerPlanTier,
      category: args.category,
      grossPence,
      providerFeePence,
    })

    // 2. Insert the transaction header.
    const { data: txn, error: txnErr } = await supabase
      .from("marketplace_transactions")
      .insert({
        buyer_workspace_id: buyerWorkspaceId,
        seller_workspace_id: sellerWorkspaceId,
        listing_id: args.listingId ?? null,
        transaction_type: transactionType,
        gross_pence: grossPence,
        platform_fee_pence: fee.platformFeePence,
        provider_fee_pence: fee.providerFeePence,
        seller_payout_pence: fee.sellerPayoutPence,
        net_platform_revenue_pence: fee.netPlatformRevenuePence,
        platform_fee_percent: fee.platformFeePercent,
        applied_fee_rule_id: fee.appliedRuleId,
        currency,
        status: "pending",
        metadata: args.metadata ?? {},
      })
      .select(TXN_COLUMNS)
      .single()
    if (txnErr) return { data: null, error: toMessage(txnErr) }
    const transaction = txn as unknown as MarketplaceTransaction

    // 3. Append the commission-ledger entries (mirror the fee split).
    const ledgerRows: Array<{ transaction_id: string; entry_type: string; amount_pence: number; currency: string }> = [
      { transaction_id: transaction.id, entry_type: "platform_fee", amount_pence: fee.platformFeePence, currency },
      { transaction_id: transaction.id, entry_type: "seller_payout", amount_pence: fee.sellerPayoutPence, currency },
    ]
    if (fee.providerFeePence > 0) {
      ledgerRows.splice(1, 0, {
        transaction_id: transaction.id,
        entry_type: "provider_fee",
        amount_pence: fee.providerFeePence,
        currency,
      })
    }

    let ledger: CommissionLedgerEntry[] = []
    const { data: ledgerData, error: ledgerErr } = await supabase
      .from("marketplace_commission_ledger")
      .insert(ledgerRows)
      .select("id, transaction_id, entry_type, amount_pence, currency, created_at")
    if (ledgerErr) {
      // Header is committed and is the source of truth; surface the ledger
      // failure but still return the transaction so the caller can reconcile.
      return {
        data: { transaction, fee, ledger: [], order: null },
        error: `ledger_insert_failed:${toMessage(ledgerErr)}`,
      }
    }
    ledger = (ledgerData as unknown as CommissionLedgerEntry[]) ?? []

    // 4. Create the matching fulfilment order. The legacy orders table requires
    // a NOT NULL title + amount (major units, kept for legacy readers); the
    // pence columns are the authoritative commerce figures.
    const orderTitle = args.orderTitle?.trim() || `Order · ${transactionType}`
    const { data: orderData, error: orderErr } = await supabase
      .from("marketplace_orders")
      .insert({
        workspace_id: buyerWorkspaceId,
        buyer_workspace_id: buyerWorkspaceId,
        seller_workspace_id: sellerWorkspaceId,
        listing_id: args.listingId ?? null,
        property_id: args.propertyId ?? null,
        transaction_id: transaction.id,
        transaction_type: transactionType,
        title: orderTitle,
        status: "pending",
        gross_pence: grossPence,
        fee_pence: fee.platformFeePence,
        payout_pence: fee.sellerPayoutPence,
        currency,
        amount: grossPence / 100,
        total_amount: grossPence / 100,
        metadata: args.metadata ?? {},
      })
      .select(ORDER_COLUMNS)
      .single()
    if (orderErr) {
      // Header + ledger are committed; surface the order failure for reconcile.
      return {
        data: { transaction, fee, ledger, order: null },
        error: `order_insert_failed:${toMessage(orderErr)}`,
      }
    }
    const order = (orderData as unknown as MarketplaceOrder) ?? null

    return { data: { transaction, fee, ledger, order }, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** Columns selected for an order read. */
const ORDER_COLUMNS =
  "id, workspace_id, buyer_workspace_id, seller_workspace_id, listing_id, " +
  "transaction_id, transaction_type, title, status, gross_pence, fee_pence, " +
  "payout_pence, currency, amount, created_at, updated_at"

/** Read a transaction, scoped to a workspace that is buyer OR seller. Tolerant. */
export async function getTransaction(
  supabase: SupabaseClient,
  workspaceId: string,
  transactionId: string
): Promise<Result<MarketplaceTransaction>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!transactionId) return { data: null, error: "transaction_required" }
  try {
    const { data, error } = await supabase
      .from("marketplace_transactions")
      .select(TXN_COLUMNS)
      .eq("id", transactionId)
      .or(`buyer_workspace_id.eq.${workspaceId},seller_workspace_id.eq.${workspaceId}`)
      .maybeSingle()
    if (error) return { data: null, error: toMessage(error) }
    return { data: (data as unknown as MarketplaceTransaction) ?? null, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** True when `to` is a valid next state from `from`. Exported for unit testing. */
export function isAllowedTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to)
}

/**
 * Transition a transaction to a new status, validating the state machine.
 * Workspace-scoped (buyer OR seller). Rejects invalid transitions WITHOUT a DB
 * write. Tolerant on store errors.
 */
export async function transitionTransactionStatus(
  supabase: SupabaseClient,
  workspaceId: string,
  transactionId: string,
  to: TransactionStatus
): Promise<Result<MarketplaceTransaction>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!transactionId) return { data: null, error: "transaction_required" }
  try {
    // Read current status (also enforces workspace scoping).
    const current = await getTransaction(supabase, workspaceId, transactionId)
    if (current.error) return { data: null, error: current.error }
    if (!current.data) return { data: null, error: "transaction_not_found" }

    const from = current.data.status as TransactionStatus
    if (from === to) return { data: current.data, error: null }
    if (!isAllowedTransition(from, to)) {
      return { data: null, error: `invalid_transition:${from}->${to}` }
    }

    const { data, error } = await supabase
      .from("marketplace_transactions")
      .update({ status: to })
      .eq("id", transactionId)
      .or(`buyer_workspace_id.eq.${workspaceId},seller_workspace_id.eq.${workspaceId}`)
      .select(TXN_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as unknown as MarketplaceTransaction, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}
