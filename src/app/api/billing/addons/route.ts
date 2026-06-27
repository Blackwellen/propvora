import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type Stripe from "stripe"
import { getAddons } from "@/lib/billing/plans"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
import {
  resolveBillingContext,
  getActiveSubscription,
  resolveStripeSubscriptionId,
  getStripe,
  recordSubscriptionEvent,
  checkBillingCsrf,
} from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AddonAction = "add" | "remove" | "set_quantity"

interface AddonBody {
  /** Catalogue key from src/lib/billing/plans.ts (e.g. "extra_seat"). */
  addonKey?: string
  action?: AddonAction
  /** Required for add / set_quantity; ignored for remove. */
  quantity?: number
}

/**
 * POST /api/billing/addons — add / remove / change quantity of an add-on.
 *
 * Validates addonKey against the catalogue in src/lib/billing/plans.ts (the
 * source of truth for Stripe price IDs). Applies the change as a Stripe
 * subscription-item mutation (Stripe handles proration), upserts a
 * workspace_subscription_addons row (status active/removed, quantity), and
 * writes a workspace_subscription_events + audit row.
 *
 * Owner/admin only, workspace-scoped, tolerant of missing tables (42P01).
 */
export async function POST(request: NextRequest) {
  const csrf = checkBillingCsrf(request)
  if (csrf) return csrf

  const resolved = await resolveBillingContext()
  if (resolved.response) return resolved.response
  const { workspaceId, admin, secretKey, userId, actorEmail } = resolved.ctx

  let body: AddonBody
  try {
    body = (await request.json()) as AddonBody
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const addonKey = typeof body.addonKey === "string" ? body.addonKey : ""
  const action: AddonAction = body.action ?? "add"
  if (!addonKey) {
    return NextResponse.json({ error: "addonKey is required" }, { status: 400 })
  }
  if (!["add", "remove", "set_quantity"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  // Validate against the canonical add-on catalogue.
  const catalogAddon = getAddons().find((a) => a.key === addonKey)
  if (!catalogAddon) {
    return NextResponse.json({ error: `Unknown add-on: ${addonKey}` }, { status: 400 })
  }
  if (!catalogAddon.priceId) {
    // Honest: this add-on has no Stripe price configured yet (founder must run
    // the catalogue setup script). We cannot mutate Stripe for it.
    return NextResponse.json(
      { error: `Add-on "${catalogAddon.name}" is not yet available for self-serve purchase.` },
      { status: 409 },
    )
  }
  if (catalogAddon.interval === null) {
    // One-time packs (e.g. AI credit packs) cannot be applied as a recurring
    // subscription item — they must be bought via a one-off checkout. Reject
    // honestly rather than letting Stripe 400 on a non-recurring price.
    return NextResponse.json(
      { error: `"${catalogAddon.name}" is a one-time pack and isn't managed as a recurring add-on.` },
      { status: 409 },
    )
  }

  const quantityRaw = Number(body.quantity)
  const quantity =
    action === "remove" ? 0 : Number.isFinite(quantityRaw) ? Math.max(1, Math.floor(quantityRaw)) : 1

  const sub = await getActiveSubscription(admin, workspaceId)
  const stripeRef = await resolveStripeSubscriptionId(admin, workspaceId, sub)
  if (!stripeRef) {
    return NextResponse.json(
      { error: "An active subscription is required before changing add-ons." },
      { status: 404 },
    )
  }

  // ── Stripe: apply the subscription-item change ───────────────────────────
  try {
    const stripe = await getStripe(secretKey)
    const stripeSub = await stripe.subscriptions.retrieve(stripeRef.stripeSubscriptionId)
    const existingItem = stripeSub.items.data.find(
      (it: Stripe.SubscriptionItem) => it.price.id === catalogAddon.priceId,
    )

    if (action === "remove") {
      if (existingItem) {
        await stripe.subscriptionItems.del(existingItem.id, { proration_behavior: "create_prorations" })
      }
    } else if (existingItem) {
      // add (already present) or set_quantity → update the existing item.
      await stripe.subscriptionItems.update(existingItem.id, {
        quantity,
        proration_behavior: "create_prorations",
      })
    } else {
      // add when not present → create the item on the subscription.
      await stripe.subscriptionItems.create({
        subscription: stripeRef.stripeSubscriptionId,
        price: catalogAddon.priceId,
        quantity,
        proration_behavior: "create_prorations",
      })
    }
  } catch (err) {
    console.error("[billing/addons] stripe mutation failed", err)
    return NextResponse.json(
      { error: "Could not apply the add-on change with Stripe. Please try again." },
      { status: 502 },
    )
  }

  // ── DB: upsert the add-on row (tolerant) ─────────────────────────────────
  const enabled = action !== "remove"
  const status = enabled ? "active" : "removed"
  try {
    const { data: existingRow } = await admin
      .from("workspace_subscription_addons")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("addon_code", addonKey)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const payload = {
      workspace_id: workspaceId,
      subscription_id: sub?.id ?? null,
      addon_code: addonKey,
      name: catalogAddon.name,
      enabled,
      quantity,
      unit_price_pence: catalogAddon.amount,
      status,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }

    if (existingRow) {
      await admin.from("workspace_subscription_addons").update(payload).eq("id", existingRow.id)
    } else {
      await admin.from("workspace_subscription_addons").insert(payload)
    }
  } catch {
    /* table missing — non-fatal; Stripe is the source of truth */
  }

  const verb = action === "remove" ? "removed" : existingActionVerb(action)
  await recordSubscriptionEvent(admin, {
    workspaceId,
    subscriptionId: sub?.id ?? null,
    eventType: "addon_change",
    summary: `Add-on "${catalogAddon.name}" ${verb}${enabled ? ` (qty ${quantity})` : ""}.`,
    actor: actorEmail ?? "Owner",
    metadata: { addonKey, action, quantity },
  })

  await recordAudit(admin, {
    workspaceId,
    userId,
    action: AUDIT_ACTIONS.BILLING_SUBSCRIPTION_UPDATED,
    resourceType: "subscription_addon",
    resourceId: addonKey,
    metadata: { action, quantity, priceId: catalogAddon.priceId },
  })

  return NextResponse.json({ ok: true, addonKey, action, quantity, enabled })
}

function existingActionVerb(action: AddonAction): string {
  return action === "set_quantity" ? "quantity updated" : "added"
}
