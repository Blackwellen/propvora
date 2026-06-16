import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/marketplace/enquiries — REAL "request a quote" / enquiry write.

   This is the supplier/service primary CTA target. It writes a row to
   `marketplace_enquiries`, whose RLS (`marketplace_enquiries_public_insert`)
   permits anon + authenticated inserts, so a guest on a public supplier page
   can request a quote, and the seller reads it via their own dashboard
   (`marketplace_enquiries_seller_read`).

   Server-authoritative: the listing must be published/active; we resolve its id
   server-side and stamp buyer identity from the session when present. Tolerant:
   a cold/missing table → a friendly 503 "not ready", never a 500.
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

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }

    const listingId = clean(body.listingId, 64)
    const message = clean(body.message)
    const buyerName = clean(body.name, 200)
    const buyerEmail = clean(body.email, 320)
    const buyerPhone = clean(body.phone, 60)
    const buyerWorkspaceId = clean(body.buyerWorkspaceId, 64)
    const gdprConsent = body.gdprConsent === true

    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    if (!message) return NextResponse.json({ error: "Please include a message." }, { status: 400 })
    // Guests must give a contact route; signed-in users have one in the session.
    if (!user && !buyerEmail) {
      return NextResponse.json({ error: "Please include an email so the supplier can reply." }, { status: 400 })
    }

    // Verify the listing is genuinely public before recording an enquiry.
    let sellerOk = false
    try {
      const { data: listing, error } = await supabase
        .from("marketplace_listings")
        .select("id, status")
        .eq("id", listingId)
        .in("status", ["published", "active"])
        .maybeSingle()
      if (error) {
        if (isMissing(error)) {
          return NextResponse.json({ error: "Marketplace is not available yet.", ready: false }, { status: 503 })
        }
      }
      sellerOk = Boolean(listing)
    } catch (err) {
      if (isMissing(err)) {
        return NextResponse.json({ error: "Marketplace is not available yet.", ready: false }, { status: 503 })
      }
      throw err
    }
    if (!sellerOk) return NextResponse.json({ error: "This listing is no longer available." }, { status: 404 })

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null

    try {
      const { data, error } = await supabase
        .from("marketplace_enquiries")
        .insert({
          listing_id: listingId,
          buyer_workspace_id: buyerWorkspaceId,
          buyer_user_id: user?.id ?? null,
          buyer_name: buyerName,
          buyer_email: buyerEmail ?? user?.email ?? null,
          buyer_phone: buyerPhone,
          message,
          gdpr_consent: gdprConsent,
          ip_address: ip,
          status: "new",
        })
        .select("id")
        .single()
      if (error) {
        if (isMissing(error)) {
          return NextResponse.json({ error: "Marketplace is not available yet.", ready: false }, { status: 503 })
        }
        return NextResponse.json({ error: "Could not send your enquiry. Please try again." }, { status: 502 })
      }
      return NextResponse.json({ ok: true, enquiryId: (data as { id: string }).id })
    } catch (err) {
      if (isMissing(err)) {
        return NextResponse.json({ error: "Marketplace is not available yet.", ready: false }, { status: 503 })
      }
      throw err
    }
  } catch (err) {
    captureException(err, { source: "api/marketplace/enquiries", requestId })
    return NextResponse.json({ error: "We couldn't send your enquiry. Please try again.", requestId }, { status: 500 })
  }
}
