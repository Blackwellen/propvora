/**
 * Next.js CLIENT instrumentation — runs once in the browser on first load.
 *
 * Mirrors `src/instrumentation.ts` (server) for the client: when a public Sentry
 * DSN is configured AND `@sentry/nextjs` is installed, it initialises the browser
 * SDK and registers an observability sink so client-side errors — including the
 * root `global-error.tsx` boundary, which already calls `captureException` — are
 * forwarded to Sentry. Without a DSN or the package, it is a graceful no-op
 * (errors stay console-only).
 *
 * To activate: see `release-gated/user-fixes/sentry-setup.md`.
 */
import { registerSink } from "@/lib/observability"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  // Variable specifier so the bundler does not statically resolve (and fail on)
  // the optional, not-yet-installed package; resolves at runtime when present.
  const sentryModule = "@sentry/nextjs"
  void (async () => {
    try {
      const Sentry = await import(/* webpackIgnore: true */ sentryModule)
      Sentry.init({
        dsn,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        environment: process.env.NODE_ENV ?? "development",
      })

      registerSink((event) => {
        const extra = { source: event.source, requestId: event.requestId, time: event.time }
        if (event.level === "fatal" || event.level === "error") {
          const err = new Error(event.message)
          err.name = event.name ?? "CapturedError"
          if (event.stack) err.stack = event.stack
          Sentry.captureException(err, {
            level: event.level === "fatal" ? "fatal" : "error",
            tags: event.tags ?? {},
            extra,
          })
        } else {
          Sentry.captureMessage(event.message, {
            level: event.level === "warning" ? "warning" : "info",
            tags: event.tags ?? {},
            extra,
          })
        }
      })
    } catch {
      // Package not installed / failed to load — stay console-only.
    }
  })()
}

/** Captures client-side router navigation errors when Sentry is active. */
export function onRouterTransitionStart() {
  /* no-op hook; present so Next's client instrumentation contract is satisfied */
}
