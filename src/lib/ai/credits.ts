import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getWorkspaceTier } from "@/lib/billing/gates"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PlanTier } from "@/lib/billing/plans"

// ============================================================================
// AI credit-class economics.
//
// A single flat "AI message" credit is wrong: a chat turn on DeepSeek costs us
// a fraction of a penny, while an Opus-class agent run with web search + doc
// generation can cost pounds. If they shared one budget, a handful of heavy
// runs would silently drain a user's whole conversational allowance (or, worse,
// our margin). So usage is metered in ONE ledger but across credit CLASSES,
// each with its own monthly allowance:
//
//   • conversation — chat turns, reads, retrieval, context resolve. High volume,
//                    routed to cheap models, effectively a rounding error. We
//                    meter it for telemetry but never hard-block on it (the
//                    abuse caps in caps.ts already bound spend).
//   • action       — writes, edits, drafted/sent emails, automation runs.
//                    State-changing; deserves its own budget + visible limit.
//   • intelligence — web/market search, document extract/generate, agent runs.
//                    External + heavy compute = real £. This is the class that
//                    protects margin and drives credit-pack / AI-Pro upsell.
//   • monitoring   — scheduled background monitor cycles. Always-on cost; bundled
//                    per plan so it can't surprise-bill a conversational user.
//
// Pricing principle: 1 credit ≈ £0.02 RETAIL. Op costs below are set to cover
// the true provider £ (cheapest-model routing — see routing.ts) plus margin.
// On cheap-first routing even agent runs are pennies, so the included monthly
// allowances are generous; packs/AI-Pro exist for genuinely heavy users.
//
// SAFETY: every DB touch here is best-effort and FAILS OPEN. If the credit
// tables aren't migrated yet, or a balance row is missing, we allow the call
// (caps.ts remains the hard spend guard). Credits add metering + upsell; they
// must never be the thing that breaks a paying user's request on a hiccup.
// ============================================================================

export type CreditClass = "conversation" | "action" | "intelligence" | "monitoring"

export const CREDIT_CLASSES: CreditClass[] = [
  "conversation",
  "action",
  "intelligence",
  "monitoring",
]

/** Retail value of one credit, GBP. Used for cost previews + pack pricing. */
export const CREDIT_VALUE_GBP = 0.02

export interface CreditCost {
  class: CreditClass
  /** Flat credits charged per operation. */
  base: number
  /**
   * Optional per-unit add-on (e.g. per email recipient, per document page, per
   * agent step, per 1k tokens). Multiplied by the `units` passed to estimate().
   */
  perUnit?: number
  /** Human label for the unit, for cost-preview copy ("per page", "per step"). */
  unit?: string
}

/**
 * Operation → credit cost. Keys are stable operation_keys also stored in the
 * ai_credit_costs table (DB is the override source of truth; this is the
 * compiled default + the shape the code reasons about).
 */
export const CREDIT_COSTS: Record<string, CreditCost> = {
  // ── Conversation (cheap, metered-not-blocked) ──────────────────────────────
  "chat.turn": { class: "conversation", base: 1, perUnit: 1, unit: "per 1k tokens" },
  "tool.read": { class: "conversation", base: 0 },
  "context.resolve": { class: "conversation", base: 0 },
  "retrieve.search": { class: "conversation", base: 1 },
  "embed": { class: "conversation", base: 1, perUnit: 1, unit: "per 1k tokens" },

  // ── Action (state-changing) ────────────────────────────────────────────────
  "record.create": { class: "action", base: 1 },
  "record.update": { class: "action", base: 1 },
  "record.delete": { class: "action", base: 1 },
  "comms.email.draft": { class: "action", base: 1 },
  "comms.email.send": { class: "action", base: 2, perUnit: 1, unit: "per recipient" },
  "automation.build": { class: "action", base: 3 },
  "automation.run": { class: "action", base: 2 },
  "form.apply": { class: "action", base: 1 },
  "memory.write": { class: "action", base: 0 },

  // ── Intelligence (external + heavy — the margin-protecting class) ───────────
  "web.search": { class: "intelligence", base: 5 }, //          ~£0.10 covers provider + read tokens + margin
  "market.comparables": { class: "intelligence", base: 5 },
  "doc.extract": { class: "intelligence", base: 5, perUnit: 5, unit: "per page" },
  "doc.generate": { class: "intelligence", base: 10 },
  "agent.run": { class: "intelligence", base: 25, perUnit: 5, unit: "per step" }, // Kimi-class default
  "agent.run.premium": { class: "intelligence", base: 60, perUnit: 12, unit: "per step" }, // Sonnet/Opus escalation

  // ── Monitoring (background, plan-bundled) ──────────────────────────────────
  "monitor.cycle": { class: "monitoring", base: 2 },
}

/**
 * Monthly INCLUDED credit allowance per plan, per class. Conversation is set
 * high (it's effectively free to serve); intelligence is the differentiated,
 * upsell-driving class and climbs sharply with tier. Starter/Operator get no
 * Copilot today (gateAiCopilot blocks them) so their allowances are 0 and only
 * matter if the gate is relaxed or an AI-Pro add-on is attached.
 *
 * UNLIM is represented by Number.MAX_SAFE_INTEGER (Enterprise).
 */
const UNLIM = Number.MAX_SAFE_INTEGER

export const PLAN_CREDIT_ALLOWANCES: Record<PlanTier, Record<CreditClass, number>> = {
  starter: { conversation: 0, action: 0, intelligence: 0, monitoring: 0 },
  operator: { conversation: 0, action: 0, intelligence: 0, monitoring: 0 },
  scale: { conversation: 5_000, action: 750, intelligence: 400, monitoring: 300 },
  pro_agency: { conversation: 25_000, action: 4_000, intelligence: 2_500, monitoring: 1_500 },
  enterprise: { conversation: UNLIM, action: UNLIM, intelligence: UNLIM, monitoring: UNLIM },
}

/** Credit packs / AI-Pro add-on grants, applied on top of plan allowance. */
export interface CreditGrant {
  key: string
  label: string
  /** Credits added, keyed by class. */
  grant: Partial<Record<CreditClass, number>>
  /** Price in pence (display only — Stripe price is the source of truth). */
  pricePence: number
}

export const CREDIT_PACKS: CreditGrant[] = [
  {
    key: "ai_pro_addon",
    label: "AI Pro add-on",
    grant: { conversation: 10_000, action: 2_000, intelligence: 1_500, monitoring: 1_000 },
    pricePence: 2_900, // £29/mo
  },
  {
    key: "intelligence_pack_1k",
    label: "Intelligence pack (1,000)",
    grant: { intelligence: 1_000 },
    pricePence: 2_000, // £20 one-off — heavy market/doc/agent users
  },
  {
    key: "action_pack_1k",
    label: "Action pack (1,000)",
    grant: { action: 1_000 },
    pricePence: 1_500, // £15 one-off
  },
]

// ── Estimation ───────────────────────────────────────────────────────────────

/**
 * Estimate the credit cost of an operation. `units` multiplies the per-unit
 * component (recipients / pages / steps / 1k-token blocks). Returns 0 for
 * unknown ops (never block on a cost we can't price).
 */
export function estimateCredits(operationKey: string, units = 0): number {
  const cost = CREDIT_COSTS[operationKey]
  if (!cost) return 0
  return cost.base + (cost.perUnit ?? 0) * Math.max(0, units)
}

/** Map a finished chat turn's token usage to conversation credits (1 per 1k). */
export function creditsForTokens(tokensIn: number, tokensOut: number): number {
  return Math.max(1, Math.ceil((tokensIn + tokensOut) / 1000))
}

/** Class an operation belongs to (for balance checks + ledger writes). */
export function classForOperation(operationKey: string): CreditClass | null {
  return CREDIT_COSTS[operationKey]?.class ?? null
}

/** Plain-English cost preview for an approval card / pre-flight modal. */
export function describeCost(operationKey: string, units = 0): {
  credits: number
  gbp: number
  class: CreditClass | null
} {
  const credits = estimateCredits(operationKey, units)
  return {
    credits,
    gbp: Number((credits * CREDIT_VALUE_GBP).toFixed(2)),
    class: classForOperation(operationKey),
  }
}

// ── Balances (best-effort, fail-open) ─────────────────────────────────────────

export interface ClassBalance {
  class: CreditClass
  allowance: number
  used: number
  remaining: number
}

function periodBounds(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/**
 * Resolve per-class balances for a workspace this billing period. Reads the
 * plan allowance, sums any active grants (AI-Pro / packs) and the credits
 * already spent (from ai_credit_ledger). Fails OPEN: on any store error it
 * returns the plan allowance with 0 used so the UI still shows a sane meter and
 * nothing is wrongly blocked.
 */
export async function getCreditBalances(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ClassBalance[]> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const allowance = { ...PLAN_CREDIT_ALLOWANCES[tier] }

  // Active grants (AI-Pro add-on / credit packs) layered on top of plan.
  try {
    const { data: grants } = await supabase
      .from("ai_credit_balances")
      .select("credit_class, allowance")
      .eq("workspace_id", workspaceId)
    if (Array.isArray(grants)) {
      for (const g of grants) {
        const k = g.credit_class as CreditClass
        if (k in allowance && allowance[k] !== UNLIM) {
          allowance[k] += Number((g as { allowance?: number }).allowance ?? 0)
        }
      }
    }
  } catch {
    /* fail open — plan allowance only */
  }

  // Credits spent this period, per class.
  const used: Record<CreditClass, number> = {
    conversation: 0,
    action: 0,
    intelligence: 0,
    monitoring: 0,
  }
  try {
    const { start } = periodBounds()
    const { data: ledger } = await supabase
      .from("ai_credit_ledger")
      .select("credit_class, amount")
      .eq("workspace_id", workspaceId)
      .gte("created_at", start)
      .limit(100_000)
    if (Array.isArray(ledger)) {
      for (const row of ledger) {
        const k = row.credit_class as CreditClass
        if (k in used) used[k] += Number((row as { amount?: number }).amount ?? 0)
      }
    }
  } catch {
    /* fail open — 0 used */
  }

  return CREDIT_CLASSES.map((c) => {
    const a = allowance[c]
    const u = used[c]
    return {
      class: c,
      allowance: a,
      used: u,
      remaining: a === UNLIM ? UNLIM : Math.max(0, a - u),
    }
  })
}

export interface CreditCheck {
  allowed: boolean
  class: CreditClass | null
  estimate: number
  remaining: number
  reason?: string
}

/**
 * Pre-flight balance check for an operation. Conversation NEVER hard-blocks here
 * (caps.ts owns the abuse ceiling); the action / intelligence / monitoring
 * classes block when the class balance can't cover the estimate. Fails OPEN on
 * any store error.
 */
export async function checkCreditBalance(
  supabase: SupabaseClient,
  workspaceId: string,
  operationKey: string,
  units = 0
): Promise<CreditCheck> {
  const klass = classForOperation(operationKey)
  const estimate = estimateCredits(operationKey, units)
  if (!klass || estimate === 0) {
    return { allowed: true, class: klass, estimate, remaining: UNLIM }
  }
  // Conversation is metered for telemetry but never the thing that blocks a turn.
  if (klass === "conversation") {
    return { allowed: true, class: klass, estimate, remaining: UNLIM }
  }
  try {
    const balances = await getCreditBalances(supabase, workspaceId)
    const b = balances.find((x) => x.class === klass)
    const remaining = b?.remaining ?? UNLIM
    if (remaining === UNLIM || remaining >= estimate) {
      return { allowed: true, class: klass, estimate, remaining }
    }
    return {
      allowed: false,
      class: klass,
      estimate,
      remaining,
      reason: `This needs ${estimate} ${klass} credit${estimate === 1 ? "" : "s"} but only ${remaining} remain this month. Top up with a credit pack or upgrade your plan.`,
    }
  } catch {
    return { allowed: true, class: klass, estimate, remaining: UNLIM } // fail open
  }
}

export interface DebitArgs {
  workspaceId: string
  userId: string | null
  operationKey: string
  /** Actual credits to debit (defaults to the estimate for `units`). */
  credits?: number
  units?: number
  refType?: string
  refId?: string | null
}

/**
 * Write a credit-ledger entry for a completed operation. Best-effort and never
 * throws — a failed ledger write must not break the user's request (the usage
 * event in ai_usage_events is the financial backstop). Skips zero-cost ops and
 * the demo workspace.
 */
export async function debitCredits(
  _supabase: SupabaseClient,
  args: DebitArgs
): Promise<void> {
  if (!args.workspaceId || args.workspaceId === "demo-workspace") return
  const klass = classForOperation(args.operationKey)
  if (!klass) return
  const amount = args.credits ?? estimateCredits(args.operationKey, args.units ?? 0)
  if (amount <= 0) return
  try {
    // Service-role insert: the ledger is server-written so it can't be forged
    // or skipped by a client (ai_credit_ledger has no client INSERT policy).
    const admin = createAdminClient()
    await admin.from("ai_credit_ledger").insert({
      workspace_id: args.workspaceId,
      created_by: args.userId,
      credit_class: klass,
      operation_key: args.operationKey,
      amount,
      ref_type: args.refType ?? null,
      ref_id: args.refId ?? null,
    })
  } catch {
    /* non-fatal — never break a request on a ledger write */
  }
}
