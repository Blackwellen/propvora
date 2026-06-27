import { NextResponse } from "next/server"
import { requireCustomerContext, getCustomerBooking } from "@/lib/customer"
import { htmlToPdf } from "@/lib/pdf/render"
import { renderInvoiceHtml, type InvoicePdfData } from "@/lib/pdf/invoice-template"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/customer/bookings/[id]/receipt
 * Generates a branded PDF receipt for one of the customer's own bookings
 * (RLS-scoped via getCustomerBooking). Reuses the shared invoice/PDF template.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, workspaceId, email, displayName } = await requireCustomerContext()

  const booking = await getCustomerBooking(supabase, workspaceId, email, id)
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

  const b = booking as unknown as {
    booking_ref: string | null
    guest_name: string | null
    guest_email: string | null
    listing_title: string | null
    check_in: string | null
    check_out: string | null
    nights: number | null
    guests_count: number | null
    subtotal_pence: number | null
    fees_pence: number | null
    deposit_pence: number | null
    total_pence: number | null
    payment_status: string | null
    created_at: string | null
  }

  const toPounds = (pence: number | null | undefined) => Number(pence ?? 0) / 100
  const nights = b.nights ?? 1
  const subtotal = toPounds(b.subtotal_pence)
  const fees = toPounds(b.fees_pence)
  const deposit = toPounds(b.deposit_pence)
  const total = toPounds(b.total_pence)
  const stayLabel = b.listing_title ?? "Stay"
  const dateRange = [b.check_in, b.check_out].filter(Boolean).join(" → ")
  const paid = (b.payment_status ?? "").toLowerCase() === "paid" ? total : undefined

  const items: InvoicePdfData["items"] = [
    { description: `${stayLabel}${dateRange ? ` (${dateRange})` : ""} · ${nights} night${nights === 1 ? "" : "s"}`, quantity: 1, unitPrice: subtotal, amount: subtotal },
  ]
  if (fees > 0) items.push({ description: "Service & cleaning fees", quantity: 1, unitPrice: fees, amount: fees })
  if (deposit > 0) items.push({ description: "Refundable deposit", quantity: 1, unitPrice: deposit, amount: deposit })

  const data: InvoicePdfData = {
    docType: "RECEIPT",
    number: `RCPT-${(b.booking_ref ?? String(id).slice(0, 8)).toUpperCase()}`,
    status: b.payment_status ?? undefined,
    issueDate: b.created_at ?? null,
    dueDate: null,
    currency: "GBP",
    from: { name: "Propvora", lines: ["United Kingdom"] },
    billTo: { name: b.guest_name ?? displayName ?? "Guest", email: b.guest_email ?? email ?? null },
    propertyLabel: stayLabel,
    items,
    subtotal: subtotal + fees + deposit,
    total,
    paid,
    balance: Math.max(0, total - (paid ?? 0)),
    terms: "This receipt confirms the amount paid for your booking. Keep it for your records.",
  }

  try {
    const pdf = await htmlToPdf(renderInvoiceHtml(data))
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${data.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (e) {
    console.error("[customer/receipt]", e)
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
  }
}
