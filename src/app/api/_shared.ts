/**
 * Shared server-only helpers for all API route handlers.
 *
 * This file is intentionally kept small — only cross-cutting concerns that
 * every route may need. Domain-specific helpers live in per-domain _shared.ts
 * files (e.g. automations/_shared.ts).
 */
import "server-only"

import { NextResponse } from "next/server"

// ── CSRF protection ───────────────────────────────────────────────────────────
//
// Next.js 13+ App Router already validates the `Origin` header for Server
// Actions, but custom API Route handlers (route.ts) do NOT get that check
// automatically. This helper enforces the same rule for all state-mutating
// routes (POST / PUT / PATCH / DELETE).
//
// How it works:
//   1. If the request has no `Origin` header (e.g. a same-origin GET, or a
//      server-to-server call with a trusted service key) we allow it through —
//      browsers always send Origin on cross-origin mutations, so its absence on
//      a mutation is a red flag only when Origin IS present.
//   2. If `Origin` is present we compare its hostname against the `Host` header.
//      A mismatch means the request originated from a different domain → block.
//
// Callers should call this at the top of every mutating handler:
//
//   const csrf = checkCsrf(request)
//   if (csrf) return csrf
//

export function checkCsrf(request: Request): NextResponse | null {
  const origin = request.headers.get("origin")
  // No Origin header — server-to-server or same-origin GET: allow.
  if (!origin) return null

  const host = request.headers.get("host")
  if (!host) return null

  // Strip port from host for comparison (e.g. "localhost:3000" → "localhost")
  const hostName = host.split(":")[0]

  try {
    const originHost = new URL(origin).hostname
    if (originHost !== hostName) {
      return NextResponse.json(
        { error: "CSRF check failed" },
        { status: 403 }
      )
    }
  } catch {
    // Malformed Origin header — treat as suspicious.
    return NextResponse.json(
      { error: "CSRF check failed — invalid origin" },
      { status: 403 }
    )
  }

  return null
}

// ── Safe HTML stripping ───────────────────────────────────────────────────────
//
// Lightweight XSS defence for any value that comes from user input and will be
// rendered via dangerouslySetInnerHTML. For rich text that MUST preserve
// formatting, sanitise server-side at write time (see AnnouncementBanner,
// changelog) and note the decision in a comment.
//
// Usage:
//   const safeTitle = stripHtml(unsafeTitle)
//

export function stripHtml(html: string): string {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "").trim()
}
