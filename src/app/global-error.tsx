"use client"

import { useEffect } from "react"
import { captureException, newRequestId } from "@/lib/observability"

/**
 * Root-level error boundary. This replaces the entire root layout when a fatal
 * error occurs, so it MUST render its own <html>/<body>. Kept intentionally
 * minimal and dependency-free. Generic copy only — no error details, digest, or
 * stack traces are shown to the user.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Structured capture (degrades to console; Sentry-ready). A request id
    // correlates this fatal with any server logs. No PII/stack is sent anywhere
    // beyond the captured event's bounded shape.
    const requestId = newRequestId()
    captureException(error, {
      source: "global-error",
      requestId,
      tags: {
        digest: error.digest ?? null,
        route:
          typeof window !== "undefined" ? window.location.pathname : null,
      },
    })

    // Best-effort, fire-and-forget bug report. Only a truncated message + the
    // Next.js digest are sent — never a stack trace. Failures are swallowed so
    // the reporter can never trigger another fatal error.
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
          <div
            style={{
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              borderRadius: "1rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              padding: "2.5rem",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 0.5rem",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: "#475569",
                lineHeight: 1.6,
                margin: "0 0 2rem",
              }}
            >
              An unexpected error occurred. Please try again. If the problem
              continues, email support@propvora.com.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
