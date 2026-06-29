import { NextResponse } from "next/server"
import { resolveBillingContext, getStripe } from "../_shared"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/billing/invoices — the workspace's real Stripe invoices (billing
 * history). Owner/admin only, workspace-scoped. Money is integer pence.
 * Returns an empty list (not an error) when the workspace has no Stripe
 * customer yet, so the page shows an honest empty state.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  const resolved = await resolveBillingContext()
  if (resolved.response) return resolved.response
  const { workspaceId, admin, secretKey } = resolved.ctx

  let customerId: string | null = null
  try {
    const { data } = await admin
      .from("workspaces")
      .select("stripe_customer_id")
      .eq("id", workspaceId)
      .maybeSingle()
    customerId = (data?.stripe_customer_id as string | null) ?? null
  } catch {
    /* tolerate — treated as no customer */
  }
  if (!customerId) return NextResponse.json({ invoices: [] })

  try {
    const stripe = await getStripe(secretKey)
    const list = await stripe.invoices.list({ customer: customerId, limit: 24 })
    const invoices = list.data.map((inv) => ({
      id: inv.number ?? inv.id,
      date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      description: inv.lines?.data?.[0]?.description ?? "Subscription",
      amount: inv.total ?? 0, // integer pence
      currency: (inv.currency ?? "gbp").toUpperCase(),
      // Stripe: draft | open | paid | uncollectible | void
      status: inv.status ?? "open",
      pdf: inv.invoice_pdf ?? inv.hosted_invoice_url ?? null,
    }))
    return NextResponse.json({ invoices })
  } catch (err) {
    captureException(err, { source: "api/billing/invoices GET", requestId })
    return NextResponse.json({ invoices: [], error: "Couldn't load invoices from Stripe", requestId })
  }
}
