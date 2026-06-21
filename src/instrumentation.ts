/**
 * Next.js server instrumentation — runs once on cold start.
 *
 * Wires the Propvora observability sink when a Sentry DSN is configured.
 * No hard dependency on @sentry/nextjs — the import is attempted dynamically;
 * if the package is absent the app starts normally in console-only mode.
 *
 * To activate Sentry:
 *   1. npm install @sentry/nextjs
 *   2. Set SENTRY_DSN (or NEXT_PUBLIC_SENTRY_DSN) in your environment.
 *   3. Add a sentry.server.config.ts and sentry.client.config.ts if desired.
 */
export async function register() {
  const dsn =
    process.env.SENTRY_DSN ??
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    process.env.OBSERVABILITY_DSN

  if (!dsn) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[observability] No SENTRY_DSN set — errors are console-only. " +
          "Set SENTRY_DSN and install @sentry/nextjs to enable remote capture."
      )
    }
    return
  }

  try {
    // Dynamically load Sentry to keep it optional. The `@sentry/nextjs` package
    // must be installed by the operator (not bundled by default).
    const Sentry = await import(
      /* webpackIgnore: true */
      // @ts-expect-error: optional peer dependency — not declared in package.json
      "@sentry/nextjs"
    )

    Sentry.init({
      dsn,
      // Suppress default Next.js instrumentation from double-initialising.
      autoInstrumentServerFunctions: false,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
      environment: process.env.NODE_ENV ?? "development",
    })

    const { registerSink } = await import("@/lib/observability")

    registerSink((event) => {
      if (event.level === "fatal" || event.level === "error") {
        const err = new Error(event.message)
        err.name = event.name ?? "CapturedError"
        if (event.stack) err.stack = event.stack
        Sentry.captureException(err, {
          level: event.level === "fatal" ? "fatal" : "error",
          tags: event.tags ?? {},
          extra: { source: event.source, requestId: event.requestId, time: event.time },
        })
      } else {
        Sentry.captureMessage(event.message, {
          level: event.level === "warning" ? "warning" : "info",
          tags: event.tags ?? {},
          extra: { source: event.source, requestId: event.requestId, time: event.time },
        })
      }
    })

    console.log("[observability] Sentry sink registered.")
  } catch (e) {
    console.warn(
      "[observability] SENTRY_DSN is set but @sentry/nextjs could not be loaded.",
      "Run: npm install @sentry/nextjs",
      e instanceof Error ? e.message : e
    )
  }
}
