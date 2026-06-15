"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Thin re-export shim → the global inline-editing system.

   The original portfolio InlineEditField was hover-only (pen invisible on
   mobile/PWA). It now forwards to `@/components/editing/InlineEditField`,
   which is a strict superset of the old prop API and adds an always-visible
   pen + full mobile support. No caller change required.

   Prefer importing from `@/components/editing` directly in new code.
─────────────────────────────────────────────────────────────────────────── */

export {
  InlineEditField,
  default,
  type InlineEditFieldProps,
} from "@/components/editing/InlineEditField"
