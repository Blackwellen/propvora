/**
 * Observability — pluggable, dependency-free error/event capture.
 *
 * Goals:
 *  • Sentry-ready: if a DSN is configured AND a sink is registered, errors are
 *    forwarded. Otherwise it degrades gracefully to a structured `console.error`.
 *  • Never throws: capture must never become the source of a new error.
 *  • Never leaks secrets/PII: only a bounded, allow-listed shape is emitted —
 *    message, name, a truncated stack, a request id and small scalar context.
 *
 * There is intentionally NO hard dependency on @sentry/* here. To wire Sentry
 * (or any APM) later, call `registerSink()` once at startup with an adapter
 * that forwards the normalised event. Until then this is a no-op beyond logging.
 */

export type Severity = "fatal" | "error" | "warning" | "info"

export interface CaptureContext {
  /** Correlates a server error with the request that produced it. */
  requestId?: string
  /** Logical source, e.g. "api/upload", "global-error". */
  source?: string
  /**
   * Small, non-sensitive scalars only (ids, counts, status codes). Never put
   * tokens, request bodies, headers, emails or other PII here — values are
   * shallow-scrubbed but the safest rule is: don't pass secrets.
   */
  tags?: Record<string, string | number | boolean | null | undefined>
}

export interface NormalisedEvent {
  level: Severity
  message: string
  name?: string
  stack?: string
  requestId?: string
  source?: string
  tags?: Record<string, string | number | boolean | null>
  time: string
}

/** A sink forwards normalised events to an external system (Sentry, etc.). */
export type ObservabilitySink = (event: NormalisedEvent) => void

let sink: ObservabilitySink | null = null

/**
 * Register an external sink (e.g. a Sentry adapter). Safe to call once at
 * startup. Passing null clears it. Errors thrown by the sink are swallowed.
 */
export function registerSink(next: ObservabilitySink | null): void {
  sink = next
}

/** True when an observability DSN is configured in the environment. */
export function isObservabilityEnabled(): boolean {
  return Boolean(
    process.env.SENTRY_DSN ||
      process.env.NEXT_PUBLIC_SENTRY_DSN ||
      process.env.OBSERVABILITY_DSN
  )
}

const MAX_MESSAGE = 2000
const MAX_STACK = 4000
const MAX_TAG_VALUE = 200
const MAX_TAGS = 30

/** Keys whose values must never be emitted, even if mistakenly passed as tags. */
const SENSITIVE_KEY = /(token|secret|password|passwd|authorization|auth|cookie|session|api[_-]?key|bearer|email|phone|ssn|card|cvv|dsn)/i

function scrubTags(
  tags: CaptureContext["tags"]
): Record<string, string | number | boolean | null> | undefined {
  if (!tags) return undefined
  const out: Record<string, string | number | boolean | null> = {}
  let count = 0
  for (const [key, value] of Object.entries(tags)) {
    if (count >= MAX_TAGS) break
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]"
      count++
      continue
    }
    if (value === undefined) continue
    if (value === null || typeof value === "boolean" || typeof value === "number") {
      out[key] = value
    } else {
      // Coerce to a bounded string; never emit objects (could carry PII).
      out[key] = String(value).slice(0, MAX_TAG_VALUE)
    }
    count++
  }
  return out
}

function normalise(
  level: Severity,
  input: unknown,
  ctx?: CaptureContext
): NormalisedEvent {
  let message = ""
  let name: string | undefined
  let stack: string | undefined

  if (input instanceof Error) {
    message = input.message
    name = input.name
    stack = input.stack
  } else if (typeof input === "string") {
    message = input
  } else {
    // Avoid JSON.stringify on unknown objects — could serialise secrets. Use a
    // safe, generic label instead.
    message = "Non-error value captured"
  }

  return {
    level,
    message: message.slice(0, MAX_MESSAGE),
    name,
    stack: stack ? stack.slice(0, MAX_STACK) : undefined,
    requestId: ctx?.requestId,
    source: ctx?.source,
    tags: scrubTags(ctx?.tags),
    time: new Date().toISOString(),
  }
}

function emit(event: NormalisedEvent): void {
  // 1. Forward to a registered sink (Sentry/APM) when present.
  if (sink) {
    try {
      sink(event)
    } catch {
      /* a sink failure must never escalate */
    }
  }

  // 2. Always log a structured line for local/server diagnostics. This is the
  //    degraded path when no DSN/sink is configured, and a useful trace even
  //    when one is. Stack is included server-side only via the structured field.
  try {
    const line = {
      msg: "observability",
      level: event.level,
      source: event.source ?? null,
      requestId: event.requestId ?? null,
      error: event.name ?? null,
      message: event.message,
      tags: event.tags ?? null,
      time: event.time,
    }
    if (event.level === "error" || event.level === "fatal") {
      console.error(JSON.stringify(line))
    } else if (event.level === "warning") {
      console.warn(JSON.stringify(line))
    } else {
      console.log(JSON.stringify(line))
    }
  } catch {
    /* logging must never throw */
  }
}

/**
 * Capture an exception. Returns the request id used (generating one if absent),
 * so callers can surface it to the user / response headers for correlation.
 * Never throws.
 */
export function captureException(error: unknown, ctx?: CaptureContext): string {
  try {
    const requestId = ctx?.requestId ?? newRequestId()
    emit(normalise("error", error, { ...ctx, requestId }))
    return requestId
  } catch {
    return ctx?.requestId ?? "unknown"
  }
}

/** Capture a non-error message (warning/info). Never throws. Returns request id. */
export function captureMessage(
  message: string,
  level: Severity = "info",
  ctx?: CaptureContext
): string {
  try {
    const requestId = ctx?.requestId ?? newRequestId()
    emit(normalise(level, message, { ...ctx, requestId }))
    return requestId
  } catch {
    return ctx?.requestId ?? "unknown"
  }
}

/**
 * Generate a short, URL-safe request id. Uses crypto.randomUUID where available
 * (Node 19+/Edge/modern browsers), with a non-crypto fallback. IDs are opaque
 * correlation handles only — they carry no user data.
 */
export function newRequestId(): string {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto
    if (c?.randomUUID) return c.randomUUID()
  } catch {
    /* fall through */
  }
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Read an existing request id from inbound headers (set by an upstream proxy or
 * the platform), or mint a new one. Standard header names only.
 */
export function requestIdFrom(headers: Headers | null | undefined): string {
  try {
    const fromHeader =
      headers?.get("x-request-id") ??
      headers?.get("x-correlation-id") ??
      headers?.get("cf-ray")
    if (fromHeader) return fromHeader.slice(0, 200)
  } catch {
    /* ignore */
  }
  return newRequestId()
}
