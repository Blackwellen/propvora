import { createAdminClient } from "@/lib/supabase/admin"
import { captureException, requestIdFrom } from "@/lib/observability"
import { buildCalendarIcalFeed, type CalendarFeedEvent } from "@/lib/calendar/ical"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/calendar/ical/[token].ics
 *
 * PUBLIC-BY-TOKEN iCal subscribe feed for a workspace's native calendar events.
 * Google / Outlook / Apple Calendar subscribe to this URL to read the workspace
 * calendar. The token is an unguessable secret stored on
 * calendar_settings.ical_token and resolved here via the SERVICE role (the
 * settings table has no anon SELECT policy), so an attacker cannot enumerate
 * workspaces — they would need the exact token, which only their own user can
 * read in-app.
 *
 * The route accepts ".../[token]" or ".../[token].ics" (the .ics suffix is
 * stripped) so the URL pastes cleanly into calendar apps.
 *
 * Window: events from 90 days ago to 365 days ahead, archived rows excluded.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { token: raw } = await ctx.params
    const token = (raw ?? "").replace(/\.ics$/i, "").trim()
    if (!token || !/^[a-f0-9]{16,}$/i.test(token)) {
      return new Response("Not found", { status: 404 })
    }

    const admin = createAdminClient()

    // Resolve the token → workspace. Service role: settings is not anon-readable.
    const { data: settings, error: settingsErr } = await admin
      .from("calendar_settings")
      .select("workspace_id")
      .eq("ical_token", token)
      .maybeSingle()
    if (settingsErr || !settings?.workspace_id) {
      return new Response("Not found", { status: 404 })
    }

    const from = new Date(Date.now() - 90 * 86_400_000).toISOString()
    const to = new Date(Date.now() + 365 * 86_400_000).toISOString()

    const { data: rows } = await admin
      .from("calendar_events")
      .select("id, title, description, property_address, start_at, end_at, start_date, all_day")
      .eq("workspace_id", settings.workspace_id as string)
      .is("archived_at", null)
      .or(`start_at.gte.${from},start_date.gte.${from.slice(0, 10)}`)
      .lte("start_at", to)
      .order("start_at", { ascending: true })
      .limit(2000)

    const events: CalendarFeedEvent[] = ((rows ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      title: (r.title as string) ?? "Untitled event",
      description: (r.description as string) ?? null,
      location: (r.property_address as string) ?? null,
      startAt: (r.start_at as string) ?? null,
      endAt: (r.end_at as string) ?? null,
      startDate: (r.start_date as string) ?? null,
      allDay: Boolean(r.all_day),
    }))

    const feed = buildCalendarIcalFeed({
      calendarName: "Propvora Calendar",
      events,
    })

    return new Response(feed, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="propvora-calendar.ics"`,
        // Calendar apps poll periodically; allow a short cache.
        "Cache-Control": "public, max-age=900, s-maxage=900",
      },
    })
  } catch (err) {
    captureException(err, { source: "api/calendar/ical/[token] GET", requestId })
    // Return a syntactically-valid empty calendar rather than leaking an error.
    const empty = buildCalendarIcalFeed({ calendarName: "Propvora Calendar", events: [] })
    return new Response(empty, {
      status: 200,
      headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
    })
  }
}
