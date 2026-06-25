// ============================================================================
// Calendar iCal subscribe feed — RFC 5545 generator for workspace events.
//
// Distinct from src/lib/booking/ical.ts (which publishes DATE-ONLY busy spans
// for channel managers). This feed publishes the workspace's native
// calendar_events with real start/end times so a property manager can subscribe
// to their operational calendar in Google / Outlook / Apple Calendar.
//
// Served public-by-token from /api/calendar/ical/[token].ics: the token is an
// unguessable secret on calendar_settings.ical_token, resolved via the service
// role. No workspace_id is ever accepted from the query string.
// ============================================================================

/** One event to publish in the feed. */
export interface CalendarFeedEvent {
  id: string
  title: string
  description?: string | null
  location?: string | null
  /** ISO datetime (timestamptz) for timed events. */
  startAt?: string | null
  endAt?: string | null
  /** yyyy-mm-dd for all-day / date-only events (fallback when startAt absent). */
  startDate?: string | null
  endDate?: string | null
  allDay?: boolean | null
}

/** RFC 5545 line folding: lines longer than 75 octets are folded. */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let rest = line
  parts.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74))
    rest = rest.slice(74)
  }
  if (rest.length) parts.push(" " + rest)
  return parts.join("\r\n")
}

function escapeText(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

/** "2026-06-20" -> "20260620" (iCal VALUE=DATE). */
function toIcalDate(iso: string): string {
  return iso.replace(/-/g, "").slice(0, 8)
}

/** ISO datetime -> UTC iCal token "20260620T101500Z". */
function toIcalDateTimeUtc(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").slice(0, 15) + "Z"
}

function dtstamp(now = new Date()): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").slice(0, 15) + "Z"
}

/** Add n days to a yyyy-mm-dd date string. */
function addDaysDate(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + n)).toISOString().slice(0, 10)
}

/**
 * Build a valid VCALENDAR string of the given events. Timed events emit UTC
 * DTSTART/DTEND; all-day events emit VALUE=DATE with a half-open DTEND (the day
 * after, so a single all-day event renders on exactly one day).
 */
export function buildCalendarIcalFeed(opts: {
  calendarName: string
  events: CalendarFeedEvent[]
  domain?: string
  now?: Date
}): string {
  const { calendarName, events, domain = "propvora.com" } = opts
  const stamp = dtstamp(opts.now)
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Propvora//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ]

  for (const e of events) {
    const allDay = Boolean(e.allDay) || (!e.startAt && Boolean(e.startDate))
    let dtStart = ""
    let dtEnd = ""

    if (allDay) {
      const sd = (e.startDate ?? (e.startAt ? e.startAt.slice(0, 10) : null))
      if (!sd) continue
      const ed = e.endDate ?? sd
      dtStart = `DTSTART;VALUE=DATE:${toIcalDate(sd)}`
      // Half-open exclusive end: render across at least one day.
      dtEnd = `DTEND;VALUE=DATE:${toIcalDate(addDaysDate(ed >= sd ? ed : sd, 1))}`
    } else {
      const sa = e.startAt
      if (!sa) continue
      const startTok = toIcalDateTimeUtc(sa)
      if (!startTok) continue
      dtStart = `DTSTART:${startTok}`
      const ea = e.endAt ?? new Date(new Date(sa).getTime() + 60 * 60_000).toISOString()
      const endTok = toIcalDateTimeUtc(ea)
      if (endTok) dtEnd = `DTEND:${endTok}`
    }

    lines.push("BEGIN:VEVENT")
    lines.push(`UID:event-${escapeText(e.id)}@${domain}`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(dtStart)
    if (dtEnd) lines.push(dtEnd)
    lines.push(`SUMMARY:${escapeText(e.title || "Untitled event")}`)
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`)
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`)
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.map(foldLine).join("\r\n") + "\r\n"
}
