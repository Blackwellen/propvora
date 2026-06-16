// ============================================================================
// iCal CHANNEL SYNC — Phase 1.
//
// A self-contained RFC 5545 (iCalendar) generator + parser plus the data layer
// for per-listing import/export connections (booking_ical_connections) and an
// append-only sync-event audit (booking_ical_sync_events).
//
//   EXPORT  — build a VCALENDAR of a listing's blocked + booked dates (dates
//             only; NO guest names, prices or PII) that Airbnb / Booking.com /
//             Vrbo / Google / Outlook can subscribe to by URL. Served by the
//             public-by-token route /api/booking/ical/[token].ics.
//
//   IMPORT  — fetch an external .ics URL, parse its VEVENTs into busy date
//             ranges, write them to booking_availability_days as
//             status='blocked_channel' (the valid CHECK value; the external
//             channel is tagged in `note`), DETECT conflicts against live
//             direct bookings, and record a sync event.
//
// Honest limitation (see Channel Sync Disclaimer): iCal carries dates only and
// sync is periodic — it cannot guarantee real-time, conflict-free calendars.
//
// Every store call is schema-tolerant (42P01/42703/PGRST20x → safe default) so a
// cold or migrating DB never hard-fails. All ranges are half-open [start,end):
// the DTEND day is a departure day and is itself bookable by the next guest.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

const NOT_PROVISIONED = new Set(["42P01", "42703", "PGRST205", "PGRST204"])
function isMissingSchema(e: unknown): boolean {
  const c = (e as { code?: string } | null)?.code
  return Boolean(c && NOT_PROVISIONED.has(c))
}

const MS_PER_DAY = 86_400_000

// ─── Known channels (label only — informational) ────────────────────────────
export const ICAL_CHANNELS = [
  "airbnb",
  "booking",
  "vrbo",
  "google",
  "outlook",
  "other",
] as const
export type IcalChannel = (typeof ICAL_CHANNELS)[number]

export function normaliseChannel(v: string | null | undefined): IcalChannel {
  const s = (v ?? "").toLowerCase().trim()
  return (ICAL_CHANNELS as readonly string[]).includes(s) ? (s as IcalChannel) : "other"
}

// ════════════════════════════════════════════════════════════════════════════
// DATE HELPERS — date-only (yyyy-mm-dd) <-> iCal DATE (yyyymmdd)
// ════════════════════════════════════════════════════════════════════════════

/** "2026-06-20" -> "20260620" (iCal VALUE=DATE form). */
export function toIcalDate(iso: string): string {
  return iso.replace(/-/g, "").slice(0, 8)
}

/** "20260620" -> "2026-06-20". Returns null if not a plausible date token. */
export function fromIcalDate(token: string): string | null {
  const m = token.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

/** UTC timestamp "20260620T101500Z" or local "20260620T101500" -> date "2026-06-20". */
export function fromIcalDateTime(token: string): string | null {
  return fromIcalDate(token)
}

/** Inclusive list of yyyy-mm-dd days in the half-open range [start, end). */
export function eachDay(startInclusive: string, endExclusive: string): string[] {
  const out: string[] = []
  const [sy, sm, sd] = startInclusive.split("-").map(Number)
  const [ey, em, ed] = endExclusive.split("-").map(Number)
  let cur = Date.UTC(sy, (sm ?? 1) - 1, sd ?? 1)
  const end = Date.UTC(ey, (em ?? 1) - 1, ed ?? 1)
  while (cur < end) {
    out.push(new Date(cur).toISOString().slice(0, 10))
    cur += MS_PER_DAY
  }
  return out
}

/** Add `n` days to a yyyy-mm-dd date. */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + n)).toISOString().slice(0, 10)
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATOR — build a VCALENDAR (export feed)
// ════════════════════════════════════════════════════════════════════════════

/** A busy span to publish. [start, end) half-open; summary is generic only. */
export interface BusySpan {
  /** yyyy-mm-dd inclusive first blocked night. */
  start: string
  /** yyyy-mm-dd exclusive checkout/departure day. */
  end: string
  /** Generic label only — NEVER guest data. e.g. "Booked" / "Blocked". */
  summary: string
  /** Stable identifier (e.g. booking id or "block-<date>") used for UID. */
  uid: string
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
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

/** A compact UTC DTSTAMP token, e.g. 20260616T120000Z. */
function dtstamp(now = new Date()): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").slice(0, 15) + "Z"
}

/**
 * Build a valid VCALENDAR string of the given busy spans. Dates only, no PII.
 * Suitable for Airbnb/Booking/Vrbo/Google/Outlook import.
 */
export function buildIcalFeed(opts: {
  calendarName: string
  spans: BusySpan[]
  domain?: string
  now?: Date
}): string {
  const { calendarName, spans, domain = "propvora.com" } = opts
  const stamp = dtstamp(opts.now)
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Propvora//Booking Channel Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ]
  for (const s of spans) {
    lines.push("BEGIN:VEVENT")
    lines.push(`UID:${escapeText(s.uid)}@${domain}`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART;VALUE=DATE:${toIcalDate(s.start)}`)
    lines.push(`DTEND;VALUE=DATE:${toIcalDate(s.end)}`)
    lines.push(`SUMMARY:${escapeText(s.summary)}`)
    lines.push("TRANSP:OPAQUE")
    lines.push("END:VEVENT")
  }
  lines.push("END:VCALENDAR")
  return lines.map(foldLine).join("\r\n") + "\r\n"
}

// ════════════════════════════════════════════════════════════════════════════
// PARSER — read an external VCALENDAR into busy spans
// ════════════════════════════════════════════════════════════════════════════

export interface ParsedEvent {
  start: string // yyyy-mm-dd inclusive
  end: string // yyyy-mm-dd exclusive
  uid: string | null
  summary: string | null
}

/**
 * Parse iCalendar text into busy date spans. Tolerant: unfolds continuation
 * lines, accepts VALUE=DATE and DATE-TIME forms, and skips events it cannot
 * place. A single-day DTSTART with no DTEND is treated as a 1-day block.
 */
export function parseIcal(text: string): ParsedEvent[] {
  // Unfold (RFC 5545: a CRLF followed by space/tab continues the previous line).
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "")
  const lines = unfolded.split(/\r\n|\n|\r/)
  const events: ParsedEvent[] = []
  let cur: { start?: string; end?: string; uid?: string; summary?: string } | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (line === "BEGIN:VEVENT") {
      cur = {}
      continue
    }
    if (line === "END:VEVENT") {
      if (cur && cur.start) {
        // No DTEND → single-day block (DTEND = next day, half-open).
        const end = cur.end ?? addDays(cur.start, 1)
        // Guard against zero/negative spans.
        if (end > cur.start) {
          events.push({
            start: cur.start,
            end,
            uid: cur.uid ?? null,
            summary: cur.summary ?? null,
          })
        }
      }
      cur = null
      continue
    }
    if (!cur) continue

    const idx = line.indexOf(":")
    if (idx < 0) continue
    const left = line.slice(0, idx)
    const value = line.slice(idx + 1).trim()
    const name = left.split(";")[0].toUpperCase()

    if (name === "DTSTART") {
      const d = value.length > 8 ? fromIcalDateTime(value) : fromIcalDate(value)
      if (d) cur.start = d
    } else if (name === "DTEND") {
      const d = value.length > 8 ? fromIcalDateTime(value) : fromIcalDate(value)
      if (d) cur.end = d
    } else if (name === "UID") {
      cur.uid = value
    } else if (name === "SUMMARY") {
      cur.summary = value
    }
  }
  return events
}

// ════════════════════════════════════════════════════════════════════════════
// CONNECTION DATA LAYER (booking_ical_connections)
// ════════════════════════════════════════════════════════════════════════════

export interface IcalConnection {
  id: string
  listingId: string
  workspaceId: string
  direction: "import" | "export"
  channel: IcalChannel
  importUrl: string | null
  exportToken: string | null
  active: boolean
  lastSyncedAt: string | null
  lastStatus: string | null
  lastError: string | null
  lastEventCount: number
  createdAt: string
}

interface ConnRow {
  id: string
  listing_id: string
  workspace_id: string
  direction: "import" | "export"
  channel: string
  import_url: string | null
  export_token: string | null
  active: boolean
  last_synced_at: string | null
  last_status: string | null
  last_error: string | null
  last_event_count: number
  created_at: string
}

function mapConn(r: ConnRow): IcalConnection {
  return {
    id: r.id,
    listingId: r.listing_id,
    workspaceId: r.workspace_id,
    direction: r.direction,
    channel: normaliseChannel(r.channel),
    importUrl: r.import_url,
    exportToken: r.export_token,
    active: r.active,
    lastSyncedAt: r.last_synced_at,
    lastStatus: r.last_status,
    lastError: r.last_error,
    lastEventCount: r.last_event_count ?? 0,
    createdAt: r.created_at,
  }
}

/** Generate an unguessable export token (hex, 48 chars). */
export function generateExportToken(): string {
  const bytes = new Uint8Array(24)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

/** List all iCal connections for a listing (workspace-scoped via RLS). */
export async function listConnections(
  supabase: SupabaseClient,
  listingId: string,
): Promise<IcalConnection[]> {
  try {
    const { data, error } = await supabase
      .from("booking_ical_connections")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true })
    if (error || !Array.isArray(data)) return []
    return (data as ConnRow[]).map(mapConn)
  } catch {
    return []
  }
}

/** Look up a single export connection by its public token (service role only). */
export async function getConnectionByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<IcalConnection | null> {
  try {
    const { data, error } = await supabase
      .from("booking_ical_connections")
      .select("*")
      .eq("export_token", token)
      .eq("direction", "export")
      .eq("active", true)
      .maybeSingle()
    if (error || !data) return null
    return mapConn(data as ConnRow)
  } catch {
    return null
  }
}

/**
 * Create or rotate the single EXPORT connection for a listing, returning the
 * token. Idempotent per (listing, export): reuses the existing export row if one
 * exists. Workspace-scoped via RLS on the passed client.
 */
export async function ensureExportConnection(
  supabase: SupabaseClient,
  listingId: string,
  workspaceId: string,
  channel: IcalChannel = "other",
): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const existing = await supabase
      .from("booking_ical_connections")
      .select("id, export_token")
      .eq("listing_id", listingId)
      .eq("direction", "export")
      .maybeSingle()
    if (existing.data?.export_token) {
      return { ok: true, token: existing.data.export_token as string }
    }
    const token = generateExportToken()
    const { error } = await supabase.from("booking_ical_connections").insert({
      listing_id: listingId,
      workspace_id: workspaceId,
      direction: "export",
      channel,
      export_token: token,
      active: true,
    })
    if (error) {
      if (isMissingSchema(error)) return { ok: false, error: "schema_missing" }
      return { ok: false, error: error.message }
    }
    return { ok: true, token }
  } catch (e) {
    if (isMissingSchema(e)) return { ok: false, error: "schema_missing" }
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Add an IMPORT connection (external iCal URL) for a listing. */
export async function addImportConnection(
  supabase: SupabaseClient,
  listingId: string,
  workspaceId: string,
  importUrl: string,
  channel: IcalChannel = "other",
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!/^https?:\/\//i.test(importUrl)) {
    return { ok: false, error: "import_url must be an http(s) URL" }
  }
  try {
    const { data, error } = await supabase
      .from("booking_ical_connections")
      .insert({
        listing_id: listingId,
        workspace_id: workspaceId,
        direction: "import",
        channel,
        import_url: importUrl,
        active: true,
      })
      .select("id")
      .maybeSingle()
    if (error) {
      if (isMissingSchema(error)) return { ok: false, error: "schema_missing" }
      return { ok: false, error: error.message }
    }
    return { ok: true, id: (data as { id: string } | null)?.id }
  } catch (e) {
    if (isMissingSchema(e)) return { ok: false, error: "schema_missing" }
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Remove (or deactivate) a connection. */
export async function deleteConnection(
  supabase: SupabaseClient,
  connectionId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("booking_ical_connections")
      .delete()
      .eq("id", connectionId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT — build the feed for a listing from its real availability + bookings
// ════════════════════════════════════════════════════════════════════════════

/**
 * Collect the busy spans to publish for a listing: live direct bookings plus
 * any blocked availability days. Dates only — no guest data. Uses the passed
 * client (service role on the public route). Window defaults to today..+2y.
 */
export async function collectBusySpans(
  supabase: SupabaseClient,
  listingId: string,
  opts?: { from?: string; to?: string },
): Promise<BusySpan[]> {
  const from = opts?.from ?? new Date().toISOString().slice(0, 10)
  const to = opts?.to ?? addDays(from, 730)
  const spans: BusySpan[] = []

  // 1. Live bookings (occupy [check_in, check_out)). Exclude cancelled/no_show.
  //    A booking_listing id may live in either `listing_id` (legacy) or the
  //    `booking_listing_id` bridge column — match both.
  try {
    const { data } = await supabase
      .from("bookings")
      .select("id, check_in, check_out, status")
      .or(`listing_id.eq.${listingId},booking_listing_id.eq.${listingId}`)
      .lt("check_in", to)
      .gt("check_out", from)
      .not("status", "in", "(cancelled,no_show)")
    for (const r of (data ?? []) as Array<{ id: string; check_in: string; check_out: string }>) {
      if (r.check_out > r.check_in) {
        spans.push({ start: r.check_in, end: r.check_out, summary: "Booked", uid: `booking-${r.id}` })
      }
    }
  } catch {
    /* tolerant — bookings table may be cold */
  }

  // 2. Blocked availability days (status starting blocked_*). Group consecutive
  //    days into spans for a compact feed.
  try {
    const { data } = await supabase
      .from("booking_availability_days")
      .select("date, status")
      .eq("listing_id", listingId)
      .gte("date", from)
      .lt("date", to)
      .like("status", "blocked_%")
      .order("date", { ascending: true })
    const days = ((data ?? []) as Array<{ date: string }>).map((d) => d.date)
    let runStart: string | null = null
    let prev: string | null = null
    for (const day of days) {
      if (runStart === null) {
        runStart = day
        prev = day
      } else if (prev && day === addDays(prev, 1)) {
        prev = day
      } else {
        spans.push({ start: runStart, end: addDays(prev!, 1), summary: "Blocked", uid: `block-${runStart}` })
        runStart = day
        prev = day
      }
    }
    if (runStart && prev) {
      spans.push({ start: runStart, end: addDays(prev, 1), summary: "Blocked", uid: `block-${runStart}` })
    }
  } catch {
    /* tolerant — availability_days may be cold */
  }

  return spans
}

// ════════════════════════════════════════════════════════════════════════════
// IMPORT — fetch + parse an external URL, block dates, detect conflicts, log
// ════════════════════════════════════════════════════════════════════════════

export interface SyncOutcome {
  ok: boolean
  status: "ok" | "error" | "partial"
  eventsParsed: number
  daysBlocked: number
  conflicts: number
  conflictRanges: Array<{ start: string; end: string; reason: string }>
  error?: string
}

/** Fetch raw iCal text from a URL with a timeout. */
async function fetchIcalText(url: string, timeoutMs = 12_000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "text/calendar, text/plain, */*" },
      redirect: "follow",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

/**
 * Run an import sync for one connection: fetch the URL, parse VEVENTs, write the
 * blocked days to booking_availability_days (status='blocked_channel', external
 * channel tagged in `note`), detect conflicts vs live direct bookings, and
 * append a sync event. Pass a SERVICE-ROLE client (writes bypass RLS but are
 * gated by the caller having loaded the connection workspace-scoped first).
 *
 * `parsedTextOverride` lets a test/proof inject iCal text without a network call.
 */
export async function runImportSync(
  supabase: SupabaseClient,
  connection: IcalConnection,
  parsedTextOverride?: string,
): Promise<SyncOutcome> {
  const outcome: SyncOutcome = {
    ok: false,
    status: "error",
    eventsParsed: 0,
    daysBlocked: 0,
    conflicts: 0,
    conflictRanges: [],
  }

  // 1. Fetch + parse.
  let events: ParsedEvent[]
  try {
    const text = parsedTextOverride ?? (await fetchIcalText(connection.importUrl ?? ""))
    events = parseIcal(text)
    outcome.eventsParsed = events.length
  } catch (e) {
    outcome.error = e instanceof Error ? e.message : String(e)
    await touchConnection(supabase, connection.id, "error", 0, outcome.error)
    await logSyncEvent(supabase, connection, outcome)
    return outcome
  }

  // 2. Expand to individual blocked days (half-open ranges).
  const blockedDays = new Set<string>()
  for (const ev of events) for (const d of eachDay(ev.start, ev.end)) blockedDays.add(d)

  // 3. Conflict detection vs live direct bookings.
  try {
    const dates = Array.from(blockedDays)
    if (dates.length) {
      const minDate = dates.reduce((a, b) => (a < b ? a : b))
      const maxDate = addDays(dates.reduce((a, b) => (a > b ? a : b)), 1)
      const { data } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, status")
        .or(`listing_id.eq.${connection.listingId},booking_listing_id.eq.${connection.listingId}`)
        .lt("check_in", maxDate)
        .gt("check_out", minDate)
        .not("status", "in", "(cancelled,no_show)")
      for (const b of (data ?? []) as Array<{ check_in: string; check_out: string }>) {
        const overlap = eachDay(b.check_in, b.check_out).some((d) => blockedDays.has(d))
        if (overlap) {
          outcome.conflicts += 1
          outcome.conflictRanges.push({
            start: b.check_in,
            end: b.check_out,
            reason: "external block overlaps a live direct booking",
          })
        }
      }
    }
  } catch {
    /* conflict detection is best-effort */
  }

  // 4. Write blocked days (upsert; tag external channel in note).
  try {
    const note = `imported:${connection.channel}`
    const rows = Array.from(blockedDays).map((date) => ({
      listing_id: connection.listingId,
      date,
      status: "blocked_channel",
      note,
    }))
    if (rows.length) {
      const { error } = await supabase
        .from("booking_availability_days")
        .upsert(rows, { onConflict: "listing_id,date" })
      if (error) {
        if (!isMissingSchema(error)) {
          outcome.error = error.message
        }
        // schema_missing → treat as partial (events parsed, nothing written)
        outcome.status = "partial"
      } else {
        outcome.daysBlocked = rows.length
      }
    }
  } catch (e) {
    outcome.error = e instanceof Error ? e.message : String(e)
  }

  outcome.ok = !outcome.error
  outcome.status = outcome.error ? "error" : outcome.conflicts > 0 ? "partial" : "ok"
  await touchConnection(
    supabase,
    connection.id,
    outcome.status,
    outcome.eventsParsed,
    outcome.error ?? null,
  )
  await logSyncEvent(supabase, connection, outcome)
  return outcome
}

/** Update a connection's last_* sync columns. Tolerant. */
async function touchConnection(
  supabase: SupabaseClient,
  connectionId: string,
  status: string,
  eventCount: number,
  error: string | null,
): Promise<void> {
  try {
    await supabase
      .from("booking_ical_connections")
      .update({
        last_synced_at: new Date().toISOString(),
        last_status: status,
        last_error: error,
        last_event_count: eventCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)
  } catch {
    /* tolerant */
  }
}

/** Append an immutable sync-event audit row. Tolerant. */
async function logSyncEvent(
  supabase: SupabaseClient,
  connection: IcalConnection,
  outcome: SyncOutcome,
): Promise<void> {
  try {
    await supabase.from("booking_ical_sync_events").insert({
      connection_id: connection.id,
      listing_id: connection.listingId,
      workspace_id: connection.workspaceId,
      direction: connection.direction,
      status: outcome.status,
      events_parsed: outcome.eventsParsed,
      days_blocked: outcome.daysBlocked,
      conflicts: outcome.conflicts,
      detail: { error: outcome.error ?? null, conflictRanges: outcome.conflictRanges },
    })
  } catch {
    /* tolerant */
  }
}

/** Read the recent sync events for a listing (most recent first). */
export interface SyncEventRow {
  id: string
  connectionId: string
  direction: string
  status: string
  eventsParsed: number
  daysBlocked: number
  conflicts: number
  createdAt: string
}

export async function listSyncEvents(
  supabase: SupabaseClient,
  listingId: string,
  limit = 25,
): Promise<SyncEventRow[]> {
  try {
    const { data, error } = await supabase
      .from("booking_ical_sync_events")
      .select("id, connection_id, direction, status, events_parsed, days_blocked, conflicts, created_at")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !Array.isArray(data)) return []
    return (data as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string,
      connectionId: r.connection_id as string,
      direction: r.direction as string,
      status: r.status as string,
      eventsParsed: Number(r.events_parsed ?? 0),
      daysBlocked: Number(r.days_blocked ?? 0),
      conflicts: Number(r.conflicts ?? 0),
      createdAt: r.created_at as string,
    }))
  } catch {
    return []
  }
}
