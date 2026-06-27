import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getWorkspaceTier } from "@/lib/billing/gates"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PlanTier } from "@/lib/billing/plans"

// ============================================================================
// AI credit-class economics — Azure-calibrated.
//
// A single flat "AI message" credit is wrong: a chat turn on our workhorse
// (Azure GPT-4o-mini at ~£0.0003/msg) costs us a fraction of a penny, while
// an agent run with web search + document generation can cost pennies. If they
// shared one budget, heavy runs would silently drain a user's conversational
// allowance. So usage is metered in ONE ledger across credit CLASSES, each
// with its own monthly allowance:
//
//   • conversation — chat turns, reads, retrieval, context resolve. High volume,
//                    routed to cheapest model (Azure GPT-4o-mini). Very cheap
//                    (~£0.0003–0.0006 / message). Metered for telemetry; never
//                    hard-blocked here (PLAN_CAPS in caps.ts is the hard limit).
//   • action       — writes, edits, drafted/sent emails, automation builds/runs.
//                    State-changing; deserves its own budget + visible UI limit.
//   • intelligence — web/market search, document extract/generate, agent runs.
//                    Uses stronger models (GPT-4o or agentic tier). Real £.
//                    This is the margin-protecting, upsell-driving class.
//   • monitoring   — scheduled background monitor cycles. Always-on cost; bundled
//                    per plan so it never surprise-bills a conversational user.
//
// Azure pricing reference (EU West, ~USD→GBP at £1 = $1.27):
//   GPT-4o-mini:  £0.012/1k input,  £0.047/1k output
//   GPT-4o:       £0.197/1k input,  £0.787/1k output
//
// Retail price: 1 credit = £0.02. Op cost per credit class:
//   conversation: ~£0.0003–0.0006/msg  → margin >30× on 1-credit turn
//   action:       ~£0.001–0.003/action → margin >6× on 1-credit action
//   intelligence: ~£0.01–0.10/action  → margin >2× on 5-credit web search
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

/**
 * Retail value of one credit, GBP.
 * At £0.02/credit: 50 credits = £1.00 retail. This gives us comfortable margin
 * above Azure GPT-4o-mini costs (~£0.0003–0.0006 per chat turn consumed as
 * 1–3 conversation credits). Used for cost previews + credit-pack pricing.
 */
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
 * Monthly INCLUDED credit allowance per plan, per class.
 *
 * Calibrated to the revised plan token limits (gates.ts) and Azure pricing:
 *
 *   Scale (750 msg/mo, 2k+2k tokens): ~4 credits/msg → 3,000 conversation credits.
 *     Allowance 5,000 gives 67% headroom above expected use.
 *   Pro/Agency (3k msg/mo, 4k+3k tokens): ~7 credits/msg → 21,000 credits.
 *     Allowance 30,000 gives 43% headroom.
 *
 * Intelligence class (web search = 5 credits, doc generate = 10, agent run = 25):
 *   Scale 500 credits ≈ 100 web searches or 50 doc extracts per month.
 *   Pro  3,000 credits ≈ 300 web searches or 120 agent runs per month.
 *
 * Starter/Operator: Copilot gated off (gateAiCopilot blocks first). Allowances
 * are 0 and only matter if the gate is relaxed or an AI-Pro add-on is attached.
 *
 * UNLIM = Number.MAX_SAFE_INTEGER (Enterprise — bounded by PLAN_CAPS cost ceiling).
 */
const UNLIM = Number.MAX_SAFE_INTEGER

export const PLAN_CREDIT_ALLOWANCES: Record<PlanTier, Record<CreditClass, number>> = {
  starter:    { conversation: 0,      action: 0,     intelligence: 0,     monitoring: 0 },
  operator:   { conversation: 0,      action: 0,     intelligence: 0,     monitoring: 0 },
  scale:      { conversation: 5_000,  action: 800,   intelligence: 500,   monitoring: 300 },
  pro_agency: { conversation: 30_000, action: 4_500, intelligence: 3_000, monitoring: 1_500 },
  enterprise: { conversation: UNLIM,  action: UNLIM, intelligence: UNLIM, monitoring: UNLIM },
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

/**
 * Credits granted per ONE unit of a one-off add-on (catalog key → class grant).
 * A purchase of N units grants N× these amounts. Keyed by the canonical billing
 * catalog key so the Stripe price is the single source of truth for money.
 */
export const ONE_OFF_PACK_GRANTS: Record<string, Partial<Record<CreditClass, number>>> = {
  ai_credits_1k: { action: 1_000 },
  intelligence_pack_1k: { intelligence: 1_000 },
  action_pack_1k: { action: 1_000 },
}

/** Is this catalog key a one-off credit pack we know how to grant? */
export function isGrantableOneOffPack(catalogKey: string): boolean {
  return catalogKey in ONE_OFF_PACK_GRANTS
}

/**
 * Grant the credits for a completed one-off pack purchase. Inserts one
 * ai_credit_balances row per credit class (the balance reader SUMS all rows, so
 * each purchase stacks on top of the plan + prior packs). Service-role only;
 * called from the verified Stripe webhook AFTER payment. Best-effort: a missing
 * table never throws (the payment already succeeded).
 */
export async function grantCreditPack(
  admin: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  catalogKey: string,
  units = 1,
): Promise<boolean> {
  const grant = ONE_OFF_PACK_GRANTS[catalogKey]
  const qty = Math.max(1, Math.floor(units))
  if (!grant || !workspaceId) return false
  try {
    const { start, end } = periodBounds()
    const rows = Object.entries(grant)
      .filter(([, amt]) => (amt ?? 0) > 0)
      .map(([credit_class, amt]) => ({
        workspace_id: workspaceId,
        credit_class,
        allowance: (amt as number) * qty,
        source: catalogKey,
        period_start: start,
        period_end: end,
      }))
    if (!rows.length) return false
    await admin.from("ai_credit_balances").insert(rows)
    return true
  } catch {
    return false
  }
}

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
