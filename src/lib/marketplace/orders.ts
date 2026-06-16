// ============================================================================
// Marketplace orders — buyer/seller fulfilment records over `marketplace_orders`.
//
// An order is created alongside a transaction by the commerce kernel
// (createMarketplaceTransaction). This module reads orders from the buyer OR
// seller side and transitions order status through a validated lifecycle state
// machine. Workspace-scoped (RLS is the real boundary); 42P01-tolerant.
//
// Order lifecycle (mirrors the DB CHECK on marketplace_orders.status):
//   pending → accepted → active → completed
//   (accepted|active) → disputed → (completed|cancelled|refunded)
//   pending → cancelled ; completed → refunded
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import type { MarketplaceOrder } from "./transactions"
import { type Result, toErrorMessage, isMissingObject } from "./types"

export type { MarketplaceOrder }

/** Order lifecycle states (mirror the DB CHECK constraint). */
export type OrderStatus =
  | "pending"
  | "accepted"
  | "active"
  | "completed"
  | "disputed"
  | "cancelled"
  | "refunded"

/** Valid order status transitions. */
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["active", "disputed", "cancelled"],
  active: ["completed", "disputed", "cancelled"],
  completed: ["refunded", "disputed"],
  disputed: ["completed", "cancelled", "refunded"],
  cancelled: [],
  refunded: [],
}

const ORDER_COLUMNS =
  "id, workspace_id, buyer_workspace_id, seller_workspace_id, listing_id, " +
  "transaction_id, transaction_type, title, status, gross_pence, fee_pence, " +
  "payout_pence, currency, amount, created_at, updated_at"

/** True when `to` is a valid next state from `from`. Pure; exported for tests. */
export function isAllowedOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ORDER_TRANSITIONS[from] ?? []).includes(to)
}

/** Which side of an order a workspace is viewing. */
export type OrderSide = "buyer" | "seller" | "any"

/** Options for {@link listOrders}. */
export interface ListOrdersOptions {
  side?: OrderSide
  status?: OrderStatus
  limit?: number
  offset?: number
}

/**
 * List orders for a workspace, from the buyer side, seller side, or either.
 * Most recent first. Tolerant → [] on a missing table.
 */
export async function listOrders(
  supabase: SupabaseClient,
  workspaceId: string,
  options: ListOrdersOptions = {}
): Promise<Result<MarketplaceOrder[]>> {
  if (!workspaceId) return { data: [], error: "workspace_required" }
  const side = options.side ?? "any"
  try {
    let query = supabase
      .from("marketplace_orders")
      .select(ORDER_COLUMNS)
      .order("created_at", { ascending: false })

    if (side === "buyer") query = query.eq("buyer_workspace_id", workspaceId)
    else if (side === "seller") query = query.eq("seller_workspace_id", workspaceId)
    else
      query = query.or(
        `buyer_workspace_id.eq.${workspaceId},seller_workspace_id.eq.${workspaceId},workspace_id.eq.${workspaceId}`
      )

    if (options.status) query = query.eq("status", options.status)
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200)
    const offset = Math.max(options.offset ?? 0, 0)
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) {
      if (isMissingObject(error)) return { data: [], error: null }
      return { data: [], error: toErrorMessage(error) }
    }
    return { data: (data as unknown as MarketplaceOrder[]) ?? [], error: null }
  } catch (err) {
    if (isMissingObject(err)) return { data: [], error: null }
    return { data: [], error: toErrorMessage(err) }
  }
}

/** Read one order scoped to a workspace that is buyer OR seller. Tolerant. */
export async function getOrder(
  supabase: SupabaseClient,
  workspaceId: string,
  orderId: string
): Promise<Result<MarketplaceOrder>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!orderId) return { data: null, error: "order_required" }
  try {
    const { data, error } = await supabase
      .from("marketplace_orders")
      .select(ORDER_COLUMNS)
      .eq("id", orderId)
      .or(
        `buyer_workspace_id.eq.${workspaceId},seller_workspace_id.eq.${workspaceId},workspace_id.eq.${workspaceId}`
      )
      .maybeSingle()
    if (error) return { data: null, error: toErrorMessage(error) }
    return { data: (data as unknown as MarketplaceOrder) ?? null, error: null }
  } catch (err) {
    return { data: null, error: toErrorMessage(err) }
  }
}

/**
 * Transition an order to a new status, validating the state machine. Rejects an
 * invalid transition WITHOUT a DB write. Workspace-scoped (buyer OR seller).
 * Tolerant on store errors.
 */
export async function transitionOrderStatus(
  supabase: SupabaseClient,
  workspaceId: string,
  orderId: string,
  to: OrderStatus
): Promise<Result<MarketplaceOrder>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!orderId) return { data: null, error: "order_required" }
  try {
    const current = await getOrder(supabase, workspaceId, orderId)
    if (current.error) return { data: null, error: current.error }
    if (!current.data) return { data: null, error: "order_not_found" }

    const from = current.data.status as OrderStatus
    if (from === to) return { data: current.data, error: null }
    if (!isAllowedOrderTransition(from, to)) {
      return { data: null, error: `invalid_transition:${from}->${to}` }
    }

    const { data, error } = await supabase
      .from("marketplace_orders")
      .update({ status: to, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .or(
        `buyer_workspace_id.eq.${workspaceId},seller_workspace_id.eq.${workspaceId},workspace_id.eq.${workspaceId}`
      )
      .select(ORDER_COLUMNS)
      .single()
    if (error) return { data: null, error: toErrorMessage(error) }
    return { data: data as unknown as MarketplaceOrder, error: null }
  } catch (err) {
    return { data: null, error: toErrorMessage(err) }
  }
}
