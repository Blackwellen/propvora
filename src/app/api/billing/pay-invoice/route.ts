import { NextResponse } from "next/server"
import { stripeSecretKey, stripePmcId } from "@/lib/payments/stripe-keys"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/billing/pay-invoice  { id, type?: "invoice" | "bill" }
 * Creates a shareable Stripe Checkout link (payment mode) for the outstanding
 * balance of an invoice. Returns { url }. Only members of the invoice's
 * workspace may create it.
 */
export async function POST(request: Request) {
  const secretKey = stripeSecretKey()
  if (!secretKey) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { id?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  const id = body.id
  const isBill = (body.type ?? "invoice") === "bill"
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const table = isBill ? "money_bills" : "money_invoices"
  const { data: row } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (!row) return NextResponse.json({ error: "Record not found" }, { status: 404 })

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", row.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const amount = Number(row.amount ?? 0)
  const paid = Number(row.paid_amount ?? 0)
  const balanceMinor = Math.round(Math.max(0, amount - paid) * 100)
  if (balanceMinor <= 0) {
    return NextResponse.json({ error: "Nothing left to pay on this invoice" }, { status: 400 })
  }

  const { data: ws } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", row.workspace_id)
    .maybeSingle()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const ref = `INV-${String(id).slice(0, 8).toUpperCase()}`

  try {
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia" as const,
    })
    const pmcInvoice = stripePmcId("INVOICE_PAYMENTS")

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: balanceMinor,
            product_data: {
              name: `${ws?.name ?? "Invoice"} — ${ref}`,
              description: (row.description as string | null) ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { workspace_id: row.workspace_id, invoice_id: String(id), kind: "invoice_payment" },
      success_url: `${appUrl}/property-manager/money/invoices/${id}?payment=success`,
      cancel_url: `${appUrl}/property-manager/money/invoices/${id}?payment=cancelled`,
      ...(pmcInvoice ? { payment_method_configuration: pmcInvoice } : {}),
    })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error("[pay-invoice]", e)
    return NextResponse.json({ error: "Could not create payment link" }, { status: 500 })
  }
}
