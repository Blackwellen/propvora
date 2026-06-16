import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { captureException, requestIdFrom } from "@/lib/observability"
import { getBookingListing } from "@/lib/booking/booking-listings"
import {
  listConnections,
  listSyncEvents,
  ensureExportConnection,
  addImportConnection,
  deleteConnection,
  normaliseChannel,
} from "@/lib/booking/ical"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Operator-only iCal connection management for a listing.
 *
 *   GET    ?listingId=  → connections + recent sync events + the export URL.
 *   POST   { listingId, action:'create_export'|'add_import', channel, importUrl }
 *   DELETE { listingId, connectionId }
 *
 * Authorisation: every call first verifies (with the request's cookie-scoped,
 * RLS-bound client) that the caller can see the listing — i.e. is a member of
 * its workspace. Only after that do we use the listing's workspace_id for the
 * connection rows. Writes use the cookie client so RLS double-enforces.
 */

async function authorisedListing(listingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, listing: null, status: 401 as const }
  const listing = await getBookingListing(supabase, listingId)
  if (!listing) return { supabase, listing: null, status: 404 as const }
  return { supabase, listing, status: 200 as const }
}

function exportUrl(request: Request, token: string): string {
  const origin = new URL(request.url).origin
  return `${origin}/api/booking/ical/${token}.ics`
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const listingId = (new URL(request.url).searchParams.get("listingId") ?? "").trim()
    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })

    const { supabase, listing, status } = await authorisedListing(listingId)
    if (!listing) return NextResponse.json({ error: "not_found_or_unauthorised" }, { status })

    const connections = await listConnections(supabase, listingId)
    const events = await listSyncEvents(supabase, listingId)
    const withUrls = connections.map((c) => ({
      ...c,
      publicUrl: c.direction === "export" && c.exportToken ? exportUrl(request, c.exportToken) : null,
    }))
    return NextResponse.json(
      { ready: true, connections: withUrls, events },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    captureException(err, { source: "api/booking/ical/connections GET", requestId })
    return NextResponse.json({ ready: false, connections: [], events: [] })
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const listingId = String(body.listingId ?? "").trim()
    const action = String(body.action ?? "").trim()
    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })

    const { supabase, listing, status } = await authorisedListing(listingId)
    if (!listing) return NextResponse.json({ error: "not_found_or_unauthorised" }, { status })

    const channel = normaliseChannel(body.channel as string | undefined)

    if (action === "create_export") {
      const res = await ensureExportConnection(supabase, listingId, listing.workspaceId, channel)
      if (!res.ok) return NextResponse.json({ error: res.error ?? "failed" }, { status: 400 })
      return NextResponse.json({
        ok: true,
        token: res.token,
        publicUrl: res.token ? exportUrl(request, res.token) : null,
      })
    }

    if (action === "add_import") {
      const importUrl = String(body.importUrl ?? "").trim()
      const res = await addImportConnection(supabase, listingId, listing.workspaceId, importUrl, channel)
      if (!res.ok) return NextResponse.json({ error: res.error ?? "failed" }, { status: 400 })
      return NextResponse.json({ ok: true, id: res.id })
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 })
  } catch (err) {
    captureException(err, { source: "api/booking/ical/connections POST", requestId })
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const listingId = String(body.listingId ?? "").trim()
    const connectionId = String(body.connectionId ?? "").trim()
    if (!listingId || !connectionId) {
      return NextResponse.json({ error: "listingId and connectionId are required" }, { status: 400 })
    }
    const { supabase, listing, status } = await authorisedListing(listingId)
    if (!listing) return NextResponse.json({ error: "not_found_or_unauthorised" }, { status })

    const res = await deleteConnection(supabase, connectionId)
    if (!res.ok) return NextResponse.json({ error: res.error ?? "failed" }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { source: "api/booking/ical/connections DELETE", requestId })
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
