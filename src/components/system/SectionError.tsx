"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { captureException, newRequestId } from "@/lib/observability"

/**
 * Reusable section-scoped error boundary body. Rendered inside an authenticated
 * shell's content slot (not full-screen), so it sits cleanly within the app
 * chrome. Never surfaces the raw error message, digest, or stack trace — only a
 * safe, generic message — while still logging structured diagnostics and firing
 * a best-effort, fire-and-forget bug report.
 */
export default function SectionError({
  error,
  reset,
  source,
}: {
  error: Error & { digest?: string }
  reset: () => void
  /** Identifies which section raised the error, for log correlation. */
  source: string
}) {
  useEffect(() => {
    const requestId = newRequestId()
    captureException(error, {
      source,
      requestId,
      tags: {
        digest: error.digest ?? null,
        route:
          typeof window !== "undefined" ? window.location.pathname : null,
      },
    })

    try {
      void fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          kind: "error",
          source,
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
  }, [error, source])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 sm:p-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50">
            <AlertTriangle className="h-7 w-7 text-rose-600" />
          </div>

          <h1 className="mb-2 text-xl font-bold text-slate-900">
            Something went wrong
          </h1>
          <p className="mb-8 leading-relaxed text-slate-600">
            We hit an unexpected problem loading this part of your workspace. You
            can retry — your data is safe. If it keeps happening, let us know.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Need a hand? Email{" "}
          <a
            href="mailto:support@propvora.com"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            support@propvora.com
          </a>
        </p>
      </div>
    </div>
  )
}
