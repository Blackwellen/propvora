import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { htmlToPdf } from "@/lib/pdf/render"
import { renderInvoiceHtml, type InvoicePdfData } from "@/lib/pdf/invoice-template"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/pdf/invoice/{id}?type=invoice|bill
 * Generates an enterprise-grade branded PDF from the live invoice/bill record.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const url = new URL(req.url)
  const kind = (url.searchParams.get("type") ?? "invoice").toLowerCase()
  const isBill = kind === "bill"

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const table = isBill ? "money_bills" : "money_invoices"
  const { data: row, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error || !row) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 })
  }

  // Authorise: caller must be a member of the record's workspace.
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", row.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Joins (best-effort, 42P01/42703-safe).
  const [{ data: ws }, contactRes, propertyRes] = await Promise.all([
    supabase.from("workspaces").select("name").eq("id", row.workspace_id).maybeSingle(),
    row.contact_id
      ? supabase.from("contacts").select("full_name:display_name, email").eq("id", row.contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.property_id
      ? supabase.from("properties").select("name:nickname, city, postcode").eq("id", row.property_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const contact = (contactRes as { data: { full_name?: string; email?: string } | null }).data
  const property = (propertyRes as { data: { name?: string; city?: string; postcode?: string } | null }).data

  const amount = Number(row.amount ?? 0)
  const paid = Number(row.paid_amount ?? 0)
  const description =
    (row.description as string | null) ||
    (isBill ? `${row.bill_type ?? "Bill"}` : `${row.invoice_type ?? "Invoice"} charge`)

  const numberPrefix = isBill ? "BILL" : "INV"
  const data: InvoicePdfData = {
    docType: isBill ? "BILL" : "INVOICE",
    number: `${numberPrefix}-${String(id).slice(0, 8).toUpperCase()}`,
    status: row.status ?? undefined,
    issueDate: row.issue_date ?? null,
    dueDate: row.due_date ?? null,
    currency: "GBP",
    from: {
      name: ws?.name ?? "Your workspace",
      lines: ["United Kingdom"],
    },
    billTo: {
      name: contact?.full_name ?? (isBill ? "Supplier" : "Customer"),
      email: contact?.email ?? null,
    },
    propertyLabel: property?.name
      ? [property.name, property.postcode].filter(Boolean).join(" · ")
      : null,
    items: [{ description, quantity: 1, unitPrice: amount, amount }],
    subtotal: amount,
    total: amount,
    paid: paid > 0 ? paid : undefined,
    balance: Math.max(0, amount - paid),
    terms: isBill
      ? "Please ensure payment is made by the due date to the supplier's nominated account."
      : "Payment is due by the date shown above. Thank you for your business.",
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
    console.error("[pdf/invoice]", e)
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
  }
}
