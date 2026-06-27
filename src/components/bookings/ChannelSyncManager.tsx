"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import {
  CalendarSync,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   ChannelSyncManager — iCal channel-sync control panel for ONE booking listing.

   EXPORT: creates an unguessable public feed URL (dates only — no guest data)
   that Airbnb / Booking.com / Vrbo / Google / Outlook subscribe to.
   IMPORT: registers an external .ics URL Propvora pulls; a manual refresh
   fetches it, blocks the busy dates, and surfaces any conflicts vs live
   direct bookings.

   This component is self-contained: it talks only to the iCal API routes
   (/api/booking/ical/*) and does NOT touch the bookings agent's server.ts,
   actions, or BookingCalendar. No Tailwind `dark:` classes (project rule).
─────────────────────────────────────────────────────────────────────────── */

const CHANNELS = [
  { value: "airbnb", label: "Airbnb" },
  { value: "booking", label: "Booking.com" },
  { value: "vrbo", label: "Vrbo" },
  { value: "google", label: "Google Calendar" },
  { value: "outlook", label: "Outlook" },
  { value: "other", label: "Other" },
] as const

interface Connection {
  id: string
  direction: "import" | "export"
  channel: string
  importUrl: string | null
  exportToken: string | null
  active: boolean
  lastSyncedAt: string | null
  lastStatus: string | null
  lastError: string | null
  lastEventCount: number
  publicUrl: string | null
}

interface SyncEvent {
  id: string
  direction: string
  status: string
  eventsParsed: number
  daysBlocked: number
  conflicts: number
  createdAt: string
}

interface RefreshResult {
  channel: string
  status: string
  eventsParsed: number
  daysBlocked: number
  conflicts: number
  conflictRanges: Array<{ start: string; end: string; reason: string }>
  error: string | null
}

export interface ChannelSyncManagerProps {
  listingId: string
  listingTitle?: string
}

export default function ChannelSyncManager({ listingId, listingTitle }: ChannelSyncManagerProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [events, setEvents] = useState<SyncEvent[]>([])
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [importUrl, setImportUrl] = useState("")
  const [importChannel, setImportChannel] = useState<string>("airbnb")
  const [lastRefresh, setLastRefresh] = useState<RefreshResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/booking/ical/connections?listingId=${encodeURIComponent(listingId)}`, {
        cache: "no-store",
      })
      const json = await res.json()
      setReady(Boolean(json.ready))
      setConnections(Array.isArray(json.connections) ? json.connections : [])
      setEvents(Array.isArray(json.events) ? json.events : [])
    } catch {
      setReady(false)
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    void load()
  }, [load])

  const exportConn = connections.find((c) => c.direction === "export")
  const importConns = connections.filter((c) => c.direction === "import")

  function copy(url: string) {
    void navigator.clipboard?.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 1800)
  }

  function createExport() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/booking/ical/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, action: "create_export", channel: "other" }),
        })
        const json = await res.json()
        if (!res.ok) setError(json.error ?? "Could not create export feed")
        await load()
      } catch {
        setError("Could not create export feed")
      }
    })
  }

  function addImport() {
    setError(null)
    if (!/^https?:\/\//i.test(importUrl.trim())) {
      setError("Enter a valid iCal URL (https://…)")
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/booking/ical/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            action: "add_import",
            importUrl: importUrl.trim(),
            channel: importChannel,
          }),
        })
        const json = await res.json()
        if (!res.ok) setError(json.error ?? "Could not add import URL")
        else setImportUrl("")
        await load()
      } catch {
        setError("Could not add import URL")
      }
    })
  }

  function removeConnection(connectionId: string) {
    startTransition(async () => {
      try {
        await fetch("/api/booking/ical/connections", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, connectionId }),
        })
        await load()
      } catch {
        /* surfaced on reload */
      }
    })
  }

  function refresh(connectionId?: string) {
    setError(null)
    setLastRefresh(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/booking/ical/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, connectionId }),
        })
        const json = await res.json()
        if (!res.ok) setError(json.error ?? "Sync failed")
        else setLastRefresh(Array.isArray(json.results) ? json.results : [])
        await load()
      } catch {
        setError("Sync failed")
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 p-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading channel sync…
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Channel sync is not available yet for this workspace. Once the booking schema is provisioned,
        you&rsquo;ll be able to connect Airbnb, Booking.com, Vrbo, Google and Outlook calendars here.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--color-brand-100)] flex items-center justify-center flex-shrink-0">
          <CalendarSync className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Channel sync (iCal)</h2>
          <p className="text-sm text-slate-600">
            Keep availability in step with other platforms{listingTitle ? ` for ${listingTitle}` : ""}.
            Sync uses the iCal standard.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Honest limitation banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex gap-2 text-xs text-slate-600 leading-relaxed">
        <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>
          iCal sync is <strong>periodic, not real-time</strong>, and carries dates only (no prices or
          guest details). There is always a short window where a date can be double-booked on two
          platforms before sync catches up — you remain responsible for resolving conflicts. See the{" "}
          <a href="/legal/channel-sync-disclaimer" className="text-[var(--brand)] hover:text-[var(--brand)]">
            Channel Sync Disclaimer
          </a>
          .
        </span>
      </div>

      {/* EXPORT */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">Export — share this listing&rsquo;s calendar</h3>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Give this private link to Airbnb, Booking.com, Vrbo, Google or Outlook so they block these
          dates. The feed contains dates only — never guest names, prices or any private data.
        </p>
        {exportConn?.publicUrl ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {exportConn.publicUrl}
            </code>
            <button
              type="button"
              onClick={() => copy(exportConn.publicUrl!)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied === exportConn.publicUrl ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={createExport}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            Generate export link
          </button>
        )}
      </section>

      {/* IMPORT */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="h-4 w-4 text-[var(--brand)]" />
          <h3 className="text-sm font-semibold text-slate-900">Import — pull another platform&rsquo;s calendar</h3>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Paste the iCal export URL from another platform. Propvora will block those dates here and
          flag any clash with a live direct booking.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <select
            value={importChannel}
            onChange={(e) => setImportChannel(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://www.airbnb.com/calendar/ical/…"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={addImport}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {importConns.length > 0 && (
          <ul className="space-y-2">
            {importConns.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
                  {c.channel}
                </span>
                <code className="flex-1 truncate text-xs text-slate-600">{c.importUrl}</code>
                <StatusPill status={c.lastStatus} />
                <button
                  type="button"
                  onClick={() => refresh(c.id)}
                  disabled={pending}
                  title="Sync now"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
                </button>
                <button
                  type="button"
                  onClick={() => removeConnection(c.id)}
                  disabled={pending}
                  title="Remove"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {importConns.length > 0 && (
          <button
            type="button"
            onClick={() => refresh()}
            disabled={pending}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync all now
          </button>
        )}
      </section>

      {/* Last refresh results (incl conflicts) */}
      {lastRefresh && lastRefresh.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Last sync</h3>
          <ul className="space-y-2 text-xs">
            {lastRefresh.map((r, i) => (
              <li key={i} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <StatusPill status={r.status} />
                  <span className="capitalize font-medium text-slate-700">{r.channel}</span>
                  <span className="text-slate-500">
                    {r.eventsParsed} events · {r.daysBlocked} days blocked · {r.conflicts} conflicts
                  </span>
                </div>
                {r.error && <p className="mt-1 text-rose-600">Error: {r.error}</p>}
                {r.conflictRanges.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {r.conflictRanges.map((cr, j) => (
                      <p key={j} className="flex items-center gap-1.5 text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {cr.start} → {cr.end}: {cr.reason}
                      </p>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sync history */}
      {events.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Sync history</h3>
          <ul className="divide-y divide-slate-100 text-xs">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-2 py-2">
                <StatusPill status={e.status} />
                <span className="capitalize text-slate-600">{e.direction}</span>
                <span className="text-slate-500">
                  {e.eventsParsed} events · {e.daysBlocked} blocked · {e.conflicts} conflicts
                </span>
                <span className="ml-auto text-slate-400">{formatWhen(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        never synced
      </span>
    )
  }
  const map: Record<string, string> = {
    ok: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    partial: "bg-amber-50 text-amber-700 border border-amber-200",
    error: "bg-rose-50 text-rose-700 border border-rose-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        map[status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {status}
    </span>
  )
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}
