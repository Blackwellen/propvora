"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { captureException, newRequestId } from "@/lib/observability"

/**
 * Global error boundary (App Router). Renders a safe, generic message only —
 * never the error message, digest, or stack trace, which could leak internal
 * details. The error is logged to the console for diagnostics during dev.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Structured capture (degrades to console; Sentry-ready). Never surfaced in
    // the UI. A request id correlates this with any related server logs.
    const requestId = newRequestId()
    captureException(error, {
      source: "app-error-boundary",
      requestId,
      tags: {
        digest: error.digest ?? null,
        route:
          typeof window !== "undefined" ? window.location.pathname : null,
      },
    })

    // Best-effort, fire-and-forget bug report. We send only a truncated message
    // and the Next.js digest — never a stack trace. Failures are ignored so the
    // reporter can never trigger a second error.
    try {
      void fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          kind: "error",
          route:
            typeof window !== "undefined" ? window.location.pathname : null,
          message: error.message?.slice(0, 2000),
          digest: error.digest,
          requestId,
        }),
      }).catch(() => {})
    } catch {
      // ignore — reporting is best-effort
    }
  }, [error])

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 sm:p-10">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6">
            <AlertTriangle className="h-7 w-7 text-rose-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-slate-600 leading-relaxed mb-8">
            An unexpected error occurred. You can try again, or head back to your
            dashboard. If this keeps happening, please let us know.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/app"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Need a hand? Email{" "}
          <a
            href="mailto:support@propvora.com"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            support@propvora.com
          </a>
        </p>
      </div>
    </main>
  )
}
