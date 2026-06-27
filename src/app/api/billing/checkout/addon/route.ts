import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAddons } from "@/lib/billing/plans"
import { isGrantableOneOffPack } from "@/lib/ai/credits"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
import { stripePmcId } from "@/lib/payments/stripe-keys"
import {
  resolveBillingContext,
  getStripe,
  checkBillingCsrf,
} from "../../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_QTY = 50

/**
 * POST /api/billing/checkout/addon — one-off (payment-mode) Stripe Checkout for a
 * ONE-TIME add-on pack (e.g. AI credit pack). Distinct from /api/billing/addons,
 * which mutates recurring subscription items.
 *
 *   1. Owner/admin + workspace gated, same-origin CSRF.
 *   2. Validates the catalog key is a ONE-TIME add-on (interval === null) with a
 *      configured Stripe price and a known credit grant.
 *   3. Resolves/creates the workspace Stripe customer.
 *   4. Creates a mode:"payment" Checkout Session for the price × quantity, tagging
 *      metadata so the verified webhook grants the credits AFTER payment.
 *   5. Audit-logged. Returns { url } to redirect the browser to Stripe.
 *
 * Credits are granted by the webhook on checkout.session.completed — never here
 * (we never trust a client success redirect for entitlement).
 */
export async function POST(request: NextRequest) {
  const csrf = checkBillingCsrf(request)
  if (csrf) return csrf

  const resolved = await resolveBillingContext()
  if (resolved.response) return resolved.response
  const { workspaceId, admin, secretKey, userId, actorEmail } = resolved.ctx

  let body: { addonKey?: string; quantity?: number }
  try {
    body = (await request.json()) as { addonKey?: string; quantity?: number }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const addonKey = typeof body.addonKey === "string" ? body.addonKey : ""
  if (!addonKey) return NextResponse.json({ error: "addonKey is required" }, { status: 400 })

  const qRaw = Number(body.quantity)
  const quantity = Number.isFinite(qRaw) ? Math.min(MAX_QTY, Math.max(1, Math.floor(qRaw))) : 1

  const catalogAddon = getAddons().find((a) => a.key === addonKey)
  if (!catalogAddon) {
    return NextResponse.json({ error: `Unknown add-on: ${addonKey}` }, { status: 400 })
  }
  if (catalogAddon.interval !== null) {
    return NextResponse.json(
      { error: `"${catalogAddon.name}" is a recurring add-on — use the subscription add-on flow.` },
      { status: 409 },
    )
  }
  if (!catalogAddon.priceId) {
    return NextResponse.json(
      { error: `"${catalogAddon.name}" is not yet available for purchase.` },
      { status: 409 },
    )
  }
  if (!isGrantableOneOffPack(addonKey)) {
    return NextResponse.json(
      { error: `"${catalogAddon.name}" cannot be self-served yet — contact billing.` },
      { status: 409 },
    )
  }

  // Resolve / create the workspace Stripe customer.
  let customerId: string | null = null
  try {
    const { data: ws } = await admin
      .from("workspaces")
      .select("name, stripe_customer_id")
      .eq("id", workspaceId)
      .maybeSingle()
    customerId = (ws?.stripe_customer_id as string | null) ?? null
    if (!customerId) {
      const stripe = await getStripe(secretKey)
      const customer = await stripe.customers.create({
        email: actorEmail ?? undefined,
        name: (ws?.name as string | null) ?? undefined,
        metadata: { workspace_id: workspaceId, user_id: userId },
      })
      customerId = customer.id
      await admin.from("workspaces").update({ stripe_customer_id: customerId }).eq("id", workspaceId)
    }
  } catch {
    /* fall through — customer can still be created inline below if needed */
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const base = `${appUrl}/property-manager/workspace/billing/add-ons`

  try {
    const stripe = await getStripe(secretKey)
    const pmc = stripePmcId("INVOICE_PAYMENTS")
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(customerId ? { customer: customerId } : {}),
      line_items: [{ price: catalogAddon.priceId, quantity }],
      success_url: `${base}?purchase=success`,
      cancel_url: `${base}?purchase=cancelled`,
      metadata: {
        workspace_id: workspaceId,
        kind: "one_off_addon",
        addon_key: addonKey,
        quantity: String(quantity),
      },
      ...(pmc ? { payment_method_configuration: pmc } : {}),
    })

    await recordAudit(admin, {
      workspaceId,
      userId,
      action: AUDIT_ACTIONS.BILLING_SUBSCRIPTION_UPDATED,
      resourceType: "addon_purchase",
      resourceId: addonKey,
      metadata: { kind: "one_off_addon_checkout", quantity, priceId: catalogAddon.priceId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[billing/checkout/addon] stripe session failed", err)
    return NextResponse.json({ error: "Could not start the add-on checkout." }, { status: 502 })
  }
}
