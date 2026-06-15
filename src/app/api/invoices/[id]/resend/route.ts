import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { invoiceNotificationEmail } from "@/lib/emails/invoice-notification"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/invoices/{id}/resend
 * Re-sends the invoice notification email to the linked contact via Resend.
 *
 * Honest behaviour:
 *  - 401 if not authenticated, 403 if not a workspace member, 404 if no invoice.
 *  - 400 if there is no recipient email on the linked contact (cannot send).
 *  - 503 if the email provider (RESEND_API_KEY) is not configured — we never
 *    pretend a message was sent.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .select("id, workspace_id, invoice_number, contact_id, property_id, total, due_date, status")
    .eq("id", id)
    .maybeSingle()

  if (invErr) {
    if (invErr.code === "42P01") return NextResponse.json({ error: "Invoices are not provisioned yet" }, { status: 404 })
    return NextResponse.json({ error: invErr.message }, { status: 500 })
  }
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  // Authorise: caller must be a member of the invoice's workspace.
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", invoice.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email provider not configured. Connect Resend to send invoices." },
      { status: 503 },
    )
  }

  // Resolve recipient + context (best-effort joins, workspace-scoped).
  const [contactRes, propertyRes, wsRes] = await Promise.all([
    invoice.contact_id
      ? supabase.from("contacts").select("display_name, email").eq("id", invoice.contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    invoice.property_id
      ? supabase.from("properties").select("address_line1, city, postcode").eq("id", invoice.property_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("workspaces").select("name").eq("id", invoice.workspace_id).maybeSingle(),
  ])

  const contact = (contactRes as { data: { display_name?: string; email?: string } | null }).data
  const property = (propertyRes as { data: { address_line1?: string; city?: string; postcode?: string } | null }).data
  const ws = (wsRes as { data: { name?: string } | null }).data

  const recipientEmail = contact?.email
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "No recipient email on the linked contact. Add an email to the contact first." },
      { status: 400 },
    )
  }

  const amountDue = new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", minimumFractionDigits: 2,
  }).format(Number(invoice.total ?? 0))
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "on receipt"
  const propertyLabel = property
    ? [property.address_line1, property.city, property.postcode].filter(Boolean).join(", ") || null
    : null

  const { subject, html } = invoiceNotificationEmail({
    recipientName: contact?.display_name ?? "there",
    invoiceNumber: invoice.invoice_number ?? `INV-${String(id).slice(0, 8).toUpperCase()}`,
    amountDue,
    dueDate,
    propertyLabel,
    workspaceName: ws?.name ?? "Propvora",
  })

  const result = await sendEmail({ to: recipientEmail, subject, html })
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  // Audit trail (best-effort; surfaces in the invoice Email/Activity tabs).
  try {
    await supabase.from("audit_logs").insert({
      workspace_id: invoice.workspace_id,
      user_id: user.id,
      action: "invoice.email_sent",
      resource_type: "invoice",
      resource_id: id,
      detail: { to: recipientEmail, subject, email_id: result.id ?? null },
      created_at: new Date().toISOString(),
    })
  } catch {
    /* audit table may not exist — non-fatal */
  }

  return NextResponse.json({ success: true, emailId: result.id ?? null, to: recipientEmail })
}
