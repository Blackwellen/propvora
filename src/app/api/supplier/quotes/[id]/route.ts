import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  getQuote,
  submitQuote,
  acceptQuote,
  declineQuote,
  withdrawQuote,
} from "@/lib/supplier/quotes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function isWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return Boolean(data)
}

/**
 * GET /api/supplier/quotes/[id]
 * Visible to a member of EITHER the operator or supplier workspace on the quote.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const quote = await getQuote(supabase, id)
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 })

    const isOperator = await isWorkspaceMember(supabase, quote.operator_workspace_id, user.id)
    const isSupplier = await isWorkspaceMember(supabase, quote.supplier_workspace_id, user.id)
    if (!isOperator && !isSupplier) {
      // Don't leak existence to non-parties.
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    return NextResponse.json({ quote })
  } catch (err) {
    captureException(err, { source: "api/supplier/quotes/[id] GET", requestId })
    return NextResponse.json({ error: "Failed to load quote", requestId }, { status: 500 })
  }
}

/**
 * PATCH /api/supplier/quotes/[id]
 * Body: { action, ...payload }
 *   action 'submit'   (supplier) → { amountPence, validUntil?, description? }
 *   action 'accept'   (operator) → spawns a job assignment
 *   action 'decline'  (operator)
 *   action 'withdraw' (supplier)
 * Side membership is enforced per action.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }
    const action = typeof body.action === "string" ? body.action.trim() : ""
    if (!action) return NextResponse.json({ error: "action is required" }, { status: 400 })

    const quote = await getQuote(supabase, id)
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 })

    const isOperator = await isWorkspaceMember(supabase, quote.operator_workspace_id, user.id)
    const isSupplier = await isWorkspaceMember(supabase, quote.supplier_workspace_id, user.id)
    if (!isOperator && !isSupplier) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    switch (action) {
      case "submit": {
        if (!isSupplier) {
          return NextResponse.json({ error: "Only the supplier may submit a quote" }, { status: 403 })
        }
        const amountPence = Number(body.amountPence)
        if (!Number.isFinite(amountPence) || amountPence < 0) {
          return NextResponse.json({ error: "amountPence must be a non-negative number" }, { status: 400 })
        }
        const updated = await submitQuote(supabase, id, {
          amountPence: Math.round(amountPence),
          validUntil: typeof body.validUntil === "string" ? body.validUntil : undefined,
          description: typeof body.description === "string" ? body.description : undefined,
        })
        if (!updated) {
          return NextResponse.json(
            { error: "Quote cannot be submitted from its current state" },
            { status: 409 }
          )
        }
        return NextResponse.json({ quote: updated })
      }
      case "accept": {
        if (!isOperator) {
          return NextResponse.json({ error: "Only the operator may accept a quote" }, { status: 403 })
        }
        const result = await acceptQuote(supabase, id)
        if (!result) {
          return NextResponse.json(
            { error: "Quote cannot be accepted (must be in 'quoted' state)" },
            { status: 409 }
          )
        }
        return NextResponse.json({ quote: result.quote, assignmentId: result.assignmentId })
      }
      case "decline": {
        if (!isOperator) {
          return NextResponse.json({ error: "Only the operator may decline a quote" }, { status: 403 })
        }
        const updated = await declineQuote(supabase, id)
        if (!updated) {
          return NextResponse.json(
            { error: "Quote cannot be declined from its current state" },
            { status: 409 }
          )
        }
        return NextResponse.json({ quote: updated })
      }
      case "withdraw": {
        if (!isSupplier) {
          return NextResponse.json({ error: "Only the supplier may withdraw a quote" }, { status: 403 })
        }
        const updated = await withdrawQuote(supabase, id)
        if (!updated) {
          return NextResponse.json(
            { error: "Quote cannot be withdrawn from its current state" },
            { status: 409 }
          )
        }
        return NextResponse.json({ quote: updated })
      }
      default:
        return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 })
    }
  } catch (err) {
    captureException(err, { source: "api/supplier/quotes/[id] PATCH", requestId })
    return NextResponse.json({ error: "Failed to update quote", requestId }, { status: 500 })
  }
}
