import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/marketplace/quote-requests — STRUCTURED operator → supplier quote
   request.

   Unlike the lightweight `/api/marketplace/enquiries` write (a flat message on
   a listing), this creates a real two-sided `supplier_marketplace_quotes` row
   in `requested` status. That row lands in the SUPPLIER's leads inbox as a
   `quote_request` (lib/supplier/leads.ts), and the supplier responds by pricing
   it (lib/supplier/quotes.ts) — closing the operator-side leg of the brief's
   "Request quote" flow (property, urgency, preferred date, budget indication).

   Server-authoritative:
     - the operator must be a member of `operatorWorkspaceId`;
     - the supplier workspace is resolved server-side from the published listing
       (`marketplace_listings.workspace_id`) — the client cannot spoof it;
     - structured context (property, urgency, preferred date, budget) is folded
       into the row's title/description so it surfaces in the supplier inbox
       without requiring extra columns.

   Tolerant: a cold/unmigrated DB degrades to a friendly 503, never a 500.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "42703", "PGRST202", "PGRST204", "PGRST205"])
function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned/i.test(e.message ?? "")
}

function clean(v: unknown, max = 4000): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s ? s.slice(0, max) : null
}

type Urgency = "standard" | "urgent" | "emergency"
function urgency(v: unknown): Urgency {
  return v === "urgent" || v === "emergency" ? v : "standard"
}

/** Validate an ISO-ish date string (YYYY-MM-DD). Returns null when invalid. */
function isoDate(v: unknown): string | null {
  const s = clean(v, 32)
  if (!s) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? s : null
}

function poundsToPence(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

async function isMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }

    const listingId = clean(body.listingId, 64)
    const operatorWorkspaceId = clean(body.operatorWorkspaceId, 64)
    const description = clean(body.description)
    const propertyId = clean(body.propertyId, 64)
    const propertyLabel = clean(body.propertyLabel, 240)
    const urg = urgency(body.urgency)
    const preferredDate = isoDate(body.preferredDate)
    const budgetMinPence = poundsToPence(body.budgetMin)
    const budgetMaxPence = poundsToPence(body.budgetMax)

    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    if (!operatorWorkspaceId)
      return NextResponse.json({ error: "operatorWorkspaceId is required" }, { status: 400 })
    if (!description)
      return NextResponse.json({ error: "Please describe the job you need quoted." }, { status: 400 })

    // The operator must genuinely belong to the workspace they're requesting as.
    if (!(await isMember(supabase, operatorWorkspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Resolve the SUPPLIER workspace from the published listing — server-side,
    // un-spoofable. Also gives us a sensible default quote title.
    let supplierWorkspaceId: string | null = null
    let listingTitle: string | null = null
    try {
      const { data: listing, error } = await supabase
        .from("marketplace_listings")
        .select("id, title, workspace_id, status")
        .eq("id", listingId)
        .in("status", ["published", "active"])
        .maybeSingle()
      if (error) {
        if (isMissing(error)) {
          return NextResponse.json({ error: "Marketplace is not available yet.", ready: false }, { status: 503 })
        }
        return NextResponse.json({ error: "Could not load this supplier." }, { status: 502 })
      }
      const row = listing as { workspace_id?: string; title?: string } | null
      supplierWorkspaceId = row?.workspace_id ?? null
      listingTitle = row?.title ?? null
    } catch (err) {
      if (isMissing(err)) {
        return NextResponse.json({ error: "Marketplace is not available yet.", ready: false }, { status: 503 })
      }
      throw err
    }

    if (!supplierWorkspaceId) {
      return NextResponse.json({ error: "This supplier is no longer available." }, { status: 404 })
    }
    // Don't let a workspace request a quote from itself.
    if (supplierWorkspaceId === operatorWorkspaceId) {
      return NextResponse.json({ error: "You can't request a quote from your own listing." }, { status: 400 })
    }

    // Fold the structured context into the row. The v2 quotes table is
    // intentionally lean (title/description/amount/valid_until/property_id), so
    // urgency + budget are surfaced in the description the supplier reads.
    const urgencyLabel = urg === "emergency" ? "EMERGENCY" : urg === "urgent" ? "Urgent" : "Standard"
    const title = `Quote request — ${propertyLabel ?? listingTitle ?? "new job"}`.slice(0, 200)

    const contextLines: string[] = []
    contextLines.push(`Priority: ${urgencyLabel}`)
    if (propertyLabel) contextLines.push(`Property: ${propertyLabel}`)
    if (preferredDate) contextLines.push(`Preferred date: ${preferredDate}`)
    if (budgetMinPence != null || budgetMaxPence != null) {
      const fmt = (p: number) => `£${(p / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
      const range =
        budgetMinPence != null && budgetMaxPence != null
          ? `${fmt(budgetMinPence)}–${fmt(budgetMaxPence)}`
          : budgetMinPence != null
            ? `from ${fmt(budgetMinPence)}`
            : `up to ${fmt(budgetMaxPence as number)}`
      contextLines.push(`Budget indication: ${range}`)
    }
    const fullDescription = `${contextLines.join("\n")}\n\n${description}`.slice(0, 6000)

    // `property_id` is a free uuid column on the v2 table (no FK), so we only
    // stamp it when it looks like a uuid to avoid a type error.
    const looksUuid = propertyId && /^[0-9a-f-]{32,40}$/i.test(propertyId)

    try {
      const { data, error } = await supabase
        .from("supplier_marketplace_quotes")
        .insert({
          operator_workspace_id: operatorWorkspaceId,
          supplier_workspace_id: supplierWorkspaceId,
          property_id: looksUuid ? propertyId : null,
          title,
          description: fullDescription,
          status: "requested",
          currency: "GBP",
          valid_until: preferredDate,
          created_by: user.id,
        })
        .select("id")
        .single()
      if (error) {
        if (isMissing(error)) {
          return NextResponse.json({ error: "Quote requests aren't available yet.", ready: false }, { status: 503 })
        }
        return NextResponse.json({ error: "Could not send your quote request. Please try again." }, { status: 502 })
      }
      return NextResponse.json({ ok: true, quoteId: (data as { id: string }).id })
    } catch (err) {
      if (isMissing(err)) {
        return NextResponse.json({ error: "Quote requests aren't available yet.", ready: false }, { status: 503 })
      }
      throw err
    }
  } catch (err) {
    captureException(err, { source: "api/marketplace/quote-requests", requestId })
    return NextResponse.json({ error: "We couldn't send your quote request. Please try again.", requestId }, { status: 500 })
  }
}
