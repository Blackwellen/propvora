/**
 * Shared server-only helpers for the Billing backend routes
 * (cancel / resume / addons). Centralises:
 *   - Stripe configuration / lazy client construction
 *   - authenticated, owner/admin-gated workspace resolution
 *   - the workspace's active subscription row + its Stripe subscription id
 *   - event-log + cancellation-request helpers
 *
 * Every route here is owner/admin only (mirrors the migration RLS: write =
 * owner/admin) and workspace-scoped. Money is INTEGER PENCE everywhere.
 *
 * Tolerant by design: every Supabase read is try/caught so a missing table
 * (42P01) before migrations are applied degrades to an honest 404/503 rather
 * than a 500. We NEVER fabricate a subscription.
 */
import "server-only"

import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const STRIPE_API_VERSION = "2026-05-27.dahlia" as const

/** Resolve the server Stripe secret key (env). null when unconfigured. */
export function billingStripeSecret(): string | null {
  const k = process.env.STRIPE_SECRET_KEY
  return k && k.trim().length > 0 ? k : null
}

/** Honest 503 when Stripe is not configured (no secret key). */
export function stripeNotConfigured(): NextResponse {
  return NextResponse.json(
    { error: "Billing not configured. Set STRIPE_SECRET_KEY to enable subscription management." },
    { status: 503 },
  )
}

/** Construct a Stripe client from the resolved secret key (lazy import). */
export async function getStripe(secretKey: string): Promise<Stripe> {
  const StripeCtor = (await import("stripe")).default
  return new StripeCtor(secretKey, { apiVersion: STRIPE_API_VERSION })
}

export type AdminClient = ReturnType<typeof createAdminClient>

export interface BillingContext {
  userId: string
  workspaceId: string
  admin: AdminClient
  /** The Stripe secret key (already validated as present). */
  secretKey: string
  /** Display name for event-log actor rows. */
  actorEmail: string | null
}

/**
 * Resolve the authenticated owner/admin caller + their active workspace.
 * Returns either { ctx } or { response } (an early NextResponse to return).
 *
 * Order of checks mirrors the existing billing routes:
 *   503 if Stripe unset → 401 if unauthenticated → 404 if no workspace →
 *   403 if not owner/admin of that workspace.
 */
export async function resolveBillingContext(): Promise<
  { ctx: BillingContext; response?: never } | { ctx?: never; response: NextResponse }
> {
  const secretKey = billingStripeSecret()
  if (!secretKey) return { response: stripeNotConfigured() }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) }

  // Resolve the caller's active workspace.
  let workspaceId: string | null = null
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()
    workspaceId = (profile?.current_workspace_id as string | null) ?? null
  } catch {
    workspaceId = null
  }
  if (!workspaceId) {
    return { response: NextResponse.json({ error: "No workspace found for this user" }, { status: 404 }) }
  }

  // Owner/admin gate — mirror the billing-table RLS write policy.
  let role: string | null = null
  try {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()
    role = (membership?.role as string | null) ?? null
  } catch {
    role = null
  }
  if (role !== "owner" && role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "Only a workspace owner or admin can manage billing." },
        { status: 403 },
      ),
    }
  }

  return {
    ctx: {
      userId: user.id,
      workspaceId,
      admin: createAdminClient(),
      secretKey,
      actorEmail: user.email ?? null,
    },
  }
}

export interface ActiveSubscription {
  id: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  status: string | null
  planCode: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

/**
 * Read the workspace's most recent (non-archived) subscription row from
 * workspace_subscriptions. Returns null when there is no row OR the table is
 * missing (42P01) — callers decide whether that is a 404.
 */
export async function getActiveSubscription(
  admin: AdminClient,
  workspaceId: string,
): Promise<ActiveSubscription | null> {
  try {
    const { data, error } = await admin
      .from("workspace_subscriptions")
      .select(
        "id, stripe_subscription_id, stripe_customer_id, status, plan_code, current_period_end, cancel_at_period_end",
      )
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) return null
    if (!data) return null
    return {
      id: data.id as string,
      stripeSubscriptionId: (data.stripe_subscription_id as string | null) ?? null,
      stripeCustomerId: (data.stripe_customer_id as string | null) ?? null,
      status: (data.status as string | null) ?? null,
      planCode: (data.plan_code as string | null) ?? null,
      currentPeriodEnd: (data.current_period_end as string | null) ?? null,
      cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
    }
  } catch {
    return null
  }
}

/**
 * If the workspace_subscriptions table has no row but the workspace itself
 * carries a stripe_subscription_id (set by the older checkout flow / webhook),
 * fall back to that so the cancel/resume actions still work. Returns null when
 * neither source has a usable Stripe subscription id.
 */
export async function resolveStripeSubscriptionId(
  admin: AdminClient,
  workspaceId: string,
  sub: ActiveSubscription | null,
): Promise<{ stripeSubscriptionId: string; stripeCustomerId: string | null } | null> {
  if (sub?.stripeSubscriptionId) {
    return { stripeSubscriptionId: sub.stripeSubscriptionId, stripeCustomerId: sub.stripeCustomerId }
  }
  try {
    const { data } = await admin
      .from("workspaces")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("id", workspaceId)
      .maybeSingle()
    const id = (data?.stripe_subscription_id as string | null) ?? null
    if (!id) return null
    return { stripeSubscriptionId: id, stripeCustomerId: (data?.stripe_customer_id as string | null) ?? null }
  } catch {
    return null
  }
}

/**
 * Period end ISO for a Stripe subscription. In the current API version the
 * billing period lives on the subscription ITEM (sub.items.data[0]), not the
 * subscription object. Falls back through items and returns null if absent.
 */
export function periodEndIsoFromSubscription(
  sub: Stripe.Subscription,
): string | null {
  const item = sub.items?.data?.[0]
  const end = item?.current_period_end
  return isoFromUnix(end ?? null)
}

/** ISO from a Stripe unix timestamp (seconds), or null. */
export function isoFromUnix(seconds: number | null | undefined): string | null {
  if (seconds == null) return null
  const ms = seconds * 1000
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

/**
 * Best-effort insert of a workspace_subscription_events row. Never throws —
 * the event log must never block the underlying billing action.
 */
export async function recordSubscriptionEvent(
  admin: AdminClient,
  input: {
    workspaceId: string
    subscriptionId: string | null
    eventType:
      | "plan_change"
      | "addon_change"
      | "renewal"
      | "payment"
      | "cancellation"
      | "reactivation"
    summary: string
    actor?: string
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  try {
    await admin.from("workspace_subscription_events").insert({
      workspace_id: input.workspaceId,
      subscription_id: input.subscriptionId,
      event_type: input.eventType,
      summary: input.summary,
      actor: input.actor ?? "System",
      metadata_json: input.metadata ?? {},
    })
  } catch {
    /* table missing / RLS — non-fatal */
  }
}

/** Lightweight same-origin CSRF check for state-mutating billing routes. */
export function checkBillingCsrf(request: Request): NextResponse | null {
  const origin = request.headers.get("origin")
  if (!origin) return null
  const host = request.headers.get("host")
  if (!host) return null
  const hostName = host.split(":")[0]
  try {
    if (new URL(origin).hostname !== hostName) {
      return NextResponse.json({ error: "CSRF check failed" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "CSRF check failed — invalid origin" }, { status: 403 })
  }
  return null
}
