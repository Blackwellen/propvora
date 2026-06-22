"use server"

// ============================================================================
// Generic FCA-safe DIRECT PAYMENT recording — reused anywhere Propvora helps an
// operator/tenant pay a payee DIRECTLY (a tradesperson, a landlord) and just
// records + reconciles it. Propvora NEVER collects or holds this money.
//
// Stored in the target row's `metadata` jsonb (no schema change):
//   • mode "single"  → metadata.payment        (e.g. a one-off supplier invoice)
//   • mode "append"  → metadata.payments[]      (e.g. recurring monthly rent)
// Workspace-scoped via the caller's session (RLS). Shared by the supplier-job
// payment panel and the rent payment panel.
// ============================================================================

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type DirectPaymentTable = "supplier_jobs" | "tenancies"
export type PaymentMethod = "bank_transfer" | "direct_debit" | "card" | "cash" | "cheque" | "other"

export interface DirectPaymentInput {
  table: DirectPaymentTable
  id: string
  amountPence: number
  method: PaymentMethod
  reference?: string
  paidAt?: string
  /** Recurring label, e.g. "Aug 2026" for rent. */
  periodLabel?: string
  /** "single" overwrites metadata.payment; "append" pushes to metadata.payments[]. */
  mode?: "single" | "append"
  /** Path to revalidate after the write. */
  revalidate?: string
}

export interface DirectPaymentResult {
  ok: boolean
  error?: string
  paymentId?: string
}

async function loadMeta(table: DirectPaymentTable, id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." as const }
  const { data, error } = await supabase.from(table).select("id, metadata").eq("id", id).maybeSingle()
  if (error || !data) return { error: "Record not found." as const }
  return { supabase, user, meta: (data.metadata as Record<string, unknown> | null) ?? {} }
}

export async function recordDirectPayment(input: DirectPaymentInput): Promise<DirectPaymentResult> {
  const { table, id, amountPence, method, mode = "single" } = input
  if (!id) return { ok: false, error: "Missing record id." }
  if (!(amountPence > 0)) return { ok: false, error: "Enter a payment amount." }

  const ctx = await loadMeta(table, id)
  if ("error" in ctx) return { ok: false, error: ctx.error }
  const { supabase, user, meta } = ctx

  const paymentId = `pay_${Date.now().toString(36)}`
  const entry = {
    id: paymentId,
    status: "paid",
    amount_pence: Math.trunc(amountPence),
    method,
    reference: input.reference?.trim() || null,
    period: input.periodLabel || null,
    paid_at: input.paidAt || new Date().toISOString().slice(0, 10),
    recorded_by: user.id,
    recorded_at: new Date().toISOString(),
  }

  let nextMeta: Record<string, unknown>
  if (mode === "append") {
    const list = Array.isArray((meta as { payments?: unknown }).payments) ? (meta as { payments: unknown[] }).payments : []
    nextMeta = { ...meta, payments: [...list, entry] }
  } else {
    nextMeta = { ...meta, payment: entry }
  }

  const { error } = await supabase.from(table).update({ metadata: nextMeta, updated_at: new Date().toISOString() }).eq("id", id)
  if (error) return { ok: false, error: "Could not record the payment." }
  if (input.revalidate) revalidatePath(input.revalidate)
  return { ok: true, paymentId }
}

export async function clearDirectPayment(args: {
  table: DirectPaymentTable
  id: string
  mode?: "single" | "append"
  paymentId?: string
  revalidate?: string
}): Promise<DirectPaymentResult> {
  const { table, id, mode = "single", paymentId } = args
  if (!id) return { ok: false, error: "Missing record id." }
  const ctx = await loadMeta(table, id)
  if ("error" in ctx) return { ok: false, error: ctx.error }
  const { supabase, meta } = ctx

  let nextMeta: Record<string, unknown> = { ...meta }
  if (mode === "append") {
    const list = Array.isArray((meta as { payments?: unknown }).payments) ? (meta as { payments: { id?: string }[] }).payments : []
    nextMeta.payments = list.filter((p) => p.id !== paymentId)
  } else {
    delete (nextMeta as { payment?: unknown }).payment
  }

  const { error } = await supabase.from(table).update({ metadata: nextMeta, updated_at: new Date().toISOString() }).eq("id", id)
  if (error) return { ok: false, error: "Could not clear the payment." }
  if (args.revalidate) revalidatePath(args.revalidate)
  return { ok: true }
}
