# Sentry — activation steps (error monitoring)

**Status:** code wiring **complete** (FIX-728). Sentry is a graceful no-op until a DSN is set —
errors stay console-only, nothing breaks. Activation is 3 quick steps below.

## What's already wired (no action needed)
- **Server capture** — `src/instrumentation.ts` reads `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`,
  dynamically loads `@sentry/nextjs` (optional), runs `Sentry.init()` and registers an
  observability sink. Every `captureException()` in API routes forwards to Sentry.
- **Client/browser capture** — `src/instrumentation-client.ts` does the same in the browser, so
  client errors (including the root `global-error.tsx` boundary, which already calls
  `captureException`) forward to Sentry too.
- `@sentry/nextjs` is already declared in `next.config.ts` → `serverExternalPackages`.
- DSN placeholders are in `.env.local` (`SENTRY_DSN=`, `NEXT_PUBLIC_SENTRY_DSN=`).
- The dynamic imports use a **variable specifier**, so installing the package later does **not**
  break `tsc`/the build, and not installing it is a clean no-op.

## To activate (≈5 min)
1. **Create a Sentry project** at https://sentry.io → New Project → platform **Next.js**. Copy the
   **DSN** (looks like `https://<key>@o<org>.ingest.sentry.io/<project>`).
2. **Install the SDK** (kept out of `package.json` by design so it's opt-in):
   ```bash
   npm install @sentry/nextjs
   ```
3. **Set the DSN** in `.env.local` (both vars — server + client get the same DSN):
   ```
   SENTRY_DSN=https://...ingest.sentry.io/...
   NEXT_PUBLIC_SENTRY_DSN=https://...ingest.sentry.io/...
   ```
   …and add **both** to **Vercel → Project → Settings → Environment Variables** (Production).
4. Redeploy. On cold start you'll see `[observability] Sentry sink registered.` in the logs;
   trigger a test error and confirm it appears in the Sentry dashboard.

## Optional (better stack traces)
The current setup is **runtime-only** (errors forward, but production stack traces are minified).
For readable stack traces, also upload source maps: wrap `next.config.ts` with
`withSentryConfig(...)` and set a `SENTRY_AUTH_TOKEN`. Not required for basic monitoring.

## Notes
- `tracesSampleRate` is 0.05 in production (5% perf tracing), 0 in dev. Session replay is off.
- No PII is sent — captured events carry a bounded shape (message, source, requestId, tags), never
  raw stack traces from the user-facing error boundary.
