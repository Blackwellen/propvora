import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import {
  listInvoices,
  createInvoice,
  submitInvoice,
  voidInvoice,
  summariseInvoices,
  type SupplierInvoiceStatus,
} from "@/lib/supplier/invoices"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/supplier/invoices?workspaceId=...&status=... */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const status = (url.searchParams.get("status") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listInvoices(supabase, workspaceId, status ? { status: status as SupplierInvoiceStatus } : undefined)
    return NextResponse.json({ items, summary: summariseInvoices(items) })
  } catch (err) {
    captureException(err, { source: "api/supplier/invoices GET", requestId })
    return NextResponse.json({ error: "Failed to load invoices", requestId }, { status: 500 })
  }
}

/** POST /api/supplier/invoices  Body: { workspaceId, amount, invoice_number?, supplier_job_id?, notes? } */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const invoice = await createInvoice(supabase, workspaceId, {
      amount_pence: typeof body.amount_pence === "number" ? body.amount_pence : null,
      invoice_number: typeof body.invoice_number === "string" ? body.invoice_number : null,
      assignment_id: typeof body.assignment_id === "string" ? body.assignment_id : null,
      currency: typeof body.currency === "string" ? body.currency : "GBP",
      notes: typeof body.notes === "string" ? body.notes : null,
    })
    if (!invoice) return NextResponse.json({ error: "Invoices are not ready yet." }, { status: 503 })
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    captureException(err, { source: "api/supplier/invoices POST", requestId })
    return NextResponse.json({ error: "Failed to create invoice", requestId }, { status: 500 })
  }
}

/** PATCH /api/supplier/invoices  Body: { workspaceId, invoiceId, action: 'submit'|'void' } */
export async function PATCH(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId.trim() : ""
    const action = typeof body.action === "string" ? body.action.trim() : ""
    if (!workspaceId || !invoiceId) return NextResponse.json({ error: "workspaceId and invoiceId are required" }, { status: 400 })
    if (action !== "submit" && action !== "void") {
      return NextResponse.json({ error: "action must be 'submit' or 'void'" }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const invoice = action === "submit"
      ? await submitInvoice(supabase, workspaceId, invoiceId)
      : await voidInvoice(supabase, workspaceId, invoiceId)
    if (!invoice) return NextResponse.json({ error: "That action is no longer available." }, { status: 409 })
    return NextResponse.json({ invoice })
  } catch (err) {
    captureException(err, { source: "api/supplier/invoices PATCH", requestId })
    return NextResponse.json({ error: "Failed to update invoice", requestId }, { status: 500 })
  }
}
